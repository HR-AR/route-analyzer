#!/usr/bin/env python3
"""
Explore Tableau Data Sources
Attempt to find and access the underlying data source for the dashboard.
"""

import os
import sys
import tableauserverclient as TSC
from dotenv import load_dotenv
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load environment variables
load_dotenv()


def explore_datasources():
    """Explore available data sources"""
    
    server_url = f"https://{os.getenv('TABLEAU_SERVER', 'tableau-ecomm.walmart.com')}"
    username = os.getenv('TABLEAU_USERNAME')
    password = os.getenv('TABLEAU_PASSWORD')
    site_id = os.getenv('TABLEAU_SITE_ID', '')
    
    print(f"🔐 Connecting to Tableau Server...")
    print(f"   Server: {server_url}")
    print()
    
    # Create authentication
    tableau_auth = TSC.TableauAuth(username, password, site_id)
    
    # Create server connection
    server = TSC.Server(server_url, use_server_version=False)
    server.add_http_options({'verify': False})
    
    try:
        # Sign in
        print("🔑 Signing in...")
        server.auth.sign_in(tableau_auth)
        print("✅ Signed in successfully")
        print()
        
        # Get workbooks
        print("📚 Searching for workbooks...")
        all_workbooks, pagination = server.workbooks.get()
        
        target_workbook = None
        for wb in all_workbooks:
            if 'ProjectCentralSummary' in wb.name or 'DailySummary' in wb.name:
                print(f"   Found: {wb.name} (ID: {wb.id})")
                target_workbook = wb
                break
        
        if not target_workbook:
            print("❌ Could not find the target workbook")
            print("\nAvailable workbooks (first 10):")
            for wb in all_workbooks[:10]:
                print(f"  - {wb.name}")
            return
        
        print()
        print(f"📊 Exploring workbook: {target_workbook.name}")
        print()
        
        # Get data sources for this workbook
        print("🔍 Looking for data sources...")
        all_datasources, pagination = server.datasources.get()
        
        print(f"\nFound {len(all_datasources)} data sources on the server")
        print("\nSearching for relevant data sources...")
        print()
        
        for ds in all_datasources:
            if 'Daily' in ds.name or 'Summary' in ds.name or 'Project' in ds.name or 'Central' in ds.name:
                print(f"📂 Data Source: {ds.name}")
                print(f"   ID: {ds.id}")
                print(f"   Project: {ds.project_name}")
                print(f"   Type: {ds.datasource_type}")
                print(f"   Created: {ds.created_at}")
                
                # Try to get more details
                try:
                    server.datasources.populate_connections(ds)
                    if hasattr(ds, 'connections') and ds.connections:
                        print(f"   Connections:")
                        for conn in ds.connections:
                            print(f"      - Server: {conn.server_address if hasattr(conn, 'server_address') else 'N/A'}")
                            print(f"        Database: {conn.database_name if hasattr(conn, 'database_name') else 'N/A'}")
                            print(f"        Type: {conn.connection_type if hasattr(conn, 'connection_type') else 'N/A'}")
                except Exception as e:
                    print(f"   Could not get connection details: {e}")
                
                print()
        
        # Try to get workbook connections
        print("🔗 Trying to get workbook connections...")
        try:
            server.workbooks.populate_connections(target_workbook)
            if hasattr(target_workbook, 'connections') and target_workbook.connections:
                print("Found workbook connections:")
                for conn in target_workbook.connections:
                    print(f"  - Server: {conn.server_address if hasattr(conn, 'server_address') else 'N/A'}")
                    print(f"    Database: {conn.database_name if hasattr(conn, 'database_name') else 'N/A'}")
                    print(f"    Type: {conn.connection_type if hasattr(conn, 'connection_type') else 'N/A'}")
                    print()
        except Exception as e:
            print(f"Could not get workbook connections: {e}")
            print()
        
        print("\n💡 ANALYSIS:")
        print("="*80)
        print("If the data source is:")
        print("  - A database → We can query it directly if we have credentials")
        print("  - A .hyper extract → We might be able to download and read it")
        print("  - A cloud source → We might be able to access via API")
        print("  - Embedded in workbook → We're limited to Tableau's export")
        print()
        
    finally:
        # Sign out
        server.auth.sign_out()
        print("✅ Signed out")


if __name__ == '__main__':
    explore_datasources()