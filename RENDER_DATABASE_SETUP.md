# Render Database Setup - Manual Creation Required

## Issue
Render Blueprint doesn't support creating PostgreSQL databases directly in `render.yaml`. You need to create the database manually first.

## Solution: Create Database Manually, Then Deploy

### Step 1: Create PostgreSQL Database in Render

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Sign in

2. **Create New PostgreSQL Database:**
   - Click **"New +"** button (top right)
   - Select **"PostgreSQL"**
   - Or go to: https://dashboard.render.com/new/postgres

3. **Configure Database:**
   - **Name:** `ev-billing-postgres`
   - **Database:** `ev_billing_db`
   - **User:** `evbilling` (or leave default)
   - **Region:** Choose closest to you
   - **Plan:** Starter (or your preferred plan)
   - Click **"Create Database"**

4. **Copy Connection String:**
   - After creation, go to database settings
   - Copy the **"Internal Database URL"** or **"Connection String"**
   - It looks like: `postgresql://user:password@host:port/database`

### Step 2: Deploy Blueprint (Without Database)

1. **Deploy Blueprint:**
   - Go to: https://dashboard.render.com/new/blueprint
   - Connect repository: `wastwagon/Energy-Presissions-EVAPP`
   - The Blueprint will deploy without the database error

2. **After Deployment:**
   - All services will be created
   - Backend API will be waiting for database connection

### Step 3: Connect Database to Backend

1. **Go to Backend API Service:**
   - In Render dashboard, find `ev-billing-api` service
   - Click on it

2. **Add Environment Variable:**
   - Go to **"Environment"** tab
   - Click **"Add Environment Variable"**
   - **Key:** `DATABASE_URL`
   - **Value:** Paste the connection string from Step 1
   - Click **"Save Changes"**

3. **Redeploy Backend:**
   - Backend will automatically redeploy with database connection
   - Or click **"Manual Deploy"** → **"Deploy latest commit"**

### Step 4: Initialize Database

After backend connects to database:

1. **Run Migrations:**
   - Option A: Use Render Shell
     - Go to backend service → **"Shell"** tab
     - Run: `cd database && ./run-migrations.sh $DATABASE_URL`
   
   - Option B: Connect via psql
     - Use the connection string
     - Run SQL files from `database/init/` in order

2. **Or Backend Will Auto-Seed:**
   - Backend seed service creates default users on startup
   - Check backend logs to confirm

---

## Updated render.yaml

The `render.yaml` has been updated to:
- ✅ Remove PostgreSQL database (create manually)
- ✅ Keep all other services (Redis, Backend, Frontend, OCPP Gateway, MinIO)
- ✅ Set `DATABASE_URL` to `sync: false` (you'll set it manually)

---

## Complete Setup Checklist

- [ ] Create PostgreSQL database in Render dashboard
- [ ] Copy database connection string
- [ ] Deploy Blueprint (will work now without database error)
- [ ] Add `DATABASE_URL` to backend environment variables
- [ ] Backend will redeploy automatically
- [ ] Run database migrations
- [ ] Verify default users are created
- [ ] Test all services

---

## After Setup

Your complete stack will be:
- ✅ PostgreSQL Database (manually created)
- ✅ Redis Cache (from Blueprint)
- ✅ Backend API (from Blueprint)
- ✅ Frontend (from Blueprint)
- ✅ OCPP Gateway (from Blueprint)
- ✅ MinIO (from Blueprint)

All services will be connected and ready!

