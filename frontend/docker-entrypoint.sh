#!/bin/sh
set -e
# Public API base URL (scheme + host, no path) — set at container runtime. Browser uses same origin /api and /ws.
: "${API_ORIGIN:=https://api.cleanmotion.energyprecisions.com}"
sed "s|__API_ORIGIN__|${API_ORIGIN}|g" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf
exec nginx -g "daemon off;"
