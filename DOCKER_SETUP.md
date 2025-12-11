# Docker Setup Guide
## EV Charging Billing Software

---

## PREREQUISITES

- Docker Desktop installed and running on Mac
- Docker Compose (included with Docker Desktop)
- At least 4GB of available RAM
- At least 10GB of available disk space

---

## QUICK START

### 1. Check Docker is Running
```bash
docker ps
```

### 2. Start All Services
```bash
# Development mode
make up-dev

# OR using docker-compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 3. Check Services Status
```bash
make ps
# OR
docker-compose ps
```

### 4. View Logs
```bash
make logs
# OR view specific service
make logs-api
```

---

## SERVICES

### Core Services

1. **PostgreSQL Database** (Port 5432)
   - Database: `ev_billing_db`
   - User: `evbilling`
   - Password: `evbilling_password`
   - Access: `localhost:5432`

2. **Redis Cache** (Port 6379)
   - Used for caching and queues
   - Access: `localhost:6379`

3. **Backend API** (Port 3000)
   - REST API: `http://localhost:3000`
   - OCPP WebSocket: `ws://localhost:9000`

4. **Frontend Dashboard** (Port 3001)
   - Web UI: `http://localhost:3001`

### Optional Tools (Development)

5. **pgAdmin** (Port 5050)
   - Database management UI
   - Email: `admin@evbilling.com`
   - Password: `admin`
   - Access: `http://localhost:5050`

6. **Redis Commander** (Port 8081)
   - Redis management UI
   - Access: `http://localhost:8081`

To start tools:
```bash
make tools
```

---

## USEFUL COMMANDS

### Using Makefile (Recommended)

```bash
# Start services
make up-dev          # Development mode
make up-prod         # Production mode

# Stop services
make down

# View logs
make logs            # All services
make logs-api        # API only
make logs-db         # Database only

# Database operations
make shell-db        # PostgreSQL shell
make db-backup       # Backup database
make db-reset        # Reset database (WARNING: deletes data)

# Container shells
make shell-api       # API container shell
make shell-redis     # Redis CLI

# Maintenance
make clean           # Remove all containers and volumes
make ps              # Show running containers
```

### Using Docker Compose Directly

```bash
# Start services
docker-compose up -d

# Start with development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Execute commands in containers
docker-compose exec api npm install
docker-compose exec postgres psql -U evbilling -d ev_billing_db
```

---

## ENVIRONMENT CONFIGURATION

### 1. Create Environment File
```bash
cp .env.example .env
```

### 2. Edit `.env` File
Update the following critical values:
- `JWT_SECRET` - Change to a secure random string
- `JWT_REFRESH_SECRET` - Change to a secure random string
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `DATABASE_URL` - Update if using different credentials
- `REDIS_URL` - Update if using different credentials

### 3. Restart Services
```bash
make restart
```

---

## DATABASE SETUP

### Initial Setup
The database is automatically initialized when the PostgreSQL container is first created. The initialization script (`database/init/01-init.sql`) will:
- Create all tables
- Create indexes
- Set up triggers
- Insert default tariff

### Access Database

**Using psql:**
```bash
make shell-db
```

**Using pgAdmin:**
1. Start tools: `make tools`
2. Open http://localhost:5050
3. Login with: `admin@evbilling.com` / `admin`
4. Add server:
   - Host: `postgres` (container name)
   - Port: `5432`
   - Database: `ev_billing_db`
   - Username: `evbilling`
   - Password: `evbilling_password`

**Using connection string:**
```
postgresql://evbilling:evbilling_password@localhost:5432/ev_billing_db
```

### Database Backup
```bash
make db-backup
```

### Database Restore
```bash
make db-restore FILE=backup_20240115_120000.sql
```

---

## DEVELOPMENT WORKFLOW

### 1. Start Development Environment
```bash
make up-dev
```

### 2. Install Dependencies (if needed)
```bash
make install
```

### 3. Run Migrations
```bash
make migrate
```

### 4. Seed Sample Data (optional)
```bash
make seed
```

### 5. Access Services
- API: http://localhost:3000
- Frontend: http://localhost:3001
- Database: localhost:5432
- Redis: localhost:6379

### 6. View Logs
```bash
make logs-api
```

### 7. Make Changes
- Code changes are automatically reflected (volume mounts)
- Restart services if needed: `make restart`

---

## TROUBLESHOOTING

### Port Already in Use
If you get "port already in use" errors:

```bash
# Check what's using the port
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Stop the conflicting service or change ports in docker-compose.yml
```

### Database Connection Issues
```bash
# Check if database is running
make ps

# Check database logs
make logs-db

# Restart database
docker-compose restart postgres
```

### Container Won't Start
```bash
# Check logs
docker-compose logs api

# Rebuild containers
make build

# Clean and restart
make clean
make up-dev
```

### Permission Issues (Mac)
```bash
# Ensure Docker Desktop has proper permissions
# Check Docker Desktop > Settings > Resources > File Sharing
# Make sure your project directory is shared
```

### Out of Memory
```bash
# Check Docker Desktop memory allocation
# Docker Desktop > Settings > Resources > Memory
# Increase to at least 4GB
```

---

## PRODUCTION DEPLOYMENT

### 1. Update Environment Variables
```bash
# Edit .env file with production values
# Use strong secrets
# Update database credentials
# Configure production payment gateway keys
```

### 2. Build Production Images
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
```

### 3. Start Production Services
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### 4. Set Up SSL/TLS
- Use reverse proxy (nginx, Traefik)
- Configure SSL certificates
- Update CORS settings

### 5. Set Up Backups
- Configure automated database backups
- Set up volume backups
- Test restore procedures

---

## VOLUME MANAGEMENT

### View Volumes
```bash
docker volume ls
```

### Remove Volumes (WARNING: Deletes Data)
```bash
make clean
# OR
docker-compose down -v
```

### Backup Volumes
```bash
# Database backup
make db-backup

# Volume backup (example)
docker run --rm -v ev-billing_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

---

## NETWORKING

### Services Communication
- Services communicate using service names (e.g., `postgres`, `redis`)
- Internal network: `ev-billing-network`
- External access via published ports

### Access from Host
- API: `http://localhost:3000`
- Frontend: `http://localhost:3001`
- Database: `localhost:5432`
- Redis: `localhost:6379`

### Access from Containers
- Database: `postgres:5432`
- Redis: `redis:6379`
- API: `api:3000`

---

## MONITORING

### Container Health
```bash
docker-compose ps
```

### Resource Usage
```bash
docker stats
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api
```

---

## SECURITY NOTES

### Development
- Default passwords are used (change in production)
- Services exposed on localhost only
- No SSL/TLS required

### Production
- ✅ Change all default passwords
- ✅ Use strong JWT secrets
- ✅ Enable SSL/TLS
- ✅ Use secrets management
- ✅ Restrict network access
- ✅ Regular security updates
- ✅ Database encryption
- ✅ Secure payment gateway keys

---

## NEXT STEPS

1. ✅ Docker is set up and running
2. ⬜ Start services: `make up-dev`
3. ⬜ Configure environment: Edit `.env` file
4. ⬜ Access services and verify they're running
5. ⬜ Set up your application code in `backend/` and `frontend/` directories
6. ⬜ Begin development!

---

**Last Updated**: 2024



