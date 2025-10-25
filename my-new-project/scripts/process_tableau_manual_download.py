#!/usr/bin/env python3
"""
Process Manually Downloaded Tableau "Full Data"
Converts the TSV file from Tableau's "View Data" button to clean CSV format.
"""

import sys
import argparse
import pandas as pd
from pathlib import Path
import chardet


def detect_encoding(file_path):
    """Detect the encoding of the file"""
    with open(file_path, 'rb') as f:
        raw_data = f.read(10000)  # Read first 10KB
        result = chardet.detect(raw_data)
        return result['encoding']


def process_tableau_file(input_file, output_file, carrier=None, os_filter=None, client=None):
    """
    Process a manually downloaded Tableau Full Data file.
    
    Args:
        input_file: Path to the downloaded TSV file (usually UTF-16LE encoded)
        output_file: Path for the output CSV file
        carrier: Optional carrier filter
        os_filter: Optional OS filter
        client: Optional client filter
    """
    
    print(f"📂 Processing Tableau Full Data file...")
    print(f"   Input: {input_file}")
    print()
    
    # Detect encoding
    print("🔍 Detecting file encoding...")
    encoding = detect_encoding(input_file)
    print(f"   Detected: {encoding}")
    
    # Read the TSV file
    print("📥 Reading data...")
    try:
        df = pd.read_csv(input_file, sep='\t', encoding=encoding)
    except:
        # Fallback to UTF-16LE if detection fails
        print("   Trying UTF-16LE encoding...")
        df = pd.read_csv(input_file, sep='\t', encoding='utf-16le')
    
    print(f"✅ Loaded {len(df)} rows, {len(df.columns)} columns")
    print()
    
    # Show info about the data
    print("📊 DATA SUMMARY")
    print("="*80)
    
    if 'Report Date' in df.columns:
        dates = df['Report Date'].unique()
        print(f"Date Range: {min(dates)} to {max(dates)}")
    
    if 'Carrier Org Nm' in df.columns:
        carriers = df['Carrier Org Nm'].unique()
        print(f"Carriers: {', '.join(carriers)}")
    
    if 'Client' in df.columns:
        clients = df['Client'].unique()
        print(f"Clients: {', '.join(clients)}")
    
    if 'Store Id' in df.columns:
        store_count = df['Store Id'].nunique()
        print(f"Unique Stores: {store_count}")
    
    print()
    
    # Apply filters if specified
    original_len = len(df)
    
    if carrier and 'Carrier Org Nm' in df.columns:
        print(f"🔍 Filtering by Carrier = {carrier}...")
        df = df[df['Carrier Org Nm'] == carrier]
        print(f"   {original_len} → {len(df)} rows")
        original_len = len(df)
    
    if os_filter is not None and 'Indicator Filter by Type' in df.columns:
        print(f"🔍 Filtering by OS = {os_filter}...")
        df = df[df['Indicator Filter by Type'] == int(os_filter)]
        print(f"   {original_len} → {len(df)} rows")
        original_len = len(df)
    
    if client and 'Client' in df.columns:
        print(f"🔍 Filtering by Client = {client}...")
        df = df[df['Client'] == client]
        print(f"   {original_len} → {len(df)} rows")
    
    print()
    
    # Save as CSV
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"💾 Saving to CSV...")
    df.to_csv(output_path, index=False)
    
    print(f"✅ Saved to: {output_path}")
    print(f"   Final: {len(df)} rows, {len(df.columns)} columns")
    print()
    
    # Show sample columns
    print("📋 SAMPLE COLUMNS (first 20):")
    for i, col in enumerate(df.columns[:20], 1):
        print(f"   {i}. {col}")
    if len(df.columns) > 20:
        print(f"   ... and {len(df.columns) - 20} more")
    
    return str(output_path.absolute())


def main():
    parser = argparse.ArgumentParser(
        description='Process manually downloaded Tableau Full Data file',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
How to manually download from Tableau:
  1. Open the Tableau dashboard
  2. Click on the view you want
  3. Click the "View Data" button (in the toolbar)
  4. Click "Download all rows as text file"
  5. Save the file (it will be a TSV file with UTF-16LE encoding)
  6. Run this script to convert it to CSV

Example:
  python3 scripts/process_tableau_manual_download.py \n    /Users/h0r03cw/Downloads/Daily_Summary-Agg_Full_Data_data.csv \n    --output data/processed_full_data.csv \n    --carrier nash \n    --os 0 \n    --client Walmart
        """
    )
    
    parser.add_argument(
        'input_file',
        help='Path to the manually downloaded TSV file'
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
        help='Filter by OS/Indicator Filter by Type value (e.g., 0, 1)'
    )
    parser.add_argument(
        '--client',
        help='Filter by Client (e.g., Walmart)'
    )
    
    args = parser.parse_args()
    
    try:
        output_path = process_tableau_file(
            input_file=args.input_file,
            output_file=args.output,
            carrier=args.carrier,
            os_filter=args.os,
            client=args.client
        )
        
        print()
        print("🎉 SUCCESS!")
        print()
        print("Next steps:")
        print(f"  # Analyze the data")
        print(f"  npm run store-metrics -- {output_path}")
        print()
        
        return 0
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())