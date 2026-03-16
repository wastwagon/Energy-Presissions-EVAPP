# Connection Error Investigation Report

**Date:** December 17, 2025  
**Investigation:** Two "INVALID_PATH" connection errors  
**Status:** ✅ **RESOLVED - Errors Occurred Before Fix**

---

## 🔍 Error Details

### Error 1:
- **Timestamp:** 12/17/2025, 10:16:04 AM
- **Charge Point ID:** UNKNOWN (not yet identified)
- **Event Type:** `connection_failed`
- **Error Code:** `INVALID_PATH`
- **Error Message:** `Invalid WebSocket path: /ocpp/0900330710111935`
- **Close Code:** `1008` (Policy Violation)

### Error 2:
- **Timestamp:** 12/17/2025, 10:17:28 AM
- **Charge Point ID:** UNKNOWN (not yet identified)
- **Event Type:** `connection_failed`
- **Error Code:** `INVALID_PATH`
- **Error Message:** `Invalid WebSocket path: /ocpp/0900330710111935`
- **Close Code:** `1008` (Policy Violation)

---

## 🔎 Root Cause Analysis

### What Happened:

1. **Device Connection Attempt:**
   - Device attempted to connect with path: `/ocpp/0900330710111935`
   - This format includes the charge point ID in the URL path
   - Device IP: `192.168.0.100`
   - Gateway IP: `192.168.0.101`

2. **Gateway Path Validation (Before Fix):**
   - Gateway was configured with strict path validation
   - Only accepted: `/ocpp` or `/ocpp/` (without charge point ID)
   - Rejected: `/ocpp/{chargePointId}` format
   - This caused the `INVALID_PATH` error

3. **WebSocket Close Code 1008:**
   - Code `1008` means "Policy Violation"
   - Gateway closed connection because path didn't match policy
   - Connection was rejected before BootNotification could be sent

### Timeline:

```
10:16:04 AM - First connection attempt failed (INVALID_PATH)
10:17:28 AM - Second connection attempt failed (INVALID_PATH)
[FIX APPLIED - Path validation updated]
10:20:36 AM - Connection successful (BootNotification accepted) ✅
10:20:39 AM - Heartbeat received ✅
```

---

## ✅ Resolution

### Fix Applied:

**File:** `ocpp-gateway/src/index.ts`

**Before Fix:**
```typescript
const isValidPath = 
  (pathParts.length === 1 && pathParts[0] === 'ocpp') ||           // /ocpp
  (pathParts.length === 0 && url.pathname === '/ocpp/');          // /ocpp/
```

**After Fix:**
```typescript
const isValidPath = 
  (pathParts.length === 1 && pathParts[0] === 'ocpp') ||           // /ocpp
  (pathParts.length === 0 && url.pathname === '/ocpp/') ||          // /ocpp/
  (pathParts.length === 2 && pathParts[0] === 'ocpp' && pathParts[1]); // /ocpp/{chargePointId} ✅
```

### Result:

- ✅ Gateway now accepts `/ocpp/{chargePointId}` format
- ✅ Connection successful at 10:20:36 AM
- ✅ Device registered and communicating
- ✅ No more `INVALID_PATH` errors

---

## 📊 Current Status

### Connection Status:
- ✅ **Connected:** Device `0900330710111935` is connected
- ✅ **BootNotification:** Accepted at 10:20:36 AM
- ✅ **Heartbeat:** Active (last seen: 10:30:52 AM)
- ✅ **StatusNotification:** Receiving updates
- ✅ **Path Validation:** Fixed and working

### Error Status:
- ⚠️ **Historical Errors:** Two errors logged (10:16-10:17)
- ✅ **Current Status:** No active errors
- ✅ **Resolution:** Errors resolved by path validation fix

---

## 🔍 Technical Details

### Why "Charge Point ID: UNKNOWN"?

The errors show "UNKNOWN" because:
1. Connection was rejected **before** BootNotification
2. BootNotification contains the charge point ID
3. Without BootNotification, gateway couldn't identify the device
4. This is why the charge point ID appears as "UNKNOWN" in error logs

### Why Close Code 1008?

- **1008 = Policy Violation**
- Gateway rejected connection due to invalid path
- This is the correct behavior when path doesn't match policy
- After fix, same path is now accepted

### Path Format Analysis:

**Device Configuration:**
- Server URL: `ws://192.168.0.101:9000/ocpp`
- But device connects with: `/ocpp/0900330710111935`

**Why?**
- Some devices automatically append charge point ID to URL
- This is a valid OCPP 1.6J implementation
- Gateway now supports this format

---

## 📝 Recommendations

### 1. Error Log Retention:
- These errors are **historical** and resolved
- They serve as a record of the issue and resolution
- Can be archived or cleared if desired

### 2. Monitoring:
- Monitor for new `INVALID_PATH` errors
- Should not occur anymore with current fix
- If they do, investigate path validation logic

### 3. Device Configuration:
- Current device config is correct: `ws://192.168.0.101:9000/ocpp`
- Gateway handles both formats:
  - `/ocpp` (from config)
  - `/ocpp/{chargePointId}` (device appends ID)

---

## ✅ Conclusion

### Summary:
- **Errors:** Two `INVALID_PATH` errors at 10:16-10:17 AM
- **Cause:** Gateway path validation too strict
- **Resolution:** Path validation updated to accept charge point ID in URL
- **Status:** ✅ **RESOLVED**
- **Current:** Device connected and communicating successfully

### Key Points:
1. ✅ Errors occurred **before** fix was applied
2. ✅ Fix resolved the issue
3. ✅ Device connected successfully after fix
4. ✅ No active errors currently
5. ✅ System working as expected

---

## 🎯 Action Items

- ✅ **Completed:** Path validation fix applied
- ✅ **Completed:** Device connection established
- ✅ **Completed:** Heartbeat database update fixed
- ⏳ **Monitoring:** Watch for any new connection errors
- ⏳ **Optional:** Archive old error logs if desired

---

**Status: ✅ INVESTIGATION COMPLETE - ERRORS RESOLVED**

These errors are historical and occurred before the path validation fix. The device is now connected and working correctly. No action required.

