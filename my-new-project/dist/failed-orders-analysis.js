#!/usr/bin/env node
/**
 * Failed Orders Analysis Wrapper
 * Runs the Python failed orders analyzer and formats output
 */
import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { getPythonPath } from './python-helper.js';
async function runFailedOrdersAnalysis(args) {
    const { csvPath } = args;
    return new Promise((resolve, reject) => {
        const parentDir = join(process.cwd(), '..');
        const pythonScript = join(parentDir, 'failed_orders_analyzer.py');
        const pythonPath = getPythonPath();
        console.error(`Running failed orders analysis on: ${csvPath}`);
        const pythonProcess = spawn(pythonPath, [pythonScript, csvPath], {
            cwd: process.cwd(), // Run in my-new-project directory so output files are saved here
            env: {
                ...process.env,
                PYTHONPATH: parentDir
            },
            stdio: ['inherit', 'pipe', 'pipe']
        });
        let stdout = '';
        let stderr = '';
        pythonProcess.stdout.on('data', (data) => {
            const text = data.toString();
            stdout += text;
            // Also log to stderr so it shows in terminal
            process.stderr.write(text);
        });
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
            process.stderr.write(data);
        });
        pythonProcess.on('error', (error) => {
            reject(new Error('Failed to start failed orders analysis: ' + error.message));
        });
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error('Failed orders analysis failed with code ' + code));
                return;
            }
            // Save report to file
            const reportPath = 'failed-orders-analysis-report.txt';
            writeFileSync(reportPath, stdout);
            console.error(`\n✅ Report saved to: ${reportPath}`);
            resolve();
        });
    });
}
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        console.log(`
Failed Orders Analysis Tool

Usage:
  npm run failed-orders-analysis -- <path-to-csv>

Example:
  npm run failed-orders-analysis -- ../data_table_1.csv

Output:
  Comprehensive report with:
  - Failed orders by carrier
  - Failed orders by store
  - Time patterns analysis
  - Impact on performance metrics
  - Top problem trips
`);
        process.exit(0);
    }
    const csvPath = resolve(args[0]);
    try {
        await runFailedOrdersAnalysis({ csvPath });
        process.exit(0);
    }
    catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
}
// Run main function directly
main();
export { runFailedOrdersAnalysis };
//# sourceMappingURL=failed-orders-analysis.js.map