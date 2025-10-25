#!/usr/bin/env python3
"""
🚀 AUTOMATED BIGQUERY FETCH
Fetch Nash/Walmart/Unscheduled Delivery data directly from BigQuery using API.
No manual downloads needed!
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime, timedelta
from google.cloud import bigquery

# The table we found!
PROJECT = "wmt-edw-sandbox"
DATASET = "LMD_DA"
TABLE = "PROJECT_CENTRAL_SUMMARY_TABLE_DATE_LEVEL_AGGREGATABLE_KPI"


def fetch_data(output_file, days=30, carrier='Nash', client='Walmart', 
               grouped_by='Unscheduled Delivery'):
    """
    Fetch data from BigQuery and save to CSV.
    
    Args:
        output_file: Path to save CSV
        days: Number of days to fetch (default: 30)
        carrier: Carrier filter (default: Nash)
        client: Client filter (default: Walmart)
        grouped_by: Grouped by filter (default: Unscheduled Delivery for OS=0)
    """
    
    print("\n" + "="*80)
    print("🚀 AUTOMATED BIGQUERY DATA FETCH")
    print("="*80)
    print()
    print(f"Project: {PROJECT}")
    print(f"Table: {DATASET}.{TABLE}")
    print()
    print("Filters:")
    print(f"  ✓ Carrier: {carrier}")
    print(f"  ✓ Client: {client}")
    print(f"  ✓ Type: {grouped_by}")
    print(f"  ✓ Date Range: Last {days} days")
    print()
    print("="*80)
    print()
    
    # Create BigQuery client
    print("🔐 Connecting to BigQuery...")
    try:
        client_bq = bigquery.Client(project=PROJECT)
        print("✅ Connected successfully!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print()
        print("💡 Make sure you're authenticated:")
        print("   gcloud auth application-default login")
        return None
    
    # Build the query
    query = f"""
    SELECT *
    FROM `{PROJECT}.{DATASET}.{TABLE}`
    WHERE carrier_org_nm = @carrier
      AND client = @client
      AND grouped_by = @grouped_by
      AND slot_dt >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
    ORDER BY slot_dt DESC, store_id
    """
    
    # Configure query parameters (prevents SQL injection)
    job_config = bigquery.QueryJobConfig(
        query_parameters=[
            bigquery.ScalarQueryParameter("carrier", "STRING", carrier),
            bigquery.ScalarQueryParameter("client", "STRING", client),
            bigquery.ScalarQueryParameter("grouped_by", "STRING", grouped_by),
            bigquery.ScalarQueryParameter("days", "INT64", days),
        ]
    )
    
    print("📥 Running BigQuery query...")
    print(f"   This may take 10-30 seconds...")
    print()
    
    try:
        # Run the query
        query_job = client_bq.query(query, job_config=job_config)
        
        # Wait for results
        results = query_job.result()
        
        # Convert to pandas DataFrame
        df = results.to_dataframe()
        
        print(f"✅ Query successful!")
        print(f"   Rows: {len(df):,}")
        print(f"   Columns: {len(df.columns)}")
        print()
        
        # Save to CSV
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(output_path, index=False)
        
        print("💾 Data saved!")
        print(f"   File: {output_path.absolute()}")
        print(f"   Size: {output_path.stat().st_size / 1024 / 1024:.2f} MB")
        print()
        
        # Show sample info
        if len(df) > 0:
            print("📊 Data Summary:")
            if 'slot_dt' in df.columns:
                print(f"   Date range: {df['slot_dt'].min()} to {df['slot_dt'].max()}")
            if 'store_id' in df.columns:
                print(f"   Unique stores: {df['store_id'].nunique():,}")
            print(f"   Sample columns: {', '.join(df.columns[:10].tolist())}...")
        
        return str(output_path.absolute())
        
    except Exception as e:
        print(f"❌ Query failed: {e}")
        print()
        print("💡 Troubleshooting:")
        print("   1. Make sure you're authenticated: gcloud auth application-default login")
        print("   2. Check you have BigQuery permissions on wmt-edw-sandbox")
        print("   3. Verify the table exists: it should show 29M+ rows")
        return None


def main():
    parser = argparse.ArgumentParser(
        description='🚀 Automated BigQuery Data Fetch - No manual downloads!',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch last 30 days (default)
  python3 scripts/auto_fetch_bigquery.py --output data/latest.csv

  # Fetch last 7 days
  python3 scripts/auto_fetch_bigquery.py --output data/weekly.csv --days 7

  # Fetch last 90 days
  python3 scripts/auto_fetch_bigquery.py --output data/quarterly.csv --days 90
        """
    )
    
    parser.add_argument(
        '--output', '-o',
        default='data/latest_data.csv',
        help='Output CSV file path (default: data/latest_data.csv)'
    )
    parser.add_argument(
        '--days',
        type=int,
        default=30,
        help='Number of days to fetch (default: 30)'
    )
    parser.add_argument(
        '--carrier',
        default='Nash',
        help='Carrier filter (default: Nash)'
    )
    parser.add_argument(
        '--client',
        default='Walmart',
        help='Client filter (default: Walmart)'
    )
    parser.add_argument(
        '--type',
        default='Unscheduled Delivery',
        dest='grouped_by',
        help='Delivery type filter (default: Unscheduled Delivery for OS=0)'
    )
    
    args = parser.parse_args()
    
    # Fetch the data
    output_path = fetch_data(
        output_file=args.output,
        days=args.days,
        carrier=args.carrier,
        client=args.client,
        grouped_by=args.grouped_by
    )
    
    if output_path:
        print("\n" + "="*80)
        print("🎉 SUCCESS!")
        print("="*80)
        print()
        print("Next steps:")
        print(f"  # View the data")
        print(f"  head {output_path}")
        print()
        print(f"  # Analyze with your tools")
        print(f"  npm run store-metrics -- {output_path}")
        print(f"  npm run driver-store-analysis -- <store-id> {output_path}")
        print()
        print("🎉 No manual downloads needed - just run this script anytime!")
        print()
        return 0
    else:
        print("\n" + "="*80)
        print("❌ FAILED")
        print("="*80)
        print()
        return 1


if __name__ == '__main__':
    sys.exit(main())