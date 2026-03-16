# Stuck Connector Issue - Root Cause & Solution

**Date**: December 20, 2025  
**Issue**: Connector keeps reporting "Preparing" status  
**Status**: ⚠️ **Device is actively sending status updates**

---

## 🔍 Root Cause

The connector status keeps reverting to "Preparing" because **the device is actively sending StatusNotification messages** with "Preparing" status. This is **normal OCPP behavior** - the system is correctly processing device status updates.

### What "Preparing" Status Means:
- **Preparing** = Connector is preparing for charging
- Typically occurs when:
  - ✅ EV is physically connected/plugged in
  - ✅ Charging cable is inserted
  - ✅ Device is waiting for charging authorization
  - ✅ Device is waiting for StartTransaction

---

## ⚠️ Why Status Keeps Reverting

Every time the device sends a StatusNotification with "Preparing", the system correctly updates the database. This is **working as designed** - the system reflects the actual device state.

**Timeline of Status Updates:**
1. Manual database update → "Available"
2. Device sends StatusNotification → "Preparing" (overwrites)
3. ChangeAvailability Inoperative → "Unavailable"
4. ChangeAvailability Operative → "Preparing" (device reports again)

---

## ✅ Solutions

### Solution 1: Check Physical Connection (RECOMMENDED)

**The device is likely reporting "Preparing" because an EV is physically connected:**

1. **Check Device Display**
   - Look at the charger display/screen
   - Check for "EV Connected" or similar message
   - Look for charging cable status

2. **Check Physical Connection**
   - Is an EV plugged into the charger?
   - Is the charging cable fully inserted?
   - Unplug the cable if no charging should occur

3. **Access Device Web Interface**
   - URL: http://192.168.0.100:80
   - Check device status page
   - Look for connector status
   - Check for any error messages

### Solution 2: Temporary Database Override

**Use the fix script to temporarily set status to Available:**

```bash
./fix-stuck-connector.sh
```

**Note**: This will be overwritten when the device sends the next StatusNotification.

### Solution 3: Wait for Device to Auto-Transition

**The device should eventually transition:**
- If EV is connected → Should go to "Charging" when StartTransaction occurs
- If EV is disconnected → Should go to "Available"
- If timeout occurs → Should go to "Available" or "Faulted"

---

## 🛠️ Long-term Solutions

### 1. Add Status Override Feature
Implement a way to override device status in the admin dashboard:
- "Force Available" button
- Override device status updates for X minutes
- Useful for troubleshooting

### 2. Add Status Timeout Handling
Auto-reset connector if stuck in intermediate state:
- If "Preparing" for > 5 minutes without StartTransaction
- Auto-reset to "Available"
- Log timeout event

### 3. Add Physical Connection Detection
Better UI indicators:
- Show if EV is physically connected
- Display charging cable status
- Show device-reported status vs system status

---

## 📋 Current Status

### Database Status:
- **Current**: Preparing (from device StatusNotification)
- **Last Update**: 2025-12-20 11:22:40
- **Source**: Device StatusNotification message

### Device Behavior:
- ✅ Connected to OCPP Gateway
- ✅ Sending regular Heartbeats
- ✅ Sending StatusNotification updates
- ⚠️ Reporting "Preparing" status

---

## 🔍 Diagnostic Steps

### 1. Check Device Web Interface
```bash
# Open in browser
http://192.168.0.100:80

# Or check via curl
curl http://192.168.0.100:80
```

### 2. Check Device Display
- Look at physical device display
- Check for status indicators
- Look for error messages

### 3. Monitor OCPP Messages
```bash
# Watch for StatusNotification messages
docker logs -f ev-billing-ocpp-gateway | grep "StatusNotification.*0900330710111935"
```

### 4. Check Database Status
```bash
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c \
  "SELECT charge_point_id, connector_id, status, error_code, last_status_update \
   FROM connectors WHERE charge_point_id = '0900330710111935';"
```

---

## ⚠️ Important Notes

1. **This is NOT a bug** - The system is working correctly
2. **Device status takes precedence** - Device-reported status is authoritative
3. **Physical check needed** - Check if EV is actually connected
4. **Status will update** - When device sends new StatusNotification

---

## 🎯 Next Steps

1. ✅ **Check Physical Connection** - Is an EV plugged in?
2. ✅ **Check Device Display** - What does the device show?
3. ✅ **Access Web Interface** - Check device status page
4. ✅ **Monitor Status** - Watch for status transitions
5. ✅ **Wait or Unplug** - Either wait for transition or unplug EV

---

**The connector status reflects the actual device state. If it keeps showing "Preparing", there's likely a physical connection (EV plugged in) that needs to be addressed.**

**Fix Script**: `./fix-stuck-connector.sh`  
**Device Web Interface**: http://192.168.0.100:80  
**Admin Dashboard**: http://localhost:8080/admin/ops/devices/0900330710111935

