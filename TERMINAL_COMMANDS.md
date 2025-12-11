# Terminal Commands to Fix Unrelated Histories

## Problem
You're in the wrong directory. You need to navigate to the project folder first.

## Solution: Run These Commands

### Step 1: Navigate to Project Directory

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP
```

### Step 2: Merge Unrelated Histories

```bash
git pull origin main --allow-unrelated-histories --no-edit
```

### Or Run Both in One Line:

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP && git pull origin main --allow-unrelated-histories --no-edit
```

---

## What to Expect

1. **If authentication is needed:**
   - You may be prompted to sign in
   - Or GitHub Desktop will handle it automatically

2. **After successful merge:**
   - You'll see a merge commit message
   - The command will complete successfully

3. **Then in GitHub Desktop:**
   - Press `⌘R` to refresh
   - Click **"Push origin"** button
   - All your commits will be uploaded

---

## Quick Copy-Paste

Copy and paste this entire line into Terminal:

```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP && git pull origin main --allow-unrelated-histories --no-edit
```

Then press Enter.

---

## After Running

1. **If successful:** Go to GitHub Desktop and refresh (⌘R)
2. **If it asks for credentials:** Sign in or let GitHub Desktop handle it
3. **Then push:** Click "Push origin" in GitHub Desktop

