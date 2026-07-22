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

FRONTENDS=(
  "web:5173"
  "url-shortener:5174"
)

cmd="${1:-help}"
shift || true

case "$cmd" in
  start)
    mkdir -p "$LOGS"
    echo "=== Backend Services ==="
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

    echo "=== Frontend Apps ==="
    for f in "${FRONTENDS[@]}"; do
      name="${f%%:*}"
      port="${f##*:}"
      dir="$ROOT/apps/$name"
      if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
        cp "$dir/.env.example" "$dir/.env"
        echo "  [$name] created .env from .env.example"
      fi
      pid=$(lsof -ti :$port 2>/dev/null || true)
      if [ -n "$pid" ]; then
        echo "  [$name] already running on :$port (PID $pid)"
      else
        echo "  [$name] starting on :$port..."
        cd "$dir"
        nohup npx vite --port "$port" --host > "$LOGS/$name-web.log" 2>&1 &
        echo $! > "$LOGS/$name-web.pid"
      fi
    done

    echo "=== Waiting for all servers (18s) ==="
    sleep 18
    echo "=== Status ==="
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/api/$name/me" 2>/dev/null || echo "DOWN")
      echo "  $name api     :$port → $code"
    done
    for f in "${FRONTENDS[@]}"; do
      name="${f%%:*}"
      port="${f##*:}"
      code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/" 2>/dev/null || echo "DOWN")
      echo "  $name web     :$port → $code"
    done
    ;;

  stop)
    echo "=== Stopping all ==="
    for s in "${SERVICES[@]}" "${FRONTENDS[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      pids=$(lsof -ti :$port 2>/dev/null || true)
      if [ -n "$pids" ]; then
        echo "  killing on :$port..."
        kill -9 $pids 2>/dev/null || true
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
    echo "=== Backend Services ==="
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      pid=$(lsof -ti :$port 2>/dev/null || true)
      if [ -n "$pid" ]; then
        code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/api/$name/me" 2>/dev/null || echo "?")
        echo "  $name api :$port RUNNING (PID $pid) HTTP $code"
      else
        echo "  $name api :$port STOPPED"
      fi
    done
    echo "=== Frontend Apps ==="
    for f in "${FRONTENDS[@]}"; do
      name="${f%%:*}"
      port="${f##*:}"
      pid=$(lsof -ti :$port 2>/dev/null || true)
      if [ -n "$pid" ]; then
        echo "  $name web :$port RUNNING (PID $pid)"
      else
        echo "  $name web :$port STOPPED"
      fi
    done
    ;;

  migrate)
    cd "$ROOT"
    echo "=== Running migrations ==="
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
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
    echo "=== Drizzle Studio ==="
    echo "  Shared DB: http://localhost:3000"
    cd "$ROOT/packages/shared-db"
    npx drizzle-kit studio --port 3000
    ;;

  studio:urls)
    echo "=== URL Shortener Drizzle Studio ==="
    echo "  URL Shortener DB: http://localhost:3001"
    cd "$ROOT/services/url-shortener"
    npx drizzle-kit studio --port 3001
    ;;

  logs)
    name="${1:-}"
    if [ -z "$name" ]; then
      echo "Usage: $0 logs <name>"
      echo "Services: auth payment admin url-shortener"
      echo "Frontends: web url-shortener-web"
      exit 1
    fi
    f="$LOGS/$name.log"
    [ -f "$f" ] || f="$LOGS/$name-web.log"
    tail -f "$f" 2>/dev/null || echo "No logs for $name"
    ;;

  *)
    echo "Usage: $0 <command>"
    echo ""
    echo "Commands:"
    echo "  start              Start all backends + frontends"
    echo "  stop               Stop everything"
    echo "  restart            Restart everything"
    echo "  status             Show all server statuses"
    echo "  migrate            Run all DB migrations"
    echo "  studio             Drizzle Studio (shared-db) :3000"
    echo "  studio:urls        Drizzle Studio (urls) :3001"
    echo "  logs <name>        Tail logs"
    echo ""
    echo "Backends: auth :8000 | payment :8001 | admin :8002 | urls :8003"
    echo "Frontends: web :5173 | url-shortener :5174"
    ;;
esac
