# Render Deployment Guide

## ✅ What's Pre-filled in `render.yaml`

The following environment variables are **automatically configured** in `render.yaml`:

### Backend API (`ev-billing-api`):
- ✅ `NODE_ENV` = `production`
- ✅ `PORT` = `3000`
- ✅ `DATABASE_URL` = (automatically from PostgreSQL)
- ✅ `REDIS_URL` = `redis://localhost:6379`
- ✅ `MINIO_ENDPOINT` = `s3.amazonaws.com`
- ✅ `MINIO_PORT` = `443`
- ✅ `MINIO_EXTERNAL_PORT` = `443`
- ✅ `MINIO_ACCESS_KEY` = `minioadmin` (⚠️ Change in production!)
- ✅ `MINIO_SECRET_KEY` = `minioadmin123` (⚠️ Change in production!)
- ✅ `MINIO_BUCKET` = `ev-billing`
- ✅ `MINIO_USE_SSL` = `true`
- ✅ `OCPP_GATEWAY_URL` = (automatically from backend service)
- ✅ `PAYSTACK_CALLBACK_URL` = (automatically from backend service)

### Frontend (`ev-billing-frontend`):
- ✅ `NODE_ENV` = `production`
- ✅ `VITE_API_URL` = `https://ev-billing-api.onrender.com/api`
- ✅ `VITE_WS_URL` = `wss://ev-billing-api.onrender.com/ws`

## 🔐 Secrets You Must Set Manually

Render **cannot** pre-fill secrets for security reasons. You must set these in the Render dashboard:

### Required Secrets (Backend API):

1. **JWT_SECRET**
   - Generate: Run `./generate-secrets.sh` or `openssl rand -base64 32`
   - Used for: JWT token signing

2. **SERVICE_TOKEN**
   - Generate: Run `./generate-secrets.sh` or `openssl rand -base64 32`
   - Used for: Internal service authentication

3. **PAYSTACK_SECRET_KEY**
   - Get from: [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
   - Used for: Payment processing

4. **PAYSTACK_PUBLIC_KEY**
   - Get from: [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
   - Used for: Payment processing

## 📋 Step-by-Step Deployment

### 1. Generate Secrets Locally

```bash
./generate-secrets.sh
```

This will output:
- `JWT_SECRET` (randomly generated)
- `SERVICE_TOKEN` (randomly generated)
- Instructions for Paystack keys

### 2. Push to GitHub

```bash
git add .
git commit -m "Configure Render Blueprint with pre-filled values"
git push origin main
```

### 3. Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New Blueprint"**
3. Connect your GitHub repository: `wastwagon/Energy-Presissions-EVAPP`
4. Select branch: `main`
5. Review the configuration:
   - ✅ Database: `ev-billing-postgres` (Free)
   - ✅ Backend: `ev-billing-api` (Starter - $7/month)
   - ✅ Frontend: `ev-billing-frontend` (Starter - $7/month)

### 4. Set Secrets in Render Dashboard

**Before clicking "Apply"**, you need to set the secrets:

1. In the "Specified configurations" section, find `ev-billing-api`
2. For each secret (`JWT_SECRET`, `SERVICE_TOKEN`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`):
   - Click the input field
   - Paste the value from `generate-secrets.sh` (or your Paystack dashboard)
   - The value will be hidden (showing as dots)

### 5. Deploy

1. Click **"Apply"** to start deployment
2. Wait for all services to build and deploy (~5-10 minutes)
3. Once deployed, your services will be available at:
   - Frontend: `https://ev-billing-frontend.onrender.com`
   - Backend API: `https://ev-billing-api.onrender.com`
   - Database: Internal (not publicly accessible)

## 🔍 Verifying Deployment

### Check Backend Health:
```bash
curl https://ev-billing-api.onrender.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-..."}
```

### Check Frontend:
Open in browser: `https://ev-billing-frontend.onrender.com`

## ⚠️ Important Notes

1. **MINIO Credentials**: The default `minioadmin` / `minioadmin123` are **not secure**. Change these in production by:
   - Updating `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` in Render dashboard
   - Using strong, randomly generated values

2. **Frontend Environment Variables**: The frontend URLs are hardcoded in `render.yaml`. If your service names change, update:
   - `VITE_API_URL` in `render.yaml`
   - `VITE_WS_URL` in `render.yaml`

3. **Database Migrations**: After deployment, run migrations:
   ```bash
   # Connect to your Render database and run:
   # See database/run-migrations.sh for migration scripts
   ```

4. **Cost**: 
   - Database: Free
   - Backend: $7/month (Starter plan)
   - Frontend: $7/month (Starter plan)
   - **Total: $14/month**

## 🐛 Troubleshooting

### Frontend Not Showing in Blueprint
- ✅ **Fixed**: The frontend service is now properly configured in `render.yaml`
- If still not showing, check that `dockerfilePath` and `dockerContext` are correct

### "Field has no values" Error
- ✅ **Fixed**: All required fields now have values
- Secrets with `sync: false` will show empty - this is normal, you must fill them manually

### Build Fails
- Check that `Dockerfile.prod` exists in `./frontend/`
- Verify environment variables are set correctly
- Check build logs in Render dashboard

## 📞 Support

If you encounter issues:
1. Check Render build logs
2. Verify all secrets are set
3. Ensure database migrations have run
4. Check service health endpoints
