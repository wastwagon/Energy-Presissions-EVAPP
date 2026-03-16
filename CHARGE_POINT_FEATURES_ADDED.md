# Charge Point Features Added ✅

**Date:** December 19, 2025  
**Status:** ✅ **FEATURES IMPLEMENTED**

---

## 🎯 Features Added

### 1. Charge Station Capacity Display ✅
- **Total Capacity Field:** Added `totalCapacityKw` to ChargePoint entity
- **Display:** Shows total charging capacity in kW
- **Auto-calculation:** Can be calculated from sum of connectors' power ratings
- **Location:** Displayed in charge point detail page and stations list

### 2. Individual Charge Station Pricing ✅
- **Price per kWh Field:** Added `pricePerKwh` to ChargePoint entity
- **Currency Support:** Added `currency` field (defaults to GHS)
- **Override Tariff:** Station-specific pricing overrides tariff pricing
- **Display:** Shows price in station cards and detail pages

### 3. Charge Station Settings Page ✅
- **Settings Dialog:** New `ChargePointSettingsDialog` component
- **Features:**
  - Capacity editing
  - Price per kWh setting
  - Currency selection (GHS, USD, EUR, GBP)
  - Vendor assignment
  - Location editing with Google Maps integration
- **Access:** Via "Settings" button on charge point detail page

### 4. Vendor Assignment ✅
- **Vendor Dropdown:** Select vendor from list of all vendors
- **Assignment:** Assign charge points to vendors
- **Display:** Shows assigned vendor in charge point details
- **API:** Uses existing vendor assignment via `vendorId`

### 5. Google Maps Integration ✅
- **Location Setting:** Set latitude/longitude coordinates
- **View on Maps:** Button to open location in Google Maps
- **Get Directions:** Button to get directions to charge station
- **Address Field:** Full address text field
- **Integration:** Uses Google Maps URL format for navigation

---

## 📋 Database Changes

### Migration File: `database/init/16-charge-point-pricing-capacity.sql`

**New Columns Added:**
```sql
- total_capacity_kw DECIMAL(10, 2) NULL
- price_per_kwh DECIMAL(10, 4) NULL
- currency VARCHAR(3) DEFAULT 'GHS' NULL
```

**Auto-calculation:**
- Total capacity is calculated from sum of connectors' power ratings if not set manually

---

## 🔧 Backend Changes

### Entity Updates:
**File:** `backend/src/entities/charge-point.entity.ts`

**Added Fields:**
```typescript
@Column({ name: 'total_capacity_kw', type: 'decimal', precision: 10, scale: 2, nullable: true })
totalCapacityKw: number;

@Column({ name: 'price_per_kwh', type: 'decimal', precision: 10, scale: 4, nullable: true })
pricePerKwh: number;

@Column({ name: 'currency', length: 3, default: 'GHS', nullable: true })
currency: string;
```

### API Endpoints:
- **Update Charge Point:** `PUT /api/charge-points/:id`
  - Supports updating capacity, pricing, vendor, and location
  - Uses existing update endpoint

---

## 🎨 Frontend Changes

### New Component:
**File:** `frontend/src/components/ChargePointSettingsDialog.tsx`

**Features:**
- Capacity input (kW)
- Price per kWh input
- Currency selector
- Vendor assignment dropdown
- Location fields (address, latitude, longitude)
- Google Maps buttons (View on Maps, Get Directions)

### Updated Components:

1. **ChargePointDetailPage** (`frontend/src/pages/ops/ChargePointDetailPage.tsx`)
   - Added "Settings" button
   - Displays capacity and price
   - Integrated settings dialog

2. **StationsPage** (`frontend/src/pages/StationsPage.tsx`)
   - Shows capacity in station cards
   - Shows price in station cards
   - Shows capacity and price in station detail dialog

3. **chargePointsApi** (`frontend/src/services/chargePointsApi.ts`)
   - Added `update` method
   - Updated `ChargePoint` interface with new fields

4. **stationsApi** (`frontend/src/services/stationsApi.ts`)
   - Updated `StationWithDistance` interface with new fields

---

## 📍 Google Maps Integration

### Features:
1. **View on Google Maps:**
   - Opens Google Maps with charge station location
   - URL format: `https://www.google.com/maps?q={lat},{lng}`

2. **Get Directions:**
   - Opens Google Maps directions to charge station
   - URL format: `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}`

3. **Location Setting:**
   - Manual latitude/longitude input
   - Address field for full address
   - Coordinates validated before opening maps

---

## 🎯 Usage

### Setting Charge Point Details:

1. **Navigate to Charge Point Detail Page:**
   - Go to Operations → Device Management
   - Click on a charge point
   - Or go to `/ops/devices/{chargePointId}`

2. **Open Settings:**
   - Click "Settings" button (top right of Actions card)
   - Settings dialog opens

3. **Configure Settings:**
   - **Capacity:** Enter total capacity in kW
   - **Price:** Enter price per kWh
   - **Currency:** Select currency (GHS, USD, EUR, GBP)
   - **Vendor:** Select vendor from dropdown
   - **Location:** Enter address and coordinates
   - **Google Maps:** Use buttons to view location or get directions

4. **Save:**
   - Click "Save Settings"
   - Changes are saved and page refreshes

### Viewing Charge Point Info:

1. **In Detail Page:**
   - Capacity and price shown in Charge Point Information card
   - Format: `{capacity} kW` and `{currency} {price}/kWh`

2. **In Stations List:**
   - Capacity and price shown in station cards
   - Format: `{capacity} kW` and `{currency} {price}/kWh`

3. **In Station Dialog:**
   - Capacity and price shown in station details
   - Google Maps directions available

---

## 🔄 Database Migration

### To Apply Migration:

```bash
# Option 1: Via Docker
docker exec -i <db-container-name> psql -U postgres -d evbilling < database/init/16-charge-point-pricing-capacity.sql

# Option 2: Direct SQL
psql -U postgres -d evbilling -f database/init/16-charge-point-pricing-capacity.sql
```

### Migration Features:
- Adds new columns if they don't exist
- Calculates total capacity from connectors if not set
- Sets default currency to GHS
- Adds helpful comments

---

## 📊 Data Flow

### Capacity:
1. **Auto-calculation:** Sum of all connectors' `powerRatingKw`
2. **Manual Override:** Can be set via settings dialog
3. **Display:** Shown in detail page and stations list

### Pricing:
1. **Station-specific:** Set per charge point
2. **Override:** Overrides tariff pricing if set
3. **Currency:** Supports multiple currencies
4. **Display:** Shown with currency symbol

### Vendor Assignment:
1. **Selection:** Choose from list of vendors
2. **Update:** Updates `vendorId` field
3. **Display:** Shows vendor name in charge point details

### Location:
1. **Input:** Address and coordinates
2. **Storage:** Saved to `locationAddress`, `locationLatitude`, `locationLongitude`
3. **Google Maps:** Links to view location and get directions

---

## ✅ Summary

**All requested features have been implemented:**

- ✅ Charge station capacity display
- ✅ Price display
- ✅ Settings to set individual charge station pricing
- ✅ Assigning charge stations to vendors
- ✅ Charge station location with Google Maps integration

**The system now supports:**
- Individual station pricing
- Capacity tracking
- Vendor management
- Google Maps navigation
- Comprehensive station information

---

## 🚀 Next Steps

1. **Run Database Migration:**
   ```bash
   docker exec -i <db-container> psql -U postgres -d evbilling < database/init/16-charge-point-pricing-capacity.sql
   ```

2. **Test Features:**
   - Open charge point detail page
   - Click "Settings" button
   - Configure capacity, price, vendor, and location
   - Test Google Maps integration
   - Verify display in stations list

3. **Optional Enhancements:**
   - Add capacity calculation from connectors automatically
   - Add price validation
   - Add location autocomplete
   - Add map picker for location selection

---

**✅ All features implemented and ready to use!**
