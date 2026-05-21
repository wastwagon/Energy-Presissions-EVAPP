#!/usr/bin/env bash
# Test production CSMS from the command line (Coolify / cleanmotion).
#
# Usage:
#   ./scripts/test-production-charging.sh EMAIL PASSWORD [CHARGE_POINT_ID] [AMOUNT_GHS]
#
# Example:
#   ./scripts/test-production-charging.sh gilbert.amidu@gmail.com 'your-password' 0900330710111589 25
#
# Requires: curl, python3

set -euo pipefail

API_BASE="${API_BASE:-https://cleanmotion.energyprecisions.com/api}"
PUBLIC_BASE="${PUBLIC_BASE:-https://cleanmotion.energyprecisions.com}"
CHARGE_POINT_ID="${3:-0900330710111589}"
CONNECTOR_ID="${CONNECTOR_ID:-1}"
AMOUNT="${4:-25}"

EMAIL="${1:-}"
PASSWORD="${2:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "Usage: $0 EMAIL PASSWORD [CHARGE_POINT_ID] [AMOUNT_GHS]"
  exit 1
fi

json_get() {
  python3 -c "import sys,json; d=json.load(sys.stdin); print($1)" 2>/dev/null || true
}

section() { echo -e "\n${BLUE}=== $1 ===${NC}"; }
ok() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
fail() { echo -e "${RED}❌ $1${NC}"; exit 1; }

section "1) API health"
HEALTH_CODE=$(curl -s -o /tmp/cm-health.json -w "%{http_code}" "${API_BASE%/api}/health" 2>/dev/null || curl -s -o /tmp/cm-health.json -w "%{http_code}" "${API_BASE}/health" 2>/dev/null || echo "000")
if [[ "$HEALTH_CODE" == "200" ]]; then
  ok "API health HTTP $HEALTH_CODE"
  cat /tmp/cm-health.json | head -c 200; echo
else
  warn "API /health returned HTTP $HEALTH_CODE (trying ${API_BASE}/stations/map next)"
fi

section "2) OCPP WebSocket handshake headers (nginx)"
WS_HEADERS=$(curl -s -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Protocol: ocpp1.6" \
  "${PUBLIC_BASE}/ocpp/${CHARGE_POINT_ID}" 2>&1 | head -20)
echo "$WS_HEADERS"
if echo "$WS_HEADERS" | grep -qi 'Sec-WebSocket-Accept'; then
  ok "Sec-WebSocket-Accept (RFC casing)"
elif echo "$WS_HEADERS" | grep -qi 'Sec-Websocket-Accept'; then
  warn "Still Sec-Websocket-Accept — redeploy frontend (commit 378175d) for strict EVSE firmware"
else
  warn "No WebSocket accept header in response (charger path or proxy may differ)"
fi

section "3) Login"
LOGIN_JSON=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")
TOKEN=$(echo "$LOGIN_JSON" | json_get "d.get('access_token','')")
USER_ID=$(echo "$LOGIN_JSON" | json_get "d.get('user',{}).get('id','')")

if [[ -z "$TOKEN" ]]; then
  echo "$LOGIN_JSON"
  fail "Login failed — check email/password"
fi
ok "Logged in as user id ${USER_ID}"
ID_TAG="USER_${USER_ID}"

section "4) Charge point ${CHARGE_POINT_ID}"
CP_JSON=$(curl -s "${API_BASE}/charge-points/${CHARGE_POINT_ID}" \
  -H "Authorization: Bearer ${TOKEN}")
echo "$CP_JSON" | python3 -m json.tool 2>/dev/null | head -40 || echo "$CP_JSON"
LINK=$(echo "$CP_JSON" | json_get "d.get('linkStatus','')")
STATUS=$(echo "$CP_JSON" | json_get "d.get('status','')")
if [[ "$LINK" == "online" ]]; then
  ok "CSMS link: online"
else
  warn "CSMS link: ${LINK:-unknown} (remote start needs online WebSocket)"
fi

section "5) Wallet balance"
WALLET_JSON=$(curl -s "${API_BASE}/wallet/${USER_ID}/balance" \
  -H "Authorization: Bearer ${TOKEN}" 2>/dev/null || echo '{}')
echo "$WALLET_JSON" | python3 -m json.tool 2>/dev/null || echo "$WALLET_JSON"

section "6) Wallet-start (same as app Start charging)"
START_JSON=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST \
  "${API_BASE}/charge-points/${CHARGE_POINT_ID}/wallet-start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{\"connectorId\":${CONNECTOR_ID},\"userId\":${USER_ID},\"amount\":${AMOUNT}}")
HTTP_CODE=$(echo "$START_JSON" | sed -n 's/^HTTP_CODE://p')
BODY=$(echo "$START_JSON" | sed '/^HTTP_CODE:/d')
echo "HTTP $HTTP_CODE"
echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"

if [[ "$HTTP_CODE" != "200" && "$HTTP_CODE" != "201" ]]; then
  fail "wallet-start failed"
fi
SUCCESS=$(echo "$BODY" | json_get "d.get('success')")
if [[ "$SUCCESS" == "True" || "$SUCCESS" == "true" ]]; then
  ok "wallet-start accepted"
  PENDING=$(echo "$BODY" | json_get "d.get('pendingSession')")
  MSG=$(echo "$BODY" | json_get "d.get('message','')")
  if [[ "$PENDING" == "True" || "$PENDING" == "true" ]]; then
    warn "pendingSession=true — plug cable at charger; session appears after StartTransaction"
    echo "  $MSG"
  else
    TX=$(echo "$BODY" | json_get "d.get('transactionId','')")
    ok "Active transaction id: ${TX}"
  fi
else
  fail "wallet-start returned success=false"
fi

section "7) Active sessions (poll 30s)"
for i in 1 2 3 4 5 6; do
  TX_JSON=$(curl -s "${API_BASE}/transactions?status=Active&userId=${USER_ID}" \
    -H "Authorization: Bearer ${TOKEN}" 2>/dev/null || echo '[]')
  COUNT=$(echo "$TX_JSON" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d) if isinstance(d,list) else len(d.get('data',d.get('items',[]))))" 2>/dev/null || echo 0)
  echo "  attempt $i: active count=$COUNT"
  if [[ "$COUNT" != "0" ]]; then
    echo "$TX_JSON" | python3 -m json.tool 2>/dev/null | head -30
    ok "Session visible in API"
    exit 0
  fi
  sleep 5
done

warn "No active session after 30s — plug in at connector or check csms-api logs for StartTransaction / IdTag"
echo "  Expected id tag after deploy: ${ID_TAG}"
exit 0
