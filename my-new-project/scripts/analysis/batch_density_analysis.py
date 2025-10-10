#!/usr/bin/env python3
"""
Batch Density Analysis
Shows top/bottom 10 batch densities and calculates overall metrics with exclusions
"""

import sys
import json
import pandas as pd
from typing import Dict, Any, List

def analyze_batch_density(csv_path: str, exclude_stores: List[int] = None) -> Dict[str, Any]:
    """Analyze batch density metrics with optional store exclusions"""

    if exclude_stores is None:
        exclude_stores = []

    df = pd.read_csv(csv_path)

    # Convert Date column to datetime and filter for Oct 4th onwards
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df[df['Date'] >= '2025-10-04']

    # Create two datasets: full and filtered (excluding stores)
    df_full = df.copy()
    df_filtered = df[~df['Store Id'].isin(exclude_stores)].copy()

    # ===== FULL DATASET METRICS =====
    total_routes_full = len(df_full)
    total_orders_full = int(df_full['Total Orders'].sum())
    overall_batch_density_full = round(total_orders_full / total_routes_full, 2) if total_routes_full > 0 else 0

    # ===== FILTERED DATASET METRICS (excluding stores) =====
    total_routes_filtered = len(df_filtered)
    total_orders_filtered = int(df_filtered['Total Orders'].sum())
    overall_batch_density_filtered = round(total_orders_filtered / total_routes_filtered, 2) if total_routes_filtered > 0 else 0

    # ===== STORE-LEVEL BATCH DENSITY =====
    store_groups = df_full.groupby('Store Id')

    store_batch_densities = []
    for store_id, store_data in store_groups:
        route_count = len(store_data)
        total_orders = int(store_data['Total Orders'].sum())
        batch_density = round(total_orders / route_count, 2)

        store_batch_densities.append({
            'store_id': int(store_id),
            'route_count': route_count,
            'total_orders': total_orders,
            'batch_density': batch_density,
            'carriers': store_data['Carrier'].unique().tolist(),
        })

    # Sort by batch density
    store_batch_densities.sort(key=lambda x: x['batch_density'])

    # Top 10 lowest and highest
    lowest_10 = store_batch_densities[:10]
    highest_10 = store_batch_densities[-10:][::-1]  # Reverse to show highest first

    # ===== INDIVIDUAL ROUTE BATCH SIZES =====
    # Convert Date to string for JSON serialization
    df_full['Date'] = df_full['Date'].dt.strftime('%Y-%m-%d')

    # Get individual routes sorted by batch size
    routes_with_batch = df_full[['Date', 'Store Id', 'Courier Name', 'Carrier', 'Total Orders']].copy()
    routes_with_batch = routes_with_batch.sort_values('Total Orders')

    lowest_10_routes = routes_with_batch.head(10).to_dict('records')
    highest_10_routes = routes_with_batch.tail(10).iloc[::-1].to_dict('records')  # Reverse for highest first

    return {
        'full_dataset': {
            'total_routes': total_routes_full,
            'total_orders': total_orders_full,
            'overall_batch_density': overall_batch_density_full,
        },
        'filtered_dataset': {
            'excluded_stores': exclude_stores,
            'total_routes': total_routes_filtered,
            'total_orders': total_orders_filtered,
            'overall_batch_density': overall_batch_density_filtered,
            'routes_removed': total_routes_full - total_routes_filtered,
            'orders_removed': total_orders_full - total_orders_filtered,
            'batch_density_change': round(overall_batch_density_filtered - overall_batch_density_full, 2),
        },
        'store_level': {
            'total_stores': len(store_batch_densities),
            'lowest_10_stores': lowest_10,
            'highest_10_stores': highest_10,
        },
        'route_level': {
            'lowest_10_routes': lowest_10_routes,
            'highest_10_routes': highest_10_routes,
        }
    }

def main():
    input_data = json.load(sys.stdin)
    csv_path = input_data['csv_path']
    exclude_stores = input_data.get('exclude_stores', [])

    results = analyze_batch_density(csv_path, exclude_stores)

    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
