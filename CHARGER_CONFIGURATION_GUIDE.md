# EV Charger OCPP Configuration Guide
## Adapted for Your Local Network

---

## Network Information

**Your Network:** 192.168.0.0/24  
**Your Mac IP:** 192.168.0.166  
**OCPP Gateway URL:** `ws://192.168.0.166:9000/ocpp/{CHARGE_POINT_ID}`

---

## Step-by-Step Configuration

### Step 1: Find Your Charger's IP Address

**On the Charger Display Screen:**
- Look for the IP address displayed (e.g., 192.168.0.XXX)
- Note this IP address - you'll need it to access the configuration

**Or check discovered devices:**
- We found: 192.168.0.159 and 192.168.0.199
- One of these is likely your charger

---

### Step 2: Access Charger Web Interface

1. **Open Google Chrome** (or any browser)

2. **Enter the charger's IP address in the address bar:**
   ```
   http://192.168.0.159:80
   ```
   OR
   ```
   http://192.168.0.199:80
   ```
   
   (Try both IPs to find which one is your charger)

3. **If you see a login page:**
   - **Default Password Format:** `SN:` followed by the serial number
   - Example: If serial number is `123456789`, password is `SN:123456789`
   - The serial number is displayed on the charger's screen
   - Click "Confirm" or "Login"

4. **If no password prompt appears:** Skip to Step 3

---

### Step 3: Configure OCPP Settings

Once you're in the charger's configuration interface:

1. **Find "OCPP Settings" or "OCPP Server" section**

2. **Enter Charger ID:**
   - **Field:** "Charger ID" or "Charge Point ID" or "Station ID"
   - **Format:** Up to 16 characters
   - **Recommendation:** Use something simple like:
     - `CP001`
     - `DY0131-001` (based on your model)
     - `STATION-001`
   - **Important:** Note this ID - you'll use it in the URL

3. **Enter OCPP Server URL:**
   - **Field:** "OCPP URL" or "Central System URL" or "Server URL"
   - **Enter exactly:**
     ```
     ws://192.168.0.166:9000/ocpp/CP001
     ```
   - **Replace `CP001` with the Charger ID you entered above**
   - **Important:** 
     - Use `ws://` (not `http://` or `https://`)
     - Include `/ocpp/` in the path
     - Include your Charger ID at the end

4. **Click "Set and Reboot" or "Save and Restart"**

5. **Wait for "Success" message**

6. **Charger will automatically restart**

---

### Step 4: Verify Configuration

**After charger restarts:**

1. **Check charger display screen:**
   - Should show the same SN (serial number) as before
   - May show connection status

2. **Monitor for connection:**
   ```bash
   ./monitor-device-connection.sh
   ```
   
   OR manually:
   ```bash
   docker-compose logs -f ocpp-gateway
   ```

3. **What to look for:**
   - `New WebSocket connection from charge point: CP001`
   - `BootNotification received`
   - Device registration messages

4. **Check dashboard:**
   - Open: http://localhost:8080/admin/ops/devices
   - Your charger should appear in the Device Inventory

---

## Your Specific Configuration

### Network Setup
- **Charger Network:** 192.168.0.0/24 (same as your Mac)
- **Mac IP:** 192.168.0.166
- **Charger IP:** Check display or try 192.168.0.159 or 192.168.0.199

### OCPP Configuration
**Charger ID:** Choose one:
- `CP001` (recommended - simple)
- `DY0131-001` (model-based)
- `STATION-001` (location-based)

**OCPP Server URL:** (Replace CP001 with your chosen ID)
```
ws://192.168.0.166:9000/ocpp/CP001
```

---

## Troubleshooting

### Can't Access Charger Web Interface

1. **Verify charger IP:**
   - Check charger display screen
   - Try both: http://192.168.0.159 and http://192.168.0.199

2. **Check network connectivity:**
   ```bash
   ping 192.168.0.159
   ping 192.168.0.199
   ```

3. **Try different ports:**
   - http://192.168.0.159:80
   - http://192.168.0.159:8080
   - http://192.168.0.159 (default port 80)

### Can't Find OCPP Settings

1. Look for:
   - "OCPP" menu
   - "Network Settings"
   - "Server Configuration"
   - "System Settings"
   - "Advanced Settings"

2. Check all menu items in the web interface

### Connection Not Working

1. **Verify URL format:**
   - Must be: `ws://192.168.0.166:9000/ocpp/CP001`
   - NOT: `http://` or `https://`
   - Must include `/ocpp/` path
   - Must include Charger ID at end

2. **Check OCPP Gateway:**
   ```bash
   curl http://192.168.0.166:9000/health
   ```
   Should return: `OK`

3. **Check firewall:**
   - macOS Firewall might be blocking
   - Temporarily disable for testing

4. **Monitor logs:**
   ```bash
   docker-compose logs -f ocpp-gateway
   ```
   Look for connection attempts or errors

---

## Quick Reference

### Charger Access
```
http://192.168.0.159:80
OR
http://192.168.0.199:80
```

### Default Password
```
SN:XXXXXXXXXX
(Where XXXXXXXXXX is the serial number from charger display)
```

### OCPP URL Format
```
ws://192.168.0.166:9000/ocpp/YOUR_CHARGER_ID
```

### Example Configuration
- **Charger ID:** `CP001`
- **OCPP URL:** `ws://192.168.0.166:9000/ocpp/CP001`

---

## Next Steps After Configuration

1. ✅ Charger configured with OCPP URL
2. ⬜ Monitor for connection: `./monitor-device-connection.sh`
3. ⬜ Verify device appears in dashboard
4. ⬜ Test charging functionality

---

## Support

If you encounter issues:
1. Check OCPP Gateway logs
2. Verify network connectivity
3. Confirm URL format is correct
4. Check charger display for error messages

