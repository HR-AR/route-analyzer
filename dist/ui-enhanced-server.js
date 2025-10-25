import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import { existsSync, readFileSync, unlinkSync, mkdirSync } from 'fs';
import { join, resolve, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getPythonPath } from './python-helper.js';
import { generateReport } from './report-generator-v2.js';
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3003;
// Get the directory of this file (works in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Base directory is the parent of dist/ (i.e., project root)
const BASE_DIR = resolve(__dirname, '..');
// Scripts directory is at the same level (simplified structure)
const SCRIPTS_DIR = resolve(BASE_DIR, 'scripts');
// Ensure directories exist (relative to BASE_DIR)
const UPLOAD_DIR = join(BASE_DIR, 'uploads');
const DATA_DIR = join(BASE_DIR, 'data');
if (!existsSync(UPLOAD_DIR))
    mkdirSync(UPLOAD_DIR, { recursive: true });
if (!existsSync(DATA_DIR))
    mkdirSync(DATA_DIR, { recursive: true });
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
// Serve static files from public directory (relative to BASE_DIR)
const publicPath = join(BASE_DIR, 'public');
console.log('📁 Serving static files from:', publicPath);
app.use(express.static(publicPath));
// ===== API ENDPOINTS =====
// POST /api/analyze - Run analysis on uploaded CSV
app.post('/api/analyze', upload.single('csv'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { analysisType, storeId, ...additionalParams } = req.body;
        const csvPath = req.file.path;
        console.log(`Running ${analysisType} analysis on ${csvPath}`, additionalParams);
        const result = await runPythonAnalysis(analysisType, csvPath, storeId, additionalParams);
        // Clean up uploaded file
        setTimeout(() => {
            if (existsSync(csvPath))
                unlinkSync(csvPath);
        }, 5000);
        res.json(result);
    }
    catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});
// POST /api/analyze-path - Run analysis on existing file
app.post('/api/analyze-path', async (req, res) => {
    try {
        const { filePath, analysisType, storeId, ...additionalParams } = req.body;
        if (!existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        const result = await runPythonAnalysis(analysisType, filePath, storeId, additionalParams);
        res.json(result);
    }
    catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/tableau-fetch - Fetch data from Tableau
app.get('/api/tableau-fetch', async (req, res) => {
    try {
        const { days, startDate, endDate, store } = req.query;
        const args = [join(SCRIPTS_DIR, 'tableau_fetcher.py')];
        const outputPath = join(DATA_DIR, `tableau-${Date.now()}.csv`);
        args.push('--output', outputPath);
        if (days)
            args.push('--days', days);
        if (startDate)
            args.push('--start-date', startDate);
        if (endDate)
            args.push('--end-date', endDate);
        if (store)
            args.push('--store', store);
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
                message: 'Data fetched successfully',
                note: 'Tableau data format is different from route analysis format. Download the CSV to view the data.'
            });
        }
        else {
            throw new Error('Failed to fetch data from Tableau');
        }
    }
    catch (error) {
        console.error('Tableau fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/bigquery-fetch - Fetch data from BigQuery
app.get('/api/bigquery-fetch', async (req, res) => {
    try {
        const { days, carrier, client, type, oversized } = req.query;
        const pythonPath = getPythonPath();
        const args = [join(SCRIPTS_DIR, 'auto_fetch_bigquery.py')];
        const outputPath = join(DATA_DIR, `bigquery-${Date.now()}.csv`);
        args.push('--output', outputPath);
        if (days)
            args.push('--days', days);
        if (carrier)
            args.push('--carrier', carrier);
        if (client)
            args.push('--client', client);
        if (type)
            args.push('--type', type);
        if (oversized)
            args.push('--oversized', oversized);
        console.log('Fetching from BigQuery:', pythonPath, args);
        const result = await runPythonScript(args);
        // Check if file was created
        if (existsSync(outputPath)) {
            // Convert BigQuery format to Tableau-compatible format
            const tableauPath = outputPath.replace('.csv', '-tableau.csv');
            const convertArgs = [join(SCRIPTS_DIR, 'convert_bigquery_to_tableau_format.py'), outputPath, tableauPath];
            console.log('Converting BigQuery data to Tableau format...');
            await runPythonScript(convertArgs);
            // Count rows
            const content = readFileSync(tableauPath, 'utf-8');
            const rows = content.split('\n').length - 1; // Subtract header
            res.json({
                success: true,
                filePath: outputPath, // Return original file path for BigQuery KPI analysis
                tableauPath: tableauPath, // Converted format if needed for other analyses
                rows,
                message: 'Data fetched successfully from BigQuery',
                source: 'bigquery'
            });
        }
        else {
            throw new Error('Failed to fetch data from BigQuery');
        }
    }
    catch (error) {
        console.error('BigQuery fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /api/download - Download a CSV file
app.get('/api/download', (req, res) => {
    try {
        const { path: filePath } = req.query;
        if (!filePath || typeof filePath !== 'string') {
            return res.status(400).json({ error: 'File path required' });
        }
        // Security: only allow downloads from data directory
        const fullPath = resolve(filePath);
        const dataDir = resolve(DATA_DIR);
        if (!fullPath.startsWith(dataDir)) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (!existsSync(fullPath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        // Set download headers
        const filename = basename(fullPath);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.sendFile(fullPath);
    }
    catch (error) {
        console.error('Download error:', error);
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
        const files = req.files;
        const filePaths = files.map(f => f.path);
        const outputPath = join(DATA_DIR, `merged-${Date.now()}.csv`);
        const args = [
            join(SCRIPTS_DIR, 'merge_csv_files.py'),
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
                if (existsSync(path))
                    unlinkSync(path);
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
    }
    catch (error) {
        console.error('Merge error:', error);
        res.status(500).json({ error: error.message });
    }
});
// GET /health - Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
// ===== HELPER FUNCTIONS =====
function runPythonAnalysis(analysisType, csvPath, storeId, additionalParams = {}) {
    return new Promise((resolve, reject) => {
        let scriptPath;
        let args;
        switch (analysisType) {
            case 'bigquery-metrics':
                // Use old basic metrics script
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'bigquery_metrics_analysis.py');
                args = [];
                break;
            case 'bigquery-kpi':
                // Use new leadership KPI analysis
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'bigquery_kpi_analysis.py');
                args = [];
                break;
            case 'tableau-metrics':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'tableau_metrics_analysis.py');
                args = [];
                break;
            case 'store-metrics':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'store_metrics_breakdown.py');
                args = [];
                break;
            case 'driver-store':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'driver_store_analysis.py');
                args = storeId ? [storeId] : [];
                break;
            case 'multiday':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'multiday_route_analysis.py');
                args = storeId ? [storeId] : [];
                break;
            case 'time-breakdown':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'detailed_time_analysis.py');
                args = [];
                break;
            case 'returns':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'returns_breakdown.py');
                args = [];
                break;
            case 'store-analysis':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'store_specific_analysis.py');
                args = storeId ? [storeId] : [];
                break;
            case 'pending-orders':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'pending_orders_analysis.py');
                args = [];
                break;
            case 'failed-orders':
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'route_analyzer.py'); // This has failed orders analysis
                args = [];
                break;
            default:
                scriptPath = join(SCRIPTS_DIR, 'analysis', 'store_metrics_breakdown.py');
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
                // Generate formatted text report from JSON using the report generator
                // Pass ranking parameter if available
                const ranking = additionalParams.ranking || 10;
                const { report, summary } = generateReport(result, analysisType, ranking);
                resolve({
                    success: true,
                    report: report,
                    summary: summary,
                    detailed: report,
                    data: result,
                    stats: extractStats(result),
                    rankingValue: additionalParams.ranking || '10' // Pass ranking to frontend for chart rendering
                });
            }
            catch (error) {
                console.error('Parse error:', error);
                console.error('stdout:', stdout.substring(0, 500));
                console.error('stderr:', stderr);
                reject(new Error(`Failed to parse analysis results: ${error instanceof Error ? error.message : String(error)}`));
            }
        });
        // Send CSV path, store_id, and additional params to Python script
        const inputData = {
            csv_path: csvPath,
            store_id: storeId,
            storeId: storeId, // Include both formats for compatibility
            ...additionalParams
        };
        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();
    });
}
function runPythonScript(args) {
    return new Promise((resolve, reject) => {
        const pythonPath = getPythonPath();
        console.log(`🐍 Executing Python: ${pythonPath} ${args.join(' ')}`);
        const pythonProcess = spawn(pythonPath, args);
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
            }
            else {
                resolve(stdout);
            }
        });
    });
}
function extractStats(result) {
    const stats = {};
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
//# sourceMappingURL=ui-enhanced-server.js.map