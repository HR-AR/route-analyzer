#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

// Support both modes: analyze all stores OR specific store
const firstArg = process.argv[2];
const analyzeAll = firstArg === 'all' || firstArg === '--all';
const storeId = analyzeAll ? null : parseInt(firstArg);
const csvPath = resolve(process.argv[3] || '../data_table_1.csv');

if (!analyzeAll && (!storeId || isNaN(storeId))) {
  console.error('Usage: npm run multiday-analysis -- <store-id|all> <path-to-csv>');
  console.error('Examples:');
  console.error('  npm run multiday-analysis -- all /Users/h0r03cw/Downloads/data_table_1.csv');
  console.error('  npm run multiday-analysis -- 5930 /Users/h0r03cw/Downloads/data_table_1.csv');
  process.exit(1);
}

const pythonProcess = spawn('./venv/bin/python3', ['./scripts/analysis/multiday_route_analysis.py']);

let stdout = '';
let stderr = '';

pythonProcess.stdout.on('data', (chunk) => stdout += chunk.toString());
pythonProcess.stderr.on('data', (chunk) => stderr += chunk.toString());

pythonProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('Error:', stderr);
    process.exit(1);
  }

  const results = JSON.parse(stdout);

  if (results.error) {
    console.error(results.error);
    process.exit(1);
  }

  // Check if this is an all-stores analysis
  if (results.stores) {
    // All stores mode
    buildAllStoresReport(results, csvPath);
    return;
  }

  const summary = results.summary;

  // Build formatted report
  let report = '';

  report += `\nMULTI-DAY ROUTE ANALYSIS - STORE #${storeId}\n`;
  report += '='.repeat(80) + '\n';
  report += `\nData Source: ${csvPath}\n`;

  // ===== SUMMARY =====
  report += '\nSUMMARY\n';
  report += '='.repeat(80) + '\n';

  report += '\nROUTE BREAKDOWN:\n';
  report += `  Total Routes:        ${summary.total_routes}\n`;
  report += `  Multi-Day Routes:    ${summary.multi_day_routes} (${summary.pct_multi_day}%)\n`;
  report += `  Single-Day Routes:   ${summary.single_day_routes}\n`;

  report += '\nMULTI-DAY ROUTE AVERAGES:\n';
  report += `  Elapsed Time:        ${summary.avg_elapsed_hours_multi_day} hrs (includes overnight)\n`;
  report += `  Overnight Break:     ${summary.avg_overnight_hours_multi_day} hrs (estimated)\n`;
  report += `  Working Time:        ${summary.avg_working_hours_multi_day} hrs (actual delivery work)\n`;

  report += '\nSINGLE-DAY ROUTE AVERAGES:\n';
  report += `  Working Time:        ${summary.avg_working_hours_single_day} hrs\n`;

  report += '\nPENDING ORDERS (Next-Day Delivery Tracking):\n';
  report += `  Total Pending:       ${summary.total_pending} orders (${summary.avg_pending_rate}%) ${summary.total_pending > 0 ? '⚠️ UNACCEPTABLE' : '✓'}\n`;
  report += `  Routes w/ Pending:   ${summary.routes_with_pending}\n`;
  report += `  Multi-Day w/ Pending: ${summary.multi_day_routes_with_pending} (potential next-day deliveries)\n`;

  // ===== ROUTE DETAILS =====
  report += '\n\nDETAILED ROUTE BREAKDOWN\n';
  report += '='.repeat(80) + '\n';

  // Separate multi-day and single-day
  const multiDayRoutes = results.routes.filter((r: any) => r.multi_day);
  const singleDayRoutes = results.routes.filter((r: any) => !r.multi_day);

  if (multiDayRoutes.length > 0) {
    report += '\nMULTI-DAY ROUTES:\n';
    report += '-'.repeat(80) + '\n';

    multiDayRoutes.forEach((route: any) => {
      const pendingFlag = route.pending_orders > 0 ? '⚠️ PENDING' : '';
      report += `\n${route.date} - ${route.courier_name} (${route.carrier}) ${pendingFlag}\n`;
      report += `  Pickup:              ${route.pickup_complete}\n`;
      report += `  Last Dropoff:        ${route.last_dropoff}\n`;
      report += `  Elapsed Time:        ${route.elapsed_hours} hrs (wall clock time)\n`;
      report += `  Overnight Break:     ${route.estimated_overnight_hours} hrs (estimated)\n`;
      report += `  Working Time:        ${route.estimated_working_hours} hrs (actual delivery)\n`;
      report += `  Trip Actual (data):  ${route.trip_actual_hours} hrs\n`;
      report += `  Dwell Time:          ${route.dwell_time_min} min\n`;
      report += `  Load Time:           ${route.load_time_min} min\n`;
      report += `  Orders:              ${route.delivered_orders}/${route.total_orders} (${route.pending_orders} pending)\n`;
      report += `  DPH (working time):  ${route.dph} del/hr\n`;
    });
  }

  if (singleDayRoutes.length > 0) {
    report += '\n\nSINGLE-DAY ROUTES:\n';
    report += '-'.repeat(80) + '\n';

    singleDayRoutes.forEach((route: any) => {
      const pendingFlag = route.pending_orders > 0 ? '⚠️ PENDING' : '';
      report += `\n${route.date} - ${route.courier_name} (${route.carrier}) ${pendingFlag}\n`;
      report += `  Pickup:              ${route.pickup_complete}\n`;
      report += `  Last Dropoff:        ${route.last_dropoff}\n`;
      report += `  Working Time:        ${route.estimated_working_hours} hrs\n`;
      report += `  Dwell Time:          ${route.dwell_time_min} min\n`;
      report += `  Load Time:           ${route.load_time_min} min\n`;
      report += `  Orders:              ${route.delivered_orders}/${route.total_orders} (${route.pending_orders} pending)\n`;
      report += `  DPH:                 ${route.dph} del/hr\n`;
    });
  }

  // ===== INSIGHTS =====
  report += '\n\nKEY INSIGHTS\n';
  report += '='.repeat(80) + '\n';

  if (summary.pct_multi_day > 50) {
    report += `\nMULTI-DAY ROUTES ARE THE NORM (${summary.pct_multi_day}% of routes)\n`;
    report += `This store operates primarily with overnight delivery routes.\n`;
  }

  report += `\nACTUAL WORKING TIME vs ELAPSED TIME:\n`;
  if (multiDayRoutes.length > 0) {
    report += `  Multi-day routes show ${summary.avg_elapsed_hours_multi_day} hrs elapsed time\n`;
    report += `  But estimated working time is only ${summary.avg_working_hours_multi_day} hrs\n`;
    report += `  Difference: ${summary.avg_overnight_hours_multi_day} hrs overnight break (estimated)\n`;
  }

  report += `\nPENDING ORDERS INSIGHTS:\n`;
  if (summary.total_pending > 0) {
    report += `  ⚠️  ${summary.total_pending} PENDING ORDERS FOUND - UNACCEPTABLE\n`;
    report += `  ${summary.routes_with_pending} routes have pending orders\n`;
    if (summary.multi_day_routes_with_pending > 0) {
      report += `  ${summary.multi_day_routes_with_pending} multi-day routes have pending (potential next-day deliveries)\n`;
    }
  }

  report += `\nRECOMMENDATIONS:\n`;
  if (summary.total_pending > 0) {
    report += `  1. ⚠️  URGENT: Address ${summary.total_pending} pending orders. ANY pending is unacceptable.\n`;
  }
  if (summary.pct_multi_day > 30) {
    report += `  2. Route planner should account for multi-day delivery patterns\n`;
    report += `  3. Variance calculations are misleading when comparing to single-day estimates\n`;
    report += `  4. Consider separate planning models for multi-day vs single-day routes\n`;
    report += `  5. Verify driver compensation accounts for overnight routes\n`;
  }

  const avgWorkingHours = summary.avg_working_hours_multi_day;
  if (avgWorkingHours > 12) {
    report += `  6. Working time of ${avgWorkingHours} hrs (excluding overnight) may indicate route optimization needed\n`;
  } else if (avgWorkingHours >= 8 && avgWorkingHours <= 12) {
    report += `  6. Working time of ${avgWorkingHours} hrs (excluding overnight) is reasonable for these route sizes\n`;
  }

  report += '\n' + '='.repeat(80) + '\n\n';

  // Output to console
  console.log(report);

  // Save formatted report to file
  const reportFile = `multiday-analysis-${storeId}-report.txt`;
  writeFileSync(reportFile, report);
  console.log(`Report saved to: ${reportFile}\n`);

  // Also save raw JSON
  const jsonFile = `multiday-analysis-${storeId}-data.json`;
  writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`Raw data saved to: ${jsonFile}\n`);
});

function buildAllStoresReport(results: any, csvPath: string) {
  let report = '';

  report += `\nMULTI-DAY ROUTE ANALYSIS - ALL STORES\n`;
  report += '='.repeat(80) + '\n';
  report += `\nData Source: ${csvPath}\n`;

  report += '\nSUMMARY\n';
  report += '='.repeat(80) + '\n';
  report += `  Total Stores Analyzed:              ${results.total_stores_analyzed}\n`;
  report += `  Stores with Multi-Day Routes:       ${results.stores_with_multi_day_routes}\n`;
  report += `  Stores with Single-Day Only:        ${results.total_stores_analyzed - results.stores_with_multi_day_routes}\n`;

  report += '\n\nSTORES WITH MULTI-DAY ROUTES (sorted by % multi-day)\n';
  report += '='.repeat(80) + '\n';

  if (results.stores.length === 0) {
    report += '\nNo stores with multi-day routes found.\n';
  } else {
    report += '\n';
    report += 'Store ID | Total Routes | Multi-Day | Single-Day | % Multi-Day\n';
    report += '-'.repeat(80) + '\n';

    results.stores.forEach((store: any) => {
      const storeIdStr = String(store.store_id).padEnd(8);
      const totalStr = String(store.total_routes).padEnd(12);
      const multiStr = String(store.multi_day_routes).padEnd(9);
      const singleStr = String(store.single_day_routes).padEnd(10);
      const pctStr = `${store.pct_multi_day}%`;

      report += `${storeIdStr} | ${totalStr} | ${multiStr} | ${singleStr} | ${pctStr}\n`;
    });
  }

  report += '\n\nNEXT STEPS\n';
  report += '='.repeat(80) + '\n';
  report += '\nTo analyze a specific store in detail, run:\n';

  if (results.stores.length > 0) {
    const topStore = results.stores[0];
    report += `  npm run multiday-analysis -- ${topStore.store_id} ${csvPath}\n`;
  }

  report += '\n' + '='.repeat(80) + '\n\n';

  // Output to console
  console.log(report);

  // Save formatted report to file
  const reportFile = `multiday-analysis-all-stores-report.txt`;
  writeFileSync(reportFile, report);
  console.log(`Report saved to: ${reportFile}\n`);

  // Also save raw JSON
  const jsonFile = `multiday-analysis-all-stores-data.json`;
  writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`Raw data saved to: ${jsonFile}\n`);
}

pythonProcess.stdin.write(JSON.stringify({
  csv_path: csvPath,
  store_id: storeId,
  analyze_all: analyzeAll
}));
pythonProcess.stdin.end();
