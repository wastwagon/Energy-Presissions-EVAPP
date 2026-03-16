# Clean Motion Ghana - Architecture Overview

**One Backend, One Database, One Admin Dashboard for Both Apps**

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED BACKEND SYSTEM                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                          │  │
│  │  • Users, Stations, Transactions, Payments, etc.          │  │
│  │  • Single source of truth for all data                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▲                                     │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         NestJS Backend API (csms-api)                    │  │
│  │  • REST API endpoints                                     │  │
│  │  • Business logic                                         │  │
│  │  • Authentication & Authorization                         │  │
│  │  • Serves BOTH web and mobile apps                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│         ▲                              ▲                        │
│         │                              │                        │
│  ┌──────┴──────┐              ┌───────┴────────┐              │
│  │             │              │                │              │
│  │  Web App    │              │  Mobile App    │              │
│  │  (React)    │              │  (React Native)│              │
│  │             │              │                │              │
│  │  • Customer │              │  • Customer   │              │
│  │  • Admin    │              │  • Same users │              │
│  │  • SuperAdmin│             │  • Same data   │              │
│  └─────────────┘              └────────────────┘              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Admin Dashboard (Web Only)                      │  │
│  │  • SuperAdmin Dashboard                                  │  │
│  │  • Admin Dashboard                                       │  │
│  │  • Manages BOTH web and mobile users                    │  │
│  │  • Manages stations, transactions, payments             │  │
│  │  • System configuration                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Single Backend Database

### PostgreSQL Database (`ev_billing_db`)

**One database stores ALL data for both apps:**

- ✅ **Users** - Web and mobile users in the same table
- ✅ **Stations** - Charging stations accessible from both apps
- ✅ **Transactions** - All charging sessions from both platforms
- ✅ **Payments** - Payment records from web and mobile
- ✅ **Wallets** - User wallets accessible from both apps
- ✅ **Vendors** - Vendor management
- ✅ **Tariffs** - Pricing rules
- ✅ **Settings** - System configuration

**Key Point**: Mobile app users and web app users are stored in the same `users` table. There's no separation.

---

## ✅ Single Backend API

### NestJS Backend (`csms-api`)

**One API serves BOTH applications:**

```
Backend API Endpoints:
├── /api/auth/*          → Authentication (web + mobile)
├── /api/users/*         → User management (web + mobile)
├── /api/stations/*      → Station data (web + mobile)
├── /api/transactions/*  → Transactions (web + mobile)
├── /api/wallet/*        → Wallet operations (web + mobile)
├── /api/payments/*      → Payment processing (web + mobile)
└── /api/admin/*         → Admin operations (web only)
```

**How it works:**
- Web app calls: `http://localhost/api/*` or `/api/*` (via NGINX)
- Mobile app calls: `http://YOUR_IP:3000/api/*` (direct or via domain)
- **Same endpoints, same data, same authentication**

**CORS Configuration:**
- Backend allows requests from both web and mobile origins
- JWT tokens work for both platforms
- Same authentication system

---

## ✅ Single Admin Dashboard

### Web-Based Admin Dashboard

**One admin dashboard manages everything:**

#### SuperAdmin Dashboard (`/superadmin`)
- ✅ **User Management** - Manage ALL users (web + mobile)
- ✅ **Station Management** - Manage charging stations
- ✅ **Transaction Monitoring** - View all transactions from both apps
- ✅ **Payment Management** - View payments from web and mobile
- ✅ **System Settings** - Configure system for both platforms
- ✅ **Reports & Analytics** - Combined analytics from both apps
- ✅ **Vendor Management** - Manage vendors
- ✅ **Device Management** - Manage OCPP devices

#### Admin Dashboard (`/admin`)
- ✅ **Operations Dashboard** - Monitor charging operations
- ✅ **User Management** - Manage users (web + mobile)
- ✅ **Transaction History** - View transactions from both apps
- ✅ **Station Management** - Manage stations
- ✅ **Reports** - View reports

**Key Point**: The admin dashboard can see and manage:
- Users who registered via web app
- Users who registered via mobile app
- Transactions started from web
- Transactions started from mobile
- All data is unified and accessible

---

## 📱 How Mobile App Connects

### Mobile App Configuration

**Mobile app connects to the SAME backend:**

```typescript
// mobile/src/config/api.config.ts
const API_CONFIG = {
  DEV_API_URL: 'http://192.168.100.32:3000/api',  // Same backend
  PROD_API_URL: 'https://your-api-domain.com/api', // Same backend
};
```

**Mobile app uses:**
- Same authentication endpoints
- Same user accounts
- Same stations data
- Same transactions
- Same wallet system

---

## 🔐 Authentication Flow

### Unified Authentication

**Both apps use the same authentication:**

1. **User logs in** (web or mobile)
2. **Backend validates** credentials
3. **Backend returns JWT token**
4. **Token stored:**
   - Web: `localStorage`
   - Mobile: `AsyncStorage`
5. **Same token works for both platforms**
6. **Admin dashboard sees the same user**

**User Account Types:**
- `Customer` - Can use both web and mobile
- `Admin` - Can use both web and mobile + admin dashboard
- `SuperAdmin` - Can use both web and mobile + super admin dashboard

---

## 📊 Data Flow Example

### Example: User Charges Their Vehicle

**Scenario**: User starts charging from mobile app

1. **Mobile App** → Calls `/api/charge-points/start`
2. **Backend API** → Validates user, checks wallet
3. **Backend API** → Sends command to OCPP Gateway
4. **OCPP Gateway** → Communicates with charging station
5. **Transaction Created** → Stored in PostgreSQL
6. **Admin Dashboard** → Can see transaction immediately
7. **Web App** → User can see transaction in their history

**Same data, accessible from:**
- ✅ Mobile app
- ✅ Web app
- ✅ Admin dashboard

---

## 🎯 Key Benefits

### 1. **Single Source of Truth**
- One database = no data sync issues
- Consistent data across platforms
- Easier to maintain

### 2. **Unified User Experience**
- Users can switch between web and mobile
- Same account, same data, same wallet
- Seamless experience

### 3. **Centralized Management**
- One admin dashboard to manage everything
- No need to manage separate systems
- Complete visibility

### 4. **Easier Development**
- One API to maintain
- One database schema
- Shared business logic

### 5. **Cost Effective**
- One backend infrastructure
- One database server
- Lower operational costs

---

## 🔧 Configuration

### Backend CORS Settings

The backend is configured to accept requests from both:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001', // Web
  credentials: true,
});
```

**For production**, update CORS to include:
- Web app domain
- Mobile app API domain
- Admin dashboard domain

---

## 📋 Admin Dashboard Features

### What Admins Can Manage

#### User Management
- ✅ View all users (web + mobile)
- ✅ See which platform they use
- ✅ Manage user accounts
- ✅ View user activity

#### Transaction Management
- ✅ View all transactions
- ✅ Filter by platform (web/mobile)
- ✅ View transaction details
- ✅ Handle refunds

#### Station Management
- ✅ Manage charging stations
- ✅ Configure stations
- ✅ View station status
- ✅ Monitor usage

#### System Configuration
- ✅ Configure pricing
- ✅ Manage vendors
- ✅ System settings
- ✅ Payment gateway settings

---

## 🚀 Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────┐
│         Production Server                │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  PostgreSQL Database              │  │
│  │  (Single Database)                │  │
│  └──────────────────────────────────┘  │
│           ▲                             │
│           │                             │
│  ┌──────────────────────────────────┐  │
│  │  NestJS Backend API              │  │
│  │  (Serves both apps)              │  │
│  └──────────────────────────────────┘  │
│      ▲              ▲                   │
│      │              │                   │
│  ┌───┴───┐    ┌────┴────┐            │
│  │  Web  │    │  Mobile  │            │
│  │  App  │    │   App    │            │
│  └───────┘    └──────────┘            │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  Admin Dashboard (Web)           │  │
│  │  (Manages both apps)             │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## ✅ Summary

**YES - You have:**

1. ✅ **One Database** - PostgreSQL stores all data for both apps
2. ✅ **One Backend API** - NestJS serves both web and mobile
3. ✅ **One Admin Dashboard** - Web-based dashboard manages everything
4. ✅ **Unified Users** - Same user accounts work on both platforms
5. ✅ **Unified Data** - All transactions, payments, stations in one place
6. ✅ **Centralized Management** - One place to manage everything

**Benefits:**
- Simpler architecture
- Easier maintenance
- Consistent data
- Lower costs
- Better user experience

---

**Last Updated**: January 13, 2025
