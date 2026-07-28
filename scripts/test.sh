#!/usr/bin/env bash
set -e

COOKIE_JAR=$(mktemp)
BASE="http://localhost:8787"

TS=$(date +%s)
EMAIL="test-${TS}@demo.com"
SLUG="test-app-${TS}"

cleanup() {
  rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

echo "╔════════════════════════════════════════╗"
echo "║        SlyxAuth Test Suite            ║"
echo "╚════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0

check() {
  local label="$1" expected="$2" actual="$3"
  if echo "$actual" | grep -q "$expected"; then
    echo "  ✓ $label"
    ((PASS++))
  else
    echo "  ✗ $label (expected: $expected)"
    echo "    got: $(echo "$actual" | head -c 200)"
    ((FAIL++))
  fi
}

# 1. Health
echo "─── 1. Health Check ─────────────────────"
R1=$(curl -s "$BASE/api/health")
check "Service health" "ok" "$R1"

# 2. Sign Up
echo "─── 2. Sign Up ──────────────────────────"
R2=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/sign-up/email" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"Demo123!\",\"name\":\"Test User\"}")
check "User created" "Test User" "$R2"

# 3. Sign In
echo "─── 3. Sign In ──────────────────────────"
R3=$(curl -s -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/sign-in/email" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"Demo123!\"}")
check "Sign in" "token" "$R3"

# 4. Get Session
echo "─── 4. Get Session ──────────────────────"
R4=$(curl -s -b "$COOKIE_JAR" "$BASE/api/auth/get-session")
check "Session valid" "$EMAIL" "$R4"

# 5. Create Application
echo "─── 5. Create Application ───────────────"
R5=$(curl -s -b "$COOKIE_JAR" \
  -X POST "$BASE/api/applications" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test App\",\"slug\":\"${SLUG}\",\"domain\":\"https://${SLUG}.com\"}")
check "App created" "$SLUG" "$R5"

# 6. List Applications
echo "─── 6. List Applications ────────────────"
R6=$(curl -s -b "$COOKIE_JAR" "$BASE/api/applications")
check "App listed" "$SLUG" "$R6"

# 7. Sign Out
echo "─── 7. Sign Out ─────────────────────────"
R7=$(curl -s -b "$COOKIE_JAR" \
  -X POST "$BASE/api/auth/sign-out" \
  -H "Content-Type: application/json" \
  -d '{}')
check "Signed out" "success" "$R7"

# 8. Verify Session Invalidated
echo "─── 8. Session Invalidated ──────────────"
R8=$(curl -s -b "$COOKIE_JAR" "$BASE/api/auth/get-session")
check "No session" "null" "$R8"

echo ""
echo "╔════════════════════════════════════════╗"
if [ "$FAIL" -eq 0 ]; then
  echo "║   All ${PASS}/${PASS} Tests Passed ✓         ║"
else
  echo "║   ${PASS} passed, ${FAIL} failed ✗          ║"
fi
echo "╚════════════════════════════════════════╝"
exit "$FAIL"