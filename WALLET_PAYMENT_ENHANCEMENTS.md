# Wallet Payment Flow Enhancements

## Overview
Enhanced the wallet-based charging payment system with a robust reservation system, automatic refunds, transaction summaries, and improved balance verification.

## Key Enhancements

### 1. Wallet Reservation System
- **Before**: Immediate deduction from wallet when charging starts
- **After**: Amount is reserved (held) when charging starts, then finalized when charging completes
- **Benefits**:
  - Prevents double-charging
  - Allows refunds for unused amounts
  - Better transaction tracking

### 2. Automatic Refund System
- When a charging session completes, the system:
  1. Calculates actual cost based on energy consumed
  2. Finalizes the reservation with actual cost
  3. Automatically refunds any unused reserved amount back to wallet
- Example: User reserves 50 GHS, but only uses 35 GHS → 15 GHS automatically refunded

### 3. Enhanced Balance Verification
- **Available Balance**: Shows balance excluding pending reservations
- **Reserved Balance**: Shows amount currently reserved for active transactions
- **Total Balance**: Shows complete wallet balance
- Users can only start new sessions with available balance (not reserved)

### 4. Transaction Summary Dialog
- Automatically displays when a charging session completes
- Shows:
  - Energy delivered (kWh)
  - Duration
  - Total cost
  - Amount reserved vs. actual cost
  - Refund amount (if any)
  - Updated wallet balance
- Triggered via WebSocket when transaction stops

### 5. Improved Cost Calculation
- Uses charge point specific price (`pricePerKwh`) if available
- Falls back to tariff-based calculation if no charge point price
- Ensures accurate billing

## Technical Implementation

### Backend Changes

#### Wallet Service (`backend/src/wallet/wallet.service.ts`)
- Added `reserve()` method: Holds amount without finalizing
- Added `finalizeReservation()` method: Converts reservation to payment, refunds difference
- Added `cancelReservation()` method: Refunds full reserved amount
- Added `getAvailableBalance()` method: Returns available, reserved, and total balance

#### Charge Points Service (`backend/src/charge-points/charge-points.service.ts`)
- Modified `startWalletBasedCharging()` to use `reserve()` instead of `deduct()`
- Returns `walletReservationId` for tracking

#### Internal Service (`backend/src/internal/internal.service.ts`)
- Enhanced `stopTransaction()` to:
  - Calculate actual cost using charge point price or tariff
  - Find and finalize wallet reservation
  - Automatically refund unused amount
  - Handle edge cases (no reservation found, etc.)

#### Database Schema
- Added `RESERVATION` and `RELEASE` types to `WalletTransactionType` enum
- `WalletTransaction` status can be `PENDING` for reservations

### Frontend Changes

#### Start Charging Dialog (`frontend/src/components/StartChargingDialog.tsx`)
- Shows available balance (excluding reservations)
- Shows reserved balance if any
- Validates against available balance, not total balance
- Better error messages

#### Transaction Summary Dialog (`frontend/src/components/TransactionSummaryDialog.tsx`)
- New component displaying transaction completion details
- Shows energy, duration, cost, refunds
- Displays updated wallet balance
- Auto-opens when transaction completes (via WebSocket)

#### Customer Active Sessions Page (`frontend/src/pages/user/CustomerActiveSessionsPage.tsx`)
- Listens for `transactionStopped` WebSocket events
- Automatically shows summary dialog when user's transaction completes

#### Wallet API (`frontend/src/services/walletApi.ts`)
- Added `getAvailableBalance()` method
- Returns `{ available, reserved, total, currency }`

## Flow Diagram

```
1. User clicks "Start Charging"
   ↓
2. System checks available balance (total - reserved)
   ↓
3. If sufficient, reserves amount from wallet
   ↓
4. Starts OCPP charging session
   ↓
5. [Charging happens...]
   ↓
6. Meter values received → Check if amount exhausted
   ↓
7. Transaction stops (auto or manual)
   ↓
8. Calculate actual cost from energy consumed
   ↓
9. Finalize reservation with actual cost
   ↓
10. Refund unused amount to wallet
    ↓
11. Show transaction summary dialog
    ↓
12. Update UI with new balance
```

## Benefits

1. **Prevents Overcharging**: Users only pay for actual energy consumed
2. **Better UX**: Clear visibility of reserved vs. available balance
3. **Automatic Refunds**: No manual intervention needed
4. **Transaction Transparency**: Detailed summary after each session
5. **Real-time Updates**: WebSocket integration for instant notifications
6. **Error Handling**: Graceful fallbacks if reservation not found

## Testing Checklist

- [ ] Start charging with sufficient balance
- [ ] Start charging with insufficient available balance (but sufficient total)
- [ ] Complete charging session - verify refund
- [ ] Stop charging early - verify refund
- [ ] View transaction summary dialog
- [ ] Check wallet balance updates correctly
- [ ] Multiple concurrent reservations
- [ ] Transaction fails to start - verify reservation cancelled

## API Endpoints

### New Endpoints
- `GET /api/wallet/available-balance/:userId` - Get available balance details

### Modified Endpoints
- `POST /api/charge-points/:id/wallet-start` - Now returns `walletReservationId`
- `POST /api/internal/stop-transaction` - Now handles wallet finalization

## Database Migrations

No new migrations required. Uses existing `wallet_transactions` table with new transaction types.

## Future Enhancements

1. **Reservation Expiry**: Auto-cancel reservations if transaction doesn't start within X minutes
2. **Partial Refunds**: Support for partial refunds during active charging
3. **Transaction History**: Enhanced history with reservation/refund details
4. **Notifications**: Email/SMS notifications for transaction completion
5. **Receipt Generation**: PDF receipt generation with refund details
