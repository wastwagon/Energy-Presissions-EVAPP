# Charger Configuration Without Web Interface

## Important: Web Interface is NOT Required!

**The charger will be discovered automatically** when it connects via OCPP WebSocket, regardless of whether it has a web interface.

---

## How Device Discovery Works

### Automatic Discovery Process:

1. **Charger connects** → Opens WebSocket to OCPP Gateway
2. **Charger sends BootNotification** → Registers with system
3. **Device appears** → Automatically shows in dashboard

**No web interface needed for discovery!**

The web interface is **only needed to configure** the charger with the OCPP URL.

---

## If Charger Has No Web Interface

### Option 1: Mobile App (Recommended)

Many charger manufacturers provide mobile apps:

1. **Check manufacturer documentation**
   - Look for app name
   - Download from App Store/Play Store

2. **App features:**
   - Device discovery
   - Network configuration
   - OCPP settings
   - Remote configuration

3. **Configure via app:**
   - Find your charger in app
   - Navigate to OCPP/Network settings
   - Enter OCPP URL: `ws://192.168.0.166:9000/ocpp/CP001`

---

### Option 2: Display Menu

Many chargers allow configuration via display buttons:

1. **Navigate menu:**
   - Use buttons on charger display
   - Look for "Settings" or "Configuration"
   - Find "OCPP" or "Network" section

2. **Enter OCPP URL:**
   - Use display keyboard/number pad
   - Enter: `ws://192.168.0.166:9000/ocpp/CP001`
   - Save and restart

---

### Option 3: Serial/USB Connection

If charger has USB or serial port:

1. **Connect:**
   - USB cable to charger
   - Serial cable (if available)

2. **Access terminal:**
   - Use terminal emulator (PuTTY, screen, etc.)
   - Connect to device

3. **Configure:**
   - Use command-line interface
   - Set OCPP URL via commands
   - Check manufacturer documentation for commands

---

### Option 4: Pre-Configured

Some chargers come pre-configured:

1. **Check documentation:**
   - May have default OCPP URL
   - May connect automatically

2. **Monitor for connection:**
   ```bash
   ./monitor-device-connection.sh
   ```

3. **If already configured:**
   - Device should connect automatically
   - Will appear in dashboard

---

## Configuration Details

### OCPP URL Format:
```
ws://192.168.0.166:9000/ocpp/CP001
```

**Breakdown:**
- `ws://` - WebSocket protocol (not http://)
- `192.168.0.166` - Your Mac's IP address
- `9000` - OCPP Gateway port
- `/ocpp/` - OCPP path (required)
- `CP001` - Charge Point ID (your choice, up to 16 chars)

### Charge Point ID Options:
- `CP001` (simple)
- `DY0131-001` (model-based)
- `STATION-001` (location-based)
- Any alphanumeric string (up to 16 characters)

---

## Verify Configuration

### Step 1: Check if Charger is Connecting

```bash
./check-charger-connection.sh
```

This will show:
- Recent connection attempts
- Any errors
- Connection status

### Step 2: Monitor in Real-Time

```bash
./monitor-device-connection.sh
```

Watch for:
- `New WebSocket connection from charge point: CP001`
- `BootNotification received`
- Device registration

### Step 3: Check Dashboard

Open: http://localhost:8080/admin/ops/devices

Device should appear automatically after connecting.

---

## Troubleshooting

### Charger Not Connecting

1. **Verify OCPP URL:**
   - Must be `ws://` (not `http://`)
   - Must include `/ocpp/` path
   - Must include Charge Point ID

2. **Check Network:**
   - Charger and Mac on same network
   - Charger can reach Mac's IP (192.168.0.166)
   - Test: `ping 192.168.0.166` from charger (if possible)

3. **Check OCPP Gateway:**
   ```bash
   curl http://192.168.0.166:9000/health
   ```
   Should return: `OK`

4. **Check Firewall:**
   - macOS Firewall may block connections
   - Temporarily disable for testing

5. **Check Logs:**
   ```bash
   docker-compose logs -f ocpp-gateway
   ```
   Look for connection attempts or errors

---

## Quick Reference

**Your Network:**
- Mac IP: 192.168.0.166
- Charger IP: 192.168.0.199 (likely)
- Network: 192.168.0.0/24

**OCPP Configuration:**
- URL: `ws://192.168.0.166:9000/ocpp/CP001`
- Charge Point ID: `CP001` (or your choice)

**Monitoring:**
- Check connections: `./check-charger-connection.sh`
- Real-time monitor: `./monitor-device-connection.sh`
- Dashboard: http://localhost:8080/admin/ops/devices

---

## Summary

✅ **Web interface is NOT required for discovery**
✅ **Device discovered automatically when it connects via OCPP**
✅ **Web interface only needed for configuration**
✅ **Use mobile app, display menu, or USB if no web interface**

The charger will appear in your dashboard automatically once it connects and sends BootNotification, regardless of how it was configured!

