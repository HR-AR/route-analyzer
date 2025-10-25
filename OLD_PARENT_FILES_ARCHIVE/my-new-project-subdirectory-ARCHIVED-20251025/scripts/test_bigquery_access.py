#!/usr/bin/env python3
"""
Test BigQuery Access
Check if you have access to the Walmart BigQuery table.
"""

import sys
import subprocess

def run_command(cmd, description):
    """Run a shell command and return output"""
    print(f"\n{'='*80}")
    print(f"🔍 {description}")
    print(f"{'='*80}")
    print(f"Running: {cmd}")
    print()
    
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.stdout:
            print(result.stdout)
        if result.stderr and 'WARNING' not in result.stderr:
            print("Errors/Warnings:")
            print(result.stderr)
        
        return result.returncode == 0, result.stdout
        
    except subprocess.TimeoutExpired:
        print("❌ Command timed out")
        return False, ""
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, ""


def main():
    print("\n" + "="*80)
    print("🧪 BIGQUERY ACCESS TEST")
    print("="*80)
    print()
    print("This will check if you have access to the BigQuery table that")
    print("powers the Tableau dashboard.")
    print()
    
    # Test 1: Check gcloud is installed
    success, _ = run_command(
        "gcloud --version",
        "Step 1: Checking gcloud installation"
    )
    
    if not success:
        print("\n❌ gcloud CLI is not installed or not in PATH")
        print("\nInstall it from: https://cloud.google.com/sdk/docs/install")
        return 1
    
    print("✅ gcloud CLI is installed")
    
    # Test 2: Check authentication
    success, output = run_command(
        "gcloud auth list",
        "Step 2: Checking authentication"
    )
    
    if not success:
        print("\n❌ Not authenticated with gcloud")
        print("\nRun: gcloud auth login")
        return 1
    
    # Check if authenticated with Walmart account
    if 'walmart.com' in output or 'homeoffice.wal-mart.com' in output:
        print("✅ Authenticated with Walmart account!")
        walmart_auth = True
    else:
        print("⚠️  Not authenticated with Walmart account")
        print("   Currently authenticated with:", output.split('*')[1].split()[0] if '*' in output else "unknown")
        print("\n   To authenticate with Walmart:")
        print("   gcloud auth login")
        print("   (Use your h0r03cw@homeoffice.wal-mart.com or @walmart.com email)")
        walmart_auth = False
    
    # Test 3: List projects
    success, output = run_command(
        "gcloud projects list 2>&1",
        "Step 3: Listing accessible GCP projects"
    )
    
    if not success or not output.strip():
        print("\n❌ Cannot list projects or no projects accessible")
        if not walmart_auth:
            print("   This is likely because you're not authenticated with Walmart account")
        return 1
    
    # Look for Walmart/LMD/ecom projects
    walmart_projects = []
    for line in output.split('\n'):
        if any(keyword in line.lower() for keyword in ['walmart', 'wmt', 'ecom', 'lmd', 'delivery', 'tab']):
            walmart_projects.append(line.strip())
    
    if walmart_projects:
        print("\n✅ Found Walmart-related projects:")
        for proj in walmart_projects:
            print(f"   {proj}")
    else:
        print("\n⚠️  No Walmart-related projects found")
        print("   All your projects:")
        for line in output.split('\n')[1:6]:  # Show first 5
            if line.strip():
                print(f"   {line}")
    
    # Test 4: Try bq command
    print("\n" + "="*80)
    print("🔍 Step 4: Testing BigQuery CLI (bq)")
    print("="*80)
    print()
    
    success, output = run_command(
        "bq ls --max_results=10 2>&1",
        "Trying to list BigQuery datasets"
    )
    
    if success and output and 'datasetId' in output:
        print("\n✅ BigQuery access works!")
        print("   You have access to datasets")
    else:
        print("\n⚠️  Cannot list BigQuery datasets")
        if not walmart_auth:
            print("   Authenticate with Walmart account first")
        else:
            print("   You may need to set a default project or request access")
    
    # Summary
    print("\n" + "="*80)
    print("📊 SUMMARY")
    print("="*80)
    print()
    
    if walmart_auth and walmart_projects:
        print("✅ You have Walmart GCP access!")
        print("\nNext steps:")
        print("1. Find the specific project with the BigQuery table")
        print("2. Try querying the table directly")
        print("3. If successful, I'll build the automated fetcher!")
        print("\nLet me know and I'll create the auto-fetch script! 🎉")
        return 0
    elif walmart_auth:
        print("⚠️  Authenticated with Walmart but limited project access")
        print("\nNext steps:")
        print("1. Request access to the GCP project with BigQuery data")
        print("2. See BIGQUERY-ACCESS-GUIDE.md for instructions")
        print("3. Mention you need access to: DATE_LEVEL_AGG_PRJ_CENTRAL_SUMM.TB")
        return 1
    else:
        print("❌ Not authenticated with Walmart account")
        print("\nNext steps:")
        print("1. Run: gcloud auth login")
        print("2. Use your Walmart email (h0r03cw@homeoffice.wal-mart.com)")
        print("3. Run this test again")
        print("\nFor full instructions, see: BIGQUERY-ACCESS-GUIDE.md")
        return 1


if __name__ == '__main__':
    sys.exit(main())