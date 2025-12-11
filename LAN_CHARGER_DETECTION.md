# EV Charger LAN Connection Detection

## Network Scan Results

### Devices Found on Network (192.168.0.0/24)

| IP Address | Hostname | Status | Likely Device |
|------------|----------|--------|---------------|
| 192.168.0.1 | Router | Online | Router/Gateway |
| 192.168.0.159 | iphone | Offline | iPhone (not charger) |
| **192.168.0.199** | Unknown | **Online** | **POSSIBLE CHARGER** |
| 192.168.0.166 | Your Mac | Online | Development Server |

---

## Most Likely Charger: 192.168.0.199

**Status:** ✅ Online and reachable

**Why this could be your charger:**
- Online and responding to ping
- Unknown hostname (chargers often don't have hostnames)
- Connected via LAN cable (as you mentioned)

---

## How to Access Charger

### Option 1: Check Charger Display Screen

**Look for:**
- IP Address displayed (should show 192.168.0.XXX)
- Serial Number (SN: XXXXXXXX)

**If display shows IP:**
- Use that IP address
- Try: `http://DISPLAYED_IP:80`

### Option 2: Try Discovered IP

**Open in browser:**
```
http://192.168.0.199:80
```

**If you see:**
- Login page → Use password: `SN:SERIAL_NUMBER`
- Configuration page → Look for OCPP settings
- Error/timeout → Charger may not have web interface

### Option 3: Alternative Access Methods

If web interface doesn't work:

1. **Mobile App:**
   - Check if manufacturer provides app
   - App may show charger IP and allow configuration

2. **Serial/USB Connection:**
   - Connect via USB cable
   - Use terminal/command interface
   - Configure OCPP URL directly

3. **Display Menu:**
   - Some chargers allow configuration via display buttons
   - Navigate menu to find OCPP settings

---

## OCPP Configuration

Once you can access the charger configuration:

**Charger ID:** `CP001` (or your choice)

**OCPP Server URL:**
```
ws://192.168.0.166:9000/ocpp/CP001
```

**Important:**
- Use `ws://` (not `http://`)
- Include `/ocpp/` path
- Include Charger ID at end
- Replace `CP001` with your chosen ID

---

## Verify Connection

### Monitor for Connection:
```bash
./monitor-device-connection.sh
```

### Check Dashboard:
http://localhost:8080/admin/ops/devices

**What to expect:**
- Device appears automatically after connecting
- Status shows "Online" or "Available"
- BootNotification received and processed

---

## Troubleshooting

### Charger Not Accessible via Web

1. **Check charger display:**
   - Verify IP address shown
   - Note serial number

2. **Try different ports:**
   - http://192.168.0.199:80
   - http://192.168.0.199:8080
   - http://192.168.0.199:443

3. **Check network:**
   - Verify charger and Mac on same network
   - Check router settings
   - Disable firewall temporarily

### Charger Connected But Not Appearing

1. **Verify OCPP URL format:**
   - Must be: `ws://192.168.0.166:9000/ocpp/CP001`
   - Check for typos

2. **Check OCPP Gateway:**
   ```bash
   curl http://192.168.0.166:9000/health
   ```
   Should return: `OK`

3. **Monitor logs:**
   ```bash
   docker-compose logs -f ocpp-gateway
   ```
   Look for connection attempts

---

## Quick Reference

**Charger IP (likely):** 192.168.0.199  
**Your Mac IP:** 192.168.0.166  
**OCPP Gateway:** ws://192.168.0.166:9000/ocpp/{ID}  
**Charger Web Interface:** http://192.168.0.199:80  
**Default Password:** SN:SERIAL_NUMBER

---

## Next Steps

1. ✅ Network scan complete - Found 192.168.0.199 (likely charger)
2. ⬜ Check charger display for IP address
3. ⬜ Try accessing http://192.168.0.199:80
4. ⬜ Configure OCPP settings
5. ⬜ Monitor for connection
6. ⬜ Verify device appears in dashboard

