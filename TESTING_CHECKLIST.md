# Testing Checklist
## Phase 1 Infrastructure Verification

Use this checklist to verify that all services are working correctly after Phase 1 setup.

---

## Prerequisites

- [ ] Docker Desktop is running
- [ ] All ports are available (80, 3000, 3001, 5432, 6379, 9000, 9001, 5050, 8081)
- [ ] Project files are in place

---

## 1. Service Startup Tests

### Start All Services
```bash
docker-compose up -d
```

- [ ] All services start without errors
- [ ] All services show "Up" status in `docker-compose ps`
- [ ] No service crashes or restarts repeatedly

### Check Service Health
```bash
docker-compose ps
```

Expected output: All services should show "Up" and "healthy" status.

---

## 2. Database Tests

### PostgreSQL Connection
```bash
docker-compose exec postgres pg_isready -U evbilling
```

- [ ] PostgreSQL responds with "accepting connections"

### Database Schema
```bash
docker-compose exec postgres psql -U evbilling -d ev_billing_db -c "\dt"
```

- [ ] All tables are created (should show 10+ tables)
- [ ] Tables include: charge_points, connectors, transactions, users, etc.

### Default Data
```bash
docker-compose exec postgres psql -U evbilling -d ev_billing_db -c "SELECT * FROM tariffs;"
```

- [ ] Default tariff is inserted

---

## 3. Redis Tests

### Redis Connection
```bash
docker-compose exec redis redis-cli ping
```

- [ ] Redis responds with "PONG"

---

## 4. MinIO Tests

### MinIO Health
```bash
curl http://localhost:9000/minio/health/live
```

- [ ] MinIO responds with HTTP 200

### MinIO Console
- [ ] Access http://localhost:9001
- [ ] Login with minioadmin/minioadmin
- [ ] Console loads successfully

---

## 5. NGINX Tests

### NGINX Status
```bash
docker-compose logs nginx | grep -i error
```

- [ ] No critical errors in logs

### Routing Tests
- [ ] http://localhost/ loads frontend
- [ ] http://localhost/api/health returns JSON
- [ ] http://localhost/api/docs loads Swagger UI

---

## 6. CSMS API Tests

### Health Check
```bash
curl http://localhost/api/health
```

- [ ] Returns: `{"status":"ok","timestamp":"..."}`

### Swagger Documentation
- [ ] Access http://localhost/api/docs
- [ ] Swagger UI loads
- [ ] API endpoints are visible

### Internal API (Service Token)
```bash
curl -X POST http://localhost/api/internal/charge-points \
  -H "Authorization: Bearer your-service-token-change-in-production" \
  -H "Content-Type: application/json" \
  -d '{"chargePointId":"CP001","vendor":"Test","model":"TestModel"}'
```

- [ ] Returns 201 Created
- [ ] Charge point is created in database

---

## 7. OCPP Gateway Tests

### WebSocket Server
```bash
docker-compose logs ocpp-gateway | grep "listening"
```

- [ ] Logs show: "OCPP Gateway WebSocket server listening on port 9000"

### WebSocket Connection Test
```bash
# Install wscat: npm install -g wscat
wscat -c ws://localhost:9000/ocpp/CP001
```

- [ ] Connection is established
- [ ] No immediate disconnection

### BootNotification Test
Send a BootNotification message:
```json
[2, "test-123", "BootNotification", {
  "chargePointVendor": "TestVendor",
  "chargePointModel": "TestModel",
  "chargePointSerialNumber": "SN123"
}]
```

- [ ] Gateway responds with BootNotificationResponse
- [ ] Response contains status: "Accepted"
- [ ] Charge point is created in database

---

## 8. Frontend Tests

### Home Page
- [ ] Access http://localhost/
- [ ] Page loads without errors
- [ ] Navigation works

### Operations Dashboard
- [ ] Access http://localhost/ops
- [ ] Dashboard loads
- [ ] Stats cards are visible
- [ ] Navigation sidebar works

### Admin Dashboard
- [ ] Access http://localhost/admin
- [ ] Dashboard loads
- [ ] Navigation works

### Station Finder
- [ ] Access http://localhost/stations
- [ ] Page loads

---

## 9. Integration Tests

### OCPP Gateway → CSMS API
1. Send BootNotification via WebSocket
2. Check database:
   ```bash
   docker-compose exec postgres psql -U evbilling -d ev_billing_db -c "SELECT * FROM charge_points WHERE charge_point_id = 'CP001';"
   ```
   - [ ] Charge point is created in database

### CSMS API → Database
1. Create charge point via internal API
2. Verify in database:
   ```bash
   docker-compose exec postgres psql -U evbilling -d ev_billing_db -c "SELECT * FROM charge_points;"
   ```
   - [ ] Data is persisted correctly

---

## 10. Log Verification

### Check All Service Logs
```bash
docker-compose logs --tail=50
```

- [ ] No critical errors
- [ ] Services are running normally
- [ ] No connection errors between services

### Specific Service Logs
- [ ] OCPP Gateway: No WebSocket errors
- [ ] CSMS API: No database connection errors
- [ ] Frontend: No build errors
- [ ] NGINX: No routing errors

---

## 11. Performance Tests

### Service Startup Time
- [ ] All services start within 2 minutes
- [ ] No service takes more than 30 seconds to become healthy

### Resource Usage
```bash
docker stats --no-stream
```

- [ ] Memory usage is reasonable (< 2GB total)
- [ ] CPU usage is low when idle

---

## 12. Cleanup Test

### Stop Services
```bash
docker-compose down
```

- [ ] All services stop cleanly
- [ ] No errors during shutdown

### Restart Services
```bash
docker-compose up -d
```

- [ ] Services restart successfully
- [ ] Data persists (database, Redis)

---

## Test Results Summary

| Test Category | Status | Notes |
|--------------|--------|-------|
| Service Startup | ⬜ | |
| Database | ⬜ | |
| Redis | ⬜ | |
| MinIO | ⬜ | |
| NGINX | ⬜ | |
| CSMS API | ⬜ | |
| OCPP Gateway | ⬜ | |
| Frontend | ⬜ | |
| Integration | ⬜ | |
| Logs | ⬜ | |
| Performance | ⬜ | |
| Cleanup | ⬜ | |

---

## Troubleshooting

If any test fails:

1. **Check logs**: `docker-compose logs [service-name]`
2. **Check service status**: `docker-compose ps`
3. **Restart service**: `docker-compose restart [service-name]`
4. **Rebuild service**: `docker-compose build [service-name]`
5. **Check documentation**: See `QUICK_START.md` for troubleshooting tips

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Phase 1 is complete
2. ➡️ Proceed to Phase 2: Implementation
3. ➡️ Set up OCPP simulator for testing
4. ➡️ Create test data (users, charge points, IdTags)

---

**Testing Date**: _______________
**Tester**: _______________
**Results**: _______________



