# ✅ CORRECT Device Configuration

## Charge Point ID (CORRECTED)

**Full Charge Point ID:** `0900330710111935`

---

## 🔧 Device Configuration

### OCPP Server URL (CRITICAL)

**Enter this EXACT value in device configuration:**

```
ws://192.168.9.101:9000/ocpp/0900330710111935
```

**Important Notes:**
- ✅ Starts with `ws://` (WebSocket protocol)
- ✅ Includes system IP: `192.168.9.101`
- ✅ Includes port: `:9000`
- ✅ Includes full path: `/ocpp/0900330710111935`
- ✅ **Charge Point ID MUST be at the end:** `0900330710111935`

---

## 📋 Quick Configuration Steps

1. **Access Device:** http://192.168.9.106
2. **Find Field:** "Server URL (ws:// MaxLen 100)"
3. **Enter:** `ws://192.168.9.101:9000/ocpp/0900330710111935`
4. **Click:** "Set and Reboot"
5. **Wait:** 2-3 minutes for device to reboot

---

## ✅ Verification

After configuration, run:
```bash
./test-device-connection.sh
```

Monitor connection:
```bash
docker logs -f ev-billing-ocpp-gateway
```

Expected log output:
```
[info]: New WebSocket connection from charge point: 0900330710111935
[info]: Connection registered for charge point: 0900330710111935
[info]: BootNotification received from 0900330710111935
```

---

## 📊 Device Details

| Property | Value |
|----------|-------|
| **Charge Point ID** | `0900330710111935` |
| **Serial Number** | `900330710111935` |
| **Device IP** | `192.168.9.106` |
| **System IP** | `192.168.9.101` |
| **OCPP Gateway** | `ws://192.168.9.101:9000/ocpp/0900330710111935` |

---

**Updated:** December 16, 2025  
**Status:** Ready for Configuration





