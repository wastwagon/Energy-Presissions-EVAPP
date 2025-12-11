# 🔧 Fix: Migration Script Not Found in Container

## 🔍 Problem

The migration script exists in the repository but isn't found in the Docker container when you run:
```bash
./database/run-migrations.sh
```

## ✅ Solution: Check and Fix

### Step 1: Verify Script Exists in Container

In Render Shell, check if the file exists:

```bash
ls -la /app/database/
```

If you see `run-migrations.sh`, continue to Step 2. If not, the container needs to be rebuilt.

### Step 2: Check Current Directory

Make sure you're in `/app`:

```bash
pwd
# Should show: /app
```

### Step 3: Check File Permissions

```bash
ls -la database/run-migrations.sh
```

If it exists but isn't executable, make it executable:

```bash
chmod +x database/run-migrations.sh
```

### Step 4: Run with Full Path

Try running with the full path:

```bash
/app/database/run-migrations.sh
```

Or:

```bash
bash /app/database/run-migrations.sh
```

## 🔄 Alternative: Run Migrations Manually

If the script still doesn't work, you can run migrations manually:

### Option 1: Run All Migrations with psql

```bash
cd /app/database/init

# Run each migration
for file in *.sql; do
  echo "Running $file..."
  psql $DATABASE_URL -f "$file"
done
```

### Option 2: Run Migrations One by One

```bash
cd /app/database/init

psql $DATABASE_URL -f 01-init.sql
psql $DATABASE_URL -f 02-enhanced-schema.sql
psql $DATABASE_URL -f 03-pending-commands.sql
psql $DATABASE_URL -f 04-paystack-support.sql
psql $DATABASE_URL -f 05-wallet-system.sql
psql $DATABASE_URL -f 06-advanced-features.sql
psql $DATABASE_URL -f 07-tenants.sql
psql $DATABASE_URL -f 08-tenant-migration.sql
psql $DATABASE_URL -f 09-cms-settings.sql
psql $DATABASE_URL -f 10-connection-logs.sql
psql $DATABASE_URL -f 11-default-user.sql
psql $DATABASE_URL -f 12-tenant-branding.sql
psql $DATABASE_URL -f 13-sample-users.sql
```

## 🚀 Quick Fix Command

Try this in Render Shell:

```bash
cd /app
ls -la database/run-migrations.sh
chmod +x database/run-migrations.sh
bash database/run-migrations.sh
```

## 📋 If Script Still Not Found

The container might need to be rebuilt. Check if the database folder exists:

```bash
ls -la /app/ | grep database
```

If it doesn't exist, the Dockerfile might not have copied it correctly. In that case, we need to rebuild the backend service.

---

**Try the commands above and let me know what you see!**

