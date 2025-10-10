#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve } from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
let csvPath: string;
let focusStores: number[] = [];

// Check if --stores flag is used
const storesIndex = args.indexOf('--stores');
if (storesIndex !== -1) {
  const storesArg = args[storesIndex + 1];
  if (storesArg) {
    focusStores = storesArg.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }
  csvPath = args.find((arg, i) => i !== storesIndex && i !== storesIndex + 1 && !arg.startsWith('--')) || '../data_table_1.csv';
} else {
  csvPath = args[0] || '../data_table_1.csv';
}

csvPath = resolve(csvPath);

const pythonProcess = spawn('./venv/bin/python3', ['./scripts/analysis/batch_density_by_day.py']);

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

  // Build formatted report
  let report = '';

  report += '\n' + '='.repeat(80) + '\n';
  report += 'BATCH DENSITY DAY-BY-DAY ANALYSIS (Starting October 4th)\n';
  report += '='.repeat(80) + '\n';
  report += `\nData Source: ${csvPath}\n`;

  if (focusStores.length > 0) {
    report += `Focus Stores: ${focusStores.join(', ')}\n`;
  }

  // ===== STORE SUMMARY =====
  report += '\n' + '='.repeat(80) + '\n';
  report += 'STORE SUMMARY\n';
  report += '='.repeat(80) + '\n';

  const storeSummaries = Object.entries(results.store_summary)
    .map(([store_id, data]: [string, any]) => ({ store_id: parseInt(store_id), ...data }))
    .sort((a, b) => a.overall_batch_density - b.overall_batch_density);

  storeSummaries.forEach((store: any) => {
    report += `\nStore #${store.store_id}:\n`;
    report += `  Days Operated:         ${store.days_operated}\n`;
    report += `  Total Routes:          ${store.total_routes}\n`;
    report += `  Overall Batch Density: ${store.overall_batch_density} orders/route\n`;
    report += `  Range:                 ${store.min_batch_density} - ${store.max_batch_density} orders/route\n`;
    report += `  Std Deviation:         ${store.batch_density_std}\n`;
    report += `  Consistency:           ${store.consistency} ${store.consistency === 'Low' ? '⚠️' : '✅'}\n`;
  });

  // ===== DAY-BY-DAY BREAKDOWN =====
  report += '\n' + '='.repeat(80) + '\n';
  report += 'DAY-BY-DAY BREAKDOWN\n';
  report += '='.repeat(80) + '\n';

  // Group by store for display
  const daysByStore: { [key: number]: any[] } = {};
  results.day_by_day.forEach((day: any) => {
    if (!daysByStore[day.store_id]) {
      daysByStore[day.store_id] = [];
    }
    daysByStore[day.store_id].push(day);
  });

  // Sort stores by overall batch density
  const sortedStoreIds = storeSummaries.map(s => s.store_id);

  sortedStoreIds.forEach(storeId => {
    const days = daysByStore[storeId];
    if (!days) return;

    report += `\n${'─'.repeat(80)}\n`;
    report += `STORE #${storeId}\n`;
    report += `${'─'.repeat(80)}\n`;

    days.forEach((day: any) => {
      report += `\n📅 ${day.date} (${day.day_of_week}):\n`;
      report += `   Routes:        ${day.route_count}\n`;
      report += `   Total Orders:  ${day.total_orders}\n`;
      report += `   Batch Density: ${day.batch_density} orders/route\n`;
      report += `   Carriers:      ${day.carriers.join(', ')}\n`;
      report += `   Couriers:      ${day.couriers.join(', ')}\n`;
    });
  });

  report += '\n' + '='.repeat(80) + '\n\n';

  // Output to console
  console.log(report);
});

pythonProcess.stdin.write(JSON.stringify({
  csv_path: csvPath,
  focus_stores: focusStores.length > 0 ? focusStores : null
}));
pythonProcess.stdin.end();
