#!/usr/bin/env python3
"""
Tableau Authentication Tester
Helps diagnose authentication issues with Tableau Server.
"""

import os
import json
import requests
import urllib3
from dotenv import load_dotenv

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

def test_tableau_auth():
    """Test Tableau authentication with detailed diagnostics"""
    
    server = os.getenv('TABLEAU_SERVER', 'tableau-ecomm.walmart.com')
    token_name = os.getenv('TABLEAU_TOKEN_NAME')
    token_secret = os.getenv('TABLEAU_TOKEN_SECRET')
    site_id = os.getenv('TABLEAU_SITE_ID', '')
    
    print("🔍 Tableau Authentication Diagnostics\n")
    print("Configuration:")
    print(f"  Server: {server}")
    print(f"  Token Name: {token_name}")
    print(f"  Token Secret: {token_secret[:10]}... (length: {len(token_secret)})")
    print(f"  Site ID: '{site_id}'")
    print()
    
    # Test different API versions
    api_versions = ['3.19', '3.18', '3.17', '3.16', '3.15']
    
    for version in api_versions:
        print(f"\nTrying API version {version}...")
        url = f'https://{server}/api/{version}/auth/signin'
        
        payload = {
            'credentials': {
                'personalAccessTokenName': token_name,
                'personalAccessTokenSecret': token_secret,
                'site': {'contentUrl': site_id}
            }
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, verify=False, timeout=10)
            
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ SUCCESS!")
                print(f"  Auth Token: {data['credentials']['token'][:20]}...")
                print(f"  Site LUID: {data['credentials']['site']['id']}")
                print(f"\n🎉 Authentication works with API version {version}!")
                return
            else:
                print(f"  ❌ Failed: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"  ❌ Error: {e}")
    
    print("\n\n👉 Troubleshooting Steps:\n")
    print("1. Go to: https://tableau-ecomm.walmart.com")
    print("2. Sign in with your Walmart credentials")
    print("3. Click your profile icon (top right) → My Account Settings")
    print("4. Go to 'Settings' tab")
    print("5. Scroll to 'Personal Access Tokens'")
    print("6. Check if the token 'HAR' is listed and active")
    print("7. If not, create a new token:")
    print("   - Click 'Create new token'")
    print("   - Token name: HAR (or any name)")
    print("   - Copy BOTH the token name AND token secret")
    print("   - Update your .env file with the new values")
    print("\n8. Make sure the token has not expired")
    print("9. Verify you have permission to access the dashboard/view")

if __name__ == '__main__':
    test_tableau_auth()
