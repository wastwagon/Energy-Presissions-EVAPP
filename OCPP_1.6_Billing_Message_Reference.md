# OCPP 1.6 Billing Message Reference
## Quick Reference Guide for Billing Software Development

---

## MESSAGE FORMAT

OCPP 1.6 uses JSON-RPC 2.0 format for OCPP-J (JSON over WebSocket):

```json
[
  MessageType,      // "2" = Call, "3" = CallResult, "4" = CallError
  MessageId,        // Unique identifier
  Action,           // Message action name
  Payload           // Message-specific data
]
```

---

## 🔑 CRITICAL MESSAGES FOR BILLING

### 1. Authorize
**Purpose**: Validate user's authorization before charging

**Request** (Charge Point → Central System):
```json
[2, "unique-id-123", "Authorize", {
  "idTag": "RFID123456789"
}]
```

**Response** (Central System → Charge Point):
```json
[3, "unique-id-123", {
  "idTagInfo": {
    "status": "Accepted",  // Accepted | Blocked | Expired | Invalid | ConcurrentTx
    "expiryDate": "2024-12-31T23:59:59Z",  // Optional
    "parentIdTag": "PARENT123"  // Optional
  }
}]
```

**Billing Impact**: 
- Determines if user can charge
- Status affects transaction start
- Expiry date for subscription management

---

### 2. StartTransaction
**Purpose**: Begin a charging session - **CRITICAL FOR BILLING**

**Request** (Charge Point → Central System):
```json
[2, "unique-id-456", "StartTransaction", {
  "connectorId": 1,
  "idTag": "RFID123456789",
  "meterStart": 12345,  // Initial meter reading (Wh)
  "timestamp": "2024-01-15T10:30:00Z",
  "reservationId": 0  // Optional, if reservation was made
}]
```

**Response** (Central System → Charge Point):
```json
[3, "unique-id-456", {
  "transactionId": 789,  // CRITICAL: Use this for all subsequent messages
  "idTagInfo": {
    "status": "Accepted",
    "expiryDate": "2024-12-31T23:59:59Z"
  }
}]
```

**Billing Impact**:
- Creates transaction record
- Transaction ID links all billing data
- Meter start value for energy calculation
- Timestamp for duration calculation

**Database Action**: 
```sql
INSERT INTO transactions (
  transaction_id, 
  charge_point_id, 
  connector_id, 
  id_tag, 
  meter_start, 
  start_time
) VALUES (789, 'CP001', 1, 'RFID123456789', 12345, '2024-01-15T10:30:00Z');
```

---

### 3. MeterValues
**Purpose**: Periodic energy consumption updates - **CRITICAL FOR REAL-TIME BILLING**

**Request** (Charge Point → Central System):
```json
[2, "unique-id-789", "MeterValues", {
  "connectorId": 1,
  "transactionId": 789,  // Links to StartTransaction
  "meterValue": [
    {
      "timestamp": "2024-01-15T10:35:00Z",
      "sampledValue": [
        {
          "value": "12500",  // Energy in Wh
          "context": "Sample.Periodic",
          "format": "Raw",
          "measurand": "Energy.Active.Import.Register",
          "location": "Outlet",
          "unit": "Wh"
        },
        {
          "value": "7.2",  // Power in kW
          "context": "Sample.Periodic",
          "format": "Raw",
          "measurand": "Power.Active.Import",
          "location": "Outlet",
          "unit": "kW"
        },
        {
          "value": "230",  // Voltage in V
          "context": "Sample.Periodic",
          "format": "Raw",
          "measurand": "Voltage",
          "location": "Outlet",
          "unit": "V"
        }
      ]
    }
  ]
}]
```

**Response** (Central System → Charge Point):
```json
[3, "unique-id-789", {}]
```

**Billing Impact**:
- Real-time energy consumption tracking
- Calculate running cost
- Update transaction record
- Display to user in real-time

**Energy Calculation**:
```
Energy Consumed = Current Meter Value - Meter Start Value
Example: 12500 Wh - 12345 Wh = 155 Wh = 0.155 kWh
```

**Database Action**:
```sql
INSERT INTO meter_values (
  transaction_id,
  timestamp,
  energy_wh,
  power_kw,
  voltage_v,
  current_a
) VALUES (789, '2024-01-15T10:35:00Z', 12500, 7.2, 230, NULL);

UPDATE transactions 
SET current_energy_wh = 12500,
    current_cost = (12500 - 12345) / 1000 * 0.15  -- kWh * rate
WHERE transaction_id = 789;
```

---

### 4. StopTransaction
**Purpose**: End charging session - **CRITICAL FOR FINAL BILLING**

**Request** (Charge Point → Central System):
```json
[2, "unique-id-101", "StopTransaction", {
  "transactionId": 789,
  "idTag": "RFID123456789",
  "timestamp": "2024-01-15T11:45:00Z",
  "meterStop": 25000,  // Final meter reading (Wh)
  "reason": "EVDisconnected",  // DeAuthorized | EmergencyStop | EVDisconnected | 
                                // HardReset | Local | Other | PowerLoss | 
                                // Reboot | Remote | SoftReset | UnlockCommand
  "transactionData": [  // Optional but recommended
    {
      "timestamp": "2024-01-15T11:45:00Z",
      "sampledValue": [
        {
          "value": "25000",
          "context": "Sample.Periodic",
          "format": "Raw",
          "measurand": "Energy.Active.Import.Register",
          "location": "Outlet",
          "unit": "Wh"
        }
      ]
    }
  ]
}]
```

**Response** (Central System → Charge Point):
```json
[3, "unique-id-101", {
  "idTagInfo": {
    "status": "Accepted"
  }
}]
```

**Billing Impact**:
- Final energy consumption calculation
- Calculate total cost
- Process payment
- Generate invoice/receipt
- Update user account

**Final Calculation**:
```
Total Energy = Meter Stop - Meter Start
Total Energy = 25000 Wh - 12345 Wh = 12655 Wh = 12.655 kWh

Duration = Stop Time - Start Time
Duration = 11:45:00 - 10:30:00 = 1 hour 15 minutes = 1.25 hours

Cost Calculation (example):
- Energy Cost = 12.655 kWh × $0.15/kWh = $1.90
- Time Cost = 1.25 hours × $0.50/hour = $0.63
- Total Cost = $1.90 + $0.63 = $2.53
```

**Database Action**:
```sql
UPDATE transactions 
SET 
  meter_stop = 25000,
  stop_time = '2024-01-15T11:45:00Z',
  total_energy_kwh = (25000 - 12345) / 1000.0,
  duration_minutes = 75,
  total_cost = 2.53,
  status = 'Completed',
  reason = 'EVDisconnected'
WHERE transaction_id = 789;

-- Process payment
INSERT INTO payments (
  transaction_id,
  user_id,
  amount,
  currency,
  status,
  payment_method
) VALUES (789, 'user-123', 2.53, 'USD', 'Pending', 'CreditCard');

-- Generate invoice
INSERT INTO invoices (
  transaction_id,
  invoice_number,
  amount,
  tax,
  total,
  status
) VALUES (789, 'INV-2024-001', 2.53, 0.00, 2.53, 'Generated');
```

---

## 🎮 REMOTE CONTROL MESSAGES

### 5. RemoteStartTransaction
**Purpose**: Start charging remotely (via mobile app)

**Request** (Central System → Charge Point):
```json
[2, "unique-id-202", "RemoteStartTransaction", {
  "connectorId": 1,  // 0 = any available connector
  "idTag": "RFID123456789",
  "chargingProfile": {  // Optional
    "chargingProfileId": 1,
    "stackLevel": 0,
    "chargingProfilePurpose": "TxProfile",
    "chargingProfileKind": "Relative",
    "chargingSchedule": {
      "chargingRateUnit": "A",
      "chargingSchedulePeriod": [
        {
          "startPeriod": 0,
          "limit": 16.0,
          "numberPhases": 3
        }
      ]
    }
  }
}]
```

**Response** (Charge Point → Central System):
```json
[3, "unique-id-202", {
  "status": "Accepted"  // Accepted | Rejected
}]
```

**Billing Impact**: 
- User initiates charging from app
- Same billing flow as local start

---

### 6. RemoteStopTransaction
**Purpose**: Stop charging remotely

**Request** (Central System → Charge Point):
```json
[2, "unique-id-303", "RemoteStopTransaction", {
  "transactionId": 789
}]
```

**Response** (Charge Point → Central System):
```json
[3, "unique-id-303", {
  "status": "Accepted"  // Accepted | Rejected
}]
```

**Billing Impact**:
- User stops charging from app
- Triggers StopTransaction message
- Same billing flow as local stop

---

## 📊 STATUS & MONITORING MESSAGES

### 7. StatusNotification
**Purpose**: Report charge point/connector status

**Request** (Charge Point → Central System):
```json
[2, "unique-id-404", "StatusNotification", {
  "connectorId": 1,  // 0 = charge point, >0 = connector
  "errorCode": "NoError",  // NoError | ConnectorLockFailure | EVCommunicationError | 
                           // GroundFailure | HighTemperature | InternalError | 
                           // LocalListConflict | Other | OverCurrentFailure | 
                           // PowerMeterFailure | PowerSwitchFailure | ReaderFailure | 
                           // ResetFailure | UnderVoltage | OverVoltage | WeakSignal
  "status": "Charging",  // Available | Preparing | Charging | SuspendedEVSE | 
                         // SuspendedEV | Finishing | Reserved | Unavailable | Faulted
  "info": "Charging in progress",  // Optional
  "timestamp": "2024-01-15T10:35:00Z",  // Optional
  "vendorId": "Vendor123",  // Optional
  "vendorErrorCode": "ERR001"  // Optional
}]
```

**Response** (Central System → Charge Point):
```json
[3, "unique-id-404", {}]
```

**Billing Impact**:
- Monitor transaction status
- Detect faults that may affect billing
- Update UI in real-time

---

### 8. Heartbeat
**Purpose**: Keep connection alive

**Request** (Charge Point → Central System):
```json
[2, "unique-id-505", "Heartbeat", {}]
```

**Response** (Central System → Charge Point):
```json
[3, "unique-id-505", {
  "currentTime": "2024-01-15T10:35:00Z"
}]
```

**Billing Impact**:
- Maintains connection
- Syncs time (important for accurate timestamps)

---

## 🔧 CONFIGURATION MESSAGES

### 9. GetConfiguration
**Purpose**: Get charge point configuration

**Request** (Central System → Charge Point):
```json
[2, "unique-id-606", "GetConfiguration", {
  "key": ["MeterValueSampleInterval", "HeartbeatInterval"]  // Optional, empty = all
}]
```

**Response** (Charge Point → Central System):
```json
[3, "unique-id-606", {
  "configurationKey": [
    {
      "key": "MeterValueSampleInterval",
      "readonly": false,
      "value": "60"  // seconds
    },
    {
      "key": "HeartbeatInterval",
      "readonly": false,
      "value": "300"  // seconds
    }
  ],
  "unknownKey": []  // Keys not found
}]
```

**Billing Impact**:
- Know meter sampling frequency
- Understand billing data update rate

---

## 📋 BOOT & INITIALIZATION

### 10. BootNotification
**Purpose**: Charge point registers with central system

**Request** (Charge Point → Central System):
```json
[2, "unique-id-707", "BootNotification", {
  "chargePointVendor": "VendorName",
  "chargePointModel": "ModelXYZ",
  "chargePointSerialNumber": "SN123456789",
  "firmwareVersion": "1.0.0",
  "iccid": "ICCID123456",  // Optional
  "imsi": "IMSI123456"  // Optional
}]
```

**Response** (Central System → Charge Point):
```json
[3, "unique-id-707", {
  "status": "Accepted",  // Accepted | Pending | Rejected
  "currentTime": "2024-01-15T10:00:00Z",
  "interval": 300,  // Heartbeat interval in seconds
  "status": "Accepted"
}]
```

**Billing Impact**:
- Identifies charge point
- Sets heartbeat interval
- Initial registration

---

## 💰 BILLING CALCULATION EXAMPLES

### Example 1: Simple Energy-Based Pricing
```
Energy Rate: $0.15 per kWh
Meter Start: 10,000 Wh
Meter Stop: 15,000 Wh

Energy Consumed = (15,000 - 10,000) / 1000 = 5 kWh
Cost = 5 × $0.15 = $0.75
```

### Example 2: Time + Energy Pricing
```
Energy Rate: $0.12 per kWh
Time Rate: $0.50 per hour
Start Time: 10:00:00
Stop Time: 11:30:00
Energy: 8 kWh

Duration = 1.5 hours
Energy Cost = 8 × $0.12 = $0.96
Time Cost = 1.5 × $0.50 = $0.75
Total = $0.96 + $0.75 = $1.71
```

### Example 3: Tiered Pricing
```
Tier 1: First 10 kWh @ $0.15/kWh
Tier 2: Next 10 kWh @ $0.12/kWh
Tier 3: Above 20 kWh @ $0.10/kWh

Energy Consumed: 25 kWh

Tier 1: 10 × $0.15 = $1.50
Tier 2: 10 × $0.12 = $1.20
Tier 3: 5 × $0.10 = $0.50
Total = $3.20
```

### Example 4: Peak/Off-Peak Pricing
```
Peak Hours (8 AM - 8 PM): $0.20/kWh
Off-Peak Hours (8 PM - 8 AM): $0.10/kWh

Start: 7:00 PM (off-peak)
Stop: 9:00 PM (1 hour off-peak, 1 hour peak)
Energy: 10 kWh

Off-Peak Energy: 5 kWh × $0.10 = $0.50
Peak Energy: 5 kWh × $0.20 = $1.00
Total = $1.50
```

---

## 🗄️ DATABASE SCHEMA SUGGESTIONS

### Transactions Table
```sql
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  transaction_id INTEGER UNIQUE NOT NULL,
  charge_point_id VARCHAR(50) NOT NULL,
  connector_id INTEGER NOT NULL,
  id_tag VARCHAR(50) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  meter_start INTEGER NOT NULL,  -- Wh
  meter_stop INTEGER,  -- Wh
  start_time TIMESTAMP NOT NULL,
  stop_time TIMESTAMP,
  total_energy_kwh DECIMAL(10,3),
  duration_minutes INTEGER,
  total_cost DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'Active',  -- Active | Completed | Cancelled
  reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Meter Values Table
```sql
CREATE TABLE meter_values (
  id BIGSERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(transaction_id),
  timestamp TIMESTAMP NOT NULL,
  energy_wh INTEGER,
  power_kw DECIMAL(10,2),
  voltage_v DECIMAL(10,2),
  current_a DECIMAL(10,2),
  frequency_hz DECIMAL(10,2),
  temperature_c DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚠️ COMMON PITFALLS & BEST PRACTICES

### 1. Transaction ID Management
- ✅ Store transaction ID immediately from StartTransaction response
- ✅ Use transaction ID to link all MeterValues and StopTransaction
- ❌ Don't generate your own transaction IDs

### 2. Meter Value Handling
- ✅ Store all meter values for accurate billing
- ✅ Handle missing meter values gracefully
- ✅ Calculate energy from meter readings, not from power × time
- ❌ Don't assume meter values arrive at exact intervals

### 3. Time Synchronization
- ✅ Use timestamps from charge point (Heartbeat response)
- ✅ Handle timezone correctly
- ✅ Store all times in UTC

### 4. Offline Scenarios
- ✅ Queue messages when offline
- ✅ Reconcile transactions when connection restored
- ✅ Handle duplicate messages

### 5. Error Handling
- ✅ Handle all OCPP error codes
- ✅ Log all errors for debugging
- ✅ Notify users of billing issues

---

## 📚 ADDITIONAL RESOURCES

- OCPP 1.6 Specification: http://www.openchargealliance.org/downloads/
- OCPP 1.6 JSON Implementation Guide
- OCPP Compliance Testing Tools

---

**Last Updated**: 2024



