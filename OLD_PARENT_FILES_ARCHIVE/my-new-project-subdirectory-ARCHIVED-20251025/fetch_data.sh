#!/bin/bash
#
# 🚀 AUTOMATED DATA FETCHER - Nash/Walmart/Unscheduled Delivery
# No more manual downloads! This fetches directly from BigQuery.
#

set -e

echo ""
echo "================================================================================="
echo "🚀 AUTOMATED BIGQUERY DATA FETCH"
echo "================================================================================="
echo ""
echo "Fetching data from:"
echo "  Project: wmt-edw-sandbox"
echo "  Table: LMD_DA.PROJECT_CENTRAL_SUMMARY_TABLE_DATE_LEVEL_AGGREGATABLE_KPI"
echo ""
echo "Filters:"
echo "  ✓ Carrier: Nash"
echo "  ✓ Client: Walmart"
echo "  ✓ Type: Unscheduled Delivery (OS=0)"
echo "  ✓ Date Range: Last 30 days"
echo ""
echo "================================================================================="
echo ""

# Set the project (use lmd-prod for billing/running queries)
gcloud config set project wmt-gdap-dl-sec-lmd-prod --quiet

# Run the BigQuery query (querying wmt-edw-sandbox table from lmd-prod project)
echo "📥 Fetching data from BigQuery..."
echo "   Using wmt-gdap-dl-sec-lmd-prod for query execution"
echo ""

bq query \n  --nouse_legacy_sql \n  --format=csv \n  --max_rows=1000000 \n  --use_legacy_sql=false \n  "
SELECT * 
FROM \`wmt-edw-sandbox.LMD_DA.PROJECT_CENTRAL_SUMMARY_TABLE_DATE_LEVEL_AGGREGATABLE_KPI\`
WHERE carrier_org_nm = 'Nash'
  AND client = 'Walmart'
  AND grouped_by = 'Unscheduled Delivery'
  AND slot_dt >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
ORDER BY slot_dt DESC, store_id
" > data/latest_data.csv 2>&1

STATUS=$?

if [ $STATUS -eq 0 ]; then
    # Count rows (subtract 1 for header)
    ROW_COUNT=$(wc -l < data/latest_data.csv)
    ROW_COUNT=$((ROW_COUNT - 1))
    
    # Get file size
    FILE_SIZE=$(du -h data/latest_data.csv | cut -f1)
    
    echo ""
    echo "================================================================================="
    echo "✅ SUCCESS!"
    echo "================================================================================="
    echo ""
    echo "Data saved to: data/latest_data.csv"
    echo "Rows: $ROW_COUNT"
    echo "Size: $FILE_SIZE"
    echo ""
    echo "Next steps:"
    echo "  # View the data"
    echo "  head data/latest_data.csv"
    echo ""
    echo "  # Analyze with existing tools"
    echo "  npm run store-metrics -- data/latest_data.csv"
    echo "  npm run driver-store-analysis -- <store-id> data/latest_data.csv"
    echo ""
    echo "🎉 No manual downloads needed! Just run this script anytime!"
    echo ""
else
    echo ""
    echo "================================================================================="
    echo "❌ FAILED"
    echo "================================================================================="
    echo ""
    echo "The BigQuery query failed. This could be because:"
    echo "  1. You're not authenticated (run: gcloud auth login)"
    echo "  2. You don't have permissions on wmt-edw-sandbox"
    echo "  3. Network/connection issue"
    echo ""
    echo "Check the error above for details."
    echo ""
    exit 1
fi