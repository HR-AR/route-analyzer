#!/usr/bin/env python3
"""
Store-Level Metrics Breakdown Analysis
Provides CPD, Batch Density, Returns, Dwell, and Loading Time metrics
at overall and store-level granularity.
"""

import sys
import json
import pandas as pd
from typing import Dict, Any

def calculate_dph(delivered: int, total_time_hours: float) -> float:
    """Calculate Deliveries Per Hour (DPH)"""
    if total_time_hours == 0:
        return 0
    return delivered / total_time_hours

def calculate_batch_density(total_orders: int, route_count: int) -> float:
    """Calculate Batch Density (total orders per route)"""
    if route_count == 0:
        return 0
    return total_orders / route_count

def analyze_store_metrics(csv_path: str) -> Dict[str, Any]:
    """Analyze store-level metrics from CSV data"""

    df = pd.read_csv(csv_path)

    # Handle different date column names (Tableau uses "Report Date")
    if 'Report Date' in df.columns and 'Date' not in df.columns:
        df['Date'] = pd.to_datetime(df['Report Date'], errors='coerce')
    elif 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    else:
        raise ValueError("CSV must have either 'Date' or 'Report Date' column")

    df = df[df['Date'] >= '2025-10-04']

    # Convert time columns to numeric (minutes)
    df['Driver Dwell Time'] = pd.to_numeric(df['Driver Dwell Time'], errors='coerce')
    df['Driver Load Time'] = pd.to_numeric(df['Driver Load Time'], errors='coerce')
    df['Driver Total Time'] = pd.to_numeric(df['Driver Total Time'], errors='coerce')
    df['Trip Actual Time'] = pd.to_numeric(df['Trip Actual Time'], errors='coerce')
    df['Estimated Duration'] = pd.to_numeric(df['Estimated Duration'], errors='coerce')

    # Convert to hours for DPH calculation
    df['Total Time Hours'] = df['Driver Total Time'] / 60
    df['Actual Time Hours'] = df['Trip Actual Time'] / 60
    df['Planned Time Hours'] = df['Estimated Duration'] / 60

    # Calculate DPH (Deliveries Per Hour)
    df['DPH'] = df.apply(
        lambda row: calculate_dph(row['Delivered Orders'], row['Total Time Hours']),
        axis=1
    )

    # Calculate Variance (Actual - Planned)
    df['Variance Minutes'] = df['Trip Actual Time'] - df['Estimated Duration']
    df['Variance Hours'] = df['Variance Minutes'] / 60

    # Returns Rate
    df['Returns Rate'] = (df['Returned Orders'] / df['Total Orders']).fillna(0)

    # Pending Rate
    df['Pending Rate'] = (df['Pending Orders'] / df['Total Orders']).fillna(0)

    # ===== OVERALL METRICS =====
    total_routes = len(df)
    total_orders = int(df['Total Orders'].sum())

    # Calculate pending orders statistics
    routes_with_pending = df[df['Pending Orders'] > 0]
    high_pending_routes = df[df['Pending Rate'] > 0.20]  # >20% pending

    overall = {
        'total_routes': total_routes,
        'total_orders': total_orders,
        'total_delivered': int(df['Delivered Orders'].sum()),
        'total_returned': int(df['Returned Orders'].sum()),
        'total_failed': int(df['Failed Orders'].sum()),
        'total_pending': int(df['Pending Orders'].sum()),

        # DPH (Deliveries Per Hour)
        'avg_dph': round(df['DPH'].mean(), 2),
        'median_dph': round(df['DPH'].median(), 2),
        'min_dph': round(df['DPH'].min(), 2),
        'max_dph': round(df['DPH'].max(), 2),

        # Batch Density (total orders / total routes)
        'overall_batch_density': round(total_orders / total_routes, 2) if total_routes > 0 else 0,

        # Returns
        'avg_returns_rate': round(df['Returns Rate'].mean() * 100, 2),
        'total_returns_rate': round((df['Returned Orders'].sum() / df['Total Orders'].sum()) * 100, 2),

        # Pending Orders
        'avg_pending_rate': round(df['Pending Rate'].mean() * 100, 2),
        'total_pending_rate': round((df['Pending Orders'].sum() / df['Total Orders'].sum()) * 100, 2),
        'routes_with_pending': len(routes_with_pending),
        'routes_with_high_pending': len(high_pending_routes),  # >20% pending

        # Dwell Time
        'avg_dwell_time': round(df['Driver Dwell Time'].mean(), 2),
        'median_dwell_time': round(df['Driver Dwell Time'].median(), 2),
        'max_dwell_time': round(df['Driver Dwell Time'].max(), 2),

        # Load Time
        'avg_load_time': round(df['Driver Load Time'].mean(), 2),
        'median_load_time': round(df['Driver Load Time'].median(), 2),
        'max_load_time': round(df['Driver Load Time'].max(), 2),

        # Variance (Planned vs Actual)
        'avg_variance_hours': round(df['Variance Hours'].mean(), 2),
        'median_variance_hours': round(df['Variance Hours'].median(), 2),
        'total_variance_hours': round(df['Variance Hours'].sum(), 2),
        'avg_planned_hours': round(df['Planned Time Hours'].mean(), 2),
        'avg_actual_hours': round(df['Actual Time Hours'].mean(), 2),
    }

    # ===== STORE-LEVEL METRICS =====
    store_groups = df.groupby('Store Id')

    store_metrics = []
    for store_id, store_data in store_groups:
        # Calculate pending metrics for this store
        store_pending_routes = store_data[store_data['Pending Orders'] > 0]
        store_high_pending = store_data[store_data['Pending Rate'] > 0.20]

        store_metric = {
            'store_id': int(store_id),
            'route_count': len(store_data),

            # Volume
            'total_orders': int(store_data['Total Orders'].sum()),
            'delivered_orders': int(store_data['Delivered Orders'].sum()),
            'returned_orders': int(store_data['Returned Orders'].sum()),
            'failed_orders': int(store_data['Failed Orders'].sum()),
            'pending_orders': int(store_data['Pending Orders'].sum()),

            # DPH (Deliveries Per Hour)
            'avg_dph': round(store_data['DPH'].mean(), 2),
            'median_dph': round(store_data['DPH'].median(), 2),
            'best_dph': round(store_data['DPH'].max(), 2),
            'worst_dph': round(store_data['DPH'].min(), 2),

            # Batch Density (total orders / route count for this store)
            'batch_density': round(store_data['Total Orders'].sum() / len(store_data), 2),

            # Returns
            'returns_rate': round((store_data['Returned Orders'].sum() / store_data['Total Orders'].sum()) * 100, 2) if store_data['Total Orders'].sum() > 0 else 0,

            # Pending
            'pending_rate': round((store_data['Pending Orders'].sum() / store_data['Total Orders'].sum()) * 100, 2) if store_data['Total Orders'].sum() > 0 else 0,
            'routes_with_pending': len(store_pending_routes),
            'routes_with_high_pending': len(store_high_pending),

            # Dwell Time
            'avg_dwell_time': round(store_data['Driver Dwell Time'].mean(), 2),
            'max_dwell_time': round(store_data['Driver Dwell Time'].max(), 2),

            # Load Time
            'avg_load_time': round(store_data['Driver Load Time'].mean(), 2),
            'max_load_time': round(store_data['Driver Load Time'].max(), 2),

            # Variance
            'avg_variance_hours': round(store_data['Variance Hours'].mean(), 2),
            'avg_planned_hours': round(store_data['Planned Time Hours'].mean(), 2),
            'avg_actual_hours': round(store_data['Actual Time Hours'].mean(), 2),

            # Carriers at this store
            'carriers': store_data['Carrier'].unique().tolist(),
        }
        store_metrics.append(store_metric)

    # Sort stores by DPH (worst to best for troubleshooting)
    store_metrics.sort(key=lambda x: x['avg_dph'])

    # ===== TOP/BOTTOM PERFORMERS =====
    # Convert Date to string for JSON serialization
    df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')

    # Best DPH routes (highest deliveries per hour)
    best_dph_routes = df.nlargest(10, 'DPH')[
        ['Date', 'Store Id', 'Courier Name', 'Carrier', 'DPH', 'Delivered Orders',
         'Total Orders', 'Driver Dwell Time', 'Driver Load Time', 'Driver Total Time',
         'Planned Time Hours', 'Actual Time Hours', 'Variance Hours']
    ].to_dict('records')

    # Worst DPH routes (lowest deliveries per hour)
    worst_dph_routes = df.nsmallest(10, 'DPH')[
        ['Date', 'Store Id', 'Courier Name', 'Carrier', 'DPH', 'Delivered Orders',
         'Total Orders', 'Driver Dwell Time', 'Driver Load Time', 'Driver Total Time',
         'Planned Time Hours', 'Actual Time Hours', 'Variance Hours']
    ].to_dict('records')

    # Highest returns routes
    highest_returns = df.nlargest(10, 'Returned Orders')[
        ['Date', 'Store Id', 'Courier Name', 'Carrier', 'Returned Orders', 'Total Orders',
         'Returns Rate', 'Delivered Orders']
    ].to_dict('records')

    # Highest pending routes
    highest_pending = df.nlargest(10, 'Pending Orders')[
        ['Date', 'Store Id', 'Courier Name', 'Carrier', 'Pending Orders', 'Total Orders',
         'Pending Rate', 'Delivered Orders']
    ].to_dict('records')

    # ===== TOP/BOTTOM STORES BY PERFORMANCE =====
    # Create a copy of store_metrics for ranking
    stores_ranked = store_metrics.copy()

    # Top 10 Best Performing Stores (highest DPH)
    top_10_stores = sorted(stores_ranked, key=lambda x: x['avg_dph'], reverse=True)[:10]

    # Bottom 10 Worst Performing Stores (lowest DPH)
    bottom_10_stores = sorted(stores_ranked, key=lambda x: x['avg_dph'])[:10]

    # Top 10 Stores by Lowest Returns Rate
    best_returns_stores = sorted(stores_ranked, key=lambda x: x['returns_rate'])[:10]

    # Top 10 Stores by Lowest Pending Rate
    best_pending_stores = sorted(stores_ranked, key=lambda x: x['pending_rate'])[:10]

    # Top 10 Stores by Best Variance (closest to or under planned time)
    best_variance_stores = sorted(stores_ranked, key=lambda x: x['avg_variance_hours'])[:10]

    return {
        'overall': overall,
        'store_metrics': store_metrics,
        'best_dph_routes': best_dph_routes,
        'worst_dph_routes': worst_dph_routes,
        'highest_returns': highest_returns,
        'highest_pending': highest_pending,
        # New store-level rankings
        'top_10_stores': top_10_stores,
        'bottom_10_stores': bottom_10_stores,
        'best_returns_stores': best_returns_stores,
        'best_pending_stores': best_pending_stores,
        'best_variance_stores': best_variance_stores,
    }

def main():
    input_data = json.load(sys.stdin)
    csv_path = input_data['csv_path']

    results = analyze_store_metrics(csv_path)

    # Convert to JSON string and replace NaN/Infinity values
    result_json = json.dumps(results, indent=2)
    result_json = result_json.replace('NaN', '0').replace('Infinity', '0').replace('-Infinity', '0')

    print(result_json)

if __name__ == '__main__':
    main()
