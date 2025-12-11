# Local Network WiFi Connection Troubleshooting Guide

## Problem: Device Connected to WiFi but Not Discoverable

If your charge point device is connected to your local WiFi network but not appearing in the system, follow these troubleshooting steps.

---

## Step 1: Verify Your Mac's IP Address

Your Mac has multiple network interfaces. Find the correct WiFi IP address:

```bash
ifconfig | grep -A 2 "en0" | grep "inet " | grep -v 127.0.0.1
```

**Expected output:** Something like `inet 192.168.0.166` or `inet 192.168.1.100`

**Note:** Use the IP address from your main WiFi interface (usually `en0`), not virtual network adapters.

---

## Step 2: Verify OCPP Gateway is Accessible

### Test from Your Mac:
```bash
curl http://localhost:9000/health
# Should return: OK
```

### Test from Another Device on Same Network:
From another device on the same WiFi network, try:
```bash
# Replace 192.168.0.166 with your Mac's IP
curl http://192.168.0.166:9000/health
# Should return: OK
```

**If this fails:** Docker might not be binding to all interfaces. See Step 5.

---

## Step 3: Configure Device with Correct URL

Your charge point device needs to be configured with:

**Format:**
```
ws://YOUR_MAC_IP:9000/ocpp/CHARGE_POINT_ID
```

**Example:**
```
ws://192.168.0.166:9000/ocpp/CP001
```

**Important:**
- Use `ws://` (not `http://` or `https://`)
- Include `/ocpp/` path
- Include your Charge Point ID at the end (e.g., `CP001`)
- Use your Mac's local IP address (from Step 1)
- Port is `9000` (not 8080 or 3000)

---

## Step 4: Check Firewall Settings

### macOS Firewall:
1. Open **System Settings** → **Network** → **Firewall**
2. Make sure firewall is either:
   - **Off** (for testing), OR
   - **On** with Docker/Node.js allowed

### Allow Incoming Connections:
```bash
# Check if firewall is blocking
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate

# If firewall is on, you may need to allow Docker
# Or temporarily disable for testing:
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --setglobalstate off
```

**⚠️ Warning:** Only disable firewall for testing. Re-enable after testing.

---

## Step 5: Verify Docker Network Binding

Docker should be binding to `0.0.0.0` (all interfaces), not just `127.0.0.1`.

### Check Current Binding:
```bash
netstat -an | grep 9000
# Should show: *.9000 (means listening on all interfaces)
```

### If Docker is Only Binding to Localhost:

Check `docker-compose.yml` - ports should be:
```yaml
ports:
  - "9000:9000"  # This binds to all interfaces (0.0.0.0)
```

**NOT:**
```yaml
ports:
  - "127.0.0.1:9000:9000"  # This only binds to localhost
```

---

## Step 6: Test WebSocket Connection

### Using a WebSocket Client Tool:

**Option A: Using `wscat` (install if needed):**
```bash
npm install -g wscat

# Test connection
wscat -c ws://192.168.0.166:9000/ocpp/CP001
```

**Option B: Using Browser Console:**
Open browser console on another device and run:
```javascript
const ws = new WebSocket('ws://192.168.0.166:9000/ocpp/CP001');
ws.onopen = () => console.log('Connected!');
ws.onerror = (e) => console.error('Error:', e);
```

---

## Step 7: Check Device Network Configuration

### Verify Device is on Same Network:
1. Check device's IP address (from device web interface or app)
2. Verify it's in the same subnet as your Mac
   - If Mac is `192.168.0.166`, device should be `192.168.0.x`
   - If Mac is `192.168.1.100`, device should be `192.168.1.x`

### Check Device Can Reach Your Mac:
From device configuration interface, try to ping your Mac's IP:
- Device IP: `192.168.0.50` (example)
- Mac IP: `192.168.0.166`
- They should be able to communicate

---

## Step 8: Monitor OCPP Gateway Logs

Watch for incoming connections:

```bash
docker-compose logs -f ocpp-gateway
```

**What to look for:**
- `New WebSocket connection from charge point: CP001`
- `BootNotification received`
- Any error messages

**If you see connection attempts but they fail:**
- Check error messages
- Verify URL format
- Check authentication (if required)

---

## Step 9: Common Issues and Solutions

### Issue 1: "Connection Refused"
**Cause:** Port not accessible or firewall blocking
**Solution:**
- Check firewall settings (Step 4)
- Verify Docker is running: `docker-compose ps`
- Check port is listening: `netstat -an | grep 9000`

### Issue 2: "Connection Timeout"
**Cause:** Device can't reach your Mac
**Solution:**
- Verify device and Mac are on same WiFi network
- Check device's gateway/router settings
- Try pinging Mac from device

### Issue 3: "404 Not Found"
**Cause:** Wrong URL path
**Solution:**
- Verify URL includes `/ocpp/` path
- Check Charge Point ID is correct
- Format: `ws://IP:9000/ocpp/CP001`

### Issue 4: Device Connects But No BootNotification
**Cause:** Device not sending BootNotification or URL path wrong
**Solution:**
- Check OCPP Gateway logs for incoming messages
- Verify device is configured for OCPP 1.6J
- Check device logs for errors

---

## Step 10: Alternative - Use ngrok for Testing

If local network connection doesn't work, use ngrok as a temporary solution:

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 9000

# You'll get a URL like: https://abc123.ngrok.io
# Configure device with: wss://abc123.ngrok.io/ocpp/CP001
```

**Note:** ngrok URLs change each time (unless paid plan). Use only for testing.

---

## Quick Diagnostic Checklist

- [ ] Mac's WiFi IP address identified: `_____________`
- [ ] OCPP Gateway health check works: `curl http://localhost:9000/health`
- [ ] OCPP Gateway accessible from network: `curl http://MAC_IP:9000/health`
- [ ] Firewall allows connections (or disabled for testing)
- [ ] Device configured with: `ws://MAC_IP:9000/ocpp/CP001`
- [ ] Device and Mac on same WiFi network
- [ ] Docker containers running: `docker-compose ps`
- [ ] Monitoring logs: `docker-compose logs -f ocpp-gateway`

---

## Still Not Working?

1. **Check device manufacturer documentation:**
   - How to configure OCPP Central System URL
   - Network requirements
   - Connection troubleshooting

2. **Verify device supports OCPP 1.6J:**
   - Check device specifications
   - Confirm WebSocket support

3. **Test with OCPP simulator:**
   - Use an OCPP simulator to test your server
   - If simulator works, issue is with device configuration

4. **Check router settings:**
   - Some routers block device-to-device communication
   - Check for "AP Isolation" or "Client Isolation" settings
   - Disable if enabled

---

## Expected Behavior When Working

1. Device connects to WiFi
2. Device attempts WebSocket connection to `ws://YOUR_IP:9000/ocpp/CP001`
3. OCPP Gateway accepts connection
4. Device sends BootNotification
5. Device appears in Operations Dashboard
6. Heartbeat messages every 5 minutes
7. Status updates appear in real-time

---

## Need Help?

If still having issues, provide:
1. Mac's IP address
2. Device's IP address
3. Device configuration (OCPP URL)
4. OCPP Gateway logs: `docker-compose logs ocpp-gateway`
5. Any error messages from device

