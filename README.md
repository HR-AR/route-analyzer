# Route Analysis Tool

Automated analysis tool for Dedicated Van Delivery route performance. Identifies extended dwell times, load issues, and route variances with specific dates and store numbers for actionable follow-up.

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/[YOUR-ORG]/route-analyzer.git
cd route-analyzer

# Install dependencies
npm install
```

The `npm install` command will automatically:
- Install Node.js dependencies
- Create a Python virtual environment in a `venv` folder
- Install required Python packages (e.g., pandas)
- Build the TypeScript code

### Usage

**Time Breakdown Analysis (Recommended)**
```bash
npm run time-breakdown -- /path/to/your/data.csv
```
Generates:
- `time-breakdown-report.txt` - Formatted report
- `time-breakdown-data.json` - Raw data

**Store-Specific Analysis**
```bash
npm run store-analysis -- <store-number> /path/to/data.csv
```
Example:
```bash
npm run store-analysis -- 2242 weekly-data.csv
```

**Web Interface (Easiest Method)**
```bash
# Start the web server
npm run ui
```
Then open your web browser to `http://localhost:3000`. You can upload your CSV file and select the analysis type directly from the page.

**Basic Route Analysis (Command Line)**
```bash
npm start -- /path/to/data.csv
```

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
TOP 10 WORST DWELL TIMES (Individual Routes):

  1. Frank Garcia (NTG)
     Date: 2025-10-01 | Store: 1118
     Dwell: 136.57 min (2.28 hrs)
     Load: 19.15 min | Orders: 89

  2. Alejandro Sanchez (NTG)
     Date: 2025-10-01 | Store: 973
     Dwell: 126.3 min (2.10 hrs)
     Load: 5.45 min | Orders: 69
```

Now you can follow up: *"On Oct 1st at Store 1118, investigate Frank Garcia's 2.3 hour dwell time"*

### Store Analysis
```
STORE #2242 - DETAILED ANALYSIS

OVERALL PERFORMANCE:
  Average Trip Time:     8.43 hours (vs 6.58 estimated)
  Average Variance:      +1.85 hours (28%)
  Average Dwell Time:    11.6 min
  Average Load Time:     13.5 min

IDENTIFIED ISSUES:
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
- **[docs/GLOSSARY.md](docs/GLOSSARY.md)** - Definitions of key terms and metrics
- **[docs/USAGE.md](docs/USAGE.md)** - Detailed examples
- **[docs/STORE-ANALYSIS-GUIDE.md](docs/STORE-ANALYSIS-GUIDE.md)** - Store-specific analysis guide

## Troubleshooting

### "Command not found: npm"
Install Node.js from https://nodejs.org/

### "No module named 'pandas'"
The `npm install` command should handle this automatically. If you see this error, try removing the `node_modules` and `venv` directories and running `npm install` again.

### "spawn python3 ENOENT"
Ensure Python 3 is installed and available in your system's PATH. You can check by running `python3 --version`.

## Architecture

Built using the **Child Process Invocation** pattern:
- **TypeScript/Node.js** - Input validation, process spawning, result parsing
- **Python/pandas** - Data analysis, statistical calculations
- **Zod** - Runtime type safety

See [examples/](examples/) for pattern references.

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
