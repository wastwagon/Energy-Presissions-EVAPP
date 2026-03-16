# Render Blueprint Deployment Checklist

Use this checklist when deploying Clean Motion Ghana to Render via **New Blueprint**.

---

## 1. Pre-Deploy: Set Secrets in Render

Before or right after applying the blueprint, set these **secret** environment variables:

### Backend (`ev-billing-api`)

| Variable | Where to get it | Required |
|----------|-----------------|----------|
| **JWT_SECRET** | Run `openssl rand -base64 32` | Yes |
| **SERVICE_TOKEN** | Run `openssl rand -base64 32` | Yes |
| **PAYSTACK_SECRET_KEY** | [Paystack Dashboard](https://dashboard.paystack.com/#/settings/developer) | Yes |
| **PAYSTACK_PUBLIC_KEY** | Paystack Dashboard | Yes |
| **GOOGLE_CLIENT_ID** | `14712678053-uff0du4nbptiqehpksue1vem63ptda6t.apps.googleusercontent.com` | Yes (for Login with Google) |

### Frontend (`ev-billing-frontend`)

| Variable | Value | Required |
|----------|-------|----------|
| **VITE_GOOGLE_CLIENT_ID** | `14712678053-uff0du4nbptiqehpksue1vem63ptda6t.apps.googleusercontent.com` | Yes (for Login with Google) |

---

## 2. Blueprint Steps

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect your GitHub repo
3. Select branch: `main`
4. Render will detect `render.yaml`
5. **Before Apply:** Set all secrets above (click each `sync: false` field and enter the value)
6. Click **Apply**

---

## 3. Custom Domain (cleanmotion.energyprecisions.com)

After deployment:

1. In Render → **ev-billing-frontend** → **Settings** → **Custom Domains**
2. Add `cleanmotion.energyprecisions.com`
3. Add the CNAME record in your DNS: `cleanmotion` → `ev-billing-frontend.onrender.com`

For the API (if using a subdomain like `api.cleanmotion.energyprecisions.com`):

1. In **ev-billing-api** → **Custom Domains** → add your API domain
2. Update `VITE_API_URL` and `VITE_WS_URL` in the frontend service to use your custom API URL

---

## 4. Post-Deploy Verification

- [ ] Frontend loads at your URL
- [ ] Logo displays (uses /logo.jpeg)
- [ ] Login (email/password) works
- [ ] Sign in with Google works
- [ ] Sign in with Apple works (if configured)
- [ ] Paystack payments work (test mode first)
- [ ] WebSocket: Real-time updates may fail on Render free tier; app works without it

---

## 5. Database Migrations

If the database is fresh, run migrations. Render runs them automatically if configured in the Dockerfile, or run manually:

```bash
# From your machine, with DATABASE_URL from Render
npx typeorm migration:run -d ./backend/src/database/data-source.ts
```

Or use Render's **Shell** for the backend service.
