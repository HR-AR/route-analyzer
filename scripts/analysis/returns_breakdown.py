#!/usr/bin/env python3
"""
Returns Breakdown Analysis
Analyzes top routes with highest returns and identifies contributing factors
"""

import sys
import json
import pandas as pd
import numpy as np

def analyze_returns_breakdown(csv_path):
    """Analyze routes with highest returns and identify patterns"""

    # Read the CSV
    df = pd.read_csv(csv_path)

    # Filter only routes with returns
    routes_with_returns = df[df['Returned Orders'] > 0].copy()

    if routes_with_returns.empty:
        return {
            'top_return_routes': [],
            'total_routes_with_returns': 0,
            'total_returns': 0,
            'patterns': {}
        }

    # Calculate key metrics for analysis
    routes_with_returns['return_rate'] = (routes_with_returns['Returned Orders'] / routes_with_returns['Total Orders'] * 100).round(2)
    routes_with_returns['variance_pct'] = ((routes_with_returns['Trip Actual Time'] - routes_with_returns['Estimated Duration']) / routes_with_returns['Estimated Duration'] * 100).round(2)
    routes_with_returns['drops_per_hour'] = (routes_with_returns['Total Orders'] / routes_with_returns['Trip Actual Time']).round(2)

    # Thresholds for analysis
    extended_dwell_threshold = 30  # minutes
    extended_load_threshold = 60   # minutes
    high_variance_threshold = 50   # percent
    low_efficiency_threshold = 8   # drops per hour

    # Identify contributing factors
    routes_with_returns['extended_dwell'] = routes_with_returns['Driver Dwell Time'] > extended_dwell_threshold
    routes_with_returns['extended_load'] = routes_with_returns['Driver Load Time'] > extended_load_threshold
    routes_with_returns['high_variance'] = routes_with_returns['variance_pct'] > high_variance_threshold
    routes_with_returns['low_efficiency'] = routes_with_returns['drops_per_hour'] < low_efficiency_threshold
    routes_with_returns['very_high_volume'] = routes_with_returns['Total Orders'] > 80

    # Identify likely root causes
    def identify_causes(row):
        causes = []

        if row['return_rate'] > 50:
            causes.append('CATASTROPHIC_FAILURE')

        if row['extended_dwell']:
            causes.append('EXTENDED_BREAK')

        if row['extended_load']:
            causes.append('LOAD_ISSUES')

        if row['high_variance'] and row['Trip Actual Time'] > 15:
            causes.append('TIME_MANAGEMENT_FAILURE')

        if row['low_efficiency']:
            causes.append('LOW_EFFICIENCY')

        if row['very_high_volume']:
            causes.append('VOLUME_OVERLOAD')

        if row['Trip Actual Time'] < row['Estimated Duration'] and row['return_rate'] > 20:
            causes.append('GAVE_UP_EARLY')

        if not causes:
            causes.append('CUSTOMER_ACCESS_ISSUES')

        return causes

    routes_with_returns['likely_causes'] = routes_with_returns.apply(identify_causes, axis=1)

    # Get top 10 routes by number of returns
    top_10 = routes_with_returns.nlargest(10, 'Returned Orders')

    top_routes = []
    for _, row in top_10.iterrows():
        top_routes.append({
            'date': row['Date'],
            'store_id': int(row['Store Id']),
            'carrier': row['Carrier'],
            'driver': row['Courier Name'],
            'total_orders': int(row['Total Orders']),
            'delivered': int(row['Delivered Orders']),
            'returned': int(row['Returned Orders']),
            'pending': int(row['Pending Orders']),
            'return_rate': float(row['return_rate']),
            'trip_actual_hours': float(row['Trip Actual Time']),
            'trip_estimate_hours': float(row['Estimated Duration']),
            'variance_pct': float(row['variance_pct']),
            'dwell_time_min': float(row['Driver Dwell Time']),
            'load_time_min': float(row['Driver Load Time']),
            'drops_per_hour': float(row['drops_per_hour']),
            'likely_causes': row['likely_causes'],
            'contributing_factors': {
                'extended_dwell': bool(row['extended_dwell']),
                'extended_load': bool(row['extended_load']),
                'high_variance': bool(row['high_variance']),
                'low_efficiency': bool(row['low_efficiency']),
                'very_high_volume': bool(row['very_high_volume'])
            }
        })

    # Pattern analysis
    all_causes = [cause for causes in routes_with_returns['likely_causes'] for cause in causes]
    cause_counts = pd.Series(all_causes).value_counts().to_dict()

    patterns = {
        'most_common_causes': cause_counts,
        'avg_return_rate': float(routes_with_returns['return_rate'].mean()),
        'total_routes_with_returns': len(routes_with_returns),
        'total_returns': int(routes_with_returns['Returned Orders'].sum()),
        'total_orders': int(routes_with_returns['Total Orders'].sum()),
        'routes_with_extended_dwell': int(routes_with_returns['extended_dwell'].sum()),
        'routes_with_extended_load': int(routes_with_returns['extended_load'].sum()),
        'routes_with_high_variance': int(routes_with_returns['high_variance'].sum()),
        'routes_with_low_efficiency': int(routes_with_returns['low_efficiency'].sum())
    }

    return {
        'top_return_routes': top_routes,
        'patterns': patterns
    }

def main():
    # Read request from stdin
    request = json.loads(sys.stdin.read())
    csv_path = request['csvPath']

    # Analyze
    result = analyze_returns_breakdown(csv_path)

    # Replace NaN and Infinity with 0 for JSON serialization
    result_json = json.dumps(result, indent=2)
    result_json = result_json.replace('NaN', '0').replace('Infinity', '0').replace('-Infinity', '0')

    print(result_json)

if __name__ == "__main__":
    main()
