# 🔍 Device Fetching Approach Review

## Current Issue

**Problem:** Device `0900330710111935` is not appearing in the dashboard, while `CP001` is shown but differs from the connected device.

---

## 📊 Current Database State

### Devices in Database:

| Charge Point ID | Vendor | Model | Serial Number | Status | Created | Last Heartbeat |
|----------------|--------|-------|---------------|--------|---------|----------------|
| **CP001** | DY | DY0131-BG132 | 2103241322012080001 | Offline | Dec 9 | Never |
| CP-ACC-001 | - | AC Wallbox 22kW | - | Available | Dec 11 | Never |
| CP-ACC-002 | - | DC Fast Charger 50kW | - | Available | Dec 11 | Never |
| CP-ACC-003 | - | AC Wallbox 22kW | - | Charging | Dec 11 | Never |
| CP-ACC-004 | - | DC Fast Charger 50kW | - | Available | Dec 11 | Never |
| CP-ASH-001 | - | DC Fast Charger 50kW | - | Available | Dec 11 | Never |
| CP-WES-001 | - | AC Wallbox 22kW | - | Available | Dec 11 | Never |

### Missing Device:
- **0900330710111935** - NOT in database (hasn't connected yet)

---

## 🔄 Device Registration Flow

### How Devices Are Registered:

1. **WebSocket Connection:**
   ```
   Device → ws://192.168.9.101:9000/ocpp/0900330710111935
   ```
   - Charge Point ID extracted from URL path: `0900330710111935`
   - Connection registered in OCPP Gateway

2. **BootNotification Message:**
   ```json
   [
     2,
     "message-id",
     "BootNotification",
     {
       "chargePointVendor": "DY",
       "chargePointModel": "DY0131-BG132",
       "chargePointSerialNumber": "900330710111935",
       "firmwareVersion": "0900337-10 4.0.0"
     }
   ]
   ```

3. **Data Sent to CSMS API:**
   ```json
   POST /api/internal/charge-points
   {
     "chargePointId": "0900330710111935",  // From URL
     "vendor": "DY",                        // From BootNotification
     "model": "DY0131-BG132",               // From BootNotification
     "serialNumber": "900330710111935",     // From BootNotification
     "firmwareVersion": "0900337-10 4.0.0"  // From BootNotification
   }
   ```

4. **Database Storage:**
   - `charge_point_id`: From URL (`0900330710111935`)
   - `vendor_name`: From BootNotification (`DY`)
   - `model`: From BootNotification (`DY0131-BG132`)
   - `serial_number`: From BootNotification (`900330710111935`)
   - `firmware_version`: From BootNotification (`0900337-10 4.0.0`)
   - `status`: Set to `Available`
   - `last_seen`: Current timestamp

---

## ⚠️ Potential Issues Found

### Issue 1: Charge Point ID Mismatch

**Problem:** The Charge Point ID comes from **URL path**, not from BootNotification payload.

**Current Flow:**
- URL: `ws://192.168.9.101:9000/ocpp/0900330710111935`
- Charge Point ID extracted: `0900330710111935` ✅
- This is correct!

**But:** If device connects with wrong URL, wrong ID will be used.

### Issue 2: Data Source Mismatch

**Problem:** Device details come from **BootNotification payload**, which may differ from device configuration page.

**Device Config Shows:**
- Charge ID: `09003307101119` (incomplete - missing last 2 digits)
- Serial Num: `900330710111935`
- Firmware: `0900337-10 4.0.0`

**BootNotification Will Send:**
- `chargePointVendor`: (from device firmware)
- `chargePointModel`: (from device firmware)
- `chargePointSerialNumber`: (from device firmware)
- `firmwareVersion`: (from device firmware)

**These may not match exactly!**

### Issue 3: No Connection Yet

**Status:** Device `0900330710111935` has **NOT** connected yet.

**Evidence:**
- No BootNotification logs found
- Device not in database
- No connection attempts in logs

---

## 🔍 Code Review

### BootNotification Handler (`ocpp-gateway/src/handlers/boot-notification.ts`)

```typescript
async handle(chargePointId: string, messageId: string, payload: BootNotificationPayload) {
  // chargePointId comes from URL path (extracted in index.ts)
  // payload contains device details from BootNotification message
  
  await this.notifyCSMS(chargePointId, payload);
  // Sends: chargePointId (from URL) + payload data (from message)
}
```

**Issue:** Charge Point ID from URL may not match device's actual ID.

### Internal Service (`backend/src/internal/internal.service.ts`)

```typescript
async upsertChargePoint(data: {
  chargePointId: string;  // From URL
  vendor?: string;        // From BootNotification
  model?: string;         // From BootNotification
  serialNumber?: string;  // From BootNotification
  // ...
}) {
  // Finds or creates charge point by chargePointId
  // Updates with BootNotification data
}
```

**Issue:** If device sends different Charge Point ID in BootNotification (if it includes one), it's ignored.

---

## ✅ Recommendations

### 1. Verify Device Configuration

**Check Device OCPP URL:**
- Must be: `ws://192.168.9.101:9000/ocpp/0900330710111935`
- Full Charge Point ID must be in URL

### 2. Monitor Connection Attempts

```bash
# Watch for connection attempts
docker logs -f ev-billing-ocpp-gateway | grep -i "0900330710111935\|boot\|connection"
```

### 3. Check BootNotification Payload

When device connects, verify what data it sends:
- Vendor name
- Model
- Serial number
- Firmware version

### 4. Add Logging

Add detailed logging to see exact data being sent:

```typescript
// In boot-notification.ts
logger.info(`BootNotification payload:`, JSON.stringify(payload, null, 2));
logger.info(`Charge Point ID from URL: ${chargePointId}`);
logger.info(`Data being sent to CSMS:`, {
  chargePointId,
  vendor: payload.chargePointVendor,
  model: payload.chargePointModel,
  serialNumber: payload.chargePointSerialNumber,
});
```

### 5. Verify Data Consistency

**Expected Data Flow:**
```
Device Config Page:
  Charge ID: 0900330710111935
  Serial: 900330710111935

Device Connects:
  URL: ws://.../ocpp/0900330710111935
  BootNotification: {
    chargePointSerialNumber: "900330710111935"  // Should match
  }

Database:
  charge_point_id: "0900330710111935"  // From URL
  serial_number: "900330710111935"     // From BootNotification
```

---

## 🎯 Action Items

1. ✅ **Verify Device Configuration** - Ensure OCPP URL includes full Charge Point ID
2. ⬜ **Monitor Connection** - Watch logs for connection attempts
3. ⬜ **Check BootNotification** - Verify payload data when device connects
4. ⬜ **Compare Data** - Ensure device config matches BootNotification data
5. ⬜ **Add Enhanced Logging** - Log exact data being sent/received

---

## 📝 Summary

**Current Status:**
- Device fetching approach is **correct**
- Charge Point ID comes from URL (as per OCPP spec)
- Device details come from BootNotification (as per OCPP spec)
- **Device hasn't connected yet** - that's why it's not showing

**Next Steps:**
1. Ensure device is configured with correct OCPP URL
2. Wait for device to connect and send BootNotification
3. Verify data matches between device config and BootNotification
4. Device will appear automatically after connection

---

**Review Date:** December 16, 2025  
**Status:** Device fetching logic is correct, awaiting device connection





