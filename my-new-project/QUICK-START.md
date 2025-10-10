# Quick Start Card

## Setup (One Time Only)

```bash
./setup.sh
```

## Daily Use

```bash
# Get detailed breakdown with dates and store numbers
npm run time-breakdown -- your-data.csv
```

**Output:**
- Console display
- `time-breakdown-report.txt` (share via email)
- `time-breakdown-data.json` (for Excel/BI tools)

## What You Get

- ✅ Specific dates and store numbers for each issue
- ✅ Extended dwell times (>30 min breaks)
- ✅ Extended load times (>60 min)
- ✅ Routes with BOTH problems highlighted
- ✅ Actionable recommendations

## Share with Team

```bash
./create-distribution.sh
# Creates: route-analyzer-dist.zip
# Send to team members
```

**Team setup:**
```bash
# Extract the zip file
cd route-analyzer-distribution
./setup.sh
./analyze.sh data.csv
```

## Example Output

```
🔴 TOP 10 WORST DWELL TIMES:

  1. Frank Garcia (NTG)
     📅 Date: 2025-10-01 | 🏪 Store: 1118
     🕐 Dwell: 136.57 min (2.28 hrs)
     ⏲️  Load: 19.15 min | 📦 Orders: 89
```

Follow up: "On Oct 1st at Store 1118, investigate Frank Garcia's 2.3 hour dwell time"

## Common Commands

```bash
# Time breakdown (recommended)
npm run time-breakdown -- data.csv

# Basic route analysis
npm start -- data.csv

# View saved report
cat time-breakdown-report.txt

# Create team package
./create-distribution.sh
```

## Troubleshooting

```bash
# If something breaks
./setup.sh

# Check Python
python3 --version

# Check Node
node --version
```

## Support Files

- **TEAM-README.md** - Full team guide
- **SUMMARY.md** - Complete overview
- **docs/USAGE.md** - Detailed examples
- **README.md** - Technical docs
