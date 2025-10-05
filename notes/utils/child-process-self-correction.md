# Child Process Pattern - Self-Correction Hints

## Common Failures & Quick Fixes

### Failure: `Error: spawn python3 ENOENT`
**Root Cause**: The `python3` executable is not in the system's `PATH`.

**Fix**:
- Provide the full path to the Python executable via the `PYTHON_PATH` environment variable
- Or install Python correctly and ensure it's in PATH

```bash
export PYTHON_PATH=/usr/local/bin/python3
```

### Failure: `Analysis script failed: KeyError: 'latitude'`
**Root Cause**: The input data sent from Node.js is missing a required key that `pandas` expects.

**Fix**:
- Strengthen the Zod validation (`RouteDataSchema`) in the Node.js layer to catch this before calling the script
- Ensure all required fields are present in the data before spawning the process

```typescript
// Add more specific validation
const RouteDataSchema = z.array(z.object({
  tripId: z.string().min(1),
  timestamp: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}));
```
