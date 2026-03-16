# 🔍 OCPP Gateway - Why 404 Error is Normal

## ⚠️ Important: OCPP Gateway is NOT a Web Server

### What You're Seeing

**Error:** `404 Not Found` when accessing `http://192.168.8.137:9000`

**Why This Happens:**
- OCPP Gateway is a **WebSocket server**, not an HTTP web server
- It doesn't serve web pages (HTML)
- It only accepts WebSocket connections for OCPP protocol
- The 404 error is **expected** when accessing via HTTP browser

---

## ✅ How OCPP Gateway Works

### WebSocket Server (Not HTTP)

```
Device → WebSocket Connection → OCPP Gateway (Port 9000)
         ws://192.168.9.101:9000/ocpp/0900330710111935
```

**NOT:**
```
Browser → HTTP Request → OCPP Gateway (Port 9000)
         http://192.168.8.137:9000  ❌ Won't work!
```

---

## 🔍 Available Endpoints

### 1. Health Check (HTTP GET)

**Endpoint:** `http://192.168.9.101:9000/health`

**Test it:**
```bash
curl http://localhost:9000/health
# Should return: OK
```

**Or in browser:**
- Try: `http://192.168.9.101:9000/health`
- Should show: `OK`

### 2. WebSocket Endpoint (For Devices)

**Endpoint:** `ws://192.168.9.101:9000/ocpp/{chargePointId}`

**For your device:**
```
ws://192.168.9.101:9000/ocpp/0900330710111935
```

**This is NOT accessible via browser HTTP!**

---

## 📊 IP Address Difference

**You're accessing:** `192.168.8.137:9000`  
**System IP:** `192.168.9.101:9000`

**Possible Reasons:**
1. **Different Network Interface:** Your Mac may have multiple IPs
2. **Different Machine:** You might be testing from another computer
3. **Network Change:** IP address may have changed

---

## ✅ How to Verify OCPP Gateway is Working

### Method 1: Health Check (HTTP)

```bash
# From your Mac:
curl http://localhost:9000/health
# Should return: OK

# Or from another machine on network:
curl http://192.168.9.101:9000/health
# Should return: OK
```

### Method 2: Check Docker Container

```bash
docker ps | grep ocpp-gateway
# Should show: ev-billing-ocpp-gateway Up X minutes

docker logs ev-billing-ocpp-gateway --tail 10
# Should show: "OCPP Gateway WebSocket server listening on port 9000"
```

### Method 3: Test WebSocket Connection

**Note:** Browsers can't directly test WebSocket OCPP connections. You need:
- A WebSocket client tool (like `wscat`)
- Or let the device connect (it will use WebSocket automatically)

---

## 🎯 Correct Device Configuration

### Device Must Use WebSocket Protocol

**In Device Configuration Page:**
- **Field:** "Server URL"
- **Value:** `ws://192.168.9.101:9000/ocpp/0900330710111935`

**Important:**
- ✅ Starts with `ws://` (WebSocket)
- ✅ Includes full IP: `192.168.9.101`
- ✅ Includes port: `:9000`
- ✅ Includes path: `/ocpp/0900330710111935`

**NOT:**
- ❌ `http://` (HTTP protocol - won't work)
- ❌ `https://` (HTTPS - won't work)
- ❌ Incomplete IP (like `101:9000`)

---

## 🔧 Troubleshooting

### If Health Check Doesn't Work:

1. **Check Gateway is Running:**
   ```bash
   docker ps | grep ocpp-gateway
   ```

2. **Check Port is Accessible:**
   ```bash
   nc -zv 192.168.9.101 9000
   ```

3. **Check Firewall:**
   - Ensure port 9000 is not blocked
   - macOS firewall may need to allow connections

4. **Check IP Address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
   - Verify which IP the gateway is bound to
   - Use the correct IP in device configuration

---

## 📝 Summary

### What's Normal:
- ✅ 404 error when accessing `http://...:9000` in browser
- ✅ OCPP Gateway doesn't serve web pages
- ✅ Health endpoint works: `http://...:9000/health`

### What Device Needs:
- ✅ WebSocket URL: `ws://192.168.9.101:9000/ocpp/0900330710111935`
- ✅ Device will connect automatically after configuration
- ✅ Connection happens via WebSocket, not HTTP

### How to Verify:
- ✅ Test health endpoint: `curl http://192.168.9.101:9000/health`
- ✅ Check Docker logs: `docker logs ev-billing-ocpp-gateway`
- ✅ Monitor for device connection: `docker logs -f ev-billing-ocpp-gateway`

---

**The 404 error is EXPECTED** - OCPP Gateway is a WebSocket server, not a web server.  
**Device will connect via WebSocket** once configured correctly.





