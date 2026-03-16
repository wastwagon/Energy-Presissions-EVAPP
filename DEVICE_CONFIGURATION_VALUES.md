# 🔧 Device Configuration - Exact Values to Enter
**Device IP:** 192.168.9.106  
**Charge Point ID:** `09003307101119`  
**Date:** December 11, 2025

---

## ✅ Information Found from Device Interface

### Device Details
- **Charge Point ID:** `0900330710111935` ✅ (Already configured)
- **Serial Number:** `900330710111935`
- **Firmware Version:** `0900337-10 4.0.0`
- **MAC Address:** `52:88:FF:DD:8F:4`
- **Current IP:** `192.168.9.106` ✅

### Current Configuration Issues
- ⚠️ **OCPP Server URL:** `ws://ocpp.electro.cars/ws` (Wrong - pointing to external server)
- ⚠️ **System Time:** `1970-01-01 00:50` (Wrong - Unix epoch, needs correction)
- ⚠️ **Security:** Weak passwords detected

---

## 🎯 Required Changes

### 1. OCPP Server URL (CRITICAL)

**Current Value:**
```
ws://ocpp.electro.cars/ws
```

**Change To:**
```
ws://192.168.9.101:9000/ocpp/0900330710111935
```

**Important Notes:**
- Use your system's IP: `192.168.9.101`
- Port: `9000` (OCPP Gateway port)
- Path: `/ocpp/09003307101119` (must include Charge Point ID)
- Protocol: `ws://` (WebSocket, not http://)

### 2. System Time (IMPORTANT)

**Current Value:**
```
1970-01-01 00:50
```

**Change To:**
```
2025-12-11 12:00:00
```
(Or current date/time when configuring)

**Format:** `YYYY-mm-dd HH:MM:SS`

**Why This Matters:**
- Incorrect timestamps affect transaction logging
- May cause certificate validation issues
- Affects heartbeat and status reporting accuracy

### 3. Network Settings (Verify)

**Current Settings:**
- **Charger IP:** `192.168.9.106` ✅ (Correct)
- **Default Gateway:** `192.168.1.1` ⚠️ (May need to change to `192.168.9.1`)
- **Subnet Mask:** `255.255.255.0` ✅ (Correct for /24)
- **DNS:** `8.8.8.8` ✅ (Google DNS - OK)
- **DHCP:** `1` ✅ (Enabled - OK)

**Gateway Check:**
- If your router is `192.168.9.1`, change gateway to match
- If gateway is actually `192.168.1.1`, verify network routing

---

## 📝 Step-by-Step Configuration

### Step 1: Access Configuration Page
1. Open browser: **http://192.168.9.106**
2. Login with current credentials
3. Navigate to configuration page

### Step 2: Update OCPP Server URL

1. **Find Field:** "Server URL (ws:// MaxLen 100)"
2. **Clear Current Value:** `ws://ocpp.electro.cars/ws`
3. **Enter New Value:**
   ```
   ws://192.168.9.101:9000/ocpp/0900330710111935
   ```
4. **Verify:** 
   - Starts with `ws://`
   - Includes IP: `192.168.9.101`
   - Includes port: `:9000`
   - Includes path: `/ocpp/0900330710111935`

### Step 3: Update System Time

1. **Find Field:** "System Time (YYYY-mm-dd HH:MM:SS)"
2. **Enter Current Date/Time:**
   ```
   2025-12-11 12:00:00
   ```
   (Adjust to current time when configuring)
3. **Format:** `YYYY-mm-dd HH:MM:SS` (24-hour format)

### Step 4: Verify Network Settings

1. **Charger IP:** `192.168.9.106` ✅ (Keep as is)
2. **Default Gateway:** 
   - Check your router IP (likely `192.168.9.1`)
   - Update if different from `192.168.1.1`
3. **Subnet Mask:** `255.255.255.0` ✅ (Keep as is)
4. **DNS:** `8.8.8.8` ✅ (Keep as is)

### Step 5: Save and Reboot

1. **Click:** "Set and Reboot" button
2. **Wait:** 1-2 minutes for device to restart
3. **Monitor:** Connection logs after reboot

---

## 🔍 Verification Steps

### After Configuration

1. **Check OCPP Gateway Logs:**
   ```bash
   docker logs -f ev-billing-ocpp-gateway
   ```

2. **Expected Log Output:**
   ```
   [info]: New WebSocket connection from charge point: 09003307101119
   [info]: Connection registered for charge point: 09003307101119
   [info]: BootNotification received from 09003307101119
   ```

3. **Check Dashboard:**
   - Login: http://localhost:8080
   - Navigate: Super Admin → Device Inventory
   - Look for: Charge Point ID `09003307101119`
   - Status should be: **Online** or **Available**

4. **Verify Heartbeat:**
   - Within 5 minutes, device should send heartbeat
   - Check "Last Heartbeat" timestamp in dashboard
   - Should update every ~5 minutes

---

## 🚨 Troubleshooting

### Device Not Connecting?

1. **Verify OCPP URL Format:**
   - ✅ Correct: `ws://192.168.9.101:9000/ocpp/09003307101119`
   - ❌ Wrong: `ws://ocpp.electro.cars/ws` (old value)
   - ❌ Wrong: `http://192.168.9.101:9000/ocpp/09003307101119` (use ws://)
   - ❌ Wrong: `ws://192.168.9.101:9000` (missing path)

2. **Check Network Connectivity:**
   ```bash
   # Test device can reach OCPP Gateway
   ping 192.168.9.101
   
   # Test OCPP Gateway is running
   curl http://localhost:9000/health
   ```

3. **Check Gateway IP:**
   - Device needs to reach `192.168.9.101:9000`
   - Verify no firewall blocking port 9000
   - Ensure both devices on same network (192.168.9.0/24)

4. **Check System Time:**
   - Incorrect time may cause connection issues
   - Update to current date/time
   - Device may sync time after connecting

### Connection Established But No Data?

1. **Check BootNotification:**
   ```bash
   docker logs ev-billing-ocpp-gateway --tail 100 | grep -i boot
   ```

2. **Check Heartbeat:**
   ```bash
   docker logs ev-billing-ocpp-gateway --tail 100 | grep -i heartbeat
   ```

3. **Verify Charge Point ID:**
   - Must match exactly: `09003307101119`
   - Case-sensitive
   - No extra spaces

---

## 🔐 Security Recommendations

### Current Security Issues

1. **Weak Passwords:**
   - WiFi Password: `12345678` ⚠️
   - Authentication Key: `12345678` ⚠️
   - Login Password: (check if default)

2. **HTTP Not HTTPS:**
   - Configuration page uses HTTP (not secure)
   - Passwords transmitted in plain text

### Recommended Actions

1. **Change Passwords:**
   - Use strong, unique passwords
   - At least 12 characters
   - Mix of letters, numbers, symbols

2. **Network Security:**
   - Consider isolating device on separate VLAN
   - Use firewall rules to restrict access
   - Enable HTTPS if device supports it

3. **Regular Updates:**
   - Keep firmware updated
   - Monitor for security patches
   - Review access logs regularly

---

## 📊 Configuration Summary

| Setting | Current Value | New Value | Status |
|---------|--------------|-----------|--------|
| **Charge Point ID** | `0900330710111935` | `0900330710111935` | ✅ Keep |
| **OCPP Server URL** | `ws://ocpp.electro.cars/ws` | `ws://192.168.9.101:9000/ocpp/0900330710111935` | ⚠️ **CHANGE** |
| **System Time** | `1970-01-01 00:50` | `2025-12-11 12:00:00` | ⚠️ **CHANGE** |
| **Charger IP** | `192.168.9.106` | `192.168.9.106` | ✅ Keep |
| **Default Gateway** | `192.168.1.1` | `192.168.9.1` (verify) | ⚠️ **VERIFY** |
| **Subnet Mask** | `255.255.255.0` | `255.255.255.0` | ✅ Keep |
| **DNS** | `8.8.8.8` | `8.8.8.8` | ✅ Keep |

---

## ✅ Quick Reference

**Device Configuration URL:** http://192.168.9.106  
**Charge Point ID:** `0900330710111935`  
**OCPP Gateway URL:** `ws://192.168.9.101:9000/ocpp/0900330710111935`  
**System IP:** `192.168.9.101`  
**Device IP:** `192.168.9.106`  
**Dashboard:** http://localhost:8080

---

**Configuration Guide Created:** December 11, 2025  
**Ready for:** OCPP Connection Setup





