# Docker Quick Start Guide
## Get Your Development Environment Running in 5 Minutes

---

## ✅ PREREQUISITES CHECK

Docker Desktop is installed and running on your Mac! ✅

---

## 🚀 QUICK START (3 Steps)

### Step 1: Create Environment File
```bash
cp .env.example .env
# Edit .env with your configuration (optional for now)
```

### Step 2: Start Services
```bash
# Option A: Using the start script (easiest)
./start.sh

# Option B: Using Makefile
make up-dev

# Option C: Using docker-compose directly
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Step 3: Verify Services
```bash
docker-compose ps
```

You should see:
- ✅ `ev-billing-postgres` - Running
- ✅ `ev-billing-redis` - Running
- ⚠️ `ev-billing-api` - Will start when you add backend code
- ⚠️ `ev-billing-frontend` - Will start when you add frontend code

---

## 📍 SERVICE ENDPOINTS

Once services are running:

| Service | URL | Credentials |
|---------|-----|-------------|
| **API** | http://localhost:3000 | - |
| **Frontend** | http://localhost:3001 | - |
| **Database** | localhost:5432 | User: `evbilling` / Pass: `evbilling_password` |
| **Redis** | localhost:6379 | - |
| **pgAdmin** | http://localhost:5050 | Email: `admin@evbilling.com` / Pass: `admin` |
| **Redis Commander** | http://localhost:8081 | - |

---

## 🛠️ USEFUL COMMANDS

### Start/Stop Services
```bash
# Start
make up-dev

# Stop
make down

# Restart
make restart
```

### View Logs
```bash
# All services
make logs

# Specific service
make logs-api
make logs-db
```

### Database Access
```bash
# PostgreSQL shell
make shell-db

# Or using psql directly
docker-compose exec postgres psql -U evbilling -d ev_billing_db
```

### Redis Access
```bash
# Redis CLI
make shell-redis

# Or directly
docker-compose exec redis redis-cli
```

### Development Tools
```bash
# Start pgAdmin and Redis Commander
make tools
```

---

## 📁 PROJECT STRUCTURE

```
EnergyPresissionsEVAP/
├── docker-compose.yml          # Main Docker Compose file
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── .env.example                # Environment variables template
├── Makefile                    # Convenient commands
├── start.sh                    # Interactive start script
│
├── backend/                    # Backend application (to be created)
│   ├── Dockerfile              # Production Dockerfile
│   └── Dockerfile.dev          # Development Dockerfile
│
├── frontend/                   # Frontend application (to be created)
│   └── Dockerfile              # Frontend Dockerfile
│
└── database/
    └── init/
        └── 01-init.sql         # Database initialization script
```

---

## 🔧 WHAT'S INCLUDED

### Services Configured:
1. **PostgreSQL 15** - Primary database
   - Auto-initialized with schema
   - Persistent data storage
   - Health checks enabled

2. **Redis 7** - Cache and queue
   - Persistent data
   - Health checks enabled

3. **Backend API** - Your application (ready for code)
   - Port 3000 (REST API)
   - Port 9000 (OCPP WebSocket)
   - Hot reload in development

4. **Frontend** - React dashboard (ready for code)
   - Port 3001
   - Hot reload in development

5. **pgAdmin** - Database management (optional)
   - Access via web UI
   - Start with: `make tools`

6. **Redis Commander** - Redis management (optional)
   - Access via web UI
   - Start with: `make tools`

---

## 🎯 NEXT STEPS

### 1. Verify Database is Ready
```bash
make shell-db
# Then in psql:
\dt  # List tables
\q   # Exit
```

### 2. Check Database Tables
The database should have these tables:
- `charge_points`
- `connectors`
- `users`
- `id_tags`
- `transactions`
- `meter_values`
- `tariffs`
- `payments`
- `invoices`
- `authorization_cache`

### 3. Start Building Your Application
- Add your backend code to `backend/` directory
- Add your frontend code to `frontend/` directory
- Services will automatically reload on code changes (development mode)

---

## 🐛 TROUBLESHOOTING

### Services Won't Start
```bash
# Check Docker is running
docker ps

# Check logs
docker-compose logs

# Rebuild containers
docker-compose build --no-cache
```

### Port Conflicts
If ports are already in use, edit `docker-compose.yml` to change port mappings:
```yaml
ports:
  - "3002:3000"  # Change first number (host port)
```

### Database Connection Issues
```bash
# Check database is healthy
docker-compose ps postgres

# View database logs
make logs-db

# Restart database
docker-compose restart postgres
```

### Clean Start
```bash
# Remove everything and start fresh
make clean
make up-dev
```

---

## 📚 MORE INFORMATION

- **Full Docker Setup Guide**: See `DOCKER_SETUP.md`
- **Makefile Commands**: Run `make help`
- **Docker Compose Docs**: https://docs.docker.com/compose/

---

## ✅ VERIFICATION CHECKLIST

- [ ] Docker Desktop is running
- [ ] Services started successfully (`make ps`)
- [ ] Database is accessible (`make shell-db`)
- [ ] Redis is accessible (`make shell-redis`)
- [ ] Environment file created (`.env`)
- [ ] Ready to start development!

---

**Ready to code!** 🚀



