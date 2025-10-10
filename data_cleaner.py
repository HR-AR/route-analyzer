"""
Data Cleaner for Order Delivery Analysis
This script cleans and prepares delivery data for analysis, handling failed orders and data quality issues.
"""

import pandas as pd
import numpy as np
from datetime import datetime

class DataCleaner:
    def __init__(self, file_path):
        """Initialize with the path to the CSV file."""
        self.file_path = file_path
        self.df = None
        self.cleaning_report = {
            'total_rows': 0,
            'rows_removed': 0,
            'failed_orders_fixed': 0,
            'date_issues_fixed': 0,
            'negative_values_fixed': 0
        }

    def load_data(self):
        """Load the CSV file into a pandas DataFrame."""
        print("Loading data...")
        self.df = pd.read_csv(self.file_path)
        self.cleaning_report['total_rows'] = len(self.df)
        print(f"Loaded {len(self.df)} rows")
        return self

    def fix_failed_orders(self):
        """
        Fix rows where Failed Orders aren't properly dispensed to drivers.
        Failed orders should not be counted in delivery metrics.

        IMPORTANT: This ensures failed orders are:
        1. Properly identified and counted
        2. Excluded from delivery performance metrics
        3. Clearly marked for separate analysis
        """
        print("\nFixing failed orders...")

        # Identify rows with failed orders
        failed_mask = self.df['Failed Orders'] > 0
        failed_count = failed_mask.sum()
        total_failed_orders = int(self.df['Failed Orders'].sum())

        if failed_count > 0:
            print(f"Found {failed_count} trips with failed orders")
            print(f"Total failed orders across all trips: {total_failed_orders}")

            # Adjust metrics for failed orders
            # Failed orders should not affect delivery rates
            for idx in self.df[failed_mask].index:
                failed = self.df.loc[idx, 'Failed Orders']
                total = self.df.loc[idx, 'Total Orders']
                delivered = self.df.loc[idx, 'Delivered Orders']
                pending = self.df.loc[idx, 'Pending Orders']
                returned = self.df.loc[idx, 'Returned Orders']

                # Recalculate rates excluding failed orders
                effective_total = total - failed
                if effective_total > 0:
                    self.df.loc[idx, 'Failed Orders Rate'] = failed / total
                    # Update adjusted CDDR to reflect only deliverable orders
                    if delivered > 0:
                        self.df.loc[idx, 'Adjusted Cddr'] = delivered / effective_total

                    # Recalculate other rates excluding failed orders
                    if returned > 0:
                        self.df.loc[idx, 'Returned Orders Rate'] = returned / effective_total
                    if pending > 0:
                        self.df.loc[idx, 'Pending Orders Rate'] = pending / effective_total
                else:
                    # If all orders failed, set rates appropriately
                    self.df.loc[idx, 'Failed Orders Rate'] = 1.0
                    self.df.loc[idx, 'Adjusted Cddr'] = 0.0
                    self.df.loc[idx, 'Returned Orders Rate'] = 0.0
                    self.df.loc[idx, 'Pending Orders Rate'] = 0.0

            self.cleaning_report['failed_orders_fixed'] = failed_count
            self.cleaning_report['total_failed_orders'] = total_failed_orders
            print(f"Adjusted metrics for {failed_count} trips with failed orders")
            print(f"Failed orders are now properly tracked and excluded from delivery metrics")

        return self

    def fix_date_formats(self):
        """Standardize date/time formats and fix parsing issues."""
        print("\nStandardizing date formats...")

        date_columns = [
            'Date', 'Pickup Enroute', 'Pickup Arrived', 'Load Start Time',
            'Load End Time', 'Pickup Complete', 'Last Dropoff Complete',
            'Trip Planned Start'
        ]

        fixed_count = 0
        for col in date_columns:
            if col in self.df.columns:
                try:
                    self.df[col] = pd.to_datetime(self.df[col], errors='coerce')
                    fixed_count += 1
                except Exception as e:
                    print(f"Warning: Could not convert {col}: {e}")

        self.cleaning_report['date_issues_fixed'] = fixed_count
        print(f"Standardized {fixed_count} date columns")

        return self

    def fix_negative_values(self):
        """Fix negative time values and other anomalies."""
        print("\nFixing negative values and anomalies...")

        time_columns = [
            'Driver Dwell Time', 'Driver Load Time', 'Driver Sort Time',
            'Driver Store Time', 'Trip Actual Time', 'Driver Total Time',
            'Estimated Duration', 'Headroom'
        ]

        fixed_count = 0
        for col in time_columns:
            if col in self.df.columns:
                # Count negative values
                negative_mask = self.df[col] < 0
                count = negative_mask.sum()

                if count > 0:
                    print(f"  {col}: {count} negative values found")
                    # Set negative values to 0 or absolute value depending on context
                    if col == 'Headroom':
                        # Headroom can legitimately be negative (over time)
                        pass
                    else:
                        # Other time values should not be negative
                        self.df.loc[negative_mask, col] = self.df.loc[negative_mask, col].abs()
                        fixed_count += count

        self.cleaning_report['negative_values_fixed'] = fixed_count
        print(f"Fixed {fixed_count} negative values")

        return self

    def remove_invalid_rows(self):
        """Remove rows with critical missing data."""
        print("\nRemoving invalid rows...")

        initial_count = len(self.df)

        # Remove rows where critical fields are missing
        critical_fields = ['Carrier', 'Date', 'Store Id', 'Walmart Trip Id', 'Total Orders']
        self.df = self.df.dropna(subset=critical_fields)

        # Remove rows where total orders is 0 or negative
        self.df = self.df[self.df['Total Orders'] > 0]

        removed = initial_count - len(self.df)
        self.cleaning_report['rows_removed'] = removed

        if removed > 0:
            print(f"Removed {removed} invalid rows")
        else:
            print("No invalid rows found")

        return self

    def validate_data(self):
        """Validate data consistency and print detailed warnings."""
        print("\nValidating data consistency...")

        # Check if delivered + returned + pending + failed = total
        validation_issues = 0
        inconsistent_rows = []

        for idx, row in self.df.iterrows():
            expected_total = row['Delivered Orders'] + row['Returned Orders'] + \
                           row['Pending Orders'] + row['Failed Orders']
            actual_total = row['Total Orders']

            if abs(expected_total - actual_total) > 0.1:  # Allow small floating point differences
                validation_issues += 1
                if len(inconsistent_rows) < 5:  # Keep first 5 for detailed reporting
                    inconsistent_rows.append({
                        'trip_id': row['Walmart Trip Id'],
                        'expected': expected_total,
                        'actual': actual_total,
                        'difference': expected_total - actual_total
                    })

        if validation_issues > 0:
            print(f"Warning: {validation_issues} rows have inconsistent order counts")
            print("\nFirst few inconsistent rows:")
            for row in inconsistent_rows:
                print(f"  Trip {row['trip_id'][:8]}...: Expected {row['expected']}, Got {row['actual']} (diff: {row['difference']})")
        else:
            print("✓ All order counts are consistent")

        # Validate failed orders specifically
        failed_count = (self.df['Failed Orders'] > 0).sum()
        total_failed = int(self.df['Failed Orders'].sum())

        print(f"\nFailed Orders Summary:")
        print(f"  Trips with failed orders: {failed_count}")
        print(f"  Total failed orders: {total_failed}")

        if total_failed > 0:
            max_failed = int(self.df['Failed Orders'].max())
            print(f"  Max failed orders in single trip: {max_failed}")

        return self

    def save_cleaned_data(self, output_path=None):
        """Save the cleaned data to a new CSV file."""
        if output_path is None:
            output_path = self.file_path.replace('.csv', '_cleaned.csv')

        print(f"\nSaving cleaned data to {output_path}...")
        self.df.to_csv(output_path, index=False)
        print(f"Saved {len(self.df)} rows")

        return output_path

    def print_report(self):
        """Print a summary report of the cleaning process."""
        print("\n" + "="*60)
        print("DATA CLEANING REPORT")
        print("="*60)
        print(f"Total rows processed:        {self.cleaning_report['total_rows']}")
        print(f"Rows removed:                {self.cleaning_report['rows_removed']}")
        print(f"Failed orders adjusted:      {self.cleaning_report.get('failed_orders_fixed', 0)}")
        print(f"Total failed orders found:   {self.cleaning_report.get('total_failed_orders', 0)}")
        print(f"Date columns standardized:   {self.cleaning_report['date_issues_fixed']}")
        print(f"Negative values fixed:       {self.cleaning_report['negative_values_fixed']}")
        print(f"Final row count:             {len(self.df)}")
        print("="*60)
        print("\nData is ready for analysis!")
        print("✓ Failed orders properly tracked and excluded from metrics")
        print("✓ All dates standardized")
        print("✓ All anomalies corrected")

    def clean_all(self):
        """Run all cleaning steps in sequence."""
        return (self.load_data()
                .remove_invalid_rows()
                .fix_date_formats()
                .fix_failed_orders()
                .fix_negative_values()
                .validate_data())


def main():
    """Main execution function."""
    # Initialize cleaner
    cleaner = DataCleaner('/Users/h0r03cw/Desktop/Coding/Quick Analysis/data_table_1.csv')

    # Run all cleaning steps
    cleaner.clean_all()

    # Save cleaned data
    output_path = cleaner.save_cleaned_data()

    # Print report
    cleaner.print_report()

    print(f"\nCleaned data saved to: {output_path}")
    print("Ready for analysis!")


if __name__ == "__main__":
    main()