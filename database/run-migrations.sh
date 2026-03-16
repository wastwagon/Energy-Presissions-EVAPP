#!/bin/bash
# Database Migration Runner
# This script runs all database migrations in order
# Usage: ./run-migrations.sh [database_url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get database URL from argument or environment variable
DATABASE_URL=${1:-${DATABASE_URL}}

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL not provided${NC}"
    echo "Usage: $0 [database_url]"
    echo "Or set DATABASE_URL environment variable"
    exit 1
fi

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

# Migration files in order
MIGRATIONS=(
    "01-init.sql"
    "02-enhanced-schema.sql"
    "03-pending-commands.sql"
    "04-paystack-support.sql"
    "05-wallet-system.sql"
    "06-advanced-features.sql"
    "07-vendors.sql"
    "08-vendor-migration.sql"
    "09-cms-settings.sql"
    "10-connection-logs.sql"
    "11-default-user.sql"
    "12-vendor-branding.sql"
    "13-sample-users.sql"
    "14-ghana-location-enhancements.sql"
    "15-sample-ghana-stations.sql"
    "16-charge-point-pricing-capacity.sql"
    "17-ghana-vendors.sql"
    "18-transaction-wallet-amount.sql"
)

MIGRATION_DIR="$(dirname "$0")/init"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Migration Runner${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "User: $DB_USER"
echo ""
echo -e "${YELLOW}Running migrations...${NC}"
echo ""

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
until PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
    echo "Database is unavailable - sleeping"
    sleep 1
done
echo -e "${GREEN}Database is ready!${NC}"
echo ""

# Run each migration
for migration in "${MIGRATIONS[@]}"; do
    migration_file="$MIGRATION_DIR/$migration"
    
    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}Error: Migration file not found: $migration_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Running: $migration${NC}"
    
    if PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $migration completed${NC}"
    else
        echo -e "${RED}❌ $migration failed${NC}"
        echo "Running with verbose output:"
        PGPASSWORD=$DB_PASS psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Default users created:"
echo "  - SuperAdmin: admin@evcharging.com / admin123"
echo "  - Admin: admin1@vendor1.com / admin123"
echo "  - Customer: customer1@vendor1.com / customer123"
echo ""

