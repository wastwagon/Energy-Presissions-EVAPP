# Deployment Checklist - Complete Setup

## ✅ Pre-Deployment Verification

### Database Migrations
- [x] All 14 migration files exist in `database/init/`
- [x] Migrations are ordered (00-13)
- [x] Migration runner script created (`database/run-migrations.sh`)
- [x] Default user passwords fixed

### Backend
- [x] All 23 modules implemented
- [x] All entities created
- [x] Seed service configured (creates default users)
- [x] API endpoints documented
- [x] Dockerfile configured

### Frontend
- [x] All 28 pages created
- [x] Authentication flows complete
- [x] Admin, SuperAdmin, Customer, Operations dashboards
- [x] Production Dockerfile configured

### Configuration
- [x] `render.yaml` configured for all services
- [x] `docker-compose.yml` configured
- [x] Environment variables documented
- [x] Health checks configured

---

## 📋 Deployment Steps

### Step 1: Push to GitHub
1. Open GitHub Desktop
2. Add repository: `/Users/OceanCyber/Downloads/EnergyPresissionsEVAP`
3. Commit all files
4. Push to: `wastwagon/Energy-Presissions-EVAPP`

### Step 2: Deploy to Render
1. Go to https://dashboard.render.com
2. Create new Blueprint
3. Connect GitHub repository
4. Render will auto-detect `render.yaml`

### Step 3: Configure Environment Variables

**Backend API (`ev-billing-api`):**
```bash
JWT_SECRET=<generate with: openssl rand -base64 32>
SERVICE_TOKEN=<generate with: openssl rand -base64 32>
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=<strong-password>
PAYSTACK_SECRET_KEY=<from-paystack-dashboard>
PAYSTACK_PUBLIC_KEY=<from-paystack-dashboard>
```

**OCPP Gateway (`ev-billing-ocpp-gateway`):**
```bash
SERVICE_TOKEN=<same-as-backend-api>
```

**MinIO (`ev-billing-minio`):**
```bash
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<strong-password>
```

### Step 4: Run Database Migrations

**Option A: Automatic (Docker)**
- Migrations run automatically when PostgreSQL container starts
- Files in `database/init/` are executed in order

**Option B: Manual (Render)**
1. Connect to PostgreSQL service via Render Shell
2. Run migration script:
   ```bash
   cd database
   ./run-migrations.sh $DATABASE_URL
   ```

**Option C: Via Backend (Recommended)**
- Backend seed service runs on startup
- Creates default users automatically
- Migrations should already be run by Docker

### Step 5: Verify Deployment

1. **Check Backend API:**
   ```
   https://ev-billing-api.onrender.com/health
   ```
   Should return: `{"status":"ok"}`

2. **Check Frontend:**
   ```
   https://ev-billing-frontend.onrender.com
   ```
   Should load the login page

3. **Check OCPP Gateway:**
   ```
   https://ev-billing-ocpp-gateway.onrender.com/health
   ```
   Should return: `{"status":"ok"}`

4. **Test Login:**
   - Email: `admin@evcharging.com`
   - Password: `admin123`
   - Should redirect to SuperAdmin dashboard

---

## 🔐 Default Users

### Super Admin
- **Email:** `admin@evcharging.com`
- **Password:** `admin123`
- **Access:** Full system access

### Tenant Admin
- **Email:** `admin1@tenant1.com`
- **Password:** `admin123`
- **Access:** Tenant management

### Customer
- **Email:** `customer1@tenant1.com`
- **Password:** `customer123`
- **Balance:** 100.00 GHS

---

## 📊 Database Schema

All tables are created automatically:
- ✅ Core: charge_points, users, transactions, payments
- ✅ Advanced: reservations, local_auth_list, charging_profiles
- ✅ Multi-tenant: tenants, tenant_disablements
- ✅ CMS: system_settings, cms_content, branding_assets
- ✅ Logging: connection_logs, connection_statistics

---

## 🚀 Post-Deployment

### 1. Update Service URLs
After deployment, update environment variables with actual URLs:
- `OCPP_GATEWAY_URL` → OCPP Gateway URL
- `PAYSTACK_CALLBACK_URL` → Backend API URL
- `REACT_APP_API_URL` → Backend API URL
- `REACT_APP_WS_URL` → OCPP Gateway WebSocket URL

### 2. Configure Charger
Set charger OCPP URL to:
```
wss://ev-billing-ocpp-gateway.onrender.com/ocpp/{chargePointId}
```

### 3. Test Features
- [ ] User login/logout
- [ ] Charge point registration
- [ ] Transaction creation
- [ ] Payment processing
- [ ] Wallet top-up
- [ ] Invoice generation
- [ ] Multi-tenant isolation

---

## 📝 Important Notes

1. **Migrations:** Run automatically in Docker, or manually for Render
2. **Default Users:** Created automatically via seed service
3. **Passwords:** All default passwords use bcrypt (cost 10)
4. **Tenant Isolation:** All data is tenant-scoped
5. **WebSocket:** OCPP Gateway must be web service (not worker) for WebSocket support

---

## ✅ Complete!

Your EV Charging Billing System is **fully configured** with:
- ✅ 14 database migrations
- ✅ 23 backend modules
- ✅ 28 frontend pages
- ✅ Default users seeded
- ✅ Production deployment ready

**Ready to deploy!** 🚀

