#!/bin/bash
# Test script to simulate UI upload and analysis

CSV_FILE="../data_table_1.csv"
ANALYSIS_TYPE="returns-breakdown"

echo "Testing UI endpoint with curl..."
echo "Analysis: $ANALYSIS_TYPE"
echo "File: $CSV_FILE"
echo ""

curl -X POST http://localhost:3000/analyze \
  -F "file=@$CSV_FILE" \
  -F "analysis=$ANALYSIS_TYPE" \
  -v

echo ""
echo "Check terminal running 'npm run ui' for detailed logs"
