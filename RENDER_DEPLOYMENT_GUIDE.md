# Render Blueprint Deployment Guide

This guide will help you deploy your EV Charging Billing System to Render using Blueprint.

## Prerequisites

1. ✅ GitHub repository created (wastwagon/Energy-Presissions-EVAPP)
2. ✅ GitHub Desktop installed
3. ✅ Render account created
4. ✅ `render.yaml` file created (in root directory)

## Step 1: Commit and Push to GitHub

### Using GitHub Desktop:

1. **Open GitHub Desktop**
   - Make sure your repository "Energy-Presissions-EVAPP" is open

2. **Stage All Changes**
   - In the left sidebar, you'll see all changed files
   - Check the box at the top to "Select all" or manually check:
     - `render.yaml` (new file)
     - `.gitignore` (updated)
     - Any other changes you want to commit

3. **Write Commit Message**
   - In the bottom left, write a commit message:
     ```
     Add Render Blueprint configuration for production deployment
     ```

4. **Commit**
   - Click "Commit to main" button

5. **Push to GitHub**
   - Click "Push origin" button (top right)
   - Wait for push to complete

### Verify on GitHub:
- Go to https://github.com/wastwagon/Energy-Presissions-EVAPP
- Check that `render.yaml` appears in the file list
- Check that it's on the `main` branch

## Step 2: Create Production Dockerfiles

Before deploying, we need production-ready Dockerfiles. Let me create them:

### Backend Production Dockerfile
The backend Dockerfile already exists and looks good, but we may need to adjust it.

### Frontend Production Dockerfile
We need to create a production build for the frontend.

### OCPP Gateway Production Dockerfile
We need a production Dockerfile for the OCPP Gateway.

## Step 3: Deploy on Render

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in if needed

2. **Create New Blueprint**
   - Click "New +" button
   - Select "Blueprint"
   - Or go directly to: https://dashboard.render.com/new/blueprint

3. **Connect Repository**
   - Select "GitHub" as source
   - Authorize Render if needed
   - Select repository: `wastwagon/Energy-Presissions-EVAPP`
   - Select branch: `main`

4. **Configure Blueprint**
   - Blueprint Name: `ev-billing-system` (or your preferred name)
   - Branch: `main` (should auto-detect)
   - Render will automatically detect `render.yaml`

5. **Review Configuration**
   - Render will parse `render.yaml` and show all services
   - Review each service:
     - PostgreSQL database
     - Redis cache
     - Backend API
     - Frontend
     - OCPP Gateway (worker)
     - MinIO (optional)

6. **Set Environment Variables**
   Before deploying, set these in Render dashboard:
   
   **For Backend API:**
   - `JWT_SECRET` - Generate a strong random string
   - `SERVICE_TOKEN` - Generate a strong random string
   - `MINIO_ACCESS_KEY` - Your MinIO access key
   - `MINIO_SECRET_KEY` - Your MinIO secret key
   - `PAYSTACK_SECRET_KEY` - Your Paystack secret key
   - `PAYSTACK_PUBLIC_KEY` - Your Paystack public key

   **For OCPP Gateway:**
   - `SERVICE_TOKEN` - Must match the one in Backend API

   **For MinIO:**
   - `MINIO_ROOT_USER` - MinIO admin username
   - `MINIO_ROOT_PASSWORD` - MinIO admin password

7. **Deploy**
   - Click "Apply" or "Deploy" button
   - Render will start building and deploying all services
   - This may take 10-20 minutes

## Step 4: Post-Deployment Configuration

### 1. Update Service URLs

After deployment, update these environment variables with actual service URLs:

**Backend API:**
- `OCPP_GATEWAY_URL` - Update with OCPP Gateway URL
- `PAYSTACK_CALLBACK_URL` - Update with your API URL

**Frontend:**
- `REACT_APP_API_URL` - Update with Backend API URL
- `REACT_APP_WS_URL` - Update with OCPP Gateway WebSocket URL

**OCPP Gateway:**
- `CSMS_API_URL` - Update with Backend API URL

### 2. Database Initialization

The database needs to be initialized with tables. You can:

**Option A: Run SQL scripts manually**
- Connect to PostgreSQL database in Render
- Run scripts from `database/init/` directory

**Option B: Create initialization script**
- Add a startup script that runs migrations
- Or use Render's post-deploy script

### 3. Test Deployment

1. **Check Backend API:**
   ```
   https://ev-billing-api.onrender.com/health
   ```

2. **Check Frontend:**
   ```
   https://ev-billing-frontend.onrender.com
   ```

3. **Check OCPP Gateway:**
   ```
   https://ev-billing-ocpp-gateway.onrender.com/health
   ```

## Step 5: Configure Custom Domains (Optional)

1. **Add Custom Domain in Render**
   - Go to each service settings
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Environment Variables**
   - Update all URLs to use custom domain
   - Redeploy services if needed

## Troubleshooting

### Issue: Build Fails

**Check:**
- Dockerfile paths are correct
- All dependencies are in package.json
- Build commands are correct

**Solution:**
- Check build logs in Render dashboard
- Fix errors and redeploy

### Issue: Services Can't Connect

**Check:**
- Environment variables are set correctly
- Service URLs are correct
- Database connection string is valid

**Solution:**
- Verify all `fromService` references in render.yaml
- Check service names match exactly
- Review connection strings in Render dashboard

### Issue: OCPP Gateway Not Accessible

**Note:** Render workers don't have public URLs by default. For WebSocket support:
- Use a web service instead of worker
- Or use a reverse proxy
- Or configure WebSocket support in Render

**Solution:**
- Change OCPP Gateway from `worker` to `web` type in render.yaml
- This will give it a public URL

## Important Notes

1. **WebSocket Support**: Render supports WebSockets, but you may need to configure it properly
2. **Database Migrations**: Set up automatic migrations or run them manually
3. **Environment Variables**: Keep sensitive keys secure, use Render's sync feature
4. **Scaling**: Adjust plans (starter → standard → pro) based on traffic
5. **Monitoring**: Use Render's built-in monitoring and logs

## Next Steps

1. ✅ Commit and push `render.yaml` to GitHub
2. ⬜ Create production Dockerfiles (if needed)
3. ⬜ Deploy on Render
4. ⬜ Configure environment variables
5. ⬜ Initialize database
6. ⬜ Test all services
7. ⬜ Configure custom domains (optional)

## Support

- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- Blueprint Reference: https://render.com/docs/blueprint-spec
