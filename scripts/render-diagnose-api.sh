#!/usr/bin/env bash
# Smoke-test the public API (health, CORS preflight, public GETs).
# Usage:
#   ./scripts/render-diagnose-api.sh
#   API_BASE_URL=https://api.example.com WEB_ORIGIN=https://app.example.com ./scripts/render-diagnose-api.sh
#
# Does not print secrets. Exits 1 if health check is not HTTP 200.

set -u

API="${API_BASE_URL:-https://api.cleanmotion.energyprecisions.com}"
ORIGIN="${WEB_ORIGIN:-https://cleanmotion.energyprecisions.com}"

echo "=============================================="
echo "Render API diagnostics"
echo "  API_BASE_URL=$API"
echo "  WEB_ORIGIN=$ORIGIN"
echo "=============================================="

fail() { echo "[FAIL] $*"; }
ok() { echo "[ OK ] $*"; }

code_for() {
  curl -sS -o /dev/null -w "%{http_code}" --max-time 25 "$@" || echo "000"
}

# 1) Health (must be 200 for a healthy service)
h=$(code_for "$API/api/health")
if [[ "$h" == "200" ]]; then ok "GET /api/health -> $h"; else fail "GET /api/health -> $h (expect 200; 502 = Render/upstream down)"; exit 1; fi

# 2) OPTIONS preflight (browser CORS)
p=$(code_for -X OPTIONS "$API/api/vendor/status" \
  -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization,content-type")
if [[ "$p" == "204" ]] || [[ "$p" == "200" ]]; then ok "OPTIONS /api/vendor/status (preflight) -> $p"; else fail "OPTIONS preflight -> $p (502 = no CORS headers from edge error page)"; fi

# 3) Public reads (no auth)
for path in \
  "/api/stations/nearby?latitude=5.68&longitude=-0.19&radiusKm=50&limit=3" \
  "/api/admin/settings/system/public"
do
  c=$(code_for "$API$path")
  if [[ "$c" == "200" ]]; then ok "GET $path -> $c"; else fail "GET $path -> $c"; fi
done

# 4) Optional: Authorization header (set JWT from your browser localStorage token)
if [[ -n "${API_JWT:-}" ]]; then
  c=$(code_for "$API/api/vendor/status" -H "Origin: $ORIGIN" -H "Authorization: Bearer $API_JWT")
  ok "GET /api/vendor/status (with API_JWT) -> $c"
else
  echo "[SKIP] GET /api/vendor/status (authenticated) — export API_JWT='your_token' to test"
fi

echo "=============================================="
echo "Done. Search Render Logs for: LOG_HTTP_REQUESTS / HTTP lines if enabled on the server."
echo "=============================================="
