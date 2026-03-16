# 📊 Device Database Registration Flow - Step by Step

## 🎯 Answer: Device Enters Database at **Step 3** (BootNotification)

The device is **NOT** registered in the database when it connects. It's registered **AFTER** it sends a `BootNotification` message.

---

## 🔄 Complete Registration Flow

### Step 1: WebSocket Connection ⚠️ (NOT in database yet)

**What Happens:**
```
Device → Opens WebSocket → OCPP Gateway (Port 9000)
URL: ws://192.168.9.108:9000/ocpp/0900330710111935
```

**At This Stage:**
- ✅ WebSocket connection established
- ✅ Charge Point ID extracted from URL: `0900330710111935`
- ✅ Connection logged in `connection_logs` table
- ❌ **Device NOT in `charge_points` table yet**
- ❌ **Device NOT visible in dashboard yet**

**Code:** `ocpp-gateway/src/index.ts` (lines 186-313)
- Connection accepted
- Charge Point ID extracted
- Connection registered in `ConnectionManager`
- **But no database entry created**

---

### Step 2: Device Sends BootNotification Message ⚠️ (Still NOT in database)

**What Happens:**
```
Device → Sends BootNotification → OCPP Gateway
```

**BootNotification Message Format:**
```json
[
  2,                              // Message Type: CALL
  "unique-message-id-123",        // Unique message ID
  "BootNotification",              // Action name
  {
    "chargePointVendor": "DY",
    "chargePointModel": "DY0131-BG132",
    "chargePointSerialNumber": "0900330710111935",
    "firmwareVersion": "4.0.0",
    "iccid": "ICCID123456",        // Optional: SIM card ID
    "imsi": "IMSI123456"           // Optional: Mobile network ID
  }
]
```

**At This Stage:**
- ✅ BootNotification received by OCPP Gateway
- ✅ Message parsed and validated
- ❌ **Device STILL NOT in database**
- ❌ **Device STILL NOT visible in dashboard**

**Code:** `ocpp-gateway/src/handlers/boot-notification.ts` (line 9)
- Handler receives BootNotification
- Logs device information
- **But database registration hasn't happened yet**

---

### Step 3: CSMS API Called ✅ **DATABASE REGISTRATION HAPPENS HERE**

**What Happens:**
```
OCPP Gateway → POST /api/internal/charge-points → CSMS API
```

**API Call:**
```javascript
POST http://csms-api:3000/api/internal/charge-points
Headers:
  Authorization: Bearer SERVICE_TOKEN
  Content-Type: application/json

Body:
{
  "chargePointId": "0900330710111935",
  "vendor": "DY",
  "model": "DY0131-BG132",
  "serialNumber": "0900330710111935",
  "firmwareVersion": "4.0.0",
  "iccid": "ICCID123456",
  "imsi": "IMSI123456"
}
```

**Code:** `ocpp-gateway/src/handlers/boot-notification.ts` (lines 59-85)
- `notifyCSMS()` method called
- POST request sent to CSMS API
- **This triggers database registration**

---

### Step 4: Database Entry Created ✅ **DEVICE NOW IN DATABASE**

**What Happens:**
```
CSMS API → upsertChargePoint() → Database
```

**Database Operation:**
```sql
-- If device doesn't exist, CREATE:
INSERT INTO charge_points (
  charge_point_id,
  vendor_name,
  model,
  serial_number,
  firmware_version,
  iccid,
  imsi,
  status,
  last_seen,
  created_at,
  updated_at
) VALUES (
  '0900330710111935',
  'DY',
  'DY0131-BG132',
  '0900330710111935',
  '4.0.0',
  'ICCID123456',
  'IMSI123456',
  'Available',
  NOW(),
  NOW(),
  NOW()
);

-- If device exists, UPDATE:
UPDATE charge_points SET
  vendor_name = 'DY',
  model = 'DY0131-BG132',
  serial_number = '0900330710111935',
  firmware_version = '4.0.0',
  iccid = 'ICCID123456',
  imsi = 'IMSI123456',
  status = 'Available',
  last_seen = NOW(),
  updated_at = NOW()
WHERE charge_point_id = '0900330710111935';
```

**Code:** `backend/src/internal/internal.service.ts` (lines 50-90)
- `upsertChargePoint()` method called
- Checks if device exists (by `charge_point_id`)
- Creates new record OR updates existing record
- **Device is now in `charge_points` table**
- **Device is now visible in dashboard**

---

### Step 5: Response Sent to Device ✅

**What Happens:**
```
CSMS API → OCPP Gateway → Device
```

**Response Message:**
```json
[
  3,                              // Message Type: CALLRESULT
  "unique-message-id-123",        // Same message ID
  {
    "status": "Accepted",          // Accepted | Pending | Rejected
    "currentTime": "2024-12-16T12:00:00Z",
    "interval": 300                // Heartbeat interval (5 minutes)
  }
]
```

**Code:** `ocpp-gateway/src/handlers/boot-notification.ts` (lines 25-38)
- Response created with status "Accepted"
- Sent back to device via WebSocket
- Device knows it's registered successfully

---

## 📊 Timeline Summary

| Stage | Action | Database Status | Dashboard Status |
|-------|--------|----------------|------------------|
| **1. WebSocket Connect** | Device connects | ❌ **NOT in DB** | ❌ Not visible |
| **2. BootNotification Sent** | Device sends message | ❌ **NOT in DB** | ❌ Not visible |
| **3. CSMS API Called** | API receives data | ⚠️ **Processing** | ❌ Not visible |
| **4. Database Save** | Record created/updated | ✅ **IN DATABASE** | ✅ **Visible** |
| **5. Response Sent** | Device receives confirmation | ✅ In DB | ✅ Visible |

---

## 🎯 Critical Point: BootNotification is Required

**The device will NOT appear in the database until:**
1. ✅ WebSocket connection is established
2. ✅ Device sends BootNotification message
3. ✅ CSMS API processes the BootNotification
4. ✅ Database record is created/updated

**If device connects but doesn't send BootNotification:**
- ❌ Device will NOT be in database
- ❌ Device will NOT appear in dashboard
- ⚠️ Connection will be logged in `connection_logs` table only

---

## 🔍 How to Verify Registration

### Check Database:
```sql
SELECT charge_point_id, vendor_name, model, serial_number, 
       firmware_version, status, last_seen, created_at 
FROM charge_points 
WHERE charge_point_id = '0900330710111935';
```

### Check Logs:
```bash
# OCPP Gateway logs
docker logs ev-billing-ocpp-gateway | grep -i "bootnotification\|0900330710111935"

# CSMS API logs
docker logs ev-billing-csms-api | grep -i "charge-points\|0900330710111935"
```

### Expected Log Messages:

**OCPP Gateway:**
```
Processing BootNotification from 0900330710111935
Sending BootNotification data to CSMS API
BootNotification accepted for 0900330710111935
```

**CSMS API:**
```
POST /api/internal/charge-points
Upserting charge point: 0900330710111935
Charge point saved: 0900330710111935
```

---

## ⚠️ Common Issues

### Issue 1: Device Connects But No BootNotification

**Symptoms:**
- WebSocket connection established
- Device appears in connection logs
- Device NOT in `charge_points` table
- Device NOT in dashboard

**Cause:**
- Device firmware issue
- Device not configured correctly
- Device waiting for manual trigger

**Solution:**
- Check device logs
- Verify device configuration
- Manually trigger BootNotification (if device supports it)

### Issue 2: BootNotification Sent But Database Error

**Symptoms:**
- BootNotification received
- Error in CSMS API logs
- Device NOT in database

**Cause:**
- Database connection issue
- API error
- Validation error

**Solution:**
- Check CSMS API logs
- Check database connectivity
- Verify API endpoint is accessible

### Issue 3: Device Registered But Not Visible

**Symptoms:**
- Device in database
- Device NOT in dashboard

**Cause:**
- Frontend cache issue
- API not returning device
- Filter/search issue

**Solution:**
- Refresh dashboard
- Check API response
- Verify device status

---

## 📝 Summary

**Device enters database at:** **Step 4** (after BootNotification is processed)

**Required steps:**
1. WebSocket connection ✅
2. BootNotification message ✅
3. CSMS API call ✅
4. **Database save** ✅ ← **HERE**
5. Response to device ✅

**Timeline:**
- Connection: ~1 second
- BootNotification: ~1-2 seconds after connection
- Database save: ~100-500ms after BootNotification
- **Total: ~2-3 seconds from connection to database**

**Current Status:**
- ❌ Device NOT in database (hasn't connected yet)
- ⚠️ Waiting for device to connect and send BootNotification

---

**Key Point:** The device must send a BootNotification message for it to be registered in the database. Just connecting via WebSocket is not enough!





