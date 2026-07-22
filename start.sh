#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/.logs"

INSPECTOR_BASE="${INSPECTOR_BASE:-9230}"

SERVICES=(
  "auth:8000"
  "payment:8001"
  "admin:8002"
  "url-shortener:8003"
)

cmd="${1:-help}"
shift || true

case "$cmd" in
  start)
    mkdir -p "$LOGS"
    echo "=== Starting all services ==="
    idx=0
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      pid=$(lsof -ti :$port 2>/dev/null || true)
      if [ -n "$pid" ]; then
        echo "  [$name] already running on :$port (PID $pid)"
      else
        echo "  [$name] starting on :$port..."
        cd "$ROOT/services/$name"
        insp=$((INSPECTOR_BASE + idx))
        nohup npx wrangler dev --port "$port" --inspector-port "$insp" > "$LOGS/$name.log" 2>&1 &
        echo $! > "$LOGS/$name.pid"
        idx=$((idx + 1))
      fi
    done
    echo "=== Waiting for services (15s) ==="
    sleep 15
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/api/$name/me" 2>/dev/null || echo "000")
      echo "  [$name] :$port → $code"
    done
    ;;
  stop)
    echo "=== Stopping all services ==="
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      pids=$(lsof -ti :$port 2>/dev/null || true)
      if [ -n "$pids" ]; then
        echo "  [$name] killing on :$port..."
        kill -9 $pids 2>/dev/null || true
      else
        echo "  [$name] not running"
      fi
    done
    rm -f "$LOGS"/*.pid
    echo "=== Done ==="
    ;;
  restart)
    "$0" stop
    sleep 2
    "$0" start
    ;;
  status)
    echo "=== Service Status ==="
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      pid=$(lsof -ti :$port 2>/dev/null || true)
      if [ -n "$pid" ]; then
        code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/api/$name/me" 2>/dev/null || echo "?")
        echo "  [$name] RUNNING :$port (PID $pid) HTTP $code"
      else
        echo "  [$name] STOPPED :$port"
      fi
    done
    ;;
  migrate)
    cd "$ROOT"
    echo "=== Running migrations ==="
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      if [ -d "$ROOT/services/$name/migrations" ]; then
        echo "  [$name] applying..."
        cd "$ROOT/services/$name"
        npx wrangler d1 migrations apply "slyxup-$name" --local 2>&1 | tail -2
      fi
    done
    cd "$ROOT"
    echo "=== Done ==="
    ;;
  studio)
    echo "=== Starting Drizzle Studio ==="
    cd "$ROOT/packages/shared-db"
    npx drizzle-kit studio --port 3000
    ;;
  logs)
    name="${1:-}"
    if [ -z "$name" ]; then
      echo "Usage: $0 logs <service-name>"
      echo "Services: auth payment admin url-shortener"
      exit 1
    fi
    tail -f "$LOGS/$name.log" 2>/dev/null || echo "No logs for $name"
    ;;
  *)
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start          Start all services"
    echo "  stop           Stop all services"
    echo "  restart        Restart all services"
    echo "  status         Show service status"
    echo "  migrate        Run all migrations"
    echo "  studio         Start Drizzle Studio on :3000"
    echo "  logs <name>    Tail logs (auth/payment/admin/url-shortener)"
    ;;
esac
