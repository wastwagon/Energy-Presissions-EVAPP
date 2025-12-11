# Run Database Migrations on Render

## ✅ Quick Solution

The app is now running, but you need to create the database tables. Here's how:

### Step 1: Open Render Shell

1. Go to **Render Dashboard**
2. Select **`ev-billing-api`** service
3. Click **"Shell"** in the left sidebar

### Step 2: Run Migrations

In the shell, run:

```bash
cd /app
chmod +x database/run-migrations.sh
./database/run-migrations.sh $DATABASE_URL
```

The `DATABASE_URL` environment variable is already set in Render, so the script will use it automatically.

### Step 3: Verify

After migrations complete, check the logs:
- The "Tenants table does not exist" warning should disappear
- The "users" table error should be gone
- The app should be fully functional

## 📋 What Gets Created

The migrations will create:
- ✅ All database tables (tenants, users, charge_points, etc.)
- ✅ Default admin user: `admin@evcharging.com` / `admin123`
- ✅ Sample data for testing

## 🔍 Alternative: Manual SQL Execution

If the script doesn't work, you can run SQL files manually:

1. **Get your database connection string** from Render Dashboard → PostgreSQL service
2. **Connect using psql** or any PostgreSQL client
3. **Run the SQL files** from `database/init/` in order:
   - `00-migration-tracker.sql`
   - `01-init.sql`
   - `02-enhanced-schema.sql`
   - ... (all files in numerical order)

## ✅ After Migrations

Once migrations are complete:
- ✅ All tables will exist
- ✅ Default users will be created
- ✅ App will be fully functional
- ✅ You can access the API at `https://ev-billing-api.onrender.com/api`

