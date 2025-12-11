# Frontend Service Not Showing in Render Blueprint - Fix Guide

## ✅ Current Status

Your `render.yaml` is **correctly configured** with the frontend service. The file includes:

```yaml
services:
  # Backend API (NestJS)
  - type: web
    name: ev-billing-api
    ...

  # Frontend (React + Vite)
  - type: web
    name: ev-billing-frontend
    runtime: docker
    dockerfilePath: ./frontend/Dockerfile.prod
    dockerContext: ./frontend
    plan: starter
    healthCheckPath: /
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_API_URL
        value: https://ev-billing-api.onrender.com/api
      - key: VITE_WS_URL
        value: wss://ev-billing-api.onrender.com/ws
```

## 🔍 Troubleshooting Steps

### Step 1: Verify File is Committed and Pushed

**Check if `render.yaml` is in your repository:**

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP
git status
```

**If you see `render.yaml` in "Untracked files" or "Changes not staged":**

```bash
git add render.yaml
git commit -m "Add frontend service to Render Blueprint"
git push origin main
```

### Step 2: Refresh Render Blueprint

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to your Blueprint
3. Click **"Sync"** or **"Refresh"** button (if available)
4. Or disconnect and reconnect the repository

### Step 3: Check Render Blueprint Branch

1. In Render Dashboard, go to your Blueprint settings
2. Verify the **Branch** is set to `main` (or the branch where `render.yaml` exists)
3. If it's set to a different branch, change it to `main`

### Step 4: Verify File Location

The `render.yaml` file **must** be in the **root** of your repository:

```
EnergyPresissionsEVAP/
├── render.yaml          ← Must be here (root)
├── backend/
├── frontend/
│   └── Dockerfile.prod
├── database/
└── ...
```

**Verify location:**
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP
ls -la render.yaml
```

### Step 5: Check for YAML Syntax Errors

Render might silently ignore services if there's a YAML syntax error. Verify:

```bash
# Check if file is valid YAML (basic check)
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP
cat render.yaml | grep -A 20 "ev-billing-frontend"
```

You should see the frontend service definition.

### Step 6: Verify Dockerfile Exists

Render needs the Dockerfile to exist at the specified path:

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP
ls -la frontend/Dockerfile.prod
```

If it doesn't exist, create it (it should already exist).

### Step 7: Try Manual Service Creation (Temporary)

If the frontend still doesn't show, you can temporarily create it manually:

1. In Render Dashboard, click **"New Web Service"**
2. Connect to your repository
3. Set:
   - **Name**: `ev-billing-frontend`
   - **Root Directory**: `frontend`
   - **Dockerfile Path**: `Dockerfile.prod`
   - **Environment Variables**: Add the ones from `render.yaml`

**Then**, after it's created, you can:
- Delete the manual service
- Re-sync the Blueprint
- The frontend should now appear from `render.yaml`

### Step 8: Check Render Logs

1. In Render Dashboard, go to your Blueprint
2. Check the **"Activity"** or **"Logs"** tab
3. Look for any errors about the frontend service

## 🚨 Common Issues

### Issue 1: File Not Pushed to GitHub
**Symptom**: Frontend doesn't appear
**Fix**: `git add render.yaml && git commit -m "..." && git push`

### Issue 2: Wrong Branch Selected
**Symptom**: Render is looking at a branch without `render.yaml`
**Fix**: Change Blueprint branch to `main` in Render Dashboard

### Issue 3: Cached Blueprint
**Symptom**: Old configuration still showing
**Fix**: Disconnect and reconnect the repository in Render

### Issue 4: YAML Indentation Error
**Symptom**: Frontend service ignored
**Fix**: Ensure proper YAML indentation (2 spaces, not tabs)

## ✅ Verification Checklist

- [ ] `render.yaml` exists in repository root
- [ ] `render.yaml` is committed and pushed to GitHub
- [ ] Render Blueprint is connected to the correct branch (`main`)
- [ ] `frontend/Dockerfile.prod` exists
- [ ] Frontend service is defined in `render.yaml` with correct indentation
- [ ] No YAML syntax errors
- [ ] Render Dashboard has been refreshed

## 📞 If Still Not Working

If the frontend service still doesn't appear after all steps:

1. **Copy the exact error message** from Render Dashboard (if any)
2. **Screenshot** the "Specified configurations" section
3. **Verify** you're looking at the correct Blueprint (not a different one)
4. **Try creating a new Blueprint** from scratch with the updated `render.yaml`

## 🔄 Quick Fix Command

Run this to ensure everything is committed:

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP
git add render.yaml frontend/Dockerfile.prod
git commit -m "Fix: Add frontend service to Render Blueprint with health check"
git push origin main
```

Then refresh your Render Blueprint page.

