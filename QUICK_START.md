# Quick Start Guide

## Start the Analysis UI

```bash
cd my-new-project
npm run ui
```

Open browser to: **http://localhost:3000**

## What's New

### 🧹 Automatic Data Cleaning
Every CSV file uploaded is **automatically cleaned** before analysis:
- Failed orders properly tracked
- Data validated for consistency
- Dates standardized
- Anomalies fixed

You'll see cleaning progress in the server console.

### ❌ Failed Orders Analysis (NEW!)
New analysis option available in the UI:

**What it shows**:
- Failed orders by carrier
- Failed orders by store (top 15)
- Time patterns (hourly/daily breakdown)
- Impact on performance metrics
- Top 20 problem trips
- Correlation analysis

## Available Analyses

1. 📊 **Store Metrics** - Comprehensive store breakdown
2. 👤 **Driver Store Analysis** - Driver performance at specific store
3. 📅 **Multi-Day Analysis** - Routes spanning multiple days
4. ⏰ **Time Breakdown** - Extended dwell/load time issues
5. 🏪 **Store Analysis** - Day-by-day store breakdown
6. ↩️ **Returns Breakdown** - Returns patterns analysis
7. ⏳ **Pending Orders** - Next-day delivery requirements
8. ❌ **Failed Orders Analysis** ← **NEW!**

## Example Workflow

1. **Upload CSV** → Automatic cleaning happens
2. **Select "Failed Orders Analysis"**
3. **Click "Run Analysis"**
4. **Review comprehensive report**
5. **Download as .txt or .json**

## Command Line Usage

### Clean Data Manually
```bash
# From project root
python3 clean_data_cli.py data_table_1.csv cleaned_output.csv
```

### Run Failed Orders Analysis
```bash
cd my-new-project
npm run failed-orders-analysis -- ../data_table_1.csv
```

### Run Other Analyses
```bash
npm run store-metrics -- ../data_table_1.csv
npm run time-breakdown -- ../data_table_1.csv
npm run pending-orders -- 25 ../data_table_1.csv
# etc.
```

## Test the Integration

```bash
# Run automated tests
bash test_integration.sh
```

This verifies:
- ✓ Data cleaning works
- ✓ Failed orders analysis runs
- ✓ All components integrated properly

## Data Quality

The cleaner now reports:
- Total failed orders found
- Trips with failed orders
- Data validation results
- Any inconsistencies

Example output:
```
Failed Orders Summary:
  Trips with failed orders: 7
  Total failed orders: 7
  Max failed orders in single trip: 2
```

## Troubleshooting

**Issue**: "Module not found: pandas"
**Solution**: Make sure you're using the venv Python:
```bash
cd my-new-project
source venv/bin/activate
```

**Issue**: Analysis fails
**Solution**: Check the data cleaning report in console - may have data quality issues

**Issue**: Failed orders count seems wrong
**Solution**:
1. Verify you're looking at "Failed Orders" column (not "Failed Pickups")
2. Check if data is from the expected time period
3. Upload a fresh dataset if needed

## Need Help?

- Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for detailed technical info
- Check the data cleaning report in console logs
- Run `bash test_integration.sh` to verify setup
