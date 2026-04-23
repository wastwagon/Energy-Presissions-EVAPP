#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
ATTEMPTS=0
MAX_ATTEMPTS="${DB_WAIT_MAX_ATTEMPTS:-60}"
if [ -n "$DATABASE_URL" ]; then
  # Render/production: use DATABASE_URL directly
  until psql "$DATABASE_URL" -c '\q' 2>/dev/null; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
      echo "PostgreSQL did not become ready after ${MAX_ATTEMPTS} attempts"
      exit 1
    fi
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
  done
else
  # Docker Compose: use postgres host
  until PGPASSWORD="${POSTGRES_PASSWORD:-evbilling_password}" psql -h "postgres" -p "5432" -U "${POSTGRES_USER:-evbilling}" -d "${POSTGRES_DB:-ev_billing_db}" -c '\q' 2>/dev/null; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
      echo "PostgreSQL did not become ready after ${MAX_ATTEMPTS} attempts"
      exit 1
    fi
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
  done
fi
echo "PostgreSQL is ready!"

# Run database migrations when enabled (default: true)
if [ "${MIGRATIONS_AUTO_RUN:-true}" = "true" ]; then
  echo "Running database migrations..."
  if [ -n "$DATABASE_URL" ]; then
    MIGRATE_URL="$DATABASE_URL"
  else
    MIGRATE_URL="postgresql://${POSTGRES_USER:-evbilling}:${POSTGRES_PASSWORD:-evbilling_password}@postgres:5432/${POSTGRES_DB:-ev_billing_db}"
  fi
  if [ -f /app/database/run-migrations.sh ]; then
    (cd /app/database && sh run-migrations.sh "$MIGRATE_URL")
  fi
else
  echo "Skipping migrations (MIGRATIONS_AUTO_RUN=${MIGRATIONS_AUTO_RUN})"
fi

# Start the application (use absolute path - cwd may have changed)
echo "Starting application..."
exec node /app/dist/main.js
