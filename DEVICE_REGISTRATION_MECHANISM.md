# Device Registration and Synchronization Mechanism

## Overview

Devices (charge points) are **automatically registered and synchronized** with the system through the **OCPP 1.6J protocol** using WebSocket connections. No manual registration is required.

---

## 🔄 Automatic Registration Flow

### Step 1: Device Connection
```
Charge Point Hardware → WebSocket Connection → OCPP Gateway (Port 9000)
```

**Connection URL Format:**
```
ws://your-server:9000/ocpp/{chargePointId}
```

**What Happens:**
- Charge point opens WebSocket connection to OCPP Gateway
- Connection is established (but device not registered yet)
- OCPP Gateway extracts `chargePointId` from URL path
- Tenant status is checked (if multi-tenant is enabled)

**Code Location:** `ocpp-gateway/src/index.ts` (lines 185-251)

---

### Step 2: BootNotification (Automatic Registration)

**When:** Immediately after WebSocket connection is established

**Message Flow:**
```
Charge Point → OCPP Gateway → CSMS API → Database
```

**BootNotification Message (from Charge Point):**
```json
[
  2,                              // Message Type: CALL
  "unique-message-id-123",        // Unique message ID
  "BootNotification",              // Action name
  {
    "chargePointVendor": "VendorName",
    "chargePointModel": "Model123",
    "chargePointSerialNumber": "SN123456",
    "firmwareVersion": "1.0.0",
    "iccid": "ICCID123456",        // Optional: SIM card ID
    "imsi": "IMSI123456"           // Optional: Mobile network ID
  }
]
```

**What Happens:**
1. **OCPP Gateway** receives BootNotification
2. **BootNotificationHandler** processes the message
3. **CSMS API** is notified via internal API endpoint
4. **Database** creates or updates charge point record
5. **Response** sent back to charge point

**Code Locations:**
- Handler: `ocpp-gateway/src/handlers/boot-notification.ts`
- API Endpoint: `backend/src/internal/internal.controller.ts` → `POST /api/internal/charge-points/boot`
- Service: `backend/src/internal/internal.service.ts` → `upsertChargePoint()`

**Response (to Charge Point):**
```json
[
  3,                              // Message Type: CALLRESULT
  "unique-message-id-123",        // Same message ID
  {
    "status": "Accepted",          // Accepted | Pending | Rejected
    "currentTime": "2024-01-15T10:00:00Z",
    "interval": 300                // Heartbeat interval (seconds)
  }
]
```

---

### Step 3: Database Registration

**What Gets Stored:**
- `chargePointId` (from URL path)
- `vendor` (from BootNotification)
- `model` (from BootNotification)
- `serialNumber` (from BootNotification)
- `firmwareVersion` (from BootNotification)
- `iccid` (optional, from BootNotification)
- `imsi` (optional, from BootNotification)
- `status` (set to "Available")
- `lastSeen` (current timestamp)
- `tenantId` (if multi-tenant is enabled)

**Database Table:** `charge_points`

**Code:** `backend/src/internal/internal.service.ts` → `upsertChargePoint()` (lines 47-116)

---

## 🔄 Ongoing Synchronization

### 1. Heartbeat (Connection Status)

**Frequency:** Every 300 seconds (5 minutes) by default (configurable)

**Message:**
```json
[
  2,
  "heartbeat-123",
  "Heartbeat",
  {}
]
```

**Response:**
```json
[
  3,
  "heartbeat-123",
  {
    "currentTime": "2024-01-15T10:05:00Z"
  }
]
```

**What Happens:**
- Updates `lastHeartbeat` timestamp in database
- Updates `lastSeen` timestamp
- Confirms device is still online

**Code:** `ocpp-gateway/src/handlers/heartbeat.ts`

---

### 2. StatusNotification (Connector Status)

**When:** Sent whenever connector status changes

**Message:**
```json
[
  2,
  "status-123",
  "StatusNotification",
  {
    "connectorId": 1,
    "errorCode": "NoError",
    "status": "Available",         // Available | Preparing | Charging | SuspendedEVSE | SuspendedEV | Finishing | Reserved | Unavailable | Faulted
    "info": "Optional status info",
    "timestamp": "2024-01-15T10:00:00Z",
    "vendorId": "VendorName",
    "vendorErrorCode": "Optional vendor error code"
  }
]
```

**What Happens:**
- Updates connector status in database
- Creates/updates `connectors` table record
- Broadcasts status change to frontend via WebSocket
- Updates charge point `lastSeen` timestamp

**Code:** `ocpp-gateway/src/handlers/status-notification.ts`

---

### 3. MeterValues (Energy Data)

**Frequency:** Every 60 seconds by default (configurable via `MeterValueSampleInterval`)

**Message:**
```json
[
  2,
  "meter-123",
  "MeterValues",
  {
    "connectorId": 1,
    "transactionId": 12345,
    "meterValue": [
      {
        "timestamp": "2024-01-15T10:00:00Z",
        "sampledValue": [
          {
            "value": "5000",           // Energy in Wh
            "context": "Sample.Periodic",
            "format": "Raw",
            "measurand": "Energy.Active.Import.Register",
            "location": "Outlet",
            "unit": "Wh"
          },
          {
            "value": "3500",           // Power in W
            "measurand": "Power.Active.Import",
            "unit": "W"
          }
        ]
      }
    ]
  }
]
```

**What Happens:**
- Stores meter readings in `meter_samples` table
- Updates transaction energy consumption
- Used for billing calculations

**Code:** `ocpp-gateway/src/handlers/meter-values.ts`

---

## 📊 System Architecture

```
┌─────────────────┐
│  Charge Point   │
│   (Hardware)    │
└────────┬────────┘
         │ WebSocket (OCPP 1.6J)
         │
         ▼
┌─────────────────┐
│  OCPP Gateway   │  ← Receives OCPP messages
│  (Port 9000)    │  ← Routes to handlers
└────────┬────────┘
         │ HTTP/REST (Internal API)
         │
         ▼
┌─────────────────┐
│   CSMS API      │  ← Processes business logic
│  (Port 3000)    │  ← Updates database
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │  ← Stores charge point data
│   Database      │  ← Stores transactions
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │  ← Displays device inventory
│  (Port 3001)    │  ← Real-time updates via WebSocket
└─────────────────┘
```

---

## 🔧 Configuration

### OCPP Gateway Settings

**Environment Variables:**
- `PORT`: OCPP Gateway port (default: 9000)
- `CSMS_API_URL`: CSMS API URL (default: http://csms-api:3000)
- `SERVICE_TOKEN`: Token for internal API calls
- `LOG_RAW_FRAMES`: Enable raw OCPP frame logging (default: false)

### Charge Point Configuration Keys

These can be set via `ChangeConfiguration` command:

- `HeartbeatInterval`: Heartbeat frequency in seconds (default: 300)
- `MeterValueSampleInterval`: Meter value sampling frequency in seconds (default: 60)
- `ConnectionTimeOut`: Connection timeout in seconds (default: 30)

**Set via Super Admin Dashboard:**
- Go to: http://localhost:8080/admin
- Tab: "System Settings"
- Section: "OCPP Configuration"

---

## 🚀 Manual Device Addition (Optional)

While devices are automatically registered via BootNotification, you can also manually add devices through the API:

**API Endpoint:**
```
POST /api/charge-points
```

**Request Body:**
```json
{
  "chargePointId": "CP001",
  "vendor": "VendorName",
  "model": "Model123",
  "serialNumber": "SN123456",
  "firmwareVersion": "1.0.0",
  "locationLatitude": 5.6037,
  "locationLongitude": -0.1870,
  "locationAddress": "Accra, Ghana"
}
```

**Note:** Manual registration is useful for:
- Pre-configuring devices before they connect
- Adding location/address information
- Setting up devices that haven't connected yet

---

## 🔍 Monitoring Device Status

### Real-Time Status

**Frontend Dashboard:**
- URL: http://localhost:8080/ops/devices
- Shows all registered charge points
- Real-time status updates via WebSocket
- Last seen timestamp
- Connection status (Online/Offline)

### API Endpoints

**Get All Charge Points:**
```
GET /api/charge-points
```

**Get Charge Point Status:**
```
GET /api/charge-points/{chargePointId}/status
```

**Check Connection Status:**
```
GET http://ocpp-gateway:9000/health/connection/{chargePointId}
```

---

## 🔐 Multi-Tenant Support

If multi-tenancy is enabled:

1. **Tenant Resolution:**
   - Charge point is associated with a tenant
   - Tenant ID is resolved from `charge_points.tenant_id`
   - Tenant status is checked before accepting connection

2. **Tenant Status Enforcement:**
   - **Active**: Normal operation
   - **Suspended**: Read-only access, commands blocked
   - **Disabled**: Connection rejected

**Code:** `ocpp-gateway/src/services/tenant-resolver.ts`

---

## 📝 Summary

**Key Points:**
1. ✅ **Automatic Registration**: Devices register themselves via BootNotification
2. ✅ **No Manual Setup Required**: Just connect the device to the network
3. ✅ **Real-Time Sync**: Status updates via Heartbeat and StatusNotification
4. ✅ **Energy Monitoring**: MeterValues provide real-time energy consumption
5. ✅ **Multi-Tenant**: Supports tenant isolation and status enforcement

**What You Need:**
- Charge point hardware with OCPP 1.6J support
- Network connectivity (4G/WiFi/Ethernet)
- WebSocket URL configured on charge point: `ws://your-server:9000/ocpp/{chargePointId}`

**That's it!** Once the device connects and sends BootNotification, it will automatically appear in the Device Inventory dashboard.



