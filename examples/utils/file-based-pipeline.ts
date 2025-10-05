/**
 * PATTERN: File-Based Data Pipeline
 * USE WHEN:
 * - Processing large datasets that don't fit well into stdin/stdout buffers.
 * - The analysis is a long-running, asynchronous task.
 * - You need a persistent record of the input and output for auditing or caching.
 * KEY CONCEPTS:
 * - DECOUPLING: Processes are decoupled via the file system, not direct streams.
 * - COMMAND-LINE ARGS: File paths for input and output are passed as arguments to the script.
 * - STATE MANAGEMENT: Node.js must manage the lifecycle of temporary files (creation, cleanup).
 * - ASYNCHRONICITY: The `execFile` or `spawn` call is awaited, making it a natural fit for async flows.
 *
 * VALIDATION: Mock fs operations for unit tests; integration test with real files
 *
 * Source: https://nodejs.org/api/fs.html#promises-api
 */
import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid'; // For generating unique filenames

// Use promisified version for modern async/await syntax
const execFileAsync = promisify(execFile);

// Schemas would be defined here, similar to Pattern 1...
interface RouteData { /* ... */ }
interface AnalysisResult { /* ... */ }
const TEMP_DIR = './tmp/route-analysis';

/**
 * Analyzes route data by passing file paths to a Python script.
 * @param data The route data to be analyzed, typically as a string (e.g., CSV or JSON).
 * @returns A promise that resolves with the analysis result.
 */
export async function analyzeRouteWithFiles(data: string): Promise<AnalysisResult> {
  await fs.mkdir(TEMP_DIR, { recursive: true });

  const jobId = uuidv4();
  const inputFile = path.join(TEMP_DIR, `${jobId}_input.csv`);
  const outputFile = path.join(TEMP_DIR, `${jobId}_output.json`);

  try {
    // 1. Write the input data to a temporary file
    await fs.writeFile(inputFile, data, 'utf-8');

    // 2. Execute the Python script with file paths as arguments
    const pythonExecutable = process.env.PYTHON_PATH || 'python3';
    const scriptPath = './scripts/analysis/main_file.py';

    const { stdout, stderr } = await execFileAsync(pythonExecutable, [
      scriptPath,
      '--input', inputFile,
      '--output', outputFile,
    ]);

    if (stderr) {
      console.warn(`Analysis script produced stderr output: ${stderr}`);
    }
    console.log(`Analysis script stdout: ${stdout}`); // For logging/debugging

    // 3. Read the result from the output file
    const resultJson = await fs.readFile(outputFile, 'utf-8');
    const result = JSON.parse(resultJson);

    // TODO: Add Zod validation for the result object

    return result;
  } catch (error) {
    console.error('File-based analysis pipeline failed:', error);
    throw new Error('Failed to complete route analysis.');
  } finally {
    // 4. Clean up temporary files
    // Use Promise.allSettled to ensure we attempt to delete both files
    // even if one of them fails (e.g., was never created).
    await Promise.allSettled([
      fs.unlink(inputFile),
      fs.unlink(outputFile),
    ]);
  }
}
