# Adding Paystack Keys Later - Guide

## ✅ Yes, You Can Add Paystack Keys Later!

Your application will deploy successfully without Paystack keys. You can add them anytime after deployment.

## 🚀 Deploy Now, Add Keys Later

### Step 1: Deploy Without Paystack Keys

When deploying on Render:

1. **In the "Specified configurations" section**, you'll see:
   - `PAYSTACK_SECRET_KEY` - Leave this **empty** for now
   - `PAYSTACK_PUBLIC_KEY` - Leave this **empty** for now

2. **Click "Apply"** to deploy
   - The deployment will succeed
   - All services will start
   - Payment features will be disabled until keys are added

### Step 2: Add Paystack Keys After Deployment

**Option A: Via Render Dashboard (Recommended)**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your **`ev-billing-api`** service
3. Go to **"Environment"** tab
4. Find `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`
5. Click **"Add"** or **"Edit"** next to each key
6. Enter your Paystack keys:
   - **PAYSTACK_SECRET_KEY**: Your secret key from Paystack
   - **PAYSTACK_PUBLIC_KEY**: Your public key from Paystack
7. Click **"Save Changes"**
8. Render will automatically restart the service with the new keys

**Option B: Via Render Blueprint (Update render.yaml)**

1. Get your Paystack keys from [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Update `render.yaml`:
   ```yaml
   - key: PAYSTACK_SECRET_KEY
     value: sk_test_xxxxxxxxxxxxx  # Your actual key
   - key: PAYSTACK_PUBLIC_KEY
     value: pk_test_xxxxxxxxxxxxx  # Your actual key
   ```
3. Commit and push:
   ```bash
   git add render.yaml
   git commit -m "Add Paystack keys"
   git push origin main
   ```
4. Render will automatically sync and update the service

## 📋 Getting Your Paystack Keys

1. Go to [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer)
2. Sign up or log in
3. Navigate to **Settings** → **API Keys & Webhooks**
4. Copy:
   - **Secret Key** (starts with `sk_test_` for test, `sk_live_` for live)
   - **Public Key** (starts with `pk_test_` for test, `pk_live_` for live)

## ⚠️ Important Notes

### Test vs Live Keys

- **Test Keys**: Use `sk_test_...` and `pk_test_...` for development/testing
- **Live Keys**: Use `sk_live_...` and `pk_live_...` for production

**For initial deployment, use test keys** to avoid charges.

### Service Restart

After adding keys, Render will automatically restart your `ev-billing-api` service. This takes about 1-2 minutes.

### Error Handling

If Paystack keys are missing:
- Payment endpoints will return errors
- Users will see "Payment service unavailable" messages
- The rest of the application continues to work normally

## 🔍 Verifying Keys Are Set

After adding keys, verify they're working:

1. **Check Environment Variables:**
   ```bash
   # In Render Dashboard → ev-billing-api → Environment
   # You should see PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY with values
   ```

2. **Test Payment Endpoint:**
   ```bash
   curl https://ev-billing-api.onrender.com/api/payments/health
   # Should return success if keys are configured
   ```

3. **Check Application Logs:**
   - In Render Dashboard → ev-billing-api → Logs
   - Look for "Paystack initialized" or similar messages

## 📝 Current Deployment Checklist

For now, you only need to set:

- ✅ **JWT_SECRET** (required - generate with `./generate-secrets.sh`)
- ✅ **SERVICE_TOKEN** (required - generate with `./generate-secrets.sh`)
- ⏸️ **PAYSTACK_SECRET_KEY** (optional - can add later)
- ⏸️ **PAYSTACK_PUBLIC_KEY** (optional - can add later)

## 🎯 Recommended Workflow

1. **Deploy now** with just JWT_SECRET and SERVICE_TOKEN
2. **Test the application** (everything except payments)
3. **Sign up for Paystack** (if you haven't already)
4. **Get test keys** from Paystack dashboard
5. **Add keys to Render** via Environment tab
6. **Test payment functionality**
7. **Switch to live keys** when ready for production

## 💡 Quick Reference

**Generate required secrets:**
```bash
./generate-secrets.sh
```

**Deploy without Paystack:**
- Leave PAYSTACK_SECRET_KEY empty
- Leave PAYSTACK_PUBLIC_KEY empty
- Click "Apply" to deploy

**Add Paystack later:**
- Render Dashboard → ev-billing-api → Environment
- Add keys → Save → Auto-restart

