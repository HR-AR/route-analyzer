# Route Analysis Tool

Automated analysis tool for Dedicated Van Delivery route performance. Identifies extended dwell times, load issues, and route variances with specific dates and store numbers for actionable follow-up.

## Quick Start

### Installation

```bash
# Navigate to project directory
cd my-new-project

# One-command setup
./setup.sh
```

The setup script will:
- Install Node.js dependencies
- Create Python virtual environment
- Install Python packages (pandas)
- Build TypeScript code

### Usage Options

**Option 1: Web Interface (Easiest)**

```bash
npm run ui
```

Then open http://localhost:3000 in your browser. Upload your CSV file, select an analysis type, and click Run Analysis. The results will display in the browser.

**Option 2: Command Line**

All commands follow the pattern: `npm run <command> -- <arguments>`

---

## 📊 Available Analysis Commands

### 1. **Store-Level Metrics** (RECOMMENDED - Start Here)
Comprehensive breakdown of all stores with DPH, batch density, returns, dwell, loading time, and variance.

```bash
npm run store-metrics -- /path/to/your/data.csv
```

**What you get:**
- Overall performance summary for ALL stores
- Store-by-store breakdown with:
  - DPH (Deliveries Per Hour)
  - Batch Density (orders per route)
  - Planned vs Actual time with variance
  - Returns rate
  - Dwell and load times
- Top 10 best/worst performing routes
- Key insights and action items

**Output files:**
- `store-metrics-report.txt` - Formatted report
- `store-metrics-data.json` - Raw data

**Example:**
```bash
npm run store-metrics -- /Users/h0r03cw/Downloads/data_table_1.csv
```

**When to use:** Use this as your starting point to get a full overview and identify problem stores.

---

### 2. **Driver-Level Analysis for Specific Store**
Deep dive into driver performance at a single store.

```bash
npm run driver-store-analysis -- <store-number> /path/to/data.csv
```

**What you get:**
- Store-level summary metrics
- Driver-by-driver breakdown showing:
  - Individual DPH performance
  - Dwell and load time patterns
  - Variance (planned vs actual)
  - Delivery rate
  - Dates worked
- Problem routes identified (high dwell, high load, high variance)
- All routes in chronological order
- Driver performance gap analysis

**Output files:**
- `driver-store-<store-id>-report.txt`
- `driver-store-<store-id>-data.json`

**Example:**
```bash
npm run driver-store-analysis -- 5930 /Users/h0r03cw/Downloads/data_table_1.csv
```

**When to use:** After identifying a problem store in the overall metrics, use this to see which drivers are struggling and why.

---

### 3. **Multi-Day Route Analysis**
Identifies routes that span multiple days and calculates actual working time.

```bash
npm run multiday-analysis -- <store-number> /path/to/data.csv
```

**What you get:**
- Count of multi-day vs single-day routes
- Elapsed time (wall clock) vs working time (excluding overnight)
- Estimated overnight break time
- Route-by-route breakdown showing:
  - Pickup and dropoff timestamps
  - Actual delivery duration
  - Multi-day flag
- Insights on whether routes are designed to be multi-day

**Output files:**
- `multiday-analysis-<store-id>-report.txt`
- `multiday-analysis-<store-id>-data.json`

**Example:**
```bash
npm run multiday-analysis -- 5930 /Users/h0r03cw/Downloads/data_table_1.csv
```

**When to use:** When you see huge variance numbers or routes taking 20+ hours. This reveals if routes are intentionally multi-day or if there's a planning problem.

---

### 4. **Time Breakdown Analysis** (All Stores)
Identifies routes with extended dwell time and load time issues.

```bash
npm run time-breakdown -- /path/to/your/data.csv
```

**What you get:**
- Routes with extended dwell time (>30 min)
- Routes with extended load time (>60 min)
- Routes with BOTH issues
- Top 10 worst dwell times
- Top 10 worst load times
- Total wasted hours calculation

**Output files:**
- `time-breakdown-report.txt`
- `time-breakdown-data.json`

**Example:**
```bash
npm run time-breakdown -- /Users/h0r03cw/Downloads/data_table_1.csv
```

**When to use:** To identify operational inefficiencies in loading and breaks across all stores.

---

### 5. **Store-Specific Analysis** (Legacy)
Day-by-day breakdown for a single store.

```bash
npm run store-analysis -- <store-number> /path/to/data.csv
```

**Example:**
```bash
npm run store-analysis -- 2242 /Users/h0r03cw/Downloads/data_table_1.csv
```

**When to use:** For a chronological view of a store's performance over time.

---

### 6. **Returns Breakdown**
Analysis focused on returns patterns.

```bash
npm run returns-breakdown -- /path/to/your/data.csv
```

**When to use:** To identify patterns in returned orders.

---

## 🔄 Typical Workflow

**Step 1: Get the Big Picture**
```bash
npm run store-metrics -- /Users/h0r03cw/Downloads/data_table_1.csv
```
Review the report to identify problem stores (low DPH, high variance, high returns).

**Step 2: Investigate Problem Store**
```bash
npm run driver-store-analysis -- 5930 /Users/h0r03cw/Downloads/data_table_1.csv
```
See which drivers are struggling and what specific issues exist.

**Step 3: Check for Multi-Day Routes** (if variance is high)
```bash
npm run multiday-analysis -- 5930 /Users/h0r03cw/Downloads/data_table_1.csv
```
Understand if high variance is due to multi-day route design.

**Step 4: Deep Dive on Operational Issues**
```bash
npm run time-breakdown -- /Users/h0r03cw/Downloads/data_table_1.csv
```
Identify specific dwell/load time problems across all stores.

---

## 📁 Data Requirements

Your CSV must include these columns:
- `Carrier`, `Date`, `Store Id`, `Courier Name`
- `Pickup Complete`, `Last Dropoff Complete`
- `Trip Actual Time`, `Estimated Duration`, `Driver Total Time`
- `Driver Dwell Time`, `Driver Load Time`, `Driver Sort Time`
- `Total Orders`, `Delivered Orders`, `Returned Orders`, `Pending Orders`

---

## 📝 Understanding the Reports

### Key Metrics Explained:

**DPH (Deliveries Per Hour)**
- Delivered orders ÷ total time
- Higher is better
- Typical range: 6-12 del/hr

**Batch Density**
- Total orders ÷ number of routes
- Shows average route size
- Higher = more orders per route

**Variance**
- Actual time - Planned time
- Positive = over plan (taking longer than expected)
- Negative = under plan (finishing early)

**Dwell Time**
- Break/idle time during delivery
- >30 min is considered high

**Load Time**
- Time spent loading at the store
- >60 min is considered high

---

## 🎯 What to Look For

**Good Performance:**
- DPH: 8-10+ deliveries/hour
- Variance: Within ±2 hours of plan
- Dwell: <20 min average
- Load: <30 min average
- Returns: <3%

**Problem Indicators:**
- DPH: <6 deliveries/hour
- Variance: >5 hours over plan
- Dwell: >30 min average
- Load: >45 min average
- Returns: >5%

---

## 🔍 Common Issues Identified

**Issue: Store shows 20+ hour routes with huge variance**
→ Run `multiday-analysis` - likely designed as multi-day routes

**Issue: Low DPH but normal dwell/load times**
→ Route planning problem - routes may be too complex or poorly sequenced

**Issue: High dwell time across multiple drivers**
→ Systemic break pattern issue - review policy

**Issue: High load time at specific store**
→ Staging/warehouse issue at that location

**Issue: One driver much worse than others at same store**
→ Training/coaching opportunity

## What It Does

### Time Breakdown Analysis
- Identifies routes with extended dwell time (>30 min breaks)
- Identifies routes with extended load time (>60 min)
- Flags routes with BOTH issues ("double trouble")
- Shows top 10 worst performers with **specific dates and store numbers**
- Calculates total wasted hours and potential route capacity recovery

### Store-Specific Analysis
- Deep dive into a single store's performance
- Day-by-day breakdown with all routes
- Best/worst performing days identified
- Carrier comparison at that location
- Issue flagging for follow-up

### Basic Route Analysis
- Overall statistics (all stores)
- 10AM vs 12PM departure performance
- Carrier performance comparison
- JSON output for further processing

## Sample Output

### Time Breakdown
```
🔴 TOP 10 WORST DWELL TIMES (Individual Routes):

  1. Frank Garcia (NTG)
     📅 Date: 2025-10-01 | 🏪 Store: 1118
     🕐 Dwell: 136.57 min (2.28 hrs)
     ⏲️  Load: 19.15 min | 📦 Orders: 89

  2. Alejandro Sanchez (NTG)
     📅 Date: 2025-10-01 | 🏪 Store: 973
     🕐 Dwell: 126.3 min (2.10 hrs)
     ⏲️  Load: 5.45 min | 📦 Orders: 69
```

Now you can follow up: *"On Oct 1st at Store 1118, investigate Frank Garcia's 2.3 hour dwell time"*

### Store Analysis
```
📍 STORE #2242 - DETAILED ANALYSIS

📊 OVERALL PERFORMANCE:
  Average Trip Time:     8.43 hours (vs 6.58 estimated)
  Average Variance:      +1.85 hours (28%)
  Average Dwell Time:    11.6 min ✅
  Average Load Time:     13.5 min ✅

🚨 IDENTIFIED ISSUES:
  Oct 3 - High variance due to volume (73 orders vs typical 55)
```

## Data Format

Your CSV must include these columns:
- `Carrier`, `Date`, `Store Id`, `Courier Name`
- `Trip Planned Start`, `Trip Actual Time`, `Estimated Duration`
- `Driver Dwell Time`, `Driver Load Time`, `Driver Sort Time`
- `Total Orders`, `Delivered Orders`, `Failed Orders`

## Requirements

- **Node.js** 20.x or higher
- **Python** 3.11 or higher
- **npm** (comes with Node.js)

## Documentation

- **[TEAM-README.md](TEAM-README.md)** - Complete user guide
- **[QUICK-START.md](QUICK-START.md)** - One-page reference
- **[docs/USAGE.md](docs/USAGE.md)** - Detailed examples
- **[docs/STORE-ANALYSIS-GUIDE.md](docs/STORE-ANALYSIS-GUIDE.md)** - Store-specific analysis guide

## Troubleshooting

### "Command not found: npm"
Install Node.js from https://nodejs.org/

### "No module named 'pandas'"
Run setup again: `./setup.sh`

### "spawn python3 ENOENT"
Ensure Python 3 is installed: `python3 --version`

## Architecture

Built using the **Child Process Invocation** pattern:
- **TypeScript/Node.js** - Input validation, process spawning, result parsing
- **Python/pandas** - Data analysis, statistical calculations
- **Zod** - Runtime type safety

See [examples/](examples/) for pattern references.

## Testing

Test all analyses at once:

```bash
./test-all-analyses.sh
```

See [TESTING-GUIDE.md](TESTING-GUIDE.md) for detailed testing instructions.

## Contributing

This tool uses a validation-driven workflow:

```bash
# Run validation before committing
npm run validate
```

All changes must pass:
- Lint
- Tests
- TypeScript build

## License

MIT

---

**Questions?** See the documentation or open an issue.
