#!/bin/bash
# Start full EV Billing stack in Docker (migrations + seeding handled automatically)
# Usage: ./start-docker.sh [--fresh]
# --fresh: Remove volumes for clean database (runs all init scripts)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Use unique project name to avoid container conflicts
export COMPOSE_PROJECT_NAME=evbilling

FRESH=false
if [ "$1" = "--fresh" ]; then
  FRESH=true
  echo "Fresh start: will remove existing volumes"
fi

echo "=========================================="
echo "EV Billing - Docker Stack"
echo "=========================================="
echo ""

# Check Docker
if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker is not running. Please start Docker Desktop first."
  exit 1
fi

# Stop and remove existing containers
echo "Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true
for c in ev-billing-postgres ev-billing-redis ev-billing-minio ev-billing-csms-api ev-billing-ocpp-gateway ev-billing-frontend ev-billing-nginx; do
  docker rm -f $c 2>/dev/null || true
done

if [ "$FRESH" = true ]; then
  echo "Removing volumes for fresh database..."
  docker-compose down -v 2>/dev/null || true
  echo "PostgreSQL will run all init scripts from database/init/ on first start"
fi

# Start services (--force-recreate to resolve any container name conflicts)
echo ""
echo "Starting Docker services..."
docker-compose up -d --force-recreate

# Wait for PostgreSQL
echo ""
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec ev-billing-postgres pg_isready -U evbilling -d ev_billing_db 2>/dev/null; then
    echo "PostgreSQL is ready!"
    break
  fi
  echo -n "."
  sleep 2
done
echo ""

# Run migrations (ensures schema is complete - idempotent)
echo ""
echo "Applying migrations..."
PG_CONTAINER=$(docker ps -q -f name=ev-billing-postgres | head -1)
if [ -n "$PG_CONTAINER" ]; then
  docker exec $PG_CONTAINER psql -U evbilling -d ev_billing_db -c "
    ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_reserved_amount DECIMAL(10, 2) NULL;
    ALTER TABLE charge_points ADD COLUMN IF NOT EXISTS total_capacity_kw DECIMAL(10, 2) NULL;
    ALTER TABLE charge_points ADD COLUMN IF NOT EXISTS price_per_kwh DECIMAL(10, 4) NULL;
    ALTER TABLE charge_points ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'GHS' NULL;
  " 2>/dev/null || true
  docker exec $PG_CONTAINER psql -U evbilling -d ev_billing_db -f /docker-entrypoint-initdb.d/16-charge-point-pricing-capacity.sql 2>/dev/null || true
  docker exec $PG_CONTAINER psql -U evbilling -d ev_billing_db -f /docker-entrypoint-initdb.d/18-transaction-wallet-amount.sql 2>/dev/null || true
fi
echo "  Done."

# Wait for backend (runs seeding on startup)
echo ""
echo "Waiting for backend (runs seeding)..."
for i in {1..60}; do
  if curl -s http://localhost:8080/api/health >/dev/null 2>&1; then
    echo "Backend is ready!"
    break
  fi
  echo -n "."
  sleep 2
done
echo ""

# Final status
echo ""
echo "=========================================="
echo "Services Status"
echo "=========================================="
docker-compose ps

echo ""
echo "=========================================="
echo "Access URLs"
echo "=========================================="
echo "  Frontend:    http://localhost:8080"
echo "  API:         http://localhost:8080/api"
echo "  Swagger:     http://localhost:8080/api/docs"
echo "  MinIO:       http://localhost:9004"
echo ""
echo "Default logins:"
echo "  SuperAdmin: admin@evcharging.com / admin123"
echo "  Admin:      admin1@vendor1.com / admin123"
echo "  Customer:   customer1@vendor1.com / customer123"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop:      docker-compose down"
echo ""
