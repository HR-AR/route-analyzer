#!/usr/bin/env node
import { analyzeRoutes } from './route-analyzer.js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Route Analysis Tool - Dedicated Van Delivery Performance

Usage:
  npm start -- <path-to-csv>
  node dist/cli.js <path-to-csv>

Options:
  --help, -h    Show this help message

Example:
  npm start -- ../data_table_1.csv
  npm start -- /full/path/to/data.csv

Output:
  JSON report with:
  - Overall summary statistics
  - 10AM vs 12PM departure analysis
  - Carrier performance breakdown
  - Top 10 worst performing routes
  - Top 10 routes exceeding target time
`);
    process.exit(0);
  }

  const csvPath = resolve(args[0]);

  try {
    console.error(`Analyzing routes from: ${csvPath}...`);

    const result = await analyzeRoutes({ csvPath });

    // Output results as formatted JSON
    console.log(JSON.stringify(result, null, 2));

    // Summary to stderr for visibility
    console.error(`
Analysis complete!
   Total routes: ${result.summary.total_routes}
   Outliers: ${result.summary.outlier_routes} (${result.summary.outlier_percentage}%)
   Extended dwell times: ${result.summary.routes_with_extended_dwell}
   Extended load times: ${result.summary.routes_with_extended_load}
`);

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

main();
