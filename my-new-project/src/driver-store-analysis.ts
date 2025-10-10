#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

const storeId = parseInt(process.argv[2]);
const csvPath = resolve(process.argv[3] || '../data_table_1.csv');

if (!storeId || isNaN(storeId)) {
  console.error('Usage: npm run driver-store-analysis -- <store-id> <path-to-csv>');
  console.error('Example: npm run driver-store-analysis -- 5930 /Users/h0r03cw/Downloads/data_table_1.csv');
  process.exit(1);
}

const pythonProcess = spawn('./venv/bin/python3', ['./scripts/analysis/driver_store_analysis.py']);

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

  const overall = results.overall;

  // Build formatted report
  let report = '';

  report += `\nDRIVER-LEVEL ANALYSIS FOR STORE #${storeId}\n`;
  report += '='.repeat(80) + '\n';
  report += `\nData Source: ${csvPath}\n`;

  // ===== OVERALL STORE SUMMARY =====
  report += '\nOVERALL STORE PERFORMANCE\n';
  report += '='.repeat(80) + '\n';

  report += '\nVOLUME:\n';
  report += `  Total Routes:       ${overall.total_routes}\n`;
  report += `  Total Orders:       ${overall.total_orders}\n`;
  report += `  Delivered:          ${overall.total_delivered} (${overall.delivery_rate}%)\n`;
  report += `  Returned:           ${overall.total_returned}\n`;
  report += `  Pending:            ${overall.total_pending} (${overall.pending_rate}%) ${overall.total_pending > 0 ? '⚠️ UNACCEPTABLE' : '✓'}\n`;
  report += `  Routes w/ Pending:  ${overall.routes_with_pending}\n`;

  report += '\nDPH (Deliveries Per Hour):\n';
  report += `  Average:            ${overall.avg_dph} deliveries/hour\n`;
  report += `  Median:             ${overall.median_dph} deliveries/hour\n`;

  report += '\nDWELL TIME:\n';
  report += `  Average:            ${overall.avg_dwell_time} min\n`;
  report += `  Median:             ${overall.median_dwell_time} min\n`;
  report += `  Range:              ${overall.min_dwell_time} - ${overall.max_dwell_time} min\n`;

  report += '\nLOAD TIME:\n';
  report += `  Average:            ${overall.avg_load_time} min\n`;
  report += `  Median:             ${overall.median_load_time} min\n`;
  report += `  Range:              ${overall.min_load_time} - ${overall.max_load_time} min\n`;

  report += '\nSORT TIME:\n';
  report += `  Average:            ${overall.avg_sort_time} min\n`;

  report += '\nVARIANCE (Planned vs Actual):\n';
  report += `  Avg Planned:        ${overall.avg_planned_hours} hours\n`;
  report += `  Avg Actual:         ${overall.avg_actual_hours} hours\n`;
  report += `  Avg Variance:       ${overall.avg_variance_hours} hours\n`;
  report += `  Median Variance:    ${overall.median_variance_hours} hours\n`;

  // ===== DRIVER BREAKDOWN =====
  report += '\n\nDRIVER-LEVEL BREAKDOWN\n';
  report += '='.repeat(80) + '\n';
  report += '\nDrivers sorted by DPH (lowest to highest):\n';

  results.driver_metrics.forEach((driver: any) => {
    const pendingFlag = driver.pending_orders > 0 ? '⚠️' : '✓';
    report += `\n${driver.driver_name} (${driver.carrier}) - ${driver.route_count} routes\n`;
    report += `   DPH:             ${driver.avg_dph} del/hr (range: ${driver.worst_dph} - ${driver.best_dph})\n`;
    report += `   Dwell Time:      ${driver.avg_dwell_time} min avg (range: ${driver.min_dwell_time} - ${driver.max_dwell_time} min)\n`;
    report += `   Load Time:       ${driver.avg_load_time} min avg (range: ${driver.min_load_time} - ${driver.max_load_time} min)\n`;
    report += `   Sort Time:       ${driver.avg_sort_time} min avg\n`;
    report += `   Variance:        Planned ${driver.avg_planned_hours} hrs | Actual ${driver.avg_actual_hours} hrs | Var ${driver.avg_variance_hours} hrs\n`;
    report += `   Delivery Rate:   ${driver.delivery_rate}% (${driver.delivered_orders}/${driver.total_orders} orders)\n`;
    report += `   Pending:         ${driver.pending_orders} orders (${driver.pending_rate}%) ${pendingFlag}\n`;
    report += `   Dates Worked:    ${driver.dates_worked.join(', ')}\n`;
  });

  // ===== PROBLEM ROUTES =====
  report += '\n\nPROBLEM ROUTES ANALYSIS\n';
  report += '='.repeat(80) + '\n';

  report += '\nTOP 5 HIGHEST DWELL TIME ROUTES:\n';
  results.problem_routes.high_dwell.forEach((route: any, i: number) => {
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier}) - ${route.Date}\n`;
    report += `     Dwell Time:      ${route['Driver Dwell Time']} min\n`;
    report += `     Load Time:       ${route['Driver Load Time']} min\n`;
    report += `     DPH:             ${route.DPH.toFixed(2)} del/hr\n`;
    report += `     Orders:          ${route['Delivered Orders']}/${route['Total Orders']} (${route['Pending Orders']} pending)\n`;
    report += `     Variance:        ${route['Variance Hours'].toFixed(2)} hrs\n`;
  });

  report += '\n\nTOP 5 HIGHEST LOAD TIME ROUTES:\n';
  results.problem_routes.high_load.forEach((route: any, i: number) => {
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier}) - ${route.Date}\n`;
    report += `     Load Time:       ${route['Driver Load Time']} min\n`;
    report += `     Dwell Time:      ${route['Driver Dwell Time']} min\n`;
    report += `     DPH:             ${route.DPH.toFixed(2)} del/hr\n`;
    report += `     Orders:          ${route['Delivered Orders']}/${route['Total Orders']} (${route['Pending Orders']} pending)\n`;
    report += `     Variance:        ${route['Variance Hours'].toFixed(2)} hrs\n`;
  });

  report += '\n\nTOP 5 HIGHEST VARIANCE ROUTES:\n';
  results.problem_routes.high_variance.forEach((route: any, i: number) => {
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier}) - ${route.Date}\n`;
    report += `     Variance:        ${route['Variance Hours'].toFixed(2)} hrs (Planned: ${route['Planned Time Hours'].toFixed(2)} hrs, Actual: ${route['Actual Time Hours'].toFixed(2)} hrs)\n`;
    report += `     Dwell Time:      ${route['Driver Dwell Time']} min\n`;
    report += `     Load Time:       ${route['Driver Load Time']} min\n`;
    report += `     Pending:         ${route['Pending Orders']} orders\n`;
    report += `     DPH:             ${route.DPH.toFixed(2)} del/hr\n`;
  });

  // Add pending routes section if there are any
  if (results.problem_routes.pending && results.problem_routes.pending.length > 0) {
    report += '\n\n⚠️  ROUTES WITH PENDING ORDERS (UNACCEPTABLE):\n';
    results.problem_routes.pending.forEach((route: any, i: number) => {
      const severity = route['Pending Rate'] > 0.5 ? '🚨 CRITICAL' : route['Pending Rate'] > 0.3 ? '⚠️ HIGH' : route['Pending Rate'] > 0.2 ? '⚡ MODERATE' : '📋 LOW';
      report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier}) - ${route.Date} ${severity}\n`;
      report += `     Pending:         ${route['Pending Orders']} (${(route['Pending Rate'] * 100).toFixed(1)}% of ${route['Total Orders']} orders)\n`;
      report += `     Delivered:       ${route['Delivered Orders']}\n`;
      report += `     DPH:             ${route.DPH.toFixed(2)} del/hr\n`;
      report += `     Dwell Time:      ${route['Driver Dwell Time']} min\n`;
      report += `     Load Time:       ${route['Driver Load Time']} min\n`;
    });
  }

  // ===== ALL ROUTES DETAIL =====
  report += '\n\nALL ROUTES DETAIL (Chronological)\n';
  report += '='.repeat(80) + '\n';

  results.all_routes.forEach((route: any) => {
    const pendingFlag = route['Pending Orders'] > 0 ? '⚠️' : '';
    report += `\n${route.Date} - ${route['Courier Name']} (${route.Carrier}) ${pendingFlag}\n`;
    report += `   Orders:          ${route['Delivered Orders']}/${route['Total Orders']} (${route['Returned Orders']} returned, ${route['Pending Orders']} pending)\n`;
    report += `   DPH:             ${route.DPH.toFixed(2)} del/hr\n`;
    report += `   Dwell Time:      ${route['Driver Dwell Time']} min\n`;
    report += `   Load Time:       ${route['Driver Load Time']} min\n`;
    report += `   Sort Time:       ${route['Driver Sort Time']} min\n`;
    report += `   Variance:        Planned ${route['Planned Time Hours'].toFixed(2)} hrs | Actual ${route['Actual Time Hours'].toFixed(2)} hrs | Var ${route['Variance Hours'].toFixed(2)} hrs\n`;
  });

  // ===== KEY INSIGHTS =====
  report += '\n\nKEY INSIGHTS & RECOMMENDATIONS\n';
  report += '='.repeat(80) + '\n';

  // Identify main issues
  const issues = [];

  if (overall.avg_dwell_time > 20) {
    issues.push(`HIGH DWELL TIME: Average ${overall.avg_dwell_time} min (above 20 min threshold)`);
  }

  if (overall.avg_load_time > 30) {
    issues.push(`HIGH LOAD TIME: Average ${overall.avg_load_time} min (above 30 min threshold)`);
  }

  if (overall.avg_variance_hours > 1) {
    issues.push(`HIGH VARIANCE: Average ${overall.avg_variance_hours} hrs over planned time`);
  }

  if (overall.avg_dph < 7) {
    issues.push(`LOW DPH: Average ${overall.avg_dph} del/hr (below 7 del/hr threshold)`);
  }

  if (overall.total_pending > 0) {
    issues.push(`⚠️  PENDING ORDERS: ${overall.total_pending} orders pending (${overall.pending_rate}%) - UNACCEPTABLE`);
  }

  if (issues.length > 0) {
    report += '\nISSUES IDENTIFIED:\n';
    issues.forEach(issue => {
      report += `  - ${issue}\n`;
    });
  }

  // Driver-specific insights
  const worstDriver = results.driver_metrics[0];
  const bestDriver = results.driver_metrics[results.driver_metrics.length - 1];

  report += '\nDRIVER PERFORMANCE GAP:\n';
  report += `  Worst Performer:    ${worstDriver.driver_name} (${worstDriver.avg_dph} del/hr)\n`;
  report += `  Best Performer:     ${bestDriver.driver_name} (${bestDriver.avg_dph} del/hr)\n`;
  report += `  Performance Gap:    ${(bestDriver.avg_dph - worstDriver.avg_dph).toFixed(2)} del/hr (${((bestDriver.avg_dph / worstDriver.avg_dph - 1) * 100).toFixed(1)}%)\n`;

  report += '\nRECOMMENDATIONS:\n';
  if (overall.total_pending > 0) {
    report += `  - ⚠️  URGENT: Address ${overall.total_pending} pending orders across ${overall.routes_with_pending} routes. ANY pending is unacceptable.\n`;
  }
  if (overall.avg_load_time > 25) {
    report += `  - Investigate load time issues (avg ${overall.avg_load_time} min). Check staging process, package organization.\n`;
  }
  if (overall.avg_dwell_time > 15) {
    report += `  - Address high dwell times (avg ${overall.avg_dwell_time} min). Review break patterns, route planning.\n`;
  }
  if (overall.avg_variance_hours > 2) {
    report += `  - Large variance suggests route planning issues. Review estimated durations and routing.\n`;
  }
  if (bestDriver.avg_dph / worstDriver.avg_dph > 1.5) {
    report += `  - Significant driver performance gap. Consider coaching/training for lower performers.\n`;
  }

  report += '\n' + '='.repeat(80) + '\n\n';

  // Output to console
  console.log(report);

  // Save formatted report to file
  const reportFile = `driver-store-${storeId}-report.txt`;
  writeFileSync(reportFile, report);
  console.log(`Report saved to: ${reportFile}\n`);

  // Also save raw JSON
  const jsonFile = `driver-store-${storeId}-data.json`;
  writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`Raw data saved to: ${jsonFile}\n`);
});

pythonProcess.stdin.write(JSON.stringify({ csv_path: csvPath, store_id: storeId }));
pythonProcess.stdin.end();