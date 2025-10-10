#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve } from 'path';
import { writeFileSync } from 'fs';
import { getPythonPath } from './python-helper.js';

const storeId = process.argv[2];
const csvPath = resolve(process.argv[3] || '../data_table_1.csv');

if (!storeId) {
  console.error('Usage: npm run store-analysis -- <store-id> [data.csv]');
  console.error('Example: npm run store-analysis -- 2242 ../data_table_1.csv');
  process.exit(1);
}

const pythonProcess = spawn(getPythonPath(), ['./scripts/analysis/store_specific_analysis.py']);

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
    console.error(`\n❌ ${results.error}\n`);
    process.exit(1);
  }

  const s = results.summary;

  // Build formatted report
  let report = '';

  report += '\n' + '='.repeat(70) + '\n';
  report += `📍 STORE #${s.store_id} - DETAILED ANALYSIS\n`;
  report += '='.repeat(70) + '\n';

  report += `\n📅 Date Range: ${s.date_range.start} to ${s.date_range.end}\n`;
  report += `📦 Total Routes: ${s.total_routes}\n`;
  report += `🚚 Carriers: ${s.carriers.join(', ')}\n`;
  report += `👤 Unique Drivers: ${s.total_drivers}\n`;

  report += '\n📊 OVERALL PERFORMANCE:\n';
  report += `  Average Trip Time:     ${s.avg_trip_actual_hours} hours (vs ${s.avg_estimated_hours} estimated)\n`;
  report += `  Average Variance:      ${s.avg_variance_hours > 0 ? '+' : ''}${s.avg_variance_hours} hours (${s.avg_variance_pct}%)\n`;
  report += `  Average Dwell Time:    ${s.avg_dwell_time_min} min\n`;
  report += `  Average Load Time:     ${s.avg_load_time_min} min\n`;
  report += `  Average Orders/Route:  ${s.avg_orders} orders\n`;
  report += `  Drops Per Hour:        ${s.avg_drops_per_hour}\n`;
  report += `  Total Orders Delivered: ${s.total_orders_delivered}\n`;

  report += '\n⚠️  PENDING ORDERS:\n';
  report += `  Total Pending:         ${s.total_pending} (${s.pending_rate}%) ${s.total_pending > 0 ? '🚨 UNACCEPTABLE' : '✓ GOOD'}\n`;
  report += `  Routes with Pending:   ${s.routes_with_pending}\n`;

  if (results.trends.best_day) {
    report += '\n✅ BEST PERFORMING DAY:\n';
    report += `  Date: ${results.trends.best_day.date}\n`;
    report += `  Driver: ${results.trends.best_day.driver}\n`;
    report += `  Performance: ${results.trends.best_day.reason}\n`;
  }

  if (results.trends.worst_day) {
    report += '\n❌ WORST PERFORMING DAY:\n';
    report += `  Date: ${results.trends.worst_day.date}\n`;
    report += `  Driver: ${results.trends.worst_day.driver}\n`;
    report += `  Performance: ${results.trends.worst_day.reason}\n`;
  }

  if (results.trends.most_consistent_driver) {
    report += '\n⭐ MOST CONSISTENT DRIVER:\n';
    report += `  ${results.trends.most_consistent_driver.name}\n`;
    report += `  Average Variance: ${results.trends.most_consistent_driver.avg_variance_pct}%\n`;
    report += `  Consistency (low std dev): ${results.trends.most_consistent_driver.std_dev}\n`;
  }

  if (results.trends.most_variable_driver) {
    report += '\n⚠️  MOST VARIABLE DRIVER:\n';
    report += `  ${results.trends.most_variable_driver.name}\n`;
    report += `  Average Variance: ${results.trends.most_variable_driver.avg_variance_pct}%\n`;
    report += `  Variability (high std dev): ${results.trends.most_variable_driver.std_dev}\n`;
  }

  if (results.issues && results.issues.length > 0) {
    report += '\n🚨 IDENTIFIED ISSUES:\n';
    results.issues.forEach((issue: any, i: number) => {
      report += `\n  ${i + 1}. ${issue.date} - ${issue.driver} (${issue.carrier})\n`;
      issue.issues.forEach((prob: string) => {
        report += `     • ${prob}\n`;
      });
    });
  }

  report += '\n📋 DAY-BY-DAY BREAKDOWN:\n';
  results.daily_routes.forEach((route: any) => {
    const flags = [];
    if (route.extended_dwell) flags.push('🕐 EXTENDED DWELL');
    if (route.extended_load) flags.push('⏲️  EXTENDED LOAD');
    if (route.variance_significant) flags.push('📊 HIGH VARIANCE');
    if (route.pending_orders > 0) flags.push('⚠️ PENDING');
    const flagStr = flags.length > 0 ? ` ${flags.join(' ')}` : '';

    report += `\n  📅 ${route.date} - ${route.driver} (${route.carrier})${flagStr}\n`;
    report += `     Departure: ${route.departure_time} (${route.departure_category})\n`;
    report += `     Time: ${route.trip_actual_hours}hrs actual vs ${route.estimated_hours}hrs estimated (${route.variance_hours > 0 ? '+' : ''}${route.variance_hours}hrs, ${route.variance_pct}%)\n`;
    report += `     Dwell: ${route.dwell_time_min}min | Load: ${route.load_time_min}min | Sort: ${route.sort_time_min}min\n`;
    report += `     Orders: ${route.delivered_orders}/${route.total_orders} delivered`;
    if (route.failed_orders > 0) report += ` | ${route.failed_orders} failed`;
    if (route.pending_orders > 0) report += ` | ${route.pending_orders} pending 🚨`;
    report += `\n     Drops/Hour: ${route.drops_per_hour}\n`;
  });

  report += '\n' + '='.repeat(70) + '\n';

  // Console output
  console.log(report);

  // Save to file
  const reportFile = `store-${storeId}-analysis.txt`;
  writeFileSync(reportFile, report);
  console.log(`\n✅ Report saved to: ${reportFile}\n`);

  // Save JSON
  const jsonFile = `store-${storeId}-data.json`;
  writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`✅ Raw data saved to: ${jsonFile}\n`);
});

pythonProcess.stdin.write(JSON.stringify({ csv_path: csvPath, store_id: storeId }));
pythonProcess.stdin.end();
