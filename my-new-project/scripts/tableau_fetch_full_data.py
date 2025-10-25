#!/usr/bin/env python3
"""
Tableau Full Data Fetcher
Attempts to fetch the underlying data source ("View Data") instead of just the view output.
"""

import os
import sys
import tableauserverclient as TSC
from dotenv import load_dotenv
import pandas as pd
import argparse
from pathlib import Path
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load environment variables
load_dotenv()


def fetch_full_data():
    """Fetch the underlying data from Tableau view"""
    
    # Configuration
    server_url = f"https://{os.getenv('TABLEAU_SERVER', 'tableau-ecomm.walmart.com')}"
    username = os.getenv('TABLEAU_USERNAME')
    password = os.getenv('TABLEAU_PASSWORD')
    site_id = os.getenv('TABLEAU_SITE_ID', '')
    workbook_name = os.getenv('TABLEAU_WORKBOOK', 'ProjectCentralSummaryDashboard_UAT')
    view_name = os.getenv('TABLEAU_VIEW', 'DailySummary-Agg')
    
    print(f"🔐 Connecting to Tableau Server...")
    print(f"   Server: {server_url}")
    print(f"   User: {username}")
    print(f"   Site: '{site_id}'")
    print()
    
    # Create authentication
    tableau_auth = TSC.TableauAuth(username, password, site_id)
    
    # Create server connection
    server = TSC.Server(server_url, use_server_version=False)
    server.add_http_options({'verify': False})  # Disable SSL verification for internal servers
    
    try:
        # Sign in
        print("🔑 Signing in...")
        server.auth.sign_in(tableau_auth)
        print("✅ Signed in successfully")
        print()
        
        # Find the view
        print(f"🔍 Searching for view: {view_name}...")
        all_views, pagination = server.views.get()
        
        target_view = None
        for view in all_views:
            if view.name == view_name or view_name in view.name:
                print(f"   Found: {view.name} (ID: {view.id})")
                # Get the full view details to see workbook name
                server.views.populate_preview_image(view)
                
                target_view = view
                print(f"✅ Using this view")
                break
        
        if not target_view:
            print(f"❌ Could not find view '{view_name}'")
            print("\nAvailable views (first 10):")
            for v in all_views[:10]:
                print(f"  - {v.name} (ID: {v.id})")
            return None
        
        print()
        print(f"📥 Fetching full data from view...")
        
        # Try to get the data as CSV
        try:
            server.views.populate_csv(target_view)
            csv_data = b''.join(target_view.csv)
            
            print(f"✅ Downloaded {len(csv_data)} bytes")
            return csv_data
            
        except Exception as e:
            print(f"❌ Could not download CSV: {e}")
            print()
            print("💡 The Tableau Server Client library can only download the view output,")
            print("   not the underlying 'Full Data' that you get from the 'View Data' button.")
            print()
            print("   You'll need to manually download the data:")
            print("   1. Open the dashboard in Tableau")
            print("   2. Click on the view")
            print("   3. Click 'View Data' button")
            print("   4. Download as CSV")
            print("   5. Use the manual processing workflow")
            return None
        
    finally:
        # Sign out
        server.auth.sign_out()
        print("✅ Signed out")


def main():
    parser = argparse.ArgumentParser(
        description='Attempt to fetch full data from Tableau view'
    )
    parser.add_argument(
        '--output', '-o',
        default='data/tableau_full_data.csv',
        help='Output file path'
    )
    
    args = parser.parse_args()
    
    # Fetch data
    data = fetch_full_data()
    
    if data:
        # Save to file
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(data)
        
        print(f"\n💾 Data saved to: {output_path}")
        print("\n📊 Checking data format...")
        
        # Try to read and analyze
        try:
            df = pd.read_csv(output_path)
            print(f"   Rows: {len(df)}")
            print(f"   Columns: {len(df.columns)}")
            print(f"   Columns: {', '.join(df.columns[:10])}...")
        except:
            pass
        
        return 0
    else:
        print("\n❌ Could not fetch data programmatically.")
        print("\n📝 Please use the manual download workflow instead.")
        return 1


if __name__ == '__main__':
    sys.exit(main())