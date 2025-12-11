# Manufacturer Information Checklist
## Critical Information Needed for EV Charging Billing Software Integration

---

## 🔴 CRITICAL - MUST HAVE BEFORE DEVELOPMENT

### 1. Connection Information
- [ ] **Central System URL/Endpoint**
  - WebSocket URL (for OCPP-J): `wss://your-server.com/ocpp/chargepoint-id`
  - OR SOAP endpoint (for OCPP-S): `https://your-server.com/soap/ocpp`
  - Port number (default: 443 for WSS, 80 for WS)
  
- [ ] **Charge Point Identity (CPID)**
  - Unique identifier for each charging station
  - Format: (e.g., "CP001", "STATION-12345")
  - How many stations do you have? List all CPIDs

- [ ] **Authentication Credentials**
  - Username/Password for charge point authentication
  - OR Certificate files (.pem, .crt)
  - OR API keys/tokens

### 2. Network Configuration
- [ ] **4G Network Details**
  - APN (Access Point Name)
  - Network operator information
  - Static IP or Dynamic IP?
  - Firewall requirements
  - Port forwarding needs

- [ ] **Connection Settings**
  - Heartbeat interval (default: 300 seconds)
  - Connection timeout
  - Retry intervals

---

## 🟡 IMPORTANT - NEEDED FOR BILLING FUNCTIONALITY

### 3. Transaction & Metering Data
- [ ] **Meter Values Available**
  - Energy (Wh/kWh) - **CRITICAL for billing**
  - Power (W/kW)
  - Current (A)
  - Voltage (V)
  - Frequency (Hz)
  - Temperature (°C)
  
- [ ] **Meter Reading Details**
  - Sampling interval (how often meter values sent)
  - Meter accuracy/precision
  - Initial meter reading (if applicable)
  - Meter unit (Wh, kWh)

- [ ] **Transaction ID Format**
  - How are transaction IDs generated?
  - Format example
  - Uniqueness guarantee

### 4. Connector Information
- [ ] **Number of Connectors**
  - How many connectors per station?
  - Connector numbering (0-based or 1-based?)
  - Connector types (Type 1, Type 2, CCS, CHAdeMO, etc.)
  - Power rating per connector (kW)

### 5. Supported OCPP Features
- [ ] **Feature Profile Support**
  - Core profile (basic OCPP)
  - Smart Charging profile
  - Local Auth List Management
  - Reservation profile
  - Firmware Management
  - Remote Trigger profile

- [ ] **Authorization Methods**
  - Local Authorization List (offline authorization)
  - Authorization Cache
  - Online authorization only
  - RFID card support
  - Mobile app support

---

## 🟢 NICE TO HAVE - FOR ADVANCED FEATURES

### 6. Configuration Parameters
- [ ] **Configurable Settings**
  - `MeterValueSampleInterval` - Meter value frequency
  - `HeartbeatInterval` - Heartbeat frequency
  - `ConnectionTimeOut` - Connection timeout
  - `LocalAuthListEnabled` - Local auth list support
  - `AuthorizationCacheEnabled` - Auth cache support
  - `ClockAlignedDataInterval` - Clock-aligned data
  - `MeterValuesSampledData` - What data to sample
  - `MeterValuesAlignedData` - Aligned data config

### 7. Remote Control Capabilities
- [ ] **Remote Operations**
  - Remote Start Transaction support
  - Remote Stop Transaction support
  - Reset capability (soft/hard)
  - Unlock Connector support
  - Change Availability support

### 8. Diagnostics & Monitoring
- [ ] **Diagnostic Features**
  - Get Diagnostics support
  - Log file retrieval
  - Firmware update capability
  - Status notification details

---

## 📋 BILLING-SPECIFIC QUESTIONS

### 9. Pricing & Tariff
- [ ] **Pricing Model**
  - Energy-based pricing (per kWh)
  - Time-based pricing (per hour/minute)
  - Flat rate pricing
  - Combination pricing
  - Peak/off-peak rates

- [ ] **Currency & Formatting**
  - Currency code (USD, EUR, etc.)
  - Decimal precision
  - Tax calculation requirements

### 10. User Identification
- [ ] **IdTag Format**
  - RFID card format
  - Mobile app token format
  - Length and character set
  - How IdTags are issued/managed

- [ ] **User Management**
  - How are users registered?
  - IdTag activation process
  - IdTag expiration handling
  - Blacklist/whitelist support

---

## 🧪 TESTING & DEVELOPMENT

### 11. Development Support
- [ ] **Test Environment**
  - Test charge point or simulator available?
  - Test credentials
  - Test endpoint URL
  - Sample message exchanges

- [ ] **Documentation**
  - OCPP 1.6 implementation guide
  - API documentation
  - Network configuration guide
  - Troubleshooting guide

### 12. Support & Maintenance
- [ ] **Technical Support**
  - Support contact information
  - Support hours
  - Escalation process
  - Documentation access

- [ ] **Firmware Updates**
  - Update process
  - Update frequency
  - Rollback capability
  - Change log access

---

## 📝 SAMPLE QUESTIONS TO ASK MANUFACTURER

### Email Template:

```
Subject: OCPP 1.6 Integration Information Request

Dear [Manufacturer Name],

We are developing a billing software system for our EV charging center 
using your hardware that supports OCPP 1.6. To proceed with integration, 
we need the following information:

1. CONNECTION DETAILS:
   - Central System WebSocket URL or SOAP endpoint
   - Charge Point IDs for our stations
   - Authentication method and credentials

2. METERING & TRANSACTION DATA:
   - What meter values are available? (Energy, Power, Current, Voltage)
   - Meter sampling interval
   - Transaction ID format

3. SUPPORTED FEATURES:
   - Which OCPP 1.6 feature profiles are supported?
   - Local Authorization List support?
   - Remote Start/Stop Transaction support?

4. CONFIGURATION:
   - What configuration parameters can be set remotely?
   - Default settings for heartbeat, meter sampling, etc.

5. TESTING:
   - Is a test/simulator available for development?
   - Test credentials and endpoint?

6. DOCUMENTATION:
   - OCPP 1.6 implementation guide
   - Network configuration guide
   - Sample message exchanges

Please provide this information at your earliest convenience so we can 
proceed with development.

Thank you,
[Your Name]
[Your Company]
```

---

## ✅ PRIORITY RANKING

### Priority 1 (Block Development)
1. Central System URL/Endpoint
2. Charge Point IDs
3. Authentication credentials
4. Meter values available (especially Energy)

### Priority 2 (Block Billing Features)
1. Transaction ID format
2. Meter sampling interval
3. Connector information
4. IdTag format

### Priority 3 (Enhance Features)
1. Supported OCPP features
2. Configuration parameters
3. Remote control capabilities
4. Test environment

---

## 📞 CONTACT INFORMATION TEMPLATE

**Manufacturer**: _________________  
**Contact Person**: _________________  
**Email**: _________________  
**Phone**: _________________  
**Support Portal**: _________________  
**Documentation URL**: _________________  

**Date Requested**: _________________  
**Date Received**: _________________  
**Status**: ⬜ Pending | ⬜ Received | ⬜ Verified

---

**Last Updated**: 2024



