# Web UI Quick Start Guide

The easiest way to use the Route Analysis Tool is through the web interface.

## Starting the UI

```bash
cd my-new-project
npm run ui
```

Then open your browser to: **http://localhost:3000**

## Using the Interface

### 1. Upload Your CSV File
Click "Choose CSV File" and select your data file (e.g., `data_table_1.csv`)

### 2. Select Analysis Type

**Store Metrics** - Best for getting an overview
- Shows all stores with DPH, batch density, returns, dwell times
- No store number needed
- **Start here** for your first analysis

**Driver Store Analysis** - Best for investigating a specific store
- Shows driver-by-driver performance at one store
- Requires store number (e.g., 1916)
- Use after identifying problem stores in Store Metrics

**Multi-Day Analysis** - Best for understanding long routes
- Identifies routes that span multiple days
- Calculates actual working time
- Requires store number
- Use when you see routes with 20+ hour durations

**Time Breakdown** - Best for operational efficiency
- Finds routes with extended dwell times (>30 min breaks)
- Finds routes with extended load times (>60 min)
- No store number needed
- Use to identify training opportunities

**Store Analysis** - Best for historical trends
- Day-by-day breakdown for one store
- Requires store number
- Use for chronological view of performance

**Returns Breakdown** - Best for understanding failed deliveries
- AI-powered root cause analysis
- Identifies patterns in returns
- No store number needed
- Use to reduce return rates

### 3. Enter Store Number (if needed)
For Driver Store Analysis, Multi-Day Analysis, and Store Analysis, enter a store number (e.g., 1916)

### 4. Run Analysis
Click "Run Analysis" and wait for results

### 5. View Results
Results appear in the browser. You can:
- Scroll through the report
- Copy text for sharing
- Run another analysis with different settings

## Tips

**Start with Store Metrics**
Get the big picture first, then drill down into specific stores.

**Keep the terminal open**
The terminal shows any errors or warnings.

**Test with sample data**
Use the provided `data_table_1.csv` to test before analyzing real data.

**Both interfaces work**
The CLI and web UI produce the same results. Use whichever you prefer.

## Workflow Example

1. **Run Store Metrics** to see all stores
   - Find store 1916 has low DPH (5.2 deliveries/hour)

2. **Run Driver Store Analysis** for store 1916
   - See that Driver A: 8.5 DPH, Driver B: 2.1 DPH
   - Driver B is the problem

3. **Run Time Breakdown** to see if dwell time is the issue
   - Driver B has 90+ minute breaks

4. **Take action**: Coach Driver B on time management

## Stopping the Server

Press `Ctrl+C` in the terminal where the server is running.

## Troubleshooting

**"Analysis failed"**
- Check that your CSV has the required columns
- Verify the store number exists in your data

**Server won't start**
```bash
# Kill any process on port 3000
lsof -ti:3000 | xargs kill -9

# Try again
npm run ui
```

**"No module named 'pandas'"**
```bash
# Re-run setup
./setup.sh
```

## Need Help?

- See [README.md](README.md) for detailed documentation
- See [TESTING-GUIDE.md](TESTING-GUIDE.md) for testing instructions
- All CLI commands in README also work from terminal
