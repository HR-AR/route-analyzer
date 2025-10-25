#!/bin/bash
#
# Quick script to fetch Nash + Walmart + OS=0 data from Tableau
#

set -e

echo "🐶 Fetching Nash/Walmart/OS=0 data from Tableau..."
echo ""

# Activate virtual environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
else
    echo "❌ Virtual environment not found. Run ./setup.sh first!"
    exit 1
fi

# Run the fetcher with specific filters
python3 scripts/tableau_fetcher.py \n    --carrier nash \n    --os 0 \n    --client Walmart \n    --output data/nash_walmart_os0.csv

echo ""
echo "✅ Done! Data saved to: data/nash_walmart_os0.csv"
echo ""
echo "You can now analyze it with:"
echo "  npm run store-metrics -- data/nash_walmart_os0.csv"