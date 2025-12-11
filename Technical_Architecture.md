# Technical Architecture
## EV Charging Billing Software System Design

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Mobile Apps (iOS/Android)  │  Web Dashboard (Admin/User)   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               │ HTTPS/REST API               │
               │                              │
┌──────────────▼──────────────────────────────▼───────────────┐
│                    API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Authentication │  Rate Limiting │  Request Routing          │
└──────────────┬───────────────────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────────────────┐
│                  APPLICATION LAYER                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  OCPP 1.6        │         │  REST API        │          │
│  │  Central System  │         │  Services        │          │
│  │                  │         │                  │          │
│  │  - WebSocket     │         │  - User Mgmt     │          │
│  │  - Message       │         │  - Transactions  │          │
│  │    Handlers      │         │  - Billing       │          │
│  │  - OCPP Protocol │         │  - Payments      │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                            │                     │
│           └────────────┬───────────────┘                     │
│                        │                                     │
│           ┌────────────▼─────────────┐                       │
│           │   Business Logic Layer   │                       │
│           │                          │                       │
│           │  - Transaction Service   │                       │
│           │  - Billing Service       │                       │
│           │  - Payment Service       │                       │
│           │  - User Service          │                       │
│           │  - Station Service       │                       │
│           └────────────┬─────────────┘                       │
└────────────────────────┼─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                    DATA LAYER                                 │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   Redis      │  │   File       │      │
│  │  (Primary    │  │   (Cache/    │  │   Storage    │      │
│  │   Database)  │  │   Queue)     │  │   (Invoices) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                 EXTERNAL SERVICES                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Payment    │  │     Email    │  │     SMS      │      │
│  │   Gateway    │  │     Service  │  │   Service    │      │
│  │  (Stripe)    │  │  (SendGrid)  │  │   (Twilio)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## TECHNOLOGY STACK RECOMMENDATIONS

### Backend

#### Option 1: Node.js (Recommended for OCPP)
```javascript
// Advantages:
// - Excellent WebSocket support
// - JSON handling (OCPP uses JSON)
// - Large ecosystem
// - Fast development

Stack:
- Runtime: Node.js 18+
- Framework: Express.js or Fastify
- WebSocket: ws or socket.io
- OCPP Library: ocpp-rpc or custom implementation
- ORM: Prisma or TypeORM
- Database: PostgreSQL
- Cache: Redis
```

#### Option 2: Python
```python
# Advantages:
# - Good WebSocket support
# - Strong data processing
# - Good for analytics

Stack:
- Runtime: Python 3.10+
- Framework: FastAPI or Django
- WebSocket: websockets or channels
- OCPP Library: ocpp or custom
- ORM: SQLAlchemy or Django ORM
- Database: PostgreSQL
- Cache: Redis
```

#### Option 3: Java
```java
// Advantages:
// - Enterprise-grade
// - Strong typing
// - Good performance

Stack:
- Runtime: Java 17+
- Framework: Spring Boot
- WebSocket: Spring WebSocket
- OCPP Library: Custom implementation
- ORM: JPA/Hibernate
- Database: PostgreSQL
- Cache: Redis
```

### Frontend (Web Dashboard)

#### Recommended: React
```javascript
Stack:
- Framework: React 18+
- State Management: Redux or Zustand
- UI Library: Material-UI or Ant Design
- Charts: Chart.js or Recharts
- Real-time: Socket.io-client or WebSocket
- HTTP Client: Axios
```

### Mobile Apps

#### Option 1: React Native (Recommended)
```javascript
// Advantages:
// - Single codebase for iOS and Android
// - Fast development
// - Good performance

Stack:
- Framework: React Native
- Navigation: React Navigation
- State: Redux or Context API
- Maps: React Native Maps
- HTTP: Axios
```

#### Option 2: Flutter
```dart
// Advantages:
// - Single codebase
// - Excellent performance
// - Beautiful UI

Stack:
- Framework: Flutter
- State: Provider or Riverpod
- HTTP: Dio
- Maps: Google Maps Flutter
```

### Database

#### Primary Database: PostgreSQL
```sql
-- Advantages:
-- - ACID compliance
-- - Excellent for transactional data
-- - JSON support
-- - Strong reliability

Version: PostgreSQL 14+
Extensions:
- pgcrypto (encryption)
- PostGIS (if location features needed)
```

#### Cache & Queue: Redis
```redis
# Advantages:
# - Fast in-memory storage
# - Pub/Sub for real-time updates
# - Session storage
# - Rate limiting

Use Cases:
- Authorization cache
- Session storage
- Real-time updates
- Rate limiting
- Message queue
```

---

## SYSTEM COMPONENTS

### 1. OCPP 1.6 Central System

#### WebSocket Server
```javascript
// Pseudo-code structure
class OCPPCentralSystem {
  // Handle WebSocket connections
  handleConnection(chargePointId, ws) {
    // Authenticate charge point
    // Store connection
    // Set up message handlers
  }
  
  // Route OCPP messages
  routeMessage(chargePointId, message) {
    // Parse JSON-RPC message
    // Route to appropriate handler
    // Send response
  }
  
  // Message handlers
  handleBootNotification(data) { }
  handleAuthorize(data) { }
  handleStartTransaction(data) { }
  handleMeterValues(data) { }
  handleStopTransaction(data) { }
  // ... other handlers
}
```

#### Message Processing Flow
```
1. Charge Point connects via WebSocket
2. Central System authenticates
3. Charge Point sends BootNotification
4. Central System responds with configuration
5. Charge Point sends Heartbeat periodically
6. When user wants to charge:
   a. Charge Point sends Authorize
   b. Central System validates IdTag
   c. Charge Point sends StartTransaction
   d. Central System creates transaction record
   e. Charge Point sends periodic MeterValues
   f. Central System updates transaction
   g. Charge Point sends StopTransaction
   h. Central System calculates cost and processes payment
```

### 2. REST API Services

#### API Structure
```
/api/v1/
  /auth
    POST /login
    POST /register
    POST /logout
    POST /refresh-token
  
  /users
    GET /users
    GET /users/:id
    PUT /users/:id
    POST /users/:id/idtags
    DELETE /users/:id/idtags/:tagId
  
  /stations
    GET /stations
    GET /stations/:id
    GET /stations/:id/status
    GET /stations/:id/connectors
  
  /transactions
    GET /transactions
    GET /transactions/:id
    GET /transactions/active
    POST /transactions/:id/remote-start
    POST /transactions/:id/remote-stop
  
  /billing
    GET /billing/invoices
    GET /billing/invoices/:id
    GET /billing/transactions/:id/cost
  
  /payments
    POST /payments
    GET /payments/:id
    POST /payments/:id/refund
```

### 3. Business Logic Services

#### Transaction Service
```javascript
class TransactionService {
  async startTransaction(data) {
    // Validate authorization
    // Create transaction record
    // Store meter start
    // Return transaction ID
  }
  
  async updateMeterValues(transactionId, meterValues) {
    // Store meter values
    // Calculate current energy
    // Calculate current cost
    // Update transaction
  }
  
  async stopTransaction(transactionId, data) {
    // Calculate final energy
    // Calculate total cost
    // Update transaction status
    // Trigger billing
  }
}
```

#### Billing Service
```javascript
class BillingService {
  async calculateCost(transaction) {
    // Get tariff/pricing rules
    // Calculate energy cost
    // Calculate time cost
    // Apply discounts
    // Calculate tax
    // Return total cost
  }
  
  async generateInvoice(transaction) {
    // Create invoice record
    // Generate PDF
    // Send email
    // Return invoice
  }
}
```

#### Payment Service
```javascript
class PaymentService {
  async processPayment(transaction) {
    // Get payment method
    // Charge payment gateway
    // Update transaction
    // Update user balance
    // Send receipt
  }
  
  async refundPayment(transactionId) {
    // Process refund
    // Update records
    // Notify user
  }
}
```

---

## DATABASE SCHEMA

### Core Tables

```sql
-- Charge Points (Stations)
CREATE TABLE charge_points (
  id SERIAL PRIMARY KEY,
  charge_point_id VARCHAR(50) UNIQUE NOT NULL,
  vendor VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  firmware_version VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Offline',
  last_heartbeat TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Connectors
CREATE TABLE connectors (
  id SERIAL PRIMARY KEY,
  charge_point_id VARCHAR(50) REFERENCES charge_points(charge_point_id),
  connector_id INTEGER NOT NULL,
  connector_type VARCHAR(50),
  power_rating_kw DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'Available',
  last_status_update TIMESTAMP,
  UNIQUE(charge_point_id, connector_id)
);

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  account_type VARCHAR(20) DEFAULT 'Customer',
  balance DECIMAL(10,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- IdTags (Authorization Tokens)
CREATE TABLE id_tags (
  id SERIAL PRIMARY KEY,
  id_tag VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id),
  parent_id_tag VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Active',
  expiry_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER UNIQUE NOT NULL,
  charge_point_id VARCHAR(50) REFERENCES charge_points(charge_point_id),
  connector_id INTEGER NOT NULL,
  id_tag VARCHAR(50) REFERENCES id_tags(id_tag),
  user_id INTEGER REFERENCES users(id),
  meter_start INTEGER NOT NULL,
  meter_stop INTEGER,
  start_time TIMESTAMP NOT NULL,
  stop_time TIMESTAMP,
  total_energy_kwh DECIMAL(10,3),
  duration_minutes INTEGER,
  total_cost DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'Active',
  reason VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Meter Values
CREATE TABLE meter_values (
  id SERIAL PRIMARY KEY,
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

-- Tariffs (Pricing Rules)
CREATE TABLE tariffs (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  energy_rate DECIMAL(10,4),
  time_rate DECIMAL(10,4),
  base_fee DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMP,
  valid_to TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(transaction_id),
  user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  payment_gateway_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'Pending',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invoices
CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  transaction_id INTEGER REFERENCES transactions(transaction_id),
  user_id INTEGER REFERENCES users(id),
  subtotal DECIMAL(10,2),
  tax DECIMAL(10,2),
  total DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'Generated',
  pdf_path VARCHAR(255),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Authorization Cache
CREATE TABLE authorization_cache (
  id SERIAL PRIMARY KEY,
  id_tag VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  expiry_date TIMESTAMP,
  parent_id_tag VARCHAR(50),
  cached_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(id_tag)
);
```

---

## SECURITY ARCHITECTURE

### Authentication & Authorization

```
1. Charge Point Authentication
   - Certificate-based or API key
   - Validate on WebSocket connection
   - Store authenticated connections

2. User Authentication
   - JWT tokens for REST API
   - Session management
   - Password hashing (bcrypt)

3. API Security
   - Rate limiting
   - CORS configuration
   - Input validation
   - SQL injection prevention
```

### Data Encryption

```
1. In Transit
   - TLS 1.3 for all connections
   - WSS for WebSocket
   - HTTPS for REST API

2. At Rest
   - Encrypt sensitive fields
   - Database encryption
   - Backup encryption
```

---

## DEPLOYMENT ARCHITECTURE

### Recommended: Cloud Deployment (AWS Example)

```
┌─────────────────────────────────────────┐
│         CloudFront (CDN)                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Application Load Balancer          │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
┌───▼────┐          ┌─────▼────┐
│  EC2   │          │   EC2    │
│  App   │          │   App    │
│ Server │          │  Server  │
└───┬────┘          └─────┬────┘
    │                     │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   RDS PostgreSQL    │
    │   (Multi-AZ)        │
    └─────────────────────┘
               │
    ┌──────────▼──────────┐
    │   ElastiCache       │
    │   (Redis)           │
    └─────────────────────┘
```

### Alternative: Container Deployment (Docker/Kubernetes)

```yaml
# docker-compose.yml example
version: '3.8'
services:
  app:
    image: ev-billing-app:latest
    ports:
      - "8080:8080"
      - "9000:9000"  # WebSocket
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    volumes:
      - redis_data:/data
```

---

## MONITORING & LOGGING

### Application Monitoring
- **APM**: New Relic, Datadog, or Application Insights
- **Error Tracking**: Sentry
- **Logging**: ELK Stack or CloudWatch Logs
- **Metrics**: Prometheus + Grafana

### Key Metrics to Monitor
- WebSocket connections count
- Active transactions
- API response times
- Error rates
- Payment success rates
- System resource usage

---

## SCALABILITY CONSIDERATIONS

### Horizontal Scaling
- Stateless application servers
- Load balancer for distribution
- Database read replicas
- Redis cluster for cache

### Performance Optimization
- Database indexing
- Query optimization
- Caching strategies
- Connection pooling
- Message queue for async processing

---

## DISASTER RECOVERY

### Backup Strategy
- Daily database backups
- Real-time transaction log backups
- Off-site backup storage
- Regular backup testing

### High Availability
- Multi-AZ deployment
- Database replication
- Failover mechanisms
- Health checks and auto-recovery

---

**Last Updated**: 2024



