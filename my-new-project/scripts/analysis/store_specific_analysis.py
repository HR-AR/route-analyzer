#!/usr/bin/env python3
"""
Store-Specific Analysis
Deep dive into a specific store's performance
"""

import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime


def clean_for_json(obj):
    """Replace NaN and infinity values with None for JSON serialization"""
    if isinstance(obj, dict):
        return {k: clean_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_for_json(item) for item in obj]
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return None
        return obj
    return obj


def parse_datetime(dt_str: str) -> datetime:
    """Parse datetime string in format: MM/DD/YYYY HH:MM:SS AM/PM"""
    try:
        return datetime.strptime(dt_str, "%m/%d/%Y %I:%M:%S %p")
    except:
        return None


def analyze_store(csv_path: str, store_id: str) -> dict:
    """Analyze all routes for a specific store"""
    df = pd.read_csv(csv_path)

    # Filter to specific store
    store_df = df[df['Store Id'].astype(str) == str(store_id)].copy()

    if len(store_df) == 0:
        return {
            'error': f'No routes found for Store {store_id}',
            'store_id': store_id
        }

    # Sort by date
    store_df['Date'] = pd.to_datetime(store_df['Date'])
    store_df = store_df.sort_values('Date')

    # Calculate metrics
    store_df['trip_actual_hours'] = store_df['Trip Actual Time'] / 60
    store_df['estimated_hours'] = store_df['Estimated Duration'] / 60
    store_df['variance_hours'] = (store_df['Trip Actual Time'] - store_df['Estimated Duration']) / 60
    store_df['variance_pct'] = (store_df['variance_hours'] / store_df['estimated_hours'] * 100).fillna(0)

    # Get departure time category
    def get_hour(dt_str):
        dt = parse_datetime(dt_str)
        return dt.hour if dt else None

    store_df['pickup_hour'] = store_df['Trip Planned Start'].apply(get_hour)
    store_df['departure_category'] = store_df['pickup_hour'].apply(
        lambda h: '10AM' if h == 10 else ('12PM' if h is not None and h >= 11 and h <= 12 else 'Other')
    )

    # Overall summary
    routes_with_pending = store_df[(store_df['Pending Orders'].notna()) & (store_df['Pending Orders'] > 0)]

    summary = {
        'store_id': store_id,
        'total_routes': len(store_df),
        'date_range': {
            'start': store_df['Date'].min().strftime('%Y-%m-%d'),
            'end': store_df['Date'].max().strftime('%Y-%m-%d')
        },
        'carriers': store_df['Carrier'].unique().tolist(),
        'total_drivers': store_df['Courier Name'].nunique(),

        # Time metrics
        'avg_dwell_time_min': round(store_df['Driver Dwell Time'].mean(), 2),
        'avg_load_time_min': round(store_df['Driver Load Time'].mean(), 2),
        'avg_trip_actual_hours': round(store_df['trip_actual_hours'].mean(), 2),
        'avg_estimated_hours': round(store_df['estimated_hours'].mean(), 2),
        'avg_variance_hours': round(store_df['variance_hours'].mean(), 2),
        'avg_variance_pct': round(store_df['variance_pct'].mean(), 2),

        # Order metrics
        'avg_orders': round(store_df['Total Orders'].mean(), 2),
        'total_orders_delivered': int(store_df['Delivered Orders'].sum()),
        'avg_drops_per_hour': round(store_df['Drops Per Hour Trip'].mean(), 2),

        # Pending orders
        'total_pending': int(store_df['Pending Orders'].sum()),
        'routes_with_pending': len(routes_with_pending),
        'pending_rate': round((store_df['Pending Orders'].sum() / store_df['Total Orders'].sum()) * 100, 2) if store_df['Total Orders'].sum() > 0 else 0,
    }

    # Day by day breakdown
    daily_routes = []
    for _, row in store_df.iterrows():
        route = {
            'date': row['Date'].strftime('%Y-%m-%d'),
            'carrier': row['Carrier'],
            'driver': row['Courier Name'],
            'departure_time': row['Trip Planned Start'],
            'departure_category': row['departure_category'],

            # Times
            'dwell_time_min': round(row['Driver Dwell Time'], 2),
            'load_time_min': round(row['Driver Load Time'], 2),
            'sort_time_min': round(row['Driver Sort Time'], 2),
            'store_time_min': round(row['Driver Store Time'], 2),
            'trip_actual_hours': round(row['trip_actual_hours'], 2),
            'estimated_hours': round(row['estimated_hours'], 2),
            'variance_hours': round(row['variance_hours'], 2),
            'variance_pct': round(row['variance_pct'], 2),

            # Orders
            'total_orders': int(row['Total Orders']),
            'delivered_orders': int(row['Delivered Orders']),
            'failed_orders': int(row['Failed Orders']) if pd.notna(row['Failed Orders']) else 0,
            'pending_orders': int(row['Pending Orders']) if pd.notna(row['Pending Orders']) else 0,
            'drops_per_hour': round(row['Drops Per Hour Trip'], 2),

            # Flags
            'extended_dwell': row['Driver Dwell Time'] > 30,
            'extended_load': row['Driver Load Time'] > 60,
            'over_estimated': row['Trip Actual Time'] > row['Estimated Duration'],
            'variance_significant': abs(row['variance_pct']) > 10
        }
        daily_routes.append(route)

    # Identify issues
    issues = []

    for route in daily_routes:
        route_issues = []
        if route['extended_dwell']:
            route_issues.append(f"Extended dwell time ({route['dwell_time_min']} min)")
        if route['extended_load']:
            route_issues.append(f"Extended load time ({route['load_time_min']} min)")
        if route['variance_significant']:
            route_issues.append(f"Significant variance ({route['variance_pct']:.1f}% from estimate)")
        if route['pending_orders'] > 0:
            route_issues.append(f"{route['pending_orders']} pending orders")

        if route_issues:
            issues.append({
                'date': route['date'],
                'driver': route['driver'],
                'carrier': route['carrier'],
                'issues': route_issues
            })

    # Trends
    trends = {
        'best_day': None,
        'worst_day': None,
        'most_consistent_driver': None,
        'most_variable_driver': None
    }

    if len(daily_routes) > 0:
        # Best/worst by variance
        sorted_by_variance = sorted(daily_routes, key=lambda x: x['variance_hours'])
        trends['best_day'] = {
            'date': sorted_by_variance[0]['date'],
            'driver': sorted_by_variance[0]['driver'],
            'variance_hours': sorted_by_variance[0]['variance_hours'],
            'reason': f"{sorted_by_variance[0]['variance_hours']:.1f} hours under estimate"
        }
        trends['worst_day'] = {
            'date': sorted_by_variance[-1]['date'],
            'driver': sorted_by_variance[-1]['driver'],
            'variance_hours': sorted_by_variance[-1]['variance_hours'],
            'reason': f"{sorted_by_variance[-1]['variance_hours']:.1f} hours over estimate"
        }

        # Driver consistency (only if multiple drivers and valid std values)
        driver_variance = store_df.groupby('Courier Name')['variance_pct'].agg(['mean', 'std']).round(2)
        driver_variance = driver_variance.dropna()  # Remove NaN values

        if len(driver_variance) > 1:  # Need at least 2 drivers for comparison
            most_consistent = driver_variance['std'].idxmin()
            most_variable = driver_variance['std'].idxmax()

            if pd.notna(most_consistent):
                trends['most_consistent_driver'] = {
                    'name': most_consistent,
                    'avg_variance_pct': float(driver_variance.loc[most_consistent, 'mean']),
                    'std_dev': float(driver_variance.loc[most_consistent, 'std'])
                }
            if pd.notna(most_variable):
                trends['most_variable_driver'] = {
                    'name': most_variable,
                    'avg_variance_pct': float(driver_variance.loc[most_variable, 'mean']),
                    'std_dev': float(driver_variance.loc[most_variable, 'std'])
                }

    return {
        'summary': summary,
        'daily_routes': daily_routes,
        'issues': issues,
        'trends': trends
    }


def main():
    """Main entry point"""
    try:
        input_data = json.loads(sys.stdin.read())
        csv_path = input_data.get('csv_path')
        store_id = input_data.get('store_id')

        if not csv_path or not store_id:
            raise ValueError("csv_path and store_id are required")

        results = analyze_store(csv_path, store_id)
        # Clean NaN/inf values before JSON serialization
        results = clean_for_json(results)
        print(json.dumps(results, indent=2))
        sys.exit(0)

    except Exception as e:
        sys.stderr.write(f"Error: {str(e)}\n")
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
