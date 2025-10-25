#!/usr/bin/env node
import { spawn } from 'child_process';
import { resolve } from 'path';
import { getPythonPath } from './python-helper.js';

// Parse command line arguments
const args = process.argv.slice(2);
let csvPath: string;
let excludeStores: number[] = [];

// Check if --exclude flag is used
const excludeIndex = args.indexOf('--exclude');
if (excludeIndex !== -1) {
  // Get comma-separated store IDs after --exclude
  const excludeArg = args[excludeIndex + 1];
  if (excludeArg) {
    excludeStores = excludeArg.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
  }
  // CSV path is either before or after the --exclude flag
  csvPath = args.find((arg, i) => i !== excludeIndex && i !== excludeIndex + 1 && !arg.startsWith('--')) || '../data_table_1.csv';
} else {
  // No --exclude flag, just get the CSV path
  csvPath = args[0] || '../data_table_1.csv';
}

csvPath = resolve(csvPath);

const pythonProcess = spawn(getPythonPath(), ['./scripts/analysis/batch_density_analysis.py']);

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
  report += 'BATCH DENSITY ANALYSIS (Starting October 4th)\n';
  report += '='.repeat(80) + '\n';
  report += `\nData Source: ${csvPath}\n`;

  // ===== FULL DATASET =====
  report += '\n' + '='.repeat(80) + '\n';
  report += 'FULL DATASET (All Stores)\n';
  report += '='.repeat(80) + '\n';
  report += `Total Routes:         ${results.full_dataset.total_routes}\n`;
  report += `Total Orders:         ${results.full_dataset.total_orders}\n`;
  report += `Overall Batch Density: ${results.full_dataset.overall_batch_density} orders/route\n`;

  // ===== FILTERED DATASET =====
  if (excludeStores.length > 0) {
    report += '\n' + '='.repeat(80) + '\n';
    report += `FILTERED DATASET (Excluding Stores: ${excludeStores.join(', ')})\n`;
    report += '='.repeat(80) + '\n';
    report += `Total Routes:         ${results.filtered_dataset.total_routes} (-${results.filtered_dataset.routes_removed} routes removed)\n`;
    report += `Total Orders:         ${results.filtered_dataset.total_orders} (-${results.filtered_dataset.orders_removed} orders removed)\n`;
    report += `Overall Batch Density: ${results.filtered_dataset.overall_batch_density} orders/route\n`;
    report += `\nChange: ${results.filtered_dataset.batch_density_change > 0 ? '+' : ''}${results.filtered_dataset.batch_density_change} orders/route (${((results.filtered_dataset.batch_density_change / results.full_dataset.overall_batch_density) * 100).toFixed(1)}%)\n`;
  }

  // ===== STORE-LEVEL: LOWEST 10 =====
  report += '\n' + '='.repeat(80) + '\n';
  report += 'TOP 10 LOWEST BATCH DENSITY STORES\n';
  report += '='.repeat(80) + '\n';

  results.store_level.lowest_10_stores.forEach((store: any, i: number) => {
    report += `\n${i + 1}. Store #${store.store_id}\n`;
    report += `   Batch Density:    ${store.batch_density} orders/route\n`;
    report += `   Routes:           ${store.route_count}\n`;
    report += `   Total Orders:     ${store.total_orders}\n`;
    report += `   Carriers:         ${store.carriers.join(', ')}\n`;
  });

  // ===== STORE-LEVEL: HIGHEST 10 =====
  report += '\n' + '='.repeat(80) + '\n';
  report += 'TOP 10 HIGHEST BATCH DENSITY STORES\n';
  report += '='.repeat(80) + '\n';

  results.store_level.highest_10_stores.forEach((store: any, i: number) => {
    report += `\n${i + 1}. Store #${store.store_id}\n`;
    report += `   Batch Density:    ${store.batch_density} orders/route\n`;
    report += `   Routes:           ${store.route_count}\n`;
    report += `   Total Orders:     ${store.total_orders}\n`;
    report += `   Carriers:         ${store.carriers.join(', ')}\n`;
  });

  // ===== ROUTE-LEVEL: LOWEST 10 =====
  report += '\n' + '='.repeat(80) + '\n';
  report += 'TOP 10 LOWEST BATCH SIZE ROUTES (Individual Routes)\n';
  report += '='.repeat(80) + '\n';

  results.route_level.lowest_10_routes.forEach((route: any, i: number) => {
    report += `\n${i + 1}. ${route['Courier Name']} (${route.Carrier})\n`;
    report += `   Date:        ${route.Date}\n`;
    report += `   Store:       #${route['Store Id']}\n`;
    report += `   Orders:      ${route['Total Orders']}\n`;
  });

  // ===== ROUTE-LEVEL: HIGHEST 10 =====
  report += '\n' + '='.repeat(80) + '\n';
  report += 'TOP 10 HIGHEST BATCH SIZE ROUTES (Individual Routes)\n';
  report += '='.repeat(80) + '\n';

  results.route_level.highest_10_routes.forEach((route: any, i: number) => {
    report += `\n${i + 1}. ${route['Courier Name']} (${route.Carrier})\n`;
    report += `   Date:        ${route.Date}\n`;
    report += `   Store:       #${route['Store Id']}\n`;
    report += `   Orders:      ${route['Total Orders']}\n`;
  });

  report += '\n' + '='.repeat(80) + '\n\n';

  // Output to console
  console.log(report);
});

pythonProcess.stdin.write(JSON.stringify({
  csv_path: csvPath,
  exclude_stores: excludeStores
}));
pythonProcess.stdin.end();