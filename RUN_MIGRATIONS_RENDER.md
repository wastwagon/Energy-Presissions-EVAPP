# 🗄️ Run Database Migrations on Render

## 📋 Prerequisites

- ✅ Backend service (`ev-billing-api`) must be deployed
- ✅ Database service (`ev-billing-postgres`) must be running
- ✅ You have access to Render Dashboard

## 🚀 Step-by-Step Instructions

### Step 1: Access Render Shell

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com
   - Find your service: **`ev-billing-api`**

2. **Open Shell**
   - Click on **`ev-billing-api`** service
   - In the left sidebar, click **"Shell"** (under "MANAGE")
   - This opens a terminal connected to your backend service

### Step 2: Navigate to Database Directory

Once in the Shell, run:

```bash
cd /app
ls -la database/
```

You should see:
- `run-migrations.sh` (the migration script)
- `init/` directory (containing all SQL migration files)

### Step 3: Get Database Connection String

The `DATABASE_URL` is already set as an environment variable. Check it:

```bash
echo $DATABASE_URL
```

This will show the connection string in format:
```
postgresql://user:password@host:port/database
```

### Step 4: Make Migration Script Executable

```bash
chmod +x database/run-migrations.sh
```

### Step 5: Run Migrations

Run the migration script:

```bash
./database/run-migrations.sh $DATABASE_URL
```

Or simply (it will use `$DATABASE_URL` automatically):

```bash
./database/run-migrations.sh
```

### Step 6: Verify Migrations

The script will:
- ✅ Wait for database to be ready
- ✅ Run all 13 migration files in order
- ✅ Show progress for each migration
- ✅ Display success message when complete

## 📊 What Gets Created

The migrations will create:

### Tables:
- ✅ `users` - User accounts
- ✅ `tenants` - Multi-tenant support
- ✅ `charge_points` - EV charger devices
- ✅ `transactions` - Charging sessions
- ✅ `invoices` - Billing invoices
- ✅ `payments` - Payment records
- ✅ `wallets` - User wallets
- ✅ `tariffs` - Pricing plans
- ✅ `charging_profiles` - Smart charging
- ✅ `reservations` - Charging reservations
- ✅ `diagnostics` - Device diagnostics
- ✅ `connection_logs` - Connection tracking
- ✅ `cms_content` - CMS content
- ✅ `system_settings` - System configuration
- ✅ And more...

### Default Users:
- ✅ **SuperAdmin**: `admin@evcharging.com` / `admin123`
- ✅ **Admin**: `admin1@tenant1.com` / `admin123`
- ✅ **Customer**: `customer1@tenant1.com` / `customer123`

## 🎯 Expected Output

You should see output like:

```
========================================
Database Migration Runner
========================================

Database: ev_billing_db
Host: dpg-xxxxx-a.oregon-postgres.render.com
Port: 5432
User: ev_billing_db_user

Running migrations...

Waiting for database to be ready...
Database is ready!

Running: 01-init.sql
✅ 01-init.sql completed
Running: 02-enhanced-schema.sql
✅ 02-enhanced-schema.sql completed
...
Running: 13-sample-users.sql
✅ 13-sample-users.sql completed

========================================
✅ All migrations completed successfully!
========================================

Default users created:
  - SuperAdmin: admin@evcharging.com / admin123
  - Admin: admin1@tenant1.com / admin123
  - Customer: customer1@tenant1.com / customer123
```

## 🔧 Troubleshooting

### If script is not found:
```bash
# Check if you're in the right directory
pwd
# Should show: /app

# List files
ls -la database/
```

### If DATABASE_URL is not set:
```bash
# Check environment variables
env | grep DATABASE
```

### If migrations fail:
The script will show verbose output for the failing migration. Common issues:
- Database not ready (wait a bit and retry)
- Connection timeout (check database is running)
- Permission issues (check database user permissions)

### Manual Migration (if script fails):

You can run migrations manually:

```bash
cd /app/database/init

# Run each migration file
PGPASSWORD=$DB_PASS psql $DATABASE_URL -f 01-init.sql
PGPASSWORD=$DB_PASS psql $DATABASE_URL -f 02-enhanced-schema.sql
# ... etc
```

## ✅ After Migrations Complete

1. **Verify Tables Created**:
   ```bash
   psql $DATABASE_URL -c "\dt"
   ```

2. **Check Users**:
   ```bash
   psql $DATABASE_URL -c "SELECT email, role FROM users;"
   ```

3. **Test Login**:
   - Go to: `https://ev-billing-frontend.onrender.com`
   - Login with: `admin@evcharging.com` / `admin123`

## 🎉 Success!

Once migrations complete, your database is fully set up with:
- ✅ All tables and schemas
- ✅ Default users
- ✅ Sample data
- ✅ Multi-tenant support
- ✅ Payment system
- ✅ Wallet system

Your application is ready to use! 🚀

