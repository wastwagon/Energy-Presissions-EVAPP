# System Structure and Flow
## EV Charging Billing Software - Complete Architecture Documentation

---

## 📐 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Service Breakdown](#service-breakdown)
4. [Component Structure](#component-structure)
5. [Data Flow](#data-flow)
6. [User Flows](#user-flows)
7. [API Structure](#api-structure)
8. [Database Schema](#database-schema)
9. [Communication Patterns](#communication-patterns)
10. [Authentication & Authorization](#authentication--authorization)
11. [OCPP Message Flow](#ocpp-message-flow)
12. [Frontend Structure](#frontend-structure)
13. [Backend Structure](#backend-structure)
14. [Deployment Architecture](#deployment-architecture)

---

## 🎯 System Overview

### Purpose
A multi-tenant EV Charging Station Management System (CSMS) that supports OCPP 1.6J protocol for managing charging stations, processing transactions, handling billing, and providing comprehensive dashboards for different user roles.

### Key Features
- **OCPP 1.6J Protocol Support**: Full WebSocket-based communication with charge points
- **Multi-Tenancy**: White-label support for multiple charging center operators
- **Role-Based Access Control**: SuperAdmin, Admin, and Customer roles
- **Billing System**: Energy-based, time-based, and flat-rate pricing
- **Payment Processing**: Paystack integration (Ghana Cedis) + Cash payments
- **Wallet System**: User wallet with admin top-up capabilities
- **Real-time Monitoring**: WebSocket updates for live status
- **Command Queue**: Offline command handling with retry logic
- **Advanced OCPP Features**: Smart Charging, Firmware Management, Diagnostics

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   Web Browser    │  │  Mobile App      │  │  Charge Points   │     │
│  │   (React SPA)    │  │  (Future)        │  │  (OCPP 1.6J)     │     │
│  │                  │  │                  │  │                  │     │
│  │  - Customer      │  │  - iOS/Android   │  │  - WebSocket     │     │
│  │  - Admin         │  │  - React Native  │  │  - JSON-RPC 2.0  │     │
│  │  - SuperAdmin    │  │                  │  │  - 4G Network    │     │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘     │
│           │                      │                      │                │
│           │ HTTPS/REST           │ HTTPS/REST           │ WebSocket      │
│           │ WebSocket            │                      │                │
└───────────┼──────────────────────┼──────────────────────┼────────────────┘
            │                      │                      │
┌───────────▼─────────────────────────────────────────────────────────────┐
│                        NGINX REVERSE PROXY                               │
│                        (Port 8080/8443)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Routes:                                                                │
│  • /              → Frontend (React)                                    │
│  • /api           → CSMS API (NestJS)                                   │
│  • /ocpp          → OCPP Gateway (WebSocket)                            │
│  • /docs          → Swagger API Documentation                           │
│                                                                          │
└───────────┬──────────────────────┬──────────────────────┬───────────────┘
            │                      │                      │
┌───────────▼──────────┐  ┌────────▼──────────┐  ┌───────▼──────────────┐
│   FRONTEND           │  │   CSMS API        │  │   OCPP GATEWAY       │
│   (React + TS)       │  │   (NestJS + TS)   │  │   (Node.js + TS)     │
│                      │  │                   │  │                      │
│  Port: 3001          │  │  Port: 3000       │  │  Port: 9000          │
│                      │  │                   │  │                      │
│  • Customer Portal   │  │  • REST API       │  │  • WebSocket Server  │
│  • Admin Dashboard   │  │  • Business Logic │  │  • OCPP Handlers     │
│  • SuperAdmin        │  │  • Auth (JWT)     │  │  • Message Router    │
│  • Operations        │  │  • Billing        │  │  • Connection Mgr    │
│  • WebSocket Client  │  │  • Payments       │  │  • Command Manager   │
│                      │  │  • Wallet         │  │  • Tenant Resolver   │
└──────────────────────┘  └────────┬──────────┘  └──────────┬───────────┘
                                    │                        │
                                    │ REST / Redis Pub/Sub   │
                                    │                        │
                    ┌───────────────┴────────────────────────┘
                    │
┌───────────────────▼─────────────────────────────────────────────────────┐
│                         DATA & STORAGE LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  PostgreSQL  │  │    Redis     │  │    MinIO     │                 │
│  │  (Port 5432) │  │  (Port 6379) │  │  (Port 9002) │                 │
│  │              │  │              │  │              │                 │
│  │  • Primary   │  │  • Cache     │  │  • Firmware  │                 │
│  │    Database  │  │  • Pub/Sub   │  │  • Logos     │                 │
│  │  • All       │  │  • Queue     │  │  • Reports   │                 │
│  │    Entities  │  │  • Sessions  │  │  • Invoices  │                 │
│  └──────────────┘  └──────────────┘  └──────────────┘                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼─────────────────────────────────────┐
│                      EXTERNAL SERVICES                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐                                                       │
│  │   Paystack   │  Payment Gateway (Ghana - GHS)                       │
│  │   API        │                                                       │
│  └──────────────┘                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Service Breakdown

### 1. NGINX Reverse Proxy
**Container**: `ev-billing-nginx`  
**Port**: 8080 (HTTP), 8443 (HTTPS)  
**Purpose**: Single entry point, routing, SSL termination

**Responsibilities**:
- Route `/` → Frontend
- Route `/api/*` → CSMS API
- Route `/ocpp/*` → OCPP Gateway (WebSocket upgrade)
- Route `/docs` → Swagger documentation
- Load balancing (future)
- SSL/TLS termination (production)

**Configuration**: `nginx/conf.d/default.conf`

---

### 2. Frontend (React + TypeScript)
**Container**: `ev-billing-frontend`  
**Port**: 3001 (internal), exposed via NGINX  
**Framework**: React 18 + TypeScript + Vite  
**UI Library**: Material-UI (MUI)

**Structure**:
```
frontend/src/
├── App.tsx                    # Main router
├── layouts/                   # Dashboard layouts
│   ├── CustomerDashboardLayout.tsx
│   ├── AdminDashboardLayout.tsx
│   └── SuperAdminDashboardLayout.tsx
├── pages/                     # Page components
│   ├── user/                  # Customer pages
│   ├── admin/                 # Admin pages
│   ├── superadmin/            # SuperAdmin pages
│   ├── ops/                   # Operations pages
│   ├── tenant/                # Tenant pages
│   └── auth/                  # Login pages
├── services/                  # API clients
│   ├── api.ts                 # Base API client
│   ├── authApi.ts
│   ├── transactionsApi.ts
│   ├── chargePointsApi.ts
│   └── ...
├── components/                # Reusable components
├── hooks/                     # Custom React hooks
├── store/                     # State management
└── theme/                     # Theme configuration
```

**Dashboards**:
1. **Customer Dashboard** (`/user/dashboard`)
   - Wallet balance
   - Transaction history
   - Payment history
   - Profile management

2. **Admin Dashboard** (`/admin/dashboard`)
   - Operations overview
   - Sessions management
   - Device management
   - Tenant settings
   - Wallet management

3. **SuperAdmin Dashboard** (`/superadmin/dashboard`)
   - System-wide operations
   - Tenant management
   - System settings
   - Wallet management
   - CMS & Branding

4. **Operations Dashboard** (`/ops`)
   - Real-time charge point status
   - Active sessions
   - Device inventory
   - Connection logs

---

### 3. CSMS API (NestJS + TypeScript)
**Container**: `ev-billing-csms-api`  
**Port**: 3000 (internal), exposed via NGINX at `/api`  
**Framework**: NestJS 10+  
**ORM**: TypeORM  
**Database**: PostgreSQL

**Module Structure**:
```
backend/src/
├── app.module.ts              # Root module
├── main.ts                    # Application entry
├── auth/                      # Authentication
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   └── auth.service.ts
├── users/                     # User management
├── tenants/                   # Tenant management
│   ├── tenants.module.ts
│   ├── tenants.controller.ts
│   ├── tenants.service.ts
│   └── tenant-status.service.ts
├── charge-points/             # Charge point management
├── transactions/              # Transaction management
├── billing/                   # Billing calculations
├── payments/                  # Payment processing
├── wallet/                    # Wallet management
├── tariffs/                   # Pricing management
├── settings/                  # System settings
├── reservations/              # Connector reservations
├── local-auth-list/           # Local authorization list
├── smart-charging/            # Smart Charging profiles
├── firmware/                  # Firmware management
├── diagnostics/               # Diagnostics upload
├── connection-logs/           # Connection logging
├── internal/                  # Internal API (for OCPP Gateway)
├── websocket/                 # WebSocket gateway (for frontend)
├── services/                  # Shared services
│   └── command-queue.service.ts
└── entities/                  # TypeORM entities
    ├── user.entity.ts
    ├── tenant.entity.ts
    ├── charge-point.entity.ts
    ├── transaction.entity.ts
    └── ...
```

**Key Endpoints**:
- `POST /api/auth/login` - User authentication
- `GET /api/charge-points` - List charge points
- `GET /api/transactions` - List transactions
- `POST /api/transactions/:id/stop` - Stop transaction
- `POST /api/charge-points/:id/remote-start` - Remote start
- `POST /api/payments/paystack` - Paystack payment
- `GET /api/admin/tenants` - Tenant management (SuperAdmin)
- `PUT /api/admin/tenants/:id/status` - Change tenant status

---

### 4. OCPP Gateway (Node.js + TypeScript)
**Container**: `ev-billing-ocpp-gateway`  
**Port**: 9000 (internal), exposed via NGINX at `/ocpp`  
**Protocol**: OCPP 1.6J (JSON over WebSocket)

**Structure**:
```
ocpp-gateway/src/
├── index.ts                   # WebSocket server entry
├── handlers/                  # OCPP message handlers
│   ├── boot-notification.ts
│   ├── authorize.ts
│   ├── start-transaction.ts
│   ├── stop-transaction.ts
│   ├── meter-values.ts
│   ├── status-notification.ts
│   ├── heartbeat.ts
│   └── ...
├── services/
│   ├── connection-manager.ts  # WebSocket connections
│   ├── message-router.ts      # Route OCPP messages
│   ├── command-manager.ts     # Send commands to CPs
│   ├── connection-logger.ts   # Log connections
│   └── tenant-resolver.ts     # Resolve tenant from CP ID
├── types/
│   └── ocpp-message.ts        # OCPP message types
└── utils/
    └── logger.ts
```

**Responsibilities**:
- Accept WebSocket connections from charge points
- Parse and validate OCPP JSON-RPC 2.0 messages
- Route messages to appropriate handlers
- Forward events to CSMS API
- Send commands to charge points
- Manage connection state
- Handle tenant resolution
- Log all OCPP frames (dev mode)

**WebSocket URL**: `ws://localhost/ocpp/{chargePointId}`

---

### 5. PostgreSQL Database
**Container**: `ev-billing-postgres`  
**Port**: 5432  
**Version**: PostgreSQL 15

**Key Tables**:
- `users` - User accounts
- `tenants` - Multi-tenant organizations
- `charge_points` - Charging stations
- `connectors` - Connector details
- `transactions` - Charging sessions
- `meter_samples` - Energy readings
- `payments` - Payment records
- `invoices` - Generated invoices
- `wallet_transactions` - Wallet operations
- `tariffs` - Pricing rules
- `pending_commands` - Queued commands
- `connection_logs` - Connection events
- `config_keys` - OCPP configuration
- `charging_profiles` - Smart Charging
- `reservations` - Connector reservations
- `local_auth_list` - Local authorization
- `firmware_jobs` - Firmware updates
- `diagnostics_jobs` - Diagnostics uploads
- `system_settings` - System configuration
- `cms_content` - Frontend content
- `branding_assets` - Logos and assets

---

### 6. Redis
**Container**: `ev-billing-redis`  
**Port**: 6379  
**Purpose**: Cache, Pub/Sub, Queue

**Usage**:
- **Cache**: Tenant status, charge point status, user sessions
- **Pub/Sub**: Real-time event propagation
  - `tenant.status.changed` - Tenant status updates
  - `charge_point.status` - Charge point status changes
  - `transaction.started` - New transactions
  - `transaction.stopped` - Completed transactions
- **Queue**: Command queue for offline charge points
- **Sessions**: JWT token blacklist (future)

---

### 7. MinIO (S3-Compatible Storage)
**Container**: `ev-billing-minio`  
**Ports**: 9002 (API), 9001 (Console)  
**Purpose**: Object storage

**Stored Data**:
- Firmware files
- Diagnostics files
- Logos and branding assets
- Generated invoices (PDF)
- Reports and exports

---

## 🔄 Data Flow

### 1. Charge Point Connection Flow

```
Charge Point (4G Network)
    │
    │ WebSocket Connect
    │ ws://csms-server/ocpp/CP001
    ▼
OCPP Gateway
    │
    │ 1. Accept connection
    │ 2. Store connection state
    │ 3. Log connection event
    ▼
    │
    │ BootNotification
    │ [2, "msg-1", "BootNotification", {...}]
    ▼
OCPP Gateway Handler
    │
    │ 1. Parse message
    │ 2. Validate format
    │ 3. Resolve tenant (from chargePointId)
    │ 4. Check tenant status
    ▼
    │
    │ POST /api/internal/charge-points
    │ (Service token auth)
    ▼
CSMS API (Internal Endpoint)
    │
    │ 1. Upsert charge point
    │ 2. Create/update connectors
    │ 3. Store in PostgreSQL
    │ 4. Publish event to Redis
    ▼
    │
    │ Response: { status: "Accepted", ... }
    ▼
OCPP Gateway
    │
    │ [3, "msg-1", {...}]
    ▼
Charge Point
```

### 2. Transaction Start Flow

```
User plugs in EV
    │
    │ RFID Card / App
    ▼
Charge Point
    │
    │ Authorize Request
    │ [2, "auth-1", "Authorize", {idTag: "USER123"}]
    ▼
OCPP Gateway
    │
    │ POST /api/internal/authorize/USER123
    ▼
CSMS API
    │
    │ 1. Check user wallet
    │ 2. Validate IdTag
    │ 3. Check tenant status
    │ 4. Return authorization
    ▼
    │
    │ Response: { idTagInfo: {status: "Accepted"} }
    ▼
OCPP Gateway → Charge Point
    │
    │ [3, "auth-1", {idTagInfo: {status: "Accepted"}}]
    ▼
Charge Point
    │
    │ StartTransaction
    │ [2, "start-1", "StartTransaction", {...}]
    ▼
OCPP Gateway
    │
    │ POST /api/internal/transactions
    ▼
CSMS API
    │
    │ 1. Create transaction record
    │ 2. Reserve wallet amount
    │ 3. Store in PostgreSQL
    │ 4. Publish to Redis Pub/Sub
    │ 5. Emit WebSocket event to frontend
    ▼
    │
    │ Response: { transactionId: 123, ... }
    ▼
OCPP Gateway → Charge Point
    │
    │ [3, "start-1", {transactionId: 123, ...}]
    ▼
Charge Point starts charging
```

### 3. Meter Values Flow (During Charging)

```
Charge Point (Every 30 seconds)
    │
    │ MeterValues
    │ [2, "meter-1", "MeterValues", {
    │   transactionId: 123,
    │   meterValue: [{timestamp: "...", sampledValue: [...]}]
    │ }]
    ▼
OCPP Gateway
    │
    │ POST /api/internal/meter-values
    ▼
CSMS API
    │
    │ 1. Store meter samples
    │ 2. Update transaction energy
    │ 3. Calculate running cost
    │ 4. Publish to Redis Pub/Sub
    │ 5. Emit WebSocket event to frontend
    ▼
Frontend (Real-time update)
    │
    │ WebSocket: transaction.updated
    │ { transactionId: 123, energy: 5.5, cost: 12.50 }
    ▼
Dashboard shows live data
```

### 4. Transaction Stop Flow

```
User unplugs EV / Stop via App
    │
    ▼
Charge Point
    │
    │ StopTransaction
    │ [2, "stop-1", "StopTransaction", {
    │   transactionId: 123,
    │   meterStop: 5500,
    │   timestamp: "...",
    │   reason: "Local"
    │ }]
    ▼
OCPP Gateway
    │
    │ POST /api/internal/transactions/123/stop
    ▼
CSMS API
    │
    │ 1. Update transaction status
    │ 2. Finalize meter values
    │ 3. Calculate final cost
    │ 4. Process payment (wallet/Paystack)
    │ 5. Generate invoice
    │ 6. Update wallet balance
    │ 7. Publish to Redis Pub/Sub
    │ 8. Emit WebSocket event
    ▼
    │
    │ Response: { idTagInfo: {status: "Accepted"} }
    ▼
OCPP Gateway → Charge Point
    │
    │ [3, "stop-1", {idTagInfo: {status: "Accepted"}}]
    ▼
Transaction completed
```

### 5. Remote Start Flow (From Dashboard)

```
Admin clicks "Start Charging"
    │
    ▼
Frontend
    │
    │ POST /api/charge-points/CP001/remote-start
    │ { connectorId: 1, idTag: "USER123" }
    │ (JWT token in header)
    ▼
CSMS API
    │
    │ 1. Validate user (JWT)
    │ 2. Check tenant status
    │ 3. Check charge point online
    │ 4. Check connector availability
    │ 5. Validate IdTag
    │ 6. Check wallet balance
    ▼
    │
    │ If online:
    │   POST http://ocpp-gateway:9000/command/CP001
    │   { message: [2, "cmd-1", "RemoteStartTransaction", {...}] }
    │
    │ If offline:
    │   Queue command in pending_commands table
    ▼
OCPP Gateway
    │
    │ 1. Send OCPP message to charge point
    │ 2. Wait for response (timeout: 30s)
    │ 3. Return response
    ▼
    │
    │ Response: { status: "Accepted" }
    ▼
CSMS API → Frontend
    │
    │ { success: true, response: {...} }
    ▼
Dashboard shows success
```

### 6. Payment Flow (Paystack)

```
User initiates payment
    │
    ▼
Frontend
    │
    │ POST /api/payments/paystack
    │ { transactionId: 123, amount: 50.00 }
    │ (JWT token)
    ▼
CSMS API
    │
    │ 1. Validate transaction
    │ 2. Create payment record
    │ 3. Call Paystack API
    │    POST https://api.paystack.co/transaction/initialize
    │ 4. Store payment reference
    ▼
    │
    │ Response: { authorizationUrl: "https://..." }
    ▼
Frontend
    │
    │ Redirect to Paystack payment page
    ▼
User completes payment
    │
    ▼
Paystack
    │
    │ POST /api/payments/verify
    │ { reference: "pay_ref_123" }
    ▼
CSMS API
    │
    │ 1. Verify with Paystack
    │ 2. Update payment status
    │ 3. Update transaction payment status
    │ 4. If wallet payment: update wallet balance
    │ 5. Generate invoice
    ▼
    │
    │ Response: { success: true }
    ▼
Frontend shows success
```

---

## 👥 User Flows

### 1. Customer Flow

```
1. Customer Registration/Login
   │
   │ POST /api/auth/register
   │ POST /api/auth/login
   ▼
2. Access Customer Dashboard
   │
   │ GET /user/dashboard
   ▼
3. View Wallet Balance
   │
   │ GET /api/wallet/balance
   ▼
4. Top Up Wallet (Optional)
   │
   │ POST /api/payments/paystack
   │ → Paystack payment
   │ → Wallet credited
   ▼
5. Start Charging Session
   │
   │ Option A: RFID Card at charge point
   │   → Charge point sends Authorize
   │   → System validates
   │   → Transaction starts
   │
   │ Option B: Remote start from app
   │   → POST /api/charge-points/:id/remote-start
   │   → System sends RemoteStartTransaction
   │   → Charge point starts
   ▼
6. Monitor Charging (Real-time)
   │
   │ WebSocket: transaction.updated
   │ → Dashboard shows live energy/cost
   ▼
7. Stop Charging
   │
   │ Option A: Unplug (automatic)
   │   → Charge point sends StopTransaction
   │
   │ Option B: Remote stop
   │   → POST /api/transactions/:id/stop
   │   → System sends RemoteStopTransaction
   ▼
8. Payment Processing
   │
   │ → System calculates cost
   │ → Deducts from wallet OR
   │ → Generates payment link (Paystack)
   ▼
9. View Transaction History
   │
   │ GET /api/transactions
   │ → Dashboard shows all sessions
   ▼
10. Download Invoice
    │
    │ GET /api/invoices/:id/download
    │ → PDF invoice generated
```

### 2. Admin Flow

```
1. Admin Login
   │
   │ POST /api/auth/login
   │ (Admin credentials)
   ▼
2. Access Admin Dashboard
   │
   │ GET /admin/dashboard
   ▼
3. Monitor Operations
   │
   │ GET /admin/ops
   │ → View charge points status
   │ → View active sessions
   │ → View device inventory
   ▼
4. Manage Devices
   │
   │ GET /admin/ops/devices
   │ → View all charge points
   │ → Click device → Detail page
   │ → Remote control (start/stop/reset)
   │ → View connection logs
   ▼
5. Manage Sessions
   │
   │ GET /admin/ops/sessions
   │ → View active/completed sessions
   │ → Click session → Detail page
   │ → Remote stop if needed
   ▼
6. Manage Wallets
   │
   │ GET /admin/wallets
   │ → View all users
   │ → Select user
   │ → Top up wallet
   │ → Adjust balance
   │ → View transaction history
   ▼
7. Configure Tenant Settings
   │
   │ GET /tenant
   │ → Update business info
   │ → Upload logo
   │ → Configure receipt text
   │ → Save settings
   ▼
8. View Reports
   │
   │ GET /api/transactions?startDate=...&endDate=...
   │ → Export data
   │ → Generate reports
```

### 3. SuperAdmin Flow

```
1. SuperAdmin Login
   │
   │ POST /api/auth/login
   │ (SuperAdmin credentials)
   ▼
2. Access SuperAdmin Dashboard
   │
   │ GET /superadmin/dashboard
   ▼
3. Manage Tenants
   │
   │ GET /superadmin/tenants
   │ → View all tenants
   │ → Create new tenant
   │ → Edit tenant details
   │ → Change tenant status (active/suspended/disabled)
   │ → Login as tenant (impersonation)
   │ → View disablement history
   ▼
4. System Settings
   │
   │ GET /superadmin/settings
   │ → OCPP settings
   │ → Payment gateway config
   │ → Notification settings
   │ → System-wide parameters
   ▼
5. CMS & Branding
   │
   │ GET /superadmin/settings (CMS tab)
   │ → Update system name
   │ → Update description
   │ → Upload system logo
   │ → Manage branding assets
   ▼
6. Billing & Tariffs
   │
   │ GET /superadmin/settings (Billing tab)
   │ → Create/edit tariffs
   │ → Set pricing rules
   │ → Configure billing parameters
   ▼
7. Monitor All Operations
   │
   │ GET /superadmin/ops
   │ → System-wide charge points
   │ → All tenant sessions
   │ → Cross-tenant analytics
   ▼
8. Wallet Management
   │
   │ GET /superadmin/wallets
   │ → Manage all user wallets
   │ → System-wide wallet operations
```

---

## 🔌 API Structure

### Public Endpoints (No Auth)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/stations` - Public station finder

### Customer Endpoints (JWT Required)
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/transactions` - Get user transactions
- `GET /api/payments` - Get user payments
- `POST /api/payments/paystack` - Initiate Paystack payment
- `POST /api/charge-points/:id/remote-start` - Remote start
- `POST /api/transactions/:id/stop` - Remote stop

### Admin Endpoints (JWT + Admin Role)
- `GET /api/admin/charge-points` - List charge points (tenant-scoped)
- `GET /api/admin/transactions` - List transactions (tenant-scoped)
- `POST /api/admin/wallets/:userId/top-up` - Top up user wallet
- `PUT /api/admin/wallets/:userId/adjust` - Adjust wallet balance
- `GET /api/admin/tenant` - Get tenant details
- `PUT /api/admin/tenant` - Update tenant settings

### SuperAdmin Endpoints (JWT + SuperAdmin Role)
- `GET /api/admin/tenants` - List all tenants
- `POST /api/admin/tenants` - Create tenant
- `PUT /api/admin/tenants/:id` - Update tenant
- `PUT /api/admin/tenants/:id/status` - Change tenant status
- `POST /api/admin/tenants/:id/login` - Login as tenant
- `GET /api/admin/settings` - Get system settings
- `PUT /api/admin/settings/:key` - Update system setting
- `GET /api/admin/tariffs` - List all tariffs
- `POST /api/admin/tariffs` - Create tariff

### Internal Endpoints (Service Token)
- `POST /api/internal/charge-points` - Upsert charge point (from OCPP Gateway)
- `GET /api/internal/charge-points/:id/tenant` - Get tenant for charge point
- `POST /api/internal/transactions` - Create transaction (from OCPP Gateway)
- `POST /api/internal/transactions/:id/stop` - Stop transaction
- `POST /api/internal/meter-values` - Store meter values
- `GET /api/internal/authorize/:idTag` - Validate IdTag

---

## 🗄️ Database Schema

### Core Entities

#### Users
```sql
users
├── id (PK)
├── email (unique)
├── password_hash
├── first_name
├── last_name
├── phone
├── account_type (SuperAdmin, Admin, Customer, WalkIn)
├── status (Active, Inactive, Suspended)
├── tenant_id (FK → tenants)
├── balance (wallet balance)
├── currency (default: GHS)
└── created_at, updated_at
```

#### Tenants
```sql
tenants
├── id (PK)
├── name
├── slug (unique, URL-friendly)
├── domain (unique, for white-label)
├── status (active, suspended, disabled)
├── contact_email
├── contact_phone
├── address
├── business_name
├── business_registration_number
├── tax_id
├── logo_url
├── receipt_header_text
├── receipt_footer_text
├── support_email
├── support_phone
├── website_url
├── metadata (JSONB)
└── created_at, updated_at
```

#### Charge Points
```sql
charge_points
├── id (PK)
├── charge_point_id (unique, OCPP identifier)
├── tenant_id (FK → tenants)
├── vendor
├── model
├── serial_number
├── firmware_version
├── iccid (SIM card)
├── imsi (SIM card)
├── status (Available, Charging, Offline, Faulted)
├── last_seen
├── heartbeat_interval
├── location_address
├── latitude
├── longitude
└── created_at, updated_at
```

#### Transactions
```sql
transactions
├── id (PK)
├── transaction_id (unique, OCPP transaction ID)
├── charge_point_id (FK → charge_points)
├── connector_id
├── id_tag (FK → users)
├── start_time
├── stop_time
├── meter_start
├── meter_stop
├── total_energy_kwh
├── duration_minutes
├── status (Active, Completed, Cancelled, Failed)
├── total_cost
├── currency
├── payment_status (Pending, Paid, Failed)
├── reservation_id (nullable)
└── created_at, updated_at
```

#### Payments
```sql
payments
├── id (PK)
├── user_id (FK → users)
├── transaction_id (FK → transactions, nullable)
├── amount
├── currency
├── payment_method (Paystack, Wallet, Cash)
├── status (Pending, Succeeded, Failed)
├── paystack_reference (nullable)
├── paystack_response (JSONB, nullable)
└── created_at, updated_at
```

#### Wallet Transactions
```sql
wallet_transactions
├── id (PK)
├── user_id (FK → users)
├── type (TopUp, Payment, Refund, Adjustment)
├── amount
├── balance_before
├── balance_after
├── reference (payment reference, transaction ID, etc.)
├── note
└── created_at
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

```
1. User Login
   │
   │ POST /api/auth/login
   │ { email, password }
   ▼
2. CSMS API
   │
   │ 1. Validate credentials
   │ 2. Check user status
   │ 3. Check tenant status
   │ 4. Generate JWT token
   │    {
   │      userId: 1,
   │      email: "user@example.com",
   │      accountType: "Admin",
   │      tenantId: 1,
   │      iat: ...,
   │      exp: ...
   │    }
   ▼
3. Response
   │
   │ {
   │   token: "eyJhbGc...",
   │   user: { id, email, accountType, tenantId, ... }
   │ }
   ▼
4. Frontend
   │
   │ Store token in localStorage
   │ Store user in localStorage
   │ Include token in all API requests
   │ Authorization: Bearer {token}
```

### Authorization Flow

```
API Request
    │
    │ Authorization: Bearer {token}
    ▼
JWT Auth Guard
    │
    │ 1. Verify token signature
    │ 2. Check token expiration
    │ 3. Extract user info
    │ 4. Attach to request (req.user)
    ▼
Roles Guard (if applicable)
    │
    │ 1. Check @Roles() decorator
    │ 2. Verify user.accountType matches
    │ 3. Allow/deny request
    ▼
Tenant Status Guard
    │
    │ 1. Resolve tenantId (from user or domain)
    │ 2. Check tenant status (Redis cache)
    │ 3. If disabled: 403 Forbidden
    │ 4. If suspended: Allow read-only (GET)
    │ 5. If active: Allow all
    ▼
Controller Handler
    │
    │ Process request
    │ Return response
```

### Role Hierarchy

1. **SuperAdmin**
   - Full system access
   - Manage all tenants
   - System settings
   - Can impersonate tenants

2. **Admin**
   - Tenant-scoped access
   - Manage tenant's charge points
   - Manage tenant's users
   - Tenant settings
   - Wallet management (tenant users)

3. **Customer**
   - Own account only
   - View own transactions
   - Manage own wallet
   - Start/stop own charging

4. **WalkIn**
   - Cash payment only
   - No account required
   - Temporary transactions

---

## 📡 OCPP Message Flow

### Incoming Messages (Charge Point → CSMS)

```
1. BootNotification
   Purpose: Register charge point
   Handler: boot-notification.ts
   Actions:
     - Upsert charge point in database
     - Create/update connectors
     - Store vendor/model info
     - Set heartbeat interval
   Response: { status: "Accepted", currentTime, interval }

2. Heartbeat
   Purpose: Keep connection alive
   Handler: heartbeat.ts
   Actions:
     - Update last_seen timestamp
     - Log heartbeat
   Response: { currentTime }

3. StatusNotification
   Purpose: Connector status change
   Handler: status-notification.ts
   Actions:
     - Update connector status
     - Update charge point status
     - Emit WebSocket event to frontend
   Response: {} (empty)

4. Authorize
   Purpose: Validate IdTag
   Handler: authorize.ts
   Actions:
     - Call CSMS API to validate
     - Check wallet balance
     - Check tenant status
   Response: { idTagInfo: { status: "Accepted"|"Invalid"|"Blocked" } }

5. StartTransaction
   Purpose: Begin charging session
   Handler: start-transaction.ts
   Actions:
     - Create transaction record
     - Reserve wallet amount
     - Emit WebSocket event
   Response: { transactionId, idTagInfo }

6. MeterValues
   Purpose: Energy readings
   Handler: meter-values.ts
   Actions:
     - Store meter samples
     - Update transaction energy
     - Calculate running cost
     - Emit WebSocket event
   Response: {} (empty)

7. StopTransaction
   Purpose: End charging session
   Handler: stop-transaction.ts
   Actions:
     - Finalize transaction
     - Process payment
     - Generate invoice
     - Update wallet
     - Emit WebSocket event
   Response: { idTagInfo }
```

### Outgoing Messages (CSMS → Charge Point)

```
1. RemoteStartTransaction
   Purpose: Start charging remotely
   Trigger: Admin/User clicks "Start"
   Actions:
     - Send via OCPP Gateway
     - Wait for response
     - Handle timeout/offline
   Response: { status: "Accepted"|"Rejected" }

2. RemoteStopTransaction
   Purpose: Stop charging remotely
   Trigger: Admin/User clicks "Stop"
   Actions:
     - Send via OCPP Gateway
     - Wait for response
   Response: { status: "Accepted"|"Rejected" }

3. UnlockConnector
   Purpose: Unlock connector
   Trigger: Admin clicks "Unlock"
   Actions:
     - Send via OCPP Gateway
   Response: { status: "Unlocked"|"UnlockFailed" }

4. ChangeAvailability
   Purpose: Set connector available/unavailable
   Trigger: Admin changes availability
   Actions:
     - Send via OCPP Gateway
   Response: { status: "Accepted"|"Rejected"|"Scheduled" }

5. Reset
   Purpose: Reset charge point
   Trigger: Admin clicks "Reset"
   Actions:
     - Send Hard/Soft reset
   Response: { status: "Accepted"|"Rejected" }

6. ChangeConfiguration
   Purpose: Update OCPP config
   Trigger: Admin updates config
   Actions:
     - Send config key/value
   Response: { status: "Accepted"|"Rejected"|"NotSupported" }

7. GetConfiguration
   Purpose: Read OCPP config
   Trigger: Admin views config
   Actions:
     - Request config keys
   Response: { configurationKey: [...], unknownKey: [...] }
```

---

## 🎨 Frontend Structure

### Routing Structure

```
/ (Public)
├── /                    → HomePage (public)
├── /stations            → StationsPage (public)
│
├── /login/user          → UserLoginPage
├── /login/admin         → AdminLoginPage
├── /login/super-admin   → SuperAdminLoginPage
│
├── /user (Customer)
│   └── /dashboard       → CustomerDashboardPage
│
├── /admin (Admin)
│   ├── /dashboard       → AdminDashboardPage
│   ├── /ops             → AdminOperationsDashboard
│   ├── /ops/sessions    → AdminSessionsPage
│   ├── /ops/devices     → AdminDevicesPage
│   └── /wallets         → WalletManagementPage
│
├── /tenant (Admin)
│   └── /                → TenantSettingsPage
│
└── /superadmin (SuperAdmin)
    ├── /dashboard       → SuperAdminDashboardPage
    ├── /ops             → SuperAdminOperationsDashboard
    ├── /ops/sessions    → SuperAdminSessionsPage
    ├── /ops/devices     → SuperAdminDevicesPage
    ├── /settings        → AdminDashboard (System Settings)
    ├── /wallets         → WalletManagementPage
    ├── /tenants         → TenantManagementPage
    └── /tenant          → TenantSettingsPage
```

### Component Hierarchy

```
App.tsx
├── TenantStatusGuard
│   └── Routes
│       ├── MainLayout (Public)
│       │   ├── HomePage
│       │   └── StationsPage
│       │
│       ├── CustomerDashboardLayout
│       │   └── CustomerDashboardPage
│       │
│       ├── AdminDashboardLayout
│       │   ├── AdminDashboardPage
│       │   ├── AdminOperationsDashboard
│       │   ├── AdminSessionsPage
│       │   ├── AdminDevicesPage
│       │   ├── WalletManagementPage
│       │   └── TenantSettingsPage
│       │
│       └── SuperAdminDashboardLayout
│           ├── SuperAdminDashboardPage
│           ├── SuperAdminOperationsDashboard
│           ├── SuperAdminSessionsPage
│           ├── SuperAdminDevicesPage
│           ├── AdminDashboard (Settings)
│           ├── WalletManagementPage
│           ├── TenantManagementPage
│           └── TenantSettingsPage
```

### State Management

- **Local State**: React `useState` for component state
- **API State**: React Query or custom hooks for server state
- **WebSocket State**: Custom `websocketService` for real-time updates
- **Auth State**: localStorage for JWT token and user info
- **Tenant State**: localStorage for current tenant context

### WebSocket Integration

```typescript
// Frontend WebSocket Service
websocketService.connect('ws://localhost/api/ws')
websocketService.on('transaction.started', (data) => {
  // Update UI
})
websocketService.on('transaction.updated', (data) => {
  // Update transaction in real-time
})
websocketService.on('chargePoint.status', (data) => {
  // Update charge point status
})
```

---

## ⚙️ Backend Structure

### Module Organization

```
AppModule (Root)
├── ConfigModule (Global)
├── DatabaseModule
├── TypeOrmModule
│
├── AuthModule
│   └── JWT Strategy
│
├── UsersModule
│   ├── UsersController
│   ├── UsersService
│   └── User Entity
│
├── TenantsModule
│   ├── TenantsController
│   ├── TenantsService
│   ├── TenantStatusService
│   ├── Tenant Entity
│   └── TenantDisablement Entity
│
├── ChargePointsModule
│   ├── ChargePointsController
│   ├── ChargePointsService
│   ├── ChargePoint Entity
│   └── Connector Entity
│
├── TransactionsModule
│   ├── TransactionsController
│   ├── TransactionsService
│   ├── Transaction Entity
│   └── MeterSample Entity
│
├── BillingModule
│   ├── BillingController
│   ├── BillingService
│   └── Invoice Entity
│
├── PaymentsModule
│   ├── PaymentsController
│   ├── PaymentsService
│   └── Payment Entity
│
├── WalletModule
│   ├── WalletController
│   ├── WalletService
│   └── WalletTransaction Entity
│
├── InternalModule
│   └── InternalController (Service token auth)
│
├── WebSocketGateway
│   └── Real-time events to frontend
│
└── ... (Other modules)
```

### Service Communication

#### OCPP Gateway → CSMS API
- **Method**: REST API (HTTP)
- **Authentication**: Service token (Bearer token)
- **Endpoints**:
  - `POST /api/internal/charge-points` - Upsert charge point
  - `POST /api/internal/transactions` - Create transaction
  - `POST /api/internal/transactions/:id/stop` - Stop transaction
  - `POST /api/internal/meter-values` - Store meter values
  - `GET /api/internal/authorize/:idTag` - Validate IdTag
  - `GET /api/internal/charge-points/:id/tenant` - Get tenant

#### CSMS API → OCPP Gateway
- **Method**: REST API (HTTP)
- **Endpoint**: `POST http://ocpp-gateway:9000/command/{chargePointId}`
- **Payload**: `{ message: [2, messageId, action, payload] }`
- **Response**: `{ success: true, response: {...} }`

#### CSMS API → Frontend
- **Method**: WebSocket (Socket.io)
- **Events**:
  - `transaction.started` - New transaction
  - `transaction.updated` - Transaction updated (meter values)
  - `transaction.stopped` - Transaction completed
  - `chargePoint.status` - Charge point status changed
  - `connector.status` - Connector status changed

#### Redis Pub/Sub
- **Channels**:
  - `tenant.status.changed` - Tenant status updates
  - `charge_point.status` - Charge point status (optional)
  - `transaction.*` - Transaction events (optional)

---

## 🚀 Deployment Architecture

### Docker Compose Services

```
Services:
├── nginx (Reverse Proxy)
│   └── Ports: 8080, 8443
│
├── frontend (React)
│   └── Port: 3001 (internal)
│
├── csms-api (NestJS)
│   └── Port: 3000 (internal)
│
├── ocpp-gateway (Node.js)
│   └── Port: 9000 (internal)
│
├── postgres (Database)
│   └── Port: 5432
│
├── redis (Cache/Queue)
│   └── Port: 6379
│
├── minio (Object Storage)
│   └── Ports: 9002 (API), 9001 (Console)
│
├── pgadmin (Optional)
│   └── Port: 5050
│
└── redis-commander (Optional)
    └── Port: 8081
```

### Network Architecture

```
Docker Network: ev-billing-network
│
├── All services can communicate via service names
│   - frontend → csms-api: http://csms-api:3000
│   - csms-api → postgres: postgresql://postgres:5432
│   - csms-api → redis: redis://redis:6379
│   - ocpp-gateway → csms-api: http://csms-api:3000
│
└── External access via NGINX
    - http://localhost:8080 → NGINX
    - NGINX routes to appropriate service
```

### Environment Variables

**CSMS API**:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing secret
- `SERVICE_TOKEN` - Internal service authentication
- `PAYSTACK_SECRET_KEY` - Paystack API key
- `MINIO_ENDPOINT` - MinIO server

**OCPP Gateway**:
- `PORT` - WebSocket server port
- `REDIS_URL` - Redis connection
- `CSMS_API_URL` - CSMS API URL
- `SERVICE_TOKEN` - Service authentication token
- `LOG_RAW_FRAMES` - Enable OCPP frame logging

**Frontend** (Vite):
- `VITE_API_URL` - API base URL (e.g. `https://<api-host>/api`)
- `VITE_WS_URL` - Socket.IO URL for the browser (e.g. `wss://<api-host>/ws`); OCPP for charge points is separate (`/ocpp` on the same API when embedded)

---

## 📊 Data Flow Summary

### Charge Point Registration
```
Charge Point → OCPP Gateway → CSMS API → PostgreSQL
                                    ↓
                                 Redis Pub/Sub
                                    ↓
                              Frontend (WebSocket)
```

### Transaction Lifecycle
```
1. Start: Charge Point → OCPP Gateway → CSMS API → PostgreSQL
2. Meter Values: Charge Point → OCPP Gateway → CSMS API → PostgreSQL → Frontend
3. Stop: Charge Point → OCPP Gateway → CSMS API → PostgreSQL → Payment → Invoice
```

### Remote Commands
```
Frontend → CSMS API → OCPP Gateway → Charge Point
                ↓
         (If offline: Queue in PostgreSQL)
```

### Payment Processing
```
Frontend → CSMS API → Paystack API
                ↓
         Update Payment Status
                ↓
         Update Transaction
                ↓
         Update Wallet (if applicable)
                ↓
         Generate Invoice
```

---

## 🔒 Security Architecture

### Authentication Layers
1. **User Authentication**: JWT tokens (24h expiry)
2. **Service Authentication**: Service tokens (internal)
3. **Tenant Isolation**: Tenant ID in JWT + database queries

### Authorization Layers
1. **Role-Based**: SuperAdmin, Admin, Customer
2. **Tenant-Based**: Data scoped to tenant
3. **Status-Based**: Tenant status enforcement

### Data Protection
- Passwords: bcrypt hashing
- JWT tokens: Signed with secret
- API communication: HTTPS (production)
- Database: Encrypted connections
- Service tokens: Environment variables

---

## 📈 Scalability Considerations

### Horizontal Scaling
- **Frontend**: Stateless, can scale horizontally
- **CSMS API**: Stateless, can scale horizontally (shared Redis/DB)
- **OCPP Gateway**: Stateful (WebSocket connections), needs sticky sessions

### Database Scaling
- **Read Replicas**: For reporting/analytics
- **Connection Pooling**: TypeORM connection pool
- **Indexing**: Critical indexes on charge_point_id, transaction_id, etc.

### Caching Strategy
- **Redis Cache**: Tenant status, charge point status
- **In-Memory Cache**: OCPP Gateway connection state
- **CDN**: Static assets (production)

---

## 🧪 Testing Structure

### Unit Tests
- Service layer logic
- OCPP message handlers
- Billing calculations

### Integration Tests
- API endpoints
- Database operations
- OCPP Gateway → CSMS API communication

### E2E Tests
- User flows
- Transaction lifecycle
- Payment processing

---

## 📝 Key Files Reference

### Configuration
- `docker-compose.yml` - Service definitions
- `nginx/conf.d/default.conf` - NGINX routing
- `.env` - Environment variables

### Backend Entry Points
- `backend/src/main.ts` - NestJS application
- `backend/src/app.module.ts` - Root module
- `ocpp-gateway/src/index.ts` - WebSocket server

### Frontend Entry Points
- `frontend/src/main.tsx` - React application
- `frontend/src/App.tsx` - Router configuration

### Database
- `database/init/*.sql` - Schema initialization scripts

---

## 🔄 System Startup Flow

```
1. Docker Compose starts services
   │
   ├── PostgreSQL initializes
   │   └── Runs init scripts
   │
   ├── Redis starts
   │
   ├── MinIO starts
   │
   ├── CSMS API starts
   │   ├── Connects to PostgreSQL
   │   ├── Connects to Redis
   │   ├── Runs migrations
   │   └── Starts HTTP server (port 3000)
   │
   ├── OCPP Gateway starts
   │   ├── Connects to Redis
   │   ├── Connects to CSMS API
   │   └── Starts WebSocket server (port 9000)
   │
   ├── Frontend starts
   │   └── Starts dev server (port 3001)
   │
   └── NGINX starts
       └── Routes configured
```

---

## 📞 Communication Patterns

### Synchronous (Request/Response)
- REST API calls
- OCPP Gateway → CSMS API (internal)
- Frontend → CSMS API

### Asynchronous (Events)
- Redis Pub/Sub (tenant status)
- WebSocket (frontend real-time updates)
- OCPP messages (charge point communication)

### Queued (Offline Handling)
- PostgreSQL `pending_commands` table
- Processed when charge point comes online

---

This document provides a comprehensive overview of the system structure and flow. For specific implementation details, refer to the individual module documentation and code comments.



