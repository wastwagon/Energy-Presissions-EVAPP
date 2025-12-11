# Charge Point ID (CPID) Configuration Guide

## What is a Charge Point ID?

The Charge Point ID (CPID) is a **unique identifier** for your charging station. It's used in the WebSocket URL to identify which device is connecting.

**Format:** `ws://YOUR_IP:9000/ocpp/{CHARGE_POINT_ID}`

---

## Where to Find Your Charge Point ID

### Option 1: Device Label/Serial Number
From your device label:
- **Model:** DY0131-BG132
- **Batch Number:** 2103241322012080001

**You can use:**
- Batch number: `2103241322012080001`
- Model + batch: `DY0131-BG132-001`
- Simplified: `DY0131-001`

### Option 2: Device Configuration Interface

**Access Methods:**
1. **Web Interface:**
   - Find device IP address (check router admin panel)
   - Open browser: `http://DEVICE_IP_ADDRESS`
   - Look for "OCPP Settings" or "System Settings"
   - Find "Charge Point ID" or "Station ID"

2. **Mobile App:**
   - If manufacturer provides an app
   - Check "Settings" or "Device Configuration"
   - Look for "CPID" or "Station ID"

3. **Configuration Tool:**
   - Manufacturer-specific software
   - Usually connects via USB or network

4. **Serial/USB Connection:**
   - Connect via serial cable or USB
   - Use terminal/command interface
   - Query device for CPID

### Option 3: Manufacturer Documentation

Check:
- User manual
- Installation guide
- Technical specifications
- OCPP configuration guide

**Look for terms:**
- "Charge Point ID"
- "CPID"
- "Station ID"
- "OCPP Identity"
- "Device Identifier"

### Option 4: Pre-configured by Manufacturer

Some devices come with a pre-configured ID:
- Check device label for "ID" or "CPID"
- May be in QR code (scan it)
- May be in device packaging/documentation

---

## How to Choose Your Own ID (If Configurable)

If your device allows you to set the Charge Point ID, you can choose:

### Recommended Formats:

1. **Simple Sequential:**
   ```
   CP001
   CP002
   CP003
   ```

2. **Model-Based:**
   ```
   DY0131-001
   DY0131-002
   DY0131-003
   ```

3. **Location-Based:**
   ```
   STATION-001
   LOCATION-A-001
   PARKING-LOT-1
   ```

4. **Batch Number:**
   ```
   2103241322012080001
   ```

### Rules:
- ✅ Use letters, numbers, hyphens, underscores
- ✅ Keep it short (recommended: 3-20 characters)
- ✅ Make it unique per device
- ❌ Avoid special characters (spaces, symbols)
- ❌ Don't use the same ID for multiple devices

---

## Testing with a Simple ID

If you're not sure, try connecting with a simple ID first:

```
ws://192.168.0.166:9000/ocpp/CP001
```

**Then:**
1. Monitor logs: `docker-compose logs -f ocpp-gateway`
2. If connection works, you'll see the device connect
3. The device will send BootNotification with its actual details
4. You can update the ID later if needed

---

## Common Issues

### Issue: "Device connects but ID doesn't match"
**Solution:** The ID in the URL must match what the device thinks its ID is. Check device configuration.

### Issue: "Can't find where to set CPID"
**Solution:** 
- Contact manufacturer support
- Check device web interface (all settings pages)
- Look for "OCPP" or "Network" settings

### Issue: "Device has no CPID configured"
**Solution:** Most devices allow you to set it. Use device configuration interface or contact manufacturer.

---

## Next Steps

1. **Find or set your Charge Point ID**
2. **Configure device with:** `ws://192.168.0.166:9000/ocpp/YOUR_ID`
3. **Monitor connection:** `docker-compose logs -f ocpp-gateway`
4. **Check dashboard:** http://localhost:8080/admin/ops/devices

---

## Example Configuration

Based on your device (Model: DY0131-BG132):

**Option 1 - Use Batch Number:**
```
ws://192.168.0.166:9000/ocpp/2103241322012080001
```

**Option 2 - Use Model + Number:**
```
ws://192.168.0.166:9000/ocpp/DY0131-001
```

**Option 3 - Simple ID:**
```
ws://192.168.0.166:9000/ocpp/CP001
```

**Try Option 3 first** (simplest), then check device configuration to see what ID it expects.

