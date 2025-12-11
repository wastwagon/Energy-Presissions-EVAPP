# Tenant → Vendor Migration Guide

## ✅ Completed

1. **Entities Created:**
   - ✅ `backend/src/entities/vendor.entity.ts`
   - ✅ `backend/src/entities/vendor-disablement.entity.ts`
   - ✅ Updated `charge-point.entity.ts` (tenant → vendor)
   - ✅ Updated `user.entity.ts` (tenant → vendor)

2. **Vendors Module Created:**
   - ✅ `backend/src/vendors/vendors.service.ts`
   - ✅ `backend/src/vendors/vendors.controller.ts`
   - ✅ `backend/src/vendors/vendor-status.service.ts`
   - ✅ `backend/src/vendors/vendors.module.ts`

3. **Guards & Decorators Created:**
   - ✅ `backend/src/common/guards/vendor-status.guard.ts`
   - ✅ `backend/src/common/decorators/vendor.decorator.ts`

## 🔄 In Progress

### Backend Files to Update:

1. **Auth Service** (`backend/src/auth/auth.service.ts`)
   - Update JWT token payload: `tenantId` → `vendorId`
   - Update user creation to use `vendorId`

2. **Payments Service** (`backend/src/payments/payments.service.ts`)
   - Update tenant status checks to vendor status checks
   - Update references from `TenantStatusService` to `VendorStatusService`

3. **Internal Service** (`backend/src/internal/internal.service.ts`)
   - Update `getTenantStatus` → `getVendorStatus`
   - Update `getChargePointTenant` → `getChargePointVendor`

4. **Command Queue Service** (`backend/src/services/command-queue.service.ts`)
   - Update tenant status checks to vendor status checks

5. **Connection Logs Service** (`backend/src/connection-logs/connection-logs.service.ts`)
   - Update `tenantId` references to `vendorId`

6. **App Module** (`backend/src/app.module.ts`)
   - Replace `TenantsModule` with `VendorsModule`

7. **Database Module** (`backend/src/database/database.module.ts`)
   - Replace `Tenant` entity with `Vendor`
   - Replace `TenantDisablement` with `VendorDisablement`

8. **Other Services:**
   - `billing.service.ts`
   - `settings.service.ts`
   - `seed.service.ts`

### Database Migrations:

1. **Rename Tables:**
   - `tenants` → `vendors`
   - `tenant_disablements` → `vendor_disablements`

2. **Rename Columns:**
   - `tenant_id` → `vendor_id` (in all tables)
   - Update foreign key constraints

3. **Update SQL Files:**
   - `database/init/07-tenants.sql` → `07-vendors.sql`
   - `database/init/08-tenant-migration.sql` → `08-vendor-migration.sql`
   - `database/init/12-tenant-branding.sql` → `12-vendor-branding.sql`
   - Update all other SQL files with tenant references

### Frontend Files to Update:

1. **Services:**
   - `frontend/src/services/tenantApi.ts` → `vendorApi.ts`
   - Update all API calls: `/admin/tenants` → `/admin/vendors`
   - Update all API calls: `/tenant` → `/vendor`

2. **Pages:**
   - `TenantManagementPage.tsx` → `VendorManagementPage.tsx`
   - `TenantSettingsPage.tsx` → `VendorSettingsPage.tsx`

3. **Hooks:**
   - `useTenantStatus.ts` → `useVendorStatus.ts`

4. **Components & Layouts:**
   - Update all references to `tenant` → `vendor`
   - Update all references to `Tenant` → `Vendor`
   - Update all references to `tenantId` → `vendorId`

5. **App.tsx:**
   - Update routes and tenant status checks

## 📋 Migration Checklist

- [ ] Update all backend services
- [ ] Update database migrations
- [ ] Update frontend services
- [ ] Update frontend pages
- [ ] Update frontend hooks
- [ ] Update frontend components
- [ ] Update API routes
- [ ] Update documentation
- [ ] Test all functionality
- [ ] Update environment variables if needed

## 🚨 Important Notes

1. **Database Migration:** The database schema changes require a migration script to:
   - Rename tables
   - Rename columns
   - Update foreign keys
   - Migrate existing data

2. **Backward Compatibility:** Consider keeping the old tenant endpoints temporarily for backward compatibility during migration.

3. **JWT Tokens:** Existing JWT tokens with `tenantId` will need to be regenerated or handled gracefully.

4. **Environment Variables:** Check if any environment variables reference "tenant" and update them.

