#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve } from 'path';
import { writeFileSync } from 'fs';

const csvPath = resolve(process.argv[2] || '../data_table_1.csv');

const pythonProcess = spawn('./venv/bin/python3', ['./scripts/analysis/detailed_time_analysis.py']);

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
  const s = results.summary;
  const pct = results.time_breakdown_percentage;

  // Build formatted report
  let report = '';

  report += '\n📊 EXTENDED DWELL & LOAD TIME ANALYSIS\n';
  report += '='.repeat(70) + '\n';
  report += `\nData Source: ${csvPath}\n`;
  report += `Analysis Type: INDIVIDUAL ROUTES (not averages - these are specific days)\n`;

  report += '\n⏱️  AVERAGE TIME SPENT (Per Route):\n';
  report += `  Dwell Time:     ${s.avg_dwell_time_min} min  (median: ${s.median_dwell_time_min} min)\n`;
  report += `  Load Time:      ${s.avg_load_time_min} min  (median: ${s.median_load_time_min} min)\n`;
  report += `  Sort Time:      ${s.avg_sort_time_min} min\n`;
  report += `  Store Time:     ${s.avg_store_time_min} min\n`;
  report += `  Trip Actual:    ${s.avg_trip_actual_min} min (${(s.avg_trip_actual_min / 60).toFixed(2)} hours)\n`;
  report += `  Total Time:     ${s.avg_total_time_min} min (${(s.avg_total_time_min / 60).toFixed(2)} hours)\n`;

  report += '\n🚨 CRITICAL: Extended Time Issues\n';
  report += '\n📍 Extended Dwell Times (>30 min breaks):\n';
  report += `  • ${s.routes_with_extended_dwell} routes with excessive dwell time\n`;
  report += `  • Average extended dwell: ${s.avg_extended_dwell_min} min (${(s.avg_extended_dwell_min / 60).toFixed(2)} hours)\n`;
  report += `  • TOTAL WASTED TIME: ${s.total_wasted_dwell_hours} hours across all routes\n`;

  report += '\n📍 Extended Load Times (>60 min):\n';
  report += `  • ${s.routes_with_extended_load} routes with excessive load time\n`;
  report += `  • Average extended load: ${s.avg_extended_load_min} min\n`;
  report += `  • Total extended load time: ${s.total_extended_load_hours} hours\n`;

  report += '\n📈 TIME BREAKDOWN (% of Total Time):\n';
  report += `  Trip Actual (driving/delivering):  ${pct.trip_actual_pct}%  ✅\n`;
  report += `  Dwell Time (breaks/idle):          ${pct.dwell_pct}%  ${s.routes_with_extended_dwell > 0 ? '⚠️' : '✅'}\n`;
  report += `  Load Time:                         ${pct.load_pct}%  ${s.routes_with_extended_load > 0 ? '⚠️' : '✅'}\n`;
  report += `  Store Time:                        ${pct.store_pct}%\n`;
  report += `  Sort Time:                         ${pct.sort_pct}%\n`;

  // Routes with BOTH issues
  if (results.both_dwell_and_load_issues && results.both_dwell_and_load_issues.length > 0) {
    report += '\n⚠️⚠️  DOUBLE TROUBLE: Routes with BOTH Extended Dwell AND Load Issues:\n';
    results.both_dwell_and_load_issues.forEach((route: any, i: number) => {
      report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier})\n`;
      report += `     📅 Date: ${route.Date} | 🏪 Store: ${route['Store Id']}\n`;
      report += `     🕐 Dwell: ${route['Driver Dwell Time']} min | ⏲️  Load: ${route['Driver Load Time']} min\n`;
      report += `     📦 Orders: ${route['Total Orders']}\n`;
    });
  }

  report += '\n🔴 TOP 10 WORST DWELL TIMES (Individual Routes - Specific Days):\n';
  results.worst_dwell_times.slice(0, 10).forEach((route: any, i: number) => {
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier})\n`;
    report += `     📅 Date: ${route.Date} | 🏪 Store: ${route['Store Id']}\n`;
    report += `     🕐 Dwell: ${route['Driver Dwell Time']} min (${(route['Driver Dwell Time'] / 60).toFixed(2)} hrs)\n`;
    report += `     ⏲️  Load: ${route['Driver Load Time']} min | 📦 Orders: ${route['Total Orders']}\n`;
  });

  report += '\n\n🔴 TOP 10 WORST LOAD TIMES (Individual Routes - Specific Days):\n';
  results.worst_load_times.slice(0, 10).forEach((route: any, i: number) => {
    report += `\n  ${i + 1}. ${route['Courier Name']} (${route.Carrier})\n`;
    report += `     📅 Date: ${route.Date} | 🏪 Store: ${route['Store Id']}\n`;
    report += `     ⏲️  Load: ${route['Driver Load Time']} min (${(route['Driver Load Time'] / 60).toFixed(2)} hrs)\n`;
    report += `     🕐 Dwell: ${route['Driver Dwell Time']} min | 📦 Orders: ${route['Total Orders']}\n`;
  });

  report += '\n\n💰 COST IMPACT:\n';
  if (s.routes_with_extended_dwell > 0) {
    report += `  • ${s.total_wasted_dwell_hours} hours of wasted dwell time\n`;
    report += `  • Could recover capacity for ${Math.floor(s.total_wasted_dwell_hours / 8)} additional full routes\n`;
    report += `  • Higher batch density = lower cost per delivery\n`;
  }

  report += '\n🎯 IMMEDIATE ACTIONS:\n';

  // Find most common carrier in worst dwell times
  const carrierCounts: Record<string, number> = {};
  results.worst_dwell_times.slice(0, 10).forEach((r: any) => {
    carrierCounts[r.Carrier] = (carrierCounts[r.Carrier] || 0) + 1;
  });
  const topCarrier = Object.entries(carrierCounts).sort((a, b) => b[1] - a[1])[0];

  report += `  1. Talk to ${topCarrier[0]} - They have ${topCarrier[1]} routes in top 10 worst dwell times\n`;
  report += `  2. Follow up on these specific routes:\n`;
  results.worst_dwell_times.slice(0, 3).forEach((route: any) => {
    report += `     • ${route['Courier Name']} - ${route.Date} at Store ${route['Store Id']}\n`;
  });

  if (results.both_dwell_and_load_issues.length > 0) {
    report += `  3. Priority: ${results.both_dwell_and_load_issues.length} routes have BOTH issues - investigate these first\n`;
  }

  report += '\n' + '='.repeat(70) + '\n\n';

  // Output to console
  console.log(report);

  // Save formatted report to file
  const reportFile = 'time-breakdown-report.txt';
  writeFileSync(reportFile, report);
  console.log(`✅ Report saved to: ${reportFile}\n`);

  // Also save raw JSON
  const jsonFile = 'time-breakdown-data.json';
  writeFileSync(jsonFile, JSON.stringify(results, null, 2));
  console.log(`✅ Raw data saved to: ${jsonFile}\n`);
});

pythonProcess.stdin.write(JSON.stringify({ csv_path: csvPath }));
pythonProcess.stdin.end();
