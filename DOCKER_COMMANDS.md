# Docker Commands - Migrations & Seeding

All services run in Docker. Migrations and seeding are handled automatically.

## Quick Start

```bash
# Start everything (migrations run automatically)
./start-docker.sh

# Fresh start (removes database, runs all init scripts)
./start-docker.sh --fresh
```

## Manual Commands

### Start services
```bash
docker-compose up -d
```

### Run migrations (if needed)
```bash
# Migrations 01-15 run via PostgreSQL init on first container start
# Run 16 and 18 explicitly to ensure schema is complete:
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db \
  -f /docker-entrypoint-initdb.d/16-charge-point-pricing-capacity.sql

docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db \
  -f /docker-entrypoint-initdb.d/18-transaction-wallet-amount.sql
```

### Full migration run (from host with psql)
```bash
export DATABASE_URL="postgresql://evbilling:evbilling_password@localhost:5434/ev_billing_db"
cd database && ./run-migrations.sh $DATABASE_URL
```

### Seeding
Seeding runs automatically when the backend (csms-api) starts. Default users:
- **SuperAdmin:** admin@evcharging.com / admin123
- **Admin:** admin1@vendor1.com / admin123  
- **Customer:** customer1@vendor1.com / customer123

### Stop services
```bash
docker-compose down
```

### Fresh database (remove all data)
```bash
docker-compose down -v
docker-compose up -d
# Wait for PostgreSQL init (runs all database/init/*.sql)
```

## Access URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| API | http://localhost:8080/api |
| Swagger | http://localhost:8080/api/docs |
| MinIO Console | http://localhost:9004 |

## Production Mode (optional)

For production builds (no dev server, no hot reload):

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Note: Production build takes longer. Backend runs migrations on startup via entrypoint.
