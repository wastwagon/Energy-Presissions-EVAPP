# 🔧 Fix Network Error & WebSocket Connection Issues

## 🔴 Issues Identified

1. **Network Error on Login**: Frontend can't connect to backend API
2. **WebSocket Connection Error**: Trying to connect to frontend URL instead of backend
3. **Environment Variables**: May not be available at build time

## ✅ Fixes Applied

### 1. WebSocket Service
**Problem**: WebSocket was constructing URL from `window.location`, connecting to frontend instead of backend.

**Solution**:
- Now uses `VITE_WS_URL` environment variable
- Properly converts `https://` to `wss://` for secure WebSocket
- Falls back to local development URL if env var not set

### 2. API Service
**Enhancement**: Already uses `VITE_API_URL`, but improved fallback logic.

### 3. Dockerfile
**Enhancement**: Added default values for build arguments to ensure they're available during build.

## 📦 Changes Made

1. **`frontend/src/services/websocket.ts`**
   - Uses `VITE_WS_URL` environment variable
   - Proper protocol conversion (https → wss)
   - Better error handling

2. **`frontend/src/services/api.ts`**
   - Improved comments
   - Better environment variable handling

3. **`frontend/Dockerfile.prod`**
   - Added default values for ARG to ensure build works even if env vars not passed

## 🚀 Next Steps

### 1. Push Changes
```bash
# Push via GitHub Desktop
git push origin main
```

### 2. Verify Environment Variables in Render

After pushing, verify in Render Dashboard:

**Frontend Service (`ev-billing-frontend`)**:
- Go to "Environment" tab
- Verify these are set:
  - `VITE_API_URL` = `https://ev-billing-api.onrender.com/api`
  - `VITE_WS_URL` = `wss://ev-billing-api.onrender.com/ws`

**Backend Service (`ev-billing-api`)**:
- Go to "Environment" tab
- Verify `FRONTEND_URL` is set (optional but recommended):
  - `FRONTEND_URL` = `https://ev-billing-frontend.onrender.com`

### 3. Wait for Deployment
- Frontend: ~5-10 minutes
- Backend: ~5-10 minutes

### 4. Test After Deployment

**Frontend**:
- ✅ `https://ev-billing-frontend.onrender.com/login/admin`
- ✅ Should connect to backend API
- ✅ WebSocket should connect to backend

**Backend**:
- ✅ `https://ev-billing-api.onrender.com/api/auth/login` - Should work
- ✅ `https://ev-billing-api.onrender.com/ws` - WebSocket endpoint

## 🔍 Troubleshooting

### If Network Error Persists:

1. **Check Backend is Running**:
   - Go to Render Dashboard → `ev-billing-api`
   - Verify status is "Live"
   - Check logs for errors

2. **Check Environment Variables**:
   - Frontend: Verify `VITE_API_URL` and `VITE_WS_URL` are set
   - Backend: Verify `FRONTEND_URL` is set (for CORS)

3. **Check CORS**:
   - Backend should allow `https://ev-billing-frontend.onrender.com`
   - Check backend logs for CORS errors

4. **Test API Directly**:
   - Open: `https://ev-billing-api.onrender.com/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

### If WebSocket Still Fails:

1. **Check WebSocket URL**:
   - Should be: `wss://ev-billing-api.onrender.com/ws`
   - Not: `wss://ev-billing-frontend.onrender.com/ws`

2. **Check Browser Console**:
   - Look for WebSocket connection errors
   - Check Network tab for WebSocket connection attempts

## 📋 Summary

**Commit**: `8d74d95` - "Fix: Use environment variables for API and WebSocket URLs in production"

**Status**: Ready to push! After deployment, network errors should be resolved.

---

**Push this commit and verify environment variables in Render! 🚀**

