# 🚀 Deploying Route Analysis Dashboard to Render

This guide will walk you through deploying the Route Analysis Dashboard to Render so your team can access it from any web browser without installing anything locally.

---

## 📋 Prerequisites

Before you begin, make sure you have:

1. ✅ A [GitHub account](https://github.com/signup)
2. ✅ A [Render account](https://render.com/signup) (free tier available)
3. ✅ Your code pushed to a GitHub repository (see [GIT_GUIDE.md](GIT_GUIDE.md))

---

## 🎯 Deployment Steps

### Step 1: Push Your Code to GitHub

If you haven't already, follow these commands to push your code to GitHub:

```bash
# Navigate to your project
cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis"

# Initialize Git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Route Analysis Dashboard"

# Add your GitHub repository as remote
# Replace YOUR_USERNAME and YOUR_REPO with your actual GitHub username and repo name
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

**Note:** If you get an error about the branch name, try:
```bash
git branch -M main
git push -u origin main
```

---

### Step 2: Create a New Web Service on Render

1. **Log in to Render**
   - Go to https://render.com
   - Click "Sign In" or "Get Started"

2. **Create a New Web Service**
   - Click the **"New +"** button in the top right
   - Select **"Web Service"**

3. **Connect Your GitHub Repository**
   - Click **"Connect Account"** next to GitHub
   - Authorize Render to access your GitHub
   - Find and select your **Route Analysis Dashboard** repository
   - Click **"Connect"**

---

### Step 3: Configure Your Web Service

Fill in the following settings on the configuration page:

| Setting | Value | Notes |
|---------|-------|-------|
| **Name** | `route-analysis-dashboard` | Or any name you prefer |
| **Region** | `Oregon (US West)` | Choose closest to your team |
| **Branch** | `main` | The branch to deploy from |
| **Root Directory** | Leave blank | Uses repo root |
| **Runtime** | `Node` | Auto-detected |
| **Build Command** | See below ⬇️ | Copy exactly |
| **Start Command** | See below ⬇️ | Copy exactly |
| **Plan** | `Free` | Free tier is sufficient for testing |

**Build Command** (copy this exactly):
```bash
cd my-new-project && npm install && npm run build && cd .. && pip install -r requirements.txt
```

**Start Command** (copy this exactly):
```bash
cd my-new-project && node dist/ui-server.js
```

---

### Step 4: Set Environment Variables

Scroll down to the **Environment Variables** section and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `PYTHON_VERSION` | `3.11.9` |

To add each variable:
1. Click **"Add Environment Variable"**
2. Enter the **Key** and **Value**
3. Repeat for all 3 variables

---

### Step 5: Deploy!

1. Scroll to the bottom and click **"Create Web Service"**
2. Render will start building and deploying your app
3. Wait for the build to complete (usually 3-5 minutes)

You'll see the build logs in real-time. Look for messages like:
```
==> Building...
==> Installing dependencies...
==> Build successful!
==> Starting server...
==> Your service is live at https://route-analysis-dashboard.onrender.com
```

---

## 🎉 Access Your Dashboard

Once deployed, Render will give you a URL like:

```
https://route-analysis-dashboard.onrender.com
```

**Share this URL with your team!** Anyone can now:
1. Open the URL in their browser
2. Upload a CSV file
3. Run analyses
4. View results

**No installation required!**

---

## 🔧 Common Issues & Solutions

### Issue 1: Build Fails - Python Not Found

**Error:** `pip: command not found`

**Solution:** Make sure you selected **"Node"** as the runtime. Render's Node environment includes Python by default.

---

### Issue 2: Build Fails - Module Not Found

**Error:** `Cannot find module 'express'` or similar

**Solution:** Check that your build command includes `npm install`:
```bash
cd my-new-project && npm install && npm run build && cd .. && pip install -r requirements.txt
```

---

### Issue 3: App Crashes After Deployment

**Error:** `Application failed to respond`

**Solution 1:** Check the **Logs** tab in Render dashboard for specific errors

**Solution 2:** Make sure your start command is correct:
```bash
cd my-new-project && node dist/ui-server.js
```

**Solution 3:** Verify the `PORT` environment variable is set to `10000`

---

### Issue 4: Site is Slow to Load

**Cause:** The free tier on Render spins down after 15 minutes of inactivity.

**Solutions:**
- **Free tier:** First load after inactivity takes 30-60 seconds (normal behavior)
- **Upgrade to Starter plan ($7/month):** Keeps your app always running
- **Keep it warm:** Use a service like [UptimeRobot](https://uptimerobot.com/) to ping your site every 5 minutes

---

### Issue 5: File Upload Size Limits

**Default limit:** 50MB per file

If you need to upload larger files:

1. In Render dashboard, go to your service
2. Click **Environment** tab
3. Add this variable:

| Key | Value |
|-----|-------|
| `MAX_FILE_SIZE` | `100` |

Then update `ui-server.ts`:
```typescript
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: (process.env.MAX_FILE_SIZE || 50) * 1024 * 1024 } // MB to bytes
});
```

Commit and push to trigger redeployment.

---

## 🔄 Updating Your Deployment

Whenever you make changes to the code:

```bash
# Make your changes locally
# Test them

# Commit your changes
git add .
git commit -m "Description of changes"

# Push to GitHub
git push origin main
```

**Render will automatically rebuild and redeploy** (if auto-deploy is enabled).

To manually trigger a deploy:
1. Go to Render dashboard
2. Select your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

---

## 💰 Render Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/month | • 750 hours/month<br>• Spins down after 15 min inactivity<br>• Good for testing |
| **Starter** | $7/month | • Always running<br>• Faster builds<br>• Custom domains |
| **Standard** | $25/month | • More resources<br>• Scaling options |

**Recommendation:** Start with **Free** for testing, upgrade to **Starter** ($7/month) for team use.

---

## 🔐 Security Considerations

### ✅ Good Practices Already Implemented:

1. **CSV files are NOT committed to Git** (.gitignore excludes *.csv)
2. **Uploaded files are temporary** (stored in /uploads, cleared on restart)
3. **No sensitive credentials in code** (.env files excluded)

### ⚠️ Additional Recommendations:

1. **Enable Authentication** (Future Enhancement)
   - Add login system to restrict access
   - Recommend using render.com's built-in authentication or implement your own

2. **Use HTTPS Only**
   - Render provides HTTPS by default ✅

3. **Monitor Access**
   - Check Render logs regularly
   - Set up alerts for unusual activity

4. **Limit File Sizes**
   - Default 50MB limit is reasonable
   - Prevents abuse/overload

---

## 📊 Monitoring Your Deployment

### View Logs

1. Go to Render dashboard
2. Select your service
3. Click **"Logs"** tab
4. See real-time application logs

**Useful for debugging:**
- Seeing which analyses are being run
- Identifying errors
- Monitoring usage

### Check Health Status

Visit your health check endpoint:
```
https://your-app.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T12:34:56.789Z",
  "service": "route-analysis-dashboard"
}
```

---

## 🆘 Need Help?

### 1. Check Render Documentation
- [Render Docs](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)

### 2. Check Application Logs
- Render Dashboard → Your Service → Logs tab

### 3. Test Locally First
```bash
cd my-new-project
npm run dev
```
If it works locally but not on Render, compare:
- Environment variables
- Node.js version
- Python version
- File paths (use absolute paths, not relative)

### 4. Common Log Errors & Fixes

| Error in Logs | Fix |
|---------------|-----|
| `ENOENT: no such file` | Check file paths, ensure all files committed to Git |
| `Port already in use` | Render handles this - ignore locally |
| `Module not found` | Run `npm install` in build command |
| `Python not found` | Set PYTHON_VERSION env var to `3.11.9` |

---

## ✅ Deployment Checklist

Before sharing with your team, verify:

- [ ] App builds successfully on Render
- [ ] Health check endpoint works: `/health`
- [ ] Homepage loads at your Render URL
- [ ] Can upload a test CSV file
- [ ] At least one analysis type works end-to-end
- [ ] Results display correctly
- [ ] Logs show no critical errors
- [ ] URL is accessible from company network (test with teammate)

---

## 🎓 Next Steps

Once deployed successfully:

1. **Share the URL** with your team using the [EMAIL_TEMPLATE.md](EMAIL_TEMPLATE.md)
2. **Test with real data** to ensure all analyses work
3. **Monitor usage** via Render logs
4. **Consider upgrading** to Starter plan if heavily used
5. **Add authentication** if needed for security

---

## 📝 Example Email to Team

```
Subject: New Route Analysis Tool - Web Access Available!

Hi team,

Great news! The Route Analysis Dashboard is now available as a web app.

🌐 Access it here: https://route-analysis-dashboard.onrender.com

No installation needed! Just:
1. Open the link
2. Upload your CSV file
3. Select an analysis
4. View results instantly

All 8 analysis types are available:
• Store Metrics
• Driver Store Analysis
• Multi-Day Analysis
• Time Breakdown
• Store Analysis
• Returns Breakdown
• Pending Orders
• Failed Orders/Pickups Analysis

Try it out and let me know if you have any questions!

Note: First load may take 30-60 seconds if the app has been idle.

Best,
[Your Name]
```

---

**Congratulations! Your Route Analysis Dashboard is now live on Render! 🎉**
