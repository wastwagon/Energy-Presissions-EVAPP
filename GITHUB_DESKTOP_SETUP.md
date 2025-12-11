# GitHub Desktop Setup & Render Deployment Guide

## Step 1: Add Repository to GitHub Desktop

1. **Open GitHub Desktop**
   - Launch the GitHub Desktop application

2. **Add Local Repository**
   - Click **File** → **Add Local Repository**
   - Navigate to: `/Users/OceanCyber/Downloads/EnergyPresissionsEVAP`
   - Click **Add**

3. **Verify Connection**
   - GitHub Desktop should detect the existing remote: `wastwagon/Energy-Presissions-EVAPP`
   - If it shows "No remote repository", we'll create one in the next step

---

## Step 2: Create GitHub Repository (If Not Exists)

### Option A: Repository Already Exists on GitHub

If the repository `wastwagon/Energy-Presissions-EVAPP` already exists:
- GitHub Desktop will automatically connect to it
- Skip to **Step 3**

### Option B: Create New Repository via GitHub Desktop

1. **In GitHub Desktop:**
   - You should see a "Publish repository" button at the top
   - Click **"Publish repository"**

2. **Repository Settings:**
   - **Name:** `Energy-Presissions-EVAPP` (or your preferred name)
   - **Description:** "EV Charging Billing System - OCPP 1.6J Central System Management"
   - **Visibility:** Choose **Private** (recommended) or **Public**
   - **Uncheck** "Keep this code private" if you want it public
   - Click **"Publish Repository"**

3. **Wait for Upload**
   - GitHub Desktop will create the repository and push your code
   - This may take a few minutes depending on file size

### Option C: Create Repository via GitHub Website

1. **Go to GitHub:**
   - Visit: https://github.com/new
   - Or: Click the "+" icon → "New repository"

2. **Repository Settings:**
   - **Owner:** `wastwagon`
   - **Repository name:** `Energy-Presissions-EVAPP`
   - **Description:** "EV Charging Billing System - OCPP 1.6J CSMS"
   - **Visibility:** Private (recommended) or Public
   - **DO NOT** check "Add a README file" (we already have one)
   - **DO NOT** add .gitignore or license (we have them)
   - Click **"Create repository"**

3. **Connect in GitHub Desktop:**
   - GitHub Desktop should automatically detect the new remote
   - Or manually set remote:
     ```bash
     git remote set-url origin https://github.com/wastwagon/Energy-Presissions-EVAPP.git
     ```

---

## Step 3: Commit and Push All Files

1. **Review Changes in GitHub Desktop**
   - In the left sidebar, you'll see all files ready to commit
   - Files will show with a green "+" (new files) or orange circle (modified)

2. **Stage All Files**
   - Check the box at the top to **"Select all"** files
   - Or manually select the files you want to commit

3. **Write Commit Message**
   - At the bottom left, in the **"Summary"** field, type:
     ```
     Initial commit - Complete EV Charging Billing System
     ```
   - Optionally add a description:
     ```
     - Complete OCPP 1.6J Central System Management System
     - Backend API (NestJS)
     - Frontend Dashboard (React + Vite)
     - OCPP Gateway (WebSocket server)
     - Database migrations
     - Docker configuration
     - Render Blueprint for production deployment
     ```

4. **Commit**
   - Click the **"Commit to main"** button at the bottom left
   - Wait for the commit to complete

5. **Push to GitHub**
   - Click the **"Push origin"** button at the top
   - Or click **"Publish branch"** if it's the first push
   - Wait for the push to complete
   - You should see **"Pushed to origin/main"** message

6. **Verify on GitHub**
   - Click **"View on GitHub"** button
   - Or go to: https://github.com/wastwagon/Energy-Presissions-EVAPP
   - Verify all files are uploaded
   - Check that `render.yaml` is in the root directory

---

## Step 4: Deploy to Render Using Blueprint

### Prerequisites
- ✅ GitHub repository created and code pushed
- ✅ Render account created (sign up at https://render.com if needed)

### Deploy Steps

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Sign in to your Render account

2. **Create New Blueprint**
   - Click the **"New +"** button (top right)
   - Select **"Blueprint"**
   - Or go directly to: https://dashboard.render.com/new/blueprint

3. **Connect GitHub Repository**
   - Select **"GitHub"** as the source
   - Authorize Render to access your GitHub account if needed
   - Select repository: **`wastwagon/Energy-Presissions-EVAPP`**
   - Select branch: **`main`**
   - Click **"Connect"**

4. **Configure Blueprint**
   - **Blueprint Name:** `ev-billing-system` (or your preferred name)
   - **Branch:** `main` (should auto-detect)
   - Render will automatically detect `render.yaml` in the root directory

5. **Review Services**
   - Render will parse `render.yaml` and show all services:
     - ✅ PostgreSQL Database (`ev-billing-postgres`)
     - ✅ Redis Cache (`ev-billing-redis`)
     - ✅ Backend API (`ev-billing-api`)
     - ✅ Frontend (`ev-billing-frontend`)
     - ✅ OCPP Gateway (`ev-billing-ocpp-gateway`)
     - ✅ MinIO Object Storage (`ev-billing-minio`)

6. **Set Environment Variables**
   
   Before deploying, you need to set these environment variables in Render dashboard:
   
   **For Backend API (`ev-billing-api`):**
   - `JWT_SECRET` - Generate a strong random string (e.g., use: `openssl rand -base64 32`)
   - `SERVICE_TOKEN` - Generate a strong random string (must match OCPP Gateway)
   - `MINIO_ACCESS_KEY` - Your MinIO access key (e.g., `minioadmin`)
   - `MINIO_SECRET_KEY` - Your MinIO secret key (e.g., `minioadmin`)
   - `PAYSTACK_SECRET_KEY` - Your Paystack secret key (from Paystack dashboard)
   - `PAYSTACK_PUBLIC_KEY` - Your Paystack public key (from Paystack dashboard)
   
   **For OCPP Gateway (`ev-billing-ocpp-gateway`):**
   - `SERVICE_TOKEN` - **Must match** the SERVICE_TOKEN in Backend API
   
   **For MinIO (`ev-billing-minio`):**
   - `MINIO_ROOT_USER` - MinIO admin username (e.g., `minioadmin`)
   - `MINIO_ROOT_PASSWORD` - MinIO admin password (use a strong password)

   **How to Set Environment Variables:**
   - After services are created, go to each service's settings
   - Navigate to **"Environment"** tab
   - Click **"Add Environment Variable"**
   - Add each variable with its value
   - Or use Render's **"Sync"** feature to sync variables across services

7. **Deploy**
   - Click **"Apply"** or **"Deploy"** button
   - Render will start building and deploying all services
   - This may take **10-20 minutes** for the first deployment
   - You can monitor progress in the Render dashboard

8. **Wait for Deployment**
   - Watch the build logs for each service
   - Services will deploy in order (database first, then API, then frontend)
   - Each service will show a status: Building → Live

---

## Step 5: Post-Deployment Configuration

### 1. Get Service URLs

After deployment, note the URLs for each service:
- **Backend API:** `https://ev-billing-api.onrender.com`
- **Frontend:** `https://ev-billing-frontend.onrender.com`
- **OCPP Gateway:** `https://ev-billing-ocpp-gateway.onrender.com`
- **MinIO Console:** `https://ev-billing-minio.onrender.com:9001`

### 2. Update Environment Variables

Update these environment variables with actual service URLs:

**Backend API:**
- `OCPP_GATEWAY_URL` - Update to: `https://ev-billing-ocpp-gateway.onrender.com`
- `PAYSTACK_CALLBACK_URL` - Update to: `https://ev-billing-api.onrender.com/api/payments/verify`
- `MINIO_ENDPOINT` - Update to: `ev-billing-minio.onrender.com`

**Frontend:**
- `REACT_APP_API_URL` - Should auto-update to: `https://ev-billing-api.onrender.com/api`
- `REACT_APP_WS_URL` - Should auto-update to: `wss://ev-billing-ocpp-gateway.onrender.com/ocpp`

**OCPP Gateway:**
- `CSMS_API_URL` - Should auto-update to: `https://ev-billing-api.onrender.com`

### 3. Initialize Database

The database needs to be initialized with tables:

**Option A: Run SQL Scripts Manually**
1. Go to PostgreSQL service in Render dashboard
2. Click **"Connect"** or **"Info"** tab
3. Copy the connection string
4. Use a PostgreSQL client (pgAdmin, DBeaver, or psql) to connect
5. Run SQL scripts from `database/init/` directory in order:
   - `01_schema.sql`
   - `02_tenants.sql`
   - `03_users.sql`
   - ... (all other migration files)

**Option B: Use Render Shell**
1. Go to PostgreSQL service in Render dashboard
2. Click **"Shell"** tab
3. Connect using: `psql $DATABASE_URL`
4. Run SQL scripts manually

### 4. Test Deployment

1. **Check Backend API:**
   ```
   https://ev-billing-api.onrender.com/health
   ```
   Should return: `{"status":"ok"}`

2. **Check Frontend:**
   ```
   https://ev-billing-frontend.onrender.com
   ```
   Should load the dashboard

3. **Check OCPP Gateway:**
   ```
   https://ev-billing-ocpp-gateway.onrender.com/health
   ```
   Should return: `{"status":"ok"}`

4. **Check MinIO:**
   ```
   https://ev-billing-minio.onrender.com:9001
   ```
   Should load MinIO console (login with MINIO_ROOT_USER and MINIO_ROOT_PASSWORD)

---

## Step 6: Configure Custom Domains (Optional)

1. **Add Custom Domain in Render**
   - Go to each service's settings
   - Navigate to **"Custom Domains"** tab
   - Add your custom domain (e.g., `api.yourdomain.com`)
   - Update DNS records as instructed by Render

2. **Update Environment Variables**
   - Update all URLs to use custom domain
   - Redeploy services if needed

---

## Troubleshooting

### GitHub Desktop Issues

**"Repository already exists"**
- The repository name might already be taken
- Try a different name or check if you have access to the existing repo

**"Push failed"**
- Check your internet connection
- Verify you have push permissions to the repository
- Try pulling first: **Repository** → **Pull**

**"No changes to commit"**
- Make sure files are staged (checked boxes)
- Check if files are already committed
- Try refreshing GitHub Desktop

### Render Deployment Issues

**Build Fails**
- Check build logs in Render dashboard
- Verify Dockerfile paths are correct
- Ensure all dependencies are in package.json
- Check for TypeScript compilation errors

**Services Can't Connect**
- Verify all environment variables are set correctly
- Check service URLs are correct
- Review connection strings in Render dashboard
- Ensure `fromService` references in render.yaml match service names exactly

**OCPP Gateway Not Accessible**
- OCPP Gateway is configured as a web service (not worker) for WebSocket support
- Verify the service is running and has a public URL
- Check WebSocket URL format: `wss://ev-billing-ocpp-gateway.onrender.com/ocpp/{chargePointId}`

**Database Connection Issues**
- Verify DATABASE_URL is set correctly
- Check PostgreSQL service is running
- Ensure database migrations have been run
- Verify connection string format

---

## Next Steps After Deployment

1. ✅ **Test all endpoints** - Verify API, frontend, and OCPP Gateway work
2. ✅ **Configure charger** - Set OCPP URL to your OCPP Gateway endpoint
3. ✅ **Create admin user** - Use the API to create your first admin account
4. ✅ **Set up payment gateway** - Configure Paystack with production keys
5. ✅ **Monitor logs** - Watch for any errors or issues
6. ✅ **Set up monitoring** - Configure alerts and monitoring tools

---

## Support Resources

- **Render Documentation:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Blueprint Reference:** https://render.com/docs/blueprint-spec
- **GitHub Desktop Help:** https://docs.github.com/en/desktop

---

## Quick Reference

**GitHub Repository:** `wastwagon/Energy-Presissions-EVAPP`  
**Render Blueprint:** Auto-detected from `render.yaml`  
**Production URLs:** Will be generated after deployment

**Important Environment Variables:**
- `JWT_SECRET` - Must be a strong random string
- `SERVICE_TOKEN` - Must match between API and OCPP Gateway
- `PAYSTACK_SECRET_KEY` - From Paystack dashboard
- `MINIO_ROOT_PASSWORD` - Use a strong password

Good luck with your deployment! 🚀

