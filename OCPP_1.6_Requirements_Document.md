# EV Charging Billing Software - Requirements Document
## Based on OCPP 1.6 Protocol Specification

---

## 1. EXECUTIVE SUMMARY

This document outlines the requirements for developing a billing software system for an EV charging center. The hardware supports OCPP 1.6 protocol with embedded 4G network connectivity.

---

## 2. PROTOCOL INFORMATION

### 2.1 Protocol Version
- **OCPP Version**: 1.6 (Edition 2 FINAL, 2017-09-28)
- **Communication Methods Supported**:
  - **OCPP-J**: JSON over WebSocket (Primary - Recommended)
  - **OCPP-S**: SOAP over HTTP (Alternative)

### 2.2 Network Connectivity
- **Hardware**: 4G embedded network device
- **Connection Type**: Charge Point initiates connection to Central System
- **Transport**: WebSocket (for OCPP-J) or HTTP (for OCPP-S)

---

## 3. CRITICAL INFORMATION NEEDED FROM MANUFACTURER

### 3.1 Connection & Authentication Details
- [ ] **Central System URL/Endpoint**: WebSocket URL or SOAP endpoint
- [ ] **Charge Point Identity (CPID)**: Unique identifier for each charging station
- [ ] **Authentication Method**: 
  - Basic authentication credentials
  - Certificate-based authentication
  - API keys/tokens
- [ ] **Connection Port**: Default is 80 (HTTP) or 443 (HTTPS/WSS)
- [ ] **Heartbeat Interval**: How often the charge point sends heartbeat messages

### 3.2 Hardware Specifications
- [ ] **Number of Connectors**: How many charging connectors per station
- [ ] **Connector Numbering**: How connectors are numbered (0-based or 1-based)
- [ ] **Meter Values**: 
  - What meter values are available (Energy, Power, Current, Voltage, etc.)
  - Meter reading accuracy/precision
  - Sampling interval for meter values
- [ ] **Supported Features**:
  - Local Authorization List support
  - Authorization Cache support
  - Remote Start/Stop Transaction
  - Reservation support
  - Smart Charging support

### 3.3 Transaction & Billing Data
- [ ] **Transaction ID Format**: How transaction IDs are generated
- [ ] **Meter Value Units**: Energy unit (Wh, kWh), currency, etc.
- [ ] **Tariff Information**: How pricing is structured
- [ ] **Transaction Data Fields**: What information is included in StartTransaction/StopTransaction

---

## 4. CORE OCPP 1.6 MESSAGES FOR BILLING

### 4.1 Essential Messages (MUST Implement)

#### 4.1.1 BootNotification
**Purpose**: Charge Point registers with Central System
**When**: On startup or reset
**Key Data**:
- Charge Point Vendor
- Charge Point Model
- Firmware Version
- Charge Point Serial Number

#### 4.1.2 Authorize
**Purpose**: Validate user's authorization to charge
**When**: Before starting a transaction
**Key Data**:
- IdTag (RFID card, mobile app token, etc.)
- Returns: Authorization status (Accepted, Blocked, Expired, Invalid, ConcurrentTx)

#### 4.1.3 StartTransaction
**Purpose**: Begin a charging session
**When**: When charging starts
**Key Data**:
- Connector ID
- IdTag
- Meter Start (initial meter reading)
- Timestamp
- Returns: Transaction ID (critical for billing)

#### 4.1.4 MeterValues
**Purpose**: Periodic energy consumption updates
**When**: During charging (every X seconds/minutes)
**Key Data**:
- Connector ID
- Transaction ID
- Meter Value (energy, power, current, voltage)
- Timestamp
- **Critical for billing**: Energy consumed (in Wh or kWh)

#### 4.1.5 StopTransaction
**Purpose**: End a charging session
**When**: When charging stops
**Key Data**:
- Transaction ID
- IdTag
- Meter Stop (final meter reading)
- Timestamp
- Reason (DeAuthorized, EmergencyStop, EVDisconnected, HardReset, Local, Other, PowerLoss, Reboot, Remote, SoftReset, UnlockCommand)
- Transaction Data (optional - includes energy, cost, etc.)

### 4.2 Remote Control Messages (SHOULD Implement)

#### 4.2.1 RemoteStartTransaction
**Purpose**: Start charging remotely (via app/website)
**When**: User initiates charging from mobile app
**Key Data**:
- Connector ID (optional - 0 for any available)
- IdTag
- Charging Profile (optional)

#### 4.2.2 RemoteStopTransaction
**Purpose**: Stop charging remotely
**When**: User stops charging from mobile app
**Key Data**:
- Transaction ID

### 4.3 Status & Monitoring Messages

#### 4.3.1 StatusNotification
**Purpose**: Report charge point/connector status changes
**When**: Status changes (Available, Preparing, Charging, SuspendedEVSE, SuspendedEV, Finishing, Reserved, Unavailable, Faulted)
**Key Data**:
- Connector ID
- Error Code (if faulted)
- Status

#### 4.3.2 Heartbeat
**Purpose**: Keep connection alive
**When**: Periodically (configurable interval)
**Key Data**:
- Current timestamp

---

## 5. BILLING SOFTWARE FEATURES REQUIRED

### 5.1 Core Billing Features

#### 5.1.1 Transaction Management
- **Capture Transaction Data**:
  - Transaction ID (unique identifier)
  - Start time and end time
  - Energy consumed (kWh)
  - Connector ID
  - User ID (IdTag)
  - Meter readings (start and stop)
  
- **Calculate Costs**:
  - Energy-based pricing (per kWh)
  - Time-based pricing (per hour/minute)
  - Flat rate pricing
  - Tiered pricing (different rates for different energy amounts)
  - Peak/off-peak pricing

#### 5.1.2 User Management
- **User Accounts**:
  - User registration
  - IdTag management (RFID cards, mobile app tokens)
  - User authentication
  - Account balance/wallet
  - Payment methods (credit card, prepaid, subscription)
  
- **Authorization**:
  - Real-time authorization check
  - Authorization cache management
  - Local authorization list support
  - Blacklist/whitelist management

#### 5.1.3 Payment Processing
- **Payment Methods**:
  - Credit/Debit card integration
  - Mobile payment (Apple Pay, Google Pay)
  - Prepaid wallet
  - Subscription plans
  - Invoice generation
  
- **Payment Gateway Integration**:
  - Stripe, PayPal, Square, or local payment processors
  - Secure payment handling (PCI compliance)

#### 5.1.4 Reporting & Analytics
- **Transaction Reports**:
  - Daily, weekly, monthly transaction summaries
  - Revenue reports
  - Energy consumption reports
  - User activity reports
  
- **Analytics**:
  - Usage patterns
  - Peak hours analysis
  - Revenue trends
  - Station utilization

### 5.2 Operational Features

#### 5.2.1 Station Management
- **Station Configuration**:
  - Add/remove charging stations
  - Configure station settings
  - Monitor station status
  - Remote diagnostics
  
- **Connector Management**:
  - Monitor connector availability
  - Handle connector faults
  - Reserve connectors

#### 5.2.2 Real-time Monitoring
- **Dashboard**:
  - Live station status
  - Active transactions
  - Energy consumption in real-time
  - Revenue in real-time
  
- **Alerts & Notifications**:
  - Station offline alerts
  - Fault notifications
  - Transaction completion notifications
  - Low balance alerts

#### 5.2.3 Mobile Application Features
- **User App**:
  - Find nearby stations
  - Start/stop charging
  - View charging history
  - Make payments
  - View account balance
  - Receive notifications
  
- **Admin App**:
  - Monitor stations
  - View reports
  - Manage users
  - Handle support requests

---

## 6. TECHNICAL ARCHITECTURE REQUIREMENTS

### 6.1 Backend System

#### 6.1.1 OCPP 1.6 Central System
- **WebSocket Server** (for OCPP-J):
  - Handle multiple concurrent connections
  - Message routing
  - Connection management
  - Heartbeat handling
  
- **Message Processing**:
  - Parse OCPP JSON messages
  - Validate message format
  - Handle message queuing
  - Error handling and retry logic

#### 6.1.2 Database Schema
- **Tables Required**:
  - `charge_points` (station information)
  - `connectors` (connector details per station)
  - `transactions` (charging sessions)
  - `meter_values` (energy consumption data)
  - `users` (customer accounts)
  - `id_tags` (authorization tokens)
  - `authorizations` (authorization cache)
  - `payments` (payment records)
  - `invoices` (billing records)
  - `tariffs` (pricing rules)

#### 6.1.3 API Endpoints
- **REST API** for:
  - Mobile app integration
  - Web dashboard
  - Third-party integrations
  - Payment processing webhooks

### 6.2 Frontend Applications

#### 6.2.1 Web Dashboard
- **Admin Panel**:
  - Station management
  - User management
  - Transaction monitoring
  - Reports and analytics
  - Configuration management
  
- **Customer Portal**:
  - Account management
  - Transaction history
  - Payment methods
  - Usage statistics

#### 6.2.2 Mobile Applications
- **iOS App**
- **Android App**

---

## 7. DATA FLOW FOR BILLING

### 7.1 Charging Session Flow

1. **User Authentication**:
   - User presents IdTag (RFID card or mobile app)
   - Charge Point sends `Authorize` message
   - Central System validates IdTag
   - Returns authorization status

2. **Start Transaction**:
   - User plugs in EV
   - Charge Point sends `StartTransaction` with:
     - Connector ID
     - IdTag
     - Meter Start value
     - Timestamp
   - Central System creates transaction record
   - Returns Transaction ID

3. **During Charging**:
   - Charge Point sends periodic `MeterValues` messages
   - Central System records energy consumption
   - Real-time cost calculation
   - Update transaction record

4. **Stop Transaction**:
   - User unplugs or stops charging
   - Charge Point sends `StopTransaction` with:
     - Transaction ID
     - Meter Stop value
     - Final timestamp
     - Reason
   - Central System:
     - Calculates final cost
     - Processes payment
     - Generates invoice/receipt
     - Updates user account

### 7.2 Billing Calculation

**Formula**:
```
Total Cost = (Energy Consumed × Energy Rate) + (Duration × Time Rate) + Base Fee
```

**Example**:
- Energy: 25 kWh × $0.15/kWh = $3.75
- Time: 2 hours × $0.50/hour = $1.00
- Base Fee: $0.00
- **Total: $4.75**

---

## 8. SECURITY REQUIREMENTS

### 8.1 Communication Security
- **TLS/SSL**: All WebSocket connections must use WSS (secure)
- **Certificate Validation**: Verify charge point certificates
- **Message Encryption**: Encrypt sensitive data in transit

### 8.2 Authentication & Authorization
- **Charge Point Authentication**: Secure authentication for stations
- **User Authentication**: Secure IdTag validation
- **API Security**: JWT tokens, API keys for REST API

### 8.3 Data Security
- **PCI Compliance**: If handling credit cards directly
- **Data Encryption**: Encrypt sensitive data at rest
- **Access Control**: Role-based access control (RBAC)

---

## 9. CONFIGURATION PARAMETERS NEEDED

### 9.1 Charge Point Configuration Keys
Request from manufacturer which of these are supported:

- `MeterValueSampleInterval` - How often meter values are sent
- `HeartbeatInterval` - Heartbeat frequency
- `ConnectionTimeOut` - Connection timeout
- `LocalAuthListEnabled` - Local authorization list support
- `AuthorizationCacheEnabled` - Authorization cache support
- `ClockAlignedDataInterval` - Clock-aligned meter value interval
- `MeterValuesSampledData` - What data to include in meter values
- `MeterValuesAlignedData` - Aligned data configuration

### 9.2 Billing Configuration
- Pricing rules (tariffs)
- Currency settings
- Tax rates
- Payment gateway credentials
- Invoice settings

---

## 10. OFFLINE & EDGE CASES

### 10.1 Offline Scenarios
- **Charge Point Offline**:
  - Local authorization list (if supported)
  - Transaction data queued locally
  - Sync when connection restored
  
- **Central System Offline**:
  - Charge Point should queue messages
  - Retry mechanism
  - Transaction data recovery

### 10.2 Error Handling
- **Transaction Interruptions**:
  - Power loss handling
  - Network disconnection
  - Emergency stops
  
- **Data Recovery**:
  - Transaction reconciliation
  - Meter value gap handling
  - Duplicate transaction detection

---

## 11. TESTING REQUIREMENTS

### 11.1 OCPP Compliance Testing
- Use OCPP 1.6 compliance test tools
- Test all implemented messages
- Verify message format compliance

### 11.2 Integration Testing
- Test with actual hardware
- Test payment processing
- Test mobile app integration

### 11.3 Load Testing
- Multiple concurrent connections
- High transaction volume
- Stress testing

---

## 12. DEPLOYMENT CONSIDERATIONS

### 12.1 Infrastructure
- **Server Requirements**:
  - WebSocket server capacity
  - Database performance
  - API server scalability
  
- **Cloud vs On-Premise**:
  - Cloud: AWS, Azure, Google Cloud
  - On-Premise: Self-hosted solution

### 12.2 Monitoring & Logging
- Application monitoring (e.g., New Relic, Datadog)
- Error tracking (e.g., Sentry)
- Log aggregation
- Performance metrics

---

## 13. NEXT STEPS

### 13.1 Information Gathering
1. Contact manufacturer to obtain:
   - Central System endpoint URL
   - Charge Point IDs
   - Authentication credentials
   - Supported OCPP features
   - Configuration parameters
   - Test credentials for development

2. Request:
   - OCPP 1.6 implementation guide (if available)
   - Test charge point or simulator
   - Sample message exchanges
   - Network configuration guide

### 13.2 Development Phases
1. **Phase 1**: OCPP 1.6 Central System setup
2. **Phase 2**: Transaction management and billing logic
3. **Phase 3**: User management and authorization
4. **Phase 4**: Payment processing integration
5. **Phase 5**: Web dashboard development
6. **Phase 6**: Mobile app development
7. **Phase 7**: Testing and deployment

---

## 14. QUESTIONS FOR MANUFACTURER

1. What is the Central System WebSocket URL or SOAP endpoint?
2. How do we authenticate charge points? (credentials, certificates, etc.)
3. What is the Charge Point ID format?
4. What OCPP 1.6 features are supported? (Local Auth List, Smart Charging, etc.)
5. What meter values are available? (Energy, Power, Current, Voltage, etc.)
6. What is the meter value sampling interval?
7. How are transaction IDs generated?
8. What happens when the charge point goes offline?
9. Is there a test/simulator available for development?
10. What configuration parameters can be set remotely?
11. What is the supported firmware version?
12. Are there any custom extensions to OCPP 1.6?

---

## APPENDIX A: OCPP 1.6 Message Reference

### Core Messages (Billing Related)
- `Authorize` - Validate user authorization
- `StartTransaction` - Begin charging session
- `MeterValues` - Energy consumption data
- `StopTransaction` - End charging session
- `RemoteStartTransaction` - Remote start
- `RemoteStopTransaction` - Remote stop

### Configuration Messages
- `GetConfiguration` - Get charge point settings
- `ChangeConfiguration` - Update charge point settings

### Status Messages
- `StatusNotification` - Report status changes
- `Heartbeat` - Keep connection alive

### Diagnostic Messages
- `GetDiagnostics` - Request diagnostics
- `UpdateFirmware` - Firmware updates

---

**Document Version**: 1.0  
**Date**: 2024  
**Based on**: OCPP 1.6 Specification (Edition 2 FINAL, 2017-09-28)



