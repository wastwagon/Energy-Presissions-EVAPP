# 🔍 OCPP Path Configuration Explained

## 📊 How `/ocpp` Path Works

The `/ocpp` path is configured in **multiple places** to route WebSocket connections correctly.

---

## 🔧 Configuration Points

### 1. OCPP Gateway WebSocket Server

**Location:** `ocpp-gateway/src/index.ts` (line 124)

```typescript
const wss = new WebSocketServer({ 
  server,
  path: '/ocpp'  // ← This sets the WebSocket path
});
```

**What This Does:**
- Configures the WebSocket server to listen on `/ocpp` path
- All WebSocket connections must use `/ocpp` as the base path
- This is the **primary configuration** that defines the path

---

### 2. Path Extraction Function

**Location:** `ocpp-gateway/src/index.ts` (lines 371-378)

```typescript
function extractChargePointId(pathname: string): string | null {
  // Expected format: /ocpp/{chargePointId}
  const parts = pathname.split('/').filter(p => p);
  if (parts.length >= 2 && parts[0] === 'ocpp') {
    return parts[1];  // Returns the Charge Point ID
  }
  return null;
}
```

**What This Does:**
- Parses the URL path: `/ocpp/0900330710111935`
- Extracts Charge Point ID: `0900330710111935`
- Validates that path starts with `ocpp`

**URL Format:**
```
ws://192.168.9.108:9000/ocpp/0900330710111935
                    └─┬──┘ └─┬──┘ └──────┬──────┘
                      │     │            │
                   Base   Path      Charge Point ID
```

---

### 3. NGINX Reverse Proxy

**Location:** `nginx/conf.d/default.conf` (lines 59-77)

```nginx
# OCPP WebSocket endpoint
location /ocpp {
    proxy_pass http://ocpp-gateway;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ... WebSocket settings
}
```

**What This Does:**
- Routes `/ocpp` requests to the OCPP Gateway
- Handles WebSocket upgrade headers
- Proxies connections from external network to internal Docker service

**Flow:**
```
Device → NGINX (/ocpp) → OCPP Gateway (port 9000)
```

---

## 🎯 Why `/ocpp` Path?

### 1. OCPP Standard Convention
- `/ocpp` is a common convention in OCPP implementations
- Makes it clear this endpoint is for OCPP protocol
- Separates OCPP WebSocket from other WebSocket endpoints

### 2. Multiple WebSocket Endpoints
Your system has multiple WebSocket paths:
- `/ocpp` - OCPP Gateway (charge point connections)
- `/ws` - CSMS API WebSocket (real-time updates)

**Different paths = Different services**

### 3. Path-Based Routing
- NGINX uses path to route to correct service
- OCPP Gateway extracts Charge Point ID from path
- Clean separation of concerns

---

## 📊 Complete URL Breakdown

### Full WebSocket URL:
```
ws://192.168.9.108:9000/ocpp/0900330710111935
│  │                │   │    │                  │
│  │                │   │    │                  └─ Charge Point ID
│  │                │   │    └─ Path (/ocpp)
│  │                │   └─ Port (9000)
│  │                └─ IP Address (192.168.9.108)
│  └─ Protocol (WebSocket)
└─ Scheme (ws://)
```

### Path Components:
1. **`/ocpp`** - Base path (configured in WebSocket server)
2. **`/0900330710111935`** - Charge Point ID (extracted from path)

---

## 🔄 Connection Flow

### Step 1: Device Initiates Connection
```
Device → ws://192.168.9.108:9000/ocpp/0900330710111935
```

### Step 2: NGINX Routes Request
```
NGINX receives: /ocpp/0900330710111935
NGINX routes to: ocpp-gateway:9000
```

### Step 3: OCPP Gateway Processes
```
OCPP Gateway receives: /ocpp/0900330710111935
Extracts Charge Point ID: 0900330710111935
Establishes WebSocket connection
```

### Step 4: Connection Established
```
WebSocket connection active
Charge Point ID: 0900330710111935
Ready to receive OCPP messages
```

---

## ⚙️ Can You Change the Path?

### Yes, but requires changes in 3 places:

#### 1. OCPP Gateway Configuration
```typescript
// ocpp-gateway/src/index.ts
const wss = new WebSocketServer({ 
  server,
  path: '/your-custom-path'  // Change here
});
```

#### 2. Path Extraction Function
```typescript
// ocpp-gateway/src/index.ts
function extractChargePointId(pathname: string): string | null {
  const parts = pathname.split('/').filter(p => p);
  if (parts.length >= 2 && parts[0] === 'your-custom-path') {  // Change here
    return parts[1];
  }
  return null;
}
```

#### 3. NGINX Configuration
```nginx
# nginx/conf.d/default.conf
location /your-custom-path {  # Change here
    proxy_pass http://ocpp-gateway;
    # ... rest of config
}
```

#### 4. Device Configuration
```
Update device Server URL:
ws://192.168.9.108:9000/your-custom-path/0900330710111935
```

---

## ✅ Current Configuration Summary

| Component | Path | Purpose |
|-----------|------|---------|
| **OCPP Gateway** | `/ocpp` | WebSocket server path |
| **NGINX** | `/ocpp` | Routes to OCPP Gateway |
| **Device URL** | `/ocpp/{chargePointId}` | Full connection path |
| **Extraction** | `/ocpp/{chargePointId}` | Parses Charge Point ID |

---

## 🎯 Why This Design?

### 1. Standard OCPP Pattern
- Many OCPP implementations use `/ocpp` path
- Familiar to developers working with OCPP
- Follows common conventions

### 2. Clear Separation
- `/ocpp` = Charge point connections
- `/ws` = Frontend real-time updates
- `/api` = REST API endpoints

### 3. Easy Identification
- Path clearly indicates OCPP protocol
- Easy to debug and monitor
- Clear in logs and documentation

---

## 📝 Key Points

1. **`/ocpp` is configured in OCPP Gateway** (line 124 of `index.ts`)
2. **Path extraction expects `/ocpp/{chargePointId}`** format
3. **NGINX routes `/ocpp` to OCPP Gateway**
4. **Device must use `/ocpp/` in URL** to connect
5. **Path can be changed** but requires updates in 3 places

---

## 🔍 Verification

### Check Current Configuration:

**OCPP Gateway:**
```bash
docker logs ev-billing-ocpp-gateway | grep "WebSocket endpoint"
# Should show: ws://0.0.0.0:9000/ocpp/{chargePointId}
```

**NGINX:**
```bash
cat nginx/conf.d/default.conf | grep -A 5 "location /ocpp"
# Should show: location /ocpp { ... }
```

**Device Configuration:**
```
Server URL: ws://192.168.9.108:9000/ocpp/0900330710111935
                              └─┬──┘
                            Must include /ocpp/
```

---

## ✅ Summary

**The `/ocpp` path:**
- ✅ Configured in OCPP Gateway WebSocket server
- ✅ Used by NGINX to route requests
- ✅ Required in device Server URL
- ✅ Used to extract Charge Point ID
- ✅ Standard OCPP convention
- ✅ Can be changed if needed (requires 3 updates)

**Your device URL must include `/ocpp/`:**
```
ws://192.168.9.108:9000/ocpp/0900330710111935
                    └─┬──┘
                   Required path
```

---

**Status:** `/ocpp` path is correctly configured  
**Purpose:** Routes OCPP WebSocket connections  
**Device URL:** Must include `/ocpp/` before Charge Point ID





