/**
 * Report Generator V2 - Complete rewrite to match actual Python script outputs
 * Handles all Nash CSV analysis types with proper data structure mapping
 */
export interface AnalysisResult {
    [key: string]: any;
}
/**
 * Main entry point - detects analysis type and generates appropriate report
 */
export declare function generateReport(data: AnalysisResult, analysisType: string, ranking?: string | number): {
    report: string;
    summary: string;
};
//# sourceMappingURL=report-generator-v2.d.ts.map