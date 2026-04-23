#!/bin/sh
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

# Migration files in order (POSIX sh - no arrays)
MIGRATION_DIR="$(dirname "$0")/init"
MIGRATION_FILES_BASE="00-migration-tracker.sql 01-init.sql 02-enhanced-schema.sql 03-pending-commands.sql 04-paystack-support.sql 05-wallet-system.sql 06-advanced-features.sql 07-vendors.sql 08-vendor-migration.sql 09-cms-settings.sql 10-connection-logs.sql 12-vendor-branding.sql 14-ghana-location-enhancements.sql 16-charge-point-pricing-capacity.sql 17-ghana-vendors.sql 18-transaction-wallet-amount.sql 19-user-favorites.sql 20-payment-methods.sql 21-audit-logs.sql 22-users-phone-unique.sql 23-password-reset.sql 24-blocked-charge-point-ids.sql"
MIGRATION_FILES_SAMPLE_DATA="11-default-user.sql 13-sample-users.sql 15-sample-ghana-stations.sql"
INCLUDE_SAMPLE_DATA=${INCLUDE_SAMPLE_DATA:-false}
NODE_ENV=${NODE_ENV:-}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Migration Runner${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Running migrations...${NC}"
echo ""

# Wait for database to be ready (use DATABASE_URL directly - works with Render @host/db format)
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
ATTEMPTS=0
MAX_ATTEMPTS=${DB_WAIT_MAX_ATTEMPTS:-60}
until psql "$DATABASE_URL" -c '\q' 2>/dev/null; do
    ATTEMPTS=$((ATTEMPTS + 1))
    if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
        echo -e "${RED}Database did not become ready after ${MAX_ATTEMPTS} attempts${NC}"
        exit 1
    fi
    echo "Database is unavailable - sleeping"
    sleep 1
done
echo -e "${GREEN}Database is ready!${NC}"
echo ""

# Build final migration list.
MIGRATION_FILES="$MIGRATION_FILES_BASE"
if [ "$NODE_ENV" = "production" ] && [ "$INCLUDE_SAMPLE_DATA" = "true" ]; then
    echo -e "${RED}Refusing to run sample/demo seed data in production${NC}"
    exit 1
fi

if [ "$INCLUDE_SAMPLE_DATA" = "true" ]; then
    MIGRATION_FILES="$MIGRATION_FILES $MIGRATION_FILES_SAMPLE_DATA"
fi

# Run each migration (use DATABASE_URL directly - no parsing needed)
for migration in $MIGRATION_FILES; do
    migration_file="$MIGRATION_DIR/$migration"
    
    if [ ! -f "$migration_file" ]; then
        echo -e "${RED}Error: Migration file not found: $migration_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Running: $migration${NC}"
    
    if psql "$DATABASE_URL" -f "$migration_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $migration completed${NC}"
    else
        echo -e "${RED}❌ $migration failed${NC}"
        echo "Running with verbose output:"
        psql "$DATABASE_URL" -f "$migration_file"
        exit 1
    fi
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ All migrations completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
if [ "$INCLUDE_SAMPLE_DATA" = "true" ]; then
    echo "Default users created:"
    echo "  - SuperAdmin: admin@evcharging.com / admin123"
    echo "  - Admin: admin1@vendor1.com / admin123"
    echo "  - Customer: customer1@vendor1.com / customer123"
else
    echo "SQL sample stations/customers skipped (INCLUDE_SAMPLE_DATA=false)."
    echo "Bootstrap staff (SuperAdmin, vendor admins, walk-in) is handled by the API on startup unless SEED_BOOTSTRAP_USERS=false."
fi
echo ""

