# Microservice API Pattern - Self-Correction Hints

## Common Failures & Quick Fixes

### Failure: `FetchError: connect ECONNREFUSED 127.0.0.1:8000`
**Root Cause**: The Python analysis service is not running or is not accessible at the configured URL.

**Fix**:
- Ensure the Python service is started
- Check for firewall/networking issues
- Verify the `ANALYSIS_SERVICE_URL` environment variable is correct

```bash
# Start the Python service
cd python-service
python -m uvicorn main:app --reload --port 8000

# Or check if it's running
curl http://127.0.0.1:8000/health
```

### Failure: `Analysis service responded with status 422 Unprocessable Entity`
**Root Cause**: The JSON body sent by Node.js doesn't match the Pydantic model expected by the Python endpoint.

**Fix**:
- Compare the Zod schema in Node.js with the Pydantic schema in Python
- Look for discrepancies:
  - Missing fields
  - Wrong data types
  - `camelCase` vs. `snake_case` mismatch

```typescript
// Node.js uses camelCase
const RouteDataSchema = z.object({
  tripId: z.string(),
  startTime: z.string(),
});

// But Python Pydantic might expect snake_case
// Fix: Add field transformation or use matching naming
const RouteDataSchema = z.object({
  trip_id: z.string(),  // Match Python's snake_case
  start_time: z.string(),
});
```

### Failure: `Analysis service responded with status 500 Internal Server Error`
**Root Cause**: Unhandled exception in the Python service.

**Fix**:
- Check Python service logs for the full stack trace
- Add comprehensive error handling in the Python FastAPI endpoints
- Ensure input validation catches malformed data before processing
