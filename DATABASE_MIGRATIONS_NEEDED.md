# Database Migrations Required

## ⚠️ Current Issue

The application is starting successfully, but the database tables don't exist yet. You need to run database migrations to create the required tables.

## 🔧 Solution: Run Database Migrations

### Option 1: Using Render Shell (Recommended)

1. **Go to Render Dashboard**
2. **Select your `ev-billing-api` service**
3. **Click "Shell"** in the left sidebar
4. **Run the migration script:**
   ```bash
   cd /app
   npm run migration:run
   ```

### Option 2: Using Database Connection

1. **Get your database connection string** from Render Dashboard:
   - Go to your PostgreSQL database service
   - Copy the "Internal Database URL" or "External Database URL"

2. **Connect to the database** using a PostgreSQL client (psql, pgAdmin, etc.)

3. **Run the migration scripts** from the `database/init/` directory in order:
   - `00-migration-tracker.sql`
   - `01-tenants.sql`
   - `02-users.sql`
   - ... (all other migration files)

### Option 3: Using Render Environment Variables

You can also set up a one-time migration job in Render, but the Shell method is simpler.

## 📋 Migration Files Location

All migration files are in: `database/init/`

They should be run in numerical order (00, 01, 02, etc.)

## ✅ After Migrations

Once migrations are run:
- All database tables will be created
- Default users will be seeded
- The app will be fully functional

## 🔍 Verify Migrations

After running migrations, check the logs:
- The `warmUpCache` warning should disappear
- The app should start without database errors
- You should be able to access the API endpoints

