# Tenant Disablement Feature - Implementation Plan

**Date**: November 6, 2025

---

## 📋 Overview

This document outlines the implementation plan for adding multi-tenant support with tenant status control (active, suspended, disabled) to the EV Charging Billing System.

---

## 🎯 Current System State

**Single-Tenant System:**
- No tenant concept exists
- Charge points are not tenant-scoped
- Users are not tenant-scoped
- No tenant resolution logic
- No tenant status enforcement

**What Needs to be Added:**
- Complete multi-tenant infrastructure
- Tenant status control (active, suspended, disabled)
- System-wide enforcement
- Audit trail
- Redis caching and pub/sub

---

## 📁 Files to Create

### Database
1. `database/init/07-tenants.sql` - Tenant tables and schema
2. `database/init/08-tenant-migration.sql` - Migration script to add tenantId to existing tables

### Backend Entities
3. `backend/src/entities/tenant.entity.ts` - Tenant entity
4. `backend/src/entities/tenant-disablement.entity.ts` - Audit trail entity

### Backend Modules
5. `backend/src/tenants/tenants.module.ts` - Tenants module
6. `backend/src/tenants/tenants.service.ts` - Tenant management service
7. `backend/src/tenants/tenants.controller.ts` - Admin endpoints for tenant management
8. `backend/src/tenants/tenant-status.service.ts` - Redis cache and pub/sub service

### Backend Guards & Middleware
9. `backend/src/common/guards/tenant.guard.ts` - Tenant status enforcement guard
10. `backend/src/common/decorators/tenant.decorator.ts` - Decorator to extract tenantId
11. `backend/src/common/interceptors/tenant.interceptor.ts` - Interceptor for tenant resolution

### Backend Updates
12. Update `backend/src/entities/charge-point.entity.ts` - Add tenantId
13. Update `backend/src/entities/user.entity.ts` - Add tenantId
14. Update `backend/src/entities/transaction.entity.ts` - Add tenantId (via chargePoint)
15. Update `backend/src/payments/payments.service.ts` - Block payments for suspended/disabled
16. Update `backend/src/services/command-queue.service.ts` - Skip disabled tenants
17. Update `backend/src/app.module.ts` - Import TenantsModule

### OCPP Gateway
18. Update `ocpp-gateway/src/services/connection-manager.ts` - Check tenant status on connect
19. Update `ocpp-gateway/src/index.ts` - Subscribe to tenant status changes
20. Update `ocpp-gateway/src/services/tenant-resolver.ts` - Resolve tenantId from chargePointId

### Frontend
21. `frontend/src/pages/admin/TenantManagementPage.tsx` - Super Admin tenant management UI
22. `frontend/src/pages/tenant/SuspendedPage.tsx` - Suspended tenant page
23. `frontend/src/pages/tenant/DisabledPage.tsx` - Disabled tenant page
24. `frontend/src/services/tenantApi.ts` - API service for tenant operations
25. `frontend/src/hooks/useTenantStatus.ts` - Hook to check tenant status on boot
26. Update `frontend/src/App.tsx` - Add tenant status check and routes

### Documentation
27. `TENANT_MANAGEMENT_RUNBOOK.md` - Operations runbook for tenant management

---

## 📁 Files to Modify

### Database Schema Updates
- `database/init/01-init.sql` - Add tenantId columns (via migration script)
- `database/init/02-enhanced-schema.sql` - No changes needed

### Backend Entity Updates
- `backend/src/entities/charge-point.entity.ts` - Add tenantId relationship
- `backend/src/entities/user.entity.ts` - Add tenantId relationship
- `backend/src/database/database.module.ts` - Add Tenant and TenantDisablement entities

### Backend Service Updates
- `backend/src/charge-points/charge-points.service.ts` - Add tenant filtering
- `backend/src/users/users.service.ts` - Add tenant filtering
- `backend/src/payments/payments.service.ts` - Add tenant status check
- `backend/src/internal/internal.service.ts` - Add tenant resolution
- `backend/src/services/command-queue.service.ts` - Add tenant status check

### OCPP Gateway Updates
- `ocpp-gateway/src/index.ts` - Add tenant status subscription
- `ocpp-gateway/src/services/connection-manager.ts` - Add tenant status enforcement
- `ocpp-gateway/package.json` - Add Redis client dependency (if not present)

### Frontend Updates
- `frontend/src/App.tsx` - Add tenant status check on boot
- `frontend/src/services/api.ts` - Add tenant header/token handling

---

## 🔄 Components That Can Be Merged

### 1. Tenant Status Service + Redis Service
**Merge into:** `backend/src/tenants/tenant-status.service.ts`
- Redis cache operations
- Pub/sub subscription
- In-memory cache
- Status propagation

### 2. Tenant Guard + Tenant Interceptor
**Merge into:** `backend/src/common/guards/tenant.guard.ts`
- Tenant resolution (from domain or token)
- Status checking
- Error responses
- Can use interceptor pattern within guard

### 3. OCPP Tenant Resolver + Connection Manager Updates
**Merge into:** `ocpp-gateway/src/services/connection-manager.ts`
- Tenant resolution from chargePointId
- Status checking on connect
- Socket closing on status change

---

## 🏗️ Architecture Decisions

### 1. Tenant Resolution Strategy
- **Primary**: JWT token claims (tenantId)
- **Secondary**: Domain/hostname mapping (for white-label portals)
- **Fallback**: Default tenant (for backward compatibility during migration)

### 2. Status Enforcement Points
- **API**: TenantGuard middleware (applied globally)
- **OCPP**: Connection manager (on connect + status change)
- **Payments**: PaymentsService (before creating payment intent)
- **Jobs**: CommandQueueService (before processing)

### 3. Redis Strategy
- **Cache Key**: `tenant:{tenantId}:status` → `active|suspended|disabled`
- **Pub/Sub Channel**: `tenant.status.changed`
- **TTL**: 1 hour (refreshed on access)
- **Token Revocation**: `tenant:{tenantId}:tokens:revoked` (set with TTL)

### 4. Migration Strategy
- Create default tenant (id=1, name="Default Tenant")
- Add tenantId columns with default=1
- Update existing records to tenantId=1
- Make tenantId required for new records

---

## 📊 Data Model

### Tenant Table
```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE, -- For white-label portals
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, disabled
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### TenantDisablement Table (Audit)
```sql
CREATE TABLE tenant_disablements (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    status VARCHAR(20) NOT NULL, -- active, suspended, disabled
    reason TEXT,
    effective_at TIMESTAMP DEFAULT NOW(),
    by_user_id INTEGER REFERENCES users(id),
    lifted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Updates to Existing Tables
- `charge_points`: Add `tenant_id INTEGER REFERENCES tenants(id)`
- `users`: Add `tenant_id INTEGER REFERENCES tenants(id)`
- All other tables get tenantId via relationships (chargePoint → tenant, user → tenant)

---

## 🔐 Security Considerations

1. **Super Admin Only**: Tenant status changes require Super Admin role
2. **Token Revocation**: On status change, invalidate all tenant tokens
3. **Audit Trail**: All status changes logged with user, reason, timestamp
4. **Grace Period**: Optional auto-suspend before auto-disable
5. **Emergency Override**: Super Admin can emergency stop even when disabled

---

## ✅ Implementation Checklist

### Phase 1: Database & Entities
- [ ] Create `07-tenants.sql` with tenant tables
- [ ] Create `08-tenant-migration.sql` to add tenantId columns
- [ ] Create Tenant entity
- [ ] Create TenantDisablement entity
- [ ] Update ChargePoint entity with tenantId
- [ ] Update User entity with tenantId
- [ ] Update DatabaseModule to include new entities

### Phase 2: Backend Services
- [ ] Create TenantsModule
- [ ] Create TenantsService (CRUD + status management)
- [ ] Create TenantStatusService (Redis cache + pub/sub)
- [ ] Create TenantsController (Admin endpoints)
- [ ] Update PaymentsService to check tenant status
- [ ] Update CommandQueueService to skip disabled tenants

### Phase 3: Guards & Middleware
- [ ] Create TenantGuard (status enforcement)
- [ ] Create Tenant decorator (extract tenantId)
- [ ] Apply TenantGuard globally (with exceptions)
- [ ] Update InternalService to resolve tenantId

### Phase 4: OCPP Gateway
- [ ] Create tenant resolver service
- [ ] Update connection manager to check tenant status
- [ ] Subscribe to tenant status changes
- [ ] Close sockets on disable/suspend
- [ ] Add proper close codes (4002, 4003)

### Phase 5: Frontend
- [ ] Create TenantManagementPage (Super Admin)
- [ ] Create SuspendedPage
- [ ] Create DisabledPage
- [ ] Create tenantApi service
- [ ] Create useTenantStatus hook
- [ ] Update App.tsx with tenant status check
- [ ] Add tenant status routes

### Phase 6: Testing & Documentation
- [ ] Write unit tests for TenantGuard
- [ ] Write integration tests for status changes
- [ ] Write E2E tests for full flow
- [ ] Create TENANT_MANAGEMENT_RUNBOOK.md
- [ ] Update README with tenant information

---

## 🚀 Next Steps

1. Start with database schema (Phase 1)
2. Implement backend services (Phase 2)
3. Add guards and enforcement (Phase 3)
4. Update OCPP Gateway (Phase 4)
5. Build frontend UI (Phase 5)
6. Test and document (Phase 6)

---

**Status**: Ready to implement
**Priority**: High (required for multi-tenant support)



