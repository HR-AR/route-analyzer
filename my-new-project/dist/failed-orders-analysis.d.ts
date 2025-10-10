#!/usr/bin/env node
/**
 * Failed Orders Analysis Wrapper
 * Runs the Python failed orders analyzer and formats output
 */
interface FailedOrdersArgs {
    csvPath: string;
}
declare function runFailedOrdersAnalysis(args: FailedOrdersArgs): Promise<void>;
export { runFailedOrdersAnalysis };
//# sourceMappingURL=failed-orders-analysis.d.ts.map