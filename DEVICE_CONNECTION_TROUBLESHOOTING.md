# EV Charger Device Connection Troubleshooting

## Current Status

**Device IP:** 192.168.8.139  
**Your Computer IP:** 192.168.8.137  
**Network:** Same subnet (192.168.8.0/24) ✅  
**Device in ARP Table:** ✅ Found  
**Ping Response:** ❌ Not responding  
**Open Ports:** ❌ None detected  
**OCPP Gateway:** ✅ Running on ws://localhost:9000

## Problem Analysis

The device is **physically on the network** (found in ARP table) but **not responding** to any connections. This indicates:

1. ✅ Device is connected to WiFi
2. ✅ Device has valid IP address
3. ❌ Device is not accepting incoming connections
4. ❌ Device may have firewall enabled
5. ❌ Device may require specific configuration

## Troubleshooting Steps

### Step 1: Verify Device Status

1. **Check Device Display:**
   - Look at the charger's display screen
   - Verify it shows "Connected" or "Online" status
   - Note any error messages

2. **Check Device LEDs:**
   - WiFi LED should be solid (not blinking)
   - Network LED should indicate connection

3. **Power Cycle Device:**
   - Turn off the charger
   - Wait 30 seconds
   - Turn it back on
   - Wait 2-3 minutes for full boot

### Step 2: Check Device Configuration

The device may need to be configured to:
- Accept incoming connections
- Enable web interface
- Configure OCPP connection

**Common Configuration Methods:**

1. **Mobile App (if available):**
   - Check if manufacturer provides a mobile app
   - Use app to configure network settings
   - Enable web interface through app

2. **Device Display Menu:**
   - Navigate through device menu
   - Look for "Network Settings" or "Web Interface"
   - Enable "Remote Access" or "Web Server"

3. **Serial/USB Connection:**
   - Connect via USB or serial cable
   - Use terminal/console to configure
   - Enable web interface

4. **Default Credentials:**
   - Try common defaults:
     - admin/admin
     - admin/password
     - admin/12345
     - root/root

### Step 3: Configure OCPP Connection

Once the device is accessible, configure it to connect to your OCPP Gateway:

**OCPP Gateway Information:**
- **URL:** `ws://192.168.8.137:9000`
- **Protocol:** OCPP 1.6J
- **Charge Point ID:** (Check device manual or use device serial number)

**Configuration Steps:**

1. Access device web interface (once available)
2. Navigate to "OCPP Settings" or "Network Settings"
3. Enter:
   - **Central System URL:** `ws://192.168.8.137:9000`
   - **Charge Point ID:** (Your device ID)
   - **Protocol:** OCPP 1.6J
4. Save and restart device

### Step 4: Alternative Connection Methods

If web interface is not available, try:

1. **SSH/Telnet:**
   ```bash
   ssh admin@192.168.8.139
   # or
   telnet 192.168.8.139
   ```

2. **SNMP (if enabled):**
   ```bash
   snmpwalk -v2c -c public 192.168.8.139
   ```

3. **Manufacturer-Specific Tools:**
   - Check if manufacturer provides configuration software
   - May require USB or serial connection

### Step 5: Firewall Configuration

The device may have a built-in firewall blocking connections:

1. **Check Device Settings:**
   - Look for "Firewall" or "Security" settings
   - Disable firewall temporarily for testing
   - Or add your computer IP (192.168.8.137) to whitelist

2. **Router Configuration:**
   - Check router firewall settings
   - Ensure device-to-device communication is allowed
   - Some routers block inter-device communication

### Step 6: Network Isolation Check

Some WiFi networks isolate devices from each other:

1. **Check Router Settings:**
   - Look for "AP Isolation" or "Client Isolation"
   - Disable if enabled
   - This prevents devices from communicating with each other

2. **Guest Network:**
   - Ensure both devices are on the same network (not guest network)
   - Guest networks often isolate devices

## Manual Device Registration

If the device cannot be discovered automatically, you can manually register it:

### Option 1: Manual Registration via Web Interface

1. Log into your system: http://localhost:8080
2. Go to **Super Admin → Device Inventory**
3. Click **"Add Device"** or **"Register Device"**
4. Enter:
   - **Charge Point ID:** (from device or manual)
   - **IP Address:** 192.168.8.139
   - **Vendor:** (Device manufacturer)
   - **Model:** (Device model)
5. Save

### Option 2: Direct OCPP Connection

If the device supports OCPP, configure it to connect directly:

1. **Device Configuration:**
   - Central System URL: `ws://192.168.8.137:9000`
   - Charge Point ID: `YOUR_CHARGE_POINT_ID`
   - Protocol: OCPP 1.6J

2. **System Will Auto-Detect:**
   - When device connects, it will appear in your system
   - You can then assign it to a vendor

## Testing Connection

After configuration, test the connection:

```bash
# Run discovery script again
./discover-device.sh

# Check OCPP Gateway logs
docker logs ev-billing-ocpp-gateway --tail 50

# Check for device connections
docker logs ev-billing-csms-api --tail 50 | grep "192.168.8.139"
```

## Next Steps

1. **Try accessing device via mobile app** (if available)
2. **Check device display** for configuration options
3. **Review device manual** for network configuration steps
4. **Contact manufacturer support** if device manual is not available
5. **Try manual registration** in the system once you have Charge Point ID

## Important Notes

- **OCPP is a client-server protocol:** The charger (client) connects TO the central system (server)
- **Your OCPP Gateway is the server:** It waits for devices to connect
- **Device must be configured:** To connect to `ws://192.168.8.137:9000`
- **No web interface needed:** If device can connect via OCPP, it will appear automatically

## Quick Reference

**Your OCPP Gateway:**
- URL: `ws://192.168.8.137:9000`
- Status: ✅ Running
- Container: `ev-billing-ocpp-gateway`

**Device Information:**
- IP: 192.168.8.139
- Status: On network but not responding
- Action Required: Configure device to connect to OCPP Gateway

**System Access:**
- Web Interface: http://localhost:8080
- API: http://localhost:3000/api
- OCPP Gateway: ws://localhost:9000

