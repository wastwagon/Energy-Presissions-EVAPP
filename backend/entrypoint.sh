#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
if [ -n "$DATABASE_URL" ]; then
  # Render/production: use DATABASE_URL directly
  until psql "$DATABASE_URL" -c '\q' 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
  done
else
  # Docker Compose: use postgres host
  until PGPASSWORD="${POSTGRES_PASSWORD:-evbilling_password}" psql -h "postgres" -p "5432" -U "${POSTGRES_USER:-evbilling}" -d "${POSTGRES_DB:-ev_billing_db}" -c '\q' 2>/dev/null; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
  done
fi
echo "PostgreSQL is ready!"

# Run database migrations (use DATABASE_URL if set, else build from components)
echo "Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
  MIGRATE_URL="$DATABASE_URL"
else
  MIGRATE_URL="postgresql://${POSTGRES_USER:-evbilling}:${POSTGRES_PASSWORD:-evbilling_password}@postgres:5432/${POSTGRES_DB:-ev_billing_db}"
fi
if [ -f /app/database/run-migrations.sh ]; then
  cd /app/database && sh run-migrations.sh "$MIGRATE_URL" || true
else
  echo "Migration script not found, skipping..."
fi

# Start the application
echo "Starting application..."
exec node dist/main.js
