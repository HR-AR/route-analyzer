import { existsSync } from 'fs';
import { join } from 'path';
/**
 * Gets the correct Python executable path
 * - Checks for venv (local development)
 * - Falls back to system python3 (Render deployment)
 */
export function getPythonPath() {
    // Check if venv exists (local development)
    const venvPython = join(process.cwd(), 'venv', 'bin', 'python3');
    if (existsSync(venvPython)) {
        return venvPython;
    }
    // Fall back to system Python (Render deployment)
    return 'python3';
}
//# sourceMappingURL=python-helper.js.map