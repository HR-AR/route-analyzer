import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Gets the correct Python executable path
 * - Checks for venv (local development)
 * - Falls back to system python3 (Render deployment)
 */
export function getPythonPath(): string {
  // Check if venv exists (local development)
  const venvPython = join(process.cwd(), 'venv', 'bin', 'python3');
  if (existsSync(venvPython)) {
    return venvPython;
  }
  // Use full path to ensure we get the Homebrew Python with all packages
  return '/opt/homebrew/bin/python3';
}
