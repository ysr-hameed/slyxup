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

cmd="${1:-help}"
shift || true

show_urls() {
  local header="$1"
  shift
  printf "\n╔═══════════════════════════════════════════════╗\n"
  printf "║  %-43s  ║\n" "$header"
  printf "║───────────────────────────────────────────────║\n"
  for entry in "$@"; do
    local name="${entry%%:*}"
    local rest="${entry#*:}"
    local port="${rest%%:*}"
    local running=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$running" ]; then
      printf "║  \033[32m✓\033[0m  %-20s → http://localhost:%-5s  ║\n" "$name" "$port"
    else
      printf "║  \033[31m✗\033[0m  %-20s http://localhost:%-5s  ║\n" "$name" "$port"
    fi
  done
  printf "╚═══════════════════════════════════════════════╝\n"
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
  pid=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    echo "  $name already running (PID $pid, port $port)"
    return
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

  # Wait up to 15s for the port to be ready
  for i in $(seq 1 15); do
    if lsof -ti :"$port" >/dev/null 2>&1; then
      sleep 1
      break
    fi
    sleep 1
  done
}

stop_by_port() {
  local port="$1"
  local pid=$(lsof -ti :"$port" 2>/dev/null || true)
  if [ -n "$pid" ]; then
    kill "$pid" 2>/dev/null || true
    echo "  Stopped process on port $port (PID $pid)"
  fi
}

ALL_ENTRIES=("${SERVICES[@]}" "${PRODUCTS[@]}")

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

    for entry in "${SERVICES[@]}" "${PRODUCTS[@]}"; do
      name="${entry%%:*}"
      if [ "$scope" = "$name" ]; then
        start_entry "$entry"
      fi
    done

    show_urls "Running Services" "${ALL_ENTRIES[@]}"
    echo "Logs: ./start.sh logs <name>"
    ;;

  stop)
    scope="${1:-all}"
    shift || true

    if [ "$scope" = "all" ]; then
      for entry in "${ALL_ENTRIES[@]}"; do
        name="${entry%%:*}"
        rest="${entry#*:}"
        port="${rest%%:*}"
        stop_by_port "$port"
        rm -f "$LOGS/$name.pid"
      done
      pkill -f "wrangler dev" 2>/dev/null || true
      pkill -f "vite" 2>/dev/null || true
      echo "All services stopped"
    else
      for entry in "${ALL_ENTRIES[@]}"; do
        name="${entry%%:*}"
        rest="${entry#*:}"
        port="${rest%%:*}"
        if [ "$scope" = "$name" ] || [ "$scope" = "$port" ]; then
          stop_by_port "$port"
          rm -f "$LOGS/$name.pid"
        fi
      done
    fi
    ;;

  status)
    show_urls "Service Status" "${ALL_ENTRIES[@]}"
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

  help|*)
    echo "Usage: ./start.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  start [scope]    Start services"
    echo "    Scopes:"
    echo "      core               Platform (auth:8000 → notification:8006)"
    echo "      product            Products (url-shortener:9000, web:5173)"
    echo "      all                Both core + products"
    echo "      <name>             Start by name (auth-service, url-shortener, url-shortener-web)"
    echo ""
    echo "  stop [scope]     Stop services"
    echo "    Scopes: all, <name>, or <port>"
    echo ""
    echo "  status           Show running services with URLs"
    echo "  logs [name]      Tail logs (default: auth)"
    echo ""
    echo "Examples:"
    echo "  ./start.sh start core              # Platform services"
    echo "  ./start.sh start all               # Everything"
    echo "  ./start.sh start url-shortener-web # Frontend only"
    echo "  ./start.sh status                  # Show URLs + status"
    echo "  ./start.sh stop 5173               # Stop frontend"
    echo "  ./start.sh stop all                # Stop everything"
    ;;
esac
