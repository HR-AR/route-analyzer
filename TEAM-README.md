# Route Analysis Tool - Team Guide

## What This Tool Does

Analyzes Dedicated Van Delivery data to help you:
- Verify if drivers are on road for planned hours (8.33hr @ 10AM, 7.33hr @ 12PM)
- Find routes deviating >10% from target
- Identify extended breaks (>30min) and long load times (>60min)
- Compare carrier performance
- Get specific dates and store numbers for problem routes

## Quick Start (First Time Setup)

### 1. Install Prerequisites
- **Node.js**: Install the LTS version from [https://nodejs.org/](https://nodejs.org/)
- **Python**: Install version 3.11+ from [https://python.org/](https://python.org/downloads/)

Make sure both `node` and `python3` are available in your system's command line PATH.

### 2. Install Project Dependencies

```bash
# Navigate to the project folder
cd route-analysis-dashboard

# Install all dependencies
npm install
```
This single command will install all Node.js and Python packages and build the necessary files.

## How to Use

### Basic Analysis

```bash
# Analyze your CSV file
npm start -- /path/to/your/data.csv
```

**Example:**
```bash
npm start -- ~/Downloads/weekly-routes-10-01.csv
```

This generates a JSON report with:
- Summary statistics
- 10AM vs 12PM performance
- Carrier breakdown
- Worst performing routes

### Time Breakdown Analysis (Recommended)

```bash
# Get detailed time breakdown with dates and store numbers
npm run time-breakdown -- /path/to/your/data.csv
```

**This is what you want to use regularly!** It shows:
- **Specific dates** for each problem route
- **Store numbers** for easy follow-up
- Routes with **BOTH** extended dwell AND load time
- Saves formatted report to `time-breakdown-report.txt`
- Saves raw data to `time-breakdown-data.json`

## Understanding the Reports

### Time Breakdown Report Structure

```
EXTENDED DWELL & LOAD TIME ANALYSIS
======================================================================

AVERAGE TIME SPENT (Per Route):
  Shows overall averages across all routes

CRITICAL: Extended Time Issues
  • How many routes have problems
  • Total wasted time in hours
  • Potential for additional routes

DOUBLE TROUBLE:
  Routes with BOTH extended dwell AND load time
  ↳ These are your highest priority!

TOP 10 WORST DWELL TIMES:
  Individual routes with dates and store numbers
  ↳ Use this to follow up with specific drivers

TOP 10 WORST LOAD TIMES:
  Individual routes with dates and store numbers
  ↳ May indicate warehouse/loading dock issues

IMMEDIATE ACTIONS:
  Specific recommendations based on your data
```

### Reading Individual Route Entries

```
1. Frank Garcia (NTG)
   Date: 2025-10-01 | Store: 1118
   Dwell: 136.57 min (2.28 hrs)
   Load: 19.15 min | Orders: 89
```

**This tells you:**
- **Driver name:** Frank Garcia
- **Carrier:** NTG
- **Specific date:** October 1, 2025
- **Store number:** 1118
- **Problem:** 136 minutes (2.3 hours!) of dwell time
- **Load time:** Normal (19 min)
- **Orders:** 89 (good volume, so why the long break?)

## Common Use Cases

### Weekly Performance Review

```bash
# 1. Export data from your system to CSV
# 2. Run the analysis
npm run time-breakdown -- ~/Downloads/weekly-data.csv

# 3. Review the generated report
open time-breakdown-report.txt

# 4. Share with team
# Email the time-breakdown-report.txt file
```

### Follow Up on Specific Issues

1. Run the time breakdown
2. Look at "TOP 10 WORST DWELL TIMES"
3. Note the **date** and **store number**
4. Contact carrier with specific details:
   - "On Oct 1st at Store 1118, Frank Garcia had 2.3 hours of dwell time. Can you investigate?"

### Carrier Performance Comparison

```bash
# Run basic analysis
npm start -- data.csv > carrier-report.json

# View carrier performance section
cat carrier-report.json | grep -A 20 "carrier_performance"
```

## Data Format Required

Your CSV must have these columns:
- Carrier, Date, Store Id, Courier Name
- Trip Planned Start, Trip Actual Time
- Driver Dwell Time, Driver Load Time
- Total Orders, Delivered Orders

## Troubleshooting

### "Command not found: npm"
Install Node.js from https://nodejs.org/

### "No module named 'pandas'"
This should be installed automatically by `npm install`. If you see this error, try removing the `node_modules` and `venv` folders and running `npm install` again.

### "Error: spawn python3 ENOENT"
Make sure Python 3 is installed and available in your system's PATH. You can check by running `python3 --version`.

### Report shows "undefined" for carrier stats
This is a known display issue in console output. The saved `time-breakdown-report.txt` file has correct data.

## Sharing Reports with Others

### Email a Report
1. Run: `npm run time-breakdown -- your-data.csv`
2. Attach `time-breakdown-report.txt` to your email
3. The report is formatted and readable in any text editor

### Share Raw Data (for further analysis)
1. The tool also generates `time-breakdown-data.json`
2. This can be imported into Excel, Google Sheets, or BI tools

### Create a Dashboard (Advanced)
- The JSON output can be consumed by tools like:
  - Power BI
  - Tableau
  - Google Data Studio
  - Custom web dashboards

## Tips for Best Results

1. **Run regularly** - Weekly analysis helps track trends
2. **Focus on dates** - Follow up on specific incidents, not averages
3. **Double trouble first** - Routes with BOTH issues are highest priority
4. **Compare carriers** - Use data to drive performance conversations
5. **Save reports** - Keep a history to show improvement over time

## Support

**Technical Issues:**
- Check the main README.md for detailed technical docs
- Review CLAUDE.md for project context

**Questions About Results:**
- The reports show individual routes (not averages) so you can follow up on specific days
- If a driver appears multiple times, that's a pattern worth investigating
- Extended dwell + extended load = warehouse AND driver issue

## Quick Reference

```bash
# Basic route analysis
npm start -- data.csv

# Detailed time breakdown (with dates/stores)
npm run time-breakdown -- data.csv

# View saved report
cat time-breakdown-report.txt

# If something breaks, re-install dependencies
npm install
```

---

**Questions?** Review the full README.md or check docs/USAGE.md for detailed explanations.
