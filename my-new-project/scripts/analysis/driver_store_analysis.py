#!/usr/bin/env python3
"""
Driver-Level Analysis for Specific Store
Analyzes all drivers at a specific store to identify patterns in dwell time,
load time, variance, and performance metrics.
"""

import sys
import json
import pandas as pd
from typing import Dict, Any

def analyze_driver_store_performance(csv_path: str, store_id: int) -> Dict[str, Any]:
    """Analyze driver-level performance at a specific store"""

    df = pd.read_csv(csv_path)

    # Filter for the specific store (convert store_id to int for comparison)
    store_id_int = int(store_id)
    store_df = df[df['Store Id'] == store_id_int].copy()

    if len(store_df) == 0:
        return {'error': f'No data found for Store #{store_id}'}

    # Convert Date column to datetime
    store_df['Date'] = pd.to_datetime(store_df['Date'], errors='coerce')

    # Convert time columns to numeric (minutes)
    store_df['Driver Dwell Time'] = pd.to_numeric(store_df['Driver Dwell Time'], errors='coerce')
    store_df['Driver Load Time'] = pd.to_numeric(store_df['Driver Load Time'], errors='coerce')
    store_df['Driver Sort Time'] = pd.to_numeric(store_df['Driver Sort Time'], errors='coerce')
    store_df['Driver Total Time'] = pd.to_numeric(store_df['Driver Total Time'], errors='coerce')
    store_df['Trip Actual Time'] = pd.to_numeric(store_df['Trip Actual Time'], errors='coerce')
    store_df['Estimated Duration'] = pd.to_numeric(store_df['Estimated Duration'], errors='coerce')

    # Calculate metrics
    store_df['Total Time Hours'] = store_df['Driver Total Time'] / 60
    store_df['Actual Time Hours'] = store_df['Trip Actual Time'] / 60
    store_df['Planned Time Hours'] = store_df['Estimated Duration'] / 60
    store_df['Variance Hours'] = (store_df['Trip Actual Time'] - store_df['Estimated Duration']) / 60

    # Calculate DPH with zero division handling
    store_df['DPH'] = store_df.apply(
        lambda row: row['Delivered Orders'] / row['Total Time Hours'] if row['Total Time Hours'] > 0 else 0,
        axis=1
    )

    # Sort by date
    store_df = store_df.sort_values('Date')

    # Convert Date to string for JSON
    store_df['Date'] = store_df['Date'].dt.strftime('%Y-%m-%d')

    # Fill NaN values with 0 for JSON serialization
    store_df = store_df.fillna(0)

    # Calculate pending rate
    store_df['Pending Rate'] = (store_df['Pending Orders'] / store_df['Total Orders']).fillna(0)

    # ===== OVERALL STORE STATS =====
    routes_with_pending = store_df[store_df['Pending Orders'] > 0]

    overall = {
        'store_id': store_id,
        'total_routes': len(store_df),
        'total_orders': int(store_df['Total Orders'].sum()),
        'total_delivered': int(store_df['Delivered Orders'].sum()),
        'total_returned': int(store_df['Returned Orders'].sum()),
        'total_pending': int(store_df['Pending Orders'].sum()),
        'delivery_rate': round((store_df['Delivered Orders'].sum() / store_df['Total Orders'].sum()) * 100, 2),

        # DPH
        'avg_dph': round(store_df['DPH'].mean(), 2),
        'median_dph': round(store_df['DPH'].median(), 2),

        # Pending
        'pending_rate': round((store_df['Pending Orders'].sum() / store_df['Total Orders'].sum()) * 100, 2) if store_df['Total Orders'].sum() > 0 else 0,
        'routes_with_pending': len(routes_with_pending),

        # Dwell Time
        'avg_dwell_time': round(store_df['Driver Dwell Time'].mean(), 2),
        'median_dwell_time': round(store_df['Driver Dwell Time'].median(), 2),
        'max_dwell_time': round(store_df['Driver Dwell Time'].max(), 2),
        'min_dwell_time': round(store_df['Driver Dwell Time'].min(), 2),

        # Load Time
        'avg_load_time': round(store_df['Driver Load Time'].mean(), 2),
        'median_load_time': round(store_df['Driver Load Time'].median(), 2),
        'max_load_time': round(store_df['Driver Load Time'].max(), 2),
        'min_load_time': round(store_df['Driver Load Time'].min(), 2),

        # Sort Time
        'avg_sort_time': round(store_df['Driver Sort Time'].mean(), 2),

        # Variance
        'avg_variance_hours': round(store_df['Variance Hours'].mean(), 2),
        'median_variance_hours': round(store_df['Variance Hours'].median(), 2),
        'avg_planned_hours': round(store_df['Planned Time Hours'].mean(), 2),
        'avg_actual_hours': round(store_df['Actual Time Hours'].mean(), 2),
    }

    # ===== DRIVER-LEVEL BREAKDOWN =====
    driver_groups = store_df.groupby('Courier Name')

    driver_metrics = []
    for driver_name, driver_data in driver_groups:
        driver_pending = driver_data[driver_data['Pending Orders'] > 0]

        driver_metric = {
            'driver_name': driver_name,
            'carrier': driver_data['Carrier'].iloc[0],
            'route_count': len(driver_data),

            # Volume
            'total_orders': int(driver_data['Total Orders'].sum()),
            'delivered_orders': int(driver_data['Delivered Orders'].sum()),
            'returned_orders': int(driver_data['Returned Orders'].sum()),
            'pending_orders': int(driver_data['Pending Orders'].sum()),
            'delivery_rate': round((driver_data['Delivered Orders'].sum() / driver_data['Total Orders'].sum()) * 100, 2) if driver_data['Total Orders'].sum() > 0 else 0,

            # DPH
            'avg_dph': round(driver_data['DPH'].mean(), 2),
            'best_dph': round(driver_data['DPH'].max(), 2),
            'worst_dph': round(driver_data['DPH'].min(), 2),

            # Pending
            'pending_rate': round((driver_data['Pending Orders'].sum() / driver_data['Total Orders'].sum()) * 100, 2) if driver_data['Total Orders'].sum() > 0 else 0,
            'routes_with_pending': len(driver_pending),

            # Dwell Time
            'avg_dwell_time': round(driver_data['Driver Dwell Time'].mean(), 2),
            'max_dwell_time': round(driver_data['Driver Dwell Time'].max(), 2),
            'min_dwell_time': round(driver_data['Driver Dwell Time'].min(), 2),

            # Load Time
            'avg_load_time': round(driver_data['Driver Load Time'].mean(), 2),
            'max_load_time': round(driver_data['Driver Load Time'].max(), 2),
            'min_load_time': round(driver_data['Driver Load Time'].min(), 2),

            # Sort Time
            'avg_sort_time': round(driver_data['Driver Sort Time'].mean(), 2),

            # Variance
            'avg_variance_hours': round(driver_data['Variance Hours'].mean(), 2),
            'avg_planned_hours': round(driver_data['Planned Time Hours'].mean(), 2),
            'avg_actual_hours': round(driver_data['Actual Time Hours'].mean(), 2),

            # Dates worked
            'dates_worked': driver_data['Date'].unique().tolist(),
        }
        driver_metrics.append(driver_metric)

    # Sort drivers by DPH (worst to best)
    driver_metrics.sort(key=lambda x: x['avg_dph'])

    # ===== ALL ROUTES DETAIL =====
    all_routes = store_df[[
        'Date', 'Courier Name', 'Carrier', 'Total Orders', 'Delivered Orders',
        'Returned Orders', 'Pending Orders', 'Pending Rate', 'DPH', 'Driver Dwell Time', 'Driver Load Time',
        'Driver Sort Time', 'Planned Time Hours', 'Actual Time Hours', 'Variance Hours'
    ]].to_dict('records')

    # ===== PROBLEM ROUTES =====
    # High dwell time routes
    high_dwell = store_df.nlargest(5, 'Driver Dwell Time')[[
        'Date', 'Courier Name', 'Carrier', 'Driver Dwell Time', 'Driver Load Time',
        'Total Orders', 'Delivered Orders', 'Pending Orders', 'DPH', 'Variance Hours'
    ]].to_dict('records')

    # High load time routes
    high_load = store_df.nlargest(5, 'Driver Load Time')[[
        'Date', 'Courier Name', 'Carrier', 'Driver Load Time', 'Driver Dwell Time',
        'Total Orders', 'Delivered Orders', 'Pending Orders', 'DPH', 'Variance Hours'
    ]].to_dict('records')

    # High variance routes
    high_variance = store_df.nlargest(5, 'Variance Hours')[[
        'Date', 'Courier Name', 'Carrier', 'Variance Hours', 'Planned Time Hours',
        'Actual Time Hours', 'Driver Dwell Time', 'Driver Load Time', 'Pending Orders', 'DPH'
    ]].to_dict('records')

    # Routes with pending orders
    pending_routes = store_df[store_df['Pending Orders'] > 0][[
        'Date', 'Courier Name', 'Carrier', 'Pending Orders', 'Pending Rate', 'Total Orders',
        'Delivered Orders', 'DPH', 'Driver Dwell Time', 'Driver Load Time'
    ]].to_dict('records')

    return {
        'overall': overall,
        'driver_metrics': driver_metrics,
        'all_routes': all_routes,
        'problem_routes': {
            'high_dwell': high_dwell,
            'high_load': high_load,
            'high_variance': high_variance,
            'pending': pending_routes,
        }
    }

def main():
    input_data = json.load(sys.stdin)
    csv_path = input_data['csv_path']
    store_id = input_data.get('store_id') or input_data.get('storeId')

    if not store_id:
        print(json.dumps({'error': 'Store ID is required for driver analysis'}), file=sys.stderr)
        sys.exit(1)

    results = analyze_driver_store_performance(csv_path, store_id)

    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()