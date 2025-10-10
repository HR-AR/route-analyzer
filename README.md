# Route Analysis Dashboard 📊

A comprehensive web-based tool for analyzing delivery route performance, failed orders/pickups, store metrics, and driver efficiency.

## 🌐 Two Ways to Use This Tool

### Option 1: Web Deployment (Recommended for Teams)
**No installation required!** Deploy to Render and share a link with your team.

👉 **[See RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** for step-by-step deployment instructions.

**Benefits:**
- ✅ Zero setup for team members
- ✅ Access from any browser
- ✅ Always up-to-date
- ✅ Free tier available

### Option 2: Local Installation (For Development)
Run on your own computer using the instructions below.

---

## 🚀 Quick Start (Local Installation)

### Starting the Application

1. **Open Terminal** (on Mac: press `Cmd + Space`, type "Terminal", press Enter)

2. **Navigate to the project**:
   ```bash
   cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis/my-new-project"
   ```

3. **Start the server**:
   ```bash
   npm run ui
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

5. **Upload a CSV file** and select an analysis type!

### Stopping the Server

Press `Ctrl + C` in the Terminal window where the server is running.

---

## 📋 Available Analyses

### 1. 📊 Store Metrics
Comprehensive breakdown of all stores showing:
- Drops per hour (DPH)
- Batch density
- Returns analysis
- Dwell time
- Loading time metrics

### 2. 👤 Driver Store Analysis
Deep dive into driver performance at a specific store:
- Individual driver statistics
- Performance comparisons
- Consistency metrics

**Requires**: Store number (e.g., 5930)

### 3. 📅 Multi-Day Analysis
Identifies routes spanning multiple days.

**Two modes**:
- **All Stores**: `npm run multiday-analysis -- all your-file.csv`
  - Shows all stores with multi-day trips
  - Ranked by percentage of multi-day routes
- **Single Store**: Enter store number in UI
  - Detailed analysis of that store's multi-day trips

### 4. ⏰ Time Breakdown
Identifies routes with extended dwell time and load time issues:
- Routes exceeding thresholds
- Time efficiency analysis
- Problem route identification

### 5. 🏪 Store Analysis
Day-by-day breakdown for a single store:
- Daily performance trends
- Driver assignments
- Issue identification

**Requires**: Store number (e.g., 973)

### 6. ↩️ Returns Breakdown
Analysis focused on returns patterns:
- Return rates by route
- Common causes
- Store and carrier breakdown

### 7. ⏳ Pending Orders
Identify routes with pending orders requiring next-day delivery:
- Top routes by pending count
- Pending order percentages
- Store and driver analysis

### 8. ❌ Failed Orders Analysis ⭐ **SMART!**
**Automatically detects** whether your data has:
- **Failed Orders** → Analyzes order failures during delivery
- **Failed Pickups** → Analyzes orders that couldn't be picked up

Provides comprehensive analysis:
- Breakdown by carrier
- Breakdown by store (top 15)
- Time patterns (hourly/daily)
- Performance impact
- Top 20 problem trips
- Correlation analysis

**Special Feature**: Uses RAW data (no cleaning) to preserve exact counts!

---

## 🔧 Features

### ✅ Automatic Data Cleaning
Every CSV uploaded is automatically cleaned (except Failed Orders Analysis):
- Validates data consistency
- Standardizes date formats
- Fixes anomalies
- Reports data quality issues

### ✅ Smart Analysis
- Detects Failed Orders vs Failed Pickups automatically
- Handles edge cases (zero failures, empty data)
- No crashes on unusual data

### ✅ Comprehensive Reports
- Text reports (.txt) - Easy to read
- JSON data (.json) - For further processing
- Download buttons in UI

---

## 📁 File Structure

```
Quick Analysis/
├── my-new-project/               # Main application
│   ├── src/                      # TypeScript source code
│   │   ├── ui-server.ts         # Web UI server
│   │   ├── failed-orders-analysis.ts
│   │   ├── store-metrics.ts
│   │   └── ... (other analyses)
│   ├── scripts/analysis/         # Python analysis scripts
│   ├── uploads/                  # Temporary file uploads
│   ├── venv/                     # Python virtual environment
│   ├── package.json              # Node.js dependencies
│   └── tsconfig.json             # TypeScript configuration
│
├── data_cleaner.py               # Data cleaning module
├── failed_orders_analyzer.py     # Failed orders analyzer
├── clean_data_cli.py             # CLI wrapper for cleaning
│
└── Documentation/
    ├── README.md                 # This file
    ├── QUICK_START.md            # Quick reference
    ├── FINAL_SOLUTION.md         # Latest updates
    └── ALL_FIXES_COMPLETE.md     # Complete fix history
```

---

## 💻 Command Line Usage

### Running Specific Analyses

```bash
# Navigate to project directory
cd my-new-project

# Store Metrics (all stores)
npm run store-metrics -- ../data_table_1.csv

# Driver Store Analysis (specific store)
npm run driver-store-analysis -- 973 ../data_table_1.csv

# Multi-Day Analysis (all stores)
npm run multiday-analysis -- all ../data_table_1.csv

# Multi-Day Analysis (specific store)
npm run multiday-analysis -- 5930 ../data_table_1.csv

# Time Breakdown
npm run time-breakdown -- ../data_table_1.csv

# Store Analysis (specific store)
npm run store-analysis -- 973 ../data_table_1.csv

# Returns Breakdown (top 25)
npm run returns-breakdown -- 25 ../data_table_1.csv

# Pending Orders (top 50)
npm run pending-orders -- 50 ../data_table_1.csv

# Failed Orders Analysis
npm run failed-orders-analysis -- ../data_table_1.csv
```

### Manual Data Cleaning

```bash
# Clean a CSV file
cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis"
source my-new-project/venv/bin/activate
python3 clean_data_cli.py input.csv output_cleaned.csv
```

---

## 🐛 Troubleshooting

### Server Won't Start

**Error**: `npm: command not found`
- **Solution**: Install Node.js from https://nodejs.org/

**Error**: `Module not found: pandas`
- **Solution**:
  ```bash
  cd my-new-project
  source venv/bin/activate
  pip install pandas numpy
  ```

### Browser Can't Connect

**Error**: `localhost refused to connect`
- **Solution**: Make sure the server is running (you should see the ASCII art banner in Terminal)
- Check the Terminal for any error messages

### Analysis Fails

**Error**: Data cleaning or analysis errors
- **Check**: Make sure your CSV has the required columns
- **Check**: Terminal output for detailed error messages
- **Try**: Upload a different CSV to test

### Port Already in Use

**Error**: `Port 3000 is already in use`
- **Solution**:
  ```bash
  # Find and kill the process using port 3000
  lsof -ti:3000 | xargs kill -9
  # Then restart the server
  npm run ui
  ```

---

## 📊 Data Format

### Required CSV Columns

Your CSV should include these columns (names must match exactly):

**Core Fields**:
- `Carrier` - Delivery carrier name
- `Date` - Trip date
- `Store Id` - Store identifier
- `Walmart Trip Id` - Unique trip identifier
- `Courier Name` - Driver name

**Order Metrics**:
- `Total Orders` - Total orders on trip
- `Delivered Orders` - Successfully delivered
- `Returned Orders` - Returned to store
- `Pending Orders` - Pending delivery
- `Failed Orders` OR `Failed Pickups` - Failed orders/pickups

**Time Metrics**:
- `Driver Store Time` - Time at store
- `Driver Load Time` - Loading time
- `Trip Actual Time` - Actual trip duration
- `Pickup Arrived` - Arrival time at store

### Sample Data Format

```csv
Carrier,Date,Store Id,Total Orders,Failed Pickups,...
NTG,2025-10-04,5930,85,2,...
DeliverOL,2025-10-04,2141,92,5,...
```

---

## 🎯 Understanding the Results

### Failed Orders/Pickups Analysis

**When you see**:
```
📦 Analyzing FAILED PICKUPS (orders that failed to be picked up)
Total failed pickups: 65
```

This means the system detected your data has "Failed Pickups" and is analyzing pickup failures.

**Key Metrics**:
- **Total Failed**: Sum of all failures
- **Failed Rate %**: Percentage of total orders that failed
- **Trips Affected**: How many trips had at least one failure
- **% Trips With Failures**: Percentage of trips with failures

### Store Metrics

**Key Performance Indicators**:
- **DPH (Drops Per Hour)**: Higher is better (aim for 8-12+)
- **Batch Density**: Orders per batch
- **Dwell Time**: Time spent at store (lower is better)
- **Load Time**: Time to load vehicle (lower is better)

### Multi-Day Analysis

**What it means**:
- Routes that span from one day into the next
- Often indicates inefficiency or capacity issues
- Shows which stores have this problem most frequently

---

## 🔐 Security Notes

- Uploaded files are automatically deleted after analysis
- No data is stored permanently
- Server only accessible from your computer (localhost)
- All processing happens locally

---

## 📞 Support

### For Technical Issues:
1. Check the Terminal output for error messages
2. Review the documentation files
3. Try restarting the server

### For Data Questions:
1. Verify your CSV format matches the required columns
2. Check the data cleaning report in Terminal
3. Try the manual data cleaning command to see detailed issues

---

## 🎓 Learning More

### Understanding the Technology

**Frontend (What you see)**:
- Web browser interface at http://localhost:3000
- Built with HTML, CSS, and JavaScript

**Backend (What processes the data)**:
- Node.js/TypeScript server (handles file uploads and routing)
- Python scripts (perform the actual analysis)

### File Types Explained

- **.csv** - Your data files (spreadsheet format)
- **.ts** - TypeScript code files (JavaScript with types)
- **.py** - Python code files (data analysis scripts)
- **.json** - Data output files (structured data format)
- **.txt** - Report files (human-readable)

---

## 📈 Best Practices

### For Best Results:

1. **Use cleaned data**: The system auto-cleans, but you can review the cleaning report
2. **Check data quality**: Watch Terminal output for validation warnings
3. **Start broad, then narrow**:
   - First: Store Metrics (see all stores)
   - Then: Store Analysis (dive into specific store)
   - Finally: Driver Store Analysis (see individual drivers)
4. **Compare time periods**: Upload different date ranges to see trends

### Tips:

- 📅 Analyze by week/month to spot patterns
- 🔍 Use Multi-Day Analysis (all) to find problem stores
- ⏰ Run Time Breakdown to identify inefficient routes
- ❌ Regular Failed Pickups analysis catches issues early

---

## 🚀 Advanced Usage

### Running Multiple Analyses

You can run analyses in parallel via command line:

```bash
cd my-new-project

# Run all these in separate Terminal windows
npm run store-metrics -- ../data.csv &
npm run time-breakdown -- ../data.csv &
npm run failed-orders-analysis -- ../data.csv &
```

### Batch Processing

Create a script to analyze multiple files:

```bash
#!/bin/bash
for file in ../data/*.csv; do
  echo "Analyzing $file"
  npm run store-metrics -- "$file"
done
```

---

## 📝 Version History

### Latest Updates (2025-10-10)

✅ **Smart Failed Orders/Pickups Detection**
- Automatically detects Failed Orders vs Failed Pickups
- No crashes on zero failures
- Comprehensive analysis for both types

✅ **Fixed All Analysis Modules**
- Store Analysis: Handles None values gracefully
- Multi-Day Analysis: Works for all stores OR specific store
- No more NaN errors in JSON output

✅ **Automatic Data Cleaning**
- All analyses use cleaned data (except Failed Orders)
- Detailed cleaning reports
- Data validation and error detection

✅ **Enhanced UI**
- All 8 analysis types working
- Clear loading indicators
- Download options for all reports

---

## 🏆 Credits

Built for Walmart Delivery Operations Analysis

**Technologies**:
- TypeScript/Node.js (Backend)
- Python/Pandas (Data Analysis)
- Express.js (Web Server)
- Vanilla JavaScript (Frontend)

---

## 📄 License

Internal use only - Walmart Delivery Operations

---

**Need help? Check the documentation files or review the Terminal output for detailed error messages!** 🚀
