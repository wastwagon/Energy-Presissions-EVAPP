#!/usr/bin/env bash
# Remove demo charge points (CP-*) from PostgreSQL. Requires DATABASE_URL.
# Usage:
#   export DATABASE_URL='postgresql://user:pass@host:5432/dbname'
#   ./database/scripts/run-remove-demo-charge-points.sh
# Or from backend/: npm run db:remove-demo-charge-points
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SQL="$ROOT/database/scripts/remove-demo-charge-points.sql"
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Example: export DATABASE_URL='postgresql://…'" >&2
  exit 1
fi
if [[ ! -f "$SQL" ]]; then
  echo "Missing SQL file: $SQL" >&2
  exit 1
fi
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL"
echo "Demo charge point cleanup finished."
