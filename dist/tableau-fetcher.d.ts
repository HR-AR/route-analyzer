#!/usr/bin/env node
interface FetchOptions {
    output?: string;
    startDate?: string;
    endDate?: string;
    store?: string;
    days?: number;
}
export declare function fetchTableauData(options?: FetchOptions): Promise<string>;
export {};
//# sourceMappingURL=tableau-fetcher.d.ts.map