# Store-Specific Analysis Guide

## When to Use

Use store-specific analysis when:
- Your boss asks about a particular store
- You notice a store repeatedly appearing in worst performers
- You need to compare carrier performance at one location
- You want day-by-day details for a specific store

## How to Run

```bash
npm run store-analysis -- <store-number> [data-file.csv]
```

**Examples:**
```bash
# Analyze Store 2242
npm run store-analysis -- 2242 ../data_table_1.csv

# Analyze Store 1118
npm run store-analysis -- 1118 ../data_table_1.csv

# Use default data file
npm run store-analysis -- 2242
```

## What You Get

### Console Output + 2 Files

1. **`store-XXXX-analysis.txt`** - Formatted report
2. **`store-XXXX-data.json`** - Raw data for Excel/BI

### Report Sections

**📊 Overall Performance**
- Average trip time vs estimated
- Variance (how far off estimates are)
- Dwell and load time averages
- Orders per route, drops per hour

**✅ Best/Worst Days**
- Best performing route (closest to estimate)
- Worst performing route (furthest from estimate)

**⭐ Driver Consistency** (if multiple drivers)
- Most consistent driver (low variance)
- Most variable driver (high variance)

**🚨 Identified Issues**
- Routes with extended dwell/load
- High variance from estimates
- Pending/failed orders

**📋 Day-by-Day Breakdown**
- Each route with specific details
- Flags for issues (extended dwell, high variance, etc.)

## Real Example: Store 2242

### Command
```bash
npm run store-analysis -- 2242 ../data_table_1.csv
```

### Output Summary
```
Store #2242 - 4 routes analyzed
Date Range: Oct 1-4, 2025
Carriers: Roadie (WMT), Fox-Drop

Average Variance: +2.23 hours (39% over estimate)

WORST DAY:
  Oct 1 - Anthony G. (Roadie)
  10.85hrs actual vs 5.2hrs estimated
  +5.7 hours over (109% over target)

BEST DAY:
  Oct 4 - Daniel Marentes (Fox-Drop)
  6.88hrs actual vs 7.04hrs estimated
  Right on target!
```

### Key Findings
- **NOT** a dwell/load time issue (both are low)
- **IS** a route execution/estimation issue
- Oct 1 Roadie route is a critical outlier
- Needs investigation and follow-up

## Using Results in Conversations

### With Your Boss

**Instead of:**
> "Store 2242 has some issues"

**Say this:**
> "Store 2242 ran 39% over estimate last week. The main outlier was October 1st when Roadie's route took 10.85 hours instead of the planned 5.2 hours. This isn't a break or loading issue - dwell time was only 12 minutes. It appears to be route execution or estimation problems."

### With Carriers

**Instead of:**
> "You're running late at Store 2242"

**Say this:**
> "At Store 2242 on October 1st, Anthony G.'s route ran 5.7 hours over estimate. Can you investigate what happened on this specific route? Was there traffic, vehicle issue, or other documented problem?"

## Comparing Multiple Stores

Run analysis for each store:

```bash
npm run store-analysis -- 2242 data.csv
npm run store-analysis -- 1118 data.csv
npm run store-analysis -- 973 data.csv
```

Then compare the generated reports to identify:
- Which stores consistently run over estimate
- Which stores have loading dock issues (high load times)
- Which stores have driver issues (high dwell times)
- Which carriers perform best/worst at each location

## Tips for Analysis

### Good Performance Indicators
- ✅ Variance within ±10% of estimate
- ✅ Dwell time < 30 minutes
- ✅ Load time < 60 minutes
- ✅ Consistent performance across days

### Red Flags
- ❌ Variance > 30% consistently
- ❌ Dwell time > 60 minutes
- ❌ Load time > 90 minutes
- ❌ Wide swings between best/worst days

### When Variance is High

**If dwell/load times are normal:**
→ Problem is route execution or estimation

**If dwell/load times are high:**
→ Problem is driver breaks or warehouse operations

**If only one day is bad:**
→ Likely a one-time incident (investigate)

**If all days are bad:**
→ Systemic issue with store, carrier, or route planning

## Advanced: Trend Analysis

Pull data for same store across multiple weeks:

```bash
# Week 1
npm run store-analysis -- 2242 week1-data.csv

# Week 2
npm run store-analysis -- 2242 week2-data.csv

# Week 3
npm run store-analysis -- 2242 week3-data.csv
```

Compare the JSON files to track:
- Is variance improving or getting worse?
- Are the same drivers/carriers problematic?
- Are specific days of the week worse?

## Quick Reference

```bash
# Analyze a store
npm run store-analysis -- <store-number> data.csv

# View the report
cat store-<number>-analysis.txt

# Use the data in Excel
# Open: store-<number>-data.json
```

## Troubleshooting

**"No routes found for Store XXXX"**
→ Check your store number - might be a typo
→ Check if that store exists in your data

**Driver consistency shows "null"**
→ Only one driver serviced this store
→ Need multiple drivers for comparison

**Only a few routes**
→ Normal if analyzing a short time period
→ Pull 30 days of data for better trends

---

**Pro Tip:** When your boss asks about a store, run this analysis first. You'll have specific dates, drivers, and metrics ready for the conversation!
