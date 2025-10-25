#!/usr/bin/env python3
"""
Systematic BigQuery Table Search
Find tables matching the Tableau dashboard structure.
"""

import subprocess
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

# Target columns from the manual download
TARGET_COLUMNS = [
    'Store Id', 'Report Date', 'Carrier Org Nm', 'Client',
    'Total Deliveries', 'OTA %', 'OTD %', 'Total Engaged Hours'
]

PROJECT = 'wmt-gdap-dl-sec-lmd-prod'
DATASETS = ['WW_LMD_TABLES', 'WW_LMD_REPORTING_TABLES', 'WW_LMD_STAGE_TABLES']


def run_command(cmd):
    """Run a shell command and return output"""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30
        )
        return result.stdout, result.returncode
    except Exception as e:
        return str(e), 1


def get_table_list(dataset):
    """Get all tables in a dataset"""
    print(f"\n📋 Listing tables in {dataset}...")
    cmd = f"bq ls {PROJECT}:{dataset} 2>&1 | awk 'NR>2 {{print $1}}'"
    output, _ = run_command(cmd)
    tables = [t.strip() for t in output.split('\n') if t.strip() and t.strip() != '------']
    print(f"   Found {len(tables)} tables")
    return tables


def get_table_schema(dataset, table):
    """Get schema for a specific table"""
    cmd = f"bq show --format=json {PROJECT}:{dataset}.{table} 2>/dev/null"
    output, code = run_command(cmd)
    
    if code == 0 and output:
        try:
            data = json.loads(output)
            if 'schema' in data and 'fields' in data['schema']:
                columns = [f['name'] for f in data['schema']['fields']]
                return columns
        except:
            pass
    return []


def score_table(columns):
    """Score how well a table matches our target columns"""
    score = 0
    matched_cols = []
    
    # Normalize column names for comparison
    columns_lower = [c.lower().replace('_', ' ') for c in columns]
    
    for target in TARGET_COLUMNS:
        target_lower = target.lower()
        
        # Check for exact or close matches
        for i, col in enumerate(columns_lower):
            if target_lower in col or col in target_lower:
                score += 1
                matched_cols.append(columns[i])
                break
    
    # Bonus for having many columns (aggregated data tends to have 100+ columns)
    if len(columns) > 100:
        score += 5
    elif len(columns) > 50:
        score += 2
    
    return score, matched_cols


def search_table(dataset, table):
    """Search a single table"""
    try:
        columns = get_table_schema(dataset, table)
        if not columns:
            return None
        
        score, matched = score_table(columns)
        
        if score >= 3:  # Require at least 3 matches
            return {
                'dataset': dataset,
                'table': table,
                'score': score,
                'total_columns': len(columns),
                'matched_columns': matched,
                'all_columns': columns[:20]  # First 20 columns
            }
    except Exception as e:
        pass
    
    return None


def main():
    print("\n" + "="*80)
    print("🔍 SYSTEMATIC BIGQUERY TABLE SEARCH")
    print("="*80)
    print()
    print(f"Project: {PROJECT}")
    print(f"Target columns: {', '.join(TARGET_COLUMNS[:4])}...")
    print()
    
    all_candidates = []
    
    for dataset in DATASETS:
        print(f"\n{'='*80}")
        print(f"📂 Dataset: {dataset}")
        print(f"{'='*80}")
        
        # Get all tables
        tables = get_table_list(dataset)
        
        if not tables:
            print("   No tables found or access denied")
            continue
        
        # Search tables in parallel
        print(f"\n🔎 Analyzing {len(tables)} tables...")
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(search_table, dataset, table): table for table in tables}
            
            for i, future in enumerate(as_completed(futures), 1):
                if i % 50 == 0:
                    print(f"   Progress: {i}/{len(tables)}...")
                
                result = future.result()
                if result:
                    all_candidates.append(result)
                    print(f"\n   ✅ CANDIDATE FOUND: {result['table']}")
                    print(f"      Score: {result['score']}/8+")
                    print(f"      Columns: {result['total_columns']}")
                    print(f"      Matched: {', '.join(result['matched_columns'][:5])}...")
    
    # Summary
    print("\n" + "="*80)
    print("📊 RESULTS SUMMARY")
    print("="*80)
    print()
    
    if all_candidates:
        # Sort by score
        all_candidates.sort(key=lambda x: x['score'], reverse=True)
        
        print(f"Found {len(all_candidates)} candidate table(s):\n")
        
        for i, candidate in enumerate(all_candidates, 1):
            print(f"{i}. {candidate['dataset']}.{candidate['table']}")
            print(f"   Score: {candidate['score']} | Columns: {candidate['total_columns']}")
            print(f"   Matched: {', '.join(candidate['matched_columns'])}")
            print(f"   First columns: {', '.join(candidate['all_columns'][:10])}")
            print()
        
        print("\n🎯 TOP RECOMMENDATION:")
        top = all_candidates[0]
        print(f"   {PROJECT}:{top['dataset']}.{top['table']}")
        print(f"   Score: {top['score']}")
        print(f"   Total columns: {top['total_columns']}")
        print()
        print("Try querying this table:")
        print(f"   bq head {PROJECT}:{top['dataset']}.{top['table']} --max_rows=5")
        
    else:
        print("❌ No matching tables found.")
        print()
        print("This could mean:")
        print("  - The table has different column names than expected")
        print("  - The data is in a different project")
        print("  - The table requires special permissions")
        print()
        print("Next steps:")
        print("  1. Ask your team for the exact table name")
        print("  2. Check if data is in a different GCP project")
        print("  3. Verify you have read permissions on the dataset")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())