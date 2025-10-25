#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { getPythonPath } from './python-helper.js';

const csvPath = resolve(process.argv[2] || '../data_table_1.csv');

const pythonProcess = spawn(getPythonPath(), ['./scripts/analysis/store_metrics_breakdown.py']);

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
  const overall = results.overall;

  // Build formatted report
  let report = '';

  report += '\nSTORE-LEVEL METRICS BREAKDOWN (Starting October 4th)\n';
  report += '='.repeat(80) + '\n';
  report += `\nData Source: ${csvPath}\n`;

  // ===== OVERALL SUMMARY =====
  report += '\nOVERALL PERFORMANCE SUMMARY\n';
  report += '='.repeat(80) + '\n';

  report += '\nVOLUME:\n';
  report += `  Total Routes:       ${overall.total_routes}\n`;
  report += `  Total Orders:       ${overall.total_orders}\n`;
  report += `  Delivered:          ${overall.total_delivered} (${((overall.total_delivered / overall.total_orders) * 100).toFixed(1)}%)\n`;
  report += `  Returned:           ${overall.total_returned} (${overall.total_returns_rate}%)\n`;
  report += `  Pending:            ${overall.total_pending} (${overall.total_pending_rate}%) ${overall.total_pending > 0 ? '⚠️' : '✓'}\n`;
  report += `  Failed:             ${overall.total_failed}\n`;

  report += '\nDPH (Deliveries Per Hour):\n';
  report += `  Average:            ${overall.avg_dph} deliveries/hour\n`;
  report += `  Median:             ${overall.median_dph} deliveries/hour\n`;
  report += `  Range:              ${overall.min_dph} - ${overall.max_dph} deliveries/hour\n`;

  report += '\nBATCH DENSITY (Total Orders / Routes):\n';
  report += `  Overall:            ${overall.overall_batch_density} orders per route\n`;

  report += '\nPLANNED VS ACTUAL TIME:\n';
  report += `  Avg Planned:        ${overall.avg_planned_hours} hours\n`;
  report += `  Avg Actual:         ${overall.avg_actual_hours} hours\n`;
  report += `  Avg Variance:       ${overall.avg_variance_hours} hours (${overall.avg_variance_hours > 0 ? 'over plan' : 'under plan'})\n`;
  report += `  Median Variance:    ${overall.median_variance_hours} hours\n`;
  report += `  Total Variance:     ${overall.total_variance_hours} hours\n`;

  report += '\nRETURNS:\n';
  report += `  Overall Rate:       ${overall.total_returns_rate}%\n`;
  report += `  Average Route Rate: ${overall.avg_returns_rate}%\n`;

  report += '\nPENDING ORDERS:\n';
  report += `  Overall Rate:       ${overall.total_pending_rate}% ${overall.total_pending_rate > 0 ? '⚠️ UNACCEPTABLE' : '✓ GOOD'}\n`;
  report += `  Average Route Rate: ${overall.avg_pending_rate}%\n`;
  report += `  Routes with ANY Pending:  ${overall.routes_with_pending} (${((overall.routes_with_pending / overall.total_routes) * 100).toFixed(1)}%)\n`;
  report += `  Routes with HIGH Pending: ${overall.routes_with_high_pending} (>20%) ${overall.routes_with_high_pending > 0 ? '🚨' : ''}\n`;

  report += '\nDWELL TIME:\n';
  report += `  Average:            ${overall.avg_dwell_time} min\n`;
  report += `  Median:             ${overall.median_dwell_time} min\n`;
  report += `  Maximum:            ${overall.max_dwell_time} min\n`;

  report += '\nLOADING TIME:\n';
  report += `  Average:            ${overall.avg_load_time} min\n`;
  report += `  Median:             ${overall.median_load_time} min\n`;
  report += `  Maximum:            ${overall.max_load_time} min\n`;

  // ===== STORE-LEVEL BREAKDOWN =====
  report += '\n\nSTORE-LEVEL BREAKDOWN\n';
  report += '='.repeat(80) + '\n';
  report += '\nStores sorted by DPH (lowest to highest):\n';

  results.store_metrics.forEach((store: any) => {
    const pendingFlag = store.pending_orders > 0 ? (store.pending_rate > 20 ? '🚨 HIGH' : '⚠️') : '✓';
    report += `\nSTORE #${store.store_id} (${store.route_count} routes)\n`;
    report += `   DPH:             ${store.avg_dph} del/hr (median: ${store.median_dph}, range: ${store.worst_dph}-${store.best_dph})\n`;
    report += `   Batch Density:   ${store.batch_density} orders/route\n`;
    report += `   Variance:        Planned ${store.avg_planned_hours} hrs | Actual ${store.avg_actual_hours} hrs | Var ${store.avg_variance_hours} hrs\n`;
    report += `   Returns Rate:    ${store.returns_rate}% (${store.returned_orders}/${store.total_orders} orders)\n`;
    report += `   Pending Rate:    ${store.pending_rate}% (${store.pending_orders}/${store.total_orders} orders) ${pendingFlag}\n`;
    report += `   Pending Routes:  ${store.routes_with_pending} routes with pending (${store.routes_with_high_pending} high >20%)\n`;
    report += `   Dwell Time:      ${store.avg_dwell_time} min avg, ${store.max_dwell_time} min max\n`;
    report += `   Load Time:       ${store.avg_load_time} min avg, ${store.max_load_time} min max\n`;
    report += `   Carriers:        ${store.carriers.join(', ')}\n`;
  });

  // ===== TOP/BOTTOM PERFORMERS =====
  report += '\n\nTOP 10 BEST DPH ROUTES (Highest Deliveries Per Hour)\n';
  report += '='.repeat(80) + '\n';
  results.best_dph_routes.forEach((route: any, i: number) => {
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier})\n`;
    report += `     Date: ${route.Date} | Store ${route['Store Id']}\n`;
    report += `     DPH: ${route.DPH.toFixed(2)} del/hr | Delivered: ${route['Delivered Orders']}/${route['Total Orders']}\n`;
    report += `     Planned: ${route['Planned Time Hours'].toFixed(2)} hrs | Actual: ${route['Actual Time Hours'].toFixed(2)} hrs | Variance: ${route['Variance Hours'].toFixed(2)} hrs\n`;
    report += `     Dwell: ${route['Driver Dwell Time']} min | Load: ${route['Driver Load Time']} min | Total: ${(route['Driver Total Time'] / 60).toFixed(2)} hrs\n`;
  });

  report += '\n\nBOTTOM 10 WORST DPH ROUTES (Lowest Deliveries Per Hour)\n';
  report += '='.repeat(80) + '\n';
  results.worst_dph_routes.forEach((route: any, i: number) => {
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier})\n`;
    report += `     Date: ${route.Date} | Store ${route['Store Id']}\n`;
    report += `     DPH: ${route.DPH.toFixed(2)} del/hr | Delivered: ${route['Delivered Orders']}/${route['Total Orders']}\n`;
    report += `     Planned: ${route['Planned Time Hours'].toFixed(2)} hrs | Actual: ${route['Actual Time Hours'].toFixed(2)} hrs | Variance: ${route['Variance Hours'].toFixed(2)} hrs\n`;
    report += `     Dwell: ${route['Driver Dwell Time']} min | Load: ${route['Driver Load Time']} min | Total: ${(route['Driver Total Time'] / 60).toFixed(2)} hrs\n`;
  });

  report += '\n\nTOP 10 HIGHEST RETURNS\n';
  report += '='.repeat(80) + '\n';
  results.highest_returns.forEach((route: any, i: number) => {
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier})\n`;
    report += `     Date: ${route.Date} | Store ${route['Store Id']}\n`;
    report += `     Returns: ${route['Returned Orders']} (${(route['Returns Rate'] * 100).toFixed(1)}% of ${route['Total Orders']} orders)\n`;
    report += `     Delivered: ${route['Delivered Orders']}\n`;
  });

  report += '\n\nTOP 10 HIGHEST PENDING ORDERS ⚠️\n';
  report += '='.repeat(80) + '\n';
  results.highest_pending.forEach((route: any, i: number) => {
    const severity = route['Pending Rate'] > 0.5 ? '🚨 CRITICAL' : route['Pending Rate'] > 0.3 ? '⚠️ HIGH' : route['Pending Rate'] > 0.2 ? '⚡ MODERATE' : '📋 LOW';
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier}) ${severity}\n`;
    report += `     Date: ${route.Date} | Store ${route['Store Id']}\n`;
    report += `     Pending: ${route['Pending Orders']} (${(route['Pending Rate'] * 100).toFixed(1)}% of ${route['Total Orders']} orders)\n`;
    report += `     Delivered: ${route['Delivered Orders']}\n`;
  });

  // ===== STORE-LEVEL RANKINGS =====
  report += '\n\n' + '='.repeat(80) + '\n';
  report += 'STORE-LEVEL PERFORMANCE RANKINGS\n';
  report += '='.repeat(80) + '\n';

  report += '\n\nTOP 10 BEST PERFORMING STORES (Highest DPH)\n';
  report += '='.repeat(80) + '\n';
  results.top_10_stores.forEach((store: any, i: number) => {
    const pendingFlag = store.pending_orders > 0 ? (store.pending_rate > 20 ? '🚨' : '⚠️') : '✓';
    report += `\n  ${i + 1}. STORE #${store.store_id} (${store.route_count} routes)\n`;
    report += `     DPH:             ${store.avg_dph} del/hr (median: ${store.median_dph}, range: ${store.worst_dph}-${store.best_dph})\n`;
    report += `     Batch Density:   ${store.batch_density} orders/route\n`;
    report += `     Returns Rate:    ${store.returns_rate}% (${store.returned_orders}/${store.total_orders} orders)\n`;
    report += `     Pending Rate:    ${store.pending_rate}% (${store.pending_orders} orders) ${pendingFlag}\n`;
    report += `     Variance:        ${store.avg_variance_hours} hrs (Planned: ${store.avg_planned_hours} hrs, Actual: ${store.avg_actual_hours} hrs)\n`;
    report += `     Dwell Time:      ${store.avg_dwell_time} min avg\n`;
    report += `     Load Time:       ${store.avg_load_time} min avg\n`;
  });

  report += '\n\nBOTTOM 10 WORST PERFORMING STORES (Lowest DPH)\n';
  report += '='.repeat(80) + '\n';
  results.bottom_10_stores.forEach((store: any, i: number) => {
    const pendingFlag = store.pending_orders > 0 ? (store.pending_rate > 20 ? '🚨' : '⚠️') : '✓';
    report += `\n  ${i + 1}. STORE #${store.store_id} (${store.route_count} routes) ⚠️\n`;
    report += `     DPH:             ${store.avg_dph} del/hr (median: ${store.median_dph}, range: ${store.worst_dph}-${store.best_dph})\n`;
    report += `     Batch Density:   ${store.batch_density} orders/route\n`;
    report += `     Returns Rate:    ${store.returns_rate}% (${store.returned_orders}/${store.total_orders} orders)\n`;
    report += `     Pending Rate:    ${store.pending_rate}% (${store.pending_orders} orders) ${pendingFlag}\n`;
    report += `     Variance:        ${store.avg_variance_hours} hrs (Planned: ${store.avg_planned_hours} hrs, Actual: ${store.avg_actual_hours} hrs)\n`;
    report += `     Dwell Time:      ${store.avg_dwell_time} min avg\n`;
    report += `     Load Time:       ${store.avg_load_time} min avg\n`;
  });

  report += '\n\nTOP 10 STORES WITH LOWEST RETURNS\n';
  report += '='.repeat(80) + '\n';
  results.best_returns_stores.forEach((store: any, i: number) => {
    report += `\n  ${i + 1}. STORE #${store.store_id}: ${store.returns_rate}% returns (${store.returned_orders}/${store.total_orders} orders)\n`;
    report += `     DPH: ${store.avg_dph} del/hr | ${store.route_count} routes\n`;
  });

  report += '\n\nTOP 10 STORES WITH LOWEST PENDING ORDERS\n';
  report += '='.repeat(80) + '\n';
  results.best_pending_stores.forEach((store: any, i: number) => {
    const icon = store.pending_rate === 0 ? '✓' : '⚠️';
    report += `\n  ${i + 1}. STORE #${store.store_id}: ${store.pending_rate}% pending (${store.pending_orders}/${store.total_orders} orders) ${icon}\n`;
    report += `     DPH: ${store.avg_dph} del/hr | ${store.route_count} routes\n`;
  });

  report += '\n\nTOP 10 STORES WITH BEST TIME VARIANCE\n';
  report += '='.repeat(80) + '\n';
  results.best_variance_stores.forEach((store: any, i: number) => {
    const status = store.avg_variance_hours <= 0 ? '✓ Under Plan' : store.avg_variance_hours < 1 ? '⚡ Close' : '⚠️ Over Plan';
    report += `\n  ${i + 1}. STORE #${store.store_id}: ${store.avg_variance_hours} hrs variance ${status}\n`;
    report += `     Planned: ${store.avg_planned_hours} hrs | Actual: ${store.avg_actual_hours} hrs | DPH: ${store.avg_dph} del/hr\n`;
  });

  report += '\n\nKEY INSIGHTS & ACTIONS\n';
  report += '='.repeat(80) + '\n';

  // Find stores below average DPH
  const belowAvgStores = results.store_metrics.filter((s: any) => s.avg_dph < overall.avg_dph);
  if (belowAvgStores.length > 0) {
    report += `\n${belowAvgStores.length} stores below average DPH (need improvement):\n`;
    belowAvgStores.slice(0, 5).forEach((store: any) => {
      report += `   Store ${store.store_id}: ${store.avg_dph} del/hr (${((store.avg_dph / overall.avg_dph - 1) * 100).toFixed(1)}% vs avg)\n`;
    });
  }

  // High variance stores
  const highVarianceStores = results.store_metrics.filter((s: any) => s.avg_variance_hours > overall.avg_variance_hours);
  if (highVarianceStores.length > 0) {
    report += `\n${highVarianceStores.length} stores with above-average variance (over planned time):\n`;
    highVarianceStores.slice(0, 5).forEach((store: any) => {
      report += `   Store ${store.store_id}: +${store.avg_variance_hours} hrs variance (Planned: ${store.avg_planned_hours} hrs, Actual: ${store.avg_actual_hours} hrs)\n`;
    });
  }

  // High returns stores
  const highReturnsStores = results.store_metrics.filter((s: any) => s.returns_rate > overall.total_returns_rate);
  if (highReturnsStores.length > 0) {
    report += `\n${highReturnsStores.length} stores with above-average returns:\n`;
    highReturnsStores.slice(0, 5).forEach((store: any) => {
      report += `   Store ${store.store_id}: ${store.returns_rate}% returns\n`;
    });
  }

  // Stores with pending orders
  const storesWithPending = results.store_metrics.filter((s: any) => s.pending_orders > 0);
  if (storesWithPending.length > 0) {
    report += `\n⚠️ ${storesWithPending.length} stores with PENDING orders (UNACCEPTABLE):\n`;
    storesWithPending.slice(0, 10).forEach((store: any) => {
      const severity = store.pending_rate > 20 ? '🚨 HIGH' : '⚠️';
      report += `   ${severity} Store ${store.store_id}: ${store.pending_rate}% (${store.pending_orders} orders, ${store.routes_with_pending} routes)\n`;
    });
  }

  // High dwell/load times
  const highDwellStores = results.store_metrics.filter((s: any) => s.avg_dwell_time > 30);
  const highLoadStores = results.store_metrics.filter((s: any) => s.avg_load_time > 60);

  if (highDwellStores.length > 0) {
    report += `\n${highDwellStores.length} stores with high avg dwell time (>30 min):\n`;
    highDwellStores.slice(0, 5).forEach((store: any) => {
      report += `   Store ${store.store_id}: ${store.avg_dwell_time} min avg\n`;
    });
  }

  if (highLoadStores.length > 0) {
    report += `\n${highLoadStores.length} stores with high avg load time (>60 min):\n`;
    highLoadStores.slice(0, 5).forEach((store: any) => {
      report += `   Store ${store.store_id}: ${store.avg_load_time} min avg\n`;
    });
  }

  report += '\n' + '='.repeat(80) + '\n\n';

  // Output to console
  console.log(report);

  // Save formatted report to file
  const reportFile = 'store-metrics-report.txt';
  writeFileSync(reportFile, report);
  console.log(`Report saved to: ${reportFile}\n`);

  // Also save raw JSON
  const jsonFile = 'store-metrics-data.json';
  writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`Raw data saved to: ${jsonFile}\n`);
});

pythonProcess.stdin.write(JSON.stringify({ csv_path: csvPath }));
pythonProcess.stdin.end();
