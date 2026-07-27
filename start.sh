#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/.logs"

SERVICES=(
  "auth-service:8000:platform/auth-service"
  "billing-service:8001:platform/billing-service"
  "email-service:8002:platform/email-service"
  "analytics-service:8003:platform/analytics-service"
  "storage-service:8004:platform/storage-service"
  "admin-service:8005:platform/admin-service"
  "notification-service:8006:platform/notification-service"
)

PRODUCTS=(
  "url-shortener:9000:products/url-shortener/apps/api"
  "url-shortener-web:5173:products/url-shortener/apps/web:vite"
)

ALL_ENTRIES=("${SERVICES[@]}" "${PRODUCTS[@]}")

declare -A DEPS
DEPS[auth-service]="email-service"
DEPS[url-shortener]="auth-service"
DEPS[url-shortener-web]="auth-service billing-service email-service analytics-service storage-service admin-service notification-service url-shortener"

declare -A REQ_VARS
REQ_VARS[auth-service]="JWT_SECRET ENVIRONMENT API_KEY EMAIL_SERVICE_URL"
REQ_VARS[billing-service]="ENVIRONMENT"
REQ_VARS[email-service]="BREVO_API_KEY FROM_EMAIL SUPPORT_EMAIL ENVIRONMENT API_KEY"
REQ_VARS[analytics-service]="ENVIRONMENT"
REQ_VARS[storage-service]="ENVIRONMENT"
REQ_VARS[admin-service]="ENVIRONMENT"
REQ_VARS[notification-service]="ENVIRONMENT"
REQ_VARS[url-shortener]="JWT_SECRET ENVIRONMENT API_KEY AUTH_SERVICE_URL BILLING_SERVICE_URL ANALYTICS_SERVICE_URL"

declare -A DB
DB[auth-service]="slyxup-auth"
DB[billing-service]="slyxup-billing"
DB[analytics-service]="slyxup-analytics"
DB[admin-service]="slyxup-admin"
DB[notification-service]="slyxup-notification"
DB[url-shortener]="slyxup-url-shortener"

# ── Helpers ──

box() { printf "║  %-47s  ║\n" "$*"; }

get_entry() {
  for entry in "${ALL_ENTRIES[@]}"; do
    if [ "${entry%%:*}" = "$1" ]; then echo "$entry"; return 0; fi
  done
  return 1
}

get_port() {
  local e r; e=$(get_entry "$1") || return 1; r="${e#*:}"; echo "${r%%:*}"
}

get_dir() {
  local e r r2; e=$(get_entry "$1") || return 1; r="${e#*:}"; r2="${r#*:}"; echo "${r2%%:*}"
}

get_runner() {
  local e r r2 rnr; e=$(get_entry "$1") || return 1; r="${e#*:}"; r2="${r#*:}"; rnr="${r2##*:}"
  [ "$rnr" = "${r2%%:*}" ] && echo "wrangler" || echo "$rnr"
}

get_pid()    { lsof -ti :"$1" 2>/dev/null | tr '\n' ' ' || true; }
cli_pids()   { pgrep -f "cli.js dev.*--port $1" 2>/dev/null || true; }
workerd_pids() { pgrep -f "workerd.*localhost:$1" 2>/dev/null || true; }

kill_port() {
  local port="$1" name="$2"
  kill $(get_pid "$port") $(cli_pids "$port") $(workerd_pids "$port") 2>/dev/null || true
  sleep 1
  kill -9 $(get_pid "$port") $(cli_pids "$port") $(workerd_pids "$port") 2>/dev/null || true
  rm -f "$LOGS/$name.pid" 2>/dev/null || true
}

wait_health() {
  local port="$1" name="$2" max="${3:-30}" i
  for i in $(seq 1 "$max"); do
    if curl -sf "http://localhost:$port/health" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  return 1
}

get_level() {
  local name="$1" max_dep=0 dep_level dep
  for dep in ${DEPS[$name]:-}; do
    dep_level=$(get_level "$dep")
    [ "$dep_level" -ge "$max_dep" ] && max_dep=$((dep_level + 1))
  done
  echo "$max_dep"
}

assign_levels() {
  local name
  for name in "$@"; do get_level "$name"; done
}

resolve_deps() {
  local name="$1" result="$2" dep
  for dep in ${DEPS[$name]:-}; do
    if [[ " $result " != *" $dep "* ]]; then
      result="$result $dep"
      result="$(resolve_deps "$dep" "$result")"
    fi
  done
  echo "$result"
}

status_icon() {
  local port="$1" name="$2" pid elapsed started diff healthy
  pid=$(get_pid "$port")
  if [ -n "$pid" ]; then
    elapsed="?"
    if [ -f "$LOGS/$name.pid" ]; then
      started=$(stat -c %Y "$LOGS/$name.pid" 2>/dev/null || echo 0)
      diff=$(($(date +%s) - started))
      if [ "$diff" -lt 60 ]; then elapsed="${diff}s"
      elif [ "$diff" -lt 3600 ]; then elapsed="$((diff / 60))m"
      else elapsed="$((diff / 3600))h"
      fi
    fi
    healthy="?"
    curl -sf "http://localhost:$port/health" >/dev/null 2>&1 && healthy="ok"
    printf "\033[32m✓\033[0m  \033[1m%-20s\033[0m \033[90mhttp://localhost:%-5s\033[0m  \033[90mPID %-6s\033[0m  \033[90m%-4s\033[0m  \033[90m(%s)\033[0m" "$name" "$port" "$pid" "$healthy" "$elapsed"
  else
    printf "\033[31m✗\033[0m  %-20s \033[90mhttp://localhost:%-5s\033[0m" "$name" "$port"
  fi
}

show_status() {
  local header="$1" entry name rest port
  shift
  printf "╔══════════════════════════════════════════════════════════════════════════════╗\n"
  box "$header"
  printf "╠══════════════════════════════════════════════════════════════════════════════╣\n"
  for entry in "$@"; do
    name="${entry%%:*}"
    rest="${entry#*:}"
    port="${rest%%:*}"
    printf "║  "
    status_icon "$port" "$name"
    printf "  ║\n"
  done
  printf "╚══════════════════════════════════════════════════════════════════════════════╝\n"
}

start_entry() {
  local name="$1" port dir runner pid orphans wd full
  port=$(get_port "$name")
  dir=$(get_dir "$name")
  runner=$(get_runner "$name")

  pid=$(get_pid "$port")
  [ -n "$pid" ] && echo "  $name already running (PID $pid)" && return 0

  orphans=$(cli_pids "$port" 2>/dev/null || true)
  wd=$(workerd_pids "$port" 2>/dev/null || true)
  if [ -n "$orphans" ] || [ -n "$wd" ]; then
    kill $orphans $wd 2>/dev/null || true; sleep 1
    orphans=$(cli_pids "$port" 2>/dev/null || true)
    wd=$(workerd_pids "$port" 2>/dev/null || true)
    [ -n "$orphans" ] || [ -n "$wd" ] && kill -9 $orphans $wd 2>/dev/null || true
    sleep 1
  fi

  full="$ROOT/$dir"
  [ ! -d "$full" ] && echo "  $name directory not found, skipping" && return 1

  mkdir -p "$LOGS"
  echo "  Starting $name (:${port})..."
  cd "$full"
  if [ "$runner" = "vite" ]; then
    nohup npx vite --port "$port" --host > "$LOGS/$name.log" 2>&1 &
  else
    nohup npx wrangler dev --port "$port" > "$LOGS/$name.log" 2>&1 &
  fi
  echo $! > "$LOGS/$name.pid"
}

start_wave() {
  local name port pid failed
  for name in "$@"; do
    port=$(get_port "$name")
    pid=$(get_pid "$port") || true
    [ -z "$pid" ] && start_entry "$name"
  done
  failed=0
  for name in "$@"; do
    port=$(get_port "$name")
    echo "  Waiting for $name..."
    if wait_health "$port" "$name" 30; then
      echo "  ✓ $name healthy"
    else
      echo "  ✗ $name FAILED"
      [ -f "$LOGS/$name.log" ] && echo "  --- last 15 lines ---" && tail -15 "$LOGS/$name.log" | sed 's/^/    /'
      failed=1
    fi
  done
  return $failed
}

stop_entry() {
  local name="$1" port
  port=$(get_port "$name")
  kill_port "$port" "$name"
  echo "  Stopped $name"
}

stop_all() {
  local entry name rest port
  for entry in "${ALL_ENTRIES[@]}"; do
    name="${entry%%:*}"
    rest="${entry#*:}"
    port="${rest%%:*}"
    kill_port "$port" "$name"
  done
  pkill -f "workerd.*serve" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  sleep 1
  pkill -9 -f "workerd.*serve" 2>/dev/null || true
  pkill -9 -f "vite" 2>/dev/null || true
  echo "All services stopped"
}

cmd="${1:-help}"
shift || true

case "$cmd" in
  start)
    scope="${1:-core}"
    shift || true

    case "$scope" in
      core|all)
        names=()
        for entry in "${SERVICES[@]}"; do names+=("${entry%%:*}"); done
        [ "$scope" = "all" ] && for entry in "${PRODUCTS[@]}"; do names+=("${entry%%:*}"); done

        declare -A lvls
        max_lvl=0
        for name in "${names[@]}"; do
          lvls[$name]=$(get_level "$name")
          [ "${lvls[$name]}" -gt "$max_lvl" ] && max_lvl=${lvls[$name]}
        done

        failed=0
        for lvl in $(seq 0 "$max_lvl"); do
          wave=()
          for name in "${names[@]}"; do
            [ "${lvls[$name]}" -eq "$lvl" ] && wave+=("$name")
          done
          [ "${#wave[@]}" -eq 0 ] && continue
          echo ""
          echo "── Level $lvl ──"
          start_wave "${wave[@]}" || failed=1
        done
        echo ""
        show_status "Service Status" "${ALL_ENTRIES[@]}"
        [ "$failed" -eq 1 ] && echo "⚠ Some services failed to start. Check logs above." && exit 1
        ;;
      *)
        deps=$(resolve_deps "$scope" "")
        order=()
        for d in $deps; do order+=("$d"); done
        order+=("$scope")

        failed=0
        for name in "${order[@]}"; do
          port=$(get_port "$name")
          pid=$(get_pid "$port") || true
          [ -n "$pid" ] && echo "  $name already running" && continue
          start_entry "$name"
          echo "  Waiting for $name..."
          wait_health "$port" "$name" 30 && echo "  ✓ $name healthy" || { echo "  ✗ $name FAILED"; failed=1; }
        done
        echo ""
        show_status "Running Services" "${ALL_ENTRIES[@]}"
        [ "$failed" -eq 1 ] && echo "⚠ Some services failed" && exit 1
        ;;
    esac
    ;;

  stop)
    scope="${1:-all}"
    shift || true
    if [ "$scope" = "all" ]; then
      stop_all
    else
      for entry in "${ALL_ENTRIES[@]}"; do
        name="${entry%%:*}"
        rest="${entry#*:}"
        port="${rest%%:*}"
        if [ "$scope" = "$name" ] || [ "$scope" = "$port" ]; then
          stop_entry "$name"
        fi
      done
    fi
    ;;

  restart)
    scope="${1:-all}"
    shift || true
    echo "=== Restarting $scope ==="
    if [ "$scope" = "all" ]; then
      stop_all
      sleep 1
      "$0" start all
    else
      port=$(get_port "$scope" 2>/dev/null) || port="$scope"
      name=""
      for entry in "${ALL_ENTRIES[@]}"; do
        n="${entry%%:*}"; r="${entry#*:}"; p="${r%%:*}"
        [ "$scope" = "$n" ] || [ "$scope" = "$p" ] && name="$n"
      done
      [ -z "$name" ] && echo "Unknown service: $scope" && exit 1
      stop_entry "$name"
      sleep 1
      "$0" start "$name"
    fi
    ;;

  status)
    echo ""
    if ls "$LOGS"/*.pid >/dev/null 2>&1; then
      show_status "Service Status" "${ALL_ENTRIES[@]}"
    else
      show_status "All Services Stopped" "${ALL_ENTRIES[@]}"
    fi
    ;;

  logs)
    name="${1:-auth}"
    logfile="$LOGS/$name.log"
    if [ ! -f "$logfile" ]; then
      echo "No log for '$name'. Available:"
      ls "$LOGS/" 2>/dev/null || echo "  (none)"
      exit 1
    fi
    tail -f "$logfile"
    ;;

  check)
    echo "=== Pre-flight Checks ==="
    errors=0

    echo ""
    echo "── .dev.vars ──"
    for entry in "${SERVICES[@]}"; do
      name="${entry%%:*}"; dir=$(get_dir "$name")
      vars="$ROOT/$dir/.dev.vars"
      if [ ! -f "$vars" ]; then
        echo "  ✗ $name: missing .dev.vars"
        errors=1
      else
        echo "  ✓ $name: .dev.vars exists"
      fi
    done
    for entry in "${PRODUCTS[@]}"; do
      name="${entry%%:*}"; dir=$(get_dir "$name")
      [ "$name" = "url-shortener-web" ] && continue
      vars="$ROOT/$dir/.dev.vars"
      if [ ! -f "$vars" ]; then
        echo "  ✗ $name: missing .dev.vars"
        errors=1
      else
        echo "  ✓ $name: .dev.vars exists"
      fi
    done

    echo ""
    echo "── Required env vars ──"
    for service in "${!REQ_VARS[@]}"; do
      dir=$(get_dir "$service" 2>/dev/null) || continue
      vars="$ROOT/$dir/.dev.vars"
      [ ! -f "$vars" ] && continue
      missing=()
      for var in ${REQ_VARS[$service]}; do
        grep -q "^${var}=" "$vars" 2>/dev/null || missing+=("$var")
      done
      if [ "${#missing[@]}" -gt 0 ]; then
        echo "  ✗ $service: missing ${missing[*]}"
        errors=1
      else
        echo "  ✓ $service: all vars present"
      fi
    done

    echo ""
    echo "── Port conflicts ──"
    for entry in "${ALL_ENTRIES[@]}"; do
      name="${entry%%:*}"; rest="${entry#*:}"; port="${rest%%:*}"
      pid=$(get_pid "$port")
      if [ -n "$pid" ]; then
        proc=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
        echo "  ? $name: port $port in use by PID $pid ($proc)"
      else
        echo "  ✓ $name: port $port free"
      fi
    done

    echo ""
    echo "── DB migrations ──"
    for service in "${!DB[@]}"; do
      dir=$(get_dir "$service" 2>/dev/null) || continue
      mig_dir="$ROOT/$dir/migrations"
      if [ -d "$mig_dir" ]; then
        count=$(ls "$mig_dir"/*.sql 2>/dev/null | wc -l)
        echo "  ✓ $service ($count migration files)"
      else
        echo "  - $service: no migrations directory (might not need one)"
      fi
    done

    echo ""
    if [ "$errors" -eq 1 ]; then
      echo "⚠ Issues found"
      exit 1
    else
      echo "✅ All checks passed"
    fi
    ;;

  cleanup)
    echo "=== Force-killing all wrangler, workerd, and vite processes ==="
    pkill -9 -f "workerd" 2>/dev/null || true
    pkill -9 -f "wrangler" 2>/dev/null || true
    pkill -9 -f "vite" 2>/dev/null || true
    rm -f "$LOGS"/*.pid 2>/dev/null || true
    sleep 1
    echo "Done"
    ;;

  help|*)
    echo "Usage: ./start.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  start [scope]    Start services (dependency-aware, health-checked)"
    echo "    Scopes:"
    echo "      core               Platform services only (auth → notification)"
    echo "      all                Core + products"
    echo "      <name>             Service + its deps (e.g., auth, url-shortener)"
    echo ""
    echo "  stop [scope]     Stop services (all, name, or port)"
    echo "  restart [scope]  Stop + start"
    echo "  status           Show running services (port, PID, health, uptime)"
    echo "  logs [name]      Tail logs (default: auth-service)"
    echo "  cleanup          Force-kill all wrangler/vite/workerd processes"
    echo "  check            Validate .dev.vars, ports, migrations"
    echo ""
    echo "Examples:"
    echo "  ./start.sh start core              # Start all platform services"
    echo "  ./start.sh start url-shortener     # Start auth → url-shortener"
    echo "  ./start.sh start auth              # Start email → auth"
    echo "  ./start.sh start all               # Every service"
    echo "  ./start.sh check                   # Pre-flight check"
    echo "  ./start.sh status                  # Show health dashboard"
    echo "  ./start.sh logs auth-service       # Watch auth logs"
    ;;
esac
