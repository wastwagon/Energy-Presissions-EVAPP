# EV Charging Billing Software
## OCPP 1.6J Central System Management System (CSMS)

A complete EV Charging Billing Software system built with Node.js, NestJS, React, and Docker. Supports OCPP 1.6J protocol for managing EV charging stations, transactions, and billing.

## 🚀 Quick Start

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Access the application:**
- Frontend: http://localhost/
- API: http://localhost/api
- Swagger Docs: http://localhost/api/docs
- OCPP WebSocket (embedded in API): ws://localhost/ocpp/{chargePointId}

See [QUICK_START.md](./QUICK_START.md) for detailed instructions.

## 📋 Project Status

Current architecture uses a single backend service for both REST API and OCPP (`/ocpp`), with frontend real-time updates via Socket.IO (`/ws`).

- ✅ Embedded OCPP 1.6 handlers in backend
- ✅ CSMS API (NestJS REST API)
- ✅ Frontend role dashboards
- ✅ Database schema + migrations
- ✅ NGINX reverse proxy

---

## 📚 Documentation Overview

This package contains comprehensive documentation for developing an EV charging billing software system based on OCPP 1.6 protocol. All documents are designed to guide you from initial planning through development and deployment.

---

## 📋 Document Index

### 1. **OCPP_1.6_Requirements_Document.md**
   **Purpose**: Complete requirements specification  
   **Contents**:
   - Protocol information and communication methods
   - Core features and functionality requirements
   - Technical architecture requirements
   - Data flow for billing
   - Security requirements
   - Testing and deployment considerations
   
   **When to Use**: Start here for understanding the full scope of the project

### 2. **Manufacturer_Information_Checklist.md**
   **Purpose**: Information gathering checklist  
   **Contents**:
   - Critical information needed from manufacturer
   - Prioritized checklist
   - Email template for manufacturer
   - Questions organized by category
   
   **When to Use**: Before starting development - gather all required information

### 3. **OCPP_1.6_Billing_Message_Reference.md**
   **Purpose**: Quick reference for OCPP messages  
   **Contents**:
   - JSON examples for each OCPP message
   - Billing calculation examples
   - Database schema suggestions
   - Common pitfalls and best practices
   
   **When to Use**: During development as a quick reference guide

### 4. **Project_Roadmap.md**
   **Purpose**: Development timeline and milestones  
   **Contents**:
   - 16-week development plan
   - Phase-by-phase breakdown
   - Resource requirements
   - Risk mitigation strategies
   - Success metrics
   
   **When to Use**: For project planning and timeline estimation

### 5. **Technical_Architecture.md**
   **Purpose**: System design and architecture  
   **Contents**:
   - Architecture diagrams
   - Technology stack recommendations
   - Component descriptions
   - Database schema
   - Security architecture
   - Deployment options
   
   **When to Use**: For technical design and architecture decisions

### 6. **API_Design_Document.md**
   **Purpose**: REST API specification  
   **Contents**:
   - Complete API endpoint documentation
   - Request/response examples
   - Authentication methods
   - Error handling
   - WebSocket API for real-time updates
   
   **When to Use**: For API development and integration

---

## 🚀 Quick Start Guide

### Step 1: Understand the Requirements
1. Read **OCPP_1.6_Requirements_Document.md** to understand the full scope
2. Review **OCPP_1.6_Billing_Message_Reference.md** to understand OCPP protocol

### Step 2: Gather Information
1. Use **Manufacturer_Information_Checklist.md** to contact manufacturer
2. Obtain all critical information (connection details, credentials, etc.)
3. Set up test environment if available

### Step 3: Plan the Project
1. Review **Project_Roadmap.md** for timeline and phases
2. Adjust timeline based on your team size and resources
3. Set up project management tools

### Step 4: Design the System
1. Review **Technical_Architecture.md** for system design
2. Choose technology stack
3. Design database schema
4. Plan infrastructure

### Step 5: Start Development
1. Set up development environment
2. Implement OCPP 1.6 Central System
3. Build REST API using **API_Design_Document.md**
4. Develop billing logic
5. Create web dashboard and mobile apps

---

## 🎯 Key Information Summary

### Critical OCPP Messages for Billing

1. **Authorize** - Validate user before charging
2. **StartTransaction** - Begin charging session (creates Transaction ID)
3. **MeterValues** - Periodic energy consumption updates
4. **StopTransaction** - End session and calculate final cost

### Essential Data Points

- **Transaction ID**: Links all billing data
- **Meter Readings**: Start and stop values (in Wh/kWh)
- **Energy Consumption**: Calculated from meter readings
- **Duration**: Time between start and stop
- **Cost**: Calculated based on tariff/pricing rules

### Billing Calculation Formula

```
Total Cost = (Energy Consumed × Energy Rate) + (Duration × Time Rate) + Base Fee + Tax
```

---

## 📞 Next Steps

### Immediate Actions

1. **Contact Manufacturer**
   - Use the checklist in `Manufacturer_Information_Checklist.md`
   - Request all critical information
   - Obtain test credentials if available

2. **Set Up Development Environment**
   - Choose technology stack
   - Set up version control
   - Create project structure

3. **Design Database**
   - Review schema in `Technical_Architecture.md`
   - Create migration scripts
   - Set up database

4. **Start OCPP Implementation**
   - Set up WebSocket server
   - Implement basic message handlers
   - Test with simulator or real hardware

### Development Phases

1. **Phase 1** (Weeks 1-2): Foundation & Setup
2. **Phase 2** (Weeks 3-5): Core OCPP Implementation
3. **Phase 3** (Weeks 6-8): Billing System
4. **Phase 4** (Weeks 9-11): Web Dashboard
5. **Phase 5** (Weeks 12-14): Mobile Application
6. **Phase 6** (Weeks 15-16): Testing & Deployment

---

## 🔑 Critical Success Factors

### Must Have Before Development
- ✅ Central System URL/Endpoint from manufacturer
- ✅ Charge Point IDs
- ✅ Authentication credentials
- ✅ Meter values information (especially Energy)
- ✅ Test environment or simulator

### Important for Billing
- ✅ Transaction ID format
- ✅ Meter sampling interval
- ✅ Connector information
- ✅ IdTag format

### Nice to Have
- ✅ Supported OCPP features list
- ✅ Configuration parameters
- ✅ Remote control capabilities
- ✅ Documentation from manufacturer

---

## 🛠️ Technology Recommendations

### Backend
- **Node.js** (Recommended for OCPP/WebSocket)
- **Python** (Good alternative)
- **Java** (Enterprise option)

### Database
- **PostgreSQL** (Primary database)
- **Redis** (Cache and real-time data)

### Frontend
- **React** (Web dashboard)
- **React Native** or **Flutter** (Mobile apps)

### Payment
- **Stripe** (Recommended)
- **PayPal** (Alternative)
- **Local payment processors** (Region-specific)

---

## 📊 Project Structure Suggestion

```
ev-charging-billing/
├── backend/
│   ├── ocpp-central-system/    # OCPP 1.6 implementation
│   ├── api/                     # REST API
│   ├── services/                # Business logic
│   └── database/                # Database migrations
├── frontend/
│   ├── web-dashboard/           # Admin & user portal
│   └── mobile-app/              # iOS & Android apps
├── docs/                        # Documentation (this package)
└── tests/                       # Test suites
```

---

## ⚠️ Common Pitfalls to Avoid

1. **Don't generate your own Transaction IDs** - Use the ID from StartTransaction response
2. **Calculate energy from meter readings** - Don't use power × time
3. **Handle offline scenarios** - Charge points may go offline
4. **Store all meter values** - Needed for accurate billing
5. **Handle timezones correctly** - Store all times in UTC
6. **Test with real hardware early** - Don't wait until the end

---

## 📚 Additional Resources

### OCPP Resources
- OCPP 1.6 Specification: http://www.openchargealliance.org/downloads/
- OCPP Compliance Testing Tools
- OCPP Community Forums

### Development Resources
- WebSocket Libraries (ws, socket.io)
- Payment Gateway Documentation (Stripe, PayPal)
- Database Documentation (PostgreSQL, Redis)

---

## 🆘 Support & Questions

### For Technical Questions
- Review the relevant documentation file
- Check OCPP 1.6 specification
- Contact manufacturer support

### For Implementation Help
- Refer to code examples in message reference
- Review architecture document
- Check API design document

---

## 📝 Document Maintenance

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: Initial Release

### Update Log
- 2024: Initial documentation package created

---

## ✅ Pre-Development Checklist

Before starting development, ensure you have:

- [ ] Read all documentation files
- [ ] Contacted manufacturer with information checklist
- [ ] Received all critical information
- [ ] Set up development environment
- [ ] Chosen technology stack
- [ ] Designed database schema
- [ ] Planned project timeline
- [ ] Set up version control
- [ ] Created project structure
- [ ] Obtained test credentials/environment

---

## 🎉 Ready to Start!

You now have everything you need to begin development. Start with:

1. **Gathering manufacturer information** (use the checklist)
2. **Setting up your development environment**
3. **Implementing the OCPP Central System**
4. **Building the billing logic**

Good luck with your EV charging billing software project! 🚗⚡

---

**Questions or Need Clarification?**  
Review the specific documentation file for detailed information on each topic.

