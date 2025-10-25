#!/usr/bin/env python3
"""
Tableau Data Fetcher
Fetches data from Tableau Server using REST API and exports as CSV.
"""

import os
import sys
import json
import requests
import argparse
import urllib3
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path
from dotenv import load_dotenv

# Disable SSL warnings for internal servers with self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load environment variables from .env file
load_dotenv()

class TableauFetcher:
    """Tableau Server REST API Client"""

    def __init__(self):
        self.server = os.getenv('TABLEAU_SERVER', 'tableau-ecomm.walmart.com')
        self.auth_method = os.getenv('TABLEAU_AUTH_METHOD', 'password')
        
        # Token-based auth
        self.token_name = os.getenv('TABLEAU_TOKEN_NAME')
        self.token_secret = os.getenv('TABLEAU_TOKEN_SECRET')
        
        # Username/password auth
        self.username = os.getenv('TABLEAU_USERNAME')
        self.password = os.getenv('TABLEAU_PASSWORD')
        
        self.site_id = os.getenv('TABLEAU_SITE_ID', '')
        self.workbook = os.getenv('TABLEAU_WORKBOOK', 'ProjectCentralSummaryDashboard_UAT')
        self.view = os.getenv('TABLEAU_VIEW', 'DailySummary-Agg')
        
        self.base_url = f'https://{self.server}/api/3.19'
        self.auth_token = None
        self.site_luid = None

        # Validate credentials based on auth method
        if self.auth_method == 'token':
            if not self.token_name or not self.token_secret:
                raise ValueError(
                    "Token auth selected but credentials not found. "
                    "Set TABLEAU_TOKEN_NAME and TABLEAU_TOKEN_SECRET in .env"
                )
        elif self.auth_method == 'password':
            if not self.username or not self.password:
                raise ValueError(
                    "Password auth selected but credentials not found. "
                    "Set TABLEAU_USERNAME and TABLEAU_PASSWORD in .env"
                )
        else:
            raise ValueError(f"Invalid TABLEAU_AUTH_METHOD: {self.auth_method}")

    def sign_in(self) -> None:
        """Authenticate with Tableau Server"""
        url = f'{self.base_url}/auth/signin'
        
        # Build payload based on auth method
        if self.auth_method == 'token':
            payload = {
                'credentials': {
                    'personalAccessTokenName': self.token_name,
                    'personalAccessTokenSecret': self.token_secret,
                    'site': {'contentUrl': self.site_id}
                }
            }
            auth_info = f"Token: {self.token_name[:10]}..."
        else:  # password
            payload = {
                'credentials': {
                    'name': self.username,
                    'password': self.password,
                    'site': {'contentUrl': self.site_id}
                }
            }
            auth_info = f"Username: {self.username}"
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        print(f"🔐 Attempting authentication...")
        print(f"   Server: {self.server}")
        print(f"   Method: {self.auth_method}")
        print(f"   {auth_info}")
        print(f"   Site Content URL: '{self.site_id}'")
        
        try:
            # Disable SSL verification for internal Walmart servers with self-signed certs
            response = requests.post(url, json=payload, headers=headers, verify=False)
            response.raise_for_status()
            
            data = response.json()
            self.auth_token = data['credentials']['token']
            self.site_luid = data['credentials']['site']['id']
            
            print(f"✅ Successfully authenticated with Tableau Server")
            print(f"   Site ID: {self.site_luid}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Authentication failed: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response: {e.response.text}")
            raise

    def sign_out(self) -> None:
        """Sign out from Tableau Server"""
        if not self.auth_token:
            return
            
        url = f'{self.base_url}/auth/signout'
        headers = {
            'X-Tableau-Auth': self.auth_token,
            'Content-Type': 'application/json'
        }
        
        try:
            requests.post(url, headers=headers, verify=False)
            print("✅ Signed out from Tableau Server")
        except:
            pass  # Don't fail on sign out errors

    def get_view_id(self) -> str:
        """Get the view ID for the specified workbook and view name"""
        url = f'{self.base_url}/sites/{self.site_luid}/views'
        headers = {
            'X-Tableau-Auth': self.auth_token,
            'Accept': 'application/json'
        }
        
        params = {
            'filter': f'viewUrlName:eq:{self.view}'
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, verify=False)
            response.raise_for_status()
            
            data = response.json()
            views = data.get('views', {}).get('view', [])
            
            # Find the view that matches our workbook
            for view in views:
                workbook_name = view.get('workbook', {}).get('name', '')
                if workbook_name == self.workbook:
                    view_id = view['id']
                    print(f"✅ Found view: {view['name']} (ID: {view_id})")
                    return view_id
            
            # If no exact match, return the first view
            if views:
                view_id = views[0]['id']
                print(f"⚠️  Using first matching view: {views[0]['name']} (ID: {view_id})")
                return view_id
            
            raise ValueError(f"View '{self.view}' not found in workbook '{self.workbook}'")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to get view ID: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   Response: {e.response.text}")
            raise

    def query_view_data(self, view_id: str, filters: Optional[Dict[str, str]] = None) -> bytes:
        """Query view data and return CSV content"""
        # Try the image/data endpoint first (works for some views)
        url = f'{self.base_url}/sites/{self.site_luid}/views/{view_id}/data'
        
        headers = {
            'X-Tableau-Auth': self.auth_token,
        }
        
        # Build filter parameters using vf_ prefix (Tableau view filters)
        params = {}
        if filters:
            for filter_name, filter_value in filters.items():
                # Tableau uses vf_<field_name>=<value> for view filters
                params[f'vf_{filter_name}'] = filter_value
            print(f"🔍 Applying filters: {params}")
        
        # Try different accept types
        accept_types = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',  # Excel
            'text/csv',  # CSV
            'application/json',  # JSON
        ]
        
        for accept_type in accept_types:
            try:
                print(f"📥 Querying view data (format: {accept_type.split('/')[-1]})...")
                headers['Accept'] = accept_type
                
                response = requests.get(url, headers=headers, params=params, verify=False, timeout=60)
                
                if response.status_code == 200:
                    print(f"✅ Successfully downloaded data ({len(response.content)} bytes)")
                    
                    # If it's Excel, we need to convert it
                    if 'excel' in accept_type or 'spreadsheet' in accept_type:
                        print("   Note: Downloaded as Excel format")
                    
                    return response.content
                else:
                    print(f"   {response.status_code} - Trying next format...")
                    
            except requests.exceptions.RequestException as e:
                print(f"   Failed with {accept_type}: {e}")
                continue
        
        # If all methods fail, raise error
        raise Exception(
            f"Could not download view data with any format. "
            f"The view might not support data export via API."
        )

    def fetch_data(self, 
                   output_file: str,
                   start_date: Optional[str] = None,
                   end_date: Optional[str] = None,
                   store_id: Optional[str] = None,
                   carrier: Optional[str] = None,
                   os_filter: Optional[str] = None,
                   client: Optional[str] = None) -> str:
        """Fetch data from Tableau and save as CSV/Excel"""
        
        try:
            # Sign in
            self.sign_in()
            
            # Get view ID
            view_id = self.get_view_id()
            
            # Build filters
            filters = {}
            if start_date:
                filters['Start Date'] = start_date
            if end_date:
                filters['End Date'] = end_date
            if store_id:
                filters['Store Id'] = store_id
            if carrier:
                filters['Carrier'] = carrier
            if os_filter:
                filters['OS'] = os_filter
            if client:
                filters['Client'] = client
            
            # Query data
            data = self.query_view_data(view_id, filters)
            
            # Save to file
            output_path = Path(output_file)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Check if data is Excel format and convert to CSV if needed
            if output_file.endswith('.csv'):
                # Try to detect if it's Excel format
                if data[:4] == b'PK\x03\x04':  # Excel file signature
                    print("📊 Converting Excel to CSV...")
                    import pandas as pd
                    import io
                    
                    # Read Excel from bytes
                    df = pd.read_excel(io.BytesIO(data))
                    
                    # Apply additional filters if API filtering didn't work
                    if carrier and 'Carrier' in df.columns:
                        original_len = len(df)
                        df = df[df['Carrier'] == carrier]
                        print(f"   Filtered by Carrier={carrier}: {original_len} → {len(df)} rows")
                    
                    if os_filter and 'OS' in df.columns:
                        original_len = len(df)
                        df = df[df['OS'] == int(os_filter)]
                        print(f"   Filtered by OS={os_filter}: {original_len} → {len(df)} rows")
                    
                    if client and 'Client' in df.columns:
                        original_len = len(df)
                        df = df[df['Client'] == client]
                        print(f"   Filtered by Client={client}: {original_len} → {len(df)} rows")
                    
                    # Save as CSV
                    df.to_csv(output_path, index=False)
                    print(f"💾 Data saved to: {output_file} ({len(df)} rows)")
                else:
                    # Already CSV
                    output_path.write_bytes(data)
                    print(f"💾 Data saved to: {output_file}")
            else:
                # Save as-is
                output_path.write_bytes(data)
                print(f"💾 Data saved to: {output_file}")
            
            return str(output_path.absolute())
            
        finally:
            # Always sign out
            self.sign_out()


def main():
    parser = argparse.ArgumentParser(
        description='Fetch delivery route data from Tableau Server'
    )
    parser.add_argument(
        '--output', '-o',
        default='data/tableau_export.csv',
        help='Output CSV file path (default: data/tableau_export.csv)'
    )
    parser.add_argument(
        '--start-date',
        help='Start date filter (YYYY-MM-DD)'
    )
    parser.add_argument(
        '--end-date',
        help='End date filter (YYYY-MM-DD)'
    )
    parser.add_argument(
        '--store',
        help='Store ID filter'
    )
    parser.add_argument(
        '--days',
        type=int,
        help='Fetch last N days of data (alternative to start-date/end-date)'
    )
    parser.add_argument(
        '--carrier',
        help='Filter by Carrier (e.g., nash, NTG, etc.)'
    )
    parser.add_argument(
        '--os',
        help='Filter by OS value (e.g., 0, 1, etc.)'
    )
    parser.add_argument(
        '--client',
        help='Filter by Client (e.g., Walmart)'
    )
    
    args = parser.parse_args()
    
    # Handle --days shortcut
    start_date = args.start_date
    end_date = args.end_date
    
    if args.days:
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=args.days)).strftime('%Y-%m-%d')
    
    try:
        fetcher = TableauFetcher()
        output_path = fetcher.fetch_data(
            output_file=args.output,
            start_date=start_date,
            end_date=end_date,
            store_id=args.store,
            carrier=args.carrier,
            os_filter=args.os,
            client=args.client
        )
        
        print(f"\n🎉 SUCCESS! Data fetched and saved to: {output_path}")
        print(f"\nNext steps:")
        print(f"  npm run store-metrics -- {output_path}")
        print(f"  npm run driver-store-analysis -- <store-id> {output_path}")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
