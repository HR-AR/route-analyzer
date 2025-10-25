#!/usr/bin/env python3
"""
Pending Orders Analysis
Analyzes routes with pending orders to identify next-day delivery issues
"""

import sys
import json
import pandas as pd
import numpy as np

def analyze_pending_orders(csv_path, top_n=50):
    """Analyze routes with pending orders and identify patterns"""

    # Read the CSV
    df = pd.read_csv(csv_path)

    # Filter only routes with pending orders
    routes_with_pending = df[df['Pending Orders'] > 0].copy()

    if routes_with_pending.empty:
        return {
            'top_pending_routes': [],
            'total_routes_with_pending': 0,
            'total_pending': 0,
            'patterns': {}
        }

    # Calculate pending rate if not already present
    if 'Pending Orders Rate' not in routes_with_pending.columns:
        routes_with_pending['Pending Orders Rate'] = (
            routes_with_pending['Pending Orders'] / routes_with_pending['Total Orders'] * 100
        ).round(2)

    # Calculate key metrics
    routes_with_pending['pending_rate'] = routes_with_pending['Pending Orders Rate']
    routes_with_pending['high_pending'] = routes_with_pending['pending_rate'] > 20

    # Categorize severity
    def categorize_pending(row):
        rate = row['pending_rate']
        if rate >= 50:
            return 'CRITICAL'
        elif rate >= 30:
            return 'HIGH'
        elif rate >= 20:
            return 'MODERATE'
        else:
            return 'LOW'

    routes_with_pending['severity'] = routes_with_pending.apply(categorize_pending, axis=1)

    # Get top N routes by pending count
    top_n_routes = routes_with_pending.nlargest(top_n, 'Pending Orders')

    top_routes = []
    for _, row in top_n_routes.iterrows():
        top_routes.append({
            'date': row['Date'],
            'store_id': int(row['Store Id']),
            'carrier': row['Carrier'],
            'driver': row['Courier Name'],
            'total_orders': int(row['Total Orders']),
            'delivered': int(row['Delivered Orders']),
            'returned': int(row['Returned Orders']),
            'pending': int(row['Pending Orders']),
            'pending_rate': float(row['pending_rate']),
            'severity': row['severity'],
            'trip_actual_hours': float(row['Trip Actual Time']),
            'trip_estimate_hours': float(row['Estimated Duration']),
        })

    # Pattern analysis
    severity_counts = routes_with_pending['severity'].value_counts().to_dict()

    # Group by store to find stores with consistent pending issues
    store_pending = routes_with_pending.groupby('Store Id').agg({
        'Pending Orders': 'sum',
        'Date': 'count'
    }).rename(columns={'Date': 'route_count'})

    stores_with_issues = store_pending[store_pending['route_count'] >= 2].sort_values(
        'Pending Orders', ascending=False
    ).head(10)

    top_problem_stores = []
    for store_id, row in stores_with_issues.iterrows():
        top_problem_stores.append({
            'store_id': int(store_id),
            'total_pending': int(row['Pending Orders']),
            'affected_routes': int(row['route_count'])
        })

    patterns = {
        'total_routes_with_pending': len(routes_with_pending),
        'total_pending_orders': int(routes_with_pending['Pending Orders'].sum()),
        'total_orders': int(routes_with_pending['Total Orders'].sum()),
        'avg_pending_rate': float(routes_with_pending['pending_rate'].mean()),
        'critical_routes': severity_counts.get('CRITICAL', 0),
        'high_severity_routes': severity_counts.get('HIGH', 0),
        'moderate_severity_routes': severity_counts.get('MODERATE', 0),
        'low_severity_routes': severity_counts.get('LOW', 0),
        'top_problem_stores': top_problem_stores
    }

    return {
        'top_pending_routes': top_routes,
        'patterns': patterns
    }

def main():
    # Read request from stdin
    request = json.loads(sys.stdin.read())
    csv_path = request.get('csv_path') or request.get('csvPath')
    top_n = request.get('topN', 50)  # Default to 50 if not provided

    # Analyze
    result = analyze_pending_orders(csv_path, top_n)

    # Replace NaN and Infinity with 0 for JSON serialization
    result_json = json.dumps(result, indent=2)
    result_json = result_json.replace('NaN', '0').replace('Infinity', '0').replace('-Infinity', '0')

    print(result_json)

if __name__ == "__main__":
    main()
