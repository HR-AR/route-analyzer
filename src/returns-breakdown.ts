#!/usr/bin/env tsx

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface ReturnsBreakdownRequest {
  csvPath: string;
}

interface ContributingFactors {
  extended_dwell: boolean;
  extended_load: boolean;
  high_variance: boolean;
  low_efficiency: boolean;
  very_high_volume: boolean;
}

interface ReturnRoute {
  date: string;
  store_id: number;
  carrier: string;
  driver: string;
  total_orders: number;
  delivered: number;
  returned: number;
  pending: number;
  return_rate: number;
  trip_actual_hours: number;
  trip_estimate_hours: number;
  variance_pct: number;
  dwell_time_min: number;
  load_time_min: number;
  drops_per_hour: number;
  likely_causes: string[];
  contributing_factors: ContributingFactors;
}

interface ReturnsBreakdownResult {
  top_return_routes: ReturnRoute[];
  patterns: {
    most_common_causes: Record<string, number>;
    avg_return_rate: number;
    total_routes_with_returns: number;
    total_returns: number;
    total_orders: number;
    routes_with_extended_dwell: number;
    routes_with_extended_load: number;
    routes_with_high_variance: number;
    routes_with_low_efficiency: number;
  };
}

function analyzeReturnsBreakdown(request: ReturnsBreakdownRequest): Promise<ReturnsBreakdownResult> {
  return new Promise((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_PATH || './venv/bin/python3';
    const scriptPath = './scripts/analysis/returns_breakdown.py';
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
      } catch (error) {
        reject(new Error(`Failed to parse analysis result: ${error}\n${outputData}`));
      }
    });

    pythonProcess.stdin.write(JSON.stringify(request));
    pythonProcess.stdin.end();
  });
}

function formatCauseLabel(cause: string): string {
  const labels: Record<string, string> = {
    'CATASTROPHIC_FAILURE': '🚨 Catastrophic Failure (>50% returns)',
    'EXTENDED_BREAK': '☕ Extended Break (>30min dwell)',
    'LOAD_ISSUES': '📦 Load Issues (>60min load time)',
    'TIME_MANAGEMENT_FAILURE': '⏰ Time Management Failure (high variance, >15hrs)',
    'LOW_EFFICIENCY': '🐌 Low Efficiency (<8 drops/hour)',
    'VOLUME_OVERLOAD': '📊 Volume Overload (>80 orders)',
    'GAVE_UP_EARLY': '🏳️ Gave Up Early (finished fast with high returns)',
    'CUSTOMER_ACCESS_ISSUES': '🚪 Customer Access Issues'
  };
  return labels[cause] || cause;
}

function generateReport(result: ReturnsBreakdownResult): string {
  let report = '';

  report += '=' .repeat(80) + '\n';
  report += '📉 TOP 10 ROUTES WITH HIGHEST RETURNS - ROOT CAUSE ANALYSIS\n';
  report += '='.repeat(80) + '\n\n';

  if (result.top_return_routes.length === 0) {
    report += '✅ No routes with returns found in this dataset!\n';
    return report;
  }

  // Summary statistics
  report += '📊 OVERALL PATTERNS:\n';
  report += '-'.repeat(80) + '\n';
  report += `Total Routes with Returns: ${result.patterns.total_routes_with_returns}\n`;
  report += `Total Returns: ${result.patterns.total_returns} out of ${result.patterns.total_orders} orders\n`;
  report += `Average Return Rate: ${result.patterns.avg_return_rate.toFixed(1)}%\n\n`;

  report += '🔍 MOST COMMON ROOT CAUSES:\n';
  const sortedCauses = Object.entries(result.patterns.most_common_causes)
    .sort((a, b) => b[1] - a[1]);

  sortedCauses.forEach(([cause, count]) => {
    report += `  ${formatCauseLabel(cause)}: ${count} routes\n`;
  });

  report += '\n' + '='.repeat(80) + '\n';
  report += '🚨 TOP 10 ROUTES BY RETURN COUNT\n';
  report += '='.repeat(80) + '\n\n';

  result.top_return_routes.forEach((route, index) => {
    report += `#${index + 1} - ${route.date} | Store ${route.store_id} | ${route.driver} (${route.carrier})\n`;
    report += '-'.repeat(80) + '\n';

    // Orders breakdown
    report += `📦 Orders: ${route.total_orders} total | `;
    report += `✅ ${route.delivered} delivered | `;
    report += `❌ ${route.returned} returned (${route.return_rate.toFixed(1)}%) | `;
    report += `⏳ ${route.pending} pending\n`;

    // Time metrics
    report += `⏱️  Time: ${route.trip_actual_hours.toFixed(2)}hrs actual vs ${route.trip_estimate_hours.toFixed(2)}hrs estimate `;
    report += `(${route.variance_pct >= 0 ? '+' : ''}${route.variance_pct.toFixed(1)}% variance)\n`;

    // Efficiency metrics
    report += `📈 Efficiency: ${route.drops_per_hour.toFixed(1)} drops/hour | `;
    report += `Dwell: ${route.dwell_time_min.toFixed(0)}min | `;
    report += `Load: ${route.load_time_min.toFixed(0)}min\n`;

    // Contributing factors
    const factors = route.contributing_factors;
    const activeFactors = [];
    if (factors.extended_dwell) activeFactors.push('Extended Dwell');
    if (factors.extended_load) activeFactors.push('Extended Load');
    if (factors.high_variance) activeFactors.push('High Variance');
    if (factors.low_efficiency) activeFactors.push('Low Efficiency');
    if (factors.very_high_volume) activeFactors.push('High Volume');

    if (activeFactors.length > 0) {
      report += `⚠️  Flags: ${activeFactors.join(', ')}\n`;
    }

    // Likely causes
    report += `\n🎯 Likely Root Causes:\n`;
    route.likely_causes.forEach(cause => {
      report += `   ${formatCauseLabel(cause)}\n`;
    });

    // Recommendations
    report += `\n💡 Recommendation: `;
    if (route.likely_causes.includes('CATASTROPHIC_FAILURE')) {
      report += 'URGENT - Investigate this driver immediately. >50% returns is unacceptable.\n';
    } else if (route.likely_causes.includes('GAVE_UP_EARLY')) {
      report += 'Driver finished quickly by returning orders. Require photo proof of attempts.\n';
    } else if (route.likely_causes.includes('TIME_MANAGEMENT_FAILURE')) {
      report += 'Driver ran out of time. Provide route efficiency coaching or reduce volume.\n';
    } else if (route.likely_causes.includes('VOLUME_OVERLOAD')) {
      report += 'Consider splitting this route - volume may be too high for time window.\n';
    } else if (route.likely_causes.includes('EXTENDED_BREAK')) {
      report += 'Extended break contributed to time pressure. Monitor break compliance.\n';
    } else if (route.likely_causes.includes('LOAD_ISSUES')) {
      report += 'Long load time reduced delivery time. Investigate warehouse efficiency.\n';
    } else {
      report += 'Likely customer access issues. Review delivery instructions and attempt requirements.\n';
    }

    report += '\n';
  });

  report += '='.repeat(80) + '\n';
  report += '📋 SUMMARY OF CONTRIBUTING FACTORS:\n';
  report += '-'.repeat(80) + '\n';
  report += `Routes with Extended Dwell (>30min): ${result.patterns.routes_with_extended_dwell}\n`;
  report += `Routes with Extended Load (>60min): ${result.patterns.routes_with_extended_load}\n`;
  report += `Routes with High Variance (>50%): ${result.patterns.routes_with_high_variance}\n`;
  report += `Routes with Low Efficiency (<8 drops/hr): ${result.patterns.routes_with_low_efficiency}\n`;
  report += '='.repeat(80) + '\n';

  return report;
}

async function main() {
  const csvPath = process.argv[2] || '../data_table_1.csv';

  if (!fs.existsSync(csvPath)) {
    console.error(`Error: CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  console.log(`Analyzing returns breakdown from ${csvPath}...\n`);

  try {
    const result = await analyzeReturnsBreakdown({ csvPath });

    // Generate formatted report
    const report = generateReport(result);
    console.log(report);

    // Save report to file
    const reportPath = path.join(process.cwd(), 'returns-breakdown-report.txt');
    fs.writeFileSync(reportPath, report);
    console.log(`\n✅ Report saved to: ${reportPath}`);

    // Save JSON data
    const dataPath = path.join(process.cwd(), 'returns-breakdown-data.json');
    fs.writeFileSync(dataPath, JSON.stringify(result, null, 2));
    console.log(`✅ JSON data saved to: ${dataPath}`);

  } catch (error) {
    console.error('Analysis failed:', error);
    process.exit(1);
  }
}

main();
