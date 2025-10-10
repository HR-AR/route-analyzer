#!/usr/bin/env tsx
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { getPythonPath } from './python-helper.js';
function analyzePendingOrders(request) {
    return new Promise((resolve, reject) => {
        const pythonExecutable = getPythonPath();
        const scriptPath = './scripts/analysis/pending_orders_analysis.py';
        const pythonProcess = spawn(pythonExecutable, [scriptPath]);
        let outputData = '';
        let errorData = '';
        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Python script failed: ${errorData}`));
                return;
            }
            try {
                const result = JSON.parse(outputData);
                resolve(result);
            }
            catch (error) {
                reject(new Error(`Failed to parse analysis result: ${error}\n${outputData}`));
            }
        });
        pythonProcess.stdin.write(JSON.stringify(request));
        pythonProcess.stdin.end();
    });
}
function formatSeverityLabel(severity) {
    const labels = {
        'CRITICAL': '🚨 CRITICAL (>50% pending)',
        'HIGH': '⚠️  HIGH (30-50% pending)',
        'MODERATE': '⚡ MODERATE (20-30% pending)',
        'LOW': '📋 LOW (<20% pending)'
    };
    return labels[severity] || severity;
}
function generateReport(result, topN) {
    let report = '';
    const displayTopN = topN > 1000 ? 'ALL' : topN.toString();
    report += '='.repeat(80) + '\n';
    report += `📦 PENDING ORDERS ANALYSIS - TOP ${displayTopN} ROUTES\n`;
    report += '='.repeat(80) + '\n\n';
    if (result.top_pending_routes.length === 0) {
        report += '✅ No routes with pending orders found in this dataset!\n';
        return report;
    }
    // Summary statistics
    report += '📊 OVERALL PATTERNS:\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Routes with Pending: ${result.patterns.total_routes_with_pending}\n`;
    report += `Total Pending Orders: ${result.patterns.total_pending_orders} out of ${result.patterns.total_orders} orders\n`;
    report += `Average Pending Rate: ${result.patterns.avg_pending_rate.toFixed(1)}%\n\n`;
    report += '🚨 SEVERITY BREAKDOWN:\n';
    report += `  ${formatSeverityLabel('CRITICAL')}: ${result.patterns.critical_routes} routes\n`;
    report += `  ${formatSeverityLabel('HIGH')}: ${result.patterns.high_severity_routes} routes\n`;
    report += `  ${formatSeverityLabel('MODERATE')}: ${result.patterns.moderate_severity_routes} routes\n`;
    report += `  ${formatSeverityLabel('LOW')}: ${result.patterns.low_severity_routes} routes\n`;
    // Top problem stores
    if (result.patterns.top_problem_stores.length > 0) {
        report += '\n🏪 TOP STORES WITH RECURRING PENDING ISSUES:\n';
        report += '-'.repeat(80) + '\n';
        result.patterns.top_problem_stores.forEach((store, index) => {
            report += `  #${index + 1} Store ${store.store_id}: ${store.total_pending} pending orders across ${store.affected_routes} routes\n`;
        });
    }
    report += '\n' + '='.repeat(80) + '\n';
    report += `📋 TOP ${displayTopN} ROUTES BY PENDING ORDERS COUNT\n`;
    report += '='.repeat(80) + '\n\n';
    result.top_pending_routes.forEach((route, index) => {
        report += `#${index + 1} - ${route.date} | Store ${route.store_id} | ${route.driver} (${route.carrier})\n`;
        report += '-'.repeat(80) + '\n';
        // Orders breakdown
        report += `📦 Orders: ${route.total_orders} total | `;
        report += `✅ ${route.delivered} delivered | `;
        report += `❌ ${route.returned} returned | `;
        report += `⏳ ${route.pending} PENDING (${route.pending_rate.toFixed(1)}%)\n`;
        // Time metrics
        report += `⏱️  Time: ${route.trip_actual_hours.toFixed(2)}hrs actual vs ${route.trip_estimate_hours.toFixed(2)}hrs estimate\n`;
        // Severity
        report += `\n${formatSeverityLabel(route.severity)}\n`;
        // Recommendations
        report += `\n💡 Action Required: `;
        if (route.severity === 'CRITICAL') {
            report += 'URGENT - Over 50% of orders pending. Investigate immediately and ensure next-day delivery.\n';
        }
        else if (route.severity === 'HIGH') {
            report += 'High priority - Significant pending orders. Verify next-day delivery plan.\n';
        }
        else if (route.severity === 'MODERATE') {
            report += 'Monitor closely - Above acceptable threshold. Ensure timely completion.\n';
        }
        else {
            report += 'Track for next-day delivery. Follow up to confirm completion.\n';
        }
        report += '\n';
    });
    report += '='.repeat(80) + '\n';
    report += '⚠️  NOTE: Any pending orders indicate potential next-day delivery or undelivered packages.\n';
    report += '   All pending orders should be tracked and resolved promptly.\n';
    report += '='.repeat(80) + '\n';
    return report;
}
async function main() {
    // First arg might be topN, second is CSV path
    // Or first arg is CSV path if no topN provided
    let topNArg = process.argv[2];
    let csvPath = process.argv[3];
    let topN = 50; // Default
    // Check if first arg looks like a number or "all"
    if (topNArg && (topNArg === 'all' || !isNaN(Number(topNArg)))) {
        topN = topNArg === 'all' ? 999999 : parseInt(topNArg);
        // csvPath is already set to process.argv[3]
    }
    else {
        // First arg is the CSV path
        csvPath = topNArg;
    }
    if (!csvPath) {
        csvPath = '../data_table_1.csv';
    }
    if (!fs.existsSync(csvPath)) {
        console.error(`Error: CSV file not found at ${csvPath}`);
        process.exit(1);
    }
    console.log(`Analyzing pending orders from ${csvPath} with topN=${topN}...\n`);
    try {
        const result = await analyzePendingOrders({ csvPath, topN });
        console.log(`Found ${result.top_pending_routes.length} routes with pending orders`);
        // Generate formatted report
        const report = generateReport(result, topN);
        console.log(report);
        // Save report to file
        const reportPath = path.join(process.cwd(), 'pending-orders-report.txt');
        fs.writeFileSync(reportPath, report);
        console.log(`\n✅ Report saved to: ${reportPath}`);
        // Save JSON data
        const dataPath = path.join(process.cwd(), 'pending-orders-data.json');
        fs.writeFileSync(dataPath, JSON.stringify(result, null, 2));
        console.log(`✅ JSON data saved to: ${dataPath}`);
    }
    catch (error) {
        console.error('Analysis failed:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=pending-orders.js.map