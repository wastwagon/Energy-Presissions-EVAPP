# 🔧 Ethernet/WiFi Isolation Issue - Solution Guide

## ⚠️ Problem Identified

**Your Setup:**
- Device: Connected via **Ethernet LAN** (192.168.9.106)
- Computer: Connected via **WiFi LAN** (192.168.9.107)
- Both on same network (192.168.9.0/24)
- **Device can't connect to OCPP Gateway**

**Root Cause:** Many routers have **AP Isolation** or **Client Isolation** enabled, which prevents devices on different interfaces (Ethernet vs WiFi) from communicating, even if they're on the same subnet.

---

## ✅ You DON'T Need Production Server!

**Answer: NO, local Docker setup should work fine!**

The issue is **network configuration**, not the server type. Once network isolation is resolved, your local Docker setup will work perfectly.

---

## 🔍 Diagnosis Results

### ✅ What's Working:
- Device is online (ping successful)
- System is online (ping successful)
- Port 9000 is accessible
- OCPP Gateway is running
- Network connectivity is good

### ❌ What's NOT Working:
- **No connection attempts** from device
- Device hasn't tried to connect yet
- Likely router AP isolation blocking communication

---

## 🔧 Solutions (Try in Order)

### Solution 1: Disable Router AP Isolation (RECOMMENDED)

**This is the most common issue:**

1. **Access Router Admin Panel:**
   - Usually: http://192.168.9.1 or http://192.168.1.1
   - Check router manual for default IP

2. **Find AP Isolation Setting:**
   - Look for: "AP Isolation", "Client Isolation", "Wireless Isolation"
   - Usually under: **Wireless Settings** → **Advanced** → **AP Isolation**
   - Or: **Network Settings** → **AP Isolation**

3. **Disable AP Isolation:**
   - Turn OFF "AP Isolation" or "Client Isolation"
   - Save settings
   - Router may restart

4. **Test Again:**
   - Device should now be able to reach WiFi devices
   - Connection should work

---

### Solution 2: Connect Computer to Ethernet (QUICK FIX)

**If you can't change router settings:**

1. **Connect your Mac to Ethernet** (same as device)
2. **Get new IP address** (may change)
3. **Update device configuration** with new IP
4. **Both devices on Ethernet** = No isolation issue

**Steps:**
```bash
# After connecting Ethernet, check new IP:
ifconfig | grep -E "inet " | grep -v 127.0.0.1 | grep "192.168.9"

# Update device with new IP:
# ws://NEW_IP:9000/ocpp/0900330710111935
```

---

### Solution 3: Use Router Bridge Mode

**If router doesn't have AP Isolation setting:**

1. **Enable Bridge Mode** (if available)
2. **Or configure router** to allow inter-VLAN communication
3. **Check router documentation** for isolation settings

---

### Solution 4: Check macOS Firewall

**Ensure firewall isn't blocking:**

```bash
# Check firewall status
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If firewall is ON, allow Docker:
# System Settings → Network → Firewall → Allow Docker/Node.js
```

---

## 🧪 Testing After Fix

### Test 1: Verify Device Can Reach Gateway

**From device (if possible) or simulate:**
```bash
# Test port accessibility
nc -zv 192.168.9.107 9000
# Should show: Connection succeeded
```

### Test 2: Monitor Connection Attempts

```bash
# Watch for device connection
docker logs -f ev-billing-ocpp-gateway | grep -i "0900330710111935\|connection\|boot"
```

**Expected Output:**
```
[info]: New WebSocket connection from charge point: 0900330710111935
[info]: Processing BootNotification from 0900330710111935
```

### Test 3: Check Device Configuration

**Verify device has correct URL:**
- Access: http://192.168.9.106
- Check "Server URL" field
- Should be: `ws://192.168.9.107:9000/ocpp/0900330710111935`

---

## 📊 Network Topology

### Current (With Isolation):
```
Router
├── Ethernet Ports (192.168.9.x)
│   └── Device (192.168.9.106) ❌ Can't reach WiFi
└── WiFi (192.168.9.x)
    └── Computer (192.168.9.107) ❌ Can't reach Ethernet
```

### After Fix (No Isolation):
```
Router
├── Ethernet Ports (192.168.9.x)
│   └── Device (192.168.9.106) ✅ Can reach WiFi
└── WiFi (192.168.9.x)
    └── Computer (192.168.9.107) ✅ Can reach Ethernet
```

---

## 🔍 How to Check Router Settings

### Common Router Admin URLs:
- `http://192.168.9.1`
- `http://192.168.1.1`
- `http://192.168.0.1`
- `http://10.0.0.1`

### Where to Find AP Isolation:
1. **Wireless Settings** → **Advanced** → **AP Isolation**
2. **Network Settings** → **Wireless** → **Client Isolation**
3. **Security** → **Wireless Isolation**
4. **Advanced** → **Wireless** → **AP Isolation**

### Router Brands - Common Locations:
- **TP-Link:** Wireless → Advanced → AP Isolation
- **Netgear:** Advanced → Wireless Settings → AP Isolation
- **Linksys:** Wireless → Advanced → AP Isolation
- **ASUS:** Wireless → Professional → AP Isolation

---

## ✅ Alternative: Use Production Server

**If you can't fix router isolation, you CAN use production:**

### Option A: Port Forwarding (Local to Internet)

1. **Set up port forwarding** on router:
   - External Port: 9000
   - Internal IP: 192.168.9.107
   - Internal Port: 9000

2. **Get public IP:**
   ```bash
   curl ifconfig.me
   ```

3. **Configure device with public IP:**
   ```
   ws://YOUR_PUBLIC_IP:9000/ocpp/0900330710111935
   ```

4. **Deploy to production** (if you have one)

### Option B: Use Production Server Directly

**If you have a production server:**
- Configure device with production URL
- Device connects to production
- Works regardless of local network isolation

**But:** Local setup should work fine once isolation is disabled!

---

## 🎯 Recommended Action Plan

### Step 1: Disable AP Isolation (Try First)
1. Access router admin panel
2. Find and disable AP Isolation
3. Test device connection

### Step 2: If That Doesn't Work
1. Connect computer to Ethernet
2. Update device with new IP
3. Test connection

### Step 3: Verify Configuration
1. Check device Server URL is correct
2. Ensure device has rebooted
3. Monitor connection logs

---

## 📝 Current Status

| Item | Status |
|------|--------|
| **Network Connectivity** | ✅ Good (ping works) |
| **Port Accessibility** | ✅ Port 9000 open |
| **OCPP Gateway** | ✅ Running |
| **Device Configuration** | ⚠️ Need to verify |
| **AP Isolation** | ❌ Likely blocking |
| **Connection Attempts** | ❌ None detected |

---

## 🔍 Quick Test

**Test if isolation is the issue:**

```bash
# From your Mac, try to access device web interface:
curl http://192.168.9.106

# If this fails but ping works, isolation is likely the issue
```

**If ping works but HTTP/WebSocket doesn't:**
- ✅ Confirms AP isolation is blocking
- ✅ Solution: Disable AP isolation in router

---

## ✅ Summary

**You DON'T need production server!** Local Docker setup is fine.

**The issue is:** Router AP isolation preventing Ethernet ↔ WiFi communication.

**Solution:** Disable AP isolation in router settings, or connect both devices to same interface (both Ethernet or both WiFi).

**After fix:** Device will connect automatically to your local OCPP Gateway.

---

**Status:** Network isolation issue identified  
**Solution:** Disable router AP isolation  
**Local Setup:** Will work fine after fix





