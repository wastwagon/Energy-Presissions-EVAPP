# How to Run Commands - Quick Guide

## Where to Run Commands

These commands should be run in **Terminal** on your Mac.

---

## Step-by-Step Instructions

### Option 1: Using Terminal App (Recommended)

1. **Open Terminal:**
   - Press `Cmd + Space` (Command + Spacebar)
   - Type "Terminal"
   - Press Enter
   - OR
   - Go to Applications → Utilities → Terminal

2. **Navigate to Your Project:**
   ```bash
   cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP
   ```

3. **Run the Commands:**
   Copy and paste each command, then press Enter

---

### Option 2: Using VS Code/Cursor Integrated Terminal

If you're using VS Code or Cursor:

1. **Open Integrated Terminal:**
   - Press `` Ctrl + ` `` (Control + Backtick)
   - OR
   - Go to Terminal → New Terminal

2. **The terminal will open in your project folder automatically**

3. **Run the Commands:**
   Copy and paste each command

---

## Commands to Run

### 1. Check Gateway Health
```bash
curl http://localhost:9000/health
```
**Expected Output:** `OK`

### 2. Check for Active Connections
```bash
netstat -an | grep 9000 | grep ESTABLISHED
```
**Expected Output:** 
- If connected: Shows connection details
- If not connected: No output (empty)

### 3. View Recent Logs
```bash
docker logs --tail 20 ev-billing-ocpp-gateway
```
**Expected Output:** Shows last 20 lines of gateway logs

---

## Real-Time Monitoring (Most Useful)

### Watch Logs in Real-Time:
```bash
docker logs -f ev-billing-ocpp-gateway
```

**What this does:**
- Shows logs as they happen
- Updates automatically
- Press `Ctrl + C` to stop

**What to look for:**
- `Temporary connection established`
- `BootNotification`
- `Mapping temporary connection`

---

## Quick Copy-Paste Commands

### All-in-One Status Check:
```bash
cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP && echo "=== Gateway Health ===" && curl http://localhost:9000/health && echo "" && echo "=== Active Connections ===" && netstat -an | grep 9000 | grep ESTABLISHED && echo "=== Recent Logs ===" && docker logs --tail 10 ev-billing-ocpp-gateway | grep -v "nodemon" | tail -5
```

### Monitor Connections:
```bash
docker logs -f ev-billing-ocpp-gateway
```

---

## Visual Guide

### Terminal Window Looks Like:
```
Last login: Tue Dec 17 10:00:00 on ttys000
OceanCyber@MacBook-Pro ~ % 
```

### After Running Commands:
```
OceanCyber@MacBook-Pro ~ % cd /Users/OceanCyber/Downloads/EnergyPresissionsEVAP
OceanCyber@MacBook-Pro EnergyPresissionsEVAP % curl http://localhost:9000/health
OK
OceanCyber@MacBook-Pro EnergyPresissionsEVAP % docker logs --tail 20 ev-billing-ocpp-gateway
[logs appear here]
```

---

## Tips

1. **Copy-Paste:** Select command text, copy (Cmd+C), paste in terminal (Cmd+V)

2. **Auto-complete:** Press Tab to auto-complete file/folder names

3. **Command History:** Press Up Arrow to see previous commands

4. **Stop Running Command:** Press `Ctrl + C`

5. **Clear Screen:** Type `clear` and press Enter

---

## Troubleshooting

### If "command not found":
- Make sure you're in Terminal (not a text editor)
- Check spelling of command
- Docker commands require Docker Desktop to be running

### If "permission denied":
- Some commands may need `sudo` (admin password)
- Usually not needed for these commands

### If Docker commands don't work:
- Make sure Docker Desktop is running
- Check: `docker ps` should show running containers

---

## Quick Reference

| What You Want | Command |
|---------------|---------|
| Check if gateway is running | `curl http://localhost:9000/health` |
| See active connections | `netstat -an \| grep 9000 \| grep ESTABLISHED` |
| View recent logs | `docker logs --tail 20 ev-billing-ocpp-gateway` |
| Watch logs live | `docker logs -f ev-billing-ocpp-gateway` |
| Check all containers | `docker ps` |
| Restart gateway | `docker restart ev-billing-ocpp-gateway` |

---

## Need Help?

If you're stuck:
1. Make sure Terminal is open
2. Make sure Docker Desktop is running
3. Try the simplest command first: `docker ps`
4. If that works, try the other commands

