# ✅ Device Found and Configuration Guide

## Device Successfully Located!

**Device Information:**
- **Device Name:** AFD-DY 2
- **Actual Local IP:** `192.168.8.142` ✅ (Found in ARP table)
- **MAC Address:** `bc:35:1e:fe:1e:1f` ✅ (Matches mobile app)
- **Virtual ID:** `bfe72084fec9521707y1c` (Use as Charge Point ID)
- **WiFi Network:** Les Ann Media
- **Signal Strength:** -42dBm (Excellent)
- **Time Zone:** Africa/Accra

**Your System:**
- **Your Computer IP:** `192.168.8.144`
- **OCPP Gateway:** `ws://192.168.8.144:9000` ✅ Running

## OCPP Configuration

### Step 1: Configure Device via Mobile App

In your mobile app, navigate to OCPP/Network settings and enter:

**OCPP Central System URL:**
```
ws://192.168.8.144:9000
```

**Charge Point ID:**
```
bfe72084fec9521707y1c
```

**Protocol:**
```
OCPP 1.6J
```

### Step 2: Where to Configure

Based on the mobile app screens you showed:

1. **Device Settings Screen:**
   - Look for "OCPP Settings" or "Network Settings"
   - May be under "Device Information" or "Check Device Network"

2. **Device Network Screen:**
   - Check if there's an "OCPP" or "Central System" option
   - May need to tap "Edit" to configure

3. **Alternative Methods:**
   - Device display menu (if available)
   - Web interface (if accessible at http://192.168.8.142)

### Step 3: Monitor Connection

After configuration, the device will automatically connect to your OCPP Gateway.

**Monitor connection:**
```bash
# Watch for device connection
docker logs -f ev-billing-ocpp-gateway

# Or check recent logs
docker logs ev-billing-ocpp-gateway --tail 50
```

**Check device registration:**
1. Login to: http://localhost:8080
2. Go to: **Super Admin → Device Inventory**
3. Device should appear automatically with:
   - Charge Point ID: `bfe72084fec9521707y1c`
   - Status: Online/Connected

## Network Status

✅ **Device is on local network** (192.168.8.142)  
✅ **Your computer is on same network** (192.168.8.144)  
✅ **OCPP Gateway is running** (ws://192.168.8.144:9000)  
✅ **MAC address matches** (bc:35:1e:fe:1e:1f)  
✅ **WiFi connection is excellent** (-42dBm)

## Important Notes

1. **Public IP (154.161.191.75) is normal** - This is what the device sees from the internet through NAT. It doesn't affect local OCPP connections.

2. **Use Local IP for OCPP** - Since both devices are on the same local network (192.168.8.x), use the local IP: `ws://192.168.8.144:9000`

3. **Virtual ID as Charge Point ID** - The Virtual ID from the mobile app (`bfe72084fec9521707y1c`) can be used as the Charge Point ID in OCPP configuration.

4. **Automatic Registration** - Once the device connects via OCPP, it will automatically appear in your system's Device Inventory.

## Troubleshooting

If device doesn't connect after configuration:

1. **Check OCPP Gateway logs:**
   ```bash
   docker logs ev-billing-ocpp-gateway --tail 100
   ```

2. **Verify device configuration:**
   - Ensure OCPP URL is correct: `ws://192.168.8.144:9000`
   - Check Charge Point ID matches: `bfe72084fec9521707y1c`
   - Verify protocol is OCPP 1.6J

3. **Check network connectivity:**
   ```bash
   # Test if device can reach your computer
   ping 192.168.8.144
   ```

4. **Restart device:**
   - Power cycle the charger
   - Wait 2-3 minutes for full boot
   - Device should reconnect automatically

## Quick Reference

**Device Configuration:**
- OCPP URL: `ws://192.168.8.144:9000`
- Charge Point ID: `bfe72084fec9521707y1c`
- Protocol: OCPP 1.6J

**System Access:**
- Web Interface: http://localhost:8080
- API: http://localhost:3000/api
- OCPP Gateway: ws://192.168.8.144:9000

**Device Details:**
- Local IP: 192.168.8.142
- MAC: bc:35:1e:fe:1e:1f
- Virtual ID: bfe72084fec9521707y1c

