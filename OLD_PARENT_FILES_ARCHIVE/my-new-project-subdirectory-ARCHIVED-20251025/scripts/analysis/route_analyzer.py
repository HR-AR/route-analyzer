#!/usr/bin/env python3
"""
Route Performance Analyzer
Analyzes Dedicated Van Delivery routes to identify:
- Routes deviating from target hours (8.33hr @ 10AM, 7.33hr @ 12PM departures)
- Extended breaks and idle time outliers
- Carrier performance issues
"""

import sys
import json
import pandas as pd
from datetime import datetime, time
from typing import Dict, List, Any


def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string in format: MM/DD/YYYY HH:MM:SS AM/PM"""
    return datetime.strptime(dt_str, "%m/%d/%Y %I:%M:%S %p")


def get_hour_from_datetime(dt_str: str) -> int:
    """Extract hour from datetime string"""
    dt = parse_datetime(dt_str)
    return dt.hour


def analyze_routes(csv_path: str) -> Dict[str, Any]:
    """
    Analyze route data and identify outliers

    Args:
        csv_path: Path to CSV file with route data

    Returns:
        Dictionary with analysis results
    """
    # Read CSV
    df = pd.read_csv(csv_path)

    # Convert time columns to minutes for easier calculation
    df['trip_actual_hours'] = df['Trip Actual Time'] / 60
    df['driver_total_hours'] = df['Driver Total Time'] / 60
    df['estimated_hours'] = df['Estimated Duration'] / 60

    # Determine departure time category (10AM vs 12PM)
    df['pickup_hour'] = df['Trip Planned Start'].apply(get_hour_from_datetime)
    df['departure_category'] = df['pickup_hour'].apply(
        lambda h: '10AM' if h == 10 else ('12PM' if h >= 11 and h <= 12 else 'Other')
    )

    # Define target hours based on departure time
    target_10am = 8.33  # 8.33 hours = 500 minutes
    target_12pm = 7.33  # 7.33 hours = 440 minutes

    df['target_hours'] = df['departure_category'].apply(
        lambda cat: target_10am if cat == '10AM' else (target_12pm if cat == '12PM' else 0)
    )

    # Calculate variance from target
    df['hours_variance'] = df['trip_actual_hours'] - df['target_hours']
    df['variance_percentage'] = (df['hours_variance'] / df['target_hours'] * 100).fillna(0)

    # Identify outliers (>10% deviation from target)
    deviation_threshold = 10  # 10% deviation
    df['is_outlier'] = abs(df['variance_percentage']) > deviation_threshold

    # Identify extended breaks (Driver Dwell Time > 30 min)
    extended_dwell_threshold = 30  # minutes
    df['has_extended_dwell'] = df['Driver Dwell Time'] > extended_dwell_threshold

    # Identify unusual load times (Driver Load Time > 60 min)
    extended_load_threshold = 60  # minutes
    df['has_extended_load'] = df['Driver Load Time'] > extended_load_threshold

    # Overall statistics
    total_routes = len(df)
    outlier_routes = df['is_outlier'].sum()
    routes_with_extended_dwell = df['has_extended_dwell'].sum()
    routes_with_extended_load = df['has_extended_load'].sum()

    # Breakdown by departure time
    departure_stats = df.groupby('departure_category').agg({
        'trip_actual_hours': ['mean', 'median', 'min', 'max'],
        'target_hours': 'first',
        'variance_percentage': 'mean',
        'is_outlier': 'sum'
    }).round(2)

    # Carrier performance
    carrier_stats = df.groupby('Carrier').agg({
        'is_outlier': 'sum',
        'has_extended_dwell': 'sum',
        'has_extended_load': 'sum',
        'Carrier': 'count'
    }).rename(columns={'Carrier': 'total_routes'})
    carrier_stats['outlier_rate'] = (carrier_stats['is_outlier'] / carrier_stats['total_routes'] * 100).round(2)

    # Replace NaN and Infinity with 0 for JSON serialization
    carrier_stats = carrier_stats.fillna(0)
    carrier_stats = carrier_stats.replace([float('inf'), float('-inf')], 0)

    # Top 10 worst performing routes (biggest negative variance from target)
    worst_routes = df.nsmallest(10, 'variance_percentage')[[
        'Carrier', 'Courier Name', 'Date', 'departure_category',
        'target_hours', 'trip_actual_hours', 'variance_percentage',
        'Driver Dwell Time', 'Driver Load Time', 'Total Orders'
    ]]

    # Top 10 routes exceeding target the most (positive outliers)
    over_target_routes = df.nlargest(10, 'variance_percentage')[[
        'Carrier', 'Courier Name', 'Date', 'departure_category',
        'target_hours', 'trip_actual_hours', 'variance_percentage',
        'Driver Dwell Time', 'Driver Load Time', 'Total Orders'
    ]]

    # Clean DataFrames for JSON serialization - replace NaN and Inf
    worst_routes = worst_routes.fillna(0).replace([float('inf'), float('-inf')], 0)
    over_target_routes = over_target_routes.fillna(0).replace([float('inf'), float('-inf')], 0)

    # Build results
    results = {
        'summary': {
            'total_routes': int(total_routes),
            'outlier_routes': int(outlier_routes),
            'outlier_percentage': round(outlier_routes / total_routes * 100, 2) if total_routes > 0 else 0,
            'routes_with_extended_dwell': int(routes_with_extended_dwell),
            'routes_with_extended_load': int(routes_with_extended_load),
            'avg_actual_hours': round(df['trip_actual_hours'].mean() or 0, 2),
            'avg_target_hours': round(df['target_hours'].mean() or 0, 2)
        },
        'departure_time_analysis': {
            '10AM_routes': {
                'count': int((df['departure_category'] == '10AM').sum()),
                'target_hours': target_10am,
                'avg_actual_hours': round(df[df['departure_category'] == '10AM']['trip_actual_hours'].mean() or 0, 2),
                'avg_variance_pct': round(df[df['departure_category'] == '10AM']['variance_percentage'].mean() or 0, 2),
                'outliers': int(df[df['departure_category'] == '10AM']['is_outlier'].sum())
            },
            '12PM_routes': {
                'count': int((df['departure_category'] == '12PM').sum()),
                'target_hours': target_12pm,
                'avg_actual_hours': round(df[df['departure_category'] == '12PM']['trip_actual_hours'].mean() or 0, 2),
                'avg_variance_pct': round(df[df['departure_category'] == '12PM']['variance_percentage'].mean() or 0, 2),
                'outliers': int(df[df['departure_category'] == '12PM']['is_outlier'].sum())
            }
        },
        'carrier_performance': carrier_stats.to_dict('index'),
        'worst_performing_routes': worst_routes.to_dict('records'),
        'over_target_routes': over_target_routes.to_dict('records')
    }

    return results


def main():
    """Main entry point - reads from stdin, writes to stdout"""
    try:
        # Read input from stdin (expects JSON with csv_path)
        input_data = json.loads(sys.stdin.read())
        csv_path = input_data.get('csv_path')

        if not csv_path:
            raise ValueError("csv_path is required in input JSON")

        # Analyze routes
        results = analyze_routes(csv_path)

        # Write results to stdout as JSON
        print(json.dumps(results, indent=2))
        sys.exit(0)

    except Exception as e:
        # Write error to stderr
        sys.stderr.write(f"Error: {str(e)}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
