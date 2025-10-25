/**
 * Report Generator - Converts JSON analysis results to formatted text reports
 * Handles all Nash CSV analysis types
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
//# sourceMappingURL=report-generator.d.ts.map