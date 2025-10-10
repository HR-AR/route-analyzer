#!/bin/bash
# Test script to verify all fixes are working

set -e

echo "=========================================="
echo "Testing All Fixes"
echo "=========================================="
echo ""

cd "/Users/h0r03cw/Desktop/Coding/Quick Analysis/my-new-project"
source venv/bin/activate

# Test 1: Store Analysis (was failing with NoneType error)
echo "Test 1: Store Analysis (Store 973)"
echo "-----------------------------------"
npm run store-analysis -- 973 ../data_table_1.csv > /tmp/test_store.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ PASSED: Store Analysis works without NoneType errors"
    if [ -f "store-973-analysis.txt" ]; then
        echo "   Report file created: $(wc -l < store-973-analysis.txt) lines"
    fi
else
    echo "❌ FAILED: Store Analysis still has errors"
    tail -20 /tmp/test_store.log
fi
echo ""

# Test 2: Failed Orders Analysis (was not producing output)
echo "Test 2: Failed Orders Analysis"
echo "-------------------------------"
npm run failed-orders-analysis -- ../data_table_1.csv > /tmp/test_failed.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ PASSED: Failed Orders Analysis completed"
    if [ -f "failed-orders-analysis-report.txt" ]; then
        echo "   Report file created: $(wc -l < failed-orders-analysis-report.txt) lines"
        echo "   Sample output:"
        head -15 failed-orders-analysis-report.txt | grep -E "Total|Failed"
    fi
else
    echo "❌ FAILED: Failed Orders Analysis has errors"
    tail -20 /tmp/test_failed.log
fi
echo ""

# Test 3: Multi-Day Analysis - All Stores (was NaN error + store-specific only)
echo "Test 3: Multi-Day Analysis (All Stores)"
echo "----------------------------------------"
npm run multiday-analysis -- all ../data_table_1.csv > /tmp/test_multiday_all.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ PASSED: Multi-Day All Stores Analysis completed"
    if [ -f "multiday-analysis-all-report.txt" ]; then
        stores_count=$(grep -c "Store" multiday-analysis-all-report.txt || echo "0")
        echo "   Report file created with $stores_count store entries"
    fi
    # Check for NaN in output
    if grep -q "NaN" /tmp/test_multiday_all.log; then
        echo "⚠️  WARNING: Still contains NaN in output"
    else
        echo "   No NaN errors found ✓"
    fi
else
    echo "❌ FAILED: Multi-Day All Stores Analysis has errors"
    tail -20 /tmp/test_multiday_all.log
fi
echo ""

# Test 4: Multi-Day Analysis - Single Store
echo "Test 4: Multi-Day Analysis (Store 5930)"
echo "----------------------------------------"
npm run multiday-analysis -- 5930 ../data_table_1.csv > /tmp/test_multiday_single.log 2>&1
if [ $? -eq 0 ]; then
    echo "✅ PASSED: Multi-Day Single Store Analysis completed"
    if [ -f "multiday-analysis-5930-report.txt" ]; then
        echo "   Report file created: $(wc -l < multiday-analysis-5930-report.txt) lines"
    fi
    # Check for NaN in output
    if grep -q "NaN" /tmp/test_multiday_single.log; then
        echo "⚠️  WARNING: Still contains NaN in output"
    else
        echo "   No NaN errors found ✓"
    fi
else
    echo "❌ FAILED: Multi-Day Single Store Analysis has errors"
    tail -20 /tmp/test_multiday_single.log
fi
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "All fixes have been tested!"
echo ""
echo "Generated Files:"
ls -lh *.txt 2>/dev/null | tail -10
echo ""
echo "UI Server Status:"
curl -s http://localhost:3000 > /dev/null && echo "✅ UI Server is running at http://localhost:3000" || echo "⚠️  UI Server may not be running"
echo ""
