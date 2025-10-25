#!/usr/bin/env python3
"""
Convert BigQuery data format to Tableau-compatible format for analysis scripts.
Maps BigQuery column names to expected Tableau column names.
"""

import sys
import pandas as pd
from pathlib import Path


def convert_bigquery_to_tableau(input_csv, output_csv=None):
    """
    Convert BigQuery CSV to Tableau-compatible format.

    Args:
        input_csv: Path to BigQuery CSV file
        output_csv: Path to output file (defaults to input_csv with -tableau suffix)
    """

    print(f"\n📊 Converting BigQuery data to Tableau format...")
    print(f"   Input: {input_csv}")

    # Read BigQuery CSV
    df = pd.read_csv(input_csv)
    print(f"   Rows: {len(df):,}")
    print(f"   Columns: {len(df.columns)}")

    # Column mapping: BigQuery -> Tableau
    column_mapping = {
        # Date
        'slot_dt': 'Report Date',

        # Store info
        'store_id': 'Store ID',

        # Orders
        'Order_Count': 'Total Orders',
        'Total_Deliveries_Delivered_Returned': 'Delivered Orders',
        'total_po_return': 'Returned Orders',
        'total_incomplete_deliveries': 'Failed Orders',
        # Note: BigQuery doesn't have pending orders directly, we'll calculate if needed

        # Trips
        'total_trips_completed': 'Total Routes',

        # Time metrics - BigQuery aggregates these differently
        # We'll create placeholders since BigQuery data is pre-aggregated
        # Individual route timing isn't available in BigQuery aggregated data
    }

    # Rename columns that exist
    df_converted = df.copy()
    for bq_col, tableau_col in column_mapping.items():
        if bq_col in df_converted.columns:
            df_converted.rename(columns={bq_col: tableau_col}, inplace=True)
            print(f"   ✓ Mapped: {bq_col} → {tableau_col}")

    # Add missing columns with default/calculated values
    if 'Pending Orders' not in df_converted.columns:
        # Estimate pending orders
        if 'total_deliveries' in df.columns and 'Total_Deliveries_Delivered_Returned' in df.columns:
            df_converted['Pending Orders'] = (
                df['total_deliveries'] - df['Total_Deliveries_Delivered_Returned']
            ).fillna(0).clip(lower=0)
            print(f"   ✓ Calculated: Pending Orders")

    # Time-based metrics aren't in BigQuery aggregated data, add placeholders
    time_columns = ['Driver Dwell Time', 'Driver Load Time', 'Driver Total Time',
                    'Trip Actual Time', 'Estimated Duration']

    for col in time_columns:
        if col not in df_converted.columns:
            df_converted[col] = 0  # Placeholder - BigQuery data is pre-aggregated
            print(f"   ⚠ Added placeholder: {col} (not in BigQuery aggregated data)")

    # Ensure Date column exists
    if 'Report Date' in df_converted.columns and 'Date' not in df_converted.columns:
        df_converted['Date'] = df_converted['Report Date']
        print(f"   ✓ Created: Date from Report Date")

    # Determine output path
    if output_csv is None:
        input_path = Path(input_csv)
        output_csv = input_path.parent / f"{input_path.stem}-tableau{input_path.suffix}"

    # Save converted CSV
    df_converted.to_csv(output_csv, index=False)

    print(f"\n✅ Conversion complete!")
    print(f"   Output: {output_csv}")
    print(f"   Columns in output: {len(df_converted.columns)}")
    print(f"\n💡 Note: Time-based metrics (dwell time, load time) are not available in")
    print(f"   BigQuery's pre-aggregated data. Use BigQuery Metrics for accurate analysis.")

    return str(output_csv)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python convert_bigquery_to_tableau_format.py <input_csv> [output_csv]")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    result = convert_bigquery_to_tableau(input_file, output_file)
    print(f"\n{result}")
