#!/bin/bash
# Test script for data cleaning and failed orders analysis integration

set -e

echo "=================================="
echo "Integration Test"
echo "=================================="
echo ""

# Test 1: Data Cleaning
echo "Test 1: Data Cleaning CLI"
echo "--------------------------"
cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis"
source my-new-project/venv/bin/activate
python3 clean_data_cli.py data_table_1.csv test_cleaned.csv 2>&1 | tail -5
echo ""

# Verify cleaned file exists
if [ -f "test_cleaned.csv" ]; then
    echo "✓ Cleaned file created successfully"
    echo "  File size: $(wc -l < test_cleaned.csv) lines"
    rm test_cleaned.csv
else
    echo "✗ Cleaned file not created"
    exit 1
fi
echo ""

# Test 2: Failed Orders Analysis
echo "Test 2: Failed Orders Analysis"
echo "-------------------------------"
cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis"
source my-new-project/venv/bin/activate
python3 failed_orders_analyzer.py 2>&1 | head -30
echo ""

# Test 3: TypeScript Wrapper Check
echo "Test 3: TypeScript Wrapper"
echo "--------------------------"
cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis/my-new-project"
if [ -f "src/failed-orders-analysis.ts" ]; then
    echo "✓ TypeScript wrapper exists"
    echo "  Lines: $(wc -l < src/failed-orders-analysis.ts)"
else
    echo "✗ TypeScript wrapper not found"
    exit 1
fi
echo ""

# Test 4: Package.json Check
echo "Test 4: Package.json Script"
echo "----------------------------"
if grep -q "failed-orders-analysis" package.json; then
    echo "✓ Script registered in package.json"
    grep "failed-orders-analysis" package.json
else
    echo "✗ Script not found in package.json"
    exit 1
fi
echo ""

echo "=================================="
echo "All Tests Passed! ✓"
echo "=================================="
echo ""
echo "To start the UI server:"
echo "  cd my-new-project"
echo "  npm run ui"
echo ""
echo "Then open: http://localhost:3000"
