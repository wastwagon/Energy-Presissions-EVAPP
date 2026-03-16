# Dashboard Communication Fixes

**Date**: December 20, 2025  
**Issues Fixed**: 
1. SessionsPage null reference error
2. Dashboard real-time communication

---

## 🐛 Issue 1: SessionsPage Error

### Error:
```
Uncaught TypeError: Cannot read properties of null (reading 'toFixed')
at SessionsPage.tsx:173:45
```

### Root Cause:
`tx.totalEnergyKwh` can be `null`, but code was calling `.toFixed()` on it without checking for null.

### Fix:
```typescript
// Before:
{tx.totalEnergyKwh !== undefined
  ? tx.totalEnergyKwh.toFixed(3)
  : '-'}

// After:
{tx.totalEnergyKwh !== undefined && tx.totalEnergyKwh !== null
  ? tx.totalEnergyKwh.toFixed(3)
  : '-'}
```

**File**: `frontend/src/pages/ops/SessionsPage.tsx` (line 172-174)

---

## 🔌 Issue 2: Dashboard Real-Time Communication

### Problem:
Dashboards were not updating in real-time when:
- Transactions started/stopped
- Connector status changed
- Charge point status changed

### Root Causes:

#### 1. SessionsPage Missing WebSocket Listeners
SessionsPage didn't have WebSocket listeners for real-time updates.

**Fix**: Added WebSocket listeners:
```typescript
const unsubscribeTransactionStarted = websocketService.on('transactionStarted', () => {
  loadTransactions(); // Reload when new transaction starts
});

const unsubscribeTransactionStopped = websocketService.on('transactionStopped', () => {
  loadTransactions(); // Reload when transaction stops
});
```

**File**: `frontend/src/pages/ops/SessionsPage.tsx`

#### 2. Connector Status Not Broadcasting ChargePointStatus
When connector status changed, only `connectorStatus` event was broadcast, but dashboards listen to `chargePointStatus`.

**Fix**: Added chargePointStatus broadcast when connector status updates:
```typescript
// Broadcast connector status update
this.websocketGateway.broadcastConnectorStatus({...});

// Also broadcast charge point status for dashboard updates
const chargePoint = await this.chargePointRepository.findOne({
  where: { chargePointId },
});
if (chargePoint) {
  this.websocketGateway.broadcastChargePointStatus({
    chargePointId,
    status: chargePoint.status,
    lastSeen: chargePoint.lastSeen,
    lastHeartbeat: chargePoint.lastHeartbeat,
  });
}
```

**File**: `backend/src/internal/internal.service.ts` (line 237-250)

---

## ✅ What's Fixed

### Frontend:
1. ✅ **SessionsPage**: No longer crashes on null totalEnergyKwh
2. ✅ **SessionsPage**: Updates in real-time when transactions start/stop
3. ✅ **All Dashboards**: Already have WebSocket listeners (no changes needed)

### Backend:
1. ✅ **Connector Status Updates**: Now broadcast both connectorStatus and chargePointStatus
2. ✅ **Dashboard Updates**: Dashboards receive chargePointStatus events

---

## 📊 Real-Time Update Flow

### Transaction Start:
```
1. Transaction created
   ↓
2. Backend broadcasts 'transactionStarted'
   ↓
3. SessionsPage: Reloads transactions
   ↓
4. OperationsDashboard: Reloads data
   ↓
5. AdminDashboard: Reloads stats
   ↓
6. SuperAdminDashboard: Reloads stats
```

### Connector Status Change:
```
1. Connector status updated
   ↓
2. Backend broadcasts 'connectorStatus'
   ↓
3. Backend broadcasts 'chargePointStatus'
   ↓
4. OperationsDashboard: Updates charge point status
   ↓
5. AdminDashboard: Reloads stats
   ↓
6. SuperAdminDashboard: Reloads stats
```

---

## 🎯 Expected Behavior

### After Fixes:
1. ✅ **SessionsPage**: Loads without errors
2. ✅ **SessionsPage**: Updates automatically when transactions change
3. ✅ **OperationsDashboard**: Updates when charge points change status
4. ✅ **AdminDashboard**: Updates when transactions start/stop
5. ✅ **SuperAdminDashboard**: Updates when transactions start/stop
6. ✅ **All Dashboards**: Show real-time data without manual refresh

---

## 🔍 Testing

### Test 1: SessionsPage Error
1. Navigate to `/superadmin/ops/sessions`
2. Page should load without errors
3. Transactions with null `totalEnergyKwh` should show "-" instead of crashing

### Test 2: Real-Time Updates
1. Open SessionsPage
2. Start a transaction from another page
3. SessionsPage should automatically update to show the new transaction

### Test 3: Dashboard Updates
1. Open OperationsDashboard
2. Start/stop a transaction
3. Dashboard should update automatically without refresh

---

## 📝 Summary

**Fixed**:
- ✅ SessionsPage null reference error
- ✅ SessionsPage real-time updates
- ✅ Connector status broadcasting chargePointStatus

**Result**:
- ✅ All dashboards now communicate in real-time
- ✅ No more crashes on SessionsPage
- ✅ Automatic updates without manual refresh

---

**Status**: ✅ **FIXED**  
**All dashboards should now update in real-time**

