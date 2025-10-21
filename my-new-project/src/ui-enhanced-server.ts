import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import { existsSync, readFileSync, unlinkSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getPythonPath } from './python-helper.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Ensure directories exist
const UPLOAD_DIR = 'uploads';
const DATA_DIR = 'data';
if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR);
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({ storage });

// Middleware
app.use(express.json());
app.use(express.static('public'));

// ===== API ENDPOINTS =====

// POST /api/analyze - Run analysis on uploaded CSV
app.post('/api/analyze', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { analysisType, storeId } = req.body;
    const csvPath = req.file.path;

    console.log(`Running ${analysisType} analysis on ${csvPath}`);

    const result = await runPythonAnalysis(analysisType, csvPath, storeId);

    // Clean up uploaded file
    setTimeout(() => {
      if (existsSync(csvPath)) unlinkSync(csvPath);
    }, 5000);

    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analyze-path - Run analysis on existing file
app.post('/api/analyze-path', async (req, res) => {
  try {
    const { filePath, analysisType, storeId } = req.body;

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    const result = await runPythonAnalysis(analysisType, filePath, storeId);
    res.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tableau-fetch - Fetch data from Tableau
app.get('/api/tableau-fetch', async (req, res) => {
  try {
    const { days, startDate, endDate, store } = req.query;

    const args = ['./scripts/tableau_fetcher.py'];
    const outputPath = join(DATA_DIR, `tableau-${Date.now()}.csv`);
    args.push('--output', outputPath);

    if (days) args.push('--days', days as string);
    if (startDate) args.push('--start-date', startDate as string);
    if (endDate) args.push('--end-date', endDate as string);
    if (store) args.push('--store', store as string);

    console.log('Fetching from Tableau:', args);

    const result = await runPythonScript(args);

    // Check if file was created
    if (existsSync(outputPath)) {
      // Count rows
      const content = readFileSync(outputPath, 'utf-8');
      const rows = content.split('\n').length - 1; // Subtract header

      res.json({
        success: true,
        filePath: outputPath,
        rows,
        message: 'Data fetched successfully'
      });
    } else {
      throw new Error('Failed to fetch data from Tableau');
    }
  } catch (error: any) {
    console.error('Tableau fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/merge-csv - Merge multiple CSV files
app.post('/api/merge-csv', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length < 2) {
      return res.status(400).json({ error: 'At least 2 files required' });
    }

    const { removeDuplicates } = req.body;
    const files = req.files as Express.Multer.File[];
    const filePaths = files.map(f => f.path);

    const outputPath = join(DATA_DIR, `merged-${Date.now()}.csv`);

    const args = [
      './scripts/merge_csv_files.py',
      ...filePaths,
      '-o', outputPath
    ];

    if (removeDuplicates === 'false') {
      args.push('--keep-duplicates');
    }

    console.log('Merging files:', args);

    await runPythonScript(args);

    // Clean up uploaded files
    setTimeout(() => {
      filePaths.forEach(path => {
        if (existsSync(path)) unlinkSync(path);
      });
    }, 5000);

    // Count rows in merged file
    const content = readFileSync(outputPath, 'utf-8');
    const rows = content.split('\n').length - 1;

    res.json({
      success: true,
      filePath: outputPath,
      rows,
      message: `Successfully merged ${files.length} files`
    });
  } catch (error: any) {
    console.error('Merge error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /health - Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ===== HELPER FUNCTIONS =====

function runPythonAnalysis(analysisType: string, csvPath: string, storeId?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    let scriptPath: string;
    let args: string[];

    switch (analysisType) {
      case 'store-metrics':
        scriptPath = './scripts/analysis/store_metrics_breakdown.py';
        args = [];
        break;
      case 'driver-store':
        scriptPath = './scripts/analysis/driver_store_analysis.py';
        args = storeId ? [storeId] : [];
        break;
      case 'returns':
        scriptPath = './scripts/analysis/returns_breakdown.py';
        args = [];
        break;
      default:
        scriptPath = './scripts/analysis/store_metrics_breakdown.py';
        args = [];
    }

    const pythonProcess = spawn(getPythonPath(), [scriptPath]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || 'Analysis failed'));
        return;
      }

      try {
        const result = JSON.parse(stdout);

        // Read report files if they exist
        const reportFile = `${analysisType}-report.txt`;
        const dataFile = `${analysisType}-data.json`;

        let report = '';
        let data = result;

        if (existsSync(reportFile)) {
          report = readFileSync(reportFile, 'utf-8');
        }

        if (existsSync(dataFile)) {
          data = JSON.parse(readFileSync(dataFile, 'utf-8'));
        }

        resolve({
          success: true,
          report,
          summary: report.substring(0, 2000), // First part
          detailed: report,
          data,
          stats: extractStats(result)
        });
      } catch (error) {
        reject(new Error('Failed to parse analysis results'));
      }
    });

    // Send CSV path to Python script
    pythonProcess.stdin.write(JSON.stringify({ csv_path: csvPath }));
    pythonProcess.stdin.end();
  });
}

function runPythonScript(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(getPythonPath(), args);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr || 'Script failed'));
      } else {
        resolve(stdout);
      }
    });
  });
}

function extractStats(result: any): Record<string, any> {
  const stats: Record<string, any> = {};

  if (result.overall) {
    stats['Total Routes'] = result.overall.total_routes || 0;
    stats['Avg DPH'] = result.overall.avg_dph || 0;
    stats['Total Orders'] = result.overall.total_orders || 0;
    stats['Delivery Rate'] = `${(result.overall.total_delivered / result.overall.total_orders * 100).toFixed(1)}%`;
    stats['Returns Rate'] = `${result.overall.total_returns_rate}%`;
    stats['Avg Variance'] = `${result.overall.avg_variance_hours} hrs`;
  }

  return stats;
}

// ===== START SERVER =====

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🐶 Route Analysis Dashboard - Enhanced UI      ║
╚════════════════════════════════════════════════════════╝

🌐 Server running at: http://localhost:${PORT}

✨ Features:
   📤 Upload CSV files
   📊 Fetch from Tableau
   🔀 Merge multiple CSVs
   📈 Advanced visualizations
   🌙 Dark mode support
   📱 Mobile responsive

👉 Open in your browser and start analyzing!

Press Ctrl+C to stop
  `);
});
