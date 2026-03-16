# 🔌 Device Configuration Guide
**Device IP:** 192.168.9.106  
**System IP:** 192.168.9.101  
**Date:** December 11, 2025

---

## ✅ Device Status

- **IP Address:** 192.168.9.106 ✅
- **MAC Address:** 50:2e:9f:30:0:9c
- **Network:** 192.168.9.0/24
- **Reachability:** ✅ Online (ping successful, avg 3.26ms)
- **Web Interface:** ✅ Accessible at http://192.168.9.106
- **OCPP Status:** ⚠️ Not yet connected

---

## 🚀 Quick Connection Steps

### Step 1: Access Device Web Interface

1. Open browser: **http://192.168.9.106**
2. Login if required (check device manual for default credentials)
3. Navigate to **OCPP Settings** or **Network Settings**

### Step 2: Configure OCPP Connection

**Enter these values:**

| Setting | Value |
|---------|-------|
| **OCPP Central System URL** | `ws://192.168.9.101:9000/ocpp/YOUR_CHARGE_POINT_ID` |
| **Charge Point ID** | Choose one:<br>- Device serial number<br>- `CP-192-168-9-106`<br>- `CP-ACC-006` (next available) |
| **Protocol** | OCPP 1.6J |
| **Heartbeat Interval** | 300 seconds (default) |

**Important:** Replace `YOUR_CHARGE_POINT_ID` with your chosen Charge Point ID.

### Step 3: Save Configuration

- Click **Save** or **Apply**
- Device may restart to apply changes
- Wait 1-2 minutes for device to reconnect

### Step 4: Monitor Connection

```bash
# Watch connection logs in real-time
docker logs -f ev-billing-ocpp-gateway

# Or check recent logs
docker logs ev-billing-ocpp-gateway --tail 50 | grep -i "192.168.9.106\|connection"
```

**Expected log output when device connects:**
```
[info]: New WebSocket connection from charge point: YOUR_CHARGE_POINT_ID
[info]: Connection registered for charge point: YOUR_CHARGE_POINT_ID
```

### Step 5: Verify Registration

1. **Login to Dashboard:** http://localhost:8080
2. **Go to:** Super Admin → Device Inventory
3. **Device should appear** with:
   - Charge Point ID: (the ID you configured)
   - IP Address: 192.168.9.106
   - Status: **Online** or **Available**
   - Last Heartbeat: (recent timestamp)

---

## 🔍 Troubleshooting

### Device Not Connecting?

1. **Check OCPP Gateway is running:**
   ```bash
   docker ps | grep ocpp-gateway
   curl http://localhost:9000/health
   ```
   Should return: `OK`

2. **Verify network connectivity:**
   ```bash
   ping 192.168.9.106
   ```
   Should show 0% packet loss

3. **Check firewall:**
   - Ensure port 9000 is not blocked
   - Test: `nc -zv 192.168.9.101 9000`

4. **Verify OCPP URL format:**
   - ✅ Correct: `ws://192.168.9.101:9000/ocpp/CP001`
   - ❌ Wrong: `http://192.168.9.101:9000/ocpp/CP001` (use `ws://`)
   - ❌ Wrong: `ws://192.168.9.101:9000` (missing `/ocpp/CP001`)

5. **Check device logs:**
   - Access device web interface: http://192.168.9.106
   - Look for OCPP connection logs or error messages

### Connection Established But No Heartbeat?

1. **Check device configuration:**
   - Verify heartbeat interval is set (default: 300 seconds)
   - Ensure device is not in sleep mode

2. **Check OCPP Gateway logs:**
   ```bash
   docker logs ev-billing-ocpp-gateway --tail 100 | grep -i heartbeat
   ```

3. **Verify BootNotification was received:**
   ```bash
   docker logs ev-billing-ocpp-gateway --tail 100 | grep -i boot
   ```

---

## 📊 Connection Test Commands

```bash
# Test device reachability
ping -c 3 192.168.9.106

# Test web interface
curl -I http://192.168.9.106

# Test OCPP Gateway health
curl http://localhost:9000/health

# Check if device is connected
docker logs ev-billing-ocpp-gateway --tail 50 | grep -i "192.168.9.106\|YOUR_CHARGE_POINT_ID"

# Monitor all connections
docker logs -f ev-billing-ocpp-gateway | grep -i connection
```

---

## 📝 Configuration Checklist

- [ ] Device is reachable (ping successful)
- [ ] Web interface accessible (http://192.168.9.106)
- [ ] OCPP Gateway is running (port 9000)
- [ ] Charge Point ID chosen and documented
- [ ] OCPP URL configured on device
- [ ] Configuration saved on device
- [ ] Device restarted (if required)
- [ ] Connection logs monitored
- [ ] Device appears in dashboard
- [ ] Heartbeat received (within 5 minutes)

---

## 🎯 Expected Behavior After Configuration

1. **Within 30 seconds:** Device establishes WebSocket connection
2. **Within 1 minute:** BootNotification message received
3. **Within 2 minutes:** Device appears in dashboard
4. **Every 5 minutes:** Heartbeat message received
5. **Status:** Device shows as "Online" or "Available"

---

## 📞 Quick Reference

**Device IP:** 192.168.9.106  
**System IP:** 192.168.9.101  
**OCPP Gateway:** ws://192.168.9.101:9000/ocpp/{CHARGE_POINT_ID}  
**Web Interface:** http://192.168.9.106  
**Dashboard:** http://localhost:8080  
**API:** http://localhost:3000/api

---

**Configuration Guide Created:** December 11, 2025  
**Device Status:** Ready for OCPP Configuration





