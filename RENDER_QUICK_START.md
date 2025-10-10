# 🚀 Render Deployment - Quick Start

**Goal:** Get your Route Analysis Dashboard live on the web in 15 minutes!

---

## ✅ Prerequisites (5 minutes)

1. **GitHub Account**
   - Go to https://github.com/signup if you don't have one
   - Free account works perfectly

2. **Render Account**
   - Go to https://render.com/signup
   - Sign up with GitHub (easiest option)
   - Free tier is sufficient

3. **Push Code to GitHub** (see [GIT_GUIDE.md](GIT_GUIDE.md) for detailed instructions)

---

## 🎯 Deploy to Render (10 minutes)

### Step 1: Push to GitHub (if not already done)

```bash
cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis"

# Initialize git (skip if already done)
git init
git add .
git commit -m "Initial commit - Route Analysis Dashboard ready for Render"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

### Step 2: Create Web Service on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect Account"** to link GitHub
4. Find and select your repository
5. Click **"Connect"**

---

### Step 3: Configure Service

Copy and paste these **exact values**:

| Field | Value |
|-------|-------|
| **Name** | `route-analysis-dashboard` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Runtime** | `Node` |
| **Build Command** | See below ⬇️ |
| **Start Command** | See below ⬇️ |
| **Plan** | `Free` |

**Build Command** (copy exactly):
```
cd my-new-project && npm install && npm run build && cd .. && pip install -r requirements.txt
```

**Start Command** (copy exactly):
```
cd my-new-project && node dist/ui-server.js
```

---

### Step 4: Add Environment Variables

Click **"Add Environment Variable"** and add these 3 variables:

1. **Key:** `NODE_ENV` → **Value:** `production`
2. **Key:** `PORT` → **Value:** `10000`
3. **Key:** `PYTHON_VERSION` → **Value:** `3.11.9`

---

### Step 5: Deploy!

1. Scroll down and click **"Create Web Service"**
2. Wait 3-5 minutes while Render builds your app
3. Watch the build logs - you should see:
   ```
   ==> Building...
   ==> Build successful!
   ==> Your service is live at https://...
   ```

---

## 🎉 You're Live!

Render will give you a URL like:
```
https://route-analysis-dashboard-xxxx.onrender.com
```

**Test it:**
1. Click the URL
2. Upload a CSV file
3. Run an analysis
4. Verify results appear

**Share with your team!** 🎊

---

## ⚠️ Important Notes

### First Load After Idle
- **Free tier**: App "spins down" after 15 minutes of inactivity
- **First load**: May take 30-60 seconds to wake up
- **Subsequent loads**: Instant (while active)
- **Upgrade to Starter ($7/month)**: Keeps app always running

### Auto-Deploy
- Every time you push to GitHub, Render automatically redeploys
- Takes 3-5 minutes
- You'll get an email when deployment succeeds/fails

---

## 🆘 Troubleshooting

### Build Fails

**Check the logs** in Render dashboard → Logs tab

**Common issues:**

| Error | Solution |
|-------|----------|
| `npm install failed` | Check `package.json` is valid |
| `pip install failed` | Check `requirements.txt` is valid |
| `tsc failed` | TypeScript errors - run `npm run build` locally first |

### App Crashes

**Check:**
1. Start command is correct: `cd my-new-project && node dist/ui-server.js`
2. Environment variables are set (all 3 of them)
3. Look at logs for specific error messages

### Health Check Fails

Visit: `https://your-app.onrender.com/health`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-09T...",
  "service": "route-analysis-dashboard"
}
```

If you get 404, redeploy with latest code.

---

## 📚 Need More Details?

- **Full deployment guide**: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)
- **Deployment changes summary**: [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md)
- **Git setup guide**: [GIT_GUIDE.md](GIT_GUIDE.md)

---

## 🔄 Making Updates

After deployment, to update your app:

```bash
# Make your changes locally
# Test them with: npm run ui

# Commit changes
git add .
git commit -m "Description of what you changed"

# Push to GitHub (triggers auto-deploy on Render)
git push origin main
```

Render will automatically rebuild and redeploy in 3-5 minutes.

---

## ✅ Deployment Checklist

- [ ] GitHub account created
- [ ] Render account created
- [ ] Code pushed to GitHub
- [ ] Web service created on Render
- [ ] Build command configured
- [ ] Start command configured
- [ ] 3 environment variables added
- [ ] Build completes successfully
- [ ] Health check endpoint works
- [ ] Homepage loads
- [ ] CSV upload works
- [ ] Analysis runs and shows results
- [ ] URL shared with team

---

**That's it! Your dashboard is now live on the web! 🚀**

For detailed troubleshooting and advanced configuration, see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md).
