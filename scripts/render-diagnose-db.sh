#!/usr/bin/env bash
# Read-only PostgreSQL checks. Requires psql and DATABASE_URL in the environment.
# Usage:
#   export DATABASE_URL='postgresql://...?sslmode=require'
#   ./scripts/render-diagnose-db.sh
#
# Never commit credentials. Rotate keys if exposed.

set -u

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: Set DATABASE_URL (from Render Postgres or ev-billing-api Environment)." >&2
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not found. Install PostgreSQL client." >&2
  exit 1
fi

echo "=============================================="
echo "PostgreSQL diagnostics (read-only)"
echo "=============================================="

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
\pset pager off
SELECT current_database() AS database, current_user AS role, version() AS pg_version;
SELECT count(*) FILTER (WHERE NOT granted) AS blocking_locks FROM pg_locks;
SELECT count(*) AS connections, state FROM pg_stat_activity WHERE datname = current_database() GROUP BY state ORDER BY state;
SELECT relname, n_live_tup AS est_rows, pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 15;
SQL

echo "=============================================="
echo "Done."
echo "=============================================="
