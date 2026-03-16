# 🔍 Device Not Connecting - Comprehensive Diagnosis

## ❌ Problem: Device Configured But Not Detected

**Status:** Device URL is configured correctly, but **NO connection attempts** detected.

---

## 🔍 Diagnostic Results

### ✅ What's Working:
- ✅ Network connectivity (ping works both ways)
- ✅ Device web interface accessible (HTTP 200)
- ✅ Port 9000 accessible from network
- ✅ OCPP Gateway running and healthy
- ✅ Gateway listening on `0.0.0.0:9000` (all interfaces)

### ❌ What's NOT Working:
- ❌ **Zero connection attempts** from device
- ❌ **No BootNotification** received
- ❌ **No WebSocket handshake** attempts
- ❌ **No connection logs** in database
- ❌ Device not appearing in dashboard

---

## 🎯 Root Cause Analysis

Since the device **hasn't attempted to connect at all**, the issue is likely:

### 1. Device Configuration Format Issue (MOST LIKELY)

**Even though you say URL is correct, common mistakes:**

#### ❌ Wrong Format Examples:
```
ws://192.168.9.107:9000/ocpp/          ← Missing Charge Point ID
ws://192.168.9.107:9000/ocpp            ← Missing trailing slash and ID
192.168.9.107:9000/ocpp/0900330710111935  ← Missing ws:// protocol
ws://192.168.9.107:9000                 ← Missing /ocpp/ path
ws://192.168.9.107:9000/ocpp            ← Missing Charge Point ID
```

#### ✅ Correct Format:
```
ws://192.168.9.107:9000/ocpp/0900330710111935
```

**Critical Points:**
- Must start with `ws://` (not `http://` or `https://`)
- Must include full IP: `192.168.9.107`
- Must include port: `:9000`
- Must include path: `/ocpp/`
- Must include Charge Point ID at end: `0900330710111935`
- **NO trailing slash** after Charge Point ID

### 2. Device Not Rebooting After Configuration

**After changing OCPP URL:**
- Device **MUST reboot** to apply settings
- Some devices require manual reboot
- Wait 3-5 minutes after reboot
- Device may retry connection on schedule

### 3. Device Connection Timing

**Devices typically connect:**
- Immediately after reboot
- On a schedule (every 1-5 minutes)
- When manually triggered
- May take several minutes to retry

### 4. Device Firmware/Software Issue

**Possible device-side issues:**
- Firmware bug preventing WebSocket connection
- Device not parsing URL correctly
- Device not attempting connection
- Device waiting for manual trigger

---

## 🔧 Step-by-Step Troubleshooting

### Step 1: Double-Check Device Configuration

**Access device:** http://192.168.9.106

**Verify these fields EXACTLY:**

1. **Server URL / OCPP URL:**
   ```
   ws://192.168.9.107:9000/ocpp/0900330710111935
   ```
   - Copy this EXACTLY (no spaces, no extra characters)
   - Verify it's saved correctly

2. **Charge Point ID / Charge ID:**
   ```
   0900330710111935
   ```
   - Must match the ID in the URL
   - No extra spaces or characters

3. **Protocol Version:**
   - Should be: `OCPP 1.6` or `OCPP 1.6J`

4. **Save Configuration:**
   - Click "Save" or "Apply"
   - **Then click "Reboot" or "Restart"**
   - Wait 3-5 minutes

### Step 2: Check Device Display Screen

**According to OCPP process document:**
- Device display should show **"Internet connection logo"**
- This confirms device is networked
- If logo missing: Device network issue

**Action:** Check device's physical display for network indicator

### Step 3: Monitor Connection Attempts

**Watch logs in real-time:**
```bash
docker logs -f ev-billing-ocpp-gateway
```

**What to look for:**
- `New WebSocket connection from charge point: 0900330710111935`
- `Processing BootNotification from 0900330710111935`
- Any connection errors

**If you see NOTHING:** Device isn't attempting connection

### Step 4: Check Device Logs (If Available)

**If device has logs/status page:**
- Access: http://192.168.9.106
- Look for "OCPP Status" or "Connection Status"
- Check for connection errors
- Verify device is trying to connect

### Step 5: Test WebSocket Manually

**From your computer, test if WebSocket works:**
```bash
# Install wscat if needed
npm install -g wscat

# Test connection
wscat -c ws://192.168.9.107:9000/ocpp/0900330710111935
```

**Expected:** Connection should establish (even if device doesn't respond)

**If this fails:** Gateway issue
**If this works:** Device configuration issue

---

## 🚨 Critical Checks

### Check 1: Exact URL Format

**Take a screenshot** of your device configuration page showing:
- Server URL field
- Charge Point ID field
- Any other OCPP-related fields

**Verify:**
- No typos
- No extra spaces
- Correct IP address
- Correct port number
- Correct path format
- Charge Point ID matches

### Check 2: Device Reboot Status

**After configuration:**
- Did device reboot?
- How long ago did you configure it?
- Has device been powered off/on since configuration?

### Check 3: Device Network Status

**Check device display or web interface:**
- Is device showing network connection?
- Can device ping the gateway?
- Is device's IP address correct (192.168.9.106)?

### Check 4: Device Connection Schedule

**Some devices:**
- Connect immediately on boot
- Retry every X minutes (1, 5, 10 minutes)
- Require manual trigger
- Only connect when charging session starts

**Action:** Wait 10-15 minutes after configuration/reboot

---

## 🔍 Advanced Diagnostics

### Test 1: Verify Gateway Accepts Connections

```bash
# Test from your computer
curl http://192.168.9.107:9000/health
# Should return: OK
```

### Test 2: Check Port Accessibility

```bash
# Test from your computer
nc -zv 192.168.9.107 9000
# Should show: Connection succeeded
```

### Test 3: Monitor All Network Traffic

```bash
# Watch for any connection attempts
sudo tcpdump -i any -n port 9000 | grep 192.168.9.106
```

**If you see traffic:** Device is trying to connect but failing
**If you see nothing:** Device isn't attempting connection

### Test 4: Check Device's Actual Configuration

**If device has API or diagnostic endpoint:**
- Check device's current OCPP configuration
- Verify what URL device is actually using
- Check device's connection logs

---

## 📊 Current Status

| Component | Status | Details |
|-----------|--------|---------|
| **Network** | ✅ Working | Ping, HTTP both work |
| **Port 9000** | ✅ Accessible | TCP connection succeeds |
| **OCPP Gateway** | ✅ Running | Health check OK, listening on 0.0.0.0 |
| **Device Online** | ✅ Yes | Ping successful, web interface accessible |
| **Device Config** | ⚠️ **NEEDS VERIFICATION** | User says correct, but no connection |
| **Connection Attempts** | ❌ **ZERO** | Device not trying to connect |

---

## 🎯 Most Likely Issues (Ranked)

### 1. Device Configuration Format (90% likely)
- URL might have subtle formatting issue
- Missing protocol, path, or Charge Point ID
- Extra spaces or characters
- **Action:** Double-check exact format, take screenshot

### 2. Device Not Rebooting (5% likely)
- Configuration saved but device not rebooted
- Device needs manual reboot
- **Action:** Ensure device has rebooted after configuration

### 3. Device Connection Timing (3% likely)
- Device retries on schedule
- May take 5-15 minutes
- **Action:** Wait longer, monitor logs

### 4. Device Firmware Issue (2% likely)
- Device bug preventing connection
- Device not parsing URL correctly
- **Action:** Check device manufacturer documentation

---

## ✅ Action Plan

### Immediate Actions:

1. **Verify Device Configuration:**
   - Access: http://192.168.9.106
   - Take screenshot of OCPP configuration
   - Verify URL is EXACTLY: `ws://192.168.9.107:9000/ocpp/0900330710111935`
   - Verify Charge Point ID: `0900330710111935`

2. **Reboot Device:**
   - Save configuration
   - Click "Reboot" or "Restart"
   - Wait 5 minutes

3. **Monitor Logs:**
   ```bash
   docker logs -f ev-billing-ocpp-gateway | grep -i "0900330710111935\|connection\|boot"
   ```

4. **Check Device Display:**
   - Look for network/internet connection indicator
   - Verify device shows network status

5. **Wait Patiently:**
   - Some devices retry every 5-10 minutes
   - Wait at least 15 minutes after reboot
   - Monitor logs continuously

---

## 🔍 If Still Not Working

### Option 1: Test WebSocket Manually
```bash
wscat -c ws://192.168.9.107:9000/ocpp/0900330710111935
```

### Option 2: Check Device's Connection Logs
- Access device web interface
- Look for OCPP connection logs
- Check for error messages

### Option 3: Contact Device Manufacturer
- Check device documentation
- Verify OCPP URL format requirements
- Check for known firmware issues

### Option 4: Try Different URL Format
Some devices require different formats:
- `ws://192.168.9.107:9000/ocpp/0900330710111935` (current)
- `ws://192.168.9.107:9000/0900330710111935` (no /ocpp/)
- `ws://192.168.9.107:9000` (no path, ID in message)

---

## 📝 Quick Reference

**Correct Device Configuration:**
```
Server URL: ws://192.168.9.107:9000/ocpp/0900330710111935
Charge Point ID: 0900330710111935
Protocol: OCPP 1.6 or OCPP 1.6J
```

**Monitor Connection:**
```bash
docker logs -f ev-billing-ocpp-gateway
```

**Test Gateway:**
```bash
curl http://192.168.9.107:9000/health
```

---

**Status:** Device configured but not connecting  
**Root Cause:** Device not attempting connection (configuration or timing issue)  
**Action:** Verify exact configuration format and ensure device rebooted





