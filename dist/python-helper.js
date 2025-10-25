import { existsSync } from 'fs';
import { join } from 'path';
/**
 * Gets the correct Python executable path
 * - Checks for venv (local development)
 * - Falls back to system python3 (Render deployment)
 */
export function getPythonPath() {
    // Check if venv exists in parent directory (local development)
    const parentVenvPython = join(process.cwd(), '..', 'venv', 'bin', 'python3');
    if (existsSync(parentVenvPython)) {
        return parentVenvPython;
    }
    // Check if venv exists in current directory
    const venvPython = join(process.cwd(), 'venv', 'bin', 'python3');
    if (existsSync(venvPython)) {
        return venvPython;
    }
    // Fall back to system python3 (works on both Mac and Linux/Render)
    // Render will have python3 in PATH with all required packages
    return 'python3';
}
//# sourceMappingURL=python-helper.js.map