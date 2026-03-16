# Connection Review and Configuration Update

## Summary

Your OCPP gateway has been updated to support connections **without** the charge station ID in the URL, as per your manufacturer's instructions.

---

## Changes Made

### 1. **Connection Manager Updates** (`ocpp-gateway/src/services/connection-manager.ts`)

- Added support for **temporary connections** without charge point ID
- Added `addTemporaryConnection()` method to store connections waiting for BootNotification
- Added `mapConnectionToChargePointId()` method to map temporary connections to actual charge point IDs
- Added `getChargePointId()` method to retrieve charge point ID from WebSocket
- Added `removeConnectionByWebSocket()` method for cleanup

### 2. **WebSocket Connection Handler** (`ocpp-gateway/src/index.ts`)

- **Modified to accept connections to `/ocpp/` without requiring charge point ID in URL**
- Creates temporary connection when charge point ID is not in URL
- Charge point ID will be extracted from `BootNotification` message's `chargePointSerialNumber` field
- Still supports legacy format `/ocpp/{chargePointId}` for backward compatibility

### 3. **BootNotification Handler** (`ocpp-gateway/src/handlers/boot-notification.ts`)

- **Extracts charge point ID from `chargePointSerialNumber`** in BootNotification payload
- Maps temporary connection to actual charge point ID
- Uses the serial number as the charge point identifier (matches your device's Charge ID)

### 4. **Message Router** (`ocpp-gateway/src/services/message-router.ts`)

- Updated to pass WebSocket to BootNotification handler for connection mapping
- Handles both temporary and permanent connections

---

## How It Works Now

### Connection Flow (Without Charge Point ID in URL)

1. **Device Connects:**
   ```
   Device → ws://192.168.9.108:9000/ocpp/
   ```
   - No charge point ID in URL ✅ (as per manufacturer instructions)

2. **Temporary Connection Created:**
   - Gateway creates temporary connection with ID like `temp_1234567890_abc123`
   - Connection is stored and waiting for BootNotification

3. **BootNotification Received:**
   ```json
   {
     "chargePointVendor": "DY",
     "chargePointModel": "DY0131-BG132",
     "chargePointSerialNumber": "00330710111935",  // ← This becomes the charge point ID
     "firmwareVersion": "0900337-10 4.0.0"
   }
   ```

4. **Connection Mapped:**
   - Temporary connection is mapped to charge point ID: `00330710111935`
   - All future messages use this charge point ID
   - Charge point is registered in database

5. **Connection Established:**
   - Connection is now fully identified and operational
   - All OCPP messages work normally

---

## Your Device Configuration

Based on the images you provided:

### Image 1 Configuration:
- **Charge ID:** `00330710111935`
- **Server URL:** `ws://192.168.9.108:9000/ocpp/` ✅ (Correct - no ID at end)
- **Charger IP:** `192.168.9.106`
- **Gateway:** `192.168.9.1`
- **Subnet:** `255.255.255.0`
- **DNS:** `8.8.8.8`

### Image 2 Configuration:
- **Charge ID:** `09003307101119`
- **Server URL:** `ws://192.168.0.101:9000/ocpp/` ✅ (Correct - no ID at end)
- **Charger IP:** `192.168.0.100`
- **Gateway:** `192.168.0.1`
- **Subnet:** `255.255.255.0`
- **DNS:** `8.8.8.8`

---

## Network Configuration Review

### ✅ Network Settings Are Correct

Both configurations show proper network setup:

1. **IP Addresses:** Static IPs assigned to chargers
2. **Gateway:** Correct gateway addresses configured
3. **Subnet Mask:** Standard `/24` subnet (`255.255.255.0`)
4. **DNS:** Google DNS (`8.8.8.8`) configured
5. **Server URL:** Points to OCPP gateway without charge point ID ✅

### Network Connectivity Check

**For Image 1 (192.168.9.x network):**
- Charger IP: `192.168.9.106`
- Server IP: `192.168.9.108`
- ✅ Both on same subnet - can communicate

**For Image 2 (192.168.0.x network):**
- Charger IP: `192.168.0.100`
- Server IP: `192.168.0.101`
- ✅ Both on same subnet - can communicate

---

## Important Notes

### Charge Point ID Source

The charge point ID will be extracted from the **`chargePointSerialNumber`** field in the BootNotification message. This should match the **Charge ID** shown in your device configuration page.

**Example:**
- Device config shows: Charge ID = `00330710111935`
- BootNotification sends: `chargePointSerialNumber = "00330710111935"`
- System uses: `00330710111935` as charge point ID ✅

### Backward Compatibility

The system still supports the **legacy format** with charge point ID in URL:
- `ws://192.168.9.108:9000/ocpp/00330710111935` (still works)

But your manufacturer's format is now supported:
- `ws://192.168.9.108:9000/ocpp/` ✅ (preferred)

---

## Testing the Connection

### 1. Check OCPP Gateway Logs

```bash
docker logs -f ev-billing-ocpp-gateway
```

Look for:
- `Temporary connection established (waiting for BootNotification)`
- `Mapping temporary connection temp_... to charge point ID: 00330710111935`
- `BootNotification accepted for 00330710111935`

### 2. Verify Connection Status

```bash
# Check if charge point is connected
curl http://localhost:9000/health/connection/00330710111935
```

### 3. Check Database

The charge point should be automatically registered in the database after BootNotification.

---

## Next Steps

1. **Restart OCPP Gateway** to apply changes:
   ```bash
   docker-compose restart ocpp-gateway
   ```

2. **Monitor Connection:**
   - Watch gateway logs for connection attempts
   - Verify BootNotification is received and processed
   - Check that charge point ID is correctly mapped

3. **Verify Registration:**
   - Check database for new charge point record
   - Verify charge point appears in dashboard

---

## Troubleshooting

### If Connection Fails:

1. **Check Network Connectivity:**
   ```bash
   # From charger network, test connectivity
   ping 192.168.9.108  # or 192.168.0.101
   ```

2. **Check Firewall:**
   - Ensure port 9000 is open
   - Check if WebSocket connections are allowed

3. **Check OCPP Gateway:**
   ```bash
   docker logs ev-billing-ocpp-gateway | grep -i error
   ```

4. **Verify BootNotification:**
   - Check logs for BootNotification message
   - Verify `chargePointSerialNumber` is present
   - Ensure serial number matches Charge ID from device config

### Common Issues:

**Issue:** Connection established but no BootNotification received
- **Solution:** Check device logs, verify OCPP is enabled on device

**Issue:** BootNotification received but connection not mapped
- **Solution:** Check logs for mapping errors, verify serial number format

**Issue:** Charge point ID mismatch
- **Solution:** Ensure `chargePointSerialNumber` in BootNotification matches Charge ID from device config

---

## Summary

✅ **Connection format updated** - Now supports `/ocpp/` without charge point ID  
✅ **Network configuration reviewed** - Settings are correct  
✅ **Charge point ID extraction** - From BootNotification serial number  
✅ **Backward compatibility** - Legacy format still supported  

Your device should now connect successfully using the manufacturer's recommended format: `ws://192.168.x.x:9000/ocpp/`
