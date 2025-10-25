#!/usr/bin/env node
import { fetchTableauData } from './tableau-fetcher.js';
import { spawn } from 'child_process';
import { resolve } from 'path';

interface AnalysisOptions {
  analysis: 'store-metrics' | 'driver-store' | 'multiday' | 'time-breakdown' | 'returns';
  startDate?: string;
  endDate?: string;
  days?: number;
  store?: string;
}

function parseArgs(): AnalysisOptions {
  const args = process.argv.slice(2);
  
  const options: AnalysisOptions = {
    analysis: 'store-metrics',  // default
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--analysis' || arg === '-a') {
      options.analysis = args[++i] as any;
    } else if (arg === '--start-date') {
      options.startDate = args[++i];
    } else if (arg === '--end-date') {
      options.endDate = args[++i];
    } else if (arg === '--days') {
      options.days = parseInt(args[++i]);
    } else if (arg === '--store') {
      options.store = args[++i];
    }
  }
  
  return options;
}

function runAnalysis(csvPath: string, analysis: string, store?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let command: string;
    let args: string[];
    
    // Determine which analysis to run
    switch (analysis) {
      case 'driver-store':
      case 'multiday':
        if (!store) {
          reject(new Error(`--store is required for ${analysis} analysis`));
          return;
        }
        command = 'node';
        args = [`dist/${analysis}-analysis.js`, store, csvPath];
        break;
        
      case 'store-metrics':
      case 'time-breakdown':
      case 'returns':
        command = 'node';
        args = [`dist/${analysis === 'returns' ? 'returns-breakdown' : analysis}.js`, csvPath];
        break;
        
      default:
        reject(new Error(`Unknown analysis type: ${analysis}`));
        return;
    }
    
    console.log(`\n🔍 Running ${analysis} analysis...\n`);
    
    const analysisProcess = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    analysisProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Analysis failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  const options = parseArgs();
  
  console.log('🐶 Fetch & Analyze - Automated Tableau Data Pipeline\n');
  console.log('Configuration:');
  console.log(`  Analysis Type: ${options.analysis}`);
  if (options.days) {
    console.log(`  Time Range: Last ${options.days} days`);
  } else if (options.startDate || options.endDate) {
    console.log(`  Start Date: ${options.startDate || 'N/A'}`);
    console.log(`  End Date: ${options.endDate || 'N/A'}`);
  }
  if (options.store) {
    console.log(`  Store Filter: ${options.store}`);
  }
  console.log('');
  
  try {
    // Step 1: Fetch data from Tableau
    console.log('📊 Step 1: Fetching data from Tableau Server...\n');
    
    const csvPath = await fetchTableauData({
      output: 'data/tableau_latest.csv',
      startDate: options.startDate,
      endDate: options.endDate,
      days: options.days,
      store: options.store,
    });
    
    console.log(`\n✅ Data fetched successfully: ${csvPath}\n`);
    
    // Step 2: Run analysis
    console.log('📈 Step 2: Running analysis...\n');
    
    await runAnalysis(csvPath, options.analysis, options.store);
    
    console.log('\n🎉 Analysis complete!\n');
    
  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}\n`);
    process.exit(1);
  }
}

main();
