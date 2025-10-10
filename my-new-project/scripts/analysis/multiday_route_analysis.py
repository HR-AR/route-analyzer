#!/usr/bin/env python3
"""
Multi-Day Route Analysis
Identifies multi-day routes and calculates actual working time vs overnight gaps
"""

import sys
import json
import pandas as pd
import numpy as np
from typing import Dict, Any, List
from datetime import datetime, time, timedelta

def safe_value(value, default=0):
    """Convert NaN/null values to safe JSON-serializable values"""
    if pd.isna(value) or (isinstance(value, float) and np.isnan(value)):
        return default
    return value

def analyze_multiday_routes(csv_path: str, store_id: int = None) -> Dict[str, Any]:
    """Analyze routes to identify multi-day patterns and working time"""

    df = pd.read_csv(csv_path)

    if store_id:
        df = df[df['Store Id'] == store_id].copy()

    if len(df) == 0:
        return {'error': 'No data found'}

    # Parse timestamps
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df['Pickup Complete'] = pd.to_datetime(df['Pickup Complete'], format='%m/%d/%Y %I:%M:%S %p', errors='coerce')
    df['Last Dropoff Complete'] = pd.to_datetime(df['Last Dropoff Complete'], format='%m/%d/%Y %I:%M:%S %p', errors='coerce')

    # Convert times to numeric
    df['Trip Actual Time'] = pd.to_numeric(df['Trip Actual Time'], errors='coerce')
    df['Driver Total Time'] = pd.to_numeric(df['Driver Total Time'], errors='coerce')
    df['Driver Dwell Time'] = pd.to_numeric(df['Driver Dwell Time'], errors='coerce')
    df['Driver Load Time'] = pd.to_numeric(df['Driver Load Time'], errors='coerce')

    # Calculate elapsed time
    df['Elapsed Minutes'] = (df['Last Dropoff Complete'] - df['Pickup Complete']).dt.total_seconds() / 60
    df['Elapsed Hours'] = df['Elapsed Minutes'] / 60

    # Identify multi-day routes
    df['Multi Day'] = df['Pickup Complete'].dt.date != df['Last Dropoff Complete'].dt.date

    # Calculate overnight gap
    # For multi-day routes, estimate overnight break (assume 8-hour sleep break from ~11pm-7am)
    def calculate_overnight_gap(row):
        if not row['Multi Day']:
            return 0

        pickup = row['Pickup Complete']
        dropoff = row['Last Dropoff Complete']

        # Simple heuristic: assume overnight break of 8 hours for multi-day routes
        # More sophisticated: count nights crossed and multiply
        nights_crossed = (dropoff.date() - pickup.date()).days

        # Estimate 8 hours sleep per night
        estimated_sleep = nights_crossed * 8 * 60  # minutes

        return estimated_sleep

    df['Estimated Overnight Minutes'] = df.apply(calculate_overnight_gap, axis=1)
    df['Estimated Overnight Hours'] = df['Estimated Overnight Minutes'] / 60

    # Calculate actual working time (elapsed - overnight break)
    df['Estimated Working Minutes'] = df['Elapsed Minutes'] - df['Estimated Overnight Minutes']
    df['Estimated Working Hours'] = df['Estimated Working Minutes'] / 60

    # Sort by date
    df = df.sort_values(['Date', 'Courier Name'])

    # Prepare route details
    routes = []
    for idx, row in df.iterrows():
        # Handle potential NaN/0 values using safe_value
        elapsed_hours = safe_value(row['Elapsed Hours'], 0)
        trip_actual = safe_value(row['Trip Actual Time'], 0)
        driver_total = safe_value(row['Driver Total Time'], 0)
        dwell = safe_value(row['Driver Dwell Time'], 0)
        load = safe_value(row['Driver Load Time'], 0)
        overnight = safe_value(row['Estimated Overnight Hours'], 0)
        working = safe_value(row['Estimated Working Hours'], elapsed_hours)

        route = {
            'date': row['Date'].strftime('%Y-%m-%d') if pd.notna(row['Date']) else 'Unknown',
            'courier_name': row['Courier Name'] if pd.notna(row['Courier Name']) else 'Unknown',
            'carrier': row['Carrier'] if pd.notna(row['Carrier']) else 'Unknown',
            'store_id': int(safe_value(row['Store Id'], 0)),

            # Timestamps
            'pickup_complete': row['Pickup Complete'].strftime('%Y-%m-%d %I:%M %p') if pd.notna(row['Pickup Complete']) and hasattr(row['Pickup Complete'], 'strftime') else 'N/A',
            'last_dropoff': row['Last Dropoff Complete'].strftime('%Y-%m-%d %I:%M %p') if pd.notna(row['Last Dropoff Complete']) and hasattr(row['Last Dropoff Complete'], 'strftime') else 'N/A',

            # Multi-day flag
            'multi_day': bool(row['Multi Day']),

            # Time calculations - ensure no NaN values
            'elapsed_hours': round(float(elapsed_hours), 2) if elapsed_hours != 0 else 0.0,
            'trip_actual_hours': round(float(trip_actual / 60), 2) if trip_actual != 0 else 0.0,
            'driver_total_hours': round(float(driver_total / 60), 2) if driver_total != 0 else 0.0,
            'estimated_overnight_hours': round(float(overnight), 2),
            'estimated_working_hours': round(float(working), 2),

            # Time components
            'dwell_time_min': round(float(dwell), 2),
            'load_time_min': round(float(load), 2),

            # Volume
            'total_orders': int(safe_value(row['Total Orders'], 0)),
            'delivered_orders': int(safe_value(row['Delivered Orders'], 0)),
            'pending_orders': int(safe_value(row['Pending Orders'], 0)),

            # Performance
            'dph': round(float(safe_value(row['Delivered Orders'], 0)) / float(working), 2) if working > 0 else 0.0,
        }
        routes.append(route)

    # Pending orders analysis
    routes_with_pending = df[df['Pending Orders'] > 0]
    multi_day_with_pending = df[(df['Multi Day']) & (df['Pending Orders'] > 0)]

    # Summary stats - use safe_value to avoid NaN in JSON
    multi_day_count = int(df['Multi Day'].sum())
    single_day_count = int((~df['Multi Day']).sum())
    total_routes = len(df)

    summary = {
        'total_routes': total_routes,
        'multi_day_routes': multi_day_count,
        'single_day_routes': single_day_count,
        'pct_multi_day': round(float(multi_day_count / total_routes * 100), 1) if total_routes > 0 else 0.0,

        # Multi-day route stats
        'avg_elapsed_hours_multi_day': round(float(safe_value(df[df['Multi Day']]['Elapsed Hours'].mean(), 0)), 2) if multi_day_count > 0 else 0.0,
        'avg_working_hours_multi_day': round(float(safe_value(df[df['Multi Day']]['Estimated Working Hours'].mean(), 0)), 2) if multi_day_count > 0 else 0.0,
        'avg_overnight_hours_multi_day': round(float(safe_value(df[df['Multi Day']]['Estimated Overnight Hours'].mean(), 0)), 2) if multi_day_count > 0 else 0.0,

        # Single-day route stats
        'avg_working_hours_single_day': round(float(safe_value(df[~df['Multi Day']]['Elapsed Hours'].mean(), 0)), 2) if single_day_count > 0 else 0.0,

        # Pending orders tracking (potential next-day deliveries)
        'total_pending': int(safe_value(df['Pending Orders'].sum(), 0)),
        'routes_with_pending': len(routes_with_pending),
        'multi_day_routes_with_pending': len(multi_day_with_pending),
        'avg_pending_rate': round(float(safe_value(df['Pending Orders'].sum(), 0) / safe_value(df['Total Orders'].sum(), 1) * 100), 2) if df['Total Orders'].sum() > 0 else 0.0,
    }

    return {
        'summary': summary,
        'routes': routes,
    }

def analyze_all_stores(csv_path: str) -> Dict[str, Any]:
    """Analyze all stores to find which ones have multi-day routes"""

    df = pd.read_csv(csv_path)

    # Parse timestamps
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df['Pickup Complete'] = pd.to_datetime(df['Pickup Complete'], format='%m/%d/%Y %I:%M:%S %p', errors='coerce')
    df['Last Dropoff Complete'] = pd.to_datetime(df['Last Dropoff Complete'], format='%m/%d/%Y %I:%M:%S %p', errors='coerce')

    # Identify multi-day routes
    df['Multi Day'] = df['Pickup Complete'].dt.date != df['Last Dropoff Complete'].dt.date

    # Group by store
    stores_with_multiday = []

    for store_id in df['Store Id'].unique():
        if pd.isna(store_id):
            continue

        store_df = df[df['Store Id'] == store_id]
        multi_day_count = int(store_df['Multi Day'].sum())
        total_routes = len(store_df)

        if multi_day_count > 0:
            stores_with_multiday.append({
                'store_id': int(safe_value(store_id, 0)),
                'total_routes': total_routes,
                'multi_day_routes': multi_day_count,
                'single_day_routes': total_routes - multi_day_count,
                'pct_multi_day': round(float(multi_day_count / total_routes * 100), 1) if total_routes > 0 else 0.0,
            })

    # Sort by percentage of multi-day routes (descending)
    stores_with_multiday.sort(key=lambda x: x['pct_multi_day'], reverse=True)

    return {
        'total_stores_analyzed': int(df['Store Id'].nunique()),
        'stores_with_multi_day_routes': len(stores_with_multiday),
        'stores': stores_with_multiday,
    }

def main():
    input_data = json.load(sys.stdin)
    csv_path = input_data['csv_path']
    store_id = input_data.get('store_id')
    analyze_all = input_data.get('analyze_all', False)

    if analyze_all or store_id is None:
        # Analyze all stores
        results = analyze_all_stores(csv_path)
    else:
        # Analyze specific store
        results = analyze_multiday_routes(csv_path, store_id)

    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
