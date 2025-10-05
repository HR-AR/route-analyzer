#!/usr/bin/env python3
"""
Detailed Time Analysis
Breaks down how much time is spent on dwell, load, sort, and actual driving
"""

import sys
import json
import pandas as pd
from datetime import datetime


def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string in format: MM/DD/YYYY HH:MM:SS AM/PM"""
    return datetime.strptime(dt_str, "%m/%d/%Y %I:%M:%S %p")


def analyze_time_breakdown(csv_path: str) -> dict:
    """Analyze detailed time breakdown for routes"""
    df = pd.read_csv(csv_path)

    # Key time metrics (all in minutes)
    time_columns = [
        'Driver Dwell Time',
        'Driver Load Time',
        'Driver Sort Time',
        'Driver Store Time',
        'Trip Actual Time',
        'Driver Total Time'
    ]

    # Overall statistics
    summary = {
        'avg_dwell_time_min': round(df['Driver Dwell Time'].mean(), 2),
        'median_dwell_time_min': round(df['Driver Dwell Time'].median(), 2),
        'max_dwell_time_min': round(df['Driver Dwell Time'].max(), 2),
        'min_dwell_time_min': round(df['Driver Dwell Time'].min(), 2),

        'avg_load_time_min': round(df['Driver Load Time'].mean(), 2),
        'median_load_time_min': round(df['Driver Load Time'].median(), 2),
        'max_load_time_min': round(df['Driver Load Time'].max(), 2),

        'avg_sort_time_min': round(df['Driver Sort Time'].mean(), 2),
        'avg_store_time_min': round(df['Driver Store Time'].mean(), 2),

        'avg_trip_actual_min': round(df['Trip Actual Time'].mean(), 2),
        'avg_total_time_min': round(df['Driver Total Time'].mean(), 2),
    }

    # Extended time analysis
    extended_dwell_threshold = 30  # minutes
    extended_load_threshold = 60   # minutes

    extended_dwell = df[df['Driver Dwell Time'] > extended_dwell_threshold].copy()
    extended_load = df[df['Driver Load Time'] > extended_load_threshold].copy()

    # How much extra time is being wasted?
    summary['routes_with_extended_dwell'] = len(extended_dwell)
    summary['avg_extended_dwell_min'] = round(extended_dwell['Driver Dwell Time'].mean(), 2) if len(extended_dwell) > 0 else 0
    summary['total_wasted_dwell_hours'] = round(extended_dwell['Driver Dwell Time'].sum() / 60, 2) if len(extended_dwell) > 0 else 0

    summary['routes_with_extended_load'] = len(extended_load)
    summary['avg_extended_load_min'] = round(extended_load['Driver Load Time'].mean(), 2) if len(extended_load) > 0 else 0
    summary['total_extended_load_hours'] = round(extended_load['Driver Load Time'].sum() / 60, 2) if len(extended_load) > 0 else 0

    # Top 20 worst dwell times (individual routes with date and store)
    worst_dwell = df.nlargest(20, 'Driver Dwell Time')[[
        'Carrier', 'Courier Name', 'Date', 'Store Id', 'Driver Dwell Time',
        'Driver Load Time', 'Trip Actual Time', 'Total Orders'
    ]].to_dict('records')

    # Top 20 worst load times (individual routes with date and store)
    worst_load = df.nlargest(20, 'Driver Load Time')[[
        'Carrier', 'Courier Name', 'Date', 'Store Id', 'Driver Load Time',
        'Driver Dwell Time', 'Trip Actual Time', 'Total Orders'
    ]].to_dict('records')

    # Routes with BOTH extended dwell AND extended load (double trouble)
    both_issues = df[
        (df['Driver Dwell Time'] > extended_dwell_threshold) &
        (df['Driver Load Time'] > extended_load_threshold)
    ][[
        'Carrier', 'Courier Name', 'Date', 'Store Id',
        'Driver Dwell Time', 'Driver Load Time', 'Trip Actual Time', 'Total Orders'
    ]].to_dict('records')

    # Time breakdown as percentage of total time
    total_time_sum = df['Driver Total Time'].sum()
    dwell_time_sum = df['Driver Dwell Time'].sum()
    load_time_sum = df['Driver Load Time'].sum()
    sort_time_sum = df['Driver Sort Time'].sum()
    store_time_sum = df['Driver Store Time'].sum()
    trip_time_sum = df['Trip Actual Time'].sum()

    time_breakdown_pct = {
        'dwell_pct': round((dwell_time_sum / total_time_sum * 100), 2) if total_time_sum > 0 else 0,
        'load_pct': round((load_time_sum / total_time_sum * 100), 2) if total_time_sum > 0 else 0,
        'sort_pct': round((sort_time_sum / total_time_sum * 100), 2) if total_time_sum > 0 else 0,
        'store_pct': round((store_time_sum / total_time_sum * 100), 2) if total_time_sum > 0 else 0,
        'trip_actual_pct': round((trip_time_sum / total_time_sum * 100), 2) if total_time_sum > 0 else 0,
    }

    # Carrier breakdown
    carrier_time_stats = df.groupby('Carrier').agg({
        'Driver Dwell Time': ['mean', 'median', 'max'],
        'Driver Load Time': ['mean', 'median', 'max'],
        'Trip Actual Time': 'mean',
        'Carrier': 'count'
    }).round(2)
    carrier_time_stats.columns = ['_'.join(col) for col in carrier_time_stats.columns]
    carrier_time_stats = carrier_time_stats.rename(columns={'Carrier_count': 'total_routes'})

    # Convert to dict and handle NaN
    carrier_stats_dict = carrier_time_stats.to_dict('index')

    results = {
        'summary': summary,
        'time_breakdown_percentage': time_breakdown_pct,
        'carrier_time_breakdown': carrier_stats_dict,
        'worst_dwell_times': worst_dwell,
        'worst_load_times': worst_load,
        'both_dwell_and_load_issues': both_issues,
    }

    return results


def main():
    """Main entry point"""
    try:
        input_data = json.loads(sys.stdin.read())
        csv_path = input_data.get('csv_path')

        if not csv_path:
            raise ValueError("csv_path is required")

        results = analyze_time_breakdown(csv_path)
        print(json.dumps(results, indent=2))
        sys.exit(0)

    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
