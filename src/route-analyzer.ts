import { spawn } from 'child_process';
import { z } from 'zod';

// Input schema for the analysis request
const AnalysisRequestSchema = z.object({
  csvPath: z.string().min(1, 'CSV path is required'),
});
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

// Output schema for analysis results
const AnalysisResultSchema = z.object({
  summary: z.object({
    total_routes: z.number(),
    outlier_routes: z.number(),
    outlier_percentage: z.number(),
    routes_with_extended_dwell: z.number(),
    routes_with_extended_load: z.number(),
    avg_actual_hours: z.number(),
    avg_target_hours: z.number(),
  }),
  departure_time_analysis: z.object({
    '10AM_routes': z.object({
      count: z.number(),
      target_hours: z.number(),
      avg_actual_hours: z.number(),
      avg_variance_pct: z.number(),
      outliers: z.number(),
    }),
    '12PM_routes': z.object({
      count: z.number(),
      target_hours: z.number(),
      avg_actual_hours: z.number(),
      avg_variance_pct: z.number(),
      outliers: z.number(),
    }),
  }),
  carrier_performance: z.record(z.any()),
  worst_performing_routes: z.array(z.any()),
  over_target_routes: z.array(z.any()),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * Analyzes route delivery data using Python script
 * @param request Analysis request with CSV path
 * @returns Promise resolving to analysis results
 */
export function analyzeRoutes(request: AnalysisRequest): Promise<AnalysisResult> {
  // Validate input
  AnalysisRequestSchema.parse(request);

  return new Promise((resolve, reject) => {
    const pythonExecutable = process.env.PYTHON_PATH || './venv/bin/python3';
    const scriptPath = './scripts/analysis/route_analyzer.py';

    const pythonProcess = spawn(pythonExecutable, [scriptPath]);

    let stdoutData = '';
    let stderrData = '';

    pythonProcess.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}: ${stderrData}`);
        return reject(new Error(`Route analysis failed: ${stderrData.trim()}`));
      }

      try {
        const result = JSON.parse(stdoutData);
        const parsedResult = AnalysisResultSchema.parse(result);
        resolve(parsedResult);
      } catch (error) {
        reject(new Error(`Failed to parse analysis result: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });

    // Send input data to Python script via stdin
    const input = JSON.stringify({ csv_path: request.csvPath });
    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();
  });
}
