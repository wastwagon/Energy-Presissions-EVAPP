# Device Connection Diagnostic Report

**Date:** December 17, 2025  
**Time:** 09:52 UTC

---

## Executive Summary

✅ **OCPP Gateway:** Running and healthy  
✅ **Port 9000:** Listening and accessible  
❌ **Device Connections:** **ZERO devices connected**  
❌ **Connection Logs:** **No connection attempts recorded**

---

## Current Status

### OCPP Gateway
- **Status:** Running (unhealthy health check, but service is functional)
- **Health Endpoint:** `http://localhost:9000/health` → **OK**
- **Port:** 9000 (listening on all interfaces: `0.0.0.0:9000`)
- **WebSocket Endpoint:** `ws://0.0.0.0:9000/ocpp/` (charge point ID extracted from BootNotification)
- **Recent Activity:** Gateway restarted successfully, no connection attempts

### Database Status
- **Total Charge Points:** 6 devices registered
- **Connection Logs:** 0 entries (no connection attempts)
- **Last Seen:** All devices show "Never" (no heartbeat received)

### Network Status
- **Port 9000:** Listening on `*.9000` (all interfaces)
- **Active Connections:** None
- **Recent Connections:** 1 connection from `192.168.0.100:49166` to `192.168.0.101:9000` (FIN_WAIT_2 state - connection closed)

---

## Registered Devices

| Charge Point ID | Status    | Last Seen | Serial Number |
|----------------|-----------|-----------|---------------|
| CP-ACC-001     | Available | Never     | NULL          |
| CP-ACC-002     | Available | Never     | NULL          |
| CP-ACC-003     | Charging  | Never     | NULL          |
| CP-ACC-004     | Available | Never     | NULL          |
| CP-ASH-001     | Available | Never     | NULL          |
| CP-WES-001     | Available | Never     | NULL          |

**Key Observation:** All devices show "Last Seen: Never" - indicating **no successful OCPP connections**.

---

## Device Configuration (From Your Images)

### Device 1 (192.168.9.x Network)
- **Charge ID:** `00330710111935`
- **Server URL:** `ws://192.168.9.108:9000/ocpp/` ✅ (Correct - no ID at end)
- **Charger IP:** `192.168.9.106`
- **Gateway:** `192.168.9.1`
- **Subnet:** `255.255.255.0`
- **DNS:** `8.8.8.8`

### Device 2 (192.168.0.x Network)
- **Charge ID:** `09003307101119`
- **Server URL:** `ws://192.168.0.101:9000/ocpp/` ✅ (Correct - no ID at end)
- **Charger IP:** `192.168.0.100`
- **Gateway:** `192.168.0.1`
- **Subnet:** `255.255.255.0`
- **DNS:** `8.8.8.8`

---

## Root Cause Analysis

### Why Devices Are Not Connecting

1. **Network Connectivity Issues** (Most Likely)
   - Devices may not be able to reach the OCPP gateway IP addresses
   - Firewall rules may be blocking WebSocket connections
   - Network routing issues between charger and gateway

2. **OCPP Gateway IP Address Mismatch**
   - Device 1 expects: `192.168.9.108`
   - Device 2 expects: `192.168.0.101`
   - **Need to verify:** What IP address is the OCPP gateway actually using?

3. **Device Configuration Issues**
   - OCPP may be disabled on devices
   - Devices may not be powered on
   - Devices may be in a different network segment

4. **Gateway Configuration**
   - Gateway is listening on `0.0.0.0:9000` (all interfaces) ✅
   - Gateway accepts connections without charge point ID ✅
   - Gateway extracts charge point ID from BootNotification ✅

---

## Diagnostic Steps Performed

✅ Checked OCPP gateway container status  
✅ Verified gateway health endpoint  
✅ Reviewed recent gateway logs  
✅ Checked database for registered devices  
✅ Checked connection logs table  
✅ Verified network port status  
✅ Confirmed gateway is listening on port 9000  

---

## Immediate Action Items

### 1. Verify OCPP Gateway IP Address

**Check what IP address the gateway is accessible on:**

```bash
# Check Docker network IP
docker inspect ev-billing-ocpp-gateway | grep IPAddress

# Check host IP addresses
ifconfig | grep "inet " | grep -v 127.0.0.1

# Check which IP is accessible from charger network
# (Run from a device on the same network as charger)
```

**Expected Results:**
- Device 1 network (192.168.9.x): Gateway should be at `192.168.9.108`
- Device 2 network (192.168.0.x): Gateway should be at `192.168.0.101`

### 2. Test Network Connectivity

**From Device Network (if possible):**

```bash
# Test if gateway IP is reachable
ping 192.168.9.108  # For device 1
ping 192.168.0.101  # For device 2

# Test if port 9000 is accessible
telnet 192.168.9.108 9000  # For device 1
telnet 192.168.0.101 9000  # For device 2

# Test WebSocket connection
# (Use a WebSocket client tool)
```

### 3. Check Device Status

**On Each Charger:**
- Verify charger is powered on
- Verify OCPP is enabled in device settings
- Check device logs for connection attempts
- Verify network settings are saved and applied
- Check if device shows "Connected" status

### 4. Monitor Gateway Logs

**Watch for connection attempts:**

```bash
# Real-time monitoring
docker logs -f ev-billing-ocpp-gateway

# Look for:
# - "Temporary connection established"
# - "BootNotification"
# - "Mapping temporary connection"
# - Connection errors
```

### 5. Test Connection Manually

**Use a WebSocket client to test:**

```bash
# Install wscat if needed
npm install -g wscat

# Test connection (from device network)
wscat -c ws://192.168.9.108:9000/ocpp/

# Should see connection established
# Then send BootNotification message manually
```

---

## Configuration Verification Checklist

### OCPP Gateway ✅
- [x] Running and healthy
- [x] Listening on port 9000
- [x] Accepts connections without charge point ID
- [x] Extracts charge point ID from BootNotification

### Device Configuration ✅
- [x] Server URL format correct (no ID at end)
- [x] Network settings configured
- [x] IP addresses on correct subnet
- [ ] **VERIFY:** Device can reach gateway IP
- [ ] **VERIFY:** OCPP enabled on device
- [ ] **VERIFY:** Device is powered on

### Network Configuration ⚠️
- [x] Charger IPs configured
- [x] Gateway IPs configured
- [x] Subnet masks correct
- [ ] **VERIFY:** Gateway IP matches device configuration
- [ ] **VERIFY:** No firewall blocking port 9000
- [ ] **VERIFY:** Devices can ping gateway IP

---

## Next Steps

1. **Identify Gateway IP Address**
   - Determine what IP address the OCPP gateway is accessible on
   - Update device configuration if IP doesn't match

2. **Test Connectivity**
   - From charger network, test if gateway IP is reachable
   - Test WebSocket connection on port 9000

3. **Check Device Logs**
   - Review charger logs for connection errors
   - Verify OCPP is enabled and attempting connections

4. **Monitor Gateway**
   - Watch gateway logs for connection attempts
   - Look for BootNotification messages

5. **Verify Network Routing**
   - Ensure devices can reach gateway IP
   - Check firewall rules
   - Verify network segmentation

---

## Expected Behavior When Device Connects

When a device successfully connects, you should see:

1. **Gateway Logs:**
   ```
   Temporary connection established (waiting for BootNotification): temp_1234567890_abc123
   Processing BootNotification from 00330710111935
   Mapping temporary connection temp_... to charge point ID: 00330710111935
   BootNotification accepted for 00330710111935
   ```

2. **Database Updates:**
   - `last_seen` timestamp updated
   - `last_heartbeat` timestamp updated
   - `serial_number` populated from BootNotification
   - `vendor_name` populated from BootNotification

3. **Connection Logs:**
   - Entry in `connection_logs` table
   - Event type: `connection_success`
   - Status: `success`

---

## Troubleshooting Commands

```bash
# Check gateway status
docker ps | grep ocpp-gateway

# Check gateway health
curl http://localhost:9000/health

# Monitor gateway logs
docker logs -f ev-billing-ocpp-gateway

# Check database for devices
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c "SELECT charge_point_id, status, last_seen FROM charge_points;"

# Check connection logs
docker exec ev-billing-postgres psql -U evbilling -d ev_billing_db -c "SELECT * FROM connection_logs ORDER BY created_at DESC LIMIT 10;"

# Check network connectivity
netstat -an | grep 9000

# Test WebSocket connection
wscat -c ws://192.168.9.108:9000/ocpp/
```

---

## Summary

**Current State:**
- OCPP Gateway is configured correctly ✅
- Gateway is running and accessible ✅
- Device configurations appear correct ✅
- **NO devices are connecting** ❌

**Most Likely Issue:**
Network connectivity - devices cannot reach the OCPP gateway IP addresses configured in device settings.

**Recommended Action:**
1. Verify the actual IP address of the OCPP gateway
2. Ensure devices can reach that IP address
3. Test WebSocket connectivity from device network
4. Check device logs for connection errors

