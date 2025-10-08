const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const VENV_DIR = 'venv';

/**
 * Executes a command and streams its output to the console.
 * @param {string} command The command to execute.
 * @returns {Promise<void>} A promise that resolves when the command is complete.
 */
function runCommand(command) {
    return new Promise((resolve, reject) => {
        console.log(`> ${command}`);
        const process = exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${command}`);
                console.error(stderr);
                reject(error);
                return;
            }
            resolve();
        });

        process.stdout.pipe(process.stdout);
        process.stderr.pipe(process.stderr);
    });
}

/**
 * Checks if a command exists.
 * @param {string} command The command to check.
 * @returns {boolean} True if the command exists, false otherwise.
 */
function commandExists(command) {
    try {
        execSync(command, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Main setup function.
 */
async function setupPython() {
    console.log('--- Setting up Python environment ---');

    // 1. Check for Python
    const pythonCmd = commandExists('python3') ? 'python3' : 'python';
    if (!commandExists(pythonCmd)) {
        console.error('Error: Python is not installed or not in the system PATH.');
        console.error('Please install Python 3.11+ and try again.');
        process.exit(1);
    }
    console.log(`Found Python executable: ${pythonCmd}`);

    // 2. Create virtual environment
    if (fs.existsSync(VENV_DIR)) {
        console.log('Virtual environment already exists. Skipping creation.');
    } else {
        console.log('Creating Python virtual environment...');
        await runCommand(`${pythonCmd} -m venv ${VENV_DIR}`);
    }

    // 3. Determine platform-specific paths
    const isWindows = process.platform === 'win32';
    const pythonExecutable = isWindows
        ? path.join(VENV_DIR, 'Scripts', 'python.exe')
        : path.join(VENV_DIR, 'bin', 'python');

    const pipExecutable = isWindows
        ? path.join(VENV_DIR, 'Scripts', 'pip.exe')
        : path.join(VENV_DIR, 'bin', 'pip');

    // 4. Install dependencies
    console.log('Installing Python dependencies from requirements.txt...');
    await runCommand(`"${pythonExecutable}" -m pip install -r requirements.txt`);

    console.log('--- Python setup complete ---');
}

setupPython().catch(error => {
    console.error('An error occurred during Python setup:', error);
    process.exit(1);
});