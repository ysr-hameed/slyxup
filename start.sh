#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/.logs"
SERVICES=(
  "auth:8000"
  "billing:8001"
  "email:8002"
  "analytics:8003"
  "storage:8004"
  "admin:8005"
)

cmd="${1:-help}"
shift || true

case "$cmd" in
  start)
    scope="${1:-core}"
    shift || true
    mkdir -p "$LOGS"

    for entry in "${SERVICES[@]}"; do
      name="${entry%%:*}"
      port="${entry##*:}"
      dir="$ROOT/services/$name"
      pid=$(lsof -ti :"$port" 2>/dev/null || true)
      if [ -n "$pid" ]; then
        echo "  $name already running (PID $pid)"
        continue
      fi
      if [ ! -d "$dir" ]; then
        echo "  $name directory not found, skipping"
        continue
      fi
      echo "=== $name (:${port}) ==="
      cd "$dir"
      nohup npx wrangler dev --port "$port" > "$LOGS/$name.log" 2>&1 &
      echo $! > "$LOGS/$name.pid"
      sleep 3
    done
    echo "Started all services. Logs in .logs/"
    ;;

  stop)
    for entry in "${SERVICES[@]}"; do
      name="${entry%%:*}"
      pid_file="$LOGS/$name.pid"
      if [ -f "$pid_file" ]; then
        kill "$(cat "$pid_file")" 2>/dev/null || true
        rm "$pid_file"
        echo "Stopped $name"
      fi
    done
    ;;

  status)
    for entry in "${SERVICES[@]}"; do
      name="${entry%%:*}"
      port="${entry##*:}"
      pid=$(lsof -ti :"$port" 2>/dev/null || true)
      if [ -n "$pid" ]; then
        echo "$name: running (PID $pid, port $port)"
      else
        echo "$name: stopped"
      fi
    done
    ;;

  logs)
    name="${1:-auth}"
    tail -f "$LOGS/$name.log"
    ;;

  help|*)
    echo "Usage:"
    echo "  ./start.sh start [core|all]  Start services"
    echo "  ./start.sh stop              Stop all services"
    echo "  ./start.sh status            Show service status"
    echo "  ./start.sh logs [name]       Tail service logs"
    ;;
esac
