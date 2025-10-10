import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
// Serve static HTML
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Route Analysis Tool</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 40px;
    }

    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2em;
    }

    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 1.1em;
    }

    .upload-section {
      background: #f8f9fa;
      border: 2px dashed #dee2e6;
      border-radius: 8px;
      padding: 30px;
      margin-bottom: 30px;
      text-align: center;
      transition: all 0.3s;
    }

    .upload-section:hover {
      border-color: #667eea;
      background: #f0f2ff;
    }

    .file-input-wrapper {
      position: relative;
      display: inline-block;
      cursor: pointer;
      margin-bottom: 20px;
    }

    .file-input-wrapper input[type=file] {
      position: absolute;
      left: -9999px;
    }

    .file-input-label {
      display: inline-block;
      padding: 12px 30px;
      background: #667eea;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.3s;
    }

    .file-input-label:hover {
      background: #5568d3;
    }

    .file-name {
      display: block;
      margin-top: 10px;
      color: #28a745;
      font-weight: 500;
    }

    .analysis-selector {
      margin-bottom: 30px;
    }

    .analysis-selector h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.2em;
    }

    .analysis-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .analysis-option {
      background: white;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      padding: 15px;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
    }

    .analysis-option:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    }

    .analysis-option.selected {
      border-color: #667eea;
      background: #f0f2ff;
    }

    .analysis-option input[type=radio] {
      position: absolute;
      opacity: 0;
    }

    .analysis-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .analysis-description {
      font-size: 0.9em;
      color: #666;
      line-height: 1.4;
    }

    .store-input-wrapper {
      margin-bottom: 20px;
      display: none;
    }

    .store-input-wrapper.show {
      display: block;
    }

    .store-input-wrapper label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }

    .store-input-wrapper input {
      width: 100%;
      padding: 12px;
      border: 2px solid #e9ecef;
      border-radius: 6px;
      font-size: 1em;
      transition: border-color 0.3s;
    }

    .store-input-wrapper input:focus {
      outline: none;
      border-color: #667eea;
    }

    .run-button {
      width: 100%;
      padding: 15px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1em;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .run-button:hover:not(:disabled) {
      background: #218838;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
    }

    .run-button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .loading {
      display: none;
      text-align: center;
      margin: 20px 0;
    }

    .loading.show {
      display: block;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 10px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .results {
      display: none;
      margin-top: 30px;
    }

    .results.show {
      display: block;
    }

    .results h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 1.3em;
    }

    .results-content {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      max-height: 600px;
      overflow-y: auto;
      white-space: pre-wrap;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      line-height: 1.6;
    }

    .download-buttons {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .download-btn {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.3s;
    }

    .download-btn:hover {
      background: #5568d3;
    }

    .error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
      display: none;
    }

    .error.show {
      display: block;
    }

    .icon {
      font-size: 1.2em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Route Analysis Tool</h1>
    <p class="subtitle">Upload your CSV file and select an analysis to run</p>

    <div class="upload-section">
      <div class="file-input-wrapper">
        <input type="file" id="fileInput" accept=".csv" />
        <label for="fileInput" class="file-input-label">
          <span class="icon">📁</span> Choose CSV File
        </label>
      </div>
      <span id="fileName" class="file-name"></span>
    </div>

    <div class="analysis-selector">
      <h3>Select Analysis Type:</h3>
      <div class="analysis-grid">
        <label class="analysis-option">
          <input type="radio" name="analysis" value="store-metrics" checked />
          <div class="analysis-title"><span class="icon">📊</span> Store Metrics</div>
          <div class="analysis-description">Comprehensive breakdown of all stores with DPH, batch density, returns, dwell, loading time</div>
        </label>

        <label class="analysis-option">
          <input type="radio" name="analysis" value="driver-store-analysis" />
          <div class="analysis-title"><span class="icon">👤</span> Driver Store Analysis</div>
          <div class="analysis-description">Deep dive into driver performance at a specific store</div>
        </label>

        <label class="analysis-option">
          <input type="radio" name="analysis" value="multiday-analysis" />
          <div class="analysis-title"><span class="icon">📅</span> Multi-Day Analysis</div>
          <div class="analysis-description">Identifies routes spanning multiple days for a specific store</div>
        </label>

        <label class="analysis-option">
          <input type="radio" name="analysis" value="time-breakdown" />
          <div class="analysis-title"><span class="icon">⏰</span> Time Breakdown</div>
          <div class="analysis-description">Identifies routes with extended dwell time and load time issues</div>
        </label>

        <label class="analysis-option">
          <input type="radio" name="analysis" value="store-analysis" />
          <div class="analysis-title"><span class="icon">🏪</span> Store Analysis</div>
          <div class="analysis-description">Day-by-day breakdown for a single store</div>
        </label>

        <label class="analysis-option">
          <input type="radio" name="analysis" value="returns-breakdown" />
          <div class="analysis-title"><span class="icon">↩️</span> Returns Breakdown</div>
          <div class="analysis-description">Analysis focused on returns patterns</div>
        </label>

        <label class="analysis-option">
          <input type="radio" name="analysis" value="pending-orders" />
          <div class="analysis-title"><span class="icon">⏳</span> Pending Orders</div>
          <div class="analysis-description">Identify routes with pending orders requiring next-day delivery</div>
        </label>

        <label class="analysis-option">
          <input type="radio" name="analysis" value="failed-orders" />
          <div class="analysis-title"><span class="icon">❌</span> Failed Orders Analysis</div>
          <div class="analysis-description">Comprehensive analysis of failed order patterns by carrier, store, and time</div>
        </label>
      </div>
    </div>

    <div id="storeInputWrapper" class="store-input-wrapper">
      <label for="storeNumber">Store Number:</label>
      <input type="number" id="storeNumber" placeholder="e.g., 5930" />
    </div>

    <div id="topNInputWrapper" class="store-input-wrapper">
      <label for="topN">Number of Results:</label>
      <select id="topN">
        <option value="10">Top 10</option>
        <option value="25">Top 25</option>
        <option value="50">Top 50</option>
        <option value="all">All Results</option>
      </select>
    </div>

    <button id="runButton" class="run-button">Run Analysis</button>

    <div id="loading" class="loading">
      <div class="spinner"></div>
      <p>Running analysis... This may take a moment.</p>
    </div>

    <div id="error" class="error"></div>

    <div id="results" class="results">
      <h3>Analysis Results:</h3>
      <div id="resultsContent" class="results-content"></div>
      <div class="download-buttons">
        <button id="downloadTxt" class="download-btn">Download Report (.txt)</button>
        <button id="downloadJson" class="download-btn">Download Data (.json)</button>
      </div>
    </div>
  </div>

  <script>
    const fileInput = document.getElementById('fileInput');
    const fileName = document.getElementById('fileName');
    const runButton = document.getElementById('runButton');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const results = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    const analysisOptions = document.querySelectorAll('.analysis-option');
    const storeInputWrapper = document.getElementById('storeInputWrapper');
    const storeNumberInput = document.getElementById('storeNumber');
    const topNInputWrapper = document.getElementById('topNInputWrapper');
    const topNInput = document.getElementById('topN');
    const downloadTxtBtn = document.getElementById('downloadTxt');
    const downloadJsonBtn = document.getElementById('downloadJson');

    let currentReport = '';
    let currentAnalysisType = '';
    let currentStoreNumber = '';

    // File selection
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        fileName.textContent = '✓ ' + e.target.files[0].name;
      }
    });

    // Analysis option selection
    analysisOptions.forEach(option => {
      option.addEventListener('click', () => {
        analysisOptions.forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');

        const value = option.querySelector('input').value;
        const needsStore = ['driver-store-analysis', 'multiday-analysis', 'store-analysis'].includes(value);
        const needsTopN = ['returns-breakdown', 'pending-orders'].includes(value);

        if (needsStore) {
          storeInputWrapper.classList.add('show');
        } else {
          storeInputWrapper.classList.remove('show');
        }

        if (needsTopN) {
          topNInputWrapper.classList.add('show');
        } else {
          topNInputWrapper.classList.remove('show');
        }
      });
    });

    // Run analysis
    runButton.addEventListener('click', async () => {
      const file = fileInput.files[0];
      if (!file) {
        showError('Please select a CSV file');
        return;
      }

      const analysisType = document.querySelector('input[name="analysis"]:checked').value;
      const needsStore = ['driver-store-analysis', 'multiday-analysis', 'store-analysis'].includes(analysisType);
      const needsTopN = ['returns-breakdown', 'pending-orders'].includes(analysisType);

      if (needsStore && !storeNumberInput.value) {
        showError('Please enter a store number');
        return;
      }

      currentAnalysisType = analysisType;
      currentStoreNumber = storeNumberInput.value || '';

      const formData = new FormData();
      formData.append('file', file);
      formData.append('analysis', analysisType);
      if (needsStore) {
        formData.append('storeNumber', storeNumberInput.value);
      }
      if (needsTopN) {
        formData.append('topN', topNInput.value);
      }

      // Show loading
      loading.classList.add('show');
      results.classList.remove('show');
      error.classList.remove('show');
      runButton.disabled = true;

      try {
        const response = await fetch('/analyze', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Analysis failed');
        }

        currentReport = data.report;
        showResults(data.report);
      } catch (err) {
        showError(err.message);
      } finally {
        loading.classList.remove('show');
        runButton.disabled = false;
      }
    });

    function showError(message) {
      error.textContent = message;
      error.classList.add('show');
      setTimeout(() => {
        error.classList.remove('show');
      }, 5000);
    }

    function showResults(report) {
      resultsContent.textContent = report;
      results.classList.add('show');
    }

    // Download handlers
    downloadTxtBtn.addEventListener('click', () => {
      const blob = new Blob([currentReport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getReportFilename('.txt');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    downloadJsonBtn.addEventListener('click', async () => {
      try {
        const response = await fetch('/download-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisType: currentAnalysisType,
            storeNumber: currentStoreNumber
          })
        });

        if (!response.ok) {
          showError('JSON data not available for this analysis');
          return;
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = getReportFilename('.json');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        showError('Failed to download JSON data');
      }
    });

    function getReportFilename(extension) {
      const nameMap = {
        'store-metrics': 'store-metrics-report' + extension,
        'driver-store-analysis': 'driver-store-' + currentStoreNumber + '-report' + extension,
        'multiday-analysis': 'multiday-analysis-' + currentStoreNumber + '-report' + extension,
        'time-breakdown': 'time-breakdown-report' + extension,
        'store-analysis': 'store-' + currentStoreNumber + '-analysis-report' + extension,
        'returns-breakdown': 'returns-breakdown-report' + extension,
        'pending-orders': 'pending-orders-report' + extension,
        'failed-orders': 'failed-orders-analysis-report' + extension
      };
      return nameMap[currentAnalysisType] || 'analysis-report' + extension;
    }

    // Initialize first option as selected
    analysisOptions[0].classList.add('selected');
  </script>
</body>
</html>
  `);
});
// Download JSON endpoint
app.post('/download-json', express.json(), (req, res) => {
    const { analysisType, storeNumber } = req.body;
    const jsonPatterns = {
        'store-metrics': 'store-metrics-data.json',
        'driver-store-analysis': `driver-store-${storeNumber}-data.json`,
        'multiday-analysis': `multiday-analysis-${storeNumber}-data.json`,
        'time-breakdown': 'time-breakdown-data.json',
        'store-analysis': `store-${storeNumber}-analysis-data.json`,
        'returns-breakdown': 'returns-breakdown-data.json',
        'pending-orders': 'pending-orders-data.json',
        'failed-orders': 'failed-orders-data.json'
    };
    const jsonFile = jsonPatterns[analysisType];
    if (!jsonFile || !existsSync(jsonFile)) {
        return res.status(404).json({ error: 'JSON data not found' });
    }
    res.sendFile(jsonFile, { root: process.cwd() });
});
// Helper function to clean data before analysis
async function cleanData(filePath) {
    return new Promise((resolve, reject) => {
        const cleanedPath = filePath.replace('.csv', '_cleaned.csv');
        // Get absolute paths - we're in my-new-project, script is in parent dir
        const parentDir = join(process.cwd(), '..');
        const pythonScript = join(parentDir, 'clean_data_cli.py');
        const venvPython = join(process.cwd(), 'venv', 'bin', 'python3');
        console.log(`Cleaning data: ${pythonScript} ${filePath} ${cleanedPath}`);
        console.log(`Python: ${venvPython}`);
        console.log(`Working directory: ${process.cwd()}`);
        const pythonProcess = spawn(venvPython, [pythonScript, filePath, cleanedPath], {
            cwd: process.cwd(), // Stay in my-new-project directory
            env: process.env
        });
        let stdout = '';
        let stderr = '';
        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        pythonProcess.on('error', (error) => {
            reject(new Error('Failed to start data cleaning: ' + error.message));
        });
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error('Data cleaning failed:', stderr);
                reject(new Error('Data cleaning failed: ' + stderr));
                return;
            }
            // Log cleaning report
            if (stderr) {
                console.log('Data Cleaning Report:', stderr);
            }
            // Extract cleaned file path from stdout
            const cleanedFilePath = stdout.trim().split('\n').pop() || cleanedPath;
            if (!existsSync(cleanedFilePath)) {
                reject(new Error('Cleaned file was not created'));
                return;
            }
            console.log(`✓ Data cleaned successfully: ${cleanedFilePath}`);
            resolve(cleanedFilePath);
        });
    });
}
// Analysis endpoint
app.post('/analyze', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    const { analysis, storeNumber, topN } = req.body;
    const filePath = req.file.path;
    console.log(`File uploaded to: ${filePath}, exists: ${existsSync(filePath)}, size: ${req.file.size} bytes`);
    let cleanedFilePath = null;
    try {
        // For failed orders analysis, use RAW data (don't clean)
        // This preserves the original failed orders count before any data manipulation
        const useRawData = analysis === 'failed-orders';
        let analysisFilePath = filePath;
        if (!useRawData) {
            // Clean data for all other analyses
            console.log('🧹 Cleaning data before analysis...');
            cleanedFilePath = await cleanData(filePath);
            analysisFilePath = cleanedFilePath;
        }
        else {
            console.log('📊 Using RAW data for failed orders analysis (preserves original counts)...');
        }
        // Run analysis
        const report = await runAnalysis(analysis, analysisFilePath, storeNumber, topN);
        res.json({ report });
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Analysis failed'
        });
    }
    finally {
        // Clean up uploaded and cleaned files
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }
        if (cleanedFilePath && existsSync(cleanedFilePath)) {
            unlinkSync(cleanedFilePath);
        }
    }
});
function runAnalysis(analysisType, filePath, storeNumber, topN) {
    return new Promise((resolve, reject) => {
        // Use npm run commands which call the TypeScript wrappers
        // These wrappers handle formatting and generating .txt reports
        const npmScriptMap = {
            'store-metrics': 'store-metrics',
            'driver-store-analysis': 'driver-store-analysis',
            'multiday-analysis': 'multiday-analysis',
            'time-breakdown': 'time-breakdown',
            'store-analysis': 'store-analysis',
            'returns-breakdown': 'returns-breakdown',
            'pending-orders': 'pending-orders',
            'failed-orders': 'failed-orders-analysis'
        };
        const npmScript = npmScriptMap[analysisType];
        if (!npmScript) {
            reject(new Error('Invalid analysis type'));
            return;
        }
        // Build command arguments
        const args = ['run', npmScript, '--'];
        if (topN && (analysisType === 'returns-breakdown' || analysisType === 'pending-orders')) {
            // For returns and pending orders, topN comes first
            args.push(topN === 'all' ? 'all' : topN);
        }
        if (storeNumber) {
            args.push(storeNumber);
        }
        args.push(filePath);
        console.log('Running: npm ' + args.join(' '));
        const npmProcess = spawn('npm', args, {
            cwd: process.cwd(),
            env: { ...process.env, FORCE_COLOR: '0' }, // Disable colors
            shell: true // Use shell for npm on all platforms
        });
        let output = '';
        let errorOutput = '';
        npmProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        npmProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        npmProcess.on('error', (error) => {
            reject(new Error('Failed to start npm: ' + error.message));
        });
        npmProcess.on('close', (code) => {
            if (code !== 0) {
                console.log(`npm process failed with code ${code}`);
                console.log(`Error output: ${errorOutput}`);
                reject(new Error(errorOutput || 'Analysis failed'));
                return;
            }
            // Try to find the report file
            const reportPatterns = {
                'store-metrics': 'store-metrics-report.txt',
                'driver-store-analysis': `driver-store-${storeNumber}-report.txt`,
                'multiday-analysis': `multiday-analysis-${storeNumber}-report.txt`,
                'time-breakdown': 'time-breakdown-report.txt',
                'store-analysis': `store-${storeNumber}-analysis-report.txt`,
                'returns-breakdown': 'returns-breakdown-report.txt',
                'pending-orders': 'pending-orders-report.txt',
                'failed-orders': 'failed-orders-analysis-report.txt'
            };
            const reportFile = reportPatterns[analysisType];
            if (reportFile && existsSync(reportFile)) {
                const report = readFileSync(reportFile, 'utf-8');
                resolve(report);
            }
            else {
                // Fall back to stdout
                resolve(output || 'Analysis completed but no report file generated');
            }
        });
    });
}
// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'route-analysis-dashboard'
    });
});
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║   Route Analysis Tool - Web Interface     ║
╚════════════════════════════════════════════╝

🌐 Server running at: http://localhost:${PORT}
📂 Upload your CSV file and select an analysis

Press Ctrl+C to stop the server
  `);
});
//# sourceMappingURL=ui-server.js.map