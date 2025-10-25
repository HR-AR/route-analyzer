#!/usr/bin/env python3
"""
Extract BigQuery Table from Tableau vizql Endpoint
Attempts to find the underlying BigQuery table by analyzing the vizql view data endpoint.
"""

import os
import sys
import requests
import json
import re
from dotenv import load_dotenv
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Load environment variables
load_dotenv()


def authenticate_tableau():
    """Authenticate with Tableau Server and get session"""
    server = os.getenv('TABLEAU_SERVER', 'tableau-ecomm.walmart.com')
    username = os.getenv('TABLEAU_USERNAME')
    password = os.getenv('TABLEAU_PASSWORD')
    site_id = os.getenv('TABLEAU_SITE_ID', '')
    
    base_url = f'https://{server}/api/3.19'
    
    print(f"🔐 Authenticating with Tableau Server...")
    print(f"   Server: {server}")
    print(f"   User: {username}")
    print()
    
    # Build auth payload
    payload = {
        'credentials': {
            'name': username,
            'password': password,
            'site': {'contentUrl': site_id}
        }
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
    
    try:
        response = requests.post(
            f'{base_url}/auth/signin',
            json=payload,
            headers=headers,
            verify=False
        )
        response.raise_for_status()
        
        data = response.json()
        auth_token = data['credentials']['token']
        site_luid = data['credentials']['site']['id']
        
        print("✅ Authenticated successfully")
        print()
        
        # Create a session with the auth token
        session = requests.Session()
        session.headers.update({
            'X-Tableau-Auth': auth_token,
            'Cookie': f'workgroup_session_id={auth_token}'
        })
        session.verify = False
        
        return session, auth_token, site_luid, server
        
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        return None, None, None, None


def get_view_data_metadata(session, server):
    """Try to get metadata from the view data endpoint"""
    
    # The view we want
    workbook = 'ProjectCentralSummaryDashboard_'
    view_name = 'DailySummary-Agg'
    
    print(f"🔍 Attempting to access view data endpoint...")
    print(f"   Workbook: {workbook}")
    print(f"   View: {view_name}")
    print()
    
    # Try different URL patterns
    urls_to_try = [
        f'https://{server}/views/{workbook}/{view_name}',
        f'https://{server}/t//views/{workbook}/{view_name}',
        f'https://{server}/#/views/{workbook}/{view_name}',
    ]
    
    for url in urls_to_try:
        try:
            print(f"Trying: {url}")
            response = session.get(url, timeout=30)
            
            if response.status_code == 200:
                print(f"✅ Got response ({len(response.text)} bytes)")
                
                # Look for BigQuery references in the HTML/JavaScript
                text = response.text
                
                # Search for various patterns
                patterns = [
                    r'bigquery[^"\s]*',
                    r'wmt-[a-z0-9-]+:[A-Z_]+\.[A-Z_]+',
                    r'WW_LMD_[A-Z_]+\.[A-Z_]+',
                    r'"dataSource"[^}]+"name"\s*:\s*"([^"]+)"',
                    r'"tableName"\s*:\s*"([^"]+)"',
                    r'DATE_LEVEL[^"\s]*',
                    r'PRJ_CENTRAL[^"\s]*',
                ]
                
                found_matches = {}
                for pattern in patterns:
                    matches = re.findall(pattern, text, re.IGNORECASE)
                    if matches:
                        found_matches[pattern] = list(set(matches))[:5]  # Limit to 5 unique matches
                
                if found_matches:
                    print("\n🎯 Found potential references:")
                    for pattern, matches in found_matches.items():
                        print(f"\n  Pattern: {pattern}")
                        for match in matches:
                            print(f"    - {match}")
                    
                    return found_matches
                else:
                    print("  No obvious BigQuery references found")
                    
            else:
                print(f"  Status: {response.status_code}")
                
        except Exception as e:
            print(f"  Error: {e}")
    
    return None


def search_workbook_xml(session, server, auth_token, site_luid):
    """Download and search the workbook XML for data source info"""
    
    print("\n📥 Downloading workbook to analyze data source connections...")
    
    # We already downloaded it, let's parse it more thoroughly
    workbook_file = 'data/Project Central Summary Dashboard_.twb'
    
    if not os.path.exists(workbook_file):
        print("  Workbook file not found, skipping")
        return None
    
    print(f"  Reading: {workbook_file}")
    
    with open(workbook_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Search for BigQuery-related patterns
    patterns = {
        'BigQuery Project': r'project["\s]*[:=]["\s]*([a-z0-9-]+)',
        'BigQuery Dataset': r'dataset["\s]*[:=]["\s]*([A-Z_]+)',
        'BigQuery Table': r'table["\s]*[:=]["\s]*([A-Z_]+)',
        'Connection Server': r'server=["\']([^"\'^]+)["\']',
        'Database Name': r'dbname=["\']([^"\'^]+)["\']',
        'Data Source Name': r'<datasource[^>]*name=["\']([^"\'^]+)["\']',
        'Repository Location': r'repository-location[^>]*id=["\']([^"\'^]+)["\']',
    }
    
    print("\n🔍 Searching workbook XML for BigQuery references...")
    found = {}
    
    for name, pattern in patterns.items():
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            unique_matches = list(set(matches))[:10]
            found[name] = unique_matches
            print(f"\n  {name}:")
            for match in unique_matches:
                print(f"    - {match}")
    
    return found


def main():
    print("\n" + "="*80)
    print("🔍 EXTRACT BIGQUERY TABLE FROM TABLEAU VIZQL")
    print("="*80)
    print()
    
    # Authenticate
    session, auth_token, site_luid, server = authenticate_tableau()
    
    if not session:
        print("❌ Cannot proceed without authentication")
        return 1
    
    # Try method 1: Access view endpoint
    print("="*80)
    print("Method 1: Analyzing View Data Endpoint")
    print("="*80)
    view_data = get_view_data_metadata(session, server)
    
    # Method 2: Parse workbook XML
    print("\n" + "="*80)
    print("Method 2: Analyzing Workbook XML")
    print("="*80)
    workbook_data = search_workbook_xml(session, server, auth_token, site_luid)
    
    # Summary
    print("\n" + "="*80)
    print("📊 SUMMARY & RECOMMENDATIONS")
    print("="*80)
    print()
    
    if workbook_data and 'Database Name' in workbook_data:
        db_names = workbook_data['Database Name']
        print("🎯 Found database/data source names from workbook:")
        for db in db_names:
            print(f"   - {db}")
        print()
        print("These are Tableau's published data source names, not necessarily")
        print("the actual BigQuery table names.")
        print()
    
    print("💡 NEXT STEPS:")
    print()
    print("The Tableau vizql endpoint and workbook use Tableau's SQL proxy,")
    print("which abstracts the actual BigQuery table name.")
    print()
    print("To find the actual BigQuery table, you need to:")
    print()
    print("1. Ask the dashboard owner or data team")
    print("2. Or search BigQuery directly:")
    print()
    print("   gcloud config set project wmt-gdap-dl-sec-lmd-prod")
    print("   bq ls WW_LMD_REPORTING_TABLES")
    print("   bq ls WW_LMD_TABLES")
    print()
    print("3. Look for tables with names similar to:")
    if workbook_data and 'Data Source Name' in workbook_data:
        for name in workbook_data['Data Source Name'][:3]:
            print(f"   - {name}")
    print()
    print("Once you find it, I'll build the automated fetcher!")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())