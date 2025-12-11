# Render Environment Variables Guide

## Simplified Setup (3 Services)

You're deploying:
1. **PostgreSQL Database** (free)
2. **Backend API** (NestJS)
3. **Frontend** (React)

## Environment Variables to Set

### For Backend API (`ev-billing-api`)

You need to set these in Render dashboard:

1. **JWT_SECRET**
   - Generate: `openssl rand -base64 32`
   - Or use any strong random string
   - Example: `your-super-secret-jwt-key-here`

2. **SERVICE_TOKEN**
   - Generate: `openssl rand -base64 32`
   - Or use any strong random string
   - This is used for internal service communication
   - Example: `your-service-token-here`

3. **MINIO_ACCESS_KEY**
   - MinIO access key
   - Example: `minioadmin` (or generate your own)

4. **MINIO_SECRET_KEY**
   - MinIO secret key
   - Example: `minioadmin123` (use a strong password)

5. **PAYSTACK_SECRET_KEY**
   - From your Paystack dashboard
   - Get it from: https://dashboard.paystack.com/#/settings/developer

6. **PAYSTACK_PUBLIC_KEY**
   - From your Paystack dashboard
   - Get it from: https://dashboard.paystack.com/#/settings/developer

---

## How to Set Environment Variables in Render

### After Deploying Blueprint:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com

2. **Find Your Service**
   - Click on `ev-billing-api` service

3. **Go to Environment Tab**
   - Click **"Environment"** tab

4. **Add Variables**
   - Click **"Add Environment Variable"**
   - Enter **Key** and **Value**
   - Click **"Save Changes"**

5. **Redeploy**
   - Service will automatically redeploy with new variables

---

## Quick Generate Commands

If you have Terminal access:

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate SERVICE_TOKEN
openssl rand -base64 32
```

---

## What Each Variable Does

- **JWT_SECRET**: Used to sign/verify authentication tokens
- **SERVICE_TOKEN**: Used for secure communication between services
- **MINIO_ACCESS_KEY/SECRET_KEY**: For object storage (file uploads)
- **PAYSTACK_SECRET_KEY/PUBLIC_KEY**: For payment processing

---

## After Setting Variables

1. Backend will automatically redeploy
2. Database will be initialized
3. Default users will be created
4. Application will be ready to use!

---

## Note About Other Services

The simplified version removes:
- **Redis** (can add later if needed for caching)
- **OCPP Gateway** (needed for charger connections - add when ready)
- **MinIO** (can use external S3 or add later)

You can add these services later by updating `render.yaml` and redeploying.

