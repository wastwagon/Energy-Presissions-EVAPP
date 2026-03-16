# Energy Presissions EVAP – Restoration Plan

## Overview

This document describes how to restore your EV Charging Billing Software after Docker and database removal, and how to deploy it to Render. It also covers the mobile-first web app direction and WebViewGold publishing.

---

## Part 1: What Existed Before (Pre-Deletion State)

### Docker Services (from `docker-compose.yml`)

| Service | Container Name | Image/Build | Ports | Purpose |
|---------|----------------|-------------|-------|---------|
| **PostgreSQL** | ev-billing-postgres | postgres:15-alpine | 5432 | Database |
| **Redis** | ev-billing-redis | redis:7-alpine | 6379 | Cache & queue |
| **MinIO** | ev-billing-minio | minio/minio:latest | 9002 (API), 9001 (Console) | S3-compatible storage |
| **OCPP Gateway** | ev-billing-ocpp-gateway | Built from ocpp-gateway/ | 9000 | WebSocket server for OCPP 1.6J |
| **CSMS API** | ev-billing-csms-api | Built from backend/ | 3000 | NestJS REST API |
| **Frontend** | ev-billing-frontend | Built from frontend/ | 3001 | React + Vite app |
| **NGINX** | ev-billing-nginx | nginx:alpine | 8080 (HTTP), 8443 (HTTPS) | Reverse proxy |

Optional (with `--profile tools`):

- **pgAdmin** (ev-billing-pgadmin) – port 5050
- **Redis Commander** (ev-billing-redis-commander) – port 8081

### Docker Volumes

- `postgres_data` – PostgreSQL data
- `redis_data` – Redis data
- `minio_data` – MinIO object storage
- `pgadmin_data` – pgAdmin settings

### Database Schema

- **Database**: `ev_billing_db`
- **User**: `evbilling` (default)
- **Password**: `evbilling_password` (default)

Init scripts in `database/init/` (run in order):

1. `00-migration-tracker.sql`
2. `01-init.sql` – Core schema
3. `02-enhanced-schema.sql`
4. `03-pending-commands.sql`
5. `04-paystack-support.sql`
6. `05-wallet-system.sql`
7. `06-advanced-features.sql`
8. `07-vendors.sql`
9. `08-vendor-migration.sql`
10. `09-cms-settings.sql`
11. `10-connection-logs.sql`
12. `11-default-user.sql`
13. `12-vendor-branding.sql`
14. `13-sample-users.sql`
15. `14-ghana-location-enhancements.sql`
16. `15-sample-ghana-stations.sql`
17. `16-charge-point-pricing-capacity.sql`
18. `17-ghana-vendors.sql`
19. `18-transaction-wallet-amount.sql`

### Access URLs (Local)

| Resource | URL |
|----------|-----|
| Frontend (via NGINX) | http://localhost:8080 |
| Frontend (direct) | http://localhost:3001 |
| API (via NGINX) | http://localhost:8080/api |
| API (direct) | http://localhost:3000/api |
| Swagger Docs | http://localhost:8080/api/docs |
| OCPP WebSocket | ws://localhost:8080/ocpp/{chargePointId} |
| MinIO Console | http://localhost:9004 (port 9004 to avoid conflicts) |
| pgAdmin | http://localhost:5050 (with tools profile) |

**Note:** Ports 5434, 6381, 9003, 9004 are used for host bindings to avoid conflicts with other Docker projects.

### Default Users (After Init)

- **SuperAdmin**: admin@evcharging.com / admin123
- **Admin**: admin1@vendor1.com / admin123
- **Customer**: customer1@vendor1.com / customer123

---

## Part 2: Local Restoration Steps

### Prerequisites

- Docker Desktop
- `docker` and `docker-compose` (or `docker compose`) commands
- Ports 8080, 3000, 3001, 5432, 6379, 9000, 9001, 9002 (and optionally 5050, 8081) free

### Step 1: Create `.env` File

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP

# Copy template
cp .env.example .env

# Edit .env and set:
# - POSTGRES_USER=evbilling
# - POSTGRES_PASSWORD=evbilling_password
# - POSTGRES_DB=ev_billing_db
# - MINIO_ROOT_USER=minioadmin
# - MINIO_ROOT_PASSWORD=minioadmin
# - JWT_SECRET=<generate with: openssl rand -base64 32>
# - SERVICE_TOKEN=<generate with: openssl rand -base64 32>
# - PAYSTACK_SECRET_KEY, PAYSTACK_PUBLIC_KEY (optional, from Paystack)
```

### Step 2: Start Docker Services

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 3: Verify Database

PostgreSQL runs init scripts in `database/init/` on first start. To verify:

```bash
docker-compose exec postgres psql -U evbilling -d ev_billing_db -c "\dt"
```

### Step 4: Optional – Run Migrations Manually

If init scripts are missing or you need to re-run migrations:

```bash
# Get DATABASE_URL from docker-compose
export DATABASE_URL="postgresql://evbilling:evbilling_password@localhost:5432/ev_billing_db"
cd database && ./run-migrations.sh $DATABASE_URL
```

### Step 5: Access the Application

- Frontend: http://localhost:8080
- API: http://localhost:8080/api
- Swagger: http://localhost:8080/api/docs

---

## Part 3: Render Blueprint Deployment

### Current `render.yaml` Setup

- **Database**: `ev-billing-postgres` (PostgreSQL 15)
- **Backend**: `ev-billing-api` (NestJS)
- **Frontend**: `ev-billing-frontend` (React + Vite)

Render uses S3 for MinIO (not a local MinIO container).

### Secrets to Set in Render Dashboard

1. **JWT_SECRET** – `openssl rand -base64 32`
2. **SERVICE_TOKEN** – `openssl rand -base64 32`
3. **PAYSTACK_SECRET_KEY** – from Paystack dashboard
4. **PAYSTACK_PUBLIC_KEY** – from Paystack dashboard

### Deployment Steps

1. Push code to GitHub (if not already).
2. Go to [Render Dashboard](https://dashboard.render.com) → New Blueprint.
3. Connect the repository.
4. Select branch (e.g. `main`).
5. Set secrets in the dashboard before applying.
6. Render will create and deploy:
   - PostgreSQL database
   - Backend API
   - Frontend

### Post-Deploy: Database Migrations

1. Create PostgreSQL database in Render dashboard (if not in Blueprint).
2. Copy `DATABASE_URL` from Render.
3. Run migrations in Render Shell or locally:

```bash
# In Render Shell
cd database && ./run-migrations.sh $DATABASE_URL
```

### Environment Variables for Render

- Frontend: `VITE_API_URL`, `VITE_WS_URL` (already in `render.yaml`).
- Backend: `DATABASE_URL`, `JWT_SECRET`, `SERVICE_TOKEN`, `PAYSTACK_*`, etc.

---

## Part 4: Mobile-First Web App & WebViewGold

### Strategy

- Focus on the **web app** as the primary product.
- Keep the **mobile app** codebase for later.
- Use **mobile-first** design for the web app.
- Use **WebViewGold** to wrap the web app for both iOS and Android.

### Mobile-First Checklist for Web App

Your frontend already has the viewport meta tag in `frontend/index.html`. MUI (Material-UI) provides responsive defaults. Additional checks:

1. **Viewport**: ✅ Already set in `frontend/index.html`.
2. **Responsive breakpoints**: Use mobile-first media queries (e.g. `min-width: 768px` etc.).
3. **Touch targets**: Buttons and links at least 44×44px.
4. **Layout**: Single-column on mobile, multi-column on larger screens.
5. **Typography**: Base font size for mobile, scale up on larger screens.
6. **Navigation**: Use a mobile-friendly menu (e.g. hamburger or bottom nav).

The web app uses React + MUI, which supports responsive layouts. When focusing on web-first, ensure all dashboards (Customer, Admin, SuperAdmin) work well on small screens, since WebViewGold will wrap this same UI.

### WebViewGold Setup

1. Build the web app for production (e.g. `npm run build`).
2. Host the built app (e.g. via Render or your own domain).
3. In WebViewGold, configure the app URL to your hosted web app.
4. Publish the WebViewGold project to both iOS and Android.

### Benefits

- One codebase for web and mobile.
- Web app stays the single source of truth.
- Updates are deployed by redeploying the web app.
- WebViewGold handles native wrappers and app store submission.

---

## Part 5: Quick Reference Commands

### Local

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Rebuild
docker-compose build

# Logs
docker-compose logs -f [service-name]

# Shell
docker-compose exec [service-name] sh
```

### Render

```bash
# Generate secrets
./generate-secrets.sh
```

---

## Part 6: Files to Check

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Main Docker Compose config |
| `docker-compose.dev.yml` | Dev overrides |
| `docker-compose.prod.yml` | Prod overrides |
| `render.yaml` | Render Blueprint |
| `.env.example` | Template for `.env` |
| `database/init/*.sql` | DB init scripts |
| `database/run-migrations.sh` | Migration runner |
| `backend/Dockerfile` | Backend image |
| `frontend/Dockerfile.prod` | Frontend image |
| `nginx/conf.d/default.conf` | NGINX routing |

---

## Checklist

### Local Restoration

- [ ] Docker Desktop installed and running
- [ ] `.env` created from `.env.example`
- [ ] `docker-compose up -d` succeeds
- [ ] All services healthy (`docker-compose ps`)
- [ ] Frontend accessible at http://localhost:8080
- [ ] API accessible at http://localhost:8080/api
- [ ] Database tables exist and default users work

### Render Deployment

- [ ] GitHub repository connected
- [ ] Secrets set in Render dashboard
- [ ] Blueprint deployed
- [ ] Database migrations run
- [ ] Frontend and API URLs verified

### Mobile-First & WebViewGold

- [ ] Web app responsive and mobile-first
- [ ] Web app deployed and accessible
- [ ] WebViewGold URL configured
- [ ] iOS and Android apps built from WebViewGold
