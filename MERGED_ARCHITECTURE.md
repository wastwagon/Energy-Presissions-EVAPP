# Merged Architecture & Implementation Plan
## EV Charging Billing Software - OCPP 1.6J Central System

**Combining**: Original requirements + Enhanced OCPP 1.6J CSMS specifications

---

## 🎯 HIGH-LEVEL OBJECTIVES

1. **Implement OCPP 1.6J Central System (CSMS)** that runs fully on laptop with Docker Compose
2. **Promote to live server** with minimal changes
3. **Prioritize reliability**: WebSocket connections, correct OCPP sequencing, clear dashboards
4. **No premature complexity**: Focus on MVP, add features incrementally

---

## 🏗️ ARCHITECTURE (Path A - Enhanced)

### Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Web Dashboards (React)  │  Mobile Apps (Future Phase)     │
│  - Admin Dashboard        │  - Customer App                 │
│  - Customer Portal        │  - Operations App               │
│  - Public Station Finder  │                                 │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ HTTPS                        │
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│                    NGINX (Reverse Proxy)                     │
│  - Routes: /api → csms-api                                  │
│  - Routes: /ocpp → ocpp-gateway (WebSocket upgrade)         │
│  - Routes: / → frontend                                     │
│  - Optional: TLS termination                                │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
    ┌──────────▼──────────┐      ┌───────────▼──────────┐
    │   ocpp-gateway      │      │     csms-api         │
    │   (Node.js/TS)      │◄─────┤   (NestJS/TS)        │
    │                     │      │                      │
    │  - WebSocket Server │      │  - REST API          │
    │  - OCPP 1.6J        │      │  - Business Logic    │
    │  - Message Routing  │      │  - Billing           │
    │  - Connection Mgmt  │      │  - Payments          │
    └──────────┬──────────┘      └──────────┬───────────┘
               │                            │
               │                            │
    ┌──────────▼────────────────────────────▼───────────┐
    │              DATA & STORAGE LAYER                  │
    ├────────────────────────────────────────────────────┤
    │  PostgreSQL  │  Redis  │  MinIO (S3-compatible)   │
    │  - Primary DB│  - Cache │  - Firmware             │
    │  - OCPP Data │  - Queue │  - Diagnostics          │
    │  - Billing   │  - PubSub│  - Logs                 │
    └────────────────────────────────────────────────────┘
```

---

## 📦 SERVICES BREAKDOWN

### 1. ocpp-gateway (Node.js + TypeScript)
**Purpose**: OCPP 1.6J WebSocket server

**Responsibilities**:
- Accept WebSocket connections from charge points
- Handle OCPP JSON-RPC 2.0 messages
- Route messages to appropriate handlers
- Manage connection state and reconnection
- Send commands to charge points (RemoteStart, RemoteStop, etc.)
- Communicate with csms-api via REST or Redis pub/sub

**Technology**:
- Node.js 18+ with TypeScript
- WebSocket library: `ws` (native)
- OCPP message parsing and validation
- Connection manager for multiple charge points

**Port**: 9000 (internal), exposed via NGINX at `/ocpp`

---

### 2. csms-api (NestJS + TypeScript)
**Purpose**: Business logic and REST API

**Responsibilities**:
- REST API endpoints for frontend
- Transaction management
- Billing calculations
- User management
- Payment processing
- Station management
- Reports and analytics
- Receive events from ocpp-gateway
- Send commands to ocpp-gateway

**Technology**:
- NestJS (TypeScript framework)
- TypeORM or Prisma (ORM)
- JWT authentication
- RESTful API design

**Port**: 3000 (internal), exposed via NGINX at `/api`

---

### 3. frontend (React + TypeScript)
**Purpose**: Web dashboards

**Dashboards**:
1. **Admin Dashboard** (`/admin`)
   - Station management
   - User management
   - System configuration
   - Reports and analytics

2. **Operations Dashboard** (`/ops`) - **NEW**
   - Live charge point status
   - Active sessions monitoring
   - Device inventory
   - Recent events
   - Remote control (start/stop, unlock, availability)

3. **Customer Portal** (`/`)
   - Account management
   - Charging history
   - Payments
   - Start/stop charging

4. **Public Station Finder** (`/stations`)
   - Find nearby stations
   - View availability
   - No login required

**Technology**:
- React 18+ with TypeScript
- State management: Redux Toolkit or Zustand
- UI library: Material-UI or Ant Design
- Real-time: WebSocket client or Socket.io
- Charts: Recharts or Chart.js

**Port**: 3001 (dev), served via NGINX at `/` (production)

---

### 4. postgres (PostgreSQL 15)
**Purpose**: Primary database

**Data**:
- Charge points and connectors
- Transactions and meter values
- Users and IdTags
- Billing and payments
- Configuration keys
- Authorization cache

**Port**: 5432

---

### 5. redis (Redis 7)
**Purpose**: Cache, queues, pub/sub

**Usage**:
- Authorization cache
- Idempotency keys
- Simple queues for background jobs
- Pub/sub for service communication
- Session storage

**Port**: 6379

---

### 6. minio (MinIO)
**Purpose**: S3-compatible object storage

**Usage**:
- Firmware files
- Diagnostics data
- Log files (raw OCPP frames in dev)
- Invoice PDFs
- Reports exports

**Ports**: 9000 (API), 9001 (Console)

---

### 7. nginx (NGINX)
**Purpose**: Reverse proxy and routing

**Routes**:
- `/api` → csms-api (port 3000)
- `/ocpp` → ocpp-gateway (port 9000, WebSocket upgrade)
- `/` → frontend (port 3001 or static files)
- Optional: TLS termination

**Port**: 80 (HTTP), 443 (HTTPS - optional)

---

### 8. pgadmin (Optional)
**Purpose**: Database GUI for development

**Port**: 5050

---

## 🌐 LOCAL URLs

### Development Environment

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Frontend** | http://localhost | 80 | All dashboards (via NGINX) |
| **API** | http://localhost/api | 80 | REST API (via NGINX) |
| **OCPP WebSocket** | ws://localhost/ocpp | 80 | OCPP connections (via NGINX) |
| **pgAdmin** | http://localhost:5050 | 5050 | Database GUI |
| **MinIO Console** | http://localhost:9001 | 9001 | Object storage GUI |

### Alternative (Direct Access - Dev Mode)

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Frontend** | http://localhost:3001 | 3001 | React dev server |
| **API** | http://localhost:3000 | 3000 | NestJS API |
| **OCPP WebSocket** | ws://localhost:9000 | 9000 | OCPP gateway |

---

## 📋 OCPP 1.6J MESSAGES (MVP SCOPE)

### From Charger (Incoming)

#### Core Messages:
1. **BootNotification** ✅
   - Charge point registration
   - Vendor, model, serial number, firmware version
   - Response: Accept/Reject with configuration

2. **Heartbeat** ✅
   - Keep-alive mechanism
   - Response: Current server time

3. **StatusNotification** ✅
   - Connector status updates
   - Error codes and vendor error codes
   - Response: Empty (acknowledgment)

4. **Authorize** ✅
   - IdTag validation
   - Response: IdTagInfo (status, expiry, parent)

5. **StartTransaction** ✅
   - Begin charging session
   - Connector ID, IdTag, meter start
   - Response: Transaction ID

6. **MeterValues** ✅
   - Periodic energy readings (every 30-60 seconds)
   - Sampled values: Energy, Power, Voltage, Current
   - Response: Empty (acknowledgment)

7. **StopTransaction** ✅
   - End charging session
   - Transaction ID, meter stop, reason
   - Response: IdTagInfo

---

### From CSMS (Outgoing Commands)

1. **RemoteStartTransaction** ✅
   - Start charging remotely (from app)
   - Connector ID, IdTag, charging profile

2. **RemoteStopTransaction** ✅
   - Stop charging remotely
   - Transaction ID

3. **UnlockConnector** ✅
   - Unlock connector (for cable release)
   - Connector ID

4. **ChangeAvailability** ✅
   - Set connector/charge point availability
   - Connector ID (0 for charge point), availability type

5. **GetConfiguration** ✅
   - Retrieve configuration keys
   - Key list (empty for all)

6. **ChangeConfiguration** ✅
   - Update configuration keys
   - Key, value

---

## 🔄 OCPP-SPECIFIC REQUIREMENTS

### 1. Ordering and Idempotency
- **Start/StopTransaction ordering**: Ensure proper sequencing per transactionId
- **Deduplication**: Handle reconnection scenarios
- **Replay-safe strategy**: Use transactionId + timestamp for idempotency

### 2. Time Handling
- **Format**: ISO 8601 (UTC)
- **Storage**: Always UTC in database
- **Normalization**: Handle incomplete timestamps

### 3. Connector Semantics
- **ConnectorId 0**: Charge point level (not a real connector)
- **ConnectorId 1..N**: Actual connectors
- **Enforcement**: Validate in API and UI

### 4. Authorization Cache
- **Update on**: Authorize, StartTransaction, StopTransaction responses
- **Storage**: Redis for fast lookups
- **TTL**: Based on expiry date

### 5. Status Model
- **Full status set**: Available, Preparing, Charging, SuspendedEVSE, SuspendedEV, Finishing, Reserved, Unavailable, Faulted
- **Error codes**: Track errorCode and vendorErrorCode
- **Connector 0 limitations**: Cannot have transactions

### 6. Metering
- **Parse**: SampledValue arrays
- **Defaults**: measurand/unit when absent
- **Support**: Phases and locations
- **Normalize**: Units to Wh, A, V, W

### 7. Configuration Management
**Keys to support**:
- `HeartbeatInterval`
- `MeterValueSampleInterval`
- `MeterValuesSampledData`
- `NumberOfConnectors`
- `ConnectionTimeOut`
- `MinimumStatusDuration`

---

## 🗄️ DATA MODEL (Enhanced)

### Core Tables

#### ChargePoint
```sql
- id (PK)
- charge_point_id (unique, e.g., "CP001")
- vendor
- model
- serial_number
- firmware_version
- iccid (4G SIM card ID)
- imsi (4G network ID)
- last_seen (timestamp)
- heartbeat_interval
- supported_profiles (JSON array)
- status (enum)
- created_at, updated_at
```

#### Connector
```sql
- id (PK)
- charge_point_id (FK)
- connector_id (1..N, NOT 0)
- connector_type
- power_rating_kw
- status (enum)
- error_code
- vendor_error_code
- last_status_at
- created_at, updated_at
```

#### Transaction
```sql
- id (PK)
- transaction_id (unique, from OCPP)
- charge_point_id (FK)
- connector_id (NOT 0)
- id_tag
- user_id (FK, nullable)
- meter_start (Wh)
- meter_stop (Wh, nullable)
- start_time (UTC)
- stop_time (UTC, nullable)
- total_energy_kwh
- duration_minutes
- total_cost
- currency
- status (enum)
- reason (enum: Local, Remote, EVDisconnected, etc.)
- reservation_id (nullable, for future)
- created_at, updated_at
```

#### MeterSample (Enhanced)
```sql
- id (PK)
- transaction_id (FK, nullable - for non-transaction samples)
- charge_point_id (FK)
- connector_id
- timestamp (UTC)
- measurand (e.g., "Energy.Active.Import.Register")
- location (e.g., "Outlet", "Inlet", "Body")
- phase (e.g., "L1", "L2", "L3", nullable)
- unit (e.g., "Wh", "W", "V", "A")
- value (DECIMAL)
- context (e.g., "Sample.Periodic", "Sample.Clock")
- format (e.g., "Raw", "SignedData")
- created_at
```

#### IdTag
```sql
- id (PK)
- id_tag (unique)
- user_id (FK, nullable)
- parent_id_tag (nullable)
- status (enum: Active, Blocked, Expired, Invalid)
- expiry_date (nullable)
- created_at, updated_at
```

#### ConfigKey
```sql
- id (PK)
- charge_point_id (FK, nullable - null = global)
- key (e.g., "HeartbeatInterval")
- value (text)
- readonly (boolean)
- created_at, updated_at
```

#### ChargingProfile (Stub for Future)
```sql
- id (PK)
- charge_point_id (FK)
- connector_id (nullable)
- transaction_id (FK, nullable)
- stack_level
- charging_profile_purpose (enum)
- charging_profile_kind (enum)
- valid_from (nullable)
- valid_to (nullable)
- charging_schedule (JSON)
- created_at, updated_at
```

#### FirmwareJob (Future)
```sql
- id (PK)
- charge_point_id (FK)
- location (URL)
- retrieve_date
- retry_interval
- retries
- status (enum)
- created_at, updated_at
```

#### DiagnosticsJob (Future)
```sql
- id (PK)
- charge_point_id (FK)
- location (URL)
- start_time
- stop_time
- status (enum)
- created_at, updated_at
```

---

## 🔌 SERVICE INTERFACES

### ocpp-gateway → csms-api

**Communication Methods**:
1. **REST API** (preferred for request/response)
2. **Redis Pub/Sub** (for events)

**Events to Send**:
- `charge_point.boot` - BootNotification received
- `charge_point.status` - StatusNotification received
- `transaction.start` - StartTransaction received
- `transaction.stop` - StopTransaction received
- `meter.values` - MeterValues received
- `authorize.request` - Authorize received (for validation)

**REST Endpoints to Call**:
- `POST /api/internal/charge-points` - Upsert charge point
- `POST /api/internal/transactions` - Create/update transaction
- `POST /api/internal/meter-values` - Store meter values
- `GET /api/internal/authorize/:idTag` - Validate IdTag

---

### csms-api → ocpp-gateway

**Command Channel**:
- **Redis Pub/Sub** or **REST API** with request/response pattern

**Commands to Send**:
- `RemoteStartTransaction` - Start charging
- `RemoteStopTransaction` - Stop charging
- `UnlockConnector` - Unlock connector
- `ChangeAvailability` - Change availability
- `ChangeConfiguration` - Update configuration
- `GetConfiguration` - Get configuration

**Pattern**:
```typescript
// Request
{
  chargePointId: "CP001",
  command: "RemoteStartTransaction",
  payload: { connectorId: 1, idTag: "USER123" },
  requestId: "req-123"
}

// Response (with timeout)
{
  requestId: "req-123",
  status: "Accepted" | "Rejected",
  payload: { ... }
}
```

---

## 🔐 AUTHENTICATION

### Between Services
- **Shared service token** (JWT or API key)
- **Internal network only** (Docker network)
- **No external exposure** of internal services

### Frontend Authentication
- **JWT tokens** for user sessions
- **Role-based access**: Admin, Operator, Customer
- **Token refresh** mechanism

---

## 🐳 DOCKER COMPOSE SETUP

### Services:
1. `ocpp-gateway` - OCPP WebSocket server
2. `csms-api` - NestJS REST API
3. `frontend` - React app
4. `postgres` - PostgreSQL database
5. `redis` - Redis cache/queue
6. `minio` - MinIO object storage
7. `nginx` - Reverse proxy
8. `pgadmin` - Database GUI (optional)

### Volumes:
- `postgres_data` - Database persistence
- `redis_data` - Redis persistence
- `minio_data` - Object storage
- `pgadmin_data` - pgAdmin data

### Networks:
- `ev-billing-network` - Bridge network for all services

---

## 🔄 OPERATIONAL BEHAVIORS

### Reconnect Handling
- **Tolerate reconnections**: Don't crash on duplicate messages
- **Resume session state**: Maintain connection state
- **Idempotency**: Handle duplicate Start/StopTransaction

### Backoff/Retries
- **Respect OCPP settings**: TransactionMessageAttempts, RetryInterval
- **Log retries**: Track retry attempts
- **Timeout handling**: Set reasonable timeouts

### Error Handling
- **Never drop malformed PDUs**: Log and reply with proper OCPP error
- **Store raw frames**: In dev mode, store raw OCPP messages for debugging
- **Proper error codes**: Use OCPP error codes (NotImplemented, InternalError, etc.)

### Observability
- **Correlation IDs**: Use chargePointId + messageId
- **Health endpoints**: `/health` for gateway and API
- **Logging**: Structured logs with correlation IDs
- **Metrics**: Future - Prometheus (not required for MVP)

---

## 🎨 FRONTEND SCREENS (MVP)

### 1. Operations Dashboard (`/ops`)
**Must-Have Features**:
- ✅ List of charge points with live status
- ✅ Connector status per charge point
- ✅ Last seen timestamp
- ✅ Active session count
- ✅ Detail drawer:
  - Recent events
  - Start/stop buttons
  - Unlock connector
  - Change availability
  - Configuration view

### 2. Sessions List (`/ops/sessions`)
**Must-Have Features**:
- ✅ Active sessions (real-time)
- ✅ Recent sessions (history)
- ✅ Columns: kWh, start/stop times, IdTag, connector
- ✅ Filter by charge point, date range
- ✅ Transaction details

### 3. Device Inventory (`/ops/devices`)
**Must-Have Features**:
- ✅ Charge point list from BootNotification
- ✅ Vendor, model, serial number, firmware
- ✅ Configuration keys view (read-only in MVP)
- ✅ Edit configuration (future)

### 4. Admin Dashboard (`/admin`)
- Station management
- User management
- System configuration
- Reports and analytics

### 5. Customer Portal (`/`)
- Account management
- Charging history
- Payments
- Start/stop charging

### 6. Public Station Finder (`/stations`)
- Find nearby stations
- View availability
- No login required

---

## 🧪 TESTING PLAN

### Phase 1: OCPP Simulator
- Use open-source OCPP 1.6J simulator
- Test all MVP messages
- Validate message handling
- Test error scenarios

### Phase 2: Local Hardware Testing
- Use ngrok to expose local server
- Configure hardware with ngrok URL
- Test actual connection
- Verify all messages work

### Phase 3: Scenarios to Test
1. ✅ First connect + BootNotification accepted
2. ✅ Start/Stop transaction with meter values
3. ✅ RemoteStartTransaction on Available → Charging
4. ✅ UnlockConnector on Faulted/Finishing states
5. ✅ ChangeAvailability Inoperative (idle and charging)
6. ✅ Reconnection handling
7. ✅ Duplicate message handling

### Phase 4: Data Validation
- ✅ Confirm DB rows created/updated
- ✅ Verify UTC times
- ✅ Verify value units (Wh, W, V, A)
- ✅ Verify connector semantics (0 vs 1..N)

---

## 🚀 DEPLOYMENT PATH

### Local Development
1. Docker Compose up
2. All services on localhost
3. Hot reload enabled
4. Development tools (pgAdmin, MinIO console)

### Staging/Production
1. **Same Docker Compose** (with overrides)
2. **Switch to WSS**: TLS on NGINX
3. **Persistent storage**: External volumes or cloud storage
4. **Monitoring**: Add Prometheus, Grafana (future)
5. **Scaling**: Docker Swarm or Kubernetes (future)

---

## ⚠️ COMMON PITFALLS TO AVOID

1. ❌ **Treating connectorId 0 like a real connector** - It's not!
2. ❌ **Losing message context on reconnect** - Persist correlation and state
3. ❌ **Skipping UTC normalization** - Time drift breaks billing
4. ❌ **Overusing HTTP between services** - Use Redis pub/sub for events
5. ❌ **Not storing raw payloads in dev** - You'll need them for debugging

---

## 📝 FUTURE FEATURES (Don't Build Yet)

- Local Auth List (SendLocalList/GetLocalListVersion)
- Smart Charging (Set/ClearChargingProfile, GetCompositeSchedule)
- Firmware/Diagnostics (UpdateFirmware/GetDiagnostics)
- Reservations (ReserveNow/CancelReservation)
- Signed meter values
- Advanced analytics DB

---

## ✅ IMPLEMENTATION CHECKLIST

### Phase 1: Infrastructure
- [ ] Update docker-compose.yml with all services
- [ ] Add NGINX configuration
- [ ] Add MinIO service
- [ ] Update database schema
- [ ] Set up environment variables

### Phase 2: OCPP Gateway
- [ ] WebSocket server setup
- [ ] Connection manager
- [ ] Message router
- [ ] Implement all MVP message handlers
- [ ] Command channel to csms-api

### Phase 3: CSMS API
- [ ] NestJS setup
- [ ] Database models
- [ ] REST API endpoints
- [ ] Business logic services
- [ ] Integration with ocpp-gateway

### Phase 4: Frontend
- [ ] React app setup
- [ ] Operations dashboard
- [ ] Admin dashboard
- [ ] Customer portal
- [ ] Public station finder

### Phase 5: Testing
- [ ] OCPP simulator testing
- [ ] Hardware testing
- [ ] End-to-end testing
- [ ] Performance testing

---

## 🎯 SUMMARY

**Architecture**: Microservices with NGINX reverse proxy
**Backend**: NestJS (csms-api) + Node.js (ocpp-gateway)
**Frontend**: React with 3 dashboards (Admin, Ops, Customer)
**Database**: PostgreSQL + Redis + MinIO
**Protocol**: OCPP 1.6J over WebSocket
**Deployment**: Docker Compose (local → production)

**Ready to implement!** 🚀



