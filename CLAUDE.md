# Project Context

## Core Principles (Effective Context Engineering)
1. **Validation-Driven**: Done = validation passes
2. **Self-Correcting**: On failure, analyze → fix → revalidate
3. **Precedent over Instruction**: Examples define standards
4. **Dynamic Context**: Context auto-updates from codebase

## Tech Stack
- Node.js 20.x
- TypeScript 5.x
- Python 3.11+ (data analysis)
- pandas, numpy (data processing)
- PostgreSQL 15 + Prisma (future state)
- Jest for testing

## Validation Gates (must ALL pass)
```bash
npm run lint
npm run test
npm run build
```

## Self-Correction Protocol
1. Capture full error output
2. Analyze root cause
3. Apply minimal, standards-aligned fix
4. Re-run validation
5. Repeat until success

## Current Focus

**Dedicated Van Delivery Route Analysis**

Analyze raw delivery route data to:
- Verify planned vs actual time on road
- Compare 10AM departure (8.33hr routes) vs 12PM departure (7.33hr routes)
- Identify outliers (extended breaks, inefficiencies)
- Maximize road time for better batch density and cost reduction
- Provide quick analysis interface for regular data pulls

**Goal**: Maximize time on road → higher batch density → lower cost per delivery

## Discovered Patterns
- Microservice API (HTTP): examples/api/microservice-http.ts (validate: Mock fetch with undici/msw for unit tests; Docker Compose for integration tests)
- Child Process Invocation: examples/utils/child-process-python.ts (validate: Unit test by mocking spawn; integration test with actual Python script)
- File-Based Data Pipeline: examples/utils/file-based-pipeline.ts (validate: Mock fs operations for unit tests; integration test with real files)
