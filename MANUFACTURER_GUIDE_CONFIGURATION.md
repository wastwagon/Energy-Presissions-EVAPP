# 📖 Manufacturer Guide - Configuration Instructions

## ✅ Guide Analysis

Based on the manufacturer's guide you shared, here's how to configure your charge station correctly.

---

## 🔍 Key Configuration Fields (From Guide)

### 1. Charge ID (Critical)
- **Field:** `Charge ID(MaxLen 18)`
- **Example in guide:** `1103262423090002`
- **Your value:** `0900330710111935` ✅
- **Note:** Must match the Charge Point ID in your Server URL

### 2. Server URL (MOST CRITICAL)
- **Field:** `Server URL(ws:// MaxLen 100)`
- **Example in guide:** `ws://xz35841552.zicp.vip/steve/w`
- **Your value:** `ws://192.168.9.108:9000/ocpp/0900330710111935` ✅

**Important Format:**
- Must start with `ws://` (not `http://` or `https://`)
- Include full IP address: `192.168.9.108`
- Include port: `:9000`
- Include path: `/ocpp/`
- Include Charge Point ID: `0900330710111935`

### 3. Network Settings

#### Charger IP
- **Field:** `Charger IP`
- **Example in guide:** `192.168.2.41`
- **Your value:** `192.168.9.106` ✅ (already configured)

#### Subnet Mask
- **Field:** `Subnet Mask`
- **Example in guide:** `255.255.255.255` ⚠️ **This looks incorrect!**
- **Your value should be:** `255.255.255.0` (standard for 192.168.9.x network)

**⚠️ Warning:** The example shows `255.255.255.255` which is a /32 subnet (single host). This is unusual. For a standard LAN, use `255.255.255.0`.

#### Default Gateway
- **Field:** `Default Gateway`
- **Example in guide:** `192.168.1.1`
- **Your value:** Likely `192.168.9.1` (check your router)

#### DNS
- **Field:** `Charger DNS`
- **Example in guide:** `8.8.8.8` (Google DNS)
- **Your value:** Can use `8.8.8.8` or your router's DNS

---

## 📝 Step-by-Step Configuration (Based on Guide)

### Step 1: Access Configuration Page
1. Open browser: http://192.168.9.106
2. Log in (if required)
3. Navigate to "Configure Charger Parameters" page

### Step 2: Enter Charge ID
- **Field:** `Charge ID(MaxLen 18)`
- **Enter:** `0900330710111935`
- **Verify:** Matches your device's serial number

### Step 3: Enter Server URL (CRITICAL)
- **Field:** `Server URL(ws:// MaxLen 100)`
- **Enter EXACTLY:**
  ```
  ws://192.168.9.108:9000/ocpp/0900330710111935
  ```

**Checklist:**
- [ ] Starts with `ws://` (lowercase)
- [ ] Full IP: `192.168.9.108`
- [ ] Port: `:9000`
- [ ] Path: `/ocpp/`
- [ ] Charge Point ID: `0900330710111935`
- [ ] No extra spaces
- [ ] No trailing slash after ID

### Step 4: Verify Network Settings
- **Charger IP:** `192.168.9.106` (should already be set)
- **Subnet Mask:** `255.255.255.0` (NOT `255.255.255.255`)
- **Default Gateway:** `192.168.9.1` (check your router)
- **DNS:** `8.8.8.8` (or your router's DNS)

### Step 5: Save and Reboot
1. **Click "Set and Reboot" button**
2. **Wait for "Success" prompt**
3. **Wait for charger to restart** (2-3 minutes)
4. **Verify:** Check charger display screen shows SN code

---

## 🔍 Verification Steps (From Guide)

### After Reboot:
1. **Check Display Screen:**
   - Should show SN code: `0900330710111935`
   - Should show network connection indicator
   - Should show OCPP connection status (if available)

2. **Check Web Interface:**
   - Access: http://192.168.9.106
   - Verify Server URL is saved correctly
   - Check connection status

3. **Monitor OCPP Gateway:**
   ```bash
   docker logs -f ev-billing-ocpp-gateway | grep -i "0900330710111935\|connection\|boot"
   ```

**Expected Output:**
```
New WebSocket connection from charge point: 0900330710111935
Processing BootNotification from 0900330710111935
BootNotification accepted for 0900330710111935
```

---

## ⚠️ Common Configuration Mistakes

### Mistake 1: Wrong Server URL Format
- ❌ `http://192.168.9.108:9000/ocpp/0900330710111935` (wrong protocol)
- ❌ `ws://192.168.9.108:9000` (missing path and ID)
- ❌ `ws://192.168.9.108:9000/ocpp/` (missing Charge Point ID)
- ✅ `ws://192.168.9.108:9000/ocpp/0900330710111935` (correct)

### Mistake 2: Wrong Subnet Mask
- ❌ `255.255.255.255` (single host, won't work on LAN)
- ✅ `255.255.255.0` (standard LAN subnet)

### Mistake 3: Not Clicking "Set and Reboot"
- ❌ Just clicking "Save" without rebooting
- ✅ Must click "Set and Reboot" button
- ✅ Wait for "Success" prompt
- ✅ Wait for device to restart

### Mistake 4: Charge ID Mismatch
- ❌ Charge ID doesn't match Server URL
- ✅ Charge ID: `0900330710111935`
- ✅ Server URL ends with: `/ocpp/0900330710111935`

---

## 📊 Configuration Comparison

| Field | Guide Example | Your Configuration |
|-------|--------------|-------------------|
| **Charge ID** | `1103262423090002` | `0900330710111935` ✅ |
| **Server URL** | `ws://xz35841552.zicp.vip/steve/w` | `ws://192.168.9.108:9000/ocpp/0900330710111935` ✅ |
| **Charger IP** | `192.168.2.41` | `192.168.9.106` ✅ |
| **Subnet Mask** | `255.255.255.255` ⚠️ | `255.255.255.0` ✅ |
| **Gateway** | `192.168.1.1` | `192.168.9.1` (check) |
| **DNS** | `8.8.8.8` | `8.8.8.8` ✅ |

---

## 🎯 Key Points from Guide

### 1. "Set and Reboot" is Required
The guide explicitly states:
> "Click the 'Set and Reboot' button, and you should see the 'Success' prompt."

**This is critical!** Settings won't apply without rebooting.

### 2. Verification Method
The guide says:
> "After restarting, the charger's display screen should show the same SN code as the one set."

**Check the display screen** to verify configuration took effect.

### 3. Server URL Format
The guide shows:
- Format: `ws://` (WebSocket protocol)
- Max length: 100 characters
- Must include full URL with path

---

## ✅ Configuration Checklist

Based on the manufacturer guide:

- [ ] Access configuration page: http://192.168.9.106
- [ ] Enter Charge ID: `0900330710111935`
- [ ] Enter Server URL: `ws://192.168.9.108:9000/ocpp/0900330710111935`
- [ ] Verify Subnet Mask: `255.255.255.0` (not 255.255.255.255)
- [ ] Set Default Gateway: `192.168.9.1` (or your router IP)
- [ ] Set DNS: `8.8.8.8` (or your router DNS)
- [ ] **Click "Set and Reboot" button**
- [ ] Wait for "Success" prompt
- [ ] Wait 2-3 minutes for restart
- [ ] Check display screen for SN code
- [ ] Monitor OCPP Gateway logs

---

## 🔍 Troubleshooting Based on Guide

### If "Success" Prompt Doesn't Appear:
- Check all fields are filled correctly
- Verify Server URL format
- Check network connectivity
- Try again

### If Display Doesn't Show SN Code:
- Wait longer (may take 3-5 minutes)
- Check if device actually rebooted
- Verify configuration was saved
- Check device logs (if available)

### If Device Doesn't Connect:
- Verify Server URL is correct
- Check network settings (IP, Gateway, DNS)
- Verify OCPP Gateway is running
- Check firewall settings
- Monitor OCPP Gateway logs

---

## 📝 Summary

**Based on the manufacturer guide:**

1. **Configuration Page:** Access via http://192.168.9.106
2. **Charge ID:** `0900330710111935`
3. **Server URL:** `ws://192.168.9.108:9000/ocpp/0900330710111935`
4. **Network:** Verify subnet mask is `255.255.255.0` (not `255.255.255.255`)
5. **Action:** Click "Set and Reboot" button
6. **Verification:** Check display screen shows SN code
7. **Monitor:** Watch OCPP Gateway logs for connection

**The guide confirms your approach is correct - just ensure all fields are set properly and device is rebooted!**

---

**Status:** Manufacturer guide reviewed  
**Action:** Configure device using guide format  
**Expected:** Device connects after "Set and Reboot"





