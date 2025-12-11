# Manufacturer Requirements for System Integration

**Date**: November 6, 2025

---

## 🎯 Quick Answer

**Minimum Required Information:**
1. **OCPP Central System URL** - Where the device should connect
2. **Charge Point ID (CPID)** - Unique identifier for your device
3. **Connection Method** - OCPP-J (WebSocket) or OCPP-S (SOAP)

**Everything else can be configured or discovered automatically!**

---

## ✅ Essential Information (Must Have)

### 1. OCPP Central System URL
**What you need:**
- The WebSocket URL where your charge point should connect
- Format: `ws://your-domain.com/ocpp/{chargePointId}` or `wss://your-domain.com/ocpp/{chargePointId}` (for production with TLS)

**For local testing:**
- Use ngrok or similar tool: `ws://your-ngrok-url.ngrok.io/ocpp/{chargePointId}`
- Or if you have public IP: `ws://your-public-ip:8080/ocpp/{chargePointId}`

**How to get it:**
- Ask manufacturer: "What URL should I configure for the OCPP Central System?"
- Or: "Where do I set the OCPP server address?"

---

### 2. Charge Point ID (CPID)
**What you need:**
- A unique identifier for your charge point
- Format: Usually alphanumeric (e.g., "CP001", "STATION-12345", "EVCP-001")

**How to get it:**
- Ask manufacturer: "What is the Charge Point ID?" or "How is the CPID configured?"
- It might be:
  - Pre-configured by manufacturer
  - Set via device configuration interface
  - Set via mobile app
  - Set via web interface

**Important:** This ID must match what you configure in the device - it's how the system identifies your charge point!

---

### 3. Connection Method
**What you need:**
- OCPP-J (JSON over WebSocket) - **Recommended** ✅
- OCPP-S (SOAP over HTTP) - Alternative

**Our system supports:** OCPP-J (JSON over WebSocket) ✅

**How to verify:**
- Ask manufacturer: "Does this device support OCPP 1.6J (JSON over WebSocket)?"
- Most modern devices support OCPP-J

---

## 📋 Optional but Helpful Information

### 4. Authentication Method
**What you might need:**
- Username/password for device configuration
- API key or token
- Certificate-based authentication

**Our system:** Currently accepts connections without authentication (for development). Can be added later if needed.

---

### 5. Network Configuration
**What you might need:**
- APN settings (if using 4G)
- Static IP requirements
- Firewall/port requirements

**Our system:**
- WebSocket on port 8080 (via NGINX) or 9000 (direct)
- No special firewall rules needed (outbound connection from device)

---

### 6. Device Configuration Access
**What you need:**
- How to access device configuration (web interface, mobile app, etc.)
- How to set the OCPP Central System URL
- How to set the Charge Point ID

**Common methods:**
- Web interface: `http://device-ip-address`
- Mobile app
- Configuration tool from manufacturer
- Serial/USB connection

---

## 🚀 Getting Started - Minimum Steps

### Step 1: Get Your Public URL
For local testing, you'll need to expose your local server:

**Option A: Using ngrok (Recommended for testing)**
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 8080

# You'll get a URL like: https://abc123.ngrok.io
# Your OCPP URL will be: wss://abc123.ngrok.io/ocpp/{chargePointId}
```

**Option B: Using your public IP (if available)**
- Get your public IP address
- Configure port forwarding on your router (port 8080 → your computer)
- Your OCPP URL: `ws://your-public-ip:8080/ocpp/{chargePointId}`

**Option C: Deploy to cloud (Production)**
- Deploy to AWS, DigitalOcean, etc.
- Your OCPP URL: `wss://your-domain.com/ocpp/{chargePointId}`

---

### Step 2: Configure Your Device

1. **Access device configuration** (web interface, app, etc.)
2. **Set OCPP Central System URL:**
   - For testing: `ws://your-ngrok-url.ngrok.io/ocpp/CP001`
   - For production: `wss://your-domain.com/ocpp/CP001`
3. **Set Charge Point ID:** e.g., `CP001`
4. **Save and restart device**

---

### Step 3: Verify Connection

1. **Check device logs** (if available) - should show "Connected to Central System"
2. **Check our system logs:**
   ```bash
   docker-compose logs -f ocpp-gateway
   ```
   You should see: `New WebSocket connection from charge point: CP001`
3. **Check Operations Dashboard:**
   - Go to http://localhost:8080/ops
   - Your charge point should appear in the list!

---

## ❓ Questions to Ask Manufacturer

### Essential Questions:
1. ✅ **"What URL should I configure for the OCPP Central System?"**
2. ✅ **"How do I set the Charge Point ID?"**
3. ✅ **"Does this device support OCPP 1.6J (JSON over WebSocket)?"**

### Helpful Questions:
4. "How do I access the device configuration interface?"
5. "What authentication method does the device use?"
6. "Does the device auto-reconnect if connection is lost?"
7. "What meter values does the device send? (Energy, Power, Voltage, Current)"
8. "How often does the device send MeterValues? (sampling interval)"
9. "Does the device support Local Authorization List?"
10. "Does the device support Smart Charging profiles?"

---

## 🔧 What Our System Handles Automatically

Once connected, our system automatically:
- ✅ Receives BootNotification and registers the device
- ✅ Handles Heartbeat messages
- ✅ Processes StatusNotification updates
- ✅ Manages transactions (StartTransaction, StopTransaction)
- ✅ Collects meter values
- ✅ Handles authorization (Authorize messages)
- ✅ Supports all remote control commands
- ✅ Supports all advanced features (reservations, smart charging, etc.)

**You don't need to configure any of this - it's all automatic!**

---

## 📝 Configuration Checklist

Before connecting your device:

- [ ] **Have your public URL ready** (ngrok, public IP, or cloud deployment)
- [ ] **Know your Charge Point ID** (e.g., "CP001")
- [ ] **Know how to access device configuration**
- [ ] **Have device documentation** (helpful but not required)
- [ ] **System is running** (`docker-compose up -d`)
- [ ] **Can access Operations Dashboard** (http://localhost:8080/ops)

---

## 🎯 Summary

**Minimum Required:**
1. OCPP Central System URL (we provide this)
2. Charge Point ID (you choose or manufacturer provides)
3. Device supports OCPP 1.6J (most modern devices do)

**Everything else is optional or handled automatically!**

The system is designed to work with minimal configuration - once the device connects, everything else happens automatically.

---

## 🆘 Troubleshooting

### Device Won't Connect

1. **Check URL format:**
   - Must be: `ws://` or `wss://` (not `http://`)
   - Must include `/ocpp/{chargePointId}` path
   - Example: `ws://your-domain.com/ocpp/CP001`

2. **Check network connectivity:**
   - Device can reach your server (test with ping/curl)
   - Firewall allows outbound WebSocket connections
   - Port 8080 (or 9000) is accessible

3. **Check system logs:**
   ```bash
   docker-compose logs -f ocpp-gateway
   ```

4. **Check device logs:**
   - Look for connection errors
   - Verify URL is correct
   - Check if device is trying to connect

### Device Connects But No Data

1. **Check Operations Dashboard:**
   - Device should appear after BootNotification
   - Status should update after StatusNotification

2. **Check system logs:**
   ```bash
   docker-compose logs -f csms-api
   ```

3. **Verify OCPP messages are being received:**
   - Check OCPP Gateway logs for incoming messages

---

**The system is ready to accept connections! You just need the device URL and Charge Point ID configured.** 🚀



