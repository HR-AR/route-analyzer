# Quick Reference Guide

## 🚀 Command Cheat Sheet

### All Stores Overview
```bash
npm run store-metrics -- /path/to/data.csv
```

### Specific Store - Driver Analysis
```bash
npm run driver-store-analysis -- <store-id> /path/to/data.csv
```

### Multi-Day Route Check
```bash
npm run multiday-analysis -- <store-id> /path/to/data.csv
```

### Time Issues (Dwell/Load)
```bash
npm run time-breakdown -- /path/to/data.csv
```

---

## 📊 Metrics Quick Reference

| Metric | Good | Concerning | Critical |
|--------|------|------------|----------|
| DPH | 8-12 | 6-8 | <6 |
| Variance | ±2 hrs | 2-5 hrs | >5 hrs |
| Dwell Time | <20 min | 20-30 min | >30 min |
| Load Time | <30 min | 30-45 min | >45 min |
| Returns | <3% | 3-5% | >5% |

---

## 🔍 Troubleshooting Decision Tree

**START HERE:** Run store-metrics
```
└─ See store with low DPH?
   ├─ YES → Run driver-store-analysis on that store
   │   └─ See high variance (>5 hrs)?
   │       ├─ YES → Run multiday-analysis
   │       │   └─ Multi-day routes found?
   │       │       ├─ YES → Route planning issue (expected behavior)
   │       │       └─ NO → Performance problem
   │       └─ NO → Check dwell/load times
   │           └─ Both normal? → Route complexity issue
   └─ NO → Continue monitoring
```

---

## 📁 Output Files Reference

| Command | Report File | Data File |
|---------|-------------|-----------|
| store-metrics | `store-metrics-report.txt` | `store-metrics-data.json` |
| driver-store-analysis | `driver-store-<id>-report.txt` | `driver-store-<id>-data.json` |
| multiday-analysis | `multiday-analysis-<id>-report.txt` | `multiday-analysis-<id>-data.json` |
| time-breakdown | `time-breakdown-report.txt` | `time-breakdown-data.json` |

---

## 🎯 Common Scenarios

### Scenario 1: Weekly Performance Review
```bash
# Get overview
npm run store-metrics -- weekly_data.csv

# Check worst 3 stores from report
npm run driver-store-analysis -- 5930 weekly_data.csv
npm run driver-store-analysis -- 3538 weekly_data.csv
npm run driver-store-analysis -- 1680 weekly_data.csv
```

### Scenario 2: Investigating One Problem Store
```bash
# Driver breakdown
npm run driver-store-analysis -- 5930 data.csv

# Check if multi-day routes
npm run multiday-analysis -- 5930 data.csv

# Overall time issues
npm run time-breakdown -- data.csv
```

### Scenario 3: Variance Investigation
```bash
# If variance is high, check multi-day first
npm run multiday-analysis -- 5930 data.csv

# Then driver performance
npm run driver-store-analysis -- 5930 data.csv
```

---

## 💡 Pro Tips

1. **Always start with `store-metrics`** - gives you the full picture
2. **High variance + multi-day routes** = route planning needs adjustment
3. **Low DPH + normal times** = route complexity or sequencing issue
4. **One driver struggling** = training opportunity
5. **All drivers struggling** = systemic store issue
6. **Check .txt files** for formatted reports (easy to read)
7. **Check .json files** for raw data (import to Excel/BI tools)

---

## 📞 Data Requirements

Minimum columns needed:
- Date
- Store Id
- Courier Name
- Carrier
- Pickup Complete (timestamp)
- Last Dropoff Complete (timestamp)
- Trip Actual Time (minutes)
- Estimated Duration (minutes)
- Driver Total Time (minutes)
- Driver Dwell Time (minutes)
- Driver Load Time (minutes)
- Total Orders
- Delivered Orders
- Returned Orders
- Pending Orders

---

## 🔧 Installation Reminder

First time setup:
```bash
cd my-new-project
./setup.sh
```

If you see errors about missing packages:
```bash
# Reinstall Node packages
npm install

# Reinstall Python packages
./venv/bin/pip install pandas

# Rebuild TypeScript
npm run build
```

---

## 📈 Understanding the Numbers

**DPH (Deliveries Per Hour)**
- Formula: Delivered Orders ÷ Total Time (hours)
- What it means: Efficiency of delivery operations
- Why it matters: Shows driver productivity

**Batch Density**
- Formula: Total Orders ÷ Routes
- What it means: Average route size
- Why it matters: Affects efficiency and cost per delivery

**Variance**
- Formula: Actual Time - Planned Time
- What it means: Planning accuracy
- Why it matters: Identifies route planning issues

**Working Time (multi-day routes)**
- Formula: Elapsed Time - Overnight Break
- What it means: Actual delivery work time
- Why it matters: True measure of route difficulty

---

## 🚨 Red Flags to Watch For

1. **Variance >10 hours** → Check multiday-analysis
2. **DPH <4** → Serious performance issue
3. **Dwell >45 min** → Break policy problem
4. **Load >60 min** → Warehouse staging issue
5. **Returns >10%** → Address quality issue
6. **62% multi-day routes** → Route design needs review
7. **Large driver performance gap** → Training needed

---

## 📊 Example Real Output

From Store 5930 analysis:
- **Issue Found:** 62% multi-day routes
- **Apparent Problem:** 20+ hour routes, +7 hrs variance
- **Root Cause:** Routes designed to span 2 days
- **Actual Working Time:** 12-14 hours (reasonable)
- **Action:** Adjust route planner to account for multi-day design

This is why the multi-day analysis is critical!
