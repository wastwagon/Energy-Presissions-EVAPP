# Hardware Connection Implementation Guide
## OCPP 1.6 Integration with EV Charging Hardware

---

## 🔌 CONNECTION ARCHITECTURE

### How Hardware Connects to Your System

```
┌─────────────────────────────────────────────────────────────┐
│              HARDWARE (Charge Point)                         │
│  - 4G Embedded Network                                      │
│  - OCPP 1.6 Client                                          │
│  - Initiates WebSocket connection                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ WebSocket (WSS/WS)
                       │ OCPP 1.6 JSON Messages
                       │ Port: 9000
                       │
┌──────────────────────▼──────────────────────────────────────┐
│         YOUR BACKEND (Node.js Central System)                │
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │  WebSocket Server (Port 9000)              │            │
│  │  - Listens for charge point connections    │            │
│  │  - Handles multiple charge points          │            │
│  └────────────────────────────────────────────┘            │
│                       │                                     │
│  ┌────────────────────▼─────────────────────┐              │
│  │  OCPP Message Router                      │              │
│  │  - Parses JSON-RPC messages               │              │
│  │  - Routes to appropriate handlers         │              │
│  └──────────────────────────────────────────┘              │
│                       │                                     │
│  ┌────────────────────▼─────────────────────┐              │
│  │  Message Handlers                         │              │
│  │  • BootNotification                       │              │
│  │  • Authorize                              │              │
│  │  • StartTransaction                       │              │
│  │  • MeterValues (every 30-60 seconds)      │              │
│  │  • StopTransaction                        │              │
│  │  • StatusNotification                     │              │
│  │  • Heartbeat                              │              │
│  └──────────────────────────────────────────┘              │
│                       │                                     │
│  ┌────────────────────▼─────────────────────┐              │
│  │  Business Logic                           │              │
│  │  - Transaction management                 │              │
│  │  - Billing calculations                   │              │
│  │  - User authorization                     │              │
│  │  - Payment processing                     │              │
│  └──────────────────────────────────────────┘              │
│                       │                                     │
│  ┌────────────────────▼─────────────────────┐              │
│  │  Database (PostgreSQL)                    │              │
│  │  - Store all data                         │              │
│  └──────────────────────────────────────────┘              │
│                                                              │
│  ┌──────────────────────────────────────────┐              │
│  │  REST API (Port 3000)                     │              │
│  │  - Frontend dashboard access              │              │
│  │  - Mobile app access                      │              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 CONNECTION URLS

### Development (Local Testing)

**Challenge**: Hardware can't connect to `localhost`

**Solutions**:

#### Option 1: ngrok Tunnel (Recommended for Testing)
```bash
# Install ngrok
brew install ngrok

# Start tunnel to your OCPP server
ngrok http 9000

# Output:
# Forwarding: https://abc123.ngrok.io -> http://localhost:9000
```

**Hardware Configuration**:
```
Central System URL: wss://abc123.ngrok.io/ocpp/CP001
```

**Pros**:
- ✅ Easy to set up
- ✅ Works with any hardware
- ✅ Secure (HTTPS/WSS)
- ✅ Free tier available

**Cons**:
- ⚠️ URL changes each time (unless paid plan)
- ⚠️ Not suitable for production

#### Option 2: Local Network IP
```bash
# Find your Mac's local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: inet 192.168.1.100
```

**Hardware Configuration**:
```
Central System URL: ws://192.168.1.100:9000/ocpp/CP001
```

**Pros**:
- ✅ No external service needed
- ✅ Fast connection

**Cons**:
- ⚠️ Only works on same network
- ⚠️ Not secure (WS, not WSS)
- ⚠️ IP may change

#### Option 3: Deploy to Cloud (Best for Production)
```
Central System URL: wss://api.yourevcharging.com/ocpp/CP001
```

---

### Production URLs

**OCPP WebSocket Server**:
```
wss://api.yourevcharging.com/ocpp/{charge-point-id}
```

**REST API**:
```
https://api.yourevcharging.com/api/v1
```

**Frontend**:
```
https://admin.yourevcharging.com  (Admin)
https://app.yourevcharging.com    (Customer)
https://yourevcharging.com        (Public)
```

---

## 🔐 AUTHENTICATION METHODS

### Method 1: URL-Based Authentication (Simple)
```
wss://username:password@api.yourevcharging.com/ocpp/CP001
```

**Implementation**:
```javascript
// Extract credentials from WebSocket URL
const url = new URL(ws.upgradeReq.url);
const auth = url.username && url.password 
  ? { username: url.username, password: url.password }
  : null;

// Validate credentials
if (!isValidChargePoint(auth)) {
  ws.close(1008, 'Unauthorized');
}
```

### Method 2: API Key in URL (Common)
```
wss://api.yourevcharging.com/ocpp/CP001?api_key=your-secret-key
```

**Implementation**:
```javascript
const url = new URL(ws.upgradeReq.url);
const apiKey = url.searchParams.get('api_key');

if (!validateApiKey(apiKey)) {
  ws.close(1008, 'Invalid API key');
}
```

### Method 3: Certificate-Based (Most Secure)
- Charge point has client certificate
- Your server validates certificate during TLS handshake
- No credentials needed in URL

**Implementation**:
```javascript
const wss = new WebSocket.Server({
  port: 9000,
  verifyClient: (info) => {
    // Validate client certificate
    const cert = info.req.socket.getPeerCertificate();
    return isValidCertificate(cert);
  }
});
```

### Method 4: Token in BootNotification (Flexible)
```
1. Charge point connects (no auth in URL)
2. Sends BootNotification with auth token
3. Server validates token
4. Server accepts or rejects connection
```

**Implementation**:
```javascript
// Allow connection, validate in BootNotification
wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    
    if (message[2] === 'BootNotification') {
      const token = message[3].authToken;
      if (!validateToken(token)) {
        ws.close(1008, 'Invalid token');
        return;
      }
      // Accept connection
    }
  });
});
```

---

## 📡 CONNECTION FLOW

### Step-by-Step Connection Process

#### 1. Hardware Initiates Connection
```
Hardware → WebSocket Connection → Your Server (Port 9000)
```

**What Happens**:
- Hardware opens WebSocket connection
- Your server accepts connection
- Connection is established (but not authenticated yet)

#### 2. BootNotification (Registration)
```
Hardware sends:
[
  2,                              // Message Type: CALL
  "unique-message-id-123",        // Unique ID
  "BootNotification",              // Action
  {
    "chargePointVendor": "VendorName",
    "chargePointModel": "Model123",
    "chargePointSerialNumber": "SN123456",
    "firmwareVersion": "1.0.0"
  }
]

Your Server responds:
[
  3,                              // Message Type: CALLRESULT
  "unique-message-id-123",        // Same ID
  {
    "status": "Accepted",          // or "Rejected"
    "currentTime": "2024-01-01T12:00:00Z",
    "interval": 300,               // Heartbeat interval (seconds)
    "data": {
      "heartbeatInterval": 300
    }
  }
]
```

**What Happens**:
- Hardware identifies itself
- Your server validates and registers charge point
- Server sends configuration (heartbeat interval, etc.)
- Connection is now "registered"

#### 3. Heartbeat (Keep-Alive)
```
Hardware sends (every 5 minutes):
[
  2,
  "heartbeat-123",
  "Heartbeat",
  {}
]

Your Server responds:
[
  3,
  "heartbeat-123",
  {
    "currentTime": "2024-01-01T12:05:00Z"
  }
]
```

**Purpose**: Keep connection alive, sync time

#### 4. StatusNotification (Status Updates)
```
Hardware sends (when status changes):
[
  2,
  "status-123",
  "StatusNotification",
  {
    "connectorId": 1,
    "errorCode": "NoError",
    "status": "Available"  // or "Preparing", "Charging", "Finishing", "Unavailable", "Faulted"
  }
]
```

**Purpose**: Keep you informed of charge point status

---

## ⚡ CHARGING TRANSACTION FLOW

### Complete Transaction Lifecycle

#### Step 1: User Presents IdTag (RFID Card)
```
User swipes RFID card at charge point
```

#### Step 2: Authorize Request
```
Hardware sends:
[
  2,
  "auth-123",
  "Authorize",
  {
    "idTag": "USER123456"
  }
]

Your Server responds:
[
  3,
  "auth-123",
  {
    "idTagInfo": {
      "status": "Accepted",  // or "Blocked", "Expired", "Invalid", "ConcurrentTx"
      "expiryDate": "2024-12-31T23:59:59Z",
      "parentIdTag": "PARENT123"
    }
  }
]
```

**What Happens**:
- Your server checks if user exists
- Validates IdTag status (active, not blocked, not expired)
- Checks account balance (if prepaid)
- Returns authorization status

#### Step 3: StartTransaction
```
Hardware sends:
[
  2,
  "start-123",
  "StartTransaction",
  {
    "connectorId": 1,
    "idTag": "USER123456",
    "meterStart": 12345,        // Initial meter reading (Wh)
    "timestamp": "2024-01-01T12:00:00Z"
  }
]

Your Server responds:
[
  3,
  "start-123",
  {
    "transactionId": 789,       // Your unique transaction ID
    "idTagInfo": {
      "status": "Accepted"
    }
  }
]
```

**What Happens**:
- Your server creates new transaction record
- Stores start time, meter reading, user ID
- Returns transaction ID
- Transaction is now "active"

#### Step 4: MeterValues (Periodic Updates)
```
Hardware sends (every 30-60 seconds during charging):
[
  2,
  "meter-123",
  "MeterValues",
  {
    "connectorId": 1,
    "transactionId": 789,
    "meterValue": [
      {
        "timestamp": "2024-01-01T12:01:00Z",
        "sampledValue": [
          {
            "value": "12500",           // Current meter reading (Wh)
            "context": "Sample.Periodic",
            "format": "Raw",
            "measurand": "Energy.Active.Import.Register",
            "location": "Outlet",
            "unit": "Wh"
          },
          {
            "value": "7.2",             // Power (kW)
            "measurand": "Power.Active.Import",
            "unit": "kW"
          },
          {
            "value": "230",             // Voltage (V)
            "measurand": "Voltage",
            "unit": "V"
          },
          {
            "value": "31.3",            // Current (A)
            "measurand": "Current.Import",
            "unit": "A"
          }
        ]
      }
    ]
  }
]

Your Server responds:
[
  3,
  "meter-123",
  {}
]
```

**What Happens**:
- Your server receives meter readings
- Calculates energy consumed: `12500 - 12345 = 155 Wh = 0.155 kWh`
- Calculates cost in real-time
- Updates transaction record
- Sends real-time updates to frontend dashboard

#### Step 5: StopTransaction
```
Hardware sends (when user stops charging):
[
  2,
  "stop-123",
  "StopTransaction",
  {
    "transactionId": 789,
    "idTag": "USER123456",
    "meterStop": 15000,         // Final meter reading (Wh)
    "timestamp": "2024-01-01T13:00:00Z",
    "reason": "Local"           // or "Remote", "EVDisconnected", "EmergencyStop", etc.
  }
]

Your Server responds:
[
  3,
  "stop-123",
  {
    "idTagInfo": {
      "status": "Accepted"
    }
  }
]
```

**What Happens**:
- Your server finalizes transaction
- Calculates final cost:
  - Energy: `15000 - 12345 = 2655 Wh = 2.655 kWh`
  - Time: 1 hour
  - Cost: `(2.655 × $0.15) + (1 × $0.50) = $0.90`
- Processes payment
- Generates invoice
- Sends notification to user

---

## 🔄 REMOTE CONTROL (Your Server → Hardware)

### RemoteStartTransaction
```
Your Server sends:
[
  2,
  "remote-start-123",
  "RemoteStartTransaction",
  {
    "connectorId": 1,
    "idTag": "USER123456",
    "chargingProfile": {
      "chargingProfileId": 1,
      "stackLevel": 0,
      "chargingProfilePurpose": "TxProfile",
      "chargingProfileKind": "Relative",
      "chargingSchedule": {
        "chargingRateUnit": "A",
        "chargingSchedulePeriod": [
          {
            "startPeriod": 0,
            "limit": 16.0
          }
        ]
      }
    }
  }
]

Hardware responds:
[
  3,
  "remote-start-123",
  {
    "status": "Accepted"  // or "Rejected"
  }
]
```

**Use Case**: User starts charging from mobile app

### RemoteStopTransaction
```
Your Server sends:
[
  2,
  "remote-stop-123",
  "RemoteStopTransaction",
  {
    "transactionId": 789
  }
]

Hardware responds:
[
  3,
  "remote-stop-123",
  {
    "status": "Accepted"  // or "Rejected"
  }
]
```

**Use Case**: User stops charging from mobile app or admin stops it

---

## 🏗️ IMPLEMENTATION STRUCTURE

### Backend Code Structure

```
backend/
├── src/
│   ├── ocpp/
│   │   ├── server.ts                    # WebSocket server setup
│   │   ├── connection-manager.ts        # Manage active connections
│   │   ├── message-router.ts            # Route OCPP messages
│   │   ├── handlers/
│   │   │   ├── boot-notification.ts     # Handle BootNotification
│   │   │   ├── authorize.ts             # Handle Authorize
│   │   │   ├── start-transaction.ts     # Handle StartTransaction
│   │   │   ├── meter-values.ts          # Handle MeterValues
│   │   │   ├── stop-transaction.ts      # Handle StopTransaction
│   │   │   ├── status-notification.ts   # Handle StatusNotification
│   │   │   ├── heartbeat.ts             # Handle Heartbeat
│   │   │   ├── remote-start.ts          # Send RemoteStartTransaction
│   │   │   └── remote-stop.ts           # Send RemoteStopTransaction
│   │   ├── types.ts                     # OCPP message types
│   │   └── utils.ts                     # Helper functions
│   │
│   ├── services/
│   │   ├── transaction.service.ts       # Transaction business logic
│   │   ├── billing.service.ts           # Billing calculations
│   │   ├── user.service.ts              # User management
│   │   └── charge-point.service.ts      # Charge point management
│   │
│   └── database/
│       └── models/
│           ├── charge-point.model.ts
│           ├── transaction.model.ts
│           └── user.model.ts
│
└── package.json
```

---

## 🔧 CONFIGURATION NEEDED FROM MANUFACTURER

### Critical Information Required:

1. **Connection URL Format**
   - [ ] What URL format does hardware expect?
   - [ ] Example: `wss://server.com/ocpp/{id}` or `wss://server.com:9000`
   - [ ] Can you configure the URL on the hardware?

2. **Charge Point ID (CPID)**
   - [ ] How is CPID configured?
   - [ ] Is it pre-configured or can you set it?
   - [ ] What format? (e.g., "CP001", "STATION-12345")

3. **Authentication Method**
   - [ ] Username/password?
   - [ ] API key?
   - [ ] Certificate?
   - [ ] Token in BootNotification?

4. **Network Settings**
   - [ ] Does it need static IP?
   - [ ] Any firewall requirements?
   - [ ] Port forwarding needed?
   - [ ] APN settings for 4G?

5. **Connection Behavior**
   - [ ] Auto-reconnect on disconnect?
   - [ ] Retry interval?
   - [ ] Does it queue messages when offline?

6. **Meter Values**
   - [ ] What meter values are available?
   - [ ] Energy (Wh/kWh)? ✅ CRITICAL
   - [ ] Power (W/kW)?
   - [ ] Voltage, Current?
   - [ ] How often are MeterValues sent? (30s, 60s?)

---

## 🧪 TESTING STRATEGY

### Phase 1: OCPP Simulator Testing
- Use open-source OCPP simulators
- Test without real hardware
- Validate all message handlers
- Test edge cases

### Phase 2: Local Hardware Testing
- Use ngrok to expose local server
- Configure hardware with ngrok URL
- Test actual connection
- Verify all messages work

### Phase 3: Production Testing
- Deploy to cloud
- Configure hardware with production URL
- Full end-to-end testing
- Load testing

---

## 📋 IMPLEMENTATION CHECKLIST

### Backend Implementation:
- [ ] Set up WebSocket server on port 9000
- [ ] Implement connection manager
- [ ] Implement message router
- [ ] Implement BootNotification handler
- [ ] Implement Authorize handler
- [ ] Implement StartTransaction handler
- [ ] Implement MeterValues handler
- [ ] Implement StopTransaction handler
- [ ] Implement StatusNotification handler
- [ ] Implement Heartbeat handler
- [ ] Implement RemoteStartTransaction
- [ ] Implement RemoteStopTransaction
- [ ] Add authentication/authorization
- [ ] Add error handling
- [ ] Add logging
- [ ] Add connection persistence (Redis)

### Testing:
- [ ] Unit tests for handlers
- [ ] Integration tests with simulator
- [ ] Test with real hardware
- [ ] Load testing
- [ ] Error scenario testing

### Deployment:
- [ ] Set up production server
- [ ] Configure SSL certificate (for WSS)
- [ ] Set up domain name
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Configure hardware with production URL

---

## 🎯 NEXT STEPS

1. ✅ **Confirm Stack**: Node.js with TypeScript
2. ✅ **Understand Dashboards**: 3 dashboards (Admin, Customer, Public)
3. ✅ **Understand Hardware Connection**: OCPP 1.6 over WebSocket
4. ⬜ **Get Hardware Details**: Contact manufacturer for connection info
5. ⬜ **Implement WebSocket Server**: Start building OCPP server
6. ⬜ **Test Connection**: Use simulator or real hardware

---

## 💬 QUESTIONS TO DISCUSS

1. **Hardware Connection**:
   - Do you have the hardware connection URL format from manufacturer?
   - What authentication method does hardware use?
   - How many charge points will you have initially?

2. **Network Setup**:
   - Will you test locally first or deploy to cloud?
   - Do you have a public domain/IP for production?
   - Will you use ngrok for local testing?

3. **Security**:
   - How should charge points authenticate?
   - Do you need certificate-based auth?
   - What security requirements from manufacturer?

4. **Implementation Priority**:
   - Start with WebSocket server?
   - Start with REST API?
   - Start with frontend?

---

**Ready to start implementation!** 🚀



