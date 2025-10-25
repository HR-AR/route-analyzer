#!/usr/bin/env python3
"""
Automated BigQuery Data Fetcher
Fetch data from the Project Central Summary Dashboard BigQuery table.
"""

import subprocess
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# The BigQuery table we found!
TABLE = "wmt-edw-sandbox:LMD_DA.PROJECT_CENTRAL_SUMMARY_TABLE_DATE_LEVEL_AGGREGATABLE_KPI"
PROJECT = "wmt-edw-sandbox"


def run_bq_query(query, output_file):
    """Run a BigQuery query and save results to CSV"""
    
    cmd = [
        "bq", "query",
        "--nouse_legacy_sql",
        "--format=csv",
        "--max_rows=1000000",  # Allow up to 1M rows
        query
    ]
    
    print(f"\n🔍 Running BigQuery query...")
    print(f"   Table: {TABLE}")
    print()
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode != 0:
            print(f"❌ Query failed: {result.stderr}")
            return None
        
        # Save to file
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(result.stdout)
        
        # Count rows
        row_count = len(result.stdout.split('\n')) - 1  # -1 for header
        
        print(f"✅ Query successful!")
        print(f"   Rows: {row_count:,}")
        print(f"   Output: {output_file}")
        
        return str(output_path.absolute())
        
    except subprocess.TimeoutExpired:
        print("❌ Query timed out after 5 minutes")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def build_query(carrier=None, os_filter=None, client=None, 
                start_date=None, end_date=None, store_id=None):
    """Build the SQL query with filters"""
    
    # Base query - select all columns
    query = f"""
    SELECT *
    FROM `{TABLE}`
    WHERE 1=1
    """
    
    # Add filters
    if carrier:
        query += f" AND LOWER(carrier_org_nm) = LOWER('{carrier}')"
    
    if os_filter is not None:
        # OS filter maps to grouped_by field (0 = ungrouped, 1 = grouped)
        query += f" AND grouped_by = '{os_filter}'"
    
    if client:
        query += f" AND LOWER(client) = LOWER('{client}')"
    
    if start_date:
        query += f" AND slot_dt >= '{start_date}'"
    
    if end_date:
        query += f" AND slot_dt <= '{end_date}'"
    
    if store_id:
        query += f" AND store_id = '{store_id}'"
    
    # Order by date and store
    query += " ORDER BY slot_dt DESC, store_id"
    
    return query


def main():
    parser = argparse.ArgumentParser(
        description='Fetch data from BigQuery automatically - NO MANUAL DOWNLOADS!',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch Nash + Walmart + OS=0 data from last 30 days
  python3 scripts/fetch_from_bigquery.py \n    --carrier Nash --os 0 --client Walmart --days 30 \n    --output data/nash_walmart.csv

  # Fetch specific date range
  python3 scripts/fetch_from_bigquery.py \n    --carrier Nash --client Walmart \n    --start-date 2025-01-01 --end-date 2025-01-31 \n    --output data/january.csv

  # Fetch for specific store
  python3 scripts/fetch_from_bigquery.py \n    --store 5930 --days 90 \n    --output data/store_5930.csv
        """
    )
    
    parser.add_argument(
        '--output', '-o',
        required=True,
        help='Output CSV file path'
    )
    parser.add_argument(
        '--carrier',
        help='Filter by Carrier (e.g., Nash, NTG)'
    )
    parser.add_argument(
        '--os',
        help='Filter by OS/grouped_by value (e.g., 0 for ungrouped, 1 for grouped)'
    )
    parser.add_argument(
        '--client',
        help='Filter by Client (e.g., Walmart)'
    )
    parser.add_argument(
        '--start-date',
        help='Start date (YYYY-MM-DD)'
    )
    parser.add_argument(
        '--end-date',
        help='End date (YYYY-MM-DD)'
    )
    parser.add_argument(
        '--days',
        type=int,
        help='Fetch last N days (alternative to start/end date)'
    )
    parser.add_argument(
        '--store',
        help='Filter by Store ID'
    )
    
    args = parser.parse_args()
    
    # Handle --days shortcut
    start_date = args.start_date
    end_date = args.end_date
    
    if args.days:
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=args.days)).strftime('%Y-%m-%d')
        print(f"📅 Date range: {start_date} to {end_date} ({args.days} days)")
    
    # Build query
    query = build_query(
        carrier=args.carrier,
        os_filter=args.os,
        client=args.client,
        start_date=start_date,
        end_date=end_date,
        store_id=args.store
    )
    
    print("\n" + "="*80)
    print("🚀 AUTOMATED BIGQUERY DATA FETCH")
    print("="*80)
    print()
    print(f"Project: {PROJECT}")
    print(f"Table: LMD_DA.PROJECT_CENTRAL_SUMMARY_TABLE_DATE_LEVEL_AGGREGATABLE_KPI")
    print()
    
    if args.carrier:
        print(f"Carrier: {args.carrier}")
    if args.os:
        print(f"OS/Grouped: {args.os}")
    if args.client:
        print(f"Client: {args.client}")
    if start_date:
        print(f"Start Date: {start_date}")
    if end_date:
        print(f"End Date: {end_date}")
    if args.store:
        print(f"Store: {args.store}")
    
    # Run query
    output_path = run_bq_query(query, args.output)
    
    if output_path:
        print("\n" + "="*80)
        print("🎉 SUCCESS!")
        print("="*80)
        print()
        print(f"Data saved to: {output_path}")
        print()
        print("Next steps:")
        print(f"  # Analyze the data")
        print(f"  npm run store-metrics -- {output_path}")
        print(f"  npm run driver-store-analysis -- <store-id> {output_path}")
        print()
        return 0
    else:
        print("\n❌ FAILED")
        return 1


if __name__ == '__main__':
    sys.exit(main())