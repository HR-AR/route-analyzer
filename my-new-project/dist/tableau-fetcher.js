#!/usr/bin/env node
import { spawn } from 'child_process';
import { getPythonPath } from './python-helper.js';
export async function fetchTableauData(options = {}) {
    return new Promise((resolve, reject) => {
        const args = ['./scripts/tableau_fetcher.py'];
        if (options.output) {
            args.push('--output', options.output);
        }
        if (options.startDate) {
            args.push('--start-date', options.startDate);
        }
        if (options.endDate) {
            args.push('--end-date', options.endDate);
        }
        if (options.store) {
            args.push('--store', options.store);
        }
        if (options.days) {
            args.push('--days', options.days.toString());
        }
        const pythonProcess = spawn(getPythonPath(), args);
        let stdout = '';
        let stderr = '';
        let outputPath = '';
        pythonProcess.stdout.on('data', (chunk) => {
            const data = chunk.toString();
            stdout += data;
            process.stdout.write(data);
            // Extract output path from success message
            const match = data.match(/Data saved to: (.+)/);
            if (match) {
                outputPath = match[1].trim();
            }
        });
        pythonProcess.stderr.on('data', (chunk) => {
            const data = chunk.toString();
            stderr += data;
            process.stderr.write(data);
        });
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Tableau fetcher failed with code ${code}\n${stderr}`));
            }
            else {
                resolve(outputPath || options.output || 'data/tableau_export.csv');
            }
        });
    });
}
// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const args = process.argv.slice(2);
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--output' || arg === '-o') {
            options.output = args[++i];
        }
        else if (arg === '--start-date') {
            options.startDate = args[++i];
        }
        else if (arg === '--end-date') {
            options.endDate = args[++i];
        }
        else if (arg === '--store') {
            options.store = args[++i];
        }
        else if (arg === '--days') {
            options.days = parseInt(args[++i]);
        }
    }
    fetchTableauData(options)
        .then(() => process.exit(0))
        .catch((err) => {
        console.error(err.message);
        process.exit(1);
    });
}
//# sourceMappingURL=tableau-fetcher.js.map