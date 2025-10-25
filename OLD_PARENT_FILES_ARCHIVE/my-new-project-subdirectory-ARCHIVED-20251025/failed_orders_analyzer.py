"""
Failed Orders Analysis Module
Analyzes patterns and trends in failed order pickups to identify root causes and improvement opportunities.
"""

import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


class FailedOrdersAnalyzer:
    def __init__(self, file_path):
        """Initialize the analyzer with data file path."""
        self.file_path = file_path
        self.df = None
        self.failed_trips = None
        self.analysis_results = {}

    def load_data(self):
        """Load the data and detect which failure column exists."""
        print("Loading data...")
        self.df = pd.read_csv(self.file_path)

        # Convert date columns
        date_columns = ['Date', 'Pickup Enroute', 'Pickup Arrived', 'Load Start Time',
                       'Load End Time', 'Pickup Complete', 'Last Dropoff Complete',
                       'Trip Planned Start']

        for col in date_columns:
            if col in self.df.columns:
                self.df[col] = pd.to_datetime(self.df[col], errors='coerce')

        # Detect which failure metric to use
        has_failed_orders = 'Failed Orders' in self.df.columns and self.df['Failed Orders'].sum() > 0
        has_failed_pickups = 'Failed Pickups' in self.df.columns and self.df['Failed Pickups'].sum() > 0

        if has_failed_orders:
            self.failure_column = 'Failed Orders'
            print("📊 Analyzing FAILED ORDERS")
        elif has_failed_pickups:
            self.failure_column = 'Failed Pickups'
            print("📦 Analyzing FAILED PICKUPS (orders that failed to be picked up)")
        else:
            self.failure_column = 'Failed Orders'  # Default
            print("⚠️  No failed orders or pickups detected in dataset")

        # Filter for trips with failures
        self.failed_trips = self.df[self.df[self.failure_column] > 0].copy()

        print(f"Total trips: {len(self.df)}")
        print(f"Trips with {self.failure_column.lower()}: {len(self.failed_trips)}")
        print(f"Total {self.failure_column.lower()}: {int(self.df[self.failure_column].sum())}")
        print(f"{self.failure_column} rate: {len(self.failed_trips)/len(self.df)*100:.2f}%\n")

        return self

    def analyze_by_carrier(self):
        """Analyze failures by carrier."""
        print("="*60)
        print(f"{self.failure_column.upper()} BY CARRIER")
        print("="*60)

        carrier_analysis = self.df.groupby('Carrier').agg({
            self.failure_column: ['sum', 'mean', 'count'],
            'Total Orders': 'sum',
            'Walmart Trip Id': 'count'
        }).round(2)

        carrier_analysis.columns = ['Total Failed', 'Avg Failed Per Trip',
                                   'Trips With Failures', 'Total Orders', 'Total Trips']

        carrier_analysis['Failed Order Rate %'] = (
            carrier_analysis['Total Failed'] / carrier_analysis['Total Orders'] * 100
        ).round(2)

        carrier_analysis['% Trips With Failures'] = (
            carrier_analysis['Trips With Failures'] / carrier_analysis['Total Trips'] * 100
        ).round(2)

        carrier_analysis = carrier_analysis.sort_values('Total Failed', ascending=False)

        print(carrier_analysis)
        print()

        self.analysis_results['carrier_analysis'] = carrier_analysis
        return self

    def analyze_by_store(self):
        """Analyze failed orders by store location."""
        print("="*60)
        print(f"TOP 15 STORES WITH {self.failure_column.upper()}")
        print("="*60)

        store_analysis = self.df.groupby('Store Id').agg({
            self.failure_column: ['sum', 'mean', 'count'],
            'Total Orders': 'sum',
            'Walmart Trip Id': 'count'
        }).round(2)

        store_analysis.columns = ['Total Failed', 'Avg Failed Per Trip',
                                 'Trips With Failures', 'Total Orders', 'Total Trips']

        store_analysis['Failed Order Rate %'] = (
            store_analysis['Total Failed'] / store_analysis['Total Orders'] * 100
        ).round(2)

        # Filter to stores with failed orders and sort
        store_analysis = store_analysis[store_analysis['Total Failed'] > 0]
        store_analysis = store_analysis.sort_values('Total Failed', ascending=False).head(15)

        print(store_analysis)
        print()

        self.analysis_results['store_analysis'] = store_analysis
        return self

    def analyze_time_patterns(self):
        """Analyze failed orders by time of day and day of week."""
        print("="*60)
        print(f"{self.failure_column.upper()} TIME PATTERNS")
        print("="*60)

        # Extract time features
        self.df['Hour'] = self.df['Pickup Arrived'].dt.hour
        self.df['Day_of_Week'] = self.df['Pickup Arrived'].dt.day_name()

        # Hourly analysis
        print("\nBy Hour of Day:")
        hourly = self.df.groupby('Hour').agg({
            self.failure_column: 'sum',
            'Total Orders': 'sum',
            'Walmart Trip Id': 'count'
        })

        hourly['Failed Rate %'] = (hourly[self.failure_column] / hourly['Total Orders'] * 100).round(2)
        hourly = hourly[hourly[self.failure_column] > 0].sort_values(self.failure_column, ascending=False)
        print(hourly)

        # Day of week analysis
        print("\nBy Day of Week:")
        daily = self.df.groupby('Day_of_Week').agg({
            self.failure_column: 'sum',
            'Total Orders': 'sum',
            'Walmart Trip Id': 'count'
        })

        daily['Failed Rate %'] = (daily[self.failure_column] / daily['Total Orders'] * 100).round(2)
        daily = daily.sort_values(self.failure_column, ascending=False)
        print(daily)
        print()

        self.analysis_results['time_patterns'] = {
            'hourly': hourly,
            'daily': daily
        }
        return self

    def analyze_impact_on_performance(self):
        """Analyze how failed orders impact trip performance."""
        print("="*60)
        print(f"{self.failure_column.upper()} IMPACT ON PERFORMANCE")
        print("="*60)

        # Compare trips with vs without failed orders
        trips_with_failures = self.df[self.df[self.failure_column] > 0]
        trips_without_failures = self.df[self.df[self.failure_column] == 0]

        metrics = ['Driver Store Time', 'Trip Actual Time', 'Driver Total Time',
                  'Drops Per Hour Trip', 'Adjusted Cddr']

        comparison = pd.DataFrame({
            f'With {self.failure_column}': trips_with_failures[metrics].mean(),
            f'Without {self.failure_column}': trips_without_failures[metrics].mean()
        }).round(2)

        comparison['Difference'] = (comparison[f'With {self.failure_column}'] -
                                   comparison[f'Without {self.failure_column}']).round(2)
        comparison['% Difference'] = ((comparison['Difference'] /
                                      comparison[f'Without {self.failure_column}']) * 100).round(2)

        print(comparison)
        print()

        self.analysis_results['performance_impact'] = comparison
        return self

    def identify_problem_trips(self):
        """Identify specific trips with high failed order counts."""
        print("="*60)
        print(f"TOP 20 TRIPS WITH HIGHEST {self.failure_column.upper()} COUNTS")
        print("="*60)

        problem_trips = self.failed_trips.nlargest(20, self.failure_column)[
            ['Date', 'Carrier', 'Store Id', 'Courier Name', 'Total Orders',
             self.failure_column, 'Failed Orders Rate', 'Delivered Orders', 'Pickup Arrived']
        ].copy()

        print(problem_trips.to_string(index=False))
        print()

        self.analysis_results['problem_trips'] = problem_trips
        return self

    def analyze_failure_reasons(self):
        """Analyze potential reasons for failures based on data patterns."""
        print("="*60)
        print("FAILURE PATTERN ANALYSIS")
        print("="*60)

        failed = self.failed_trips

        # Check correlation with failed pickups
        print("Correlation with Failed Pickups:")
        if 'Failed Pickups' in failed.columns:
            correlation = failed[[self.failure_column, 'Failed Pickups', 'Total Orders']].corr()
            print(correlation[self.failure_column].round(3))
            print()

        # Analyze if on-time arrival matters
        print(f"{self.failure_column} by Pickup Arrival Status:")
        if 'Is Pickup Arrived Ontime' in failed.columns:
            ontime_analysis = self.df.groupby('Is Pickup Arrived Ontime').agg({
                self.failure_column: ['sum', 'mean'],
                'Total Orders': 'sum',
                'Walmart Trip Id': 'count'
            }).round(2)
            ontime_analysis.columns = ['Total Failed', 'Avg Failed', 'Total Orders', 'Trips']
            ontime_analysis['Failed Rate %'] = (
                ontime_analysis['Total Failed'] / ontime_analysis['Total Orders'] * 100
            ).round(2)
            print(ontime_analysis)
            print()

        # Analyze by load time
        print(f"{self.failure_column} by Load Time Duration:")
        failed_copy = self.df[self.df[self.failure_column] > 0].copy()
        failed_copy['Load Duration Bucket'] = pd.cut(
            failed_copy['Driver Load Time'],
            bins=[0, 10, 20, 30, 50, 100, float('inf')],
            labels=['0-10min', '10-20min', '20-30min', '30-50min', '50-100min', '100+min']
        )

        load_analysis = failed_copy.groupby('Load Duration Bucket').agg({
            self.failure_column: ['sum', 'mean'],
            'Walmart Trip Id': 'count'
        }).round(2)
        load_analysis.columns = ['Total Failed', 'Avg Failed', 'Trips']
        print(load_analysis)
        print()

        return self

    def generate_summary_report(self):
        """Generate a comprehensive summary report."""
        print("\n" + "="*60)
        print(f"EXECUTIVE SUMMARY - {self.failure_column.upper()} ANALYSIS")
        print("="*60)

        total_failed = self.df[self.failure_column].sum()
        total_orders = self.df['Total Orders'].sum()
        overall_rate = (total_failed / total_orders * 100)

        trips_affected = len(self.failed_trips)
        total_trips = len(self.df)
        trip_rate = (trips_affected / total_trips * 100)

        print(f"\nOverall Statistics:")
        print(f"  Total {self.failure_column}: {int(total_failed)}")
        print(f"  Total Orders: {int(total_orders)}")
        print(f"  Overall {self.failure_column} Rate: {overall_rate:.2f}%")
        print(f"  Trips Affected: {trips_affected} out of {total_trips} ({trip_rate:.2f}%)")

        if 'carrier_analysis' in self.analysis_results:
            print(f"\nCarrier with Most {self.failure_column}:")
            top_carrier = self.analysis_results['carrier_analysis'].head(1)
            if len(top_carrier) > 0 and top_carrier['Total Failed'].values[0] > 0:
                print(f"  {top_carrier.index[0]}: {int(top_carrier['Total Failed'].values[0])} {self.failure_column.lower()}")
            else:
                print(f"  None - no {self.failure_column.lower()} in dataset")

        if 'store_analysis' in self.analysis_results:
            print(f"\nStore with Most {self.failure_column}:")
            top_store = self.analysis_results['store_analysis'].head(1)
            if len(top_store) > 0:
                print(f"  Store {top_store.index[0]}: {int(top_store['Total Failed'].values[0])} {self.failure_column.lower()}")
            else:
                print(f"  None - no {self.failure_column.lower()} in dataset")

        if total_failed > 0:
            print("\nRecommendations:")
            print("  1. Investigate root causes at high-failure stores")
            print("  2. Review carrier processes for handling failed pickups")
            print("  3. Analyze if failed orders are due to store readiness issues")
            print("  4. Consider early communication protocols for problematic orders")
            print("  5. Track failed order reasons for better prevention")
        else:
            print(f"\n Excellent! No {self.failure_column.lower()} found in this dataset.")
            print("   Continue monitoring to maintain this performance level.")

        print("="*60 + "\n")

    def save_results(self, output_prefix='failed_orders'):
        """Save analysis results to CSV files."""
        print("Saving analysis results...")

        if 'carrier_analysis' in self.analysis_results:
            self.analysis_results['carrier_analysis'].to_csv(
                f'{output_prefix}_by_carrier.csv'
            )
            print(f"Saved: {output_prefix}_by_carrier.csv")

        if 'store_analysis' in self.analysis_results:
            self.analysis_results['store_analysis'].to_csv(
                f'{output_prefix}_by_store.csv'
            )
            print(f"Saved: {output_prefix}_by_store.csv")

        if 'problem_trips' in self.analysis_results:
            self.analysis_results['problem_trips'].to_csv(
                f'{output_prefix}_problem_trips.csv', index=False
            )
            print(f"Saved: {output_prefix}_problem_trips.csv")

        print()

    def run_full_analysis(self):
        """Run all analysis steps."""
        return (self.load_data()
                .analyze_by_carrier()
                .analyze_by_store()
                .analyze_time_patterns()
                .analyze_impact_on_performance()
                .identify_problem_trips()
                .analyze_failure_reasons()
                .generate_summary_report())


def main():
    """Main execution function."""
    import sys

    # Check if file path provided as command line argument
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        print(f"Using provided file: {file_path}")
    else:
        # Use cleaned data if available, otherwise use original
        try:
            file_path = '/Users/h0r03cw/Desktop/Coding/Quick Analysis/data_table_1_cleaned.csv'
            analyzer = FailedOrdersAnalyzer(file_path)
        except FileNotFoundError:
            print("Cleaned data not found, using original data...")
            file_path = '/Users/h0r03cw/Desktop/Coding/Quick Analysis/data_table_1.csv'

    analyzer = FailedOrdersAnalyzer(file_path)

    # Run full analysis
    analyzer.run_full_analysis()

    # Save results
    analyzer.save_results()

    print("Analysis complete!")


if __name__ == "__main__":
    main()
