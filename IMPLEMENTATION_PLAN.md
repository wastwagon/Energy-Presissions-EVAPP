# Implementation Plan
## EV Charging Billing Software - OCPP 1.6J CSMS

**Status**: Architecture merged and ready for implementation

---

## 📋 PHASE 1: INFRASTRUCTURE SETUP

### 1.1 Docker Compose Configuration
- [x] Create merged docker-compose.yml with all services
- [x] Add NGINX reverse proxy
- [x] Add MinIO for object storage
- [x] Configure service dependencies
- [x] Set up environment variables
- [ ] Test all services start correctly

### 1.2 Database Schema
- [x] Core tables (charge_points, connectors, transactions, etc.)
- [x] Enhanced tables (meter_samples, config_keys, etc.)
- [x] Indexes and constraints
- [x] Triggers for updated_at
- [ ] Run migrations and verify schema

### 1.3 NGINX Configuration
- [x] Create nginx.conf
- [x] Create default.conf with routing
- [x] Configure WebSocket upgrade for /ocpp
- [x] Configure API routing for /api
- [x] Configure frontend routing for /
- [ ] Test routing works correctly

---

## 📋 PHASE 2: OCPP GATEWAY (Node.js + TypeScript)

### 2.1 Project Setup
- [ ] Initialize Node.js project with TypeScript
- [ ] Install dependencies (ws, express, redis, etc.)
- [ ] Set up project structure
- [ ] Configure Dockerfile.dev
- [ ] Set up hot reload (nodemon/ts-node-dev)

### 2.2 WebSocket Server
- [ ] Create WebSocket server on port 9000
- [ ] Handle WebSocket connections
- [ ] Extract charge point ID from URL
- [ ] Implement connection authentication
- [ ] Store active connections

### 2.3 Connection Manager
- [ ] Track active connections
- [ ] Handle reconnections
- [ ] Manage connection state
- [ ] Store connection metadata
- [ ] Update database on connect/disconnect

### 2.4 Message Router
- [ ] Parse JSON-RPC 2.0 messages
- [ ] Validate message format
- [ ] Route to appropriate handler
- [ ] Handle message IDs and correlation
- [ ] Log raw messages (dev mode)

### 2.5 OCPP Message Handlers (Incoming)

#### BootNotification
- [ ] Parse BootNotification payload
- [ ] Validate charge point
- [ ] Upsert charge point in database
- [ ] Send BootNotificationResponse
- [ ] Update connection state

#### Heartbeat
- [ ] Parse Heartbeat
- [ ] Update last_seen timestamp
- [ ] Send HeartbeatResponse with current time
- [ ] Update connection state

#### StatusNotification
- [ ] Parse StatusNotification
- [ ] Update connector status in database
- [ ] Handle connector 0 (charge point level)
- [ ] Store error codes
- [ ] Publish event to csms-api
- [ ] Send empty response

#### Authorize
- [ ] Parse Authorize request
- [ ] Call csms-api to validate IdTag
- [ ] Get IdTagInfo from cache or database
- [ ] Send AuthorizeResponse
- [ ] Update authorization cache

#### StartTransaction
- [ ] Parse StartTransaction
- [ ] Validate connector (not 0)
- [ ] Call csms-api to create transaction
- [ ] Get transaction ID
- [ ] Send StartTransactionResponse
- [ ] Update authorization cache

#### MeterValues
- [ ] Parse MeterValues
- [ ] Extract SampledValue arrays
- [ ] Normalize units (Wh, W, V, A)
- [ ] Store meter samples in database
- [ ] Publish event to csms-api
- [ ] Send empty response

#### StopTransaction
- [ ] Parse StopTransaction
- [ ] Validate transaction ID
- [ ] Call csms-api to finalize transaction
- [ ] Send StopTransactionResponse
- [ ] Update authorization cache

### 2.6 OCPP Commands (Outgoing)

#### RemoteStartTransaction
- [ ] Receive command from csms-api
- [ ] Validate charge point connection
- [ ] Send RemoteStartTransaction to charge point
- [ ] Wait for response
- [ ] Return status to csms-api

#### RemoteStopTransaction
- [ ] Receive command from csms-api
- [ ] Validate transaction exists
- [ ] Send RemoteStopTransaction to charge point
- [ ] Wait for response
- [ ] Return status to csms-api

#### UnlockConnector
- [ ] Receive command from csms-api
- [ ] Send UnlockConnector to charge point
- [ ] Wait for response
- [ ] Return status to csms-api

#### ChangeAvailability
- [ ] Receive command from csms-api
- [ ] Send ChangeAvailability to charge point
- [ ] Wait for response
- [ ] Return status to csms-api

#### GetConfiguration
- [ ] Receive command from csms-api
- [ ] Send GetConfiguration to charge point
- [ ] Wait for response
- [ ] Store configuration keys
- [ ] Return to csms-api

#### ChangeConfiguration
- [ ] Receive command from csms-api
- [ ] Validate key and value
- [ ] Send ChangeConfiguration to charge point
- [ ] Wait for response
- [ ] Update database
- [ ] Return status to csms-api

### 2.7 Communication with CSMS-API
- [ ] Set up REST client for csms-api
- [ ] Set up Redis pub/sub (optional)
- [ ] Implement event publishing
- [ ] Implement command receiving
- [ ] Handle timeouts and retries

### 2.8 Error Handling
- [ ] Handle malformed messages
- [ ] Send proper OCPP error responses
- [ ] Log errors with correlation IDs
- [ ] Handle connection errors
- [ ] Handle timeout errors

---

## 📋 PHASE 3: CSMS API (NestJS + TypeScript)

### 3.1 Project Setup
- [ ] Initialize NestJS project
- [ ] Install dependencies
- [ ] Set up project structure
- [ ] Configure TypeORM or Prisma
- [ ] Configure Dockerfile.dev
- [ ] Set up hot reload

### 3.2 Database Integration
- [ ] Set up database connection
- [ ] Create entity models
- [ ] Set up migrations
- [ ] Configure repositories
- [ ] Test database operations

### 3.3 Authentication & Authorization
- [ ] Set up JWT authentication
- [ ] Create auth module
- [ ] Implement login/register
- [ ] Implement role-based access (Admin, Operator, Customer)
- [ ] Set up guards and decorators

### 3.4 REST API Endpoints

#### Charge Points
- [ ] GET /api/charge-points - List all
- [ ] GET /api/charge-points/:id - Get one
- [ ] POST /api/charge-points - Create
- [ ] PUT /api/charge-points/:id - Update
- [ ] DELETE /api/charge-points/:id - Delete
- [ ] GET /api/charge-points/:id/status - Get status
- [ ] POST /api/charge-points/:id/change-availability - Change availability

#### Connectors
- [ ] GET /api/charge-points/:id/connectors - List connectors
- [ ] GET /api/charge-points/:id/connectors/:connectorId - Get connector
- [ ] POST /api/charge-points/:id/connectors/:connectorId/unlock - Unlock

#### Transactions
- [ ] GET /api/transactions - List all
- [ ] GET /api/transactions/:id - Get one
- [ ] GET /api/transactions/active - Get active
- [ ] POST /api/transactions/:id/stop - Stop transaction
- [ ] GET /api/transactions/:id/meter-values - Get meter values

#### Users
- [ ] GET /api/users - List all (admin)
- [ ] GET /api/users/:id - Get one
- [ ] POST /api/users - Create
- [ ] PUT /api/users/:id - Update
- [ ] DELETE /api/users/:id - Delete

#### IdTags
- [ ] GET /api/id-tags - List all
- [ ] GET /api/id-tags/:idTag - Get one
- [ ] POST /api/id-tags - Create
- [ ] PUT /api/id-tags/:idTag - Update
- [ ] DELETE /api/id-tags/:idTag - Delete

#### Billing
- [ ] GET /api/billing/transactions - List transactions
- [ ] GET /api/billing/invoices - List invoices
- [ ] GET /api/billing/invoices/:id - Get invoice
- [ ] POST /api/billing/invoices/:id/pay - Pay invoice

#### Reports
- [ ] GET /api/reports/revenue - Revenue report
- [ ] GET /api/reports/energy - Energy consumption
- [ ] GET /api/reports/usage - Usage patterns
- [ ] GET /api/reports/stations - Station utilization

#### Configuration
- [ ] GET /api/config - Get global config
- [ ] GET /api/config/:chargePointId - Get charge point config
- [ ] PUT /api/config/:chargePointId - Update config

### 3.5 Business Logic Services

#### Transaction Service
- [ ] Create transaction
- [ ] Update transaction
- [ ] Finalize transaction
- [ ] Calculate cost
- [ ] Process payment

#### Billing Service
- [ ] Calculate energy cost
- [ ] Calculate time cost
- [ ] Apply tariffs
- [ ] Generate invoice
- [ ] Process payment

#### User Service
- [ ] User management
- [ ] IdTag management
- [ ] Authorization validation
- [ ] Account balance management

#### Charge Point Service
- [ ] Charge point management
- [ ] Status tracking
- [ ] Configuration management
- [ ] Remote control commands

### 3.6 Communication with OCPP Gateway
- [ ] Set up REST client for ocpp-gateway
- [ ] Set up Redis pub/sub (optional)
- [ ] Implement command sending
- [ ] Handle responses
- [ ] Implement timeouts

### 3.7 Internal API Endpoints (for ocpp-gateway)
- [ ] POST /api/internal/charge-points - Upsert charge point
- [ ] POST /api/internal/transactions - Create/update transaction
- [ ] POST /api/internal/meter-values - Store meter values
- [ ] GET /api/internal/authorize/:idTag - Validate IdTag

---

## 📋 PHASE 4: FRONTEND (React + TypeScript)

### 4.1 Project Setup
- [ ] Initialize React project with TypeScript
- [ ] Install dependencies
- [ ] Set up project structure
- [ ] Configure routing (React Router)
- [ ] Set up state management (Redux Toolkit or Zustand)
- [ ] Configure Dockerfile.dev

### 4.2 Authentication
- [ ] Login page
- [ ] Register page
- [ ] JWT token management
- [ ] Protected routes
- [ ] Role-based access

### 4.3 Operations Dashboard (`/ops`)
- [ ] Charge point list
- [ ] Live status indicators
- [ ] Last seen timestamps
- [ ] Active session count
- [ ] Detail drawer:
  - Recent events
  - Start/stop buttons
  - Unlock connector
  - Change availability
  - Configuration view

### 4.4 Sessions List (`/ops/sessions`)
- [ ] Active sessions table
- [ ] Recent sessions table
- [ ] Columns: kWh, times, IdTag, connector
- [ ] Filters (charge point, date range)
- [ ] Transaction details modal

### 4.5 Device Inventory (`/ops/devices`)
- [ ] Charge point list
- [ ] BootNotification data display
- [ ] Configuration keys view (read-only)
- [ ] Edit configuration (future)

### 4.6 Admin Dashboard (`/admin`)
- [ ] Station management
- [ ] User management
- [ ] System configuration
- [ ] Reports and analytics

### 4.7 Customer Portal (`/`)
- [ ] Account management
- [ ] Charging history
- [ ] Payments
- [ ] Start/stop charging

### 4.8 Public Station Finder (`/stations`)
- [ ] Map view
- [ ] List view
- [ ] Filter by availability
- [ ] Station details

### 4.9 Real-time Updates
- [ ] WebSocket client setup
- [ ] Subscribe to charge point updates
- [ ] Subscribe to transaction updates
- [ ] Update UI in real-time

---

## 📋 PHASE 5: TESTING

### 5.1 OCPP Simulator Testing
- [ ] Set up OCPP simulator
- [ ] Test BootNotification
- [ ] Test Heartbeat
- [ ] Test StatusNotification
- [ ] Test Authorize
- [ ] Test StartTransaction
- [ ] Test MeterValues
- [ ] Test StopTransaction
- [ ] Test RemoteStartTransaction
- [ ] Test RemoteStopTransaction
- [ ] Test UnlockConnector
- [ ] Test ChangeAvailability
- [ ] Test GetConfiguration
- [ ] Test ChangeConfiguration

### 5.2 Integration Testing
- [ ] Test ocpp-gateway → csms-api communication
- [ ] Test csms-api → ocpp-gateway commands
- [ ] Test database operations
- [ ] Test Redis operations
- [ ] Test MinIO operations

### 5.3 End-to-End Testing
- [ ] Complete transaction flow
- [ ] Remote start/stop flow
- [ ] Configuration change flow
- [ ] Error handling scenarios

### 5.4 Hardware Testing
- [ ] Set up ngrok tunnel
- [ ] Configure hardware with ngrok URL
- [ ] Test actual connection
- [ ] Test all OCPP messages
- [ ] Test reconnection handling

---

## 📋 PHASE 6: DEPLOYMENT

### 6.1 Production Configuration
- [ ] Update environment variables
- [ ] Configure TLS/SSL
- [ ] Set up domain names
- [ ] Configure firewall
- [ ] Set up monitoring

### 6.2 Database Migration
- [ ] Backup existing data
- [ ] Run migrations
- [ ] Verify data integrity

### 6.3 Deployment
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor logs
- [ ] Handle issues

---

## 🎯 PRIORITY ORDER

### Week 1-2: Infrastructure & OCPP Gateway Core
1. Set up Docker Compose
2. Set up database schema
3. Set up NGINX
4. Build OCPP Gateway WebSocket server
5. Implement BootNotification and Heartbeat

### Week 3-4: OCPP Message Handlers
1. Implement all incoming message handlers
2. Implement command sending
3. Test with OCPP simulator

### Week 5-6: CSMS API
1. Set up NestJS project
2. Implement REST API endpoints
3. Implement business logic
4. Integrate with OCPP Gateway

### Week 7-8: Frontend - Operations Dashboard
1. Set up React project
2. Build Operations Dashboard
3. Build Sessions List
4. Build Device Inventory

### Week 9-10: Frontend - Admin & Customer
1. Build Admin Dashboard
2. Build Customer Portal
3. Build Public Station Finder

### Week 11-12: Testing & Polish
1. OCPP simulator testing
2. Integration testing
3. Hardware testing
4. Bug fixes
5. Documentation

---

## ✅ SUCCESS CRITERIA

- [ ] All services start with Docker Compose
- [ ] OCPP Gateway accepts connections
- [ ] All MVP OCPP messages work
- [ ] Operations dashboard shows live data
- [ ] Transactions are created and finalized correctly
- [ ] Billing calculations are accurate
- [ ] Remote start/stop works
- [ ] System handles reconnections
- [ ] All dashboards are functional

---

**Ready to start implementation!** 🚀



