# 🔌 EV Charger Connection Requirements - Complete Guide

## 📋 Summary: What You Need to Connect Your Charger

### ✅ **What Your Software Provides (No Credentials Needed)**
- **OCPP Gateway WebSocket Server** - Ready to accept connections
- **No Authentication Required** - Chargers connect directly via WebSocket
- **Automatic Device Registration** - Devices register on first connection
- **Multi-tenant Support** - Automatically assigns charger to correct tenant

### ⚙️ **What Your Charger Needs to Be Configured With**
1. **OCPP Server URL** (WebSocket endpoint)
2. **Charge Point ID** (unique identifier for your charger)
3. **OCPP Protocol Version** (1.6J - JSON over WebSocket)

### 📞 **What You May Need from Manufacturer**
- Configuration method (web interface, mobile app, display menu, serial/USB)
- Default login credentials (if web interface exists)
- OCPP configuration menu location
- Serial number format (for default passwords)

---

## 🔧 Connection Settings for Your Charger

### **For Local Development (Your Mac)**

**OCPP Server URL:**
```
ws://192.168.0.166:9000/ocpp/{YOUR_CHARGE_POINT_ID}
```

**Example:**
```
ws://192.168.0.166:9000/ocpp/CP001
```

**Configuration Details:**
- **Protocol:** WebSocket (`ws://` not `http://` or `https://`)
- **Server IP:** `192.168.0.166` (your Mac's IP on local network)
- **Port:** `9000` (OCPP Gateway port)
- **Path:** `/ocpp/{CHARGE_POINT_ID}` (must include your Charge Point ID)
- **Charge Point ID:** Choose a unique ID (e.g., `CP001`, `STATION-001`, `DY0131-001`)

### **For Production (Render Deployment)**

**OCPP Server URL:**
```
wss://ev-billing-api.onrender.com/ocpp/{YOUR_CHARGE_POINT_ID}
```

**Example:**
```
wss://ev-billing-api.onrender.com/ocpp/CP001
```

**Configuration Details:**
- **Protocol:** Secure WebSocket (`wss://` for HTTPS)
- **Server:** `ev-billing-api.onrender.com` (your Render backend URL)
- **Port:** `443` (default for WSS, don't include in URL)
- **Path:** `/ocpp/{CHARGE_POINT_ID}` (must include your Charge Point ID)

---

## 🔐 Authentication & Credentials

### **Good News: No Credentials Required!**

Your software **does NOT require**:
- ❌ Username/Password for OCPP connection
- ❌ API Keys
- ❌ Certificates
- ❌ Authentication tokens

**How It Works:**
1. Charger connects via WebSocket to the OCPP Gateway
2. Charge Point ID is extracted from the URL path
3. System automatically resolves which tenant owns the charger
4. Connection is accepted and charger can start sending OCPP messages

**Security:**
- Tenant isolation (each charger belongs to a tenant)
- Tenant status checking (disabled/suspended tenants are blocked)
- Connection logging for audit trail

---

## 📱 Configuration Methods

### **Method 1: Web Interface (If Available)**

1. **Access Charger Web Interface:**
   - Open browser: `http://{CHARGER_IP}:80`
   - Try discovered IPs: `192.168.0.159` or `192.168.0.199`

2. **Login (if required):**
   - Default password format: `SN:{SERIAL_NUMBER}`
   - Serial number is displayed on charger screen

3. **Find OCPP Settings:**
   - Look for: "OCPP Settings", "OCPP Server", "Network Settings", "Server Configuration"
   - Navigate through menu items

4. **Configure:**
   - **Charge Point ID:** Enter your chosen ID (e.g., `CP001`)
   - **OCPP Server URL:** Enter `ws://192.168.0.166:9000/ocpp/CP001`
   - **Protocol:** Select "OCPP 1.6J" or "JSON over WebSocket"
   - **Save and Reboot**

### **Method 2: Mobile App (Most Common)**

1. **Download manufacturer's mobile app**
2. **Connect to charger:**
   - Via WiFi hotspot (charger may broadcast its own WiFi)
   - Via Bluetooth (if supported)
   - Via local network

3. **Configure OCPP:**
   - Find "OCPP Settings" or "Server Configuration"
   - Enter OCPP URL: `ws://192.168.0.166:9000/ocpp/CP001`
   - Enter Charge Point ID: `CP001`
   - Save configuration

### **Method 3: Display Menu on Charger**

1. **Navigate to Settings/Configuration** using charger buttons
2. **Find "Network" or "OCPP" settings**
3. **Enter OCPP URL:** `ws://192.168.0.166:9000/ocpp/CP001`
4. **Enter Charge Point ID:** `CP001`
5. **Save and restart**

### **Method 4: Serial/USB Connection**

1. **Connect via USB/Serial cable**
2. **Use terminal/serial monitor** (typically 9600 baud)
3. **Send configuration commands:**
   ```
   SET OCPP_URL ws://192.168.0.166:9000/ocpp/CP001
   SET CHARGE_POINT_ID CP001
   SAVE
   REBOOT
   ```

---

## 📞 Information Needed from Manufacturer

### **🔴 Critical - Must Have**

1. **Configuration Method:**
   - [ ] How to access charger configuration?
   - [ ] Web interface? Mobile app? Display menu? Serial/USB?
   - [ ] Default login credentials (if web interface exists)

2. **OCPP Configuration Location:**
   - [ ] Where is OCPP settings menu located?
   - [ ] What is the exact menu path?
   - [ ] What fields need to be filled?

3. **Charge Point ID:**
   - [ ] What is the default Charge Point ID?
   - [ ] Can it be changed?
   - [ ] What format/characters are allowed?
   - [ ] Maximum length?

4. **Network Settings:**
   - [ ] Does charger support WiFi?
   - [ ] Does charger support Ethernet?
   - [ ] How to configure network connection?
   - [ ] DHCP or static IP?

### **🟡 Important - For Full Functionality**

5. **OCPP Protocol Support:**
   - [ ] Which OCPP version? (1.6J, 2.0.1, etc.)
   - [ ] JSON or SOAP format?
   - [ ] WebSocket or HTTP?

6. **Meter Values:**
   - [ ] What meter values are available? (Energy, Power, Current, Voltage)
   - [ ] Sampling interval (how often sent)?
   - [ ] Meter unit (Wh, kWh)?

7. **Connector Information:**
   - [ ] How many connectors?
   - [ ] Connector types? (Type 1, Type 2, CCS, CHAdeMO)
   - [ ] Power rating per connector (kW)?

8. **Transaction Support:**
   - [ ] How are transaction IDs generated?
   - [ ] Transaction ID format?
   - [ ] RFID card support?

### **🟢 Optional - Nice to Have**

9. **Advanced Features:**
   - [ ] Remote start/stop charging?
   - [ ] Firmware update support?
   - [ ] Diagnostics/status reporting?
   - [ ] Reservation support?

10. **Troubleshooting:**
    - [ ] How to view connection logs?
    - [ ] How to reset to factory defaults?
    - [ ] How to check connection status?

---

## 🔍 How Your Software Works

### **Connection Flow:**

1. **Charger Initiates Connection:**
   ```
   Charger → WebSocket → ws://192.168.0.166:9000/ocpp/CP001
   ```

2. **OCPP Gateway Extracts Charge Point ID:**
   - From URL path: `/ocpp/CP001` → Charge Point ID = `CP001`

3. **System Resolves Tenant:**
   - Looks up `CP001` in database
   - Finds which tenant owns this charger
   - Checks tenant status (active/suspended/disabled)

4. **Connection Accepted:**
   - If tenant is active → Connection accepted
   - If tenant is disabled → Connection rejected
   - If tenant is suspended → Connection accepted (read-only)

5. **Charger Sends BootNotification:**
   - Charger automatically sends BootNotification message
   - System registers charger in database
   - Charger appears in dashboard

6. **Ready for Operations:**
   - Charger can send/receive OCPP messages
   - Transactions can be started/stopped
   - Meter values are received
   - Commands can be sent to charger

### **No Pre-Registration Required:**
- Chargers can connect without being pre-registered
- System automatically creates charge point record on first BootNotification
- Charge Point ID from URL is used as the identifier

---

## ✅ Configuration Checklist

### **Before Configuration:**
- [ ] Identify charger's IP address (check display or network scan)
- [ ] Determine configuration method (web/app/display/serial)
- [ ] Choose a Charge Point ID (e.g., `CP001`)
- [ ] Note your server IP (local: `192.168.0.166` or production: `ev-billing-api.onrender.com`)

### **During Configuration:**
- [ ] Access charger configuration interface
- [ ] Enter Charge Point ID: `CP001` (or your chosen ID)
- [ ] Enter OCPP Server URL: `ws://192.168.0.166:9000/ocpp/CP001`
- [ ] Select OCPP Protocol: 1.6J (JSON over WebSocket)
- [ ] Save configuration
- [ ] Reboot charger (if required)

### **After Configuration:**
- [ ] Monitor connection: `docker-compose logs -f ocpp-gateway`
- [ ] Check for: "New WebSocket connection from charge point: CP001"
- [ ] Check for: "BootNotification received"
- [ ] Verify in dashboard: `http://localhost:8080/admin/ops/devices`
- [ ] Charger should appear in Device Inventory

---

## 🚨 Troubleshooting

### **Charger Won't Connect:**

1. **Verify OCPP Gateway is Running:**
   ```bash
   curl http://192.168.0.166:9000/health
   # Should return: OK
   ```

2. **Check URL Format:**
   - ✅ Correct: `ws://192.168.0.166:9000/ocpp/CP001`
   - ❌ Wrong: `http://192.168.0.166:9000/ocpp/CP001` (use `ws://`)
   - ❌ Wrong: `ws://192.168.0.166:9000` (missing `/ocpp/CP001`)
   - ❌ Wrong: `ws://192.168.0.166:9000/ocpp` (missing Charge Point ID)

3. **Check Network Connectivity:**
   ```bash
   # From charger, it should be able to reach:
   ping 192.168.0.166
   ```

4. **Check Firewall:**
   - macOS Firewall might block port 9000
   - Temporarily disable for testing
   - Or allow incoming connections on port 9000

5. **Check OCPP Gateway Logs:**
   ```bash
   docker-compose logs -f ocpp-gateway
   ```
   - Look for connection attempts
   - Look for error messages
   - Look for "Charge point ID required" errors

### **Charger Connects But No BootNotification:**

1. **Wait 30-60 seconds** - Charger may send BootNotification after connection
2. **Check charger display** - May show connection status
3. **Verify OCPP protocol** - Must be OCPP 1.6J (JSON)
4. **Check logs** - Look for any error messages

---

## 📊 Summary

### **What You Have:**
✅ OCPP Gateway ready to accept connections  
✅ No authentication required  
✅ Automatic device registration  
✅ Multi-tenant support  

### **What Charger Needs:**
⚙️ OCPP Server URL configured  
⚙️ Charge Point ID set  
⚙️ OCPP 1.6J protocol selected  

### **What You Need from Manufacturer:**
📞 Configuration method (how to access settings)  
📞 OCPP settings menu location  
📞 Default credentials (if web interface exists)  
📞 Network configuration method  

---

## 🎯 Next Steps

1. **Contact Manufacturer** and ask:
   - "How do I configure OCPP settings on this charger?"
   - "Where is the OCPP server URL configuration menu?"
   - "What is the default login password for the web interface?"
   - "Does this charger support OCPP 1.6J over WebSocket?"

2. **Once You Have Configuration Access:**
   - Configure OCPP URL: `ws://192.168.0.166:9000/ocpp/CP001`
   - Set Charge Point ID: `CP001`
   - Save and reboot

3. **Monitor Connection:**
   - Watch OCPP Gateway logs
   - Check dashboard for device appearance
   - Test charging functionality

---

**Your software is ready! You just need to configure the charger with the OCPP URL.** 🚀

