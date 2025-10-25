import { z } from 'zod';
declare const AnalysisRequestSchema: z.ZodObject<{
    csvPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    csvPath: string;
}, {
    csvPath: string;
}>;
export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;
declare const AnalysisResultSchema: z.ZodObject<{
    summary: z.ZodObject<{
        total_routes: z.ZodNumber;
        outlier_routes: z.ZodNumber;
        outlier_percentage: z.ZodNumber;
        routes_with_extended_dwell: z.ZodNumber;
        routes_with_extended_load: z.ZodNumber;
        avg_actual_hours: z.ZodNumber;
        avg_target_hours: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total_routes: number;
        outlier_routes: number;
        outlier_percentage: number;
        routes_with_extended_dwell: number;
        routes_with_extended_load: number;
        avg_actual_hours: number;
        avg_target_hours: number;
    }, {
        total_routes: number;
        outlier_routes: number;
        outlier_percentage: number;
        routes_with_extended_dwell: number;
        routes_with_extended_load: number;
        avg_actual_hours: number;
        avg_target_hours: number;
    }>;
    departure_time_analysis: z.ZodObject<{
        '10AM_routes': z.ZodObject<{
            count: z.ZodNumber;
            target_hours: z.ZodNumber;
            avg_actual_hours: z.ZodNumber;
            avg_variance_pct: z.ZodNumber;
            outliers: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        }, {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        }>;
        '12PM_routes': z.ZodObject<{
            count: z.ZodNumber;
            target_hours: z.ZodNumber;
            avg_actual_hours: z.ZodNumber;
            avg_variance_pct: z.ZodNumber;
            outliers: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        }, {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        '10AM_routes': {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        };
        '12PM_routes': {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        };
    }, {
        '10AM_routes': {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        };
        '12PM_routes': {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        };
    }>;
    carrier_performance: z.ZodRecord<z.ZodString, z.ZodAny>;
    worst_performing_routes: z.ZodArray<z.ZodAny, "many">;
    over_target_routes: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    summary: {
        total_routes: number;
        outlier_routes: number;
        outlier_percentage: number;
        routes_with_extended_dwell: number;
        routes_with_extended_load: number;
        avg_actual_hours: number;
        avg_target_hours: number;
    };
    departure_time_analysis: {
        '10AM_routes': {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        };
        '12PM_routes': {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        };
    };
    carrier_performance: Record<string, any>;
    worst_performing_routes: any[];
    over_target_routes: any[];
}, {
    summary: {
        total_routes: number;
        outlier_routes: number;
        outlier_percentage: number;
        routes_with_extended_dwell: number;
        routes_with_extended_load: number;
        avg_actual_hours: number;
        avg_target_hours: number;
    };
    departure_time_analysis: {
        '10AM_routes': {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        };
        '12PM_routes': {
            avg_actual_hours: number;
            count: number;
            target_hours: number;
            avg_variance_pct: number;
            outliers: number;
        };
    };
    carrier_performance: Record<string, any>;
    worst_performing_routes: any[];
    over_target_routes: any[];
}>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
/**
 * Analyzes route delivery data using Python script
 * @param request Analysis request with CSV path
 * @returns Promise resolving to analysis results
 */
export declare function analyzeRoutes(request: AnalysisRequest): Promise<AnalysisResult>;
export {};
//# sourceMappingURL=route-analyzer.d.ts.map