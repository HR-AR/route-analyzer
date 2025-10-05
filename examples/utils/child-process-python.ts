/**
 * PATTERN: Child Process Invocation
 * USE WHEN:
 * - You need a simple, synchronous request/response interaction with a Python script.
 * - The data payload is small enough to comfortably fit in memory and pass through stdin/stdout.
 * - You want to avoid the overhead of maintaining a separate, long-running Python server.
 * KEY CONCEPTS:
 * - SPAWNING: The Node.js parent process starts (spawns) a Python child process for each request.
 * - STREAMS: Node.js writes input data to the Python process's `stdin` stream.
 * - STDOUT/STDERR: The Python script writes results to `stdout` and errors to `stderr`.
 * - SERIALIZATION: Data is exchanged between processes in a standardized format, typically JSON.
 * - ISOLATION: The Python script runs in its own process, preventing it from blocking the Node.js event loop.
 *
 * VALIDATION: Unit test by mocking spawn; integration test with actual Python script
 *
 * Source: https://nodejs.org/api/child_process.html#child_processspawncommand-args-options
 */
import { spawn } from 'child_process';
import { z } from 'zod';

// Define the shape of the input data for the Python script
const RouteDataSchema = z.array(z.object({
  tripId: z.string(),
  timestamp: z.string().datetime(),
  latitude: z.number(),
  longitude: z.number(),
}));
type RouteData = z.infer<typeof RouteDataSchema>;

// Define the expected successful output from the Python script
const AnalysisResultSchema = z.object({
  totalDistance: z.number(),
  outlierStopCount: z.number(),
  inefficiencies: z.array(z.string()),
});
type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * Invokes a Python script to analyze route data.
 * @param data The route data to be analyzed.
 * @returns A promise that resolves with the analysis result.
 */
export function analyzeRouteWithChildProcess(data: RouteData): Promise<AnalysisResult> {
  // Validate input to ensure data integrity before sending to Python
  RouteDataSchema.parse(data);

  return new Promise((resolve, reject) => {
    // Path to the Python executable and the analysis script
    // TODO: Move paths to a configuration file
    const pythonExecutable = process.env.PYTHON_PATH || 'python3';
    const scriptPath = './scripts/analysis/main.py';

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
        return reject(new Error(`Analysis script failed: ${stderrData.trim()}`));
      }
      try {
        const result = JSON.parse(stdoutData);
        // Validate the output received from the script
        const parsedResult = AnalysisResultSchema.parse(result);
        resolve(parsedResult);
      } catch (error) {
        reject(new Error('Failed to parse analysis result from Python script.'));
      }
    });

    pythonProcess.on('error', (err) => {
      reject(new Error(`Failed to spawn Python process: ${err.message}`));
    });

    // Write data to the Python process's standard input
    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();
  });
}
