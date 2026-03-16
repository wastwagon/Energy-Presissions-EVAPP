# Clean Motion Ghana - Unified System Guide

**One Backend, One Database, One Admin Dashboard**

---

## 🎯 Quick Answer

**YES!** You have:
- ✅ **One PostgreSQL Database** - Stores all data
- ✅ **One NestJS Backend API** - Serves both web and mobile
- ✅ **One Admin Dashboard** - Manages everything from web

---

## 📊 System Overview

```
                    ┌─────────────────┐
                    │  PostgreSQL DB  │
                    │  (Single DB)    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  NestJS Backend  │
                    │  (Single API)    │
                    └────────┬─────────┘
                ┌────────────┼────────────┐
                │            │            │
        ┌───────▼──────┐    │    ┌───────▼──────┐
        │   Web App    │    │    │  Mobile App   │
        │   (React)    │    │    │ (React Native)│
        └──────────────┘    │    └───────────────┘
                            │
                    ┌───────▼───────┐
                    │ Admin Dashboard│
                    │   (Web Only)   │
                    └────────────────┘
```

---

## 🔑 Key Points

### 1. Single Database
- **One PostgreSQL database** (`ev_billing_db`)
- Stores users, stations, transactions, payments for **both apps**
- No data duplication
- Single source of truth

### 2. Single Backend API
- **One NestJS backend** (`csms-api`)
- Serves REST API endpoints for **both apps**
- Same authentication system
- Same business logic

### 3. Single Admin Dashboard
- **Web-based admin dashboard**
- Manages users from **both web and mobile**
- Views transactions from **both platforms**
- Controls system settings for **both apps**

---

## 📱 How It Works

### User Registration
1. User registers via **mobile app** OR **web app**
2. Data saved to **same database**
3. User can login from **either platform**
4. Admin sees user in **admin dashboard**

### Charging Session
1. User starts charging from **mobile app**
2. Transaction saved to **same database**
3. User can view in **web app**
4. Admin can see in **admin dashboard**

### Payment
1. User tops up wallet from **mobile app**
2. Payment processed by **same backend**
3. Wallet updated in **same database**
4. User can use balance on **web app**
5. Admin can see payment in **dashboard**

---

## 🎛️ Admin Dashboard Access

### SuperAdmin Dashboard
**URL**: `http://localhost/superadmin/dashboard`

**Can Manage:**
- ✅ All users (web + mobile)
- ✅ All stations
- ✅ All transactions (web + mobile)
- ✅ All payments (web + mobile)
- ✅ System configuration
- ✅ Vendors
- ✅ Reports & Analytics

### Admin Dashboard
**URL**: `http://localhost/admin/dashboard`

**Can Manage:**
- ✅ Users (web + mobile)
- ✅ Stations
- ✅ Transactions (web + mobile)
- ✅ Operations
- ✅ Reports

---

## 🔐 Authentication

### Same Authentication for Both
- **Web App**: Uses JWT tokens stored in `localStorage`
- **Mobile App**: Uses JWT tokens stored in `AsyncStorage`
- **Same Backend**: Validates tokens from both
- **Same Users**: One user account works on both platforms

### User Types
All user types work on both platforms:
- `Customer` - Can use web and mobile
- `Admin` - Can use web, mobile, and admin dashboard
- `SuperAdmin` - Can use web, mobile, and super admin dashboard

---

## 📊 Data Visibility

### Admin Dashboard Sees:
- ✅ Users registered via web
- ✅ Users registered via mobile
- ✅ Transactions from web app
- ✅ Transactions from mobile app
- ✅ Payments from web
- ✅ Payments from mobile
- ✅ All stations (used by both apps)

### User Sees:
- ✅ Their transactions (from any platform)
- ✅ Their wallet balance (same on both)
- ✅ Available stations (same data)
- ✅ Payment history (from any platform)

---

## 🚀 Deployment

### Production Setup

**Backend API**: `https://api.cleanmotionghana.com`
- Serves web app
- Serves mobile app
- Serves admin dashboard

**Database**: Single PostgreSQL instance
- Stores all data
- Accessible by backend only

**Admin Dashboard**: `https://admin.cleanmotionghana.com`
- Web-based
- Manages everything
- Accessible to admins only

**Mobile App**: 
- Connects to: `https://api.cleanmotionghana.com`
- Same API as web
- Same data

**Web App**: `https://cleanmotionghana.com`
- Connects to: `https://api.cleanmotionghana.com`
- Same API as mobile
- Same data

---

## ✅ Benefits

1. **Simplified Architecture**
   - One backend to maintain
   - One database to manage
   - One admin dashboard

2. **Consistent Data**
   - No sync issues
   - Single source of truth
   - Real-time updates

3. **Easier Management**
   - One place to manage users
   - One place to view transactions
   - One place to configure system

4. **Cost Effective**
   - One backend infrastructure
   - One database server
   - Lower operational costs

5. **Better User Experience**
   - Users can switch platforms
   - Same account everywhere
   - Seamless experience

---

## 🔧 Configuration

### Backend CORS
Updated to allow both web and mobile:
- Web app origin
- Mobile app origin
- Development origins

### Database
- Single PostgreSQL instance
- All tables shared
- No platform separation

### API Endpoints
- Same endpoints for both apps
- Same authentication
- Same response format

---

## 📝 Summary

**You have a unified system:**

✅ **One Database** → Stores all data  
✅ **One Backend** → Serves both apps  
✅ **One Admin Dashboard** → Manages everything  

**Result:**
- Simpler architecture
- Easier maintenance
- Consistent data
- Better management
- Lower costs

---

**Last Updated**: January 13, 2025
