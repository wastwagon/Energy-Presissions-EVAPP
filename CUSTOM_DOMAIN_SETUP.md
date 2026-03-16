# Custom Domain Setup: cleanmotion.energyprecisions.com

## What's Configured

| Service | Custom Domain | Render Default |
|---------|---------------|----------------|
| **Frontend** | cleanmotion.energyprecisions.com | ev-billing-frontend.onrender.com |
| **API** | api.cleanmotion.energyprecisions.com | ev-billing-api.onrender.com |

---

## Step 1: Add Domains in Render (if not in blueprint)

If you deployed before adding domains to the blueprint:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. **ev-billing-frontend** → **Settings** → **Custom Domains** → **Add Custom Domain**
   - Enter: `cleanmotion.energyprecisions.com`
3. **ev-billing-api** → **Settings** → **Custom Domains** → **Add Custom Domain**
   - Enter: `api.cleanmotion.energyprecisions.com`

Render will show you the DNS records to add.

---

## Step 2: Configure DNS

At your DNS provider (where `energyprecisions.com` is managed), add these records:

### Option A: CNAME (recommended)

| Type | Name/Host | Value/Points to | TTL |
|------|-----------|-----------------|-----|
| CNAME | cleanmotion | ev-billing-frontend.onrender.com | 3600 |
| CNAME | api.cleanmotion | ev-billing-api.onrender.com | 3600 |

### Option B: A Record (if CNAME not supported for root)

For root domain `cleanmotion.energyprecisions.com`, some providers require:
- **ALIAS** or **ANAME** to `ev-billing-frontend.onrender.com`, OR
- **A** record to Render's IP (check Render dashboard for the IP)

---

## Step 3: SSL (Automatic)

Render provisions free SSL certificates automatically once DNS propagates. No extra setup needed.

---

## Step 4: Verify

1. Wait 5–60 minutes for DNS propagation
2. Visit https://cleanmotion.energyprecisions.com
3. Check API: https://api.cleanmotion.energyprecisions.com/health

---

## Paystack Callback URL

The `PAYSTACK_CALLBACK_URL` env var is set to `https://api.cleanmotion.energyprecisions.com` in the blueprint. Paystack redirects users here after payment. If your app uses a different callback path (e.g. frontend success page), update it in the payment initialization call or in Render env vars.

---

## Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth client:

- **Authorized JavaScript origins:** `https://cleanmotion.energyprecisions.com`
- **Authorized redirect URIs:** `https://api.cleanmotion.energyprecisions.com/api/auth/google/callback` (or your actual callback path)
