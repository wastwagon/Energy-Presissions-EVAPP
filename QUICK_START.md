# Quick Start Guide
## EV Charging Billing Software - Getting Started

This guide will help you get the entire system up and running on your local machine.

---

## Prerequisites

- **Docker Desktop** installed and running
- **Docker Compose** (included with Docker Desktop)
- **Git** (optional, for version control)
- **Node.js 18+** (optional, for local development without Docker)

---

## Step 1: Verify Docker is Running

```bash
docker --version
docker-compose --version
```

Make sure Docker Desktop is running on your Mac.

---

## Step 2: Start All Services

From the project root directory:

```bash
# Start all services
docker-compose up -d

# Or use the Makefile
make up
```

This will start:
- PostgreSQL database
- Redis cache
- MinIO object storage
- CSMS API (NestJS REST API + embedded OCPP WebSocket)
- Frontend (React app)
- NGINX reverse proxy

---

## Step 3: Wait for Services to Start

Services may take 1-2 minutes to fully start. Check status:

```bash
docker-compose ps
```

All services should show "Up" status.

---

## Step 4: Access the Application

### Frontend Dashboards

**Direct Access:**
- **Home/Customer Portal**: http://localhost:3001
- **Operations Dashboard**: http://localhost:3001/ops
- **Admin Dashboard**: http://localhost:3001/admin
- **Public Station Finder**: http://localhost:3001/stations

**Via NGINX (Port 8080):**
- **Home/Customer Portal**: http://localhost:8080
- **Operations Dashboard**: http://localhost:8080/ops
- **Admin Dashboard**: http://localhost:8080/admin
- **Public Station Finder**: http://localhost:8080/stations

### API Endpoints

**Direct Access:**
- **REST API**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

**Via NGINX:**
- **REST API**: http://localhost:8080/api
- **Swagger Documentation**: http://localhost:8080/api/docs
- **Health Check**: http://localhost:8080/health (Note: health is at /health, not /api/health)

### OCPP WebSocket

- **Direct Access**: `ws://localhost:3000/ocpp/{chargePointId}`
- **Via NGINX**: `ws://localhost:8080/ocpp/{chargePointId}`

### Development Tools

- **pgAdmin** (Database GUI): http://localhost:5050 (start with `docker-compose --profile tools up -d`)
  - Email: `admin@evbilling.com`
  - Password: `admin`
- **MinIO Console**: http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`
- **Redis Commander**: http://localhost:8081 (start with `docker-compose --profile tools up -d`)

---

## Step 5: View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f csms-api | grep -i ocpp
docker-compose logs -f csms-api
docker-compose logs -f frontend
docker-compose logs -f postgres
```

---

## Step 6: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Or use Makefile
make down
```

---

## Environment Variables

Create a `.env` file in the project root (optional):

```env
# Database
POSTGRES_USER=evbilling
POSTGRES_PASSWORD=evbilling_password
POSTGRES_DB=ev_billing_db

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin

# Service Authentication
SERVICE_TOKEN=your-service-token-change-in-production
JWT_SECRET=your_jwt_secret_change_in_production

# Payment Gateway (optional)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
```

---

## Troubleshooting

### Services Won't Start

1. **Check Docker is running**:
   ```bash
   docker ps
   ```

2. **Check port conflicts**:
   - Port 80, 3000, 3001, 5432, 6379, 9001, 5050, 8081 should be available

3. **View error logs**:
   ```bash
   docker-compose logs [service-name]
   ```

### Database Connection Issues

1. **Check PostgreSQL is healthy**:
   ```bash
   docker-compose exec postgres pg_isready -U evbilling
   ```

2. **Check database exists**:
   ```bash
   docker-compose exec postgres psql -U evbilling -d ev_billing_db -c "\dt"
   ```

### Frontend Not Loading

1. **Check NGINX is running**:
   ```bash
   docker-compose logs nginx
   ```

2. **Check frontend service**:
   ```bash
   docker-compose logs frontend
   ```

3. **Access frontend directly** (bypass NGINX):
   - http://localhost:3001

### OCPP Endpoint Not Accepting Connections

1. **Check OCPP logs**:
   ```bash
   docker-compose logs csms-api | grep -i ocpp
   ```

2. **Test WebSocket connection**:
   ```bash
   # Using wscat (install: npm install -g wscat)
   wscat -c ws://localhost:3000/ocpp/CP001
   ```

---

## Development Workflow

### Hot Reload

All services support hot reload in development mode:
- **CSMS API + OCPP**: Changes in `backend/src/` are automatically reloaded
- **Frontend**: Changes in `frontend/src/` are automatically reloaded

### Making Changes

1. Edit files in the respective service directories
2. Changes are automatically detected and services restart
3. Check logs to see if changes are applied

### Database Migrations

The database schema is automatically initialized on first start. For manual migrations:

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U evbilling -d ev_billing_db

# Or use pgAdmin at http://localhost:5050
```

---

## Next Steps

1. **Test OCPP Connection**: Use an OCPP simulator or real hardware
2. **Create Test Data**: Add charge points, users, and IdTags
3. **Test Transactions**: Simulate charging sessions
4. **Explore Dashboards**: Navigate through all frontend pages

---

## Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart [service-name]

# View logs
docker-compose logs -f [service-name]

# Access service shell
docker-compose exec [service-name] sh

# Rebuild services
docker-compose build

# Clean everything (WARNING: deletes all data)
docker-compose down -v
docker system prune -a
```

---

## Support

For issues or questions:
1. Check the logs: `docker-compose logs -f`
2. Review the documentation in the project
3. Check service health: `docker-compose ps`

---

**You're all set! The system is ready for development and testing.** 🚀

