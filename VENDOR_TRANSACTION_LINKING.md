# Vendor Transaction Linking Implementation

## Overview
Implemented vendor-scoped filtering for all transactions and charge points, ensuring that when a vendor views their dashboard, they only see data from their assigned charge stations.

## Key Features

### 1. Vendor Assignment to Charge Points
- Charge points have `vendorId` field linking them to vendors
- A vendor can have multiple charge stations
- All transactions from those stations are automatically linked to the vendor

### 2. Transaction Filtering by Vendor
- Transactions are filtered via charge point relationship
- When `vendorId` is provided (via query param or header), only transactions from that vendor's stations are returned
- Applies to:
  - All transactions (`GET /api/transactions`)
  - Active transactions (`GET /api/transactions/active`)
  - Date range queries

### 3. Charge Point Filtering by Vendor
- Charge points can be filtered by `vendorId`
- When `vendorId` is provided, only charge points assigned to that vendor are returned
- Applies to:
  - All charge points (`GET /api/charge-points`)
  - Search queries

### 4. Dashboard Statistics
- Dashboard automatically uses vendor-scoped stats when:
  - User is Admin with `vendorId`
  - `X-Vendor-Id` header is present (vendor impersonation)
- Shows only:
  - Transactions from vendor's stations
  - Charge points assigned to vendor
  - Revenue from vendor's transactions
  - Active sessions from vendor's stations

## Technical Implementation

### Backend Changes

#### Transactions Service (`backend/src/transactions/transactions.service.ts`)
- Added `vendorId` parameter to `findAll()`, `findActive()`, and `findByDateRange()`
- Uses JOIN with `charge_points` table to filter by `vendor_id`
- Example query:
  ```typescript
  queryBuilder
    .innerJoin('charge_points', 'cp', 'cp.charge_point_id = tx.charge_point_id')
    .andWhere('cp.vendor_id = :vendorId', { vendorId })
  ```

#### Transactions Controller (`backend/src/transactions/transactions.controller.ts`)
- Accepts `vendorId` query parameter
- Accepts `X-Vendor-Id` header (alternative to query param)
- Passes vendorId to service methods

#### Charge Points Service (`backend/src/charge-points/charge-points.service.ts`)
- Added `vendorId` parameter to `findAll()`
- Filters charge points by `vendor_id` directly

#### Charge Points Controller (`backend/src/charge-points/charge-points.controller.ts`)
- Accepts `vendorId` query parameter
- Accepts `X-Vendor-Id` header
- Passes vendorId to service

#### Dashboard Controller (`backend/src/dashboard/dashboard.controller.ts`)
- Checks for `X-Vendor-Id` header (vendor impersonation)
- Uses vendor-scoped stats when header is present
- Falls back to user's vendorId for Admin users

### Frontend Integration

#### API Interceptor (`frontend/src/services/api.ts`)
- Already sends `X-Vendor-Id` header when `currentVendorId` is in localStorage
- This happens automatically when SuperAdmin impersonates a vendor

#### Transaction API (`frontend/src/services/transactionsApi.ts`)
- Uses standard `api.get()` which includes vendor header automatically
- No changes needed - vendor filtering happens via header

#### Charge Points API (`frontend/src/services/chargePointsApi.ts`)
- Uses standard `api.get()` which includes vendor header automatically
- No changes needed - vendor filtering happens via header

## Flow Diagram

```
1. Vendor Admin logs in OR SuperAdmin impersonates vendor
   ↓
2. Frontend stores vendorId in localStorage
   ↓
3. API interceptor adds X-Vendor-Id header to all requests
   ↓
4. Backend receives request with vendorId
   ↓
5. Service filters data by vendorId:
   - Transactions: JOIN with charge_points WHERE vendor_id = vendorId
   - Charge Points: WHERE vendor_id = vendorId
   ↓
6. Returns only vendor-scoped data
   ↓
7. Dashboard displays vendor's stations and transactions
```

## API Endpoints

### Transactions
- `GET /api/transactions?vendorId=1` - Get transactions for vendor 1
- `GET /api/transactions/active?vendorId=1` - Get active transactions for vendor 1
- Header: `X-Vendor-Id: 1` (alternative to query param)

### Charge Points
- `GET /api/charge-points?vendorId=1` - Get charge points for vendor 1
- Header: `X-Vendor-Id: 1` (alternative to query param)

### Dashboard
- `GET /api/dashboard/stats` - Auto-detects vendor from header or user
- Header: `X-Vendor-Id: 1` - Forces vendor-scoped stats

## Database Schema

### Charge Points Table
```sql
charge_points (
  charge_point_id VARCHAR(50) PRIMARY KEY,
  vendor_id INTEGER REFERENCES vendors(id),
  ...
)
```

### Transactions Table
```sql
transactions (
  transaction_id INTEGER PRIMARY KEY,
  charge_point_id VARCHAR(50) REFERENCES charge_points(charge_point_id),
  ...
)
```

**Note**: Transactions don't have direct `vendor_id` column. They are linked to vendors via `charge_points.vendor_id` relationship.

## Benefits

1. **Data Isolation**: Vendors only see their own data
2. **Multi-Vendor Support**: System supports multiple vendors with isolated data
3. **Automatic Filtering**: No manual filtering needed - handled by backend
4. **Flexible Access**: Supports both query params and headers
5. **Dashboard Accuracy**: Dashboard stats reflect only vendor's stations

## Testing Checklist

- [ ] Vendor Admin sees only their charge points
- [ ] Vendor Admin sees only transactions from their stations
- [ ] SuperAdmin impersonating vendor sees vendor-scoped data
- [ ] Dashboard stats show only vendor's data
- [ ] Multiple vendors can have separate stations
- [ ] Transactions from vendor's stations appear in vendor dashboard
- [ ] Revenue calculations are vendor-scoped

## Example Usage

### SuperAdmin Impersonating Vendor
```javascript
// Frontend automatically sends header
localStorage.setItem('currentVendorId', '1');
// All API calls now include: X-Vendor-Id: 1
```

### Direct API Call
```bash
# Using query param
curl -H "Authorization: Bearer TOKEN" \
  "http://api/transactions?vendorId=1"

# Using header
curl -H "Authorization: Bearer TOKEN" \
     -H "X-Vendor-Id: 1" \
  "http://api/transactions"
```

## Future Enhancements

1. **Vendor Revenue Reports**: Detailed revenue breakdowns per vendor
2. **Vendor Analytics**: Vendor-specific analytics and insights
3. **Vendor Settings**: Vendor-specific pricing and configurations
4. **Vendor Notifications**: Vendor-specific alerts and notifications
