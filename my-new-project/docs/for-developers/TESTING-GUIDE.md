# Testing Guide

This document explains how to test all analysis types in the Route Analysis Tool.

## Automated Testing

Run the comprehensive test suite:

```bash
./test-all-analyses.sh
```

This will test all 6 analysis types:
1. Store Metrics
2. Time Breakdown
3. Returns Breakdown
4. Driver Store Analysis
5. Store Analysis
6. Multi-Day Analysis

All tests should pass and generate report files.

## Manual Testing

### Web UI Testing

1. Start the UI server:
```bash
npm run ui
```

2. Open http://localhost:3000 in your browser

3. Test each analysis type:

**Store Metrics** (no store number needed)
- Upload: `data_table_1.csv`
- Select: Store Metrics
- Click: Run Analysis
- Expected: Comprehensive report with all stores

**Time Breakdown** (no store number needed)
- Upload: `data_table_1.csv`
- Select: Time Breakdown
- Click: Run Analysis
- Expected: Routes with extended dwell/load times

**Returns Breakdown** (no store number needed)
- Upload: `data_table_1.csv`
- Select: Returns Breakdown
- Click: Run Analysis
- Expected: Top routes with returns and root causes

**Driver Store Analysis** (requires store number)
- Upload: `data_table_1.csv`
- Select: Driver Store Analysis
- Enter Store: `1916`
- Click: Run Analysis
- Expected: Driver-by-driver breakdown for store 1916

**Store Analysis** (requires store number)
- Upload: `data_table_1.csv`
- Select: Store Analysis
- Enter Store: `1916`
- Click: Run Analysis
- Expected: Day-by-day breakdown for store 1916

**Multi-Day Analysis** (requires store number)
- Upload: `data_table_1.csv`
- Select: Multi-Day Analysis
- Enter Store: `1916`
- Click: Run Analysis
- Expected: Multi-day route analysis for store 1916

### CLI Testing

Test individual commands:

```bash
# Store Metrics
npm run store-metrics -- ../data_table_1.csv

# Time Breakdown
npm run time-breakdown -- ../data_table_1.csv

# Returns Breakdown
npm run returns-breakdown -- ../data_table_1.csv

# Driver Store Analysis (requires store number)
npm run driver-store-analysis -- 1916 ../data_table_1.csv

# Store Analysis (requires store number)
npm run store-analysis -- 1916 ../data_table_1.csv

# Multi-Day Analysis (requires store number)
npm run multiday-analysis -- 1916 ../data_table_1.csv
```

## Expected Outputs

Each analysis generates two files:
- `[analysis-name]-report.txt` - Human-readable report
- `[analysis-name]-data.json` - Machine-readable data

Example files:
- `store-metrics-report.txt`
- `store-metrics-data.json`
- `driver-store-1916-report.txt`
- `driver-store-1916-data.json`

## Troubleshooting

### Python Module Not Found

If you see `ModuleNotFoundError: No module named 'pandas'`:

1. Ensure virtual environment exists:
```bash
ls -la venv/
```

2. Re-run setup if needed:
```bash
./setup.sh
```

3. Verify pandas is installed:
```bash
source venv/bin/activate
pip list | grep pandas
deactivate
```

### Web UI Not Starting

If `npm run ui` fails:

1. Check if port 3000 is in use:
```bash
lsof -ti:3000
```

2. Kill the process if needed:
```bash
lsof -ti:3000 | xargs kill -9
```

3. Restart the UI:
```bash
npm run ui
```

### Analysis Fails in Web UI

1. Check server logs in terminal where you ran `npm run ui`
2. Verify the CSV file has the required columns
3. For store-specific analyses, verify the store number exists in the data

## Verification Checklist

- [ ] All 6 CLI commands work
- [ ] All 6 web UI analyses work
- [ ] Reports are generated in both modes
- [ ] Store number validation works in UI
- [ ] File upload works in UI
- [ ] Error messages are helpful
- [ ] Python venv is used automatically
