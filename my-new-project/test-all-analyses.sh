#!/bin/bash
# Test script to verify all analysis types work correctly

set -e

echo "================================"
echo "Testing All Analysis Types"
echo "================================"
echo ""

CSV_FILE="../data_table_1.csv"
STORE_ID="1916"

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
  echo "Error: CSV file not found at $CSV_FILE"
  exit 1
fi

echo "Using CSV: $CSV_FILE"
echo "Using Store ID: $STORE_ID"
echo ""

# Test 1: Store Metrics
echo "1. Testing store-metrics..."
npm run store-metrics -- "$CSV_FILE" > /dev/null 2>&1
if [ -f "store-metrics-report.txt" ]; then
  echo "   ✓ store-metrics PASSED (report generated)"
else
  echo "   ✗ store-metrics FAILED (no report file)"
  exit 1
fi

# Test 2: Time Breakdown
echo "2. Testing time-breakdown..."
npm run time-breakdown -- "$CSV_FILE" > /dev/null 2>&1
if [ -f "time-breakdown-report.txt" ]; then
  echo "   ✓ time-breakdown PASSED (report generated)"
else
  echo "   ✗ time-breakdown FAILED (no report file)"
  exit 1
fi

# Test 3: Returns Breakdown
echo "3. Testing returns-breakdown..."
npm run returns-breakdown -- "$CSV_FILE" > /dev/null 2>&1
if [ -f "returns-breakdown-report.txt" ]; then
  echo "   ✓ returns-breakdown PASSED (report generated)"
else
  echo "   ✗ returns-breakdown FAILED (no report file)"
  exit 1
fi

# Test 4: Driver Store Analysis
echo "4. Testing driver-store-analysis..."
npm run driver-store-analysis -- "$STORE_ID" "$CSV_FILE" > /dev/null 2>&1
if [ -f "driver-store-${STORE_ID}-report.txt" ]; then
  echo "   ✓ driver-store-analysis PASSED (report generated)"
else
  echo "   ✗ driver-store-analysis FAILED (no report file)"
  exit 1
fi

# Test 5: Store Analysis
echo "5. Testing store-analysis..."
npm run store-analysis -- "$STORE_ID" "$CSV_FILE" > /dev/null 2>&1
if [ -f "store-${STORE_ID}-analysis-report.txt" ]; then
  echo "   ✓ store-analysis PASSED (report generated)"
else
  echo "   ✗ store-analysis FAILED (no report file)"
  exit 1
fi

# Test 6: Multi-day Analysis
echo "6. Testing multiday-analysis..."
npm run multiday-analysis -- "$STORE_ID" "$CSV_FILE" > /dev/null 2>&1
if [ -f "multiday-analysis-${STORE_ID}-report.txt" ]; then
  echo "   ✓ multiday-analysis PASSED (report generated)"
else
  echo "   ✗ multiday-analysis FAILED (no report file)"
  exit 1
fi

echo ""
echo "================================"
echo "All Tests Passed! ✓"
echo "================================"
echo ""
echo "Generated Reports:"
ls -1 *-report.txt 2>/dev/null | sed 's/^/  - /'
echo ""
