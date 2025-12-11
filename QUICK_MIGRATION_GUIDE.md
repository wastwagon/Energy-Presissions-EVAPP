# ⚡ Quick Migration Guide - Render Shell

## 🚀 One-Liner Command

Once you're in the Render Shell for `ev-billing-api`, run:

```bash
cd /app && chmod +x database/run-migrations.sh && ./database/run-migrations.sh
```

That's it! The script will handle everything.

## 📝 Detailed Steps

### 1. Open Render Shell

1. Go to: https://dashboard.render.com
2. Click **`ev-billing-api`** service
3. Click **"Shell"** in left sidebar (under "MANAGE")

### 2. Run Migrations

Copy and paste this into the shell:

```bash
# Navigate to app directory
cd /app

# Make script executable
chmod +x database/run-migrations.sh

# Run migrations
./database/run-migrations.sh
```

### 3. Wait for Completion

The script will:
- ✅ Check database connection
- ✅ Run 13 migration files in order
- ✅ Create all tables
- ✅ Insert default users
- ✅ Show progress for each step

### 4. Verify Success

You should see:
```
========================================
✅ All migrations completed successfully!
========================================

Default users created:
  - SuperAdmin: admin@evcharging.com / admin123
  - Admin: admin1@tenant1.com / admin123
  - Customer: customer1@tenant1.com / customer123
```

## 🔍 Verify Tables Created

After migrations, verify tables exist:

```bash
psql $DATABASE_URL -c "\dt"
```

You should see ~20+ tables listed.

## 🔐 Test Login

1. Go to: `https://ev-billing-frontend.onrender.com`
2. Login with:
   - **Email**: `admin@evcharging.com`
   - **Password**: `admin123`

## 📊 What Gets Created

### Tables (13 migrations):
1. `01-init.sql` - Core tables (users, charge_points, transactions)
2. `02-enhanced-schema.sql` - Enhanced features
3. `03-pending-commands.sql` - Command queue
4. `04-paystack-support.sql` - Payment gateway
5. `05-wallet-system.sql` - Wallet functionality
6. `06-advanced-features.sql` - Advanced features
7. `07-tenants.sql` - Multi-tenant support
8. `08-tenant-migration.sql` - Tenant migration
9. `09-cms-settings.sql` - CMS and settings
10. `10-connection-logs.sql` - Connection logging
11. `11-default-user.sql` - Default admin user
12. `12-tenant-branding.sql` - Tenant branding
13. `13-sample-users.sql` - Sample users

### Users Created:
- **SuperAdmin**: `admin@evcharging.com` / `admin123`
- **Admin**: `admin1@tenant1.com` / `admin123`
- **Customer**: `customer1@tenant1.com` / `customer123`

## ⚠️ Troubleshooting

### If script not found:
```bash
pwd  # Should show: /app
ls -la database/  # Should show run-migrations.sh
```

### If DATABASE_URL missing:
```bash
env | grep DATABASE_URL
```

### If connection fails:
- Wait 30 seconds and retry
- Check database service is running in Render Dashboard

## ✅ Success Indicators

- ✅ All 13 migrations show "completed"
- ✅ "All migrations completed successfully!" message
- ✅ Default users listed
- ✅ No error messages

---

**Ready? Open Render Shell and run the one-liner command above! 🚀**

