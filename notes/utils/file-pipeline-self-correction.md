# File-Based Pipeline - Self-Correction Hints

## Common Failures & Quick Fixes

### Failure: Python script fails with `FileNotFoundError`
**Root Cause**: The path passed from Node.js is incorrect or relative paths are mismatched.

**Fix**:
- Use `path.resolve()` or `path.join(__dirname, ...)` to create absolute, reliable paths
- Ensure the temporary directory exists before running the script

```typescript
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const scriptPath = path.resolve(__dirname, '../scripts/analysis/main_file.py');
```

### Failure: `Error: ENOENT: no such file or directory, open './tmp/route-analysis/..._output.json'`
**Root Cause**: The Python script either failed before it could create the output file or it never created it at all.

**Fix**:
- Check the `stderr` from the `execFile` call for Python exceptions and log them
- Add error handling to verify the Python script completed successfully
- Check Python script logs to identify the failure point

```typescript
if (stderr) {
  console.error(`Python stderr: ${stderr}`);
  // Check if output file exists before trying to read
  const exists = await fs.access(outputFile).then(() => true).catch(() => false);
  if (!exists) {
    throw new Error(`Output file was not created. Script may have failed: ${stderr}`);
  }
}
```
