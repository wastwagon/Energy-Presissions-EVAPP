# Tenant Management Runbook

**Date**: November 6, 2025

---

## 📋 Overview

This runbook provides step-by-step instructions for managing tenant status in the EV Charging Billing System. It covers suspending, disabling, and re-enabling tenants, along with expected effects and troubleshooting.

---

## 🎯 Tenant Status Levels

### Active
- **Description**: Normal operation
- **Access**: Full access to all features
- **OCPP**: Connections accepted, commands executed
- **Payments**: Allowed
- **API**: All endpoints accessible

### Suspended
- **Description**: Read-only mode with limited functionality
- **Access**: Read-only (GET requests), StopTransaction allowed for safety
- **OCPP**: Connections may be closed (4002) or commands blocked
- **Payments**: Blocked
- **API**: Write operations blocked (403 TENANT_SUSPENDED)

### Disabled
- **Description**: Hard cutoff, no access
- **Access**: Super Admin read-only access only
- **OCPP**: Connections rejected (4003 tenant_disabled)
- **Payments**: Blocked
- **API**: All tenant-scoped endpoints blocked (403 TENANT_DISABLED)

---

## 🔧 Operations

### 1. Suspend a Tenant

**When to use:**
- Payment overdue
- Temporary issue requiring investigation
- Grace period before disable

**Steps:**

1. **Via API:**
   ```bash
   curl -X PUT http://localhost:8080/api/admin/tenants/{tenantId}/status \
     -H "Authorization: Bearer <super-admin-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "suspended",
       "reason": "Payment overdue - please contact support"
     }'
   ```

2. **Via Frontend:**
   - Navigate to `/admin/tenants`
   - Click "Change Status" icon for the tenant
   - Select "Suspended"
   - Enter reason
   - Click "Change Status"

**Expected Effects:**
- ✅ Status changes in <1 second
- ✅ All tenant tokens revoked
- ✅ OCPP connections closed (4002) or commands blocked
- ✅ New payments blocked
- ✅ Write operations blocked (403 TENANT_SUSPENDED)
- ✅ Read operations still allowed
- ✅ StopTransaction allowed (safety)

**Verification:**
```bash
# Check tenant status
curl http://localhost:8080/api/admin/tenants/{tenantId}/status \
  -H "Authorization: Bearer <super-admin-token>"

# Check OCPP Gateway logs
docker-compose logs -f ocpp-gateway | grep "tenant.*suspended"

# Check API logs
docker-compose logs -f csms-api | grep "TENANT_SUSPENDED"
```

---

### 2. Disable a Tenant

**When to use:**
- Violation of terms
- Security breach
- Permanent account closure
- Non-payment after suspension period

**Steps:**

1. **Via API:**
   ```bash
   curl -X PUT http://localhost:8080/api/admin/tenants/{tenantId}/status \
     -H "Authorization: Bearer <super-admin-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "disabled",
       "reason": "Violation of terms of service"
     }'
   ```

2. **Via Frontend:**
   - Navigate to `/admin/tenants`
   - Click "Change Status" icon for the tenant
   - Select "Disabled"
   - Enter reason
   - Click "Change Status"

**Expected Effects:**
- ✅ Status changes in <1 second
- ✅ All tenant tokens revoked
- ✅ All OCPP connections closed immediately (4003)
- ✅ New OCPP connections rejected
- ✅ All payments blocked
- ✅ All API requests blocked (403 TENANT_DISABLED)
- ✅ All pending commands cancelled
- ✅ Frontend redirects to disabled page

**Verification:**
```bash
# Check tenant status
curl http://localhost:8080/api/admin/tenants/{tenantId}/status \
  -H "Authorization: Bearer <super-admin-token>"

# Check OCPP Gateway logs for connection closures
docker-compose logs -f ocpp-gateway | grep "tenant.*disabled"

# Check Redis cache
docker-compose exec redis redis-cli GET "tenant:{tenantId}:status"
# Should return: "disabled"

# Check pub/sub message
docker-compose logs -f ocpp-gateway | grep "Tenant status changed"
```

---

### 3. Re-enable a Tenant

**When to use:**
- Issue resolved
- Payment received
- Terms violation addressed

**Steps:**

1. **Via API:**
   ```bash
   curl -X PUT http://localhost:8080/api/admin/tenants/{tenantId}/status \
     -H "Authorization: Bearer <super-admin-token>" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "active",
       "reason": "Issue resolved - payment received"
     }'
   ```

2. **Via Frontend:**
   - Navigate to `/admin/tenants`
   - Click "Change Status" icon for the tenant
   - Select "Active"
   - Enter reason
   - Click "Change Status"

**Expected Effects:**
- ✅ Status changes in <1 second
- ✅ Tenant can reconnect OCPP devices
- ✅ All operations restored
- ✅ Payments allowed
- ✅ API access restored

---

## 📊 Monitoring

### Check Tenant Status

```bash
# Get tenant status with history
curl http://localhost:8080/api/admin/tenants/{tenantId}/status \
  -H "Authorization: Bearer <super-admin-token>"
```

**Response:**
```json
{
  "status": "suspended",
  "reason": "Payment overdue",
  "effectiveAt": "2025-11-06T10:30:00Z",
  "updatedBy": 1,
  "history": [
    {
      "id": 1,
      "status": "suspended",
      "reason": "Payment overdue",
      "effectiveAt": "2025-11-06T10:30:00Z",
      "byUserId": 1,
      "liftedAt": null
    }
  ]
}
```

### View Status History

**Via Frontend:**
- Navigate to `/admin/tenants`
- Click "View History" icon for the tenant
- Review all status changes with timestamps and reasons

**Via API:**
```bash
curl http://localhost:8080/api/admin/tenants/{tenantId}/status \
  -H "Authorization: Bearer <super-admin-token>"
# History is included in the response
```

---

## 🔍 Troubleshooting

### Issue: Status change not taking effect

**Symptoms:**
- Status changed in database but API still allows access
- OCPP connections not closing

**Diagnosis:**
```bash
# Check Redis cache
docker-compose exec redis redis-cli GET "tenant:{tenantId}:status"

# Check pub/sub
docker-compose logs -f ocpp-gateway | grep "Tenant status changed"

# Check API logs
docker-compose logs -f csms-api | grep "tenant.*status"
```

**Solution:**
1. Verify Redis is running: `docker-compose ps redis`
2. Check pub/sub subscription: `docker-compose logs ocpp-gateway | grep "subscribe"`
3. Manually clear cache and retry:
   ```bash
   docker-compose exec redis redis-cli DEL "tenant:{tenantId}:status"
   # Then change status again
   ```

---

### Issue: OCPP connections not closing

**Symptoms:**
- Tenant disabled but charge points still connected

**Diagnosis:**
```bash
# Check OCPP Gateway logs
docker-compose logs -f ocpp-gateway | grep "{tenantId}"

# Check connection status
curl http://localhost:9000/health/connection/{chargePointId}
```

**Solution:**
1. Verify tenantId is correctly set for charge point
2. Check OCPP Gateway received pub/sub message
3. Manually close connections if needed (restart OCPP Gateway)

---

### Issue: Payments still processing for disabled tenant

**Symptoms:**
- Tenant disabled but payments going through

**Diagnosis:**
```bash
# Check payment logs
docker-compose logs -f csms-api | grep "TENANT_DISABLED"

# Check tenant status in payment service
# (Should be checked before processing)
```

**Solution:**
1. Verify `PaymentsService` has `TenantStatusService` injected
2. Check payment endpoint is using tenant status check
3. Review payment logs for tenant status errors

---

## 🚨 Emergency Procedures

### Emergency Disable (All Tenants)

**Scenario**: Security breach affecting all tenants

**Steps:**
1. Connect to database:
   ```bash
   docker-compose exec postgres psql -U evbilling -d ev_billing_db
   ```

2. Disable all tenants:
   ```sql
   UPDATE tenants SET status = 'disabled' WHERE status != 'disabled';
   ```

3. Clear Redis cache:
   ```bash
   docker-compose exec redis redis-cli FLUSHDB
   ```

4. Restart services:
   ```bash
   docker-compose restart csms-api ocpp-gateway
   ```

---

### Emergency Re-enable (Single Tenant)

**Scenario**: Tenant incorrectly disabled, needs immediate access

**Steps:**
1. **Quick Fix (API):**
   ```bash
   curl -X PUT http://localhost:8080/api/admin/tenants/{tenantId}/status \
     -H "Authorization: Bearer <super-admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"status": "active", "reason": "Emergency re-enable"}'
   ```

2. **Verify:**
   ```bash
   # Check status
   curl http://localhost:8080/api/admin/tenants/{tenantId}/status \
     -H "Authorization: Bearer <super-admin-token>"

   # Check Redis
   docker-compose exec redis redis-cli GET "tenant:{tenantId}:status"
   # Should return: "active"
   ```

---

## 📈 Metrics & Alerts

### Key Metrics to Monitor

1. **Tenant Status Changes:**
   ```bash
   # Count status changes in last 24 hours
   docker-compose exec postgres psql -U evbilling -d ev_billing_db -c "
     SELECT status, COUNT(*) 
     FROM tenant_disablements 
     WHERE effective_at > NOW() - INTERVAL '24 hours'
     GROUP BY status;
   "
   ```

2. **Blocked Requests:**
   ```bash
   # Check API logs for blocked requests
   docker-compose logs csms-api | grep "TENANT_DISABLED\|TENANT_SUSPENDED" | wc -l
   ```

3. **OCPP Disconnections:**
   ```bash
   # Check OCPP Gateway logs for tenant disconnections
   docker-compose logs ocpp-gateway | grep "tenant.*disabled\|tenant.*suspended" | wc -l
   ```

### Recommended Alerts

1. **High Volume of Status Changes:**
   - Alert if >5 status changes in 1 hour
   - Indicates potential issue or abuse

2. **Tenant Disabled:**
   - Alert Super Admin immediately when tenant disabled
   - Include tenant name, reason, and timestamp

3. **Blocked Request Spike:**
   - Alert if >100 blocked requests in 5 minutes after status change
   - Indicates status change took effect

---

## 🔐 Security Considerations

1. **Super Admin Only**: Only Super Admin users can change tenant status
2. **Audit Trail**: All status changes are logged with:
   - User who made the change
   - Reason for change
   - Timestamp
   - Status before and after

3. **Token Revocation**: All tenant tokens are revoked on status change
4. **Immediate Effect**: Status changes propagate in <1 second
5. **No Data Deletion**: Disabling a tenant does not delete data

---

## 📝 Best Practices

1. **Always Provide Reason**: Include a clear reason when changing status
2. **Use Suspended First**: Use suspended as a warning before disabling
3. **Monitor After Change**: Check logs and metrics after status change
4. **Document Changes**: Keep a log of all status changes and reasons
5. **Test in Staging**: Test status changes in staging environment first

---

## 🆘 Support Contacts

- **Technical Support**: support@evcharging.com
- **Emergency**: +233 XX XXX XXXX
- **Documentation**: See `TENANT_IMPLEMENTATION_COMPLETE.md`

---

**Last Updated**: November 6, 2025



