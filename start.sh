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

cmd="${1:-help}"
shift || true

box() { printf "║  %-47s  ║\n" "$*"; }

get_pid() {
  lsof -ti :"$1" 2>/dev/null || true
}

wrangler_pids() {
  local port="$1"
  pgrep -f "cli.js dev.*--port $port" 2>/dev/null || true
}

workerd_pids() {
  local port="$1"
  pgrep -f "workerd.*localhost:$port" 2>/dev/null || true
}

kill_all_on_port() {
  local port="$1"
  local name="$2"

  local pids
  pids="$(get_pid "$port")"
  local w_pids
  w_pids="$(wrangler_pids "$port" 2>/dev/null || true)"
  local wd_pids
  wd_pids="$(workerd_pids "$port" 2>/dev/null || true)"

  kill $pids $w_pids $wd_pids 2>/dev/null || true
  sleep 1

  pids="$(get_pid "$port")"
  w_pids="$(wrangler_pids "$port" 2>/dev/null || true)"
  wd_pids="$(workerd_pids "$port" 2>/dev/null || true)"
  kill -9 $pids $w_pids $wd_pids 2>/dev/null || true

  rm -f "$LOGS/$name.pid" 2>/dev/null || true
}

status_icon() {
  local port="$1"
  local pid
  pid=$(get_pid "$port")
  if [ -n "$pid" ]; then
    local elapsed
    if [ -f "$LOGS/$2.pid" ]; then
      local started
      started=$(stat -c %Y "$LOGS/$2.pid" 2>/dev/null || echo 0)
      local now
      now=$(date +%s)
      local diff=$((now - started))
      if [ $diff -lt 60 ]; then
        elapsed="${diff}s"
      elif [ $diff -lt 3600 ]; then
        elapsed="$((diff / 60))m"
      else
        elapsed="$((diff / 3600))h"
      fi
    else
      elapsed="?"
    fi
    printf "\033[32m✓\033[0m  \033[1m%-20s\033[0m \033[90mhttp://localhost:%-5s\033[0m  \033[90mPID %-6s\033[0m \033[90m(up %s)\033[0m" "$2" "$port" "$pid" "$elapsed"
  else
    printf "\033[31m✗\033[0m  %-20s \033[90mhttp://localhost:%-5s\033[0m  \033[90m%-14s\033[0m" "$2" "$port" "stopped"
  fi
}

show_status() {
  local header="$1"
  shift
  printf "╔═══════════════════════════════════════════════════════════════════════╗\n"
  box "$header"
  printf "╠═══════════════════════════════════════════════════════════════════════╣\n"
  for entry in "$@"; do
    local name="${entry%%:*}"
    local rest="${entry#*:}"
    local port="${rest%%:*}"
    printf "║  "
    status_icon "$port" "$name"
    printf "  ║\n"
  done
  printf "╚═══════════════════════════════════════════════════════════════════════╝\n"
}

start_entry() {
  local entry="$1"
  local name="${entry%%:*}"
  local rest="${entry#*:}"
  local port="${rest%%:*}"
  local rest2="${rest#*:}"
  local dir="${rest2%%:*}"
  local runner="${rest2##*:}"
  if [ "$runner" = "$dir" ]; then runner="wrangler"; fi

  mkdir -p "$LOGS"

  pid=$(get_pid "$port")
  if [ -n "$pid" ]; then
    echo "  $name already running (PID $pid, port $port)"
    return
  fi

  local orphans
  orphans="$(wrangler_pids "$port" 2>/dev/null || true)"
  local work_orphans
  work_orphans="$(workerd_pids "$port" 2>/dev/null || true)"
  if [ -n "$orphans" ] || [ -n "$work_orphans" ]; then
    kill $orphans $work_orphans 2>/dev/null || true
    sleep 1
    orphans="$(wrangler_pids "$port" 2>/dev/null || true)"
    work_orphans="$(workerd_pids "$port" 2>/dev/null || true)"
    if [ -n "$orphans" ] || [ -n "$work_orphans" ]; then
      kill -9 $orphans $work_orphans 2>/dev/null || true
      sleep 1
    fi
  fi

  full="$ROOT/$dir"
  if [ ! -d "$full" ]; then
    echo "  $name directory not found, skipping"
    return
  fi

  echo "=== $name (:${port}) ==="
  cd "$full"
  if [ "$runner" = "vite" ]; then
    nohup npx vite --port "$port" --host > "$LOGS/$name.log" 2>&1 &
  else
    nohup npx wrangler dev --port "$port" > "$LOGS/$name.log" 2>&1 &
  fi
  echo $! > "$LOGS/$name.pid"

  for i in $(seq 1 15); do
    if get_pid "$port" >/dev/null 2>&1; then
      sleep 1
      break
    fi
    sleep 1
  done
}

stop_by_port() {
  local port="$1"
  local name="$2"
  kill_all_on_port "$port" "$name"
  echo "  Stopped $name (port $port)"
}

stop_all() {
  for entry in "${ALL_ENTRIES[@]}"; do
    local name="${entry%%:*}"
    local rest="${entry#*:}"
    local port="${rest%%:*}"
    kill_all_on_port "$port" "$name"
  done

  pkill -f "workerd.*serve" 2>/dev/null || true
  pkill -f "vite" 2>/dev/null || true
  sleep 1
  pkill -9 -f "workerd.*serve" 2>/dev/null || true
  pkill -9 -f "vite" 2>/dev/null || true

  echo "All services stopped"
}

case "$cmd" in
  start)
    scope="${1:-core}"
    shift || true
    mkdir -p "$LOGS"

    case "$scope" in
      core|all)
        for entry in "${SERVICES[@]}"; do start_entry "$entry"; done
        ;;
    esac

    case "$scope" in
      product|products|all)
        for entry in "${PRODUCTS[@]}"; do start_entry "$entry"; done
        ;;
    esac

    for entry in "${ALL_ENTRIES[@]}"; do
      name="${entry%%:*}"
      if [ "$scope" = "$name" ]; then
        start_entry "$entry"
      fi
    done

    echo ""
    show_status "Running Services" "${ALL_ENTRIES[@]}"
    echo "Logs: ./start.sh logs <name>"
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
          stop_by_port "$port" "$name"
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
      for entry in "${SERVICES[@]}"; do start_entry "$entry"; done
      for entry in "${PRODUCTS[@]}"; do start_entry "$entry"; done
    else
      for entry in "${ALL_ENTRIES[@]}"; do
        name="${entry%%:*}"
        rest="${entry#*:}"
        port="${rest%%:*}"
        if [ "$scope" = "$name" ] || [ "$scope" = "$port" ]; then
          stop_by_port "$port" "$name"
          sleep 1
          start_entry "$entry"
        fi
      done
    fi
    echo ""
    show_status "Restarted Services" "${ALL_ENTRIES[@]}"
    ;;

  status)
    echo ""
    if [ -n "$(ls "$LOGS"/*.pid 2>/dev/null)" ]; then
      show_status "Service Status" "${ALL_ENTRIES[@]}"
    else
      show_status "All Services Stopped" "${ALL_ENTRIES[@]}"
    fi
    ;;

  logs)
    name="${1:-auth}"
    logfile="$LOGS/$name.log"
    if [ ! -f "$logfile" ]; then
      echo "No log file for '$name'. Available:"
      ls "$LOGS/" 2>/dev/null || echo "  (no logs yet)"
      exit 1
    fi
    tail -f "$logfile"
    ;;

  cleanup)
    echo "=== Force-cleaning all wrangler, workerd, and vite processes ==="
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
    echo "  start [scope]    Start services"
    echo "    Scopes:"
    echo "      core               Platform (auth:8000 → notification:8006)"
    echo "      product            Products (url-shortener:9000, web:5173)"
    echo "      all                Both core + products"
    echo "      <name>             Start by name (e.g. auth-service, url-shortener)"
    echo ""
    echo "  stop [scope]     Stop services"
    echo "    Scopes: all, <name>, or <port>"
    echo ""
    echo "  restart [scope]  Stop then start again"
    echo "    Scopes: all (default), <name>, or <port>"
    echo ""
    echo "  status           Show running services (port, PID, uptime)"
    echo "  cleanup          Force-kill all wrangler/vite processes (zombie cleanup)"
    echo "  logs [name]      Tail logs (default: auth)"
    echo ""
    echo "Examples:"
    echo "  ./start.sh start core              # Platform services"
    echo "  ./start.sh start all               # Everything"
    echo "  ./start.sh start url-shortener-web # Frontend only"
    echo "  ./start.sh status                  # Show URLs + status"
    echo "  ./start.sh restart billing-service # Restart billing"
    echo "  ./start.sh restart all             # Restart everything"
    echo "  ./start.sh stop 5173               # Stop frontend"
    ;;

esac
