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
    scope="${1:-core}"
    shift || true
    mkdir -p "$LOGS"

    if [ "$scope" = "core" ] || [ "$scope" = "all" ]; then
      echo "=== Auth Backend (:8000) ==="
      pid=$(lsof -ti :8000 2>/dev/null || true)
      if [ -n "$pid" ]; then echo "  already running (PID $pid)"; else
        cd "$ROOT/services/auth"
        nohup npx wrangler dev --port 8000 --inspector-port 9230 > "$LOGS/auth.log" 2>&1 &
        echo $! > "$LOGS/auth.pid"
        sleep 4
      fi

      echo "=== URL Shortener Backend (:8003) ==="
      pid=$(lsof -ti :8003 2>/dev/null || true)
      if [ -n "$pid" ]; then echo "  already running (PID $pid)"; else
        cd "$ROOT/services/url-shortener"
        nohup npx wrangler dev --port 8003 --inspector-port 9233 > "$LOGS/url-shortener.log" 2>&1 &
        echo $! > "$LOGS/url-shortener.pid"
        sleep 3
      fi

      echo "=== Web Frontend (:5173) ==="
      dir="$ROOT/apps/web"
      if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
        cp "$dir/.env.example" "$dir/.env"
        echo "  created .env from .env.example"
      fi
      pid=$(lsof -ti :5173 2>/dev/null || true)
      if [ -n "$pid" ]; then echo "  already running (PID $pid)"; else
        cd "$dir"
        nohup npx vite --port 5173 --host > "$LOGS/web.log" 2>&1 &
        echo $! > "$LOGS/web.pid"
        sleep 3
      fi

      echo "=== URL Shortener Frontend (:5174) ==="
      dir="$ROOT/apps/url-shortener"
      if [ -f "$dir/.env.example" ] && [ ! -f "$dir/.env" ]; then
        cp "$dir/.env.example" "$dir/.env"
        echo "  created .env from .env.example"
      fi
      pid=$(lsof -ti :5174 2>/dev/null || true)
      if [ -n "$pid" ]; then echo "  already running (PID $pid)"; else
        cd "$dir"
        nohup npx vite --port 5174 --host > "$LOGS/url-shortener-web.log" 2>&1 &
        echo $! > "$LOGS/url-shortener-web.pid"
        sleep 3
      fi
    fi

    if [ "$scope" = "all" ]; then
      echo "=== Payment Backend (:8001) ==="
      pid=$(lsof -ti :8001 2>/dev/null || true)
      if [ -n "$pid" ]; then echo "  already running (PID $pid)"; else
        cd "$ROOT/services/payment"
        nohup npx wrangler dev --port 8001 --inspector-port 9231 > "$LOGS/payment.log" 2>&1 &
        echo $! > "$LOGS/payment.pid"
        sleep 3
      fi

      echo "=== Admin Backend (:8002) ==="
      pid=$(lsof -ti :8002 2>/dev/null || true)
      if [ -n "$pid" ]; then echo "  already running (PID $pid)"; else
        cd "$ROOT/services/admin"
        nohup npx wrangler dev --port 8002 --inspector-port 9232 > "$LOGS/admin.log" 2>&1 &
        echo $! > "$LOGS/admin.pid"
        sleep 3
      fi
    fi

    echo ""
    echo "=== Status ==="
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      path="/api/auth/me"
      [ "$name" = "payment" ] && path="/api/payment/subscription?userId=x&platform=test"
      [ "$name" = "url-shortener" ] && path="/api/urls"
      code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path" 2>/dev/null || echo "DOWN")
      echo "  $name api     :$port → $code"
    done
    for f in "${FRONTENDS[@]}"; do
      name="${f%%:*}"
      port="${f##*:}"
      code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/" 2>/dev/null || echo "DOWN")
      echo "  $name web     :$port → $code"
    done
    echo ""
    echo "All services running in background. Use './start.sh stop' to kill them."
    echo "Use './start.sh logs <name>' to tail logs (e.g. './start.sh logs auth')."
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
    shift || true
    "$0" start "${1:-core}"
    ;;

  status)
    echo "=== Backend Services ==="
    for s in "${SERVICES[@]}"; do
      name="${s%%:*}"
      port="${s##*:}"
      pid=$(lsof -ti :$port 2>/dev/null || true)
      if [ -n "$pid" ]; then
        path="/api/auth/me"
        [ "$name" = "payment" ] && path="/api/payment/subscription?userId=x&platform=test"
        [ "$name" = "url-shortener" ] && path="/api/urls"
        code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path" 2>/dev/null || echo "?")
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
    echo "Usage: $0 <command> [scope]"
    echo ""
    echo "Commands:"
    echo "  start [core|all]   Start services (core=auth+web, all=everything)"
    echo "  stop               Stop everything"
    echo "  restart [core|all] Restart with scope"
    echo "  status             Show all server statuses"
    echo "  migrate            Run all DB migrations"
    echo "  studio             Drizzle Studio (shared-db) :3000"
    echo "  studio:urls        Drizzle Studio (urls) :3001"
    echo "  logs <name>        Tail logs"
    echo ""
    echo "Scopes: core  → auth + url-shortener + both frontends (default)"
    echo "        all   → everything + payment + admin"
    echo ""
    echo "Backends: auth :8000 | payment :8001 | admin :8002 | urls :8003"
    echo "Frontends: web :5173 | url-shortener :5174"
    ;;
esac
