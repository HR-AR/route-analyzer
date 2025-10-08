import express from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import { resolve, join } from 'path';
import { readFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';

const app = express();
const port = 3000;

// --- Setup Upload Directory ---
const UPLOAD_DIR = 'uploads';
if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR);
}
const upload = multer({ dest: UPLOAD_DIR });


// --- HTML Template ---
const getHtml = (result = '', error = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Route Analysis Tool</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 2em; background-color: #f4f4f9; color: #333; }
        h1 { color: #444; }
        .container { max-width: 800px; margin: auto; background: white; padding: 2em; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        form { display: flex; flex-direction: column; gap: 1em; }
        label { font-weight: bold; }
        input, select, button { padding: 0.8em; border-radius: 4px; border: 1px solid #ccc; font-size: 1em; }
        button { background-color: #007bff; color: white; border: none; cursor: pointer; transition: background-color 0.2s; }
        button:hover { background-color: #0056b3; }
        #storeIdInput { display: none; }
        .result-container { margin-top: 2em; }
        .result { background: #e9ecef; padding: 1em; border-radius: 4px; white-space: pre-wrap; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace; max-height: 500px; overflow-y: auto; }
        .error { background: #f8d7da; color: #721c24; padding: 1em; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Route Analysis Tool</h1>
        <form action="/analyze" method="post" enctype="multipart/form-data">
            <label for="csvfile">Upload CSV File:</label>
            <input type="file" id="csvfile" name="csvfile" required>

            <label for="analysisType">Select Analysis:</label>
            <select id="analysisType" name="analysisType" onchange="toggleStoreId()">
                <option value="time-breakdown">Time Breakdown</option>
                <option value="store-analysis">Store-Specific Analysis</option>
                <option value="returns-breakdown">Returns Breakdown</option>
                <option value="basic">Basic Route Analysis</option>
            </select>

            <div id="storeIdInput">
                <label for="storeId">Store ID:</label>
                <input type="text" id="storeId" name="storeId" placeholder="e.g., 2242">
            </div>

            <button type="submit">Run Analysis</button>
        </form>

        <div class="result-container">
            ${error ? `<div class="error"><h2>Error</h2><pre>${error}</pre></div>` : ''}
            ${result ? `<div class="result"><h2>Analysis Report</h2><pre>${result}</pre></div>` : ''}
        </div>
    </div>

    <script>
        function toggleStoreId() {
            const analysisType = document.getElementById('analysisType').value;
            const storeIdInput = document.getElementById('storeIdInput');
            if (analysisType === 'store-analysis') {
                storeIdInput.style.display = 'block';
                document.getElementById('storeId').required = true;
            } else {
                storeIdInput.style.display = 'none';
                document.getElementById('storeId').required = false;
            }
        }
    </script>
</body>
</html>
`;

// --- Routes ---
app.get('/', (req, res) => {
    res.send(getHtml());
});

app.post('/analyze', upload.single('csvfile'), (req, res) => {
    if (!req.file) {
        return res.status(400).send(getHtml('', 'No file uploaded.'));
    }

    const analysisType = req.body.analysisType;
    const storeId = req.body.storeId;
    const csvPath = resolve(req.file.path);

    let scriptPath = '';
    const args = [csvPath];

    switch (analysisType) {
        case 'time-breakdown':
            scriptPath = 'dist/time-breakdown.js';
            break;
        case 'store-analysis':
            if (!storeId) {
                unlinkSync(csvPath);
                return res.status(400).send(getHtml('', 'Store ID is required for this analysis.'));
            }
            scriptPath = 'dist/store-analysis.js';
            args.unshift(storeId); // Add storeId as the first argument
            break;
        case 'returns-breakdown':
            scriptPath = 'dist/returns-breakdown.js';
            break;
        case 'basic':
            scriptPath = 'dist/cli.js';
            break;
        default:
            unlinkSync(csvPath);
            return res.status(400).send(getHtml('', 'Invalid analysis type selected.'));
    }

    const process = spawn('node', [scriptPath, ...args]);

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
        stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
        stderr += data.toString();
    });

    process.on('close', (code) => {
        unlinkSync(csvPath); // Always clean up the uploaded file

        if (code !== 0) {
            console.error(`Execution failed with code ${code}:\n${stderr}`);
            return res.status(500).send(getHtml('', `Error running analysis:\n\n${stderr}`));
        }

        let reportContent = '';
        // For 'basic' analysis, the output is pure JSON on stdout.
        if (analysisType === 'basic') {
            try {
                // The actual JSON might be mixed with other stdout, so we find the first '{'
                const jsonStart = stdout.indexOf('{');
                if (jsonStart !== -1) {
                    const jsonString = stdout.substring(jsonStart);
                    const parsedJson = JSON.parse(jsonString);
                    reportContent = JSON.stringify(parsedJson, null, 2);
                } else {
                    throw new Error("No JSON object found in output.");
                }
            } catch (e) {
                reportContent = `Failed to parse JSON output:\n\n${stdout}`;
            }
        } else {
            // For other analyses, they log the path to a .txt report file.
            const reportPathMatch = stdout.match(/Report saved to: (.*\.txt)/);
            if (reportPathMatch && reportPathMatch[1]) {
                const reportPath = reportPathMatch[1].trim();
                try {
                    reportContent = readFileSync(reportPath, 'utf-8');
                } catch (e) {
                    reportContent = `Error reading report file: ${reportPath}\n\n${stdout}`;
                }
            } else {
                // Fallback if we can't find the report path
                reportContent = stdout;
            }
        }

        res.send(getHtml(reportContent));
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});