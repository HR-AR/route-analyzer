/**
 * PATTERN: Microservice API (HTTP)
 * USE WHEN:
 * - The analysis logic is complex and deserves to be its own independent, scalable service.
 * - Multiple different services (not just one Node.js app) might need to use the analysis tool.
 * - You want to scale the API and data analysis components independently.
 * KEY CONCEPTS:
 * - SERVICE ORIENTATION: The Python code is a long-running server process, not a one-off script.
 * - API CONTRACT: A clear contract (e.g., OpenAPI/Swagger spec) defines the endpoints, request bodies, and responses.
 * - NETWORK COMMUNICATION: Node.js uses an HTTP client (`fetch`) to send data to the Python service.
 * - DEPLOYMENT COMPLEXITY: Requires managing, deploying, and monitoring two separate services.
 *
 * VALIDATION: Mock fetch with undici/msw for unit tests; Docker Compose for integration tests
 *
 * Source: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
 */
import { z } from 'zod';

// Schemas define the API contract between services
const RouteDataSchema = z.object({ /* ... as before ... */ });
type RouteData = z.infer<typeof RouteDataSchema>;

const AnalysisResultSchema = z.object({ /* ... as before ... */ });
type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

const ANALYSIS_SERVICE_URL = process.env.ANALYSIS_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Calls a separate Python microservice to analyze route data.
 * @param data The route data to be analyzed.
 * @returns A promise that resolves with the analysis result.
 */
export async function analyzeRouteWithApi(data: RouteData): Promise<AnalysisResult> {
  // Validate input before making a network request
  RouteDataSchema.parse(data);

  try {
    const response = await fetch(`${ANALYSIS_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Add authentication header if the service is protected
        // 'Authorization': `Bearer ${process.env.ANALYSIS_API_KEY}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      // Try to get more specific error info from the response body
      const errorBody = await response.text();
      throw new Error(
        `Analysis service responded with status ${response.status}: ${errorBody}`
      );
    }

    const result = await response.json();

    // Validate the response from the service to protect against contract violations
    return AnalysisResultSchema.parse(result);

  } catch (error) {
    if (error instanceof Error && 'cause' in error && error.cause) {
       // Catches network errors like ECONNREFUSED
       console.error('Network error calling analysis service:', error.cause);
    } else {
       console.error('API analysis request failed:', error);
    }
    throw new Error('Failed to get analysis from external service.');
  }
}
