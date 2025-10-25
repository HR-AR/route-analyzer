#!/usr/bin/env python3
"""
Batch Density Day-by-Day Analysis
Shows if low batch density is consistent or only on specific days
"""

import sys
import json
import pandas as pd
from typing import Dict, Any, List

def analyze_batch_by_day(csv_path: str, focus_stores: List[int] = None) -> Dict[str, Any]:
    """Analyze batch density day-by-day for specific stores"""

    df = pd.read_csv(csv_path)

    # Convert Date column to datetime and filter for Oct 4th onwards
    df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    df = df[df['Date'] >= '2025-10-04']

    # If focus_stores specified, filter to those stores
    if focus_stores and len(focus_stores) > 0:
        df = df[df['Store Id'].isin(focus_stores)]

    # Group by Store and Date
    store_day_groups = df.groupby(['Store Id', 'Date'])

    day_by_day_analysis = []
    for (store_id, date), group_data in store_day_groups:
        route_count = len(group_data)
        total_orders = int(group_data['Total Orders'].sum())
        batch_density = round(total_orders / route_count, 2) if route_count > 0 else 0

        day_by_day_analysis.append({
            'store_id': int(store_id),
            'date': date.strftime('%Y-%m-%d'),
            'day_of_week': date.strftime('%A'),
            'route_count': route_count,
            'total_orders': total_orders,
            'batch_density': batch_density,
            'carriers': group_data['Carrier'].unique().tolist(),
            'couriers': group_data['Courier Name'].unique().tolist(),
        })

    # Sort by store and date
    day_by_day_analysis.sort(key=lambda x: (x['store_id'], x['date']))

    # Calculate store-level summary
    store_summary = {}
    df_store_groups = df.groupby('Store Id')

    for store_id, store_data in df_store_groups:
        dates = store_data['Date'].unique()
        route_counts_by_day = []
        batch_densities_by_day = []

        for date in dates:
            day_data = store_data[store_data['Date'] == date]
            routes = len(day_data)
            orders = int(day_data['Total Orders'].sum())
            batch = round(orders / routes, 2) if routes > 0 else 0
            route_counts_by_day.append(routes)
            batch_densities_by_day.append(batch)

        store_summary[int(store_id)] = {
            'days_operated': len(dates),
            'total_routes': len(store_data),
            'total_orders': int(store_data['Total Orders'].sum()),
            'overall_batch_density': round(int(store_data['Total Orders'].sum()) / len(store_data), 2),
            'min_batch_density': round(min(batch_densities_by_day), 2) if batch_densities_by_day else 0,
            'max_batch_density': round(max(batch_densities_by_day), 2) if batch_densities_by_day else 0,
            'avg_batch_density': round(sum(batch_densities_by_day) / len(batch_densities_by_day), 2) if batch_densities_by_day else 0,
            'batch_density_std': round(pd.Series(batch_densities_by_day).std(), 2) if len(batch_densities_by_day) > 1 else 0,
            'consistency': 'High' if (pd.Series(batch_densities_by_day).std() if len(batch_densities_by_day) > 1 else 0) < 5 else 'Low',
        }

    return {
        'day_by_day': day_by_day_analysis,
        'store_summary': store_summary,
    }

def main():
    input_data = json.load(sys.stdin)
    csv_path = input_data['csv_path']
    focus_stores = input_data.get('focus_stores', None)

    results = analyze_batch_by_day(csv_path, focus_stores)

    print(json.dumps(results, indent=2))

if __name__ == '__main__':
    main()
