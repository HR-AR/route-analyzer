#!/usr/bin/env python3
"""
List all available Tableau views for a workbook
"""

import os
import json
import requests
import urllib3
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

server = os.getenv('TABLEAU_SERVER', 'tableau-ecomm.walmart.com')
username = os.getenv('TABLEAU_USERNAME')
password = os.getenv('TABLEAU_PASSWORD')
site_id = os.getenv('TABLEAU_SITE_ID', '')
workbook = os.getenv('TABLEAU_WORKBOOK', 'ProjectCentralSummaryDashboard_UAT')

base_url = f'https://{server}/api/3.19'

# Sign in
url = f'{base_url}/auth/signin'
payload = {
    'credentials': {
        'name': username,
        'password': password,
        'site': {'contentUrl': site_id}
    }
}

response = requests.post(url, json=payload, headers={'Content-Type': 'application/json'}, verify=False)
print(f"Auth response: {response.status_code}")
print(f"Content type: {response.headers.get('content-type')}")
print(f"Response preview: {response.text[:200]}")

if response.status_code != 200:
    print(f"Auth failed: {response.status_code} - {response.text}")
    exit(1)

try:
    data = response.json()
except:
    print(f"Full response: {response.text}")
    raise
auth_token = data['credentials']['token']
site_luid = data['credentials']['site']['id']

print(f"✅ Authenticated successfully\n")

# List all views
url = f'{base_url}/sites/{site_luid}/views'
headers = {
    'X-Tableau-Auth': auth_token,
    'Accept': 'application/json'
}

response = requests.get(url, headers=headers, verify=False)
views_data = response.json()

print(f"📊 Available Views in '{workbook}' workbook:\n")
print(f"{'View Name':<50} {'ID':<40} {'Workbook'}")
print("=" * 120)

for view in views_data.get('views', {}).get('view', []):
    view_name = view.get('name', '')
    view_id = view.get('id', '')
    wb_name = view.get('workbook', {}).get('name', '')
    
    if wb_name == workbook or True:  # Show all views for now
        marker = "✅" if wb_name == workbook else "  "
        print(f"{marker} {view_name:<48} {view_id:<40} {wb_name}")

print("\n" + "=" * 120)
print(f"\n💡 To use a different view, update TABLEAU_VIEW in your .env file")

# Sign out
requests.post(f'{base_url}/auth/signout', headers=headers, verify=False)
