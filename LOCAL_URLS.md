# Local URLs Reference

**Date**: November 6, 2025

---

## 🌐 Main Application URLs

### Via NGINX (Recommended - Port 8080)

**Frontend Dashboards:**
- **Home/Customer Portal**: http://localhost:8080
- **Operations Dashboard**: http://localhost:8080/ops
- **Admin Dashboard**: http://localhost:8080/admin
- **Admin Wallet Management**: http://localhost:8080/admin/wallets
- **Public Station Finder**: http://localhost:8080/stations

**API Endpoints:**
- **REST API Base**: http://localhost:8080/api
- **Swagger Documentation**: http://localhost:8080/api/docs
- **Health Check**: http://localhost:8080/health

**WebSocket Endpoints:**
- **Real-time Updates (Socket.io)**: ws://localhost:8080/ws
- **OCPP WebSocket**: ws://localhost:8080/ocpp/{chargePointId}
  - Example: `ws://localhost:8080/ocpp/CP001`

---

### Direct Access (Bypass NGINX)

**Frontend:**
- **React Dev Server**: http://localhost:3001
  - Home: http://localhost:3001
  - Operations: http://localhost:3001/ops
  - Admin: http://localhost:3001/admin
  - Stations: http://localhost:3001/stations

**Backend API:**
- **CSMS API**: http://localhost:3000
- **REST API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

**OCPP (Embedded in API):**
- **WebSocket Server**: ws://localhost:3000/ocpp/{chargePointId}
  - Example: `ws://localhost:3000/ocpp/CP001`

---

## 🗄️ Database & Storage

**PostgreSQL:**
- **Host**: localhost
- **Port**: 5432
- **Database**: ev_billing_db
- **Username**: evbilling
- **Password**: evbilling_password
- **Connection String**: `postgresql://evbilling:evbilling_password@localhost:5432/ev_billing_db`

**Redis:**
- **Host**: localhost
- **Port**: 6379
- **Connection String**: `redis://localhost:6379`

**MinIO (S3-compatible Storage):**
- **API Endpoint**: http://localhost:9002
- **Console**: http://localhost:9001
- **Username**: minioadmin
- **Password**: minioadmin
- **Access Key**: minioadmin
- **Secret Key**: minioadmin

---

## 🛠️ Development Tools

**pgAdmin (Database GUI):**
- **URL**: http://localhost:5050
- **Email**: admin@evbilling.com
- **Password**: admin
- **Note**: Start with `docker-compose --profile tools up -d`

**Redis Commander:**
- **URL**: http://localhost:8081
- **Note**: Start with `docker-compose --profile tools up -d`

---

## 📡 API Endpoints Summary

### Charge Points
- `GET /api/charge-points` - List all charge points
- `GET /api/charge-points/:id` - Get charge point details
- `POST /api/charge-points/:id/remote-start` - Remote start transaction
- `POST /api/charge-points/:id/remote-stop` - Remote stop transaction
- `POST /api/charge-points/:id/reset` - Reset charge point
- `POST /api/charge-points/:id/clear-cache` - Clear authorization cache
- `POST /api/charge-points/:id/reserve-now` - Reserve connector
- `POST /api/charge-points/:id/cancel-reservation` - Cancel reservation
- `POST /api/charge-points/:id/send-local-list` - Send local auth list
- `GET /api/charge-points/:id/local-list-version` - Get local list version
- `POST /api/charge-points/:id/set-charging-profile` - Set charging profile
- `POST /api/charge-points/:id/clear-charging-profile` - Clear charging profile
- `GET /api/charge-points/:id/composite-schedule` - Get composite schedule
- `POST /api/charge-points/:id/update-firmware` - Update firmware
- `POST /api/charge-points/:id/get-diagnostics` - Get diagnostics
- `POST /api/charge-points/:id/data-transfer` - Data transfer

### Transactions
- `GET /api/transactions` - List transactions
- `GET /api/transactions/:id` - Get transaction details
- `GET /api/transactions/active` - Get active transactions

### Reservations
- `POST /api/reservations` - Create reservation
- `POST /api/reservations/:id/cancel` - Cancel reservation
- `GET /api/reservations/:id` - Get reservation
- `GET /api/reservations/charge-point/:chargePointId` - Get reservations for charge point
- `GET /api/reservations/active` - Get active reservations

### Local Auth List
- `POST /api/local-auth-list/send` - Send local auth list
- `GET /api/local-auth-list/version/:chargePointId` - Get version
- `GET /api/local-auth-list/:chargePointId` - Get list

### Smart Charging
- `POST /api/smart-charging/set-profile` - Set charging profile
- `POST /api/smart-charging/clear-profile` - Clear charging profile
- `GET /api/smart-charging/composite-schedule` - Get composite schedule
- `GET /api/smart-charging/profiles/:chargePointId` - Get profiles
- `GET /api/smart-charging/profile/:id` - Get profile

### Firmware
- `POST /api/firmware/update` - Update firmware
- `GET /api/firmware/jobs/:chargePointId` - Get firmware jobs
- `GET /api/firmware/job/:id` - Get firmware job

### Diagnostics
- `POST /api/diagnostics/get` - Get diagnostics
- `GET /api/diagnostics/jobs/:chargePointId` - Get diagnostics jobs
- `GET /api/diagnostics/job/:id` - Get diagnostics job

### Payments
- `POST /api/payments/initialize` - Initialize payment
- `GET /api/payments/verify/:reference` - Verify payment
- `POST /api/payments/wallet/invoice/:invoiceId` - Pay with wallet (invoice)
- `POST /api/payments/wallet/transaction/:transactionId` - Pay with wallet (transaction)
- `GET /api/payments/public-key` - Get Paystack public key

### Wallet
- `GET /api/wallet/balance/:userId` - Get wallet balance
- `POST /api/wallet/top-up` - Top up wallet (admin)
- `POST /api/wallet/adjust` - Adjust wallet (admin)
- `GET /api/wallet/transactions/:userId` - Get wallet transactions

### Billing
- `GET /api/billing/transactions` - Get billing transactions
- `GET /api/billing/invoices` - Get invoices
- `GET /api/billing/invoices/:id` - Get invoice
- `POST /api/billing/invoices/:id/generate` - Generate invoice

---

## 🔌 WebSocket Events

### Real-time Updates (Socket.io)
- **Connection**: `ws://localhost:8080/ws` or `ws://localhost:3000/ws`
- **Events**:
  - `chargePointStatus` - Charge point status updates
  - `connectorStatus` - Connector status updates
  - `transactionStarted` - Transaction started
  - `transactionStopped` - Transaction stopped
  - `meterValue` - Meter value updates

### OCPP WebSocket
- **Connection**: `ws://localhost:8080/ocpp/{chargePointId}` or `ws://localhost:3000/ocpp/{chargePointId}`
- **Protocol**: OCPP 1.6J (JSON over WebSocket)
- **Format**: JSON-RPC 2.0

---

## 📝 Quick Reference

### Most Common URLs

1. **Frontend (via NGINX)**: http://localhost:8080
2. **API Documentation**: http://localhost:8080/api/docs
3. **Operations Dashboard**: http://localhost:8080/ops
4. **Admin Dashboard**: http://localhost:8080/admin
5. **Admin Wallet Management**: http://localhost:8080/admin/wallets
6. **MinIO Console**: http://localhost:9001
7. **pgAdmin**: http://localhost:5050 (with tools profile)

### Port Summary

| Service | Port | Description |
|---------|------|-------------|
| NGINX (HTTP) | 8080 | Main entry point |
| NGINX (HTTPS) | 8443 | HTTPS (optional) |
| Frontend | 3001 | React dev server |
| CSMS API | 3000 | NestJS backend |
| OCPP (embedded) | 3000 | Backend API + OCPP WebSocket |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/Queue |
| MinIO API | 9002 | S3 API |
| MinIO Console | 9001 | Web UI |
| pgAdmin | 5050 | DB GUI (tools) |
| Redis Commander | 8081 | Redis GUI (tools) |

---

## 🚀 Getting Started

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **Access the application**:
   - Frontend: http://localhost:8080
   - API Docs: http://localhost:8080/api/docs

3. **Start development tools** (optional):
   ```bash
   docker-compose --profile tools up -d
   ```
   - pgAdmin: http://localhost:5050
   - Redis Commander: http://localhost:8081

---

**All URLs are accessible once services are running!** 🎉



