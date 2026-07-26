#!/usr/bin/env bash
set -e

BASE=${1:-"https://api-url.slyxup.online"}
AUTH=${2:-"https://auth.slyxup.online"}
EMAIL="test-$(date +%s)@slyxup.online"

echo "🧪 Testing URL Shortener API ($BASE)"
echo "======================================"

echo -n "1. Register user... "
REG=$(curl -s -X POST "$AUTH/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test123!\",\"name\":\"Tester\"}")
if echo "$REG" | grep -q '"success":true'; then echo "✅"; else echo "❌ $REG"; exit 1; fi

echo -n "2. Login... "
LOGIN=$(curl -s -X POST "$AUTH/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"Test123!\"}")
JWT=$(echo "$LOGIN" | python3 -c "
import sys,json
d=json.load(sys.stdin)
print(d.get('data',{}).get('jwt',''))
" 2>/dev/null)
if [ -n "$JWT" ]; then echo "✅"; else echo "❌ No JWT"; exit 1; fi

echo -n "3. Create short URL... "
CREATE=$(curl -s -X POST "$BASE/api/url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"url":"https://example.com","title":"Test"}')
if echo "$CREATE" | grep -q '"success":true'; then
  SLUG=$(echo "$CREATE" | python3 -c "import sys,json;print(json.load(sys.stdin).get('data',{}).get('slug',''))" 2>/dev/null)
  echo "✅ ($SLUG)"
else echo "❌ $CREATE"; exit 1; fi

echo -n "4. Redirect (302)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/$SLUG")
if [ "$STATUS" = "302" ]; then echo "✅ 302"; else echo "❌ Got $STATUS"; exit 1; fi

echo -n "5. List URLs... "
LIST=$(curl -s "$BASE/api/url" -H "Authorization: Bearer $JWT")
if echo "$LIST" | grep -q '"success":true'; then
  COUNT=$(echo "$LIST" | python3 -c "import sys,json;print(len(json.load(sys.stdin).get('data',[])))" 2>/dev/null)
  echo "✅ ($COUNT URLs)"
else echo "❌"; exit 1; fi

echo -n "6. Invalid URL rejected... "
INVALID=$(curl -s -X POST "$BASE/api/url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"url":"not-a-url"}')
if echo "$INVALID" | grep -q '"error"'; then echo "✅"; else echo "❌"; exit 1; fi

echo -n "7. Custom slug (free) rejected... "
CUSTOM=$(curl -s -X POST "$BASE/api/url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{"url":"https://example.com","slug":"blocked"}')
if echo "$CUSTOM" | grep -q "Custom slugs require"; then echo "✅"; else echo "❌"; exit 1; fi

echo "======================================"
echo "✅ All tests passed!"
