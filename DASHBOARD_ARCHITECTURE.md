# Dashboard Architecture & Frontend URLs
## EV Charging Billing Software

---

## 🌐 FRONTEND URLS & ACCESS

### Development Environment (Local)

| Dashboard | URL | Port | Purpose |
|-----------|-----|------|---------|
| **Admin Dashboard** | http://localhost:3001/admin | 3001 | Station management, users, reports |
| **Customer Portal** | http://localhost:3001 | 3001 | User account, transactions, payments |
| **Public Station Finder** | http://localhost:3001/stations | 3001 | Find nearby charging stations (public) |

**Note**: All dashboards share the same React app but different routes/views.

### Production Environment

| Dashboard | URL | Purpose |
|-----------|-----|---------|
| **Admin Dashboard** | https://admin.yourevcharging.com | Admin access |
| **Customer Portal** | https://app.yourevcharging.com | Customer access |
| **Public Site** | https://yourevcharging.com | Public station finder |

---

## 📊 DASHBOARD BREAKDOWN

### 1. Admin Dashboard (Internal Use)
**URL**: `http://localhost:3001/admin`  
**Access**: Admin/Operator accounts only  
**Purpose**: Manage the entire charging network

**Features**:
- ✅ **Station Management**
  - View all charge points
  - Real-time status monitoring
  - Station configuration
  - Remote control (start/stop charging)
  - Diagnostics and troubleshooting
  
- ✅ **Transaction Monitoring**
  - Active transactions (real-time)
  - Transaction history
  - Transaction details and analytics
  - Search and filters
  
- ✅ **User Management**
  - User list and search
  - User details and editing
  - IdTag management
  - Account status management
  - Blacklist/whitelist
  
- ✅ **Billing & Payments**
  - Revenue reports
  - Payment processing
  - Invoice management
  - Refund handling
  
- ✅ **Reports & Analytics**
  - Revenue reports (daily, weekly, monthly)
  - Energy consumption reports
  - Station utilization
  - User activity
  - Usage patterns
  - Peak hours analysis
  
- ✅ **System Configuration**
  - Pricing/tariff management
  - System settings
  - Email templates
  - Notification settings
  - OCPP configuration

**Who Uses It**: 
- Charging center operators
- Administrators
- Support staff

---

### 2. Customer Portal (User Dashboard)
**URL**: `http://localhost:3001` (root)  
**Access**: Authenticated users  
**Purpose**: Self-service for customers

**Features**:
- ✅ **Account Management**
  - Profile settings
  - Payment methods
  - IdTag management (RFID cards)
  - Account balance/wallet
  
- ✅ **Charging History**
  - Transaction history
  - Energy consumption
  - Cost breakdown
  - Download receipts/invoices
  
- ✅ **Start/Stop Charging**
  - Find nearby stations
  - Start charging remotely
  - Stop charging remotely
  - Real-time charging status
  
- ✅ **Payments**
  - View payment history
  - Add payment methods
  - Top up wallet
  - View invoices
  
- ✅ **Usage Statistics**
  - Monthly usage
  - Cost trends
  - Energy consumption charts

**Who Uses It**: 
- EV owners
- Charging customers
- Registered users

---

### 3. Public Station Finder (No Login Required)
**URL**: `http://localhost:3001/stations`  
**Access**: Public (no authentication)  
**Purpose**: Help users find charging stations

**Features**:
- ✅ **Station Map**
  - Interactive map view
  - List view
  - Filter by availability, connector type, power rating
  
- ✅ **Station Details**
  - Location and address
  - Connector types available
  - Power ratings
  - Current availability
  - Pricing information
  
- ✅ **Navigation**
  - Directions to station
  - Distance calculation
  - Estimated travel time

**Who Uses It**: 
- Anyone looking for charging stations
- Potential customers
- Public users

---

## 🏗️ FRONTEND ARCHITECTURE

### Single React Application with Route-Based Dashboards

```
React App (Port 3001)
│
├── / (Root)
│   ├── /login → Customer login
│   ├── /register → Customer registration
│   ├── /dashboard → Customer portal (after login)
│   │   ├── /transactions
│   │   ├── /payments
│   │   ├── /profile
│   │   └── /stations (find & start charging)
│   │
│   └── /stations → Public station finder (no login)
│
└── /admin → Admin dashboard (requires admin login)
    ├── /stations → Station management
    ├── /transactions → Transaction monitoring
    ├── /users → User management
    ├── /reports → Reports & analytics
    ├── /billing → Billing management
    └── /settings → System configuration
```

### Why Single App?

**Advantages**:
- ✅ Shared components and code
- ✅ Single deployment
- ✅ Shared authentication logic
- ✅ Easier maintenance
- ✅ Code reuse

**Alternative**: Separate apps (if needed later)
- `admin-dashboard` (separate app)
- `customer-portal` (separate app)
- `public-site` (separate app)

---

## 🔌 HARDWARE CONNECTION IMPLEMENTATION

### OCPP 1.6 Connection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    HARDWARE (Charge Point)                   │
│  - 4G Embedded Network Device                               │
│  - Initiates connection to Central System                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ WebSocket Connection (WSS)
                       │ OCPP 1.6 JSON Messages
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              CENTRAL SYSTEM (Your Backend)                   │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │  OCPP 1.6 WebSocket Server                 │            │
│  │  - Listens on port 9000                    │            │
│  │  - Handles multiple charge point connections│            │
│  │  - Processes OCPP messages                 │            │
│  └────────────────────────────────────────────┘            │
│                       │                                     │
│  ┌────────────────────▼─────────────────────┐              │
│  │  Message Handlers                         │              │
│  │  - BootNotification                       │              │
│  │  - Authorize                              │              │
│  │  - StartTransaction                       │              │
│  │  - MeterValues                            │              │
│  │  - StopTransaction                        │              │
│  │  - StatusNotification                     │              │
│  └──────────────────────────────────────────┘              │
│                       │                                     │
│  ┌────────────────────▼─────────────────────┐              │
│  │  Business Logic                           │              │
│  │  - Transaction management                 │              │
│  │  - Billing calculations                   │              │
│  │  - User authorization                     │              │
│  └──────────────────────────────────────────┘              │
│                       │                                     │
│  ┌────────────────────▼─────────────────────┐              │
│  │  Database (PostgreSQL)                    │              │
│  │  - Store transactions                     │              │
│  │  - Store meter values                     │              │
│  │  - Store user data                        │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 HARDWARE CONNECTION DETAILS

### 1. Connection Setup

**Charge Point Configuration** (on hardware):
```
Central System URL: wss://your-server.com/ocpp/{charge-point-id}
OR
Central System URL: ws://your-server.com:9000/ocpp/{charge-point-id}

Authentication:
- Username/Password (if required)
- OR Certificate-based
- OR API Key
```

**Your Backend Setup**:
```javascript
// WebSocket server listening for OCPP connections
const WebSocket = require('ws');

const wss = new WebSocket.Server({ 
  port: 9000,
  path: '/ocpp/:chargePointId'  // Dynamic path for each charge point
});

wss.on('connection', (ws, req) => {
  // Extract charge point ID from URL
  const chargePointId = extractChargePointId(req.url);
  
  // Authenticate charge point
  // Store connection
  // Handle OCPP messages
});
```

### 2. Connection Flow

**Step 1: Charge Point Connects**
```
Hardware → WebSocket Connection → Your Backend
```

**Step 2: BootNotification**
```
Charge Point sends: BootNotification
Your Backend responds: Accept/Reject with configuration
```

**Step 3: Heartbeat (Periodic)**
```
Charge Point sends: Heartbeat (every 5 minutes)
Your Backend responds: Current time
```

**Step 4: When User Wants to Charge**
```
1. User presents IdTag (RFID card)
2. Charge Point sends: Authorize
3. Your Backend: Validates IdTag, responds with status
4. Charge Point sends: StartTransaction
5. Your Backend: Creates transaction, responds with Transaction ID
6. Charge Point sends: MeterValues (periodic during charging)
7. Your Backend: Updates transaction, calculates cost
8. User stops charging
9. Charge Point sends: StopTransaction
10. Your Backend: Finalizes transaction, processes payment
```

---

## 🌐 NETWORK CONFIGURATION

### Development (Local)
```
Charge Point (Hardware) → Internet → Your Local Server
```

**Challenge**: Hardware can't connect to `localhost`

**Solutions**:

1. **Use ngrok or similar tunnel** (Recommended for testing)
   ```bash
   ngrok http 9000
   # Gives you: wss://abc123.ngrok.io
   # Configure hardware to use this URL
   ```

2. **Use your public IP** (if accessible)
   ```
   Hardware URL: ws://your-public-ip:9000/ocpp/CP001
   ```

3. **Deploy to cloud** (Best for production)
   ```
   Hardware URL: wss://api.yourevcharging.com/ocpp/CP001
   ```

### Production
```
Charge Point (Hardware) → 4G Network → Internet → Your Cloud Server
```

**Requirements**:
- Public IP or domain name
- SSL certificate (WSS - secure WebSocket)
- Firewall rules (allow port 9000)
- Load balancer (if multiple servers)

---

## 🔐 AUTHENTICATION & SECURITY

### Charge Point Authentication

**Option 1: Basic Authentication**
```
WebSocket URL: wss://username:password@api.yourevcharging.com/ocpp/CP001
```

**Option 2: API Key in URL**
```
WebSocket URL: wss://api.yourevcharging.com/ocpp/CP001?api_key=your_key
```

**Option 3: Certificate-Based**
```
- Charge point has client certificate
- Your server validates certificate
- More secure for production
```

**Option 4: Token-Based (After Connection)**
```
1. Charge point connects
2. Sends authentication token in BootNotification
3. Your server validates and stores connection
```

---

## 📡 CONNECTION MANAGEMENT

### Connection States

1. **Disconnected**: Charge point not connected
2. **Connecting**: Charge point initiating connection
3. **Connected**: WebSocket established, awaiting BootNotification
4. **Registered**: BootNotification received and accepted
5. **Active**: Ready to handle transactions
6. **Offline**: Connection lost (but can queue messages locally)

### Handling Disconnections

**When Charge Point Goes Offline**:
- Store last known status
- Queue any pending messages
- Attempt reconnection (charge point will reconnect)
- Sync data when reconnected

**When Your Server Goes Offline**:
- Charge point should queue messages locally
- Charge point will retry connection
- Sync all queued messages when reconnected

---

## 🏗️ IMPLEMENTATION ARCHITECTURE

### Backend Structure

```
backend/
├── src/
│   ├── ocpp/
│   │   ├── server.ts              # WebSocket server
│   │   ├── connection-manager.ts  # Manage connections
│   │   ├── message-handler.ts     # Route OCPP messages
│   │   ├── handlers/
│   │   │   ├── boot-notification.ts
│   │   │   ├── authorize.ts
│   │   │   ├── start-transaction.ts
│   │   │   ├── meter-values.ts
│   │   │   ├── stop-transaction.ts
│   │   │   └── status-notification.ts
│   │   └── types.ts               # OCPP message types
│   │
│   ├── api/                       # REST API
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── stations.ts
│   │   │   ├── transactions.ts
│   │   │   └── billing.ts
│   │   └── middleware/
│   │
│   ├── services/
│   │   ├── transaction.service.ts
│   │   ├── billing.service.ts
│   │   ├── payment.service.ts
│   │   └── user.service.ts
│   │
│   └── database/
│       ├── models/
│       └── migrations/
│
└── package.json
```

---

## 🔌 HARDWARE INTEGRATION CHECKLIST

### Information Needed from Manufacturer:

- [ ] **Connection URL Format**
  - What URL format does hardware expect?
  - Example: `wss://server.com/ocpp/{id}` or `wss://server.com:9000`

- [ ] **Authentication Method**
  - Username/password?
  - API key?
  - Certificate?
  - Token in BootNotification?

- [ ] **Charge Point ID Format**
  - How is CPID configured on hardware?
  - Can you set it, or is it pre-configured?

- [ ] **Connection Behavior**
  - Does it auto-reconnect?
  - What's the retry interval?
  - Does it queue messages when offline?

- [ ] **Network Requirements**
  - Does it need static IP?
  - Any firewall requirements?
  - Port forwarding needed?

---

## 🌐 URL CONFIGURATION

### Development URLs

**Frontend (React App)**:
- Admin: http://localhost:3001/admin
- Customer: http://localhost:3001
- Public: http://localhost:3001/stations

**Backend API**:
- REST API: http://localhost:3000
- OCPP WebSocket: ws://localhost:9000

**For Hardware Connection (Development)**:
- Option 1: Use ngrok tunnel
  ```bash
  ngrok http 9000
  # Use: wss://abc123.ngrok.io/ocpp/CP001
  ```

- Option 2: Use your Mac's local IP
  ```bash
  # Find your IP
  ifconfig | grep "inet "
  # Use: ws://192.168.1.xxx:9000/ocpp/CP001
  ```

### Production URLs

**Frontend**:
- Admin: https://admin.yourevcharging.com
- Customer: https://app.yourevcharging.com
- Public: https://yourevcharging.com

**Backend**:
- REST API: https://api.yourevcharging.com
- OCPP WebSocket: wss://api.yourevcharging.com/ocpp/{charge-point-id}

---

## 📱 DASHBOARD ACCESS SUMMARY

### 1. Admin Dashboard
- **URL**: http://localhost:3001/admin
- **Login**: Admin credentials
- **Features**: Full system management
- **Users**: Operators, administrators

### 2. Customer Portal
- **URL**: http://localhost:3001
- **Login**: User credentials
- **Features**: Self-service for customers
- **Users**: EV owners, customers

### 3. Public Station Finder
- **URL**: http://localhost:3001/stations
- **Login**: Not required
- **Features**: Find stations, view availability
- **Users**: Anyone

---

## 🔧 HARDWARE CONNECTION IMPLEMENTATION PLAN

### Phase 1: WebSocket Server Setup
1. Create WebSocket server on port 9000
2. Handle connection from charge points
3. Authenticate charge points
4. Store active connections

### Phase 2: OCPP Message Handling
1. Parse JSON-RPC messages
2. Route to appropriate handlers
3. Process BootNotification
4. Handle Heartbeat

### Phase 3: Transaction Flow
1. Implement Authorize handler
2. Implement StartTransaction handler
3. Implement MeterValues handler
4. Implement StopTransaction handler

### Phase 4: Remote Control
1. Implement RemoteStartTransaction
2. Implement RemoteStopTransaction
3. Send commands to charge points

### Phase 5: Testing
1. Test with OCPP simulator
2. Test with real hardware
3. Handle edge cases
4. Performance testing

---

## 🧪 TESTING HARDWARE CONNECTION

### Option 1: OCPP Simulator
- Use open-source OCPP simulators
- Test without real hardware
- Validate message handling

### Option 2: Real Hardware
- Configure hardware with your server URL
- Test actual connection
- Verify all messages work

### Option 3: ngrok for Development
```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 9000

# Use the provided URL for hardware configuration
# Example: wss://abc123.ngrok.io/ocpp/CP001
```

---

## 📋 QUESTIONS TO DISCUSS

### 1. Dashboard Access
- ✅ **Confirmed**: 3 dashboards (Admin, Customer, Public)
- ✅ **URL**: http://localhost:3001 (with routes)
- ❓ Do you want separate apps or single app with routes?

### 2. Hardware Connection
- ✅ **Protocol**: OCPP 1.6 over WebSocket
- ✅ **Port**: 9000
- ❓ Do you have the hardware connection URL format from manufacturer?
- ❓ What authentication method does hardware use?

### 3. Network Setup
- ❓ Will you test locally first or deploy to cloud?
- ❓ Do you have a public domain/IP for production?
- ❓ Will you use ngrok for local testing?

### 4. Security
- ❓ How should charge points authenticate?
- ❓ Do you need certificate-based auth?
- ❓ What security requirements from manufacturer?

---

## 🎯 RECOMMENDED APPROACH

### For Development:
1. **Local Development**:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - OCPP WebSocket: ws://localhost:9000
   - Use ngrok for hardware testing: `ngrok http 9000`

2. **Hardware Testing**:
   - Configure hardware with ngrok URL
   - Test connection and messages
   - Verify transaction flow

### For Production:
1. **Deploy to Cloud**:
   - Use domain: `api.yourevcharging.com`
   - SSL certificate for WSS
   - Configure hardware with production URL

2. **Connection URL Format**:
   ```
   wss://api.yourevcharging.com/ocpp/{charge-point-id}
   ```

---

## ✅ SUMMARY

### Dashboards (3 total):
1. **Admin Dashboard**: http://localhost:3001/admin
2. **Customer Portal**: http://localhost:3001
3. **Public Station Finder**: http://localhost:3001/stations

### Hardware Connection:
- **Protocol**: OCPP 1.6 over WebSocket
- **Port**: 9000
- **URL Format**: `ws://localhost:9000/ocpp/{charge-point-id}`
- **For Testing**: Use ngrok to expose local server

### Next Steps:
1. ✅ Confirm Node.js stack
2. ✅ Understand dashboard structure
3. ⬜ Get hardware connection details from manufacturer
4. ⬜ Implement WebSocket server
5. ⬜ Test connection with hardware

---

**Ready to discuss hardware connection details!** 🔌



