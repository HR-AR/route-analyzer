# 🚀 Start Here - Route Analysis Tool

**Welcome!** This tool helps you analyze van delivery routes to improve performance.

## For Non-Technical Users (Start Here!)

### Step 1: One-Time Setup
Double-click the `setup.sh` file to install everything automatically.

Or open Terminal and run:
```bash
./setup.sh
```

This takes 2-3 minutes and only needs to be done once.

### Step 2: Start the Web Interface
Open Terminal and run:
```bash
npm run ui
```

Then open your web browser and go to: **http://localhost:3000**

### Step 3: Analyze Your Data
1. **Upload** your CSV file (the data export from your system)
2. **Select** the type of analysis you want (see below)
3. **Click** "Run Analysis"
4. **View** results in your browser
5. **Download** the report to share with your team

### Which Analysis Should I Run?

**First Time?** Start with **Store Metrics** - it gives you an overview of all stores.

- **Store Metrics** → See all stores at once, find problem areas
- **Time Breakdown** → Find drivers taking too long on breaks or loading
- **Returns Breakdown** → Understand why orders are being returned
- **Driver Store Analysis** → See which drivers at a store need coaching
- **Store Analysis** → See how one store performed day-by-day
- **Multi-Day Analysis** → Understand routes that span multiple days

### Stopping the Server
Press `Ctrl+C` in the Terminal window where the server is running.

---

## For Technical Users

### Quick Commands
```bash
# Start web UI
npm run ui

# Or use command line directly
npm run store-metrics -- data.csv
npm run driver-store-analysis -- 1916 data.csv
npm run time-breakdown -- data.csv
```

### Test Everything
```bash
./test-all-analyses.sh
```

### Documentation
- [UI-QUICK-START.md](UI-QUICK-START.md) - Web interface guide
- [README.md](README.md) - Complete documentation
- [QUICK-START.md](QUICK-START.md) - Quick reference
- [docs/for-developers/](docs/for-developers/) - Technical details

---

## Troubleshooting

**"npm: command not found"**
→ You need to install Node.js from https://nodejs.org/

**"No module named 'pandas'"**
→ Run `./setup.sh` again

**Web UI won't start**
→ Make sure port 3000 isn't being used by another program

**Need help?**
→ See [README.md](README.md) for detailed documentation

---

## What's Next?

After running your first analysis:
1. Download the report
2. Share with your team
3. Take action on the insights
4. Run again next week to track improvement

**The analysis is fast** - most complete in 1-2 seconds!
