# Device Network Analysis - Critical Findings

## Device Information from Mobile App

**Device Details:**
- **Device Name:** AFD-DY 2
- **Virtual ID:** bfe72084fec9521707y1c
- **MAC Address:** bc:35:1e:fe:1e:1f
- **Public IP:** 154.161.191.75 ⚠️
- **WiFi Network:** Les Ann Media
- **Signal Strength:** -42dBm (Excellent)
- **Time Zone:** Africa/Accra

## ⚠️ CRITICAL ISSUE: IP Address Mismatch

### The Problem

The mobile app shows the device has a **PUBLIC IP address** (154.161.191.75), but you mentioned the device should be at **192.168.8.139** (local network IP).

**This indicates:**
1. The device might be using **4G/mobile data** instead of WiFi
2. The device might be behind a **router with NAT** (showing public IP)
3. The device might be on a **different network segment**
4. The local IP (192.168.8.139) might be **incorrect or outdated**

### Why This Matters

- **OCPP connections require local network access** (or port forwarding)
- If device is on 4G, it cannot directly connect to your local OCPP Gateway
- If device is behind NAT, you need port forwarding or VPN

## Solutions

### Option 1: Verify Device is on Local WiFi

1. **Check Device Network Settings:**
   - In the mobile app, go to "Device Network"
   - Verify it's connected to "Les Ann Media" WiFi
   - Check if there's a "Local IP" or "LAN IP" field
   - The public IP (154.161.191.75) is what the device sees from the internet

2. **Find the Actual Local IP:**
   - The device should have a local IP like 192.168.x.x
   - Check router's DHCP client list
   - Look for MAC address: bc:35:1e:fe:1e:1f

### Option 2: Configure OCPP with Public IP (If Device Uses 4G)

If the device is using 4G/mobile data, you need to:

1. **Make OCPP Gateway accessible from internet:**
   - Set up port forwarding on your router
   - Forward port 9000 to your computer (192.168.8.137:9000)
   - Or use a VPN/tunnel service

2. **Use your public IP or domain:**
   - Find your public IP: `curl ifconfig.me`
   - Configure device with: `ws://YOUR_PUBLIC_IP:9000`
   - Or use a domain name with DNS

### Option 3: Force Device to Use Local WiFi

1. **In Mobile App:**
   - Go to "Device Network" → "Edit"
   - Ensure device is connected to "Les Ann Media" WiFi
   - Check for "Local IP" or "LAN IP" settings
   - Disable 4G/mobile data if enabled

2. **Check Router:**
   - Log into router (usually 192.168.1.1 or 192.168.8.1)
   - Check DHCP client list
   - Look for device with MAC: bc:35:1e:fe:1e:1f
   - Note the assigned local IP

## Recommended Steps

### Step 1: Verify Local Network Connection

```bash
# Check if device is on local network
./discover-device.sh

# Check router's DHCP client list
# (Access router admin panel at 192.168.8.1 or 192.168.1.1)
```

### Step 2: Find Correct Local IP

The device should have TWO IP addresses:
- **Public IP:** 154.161.191.75 (what internet sees)
- **Local IP:** 192.168.x.x (what your local network sees)

**To find local IP:**
1. Check router's DHCP client list
2. Look for MAC address: bc:35:1e:fe:1e:1f
3. Or check mobile app for "Local IP" or "LAN IP" field

### Step 3: Configure OCPP Connection

Once you have the correct local IP:

**If device is on local WiFi:**
- OCPP URL: `ws://192.168.8.137:9000`
- Charge Point ID: `bfe72084fec9521707y1c` (Virtual ID from app)

**If device is on 4G (requires port forwarding):**
- Set up port forwarding: External 9000 → 192.168.8.137:9000
- OCPP URL: `ws://YOUR_PUBLIC_IP:9000`
- Or use a domain name

## Mobile App Configuration

Based on the images, you can configure the device through the mobile app:

1. **Device Information Screen:**
   - Virtual ID: `bfe72084fec9521707y1c` (use this as Charge Point ID)

2. **Device Network Screen:**
   - Check for "Local IP" or "LAN IP" field
   - Verify WiFi connection status
   - Check if 4G is enabled/disabled

3. **Device Settings:**
   - Look for "OCPP Settings" or "Network Settings"
   - Configure Central System URL
   - Enter Charge Point ID

## Testing Connection

After configuration:

```bash
# Monitor OCPP Gateway for connection
docker logs -f ev-billing-ocpp-gateway

# Check for device registration
# Login to http://localhost:8080
# Go to Super Admin → Device Inventory
```

## Important Notes

1. **Public IP (154.161.191.75) is normal** - This is what the device sees from the internet
2. **You need the LOCAL IP** for direct connection on same network
3. **If device uses 4G**, you need port forwarding or VPN
4. **MAC address is correct:** bc:35:1e:fe:1e:1f
5. **Virtual ID can be used as Charge Point ID:** bfe72084fec9521707y1c

## Next Steps

1. ✅ Check mobile app for "Local IP" or "LAN IP" field
2. ✅ Verify device is connected to "Les Ann Media" WiFi (not 4G)
3. ✅ Check router's DHCP client list for device's local IP
4. ✅ Configure OCPP connection with correct IP address
5. ✅ Monitor OCPP Gateway logs for connection

