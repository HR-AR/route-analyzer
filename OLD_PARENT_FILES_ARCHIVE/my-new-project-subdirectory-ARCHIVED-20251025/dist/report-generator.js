/**
 * Report Generator - Converts JSON analysis results to formatted text reports
 * Handles all Nash CSV analysis types
 */
/**
 * Main entry point - detects analysis type and generates appropriate report
 */
export function generateReport(data, analysisType, ranking = 10) {
    // Parse ranking parameter
    const rankCount = ranking === 'all' ? -1 : parseInt(String(ranking), 10);
    switch (analysisType) {
        case 'driver-store':
            return generateDriverStoreReport(data, rankCount);
        case 'returns':
            return generateReturnsReport(data);
        case 'pending-orders':
            return generatePendingOrdersReport(data);
        case 'store-analysis':
            return generateStoreAnalysisReport(data);
        case 'multiday':
            return generateMultidayReport(data);
        case 'bigquery-kpi':
            return generateBigQueryKPIReport(data);
        case 'store-metrics':
            return generateStoreMetricsReport(data, rankCount);
        default:
            return generateGenericReport(data);
    }
}
/**
 * Driver Store Analysis Report
 */
function generateDriverStoreReport(data, rankCount = 10) {
    const { store_overview, driver_metrics, problem_routes } = data;
    // Helper function to safely format numbers
    const safeFixed = (val, decimals = 2) => {
        if (val === null || val === undefined || isNaN(val))
            return '0.' + '0'.repeat(decimals);
        return Number(val).toFixed(decimals);
    };
    let summary = `STORE ${store_overview?.store_id || 'N/A'} - DRIVER PERFORMANCE ANALYSIS\n`;
    summary += `${'-'.repeat(60)}\n`;
    summary += `Total Routes: ${store_overview?.total_routes || 0}\n`;
    summary += `Unique Drivers: ${store_overview?.unique_drivers || 0}\n`;
    summary += `Avg DPH: ${safeFixed(store_overview?.avg_dph)}\n`;
    summary += `Delivery Rate: ${safeFixed(store_overview?.delivery_rate, 1)}%\n`;
    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';
    // Driver Performance Rankings
    report += '📊 DRIVER PERFORMANCE RANKINGS\n';
    report += '='.repeat(60) + '\n\n';
    if (driver_metrics && driver_metrics.length > 0) {
        const showCount = rankCount === -1 ? driver_metrics.length : rankCount;
        report += `WORST PERFORMERS (Lowest DPH) - ${rankCount === -1 ? 'All' : `Top ${showCount}`}:\n`;
        report += '-'.repeat(60) + '\n';
        const worstDrivers = rankCount === -1 ? driver_metrics : driver_metrics.slice(0, showCount);
        worstDrivers.forEach((driver, idx) => {
            report += `${idx + 1}. ${driver.driver_name || 'N/A'} (${driver.carrier || 'N/A'})\n`;
            report += `   DPH: ${safeFixed(driver.avg_dph)} | Routes: ${driver.total_routes || 0} | Orders: ${driver.total_orders || 0}\n`;
            report += `   Delivered: ${driver.total_delivered || 0} | Returns: ${driver.total_returns || 0} | Pending: ${driver.total_pending || 0}\n`;
            report += `   Dwell: ${safeFixed(driver.avg_dwell_time, 1)}m | Load: ${safeFixed(driver.avg_load_time, 1)}m\n`;
            report += `   Variance: ${(driver.avg_variance_hours || 0) >= 0 ? '+' : ''}${safeFixed(driver.avg_variance_hours)}h\n\n`;
        });
        if (rankCount !== -1) {
            report += `\nBEST PERFORMERS (Highest DPH) - Bottom ${showCount}:\n`;
            report += '-'.repeat(60) + '\n';
            const bestDrivers = driver_metrics.slice(-showCount).reverse();
            bestDrivers.forEach((driver, idx) => {
                report += `${idx + 1}. ${driver.driver_name || 'N/A'} (${driver.carrier || 'N/A'})\n`;
                report += `   DPH: ${safeFixed(driver.avg_dph)} | Routes: ${driver.total_routes || 0} | Orders: ${driver.total_orders || 0}\n`;
                report += `   Delivered: ${driver.total_delivered || 0} | Returns: ${driver.total_returns || 0} | Pending: ${driver.total_pending || 0}\n`;
                report += `   Dwell: ${safeFixed(driver.avg_dwell_time, 1)}m | Load: ${safeFixed(driver.avg_load_time, 1)}m\n`;
                report += `   Variance: ${(driver.avg_variance_hours || 0) >= 0 ? '+' : ''}${safeFixed(driver.avg_variance_hours)}h\n\n`;
            });
        }
    }
    // Problem Routes
    if (problem_routes) {
        report += '\n🚨 PROBLEM ROUTES ANALYSIS\n';
        report += '='.repeat(60) + '\n\n';
        if (problem_routes.high_dwell && problem_routes.high_dwell.length > 0) {
            report += 'HIGH DWELL TIME (Top 5):\n';
            report += '-'.repeat(60) + '\n';
            problem_routes.high_dwell.forEach((route, idx) => {
                report += `${idx + 1}. ${route['Courier Name']} - ${route.Date}\n`;
                report += `   Dwell: ${route['Driver Dwell Time']}m | Load: ${route['Driver Load Time']}m\n`;
                report += `   Orders: ${route['Total Orders']} | DPH: ${route.DPH}\n\n`;
            });
        }
        if (problem_routes.high_variance && problem_routes.high_variance.length > 0) {
            report += '\nHIGH VARIANCE (Top 5):\n';
            report += '-'.repeat(60) + '\n';
            problem_routes.high_variance.forEach((route, idx) => {
                report += `${idx + 1}. ${route['Courier Name']} - ${route.Date}\n`;
                report += `   Variance: ${route['Variance Hours'] >= 0 ? '+' : ''}${route['Variance Hours']}h\n`;
                report += `   Planned: ${route['Planned Time Hours']}h | Actual: ${route['Actual Time Hours']}h\n`;
                report += `   DPH: ${route.DPH}\n\n`;
            });
        }
    }
    return { report, summary };
}
/**
 * Returns Breakdown Report
 */
function generateReturnsReport(data) {
    const { overall, by_carrier, top_drivers } = data;
    let summary = `RETURNS ANALYSIS\n`;
    summary += `${'-'.repeat(60)}\n`;
    summary += `Total Routes: ${overall?.total_routes || 0}\n`;
    summary += `Total Orders: ${overall?.total_orders || 0}\n`;
    summary += `Total Returns: ${overall?.total_returns || 0} (${(overall?.return_rate || 0).toFixed(2)}%)\n`;
    summary += `Avg Returns per Route: ${(overall?.avg_returns_per_route || 0).toFixed(2)}\n`;
    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';
    // By Carrier
    if (by_carrier && by_carrier.length > 0) {
        report += '📦 RETURNS BY CARRIER\n';
        report += '='.repeat(60) + '\n';
        by_carrier.forEach((carrier) => {
            report += `\n${carrier.carrier}:\n`;
            report += `  Routes: ${carrier.routes} | Orders: ${carrier.total_orders}\n`;
            report += `  Returns: ${carrier.total_returns} (${carrier.return_rate.toFixed(2)}%)\n`;
            report += `  Avg per Route: ${carrier.avg_returns_per_route.toFixed(2)}\n`;
        });
        report += '\n';
    }
    // Top Drivers with Returns
    if (top_drivers && top_drivers.length > 0) {
        report += '\n🚨 TOP DRIVERS WITH RETURNS (Top 20)\n';
        report += '='.repeat(60) + '\n';
        top_drivers.forEach((driver, idx) => {
            report += `\n${idx + 1}. ${driver.driver_name} (${driver.carrier})\n`;
            report += `   Returns: ${driver.total_returns} from ${driver.total_orders} orders (${driver.return_rate.toFixed(2)}%)\n`;
            report += `   Routes: ${driver.routes} | Avg Returns/Route: ${driver.avg_returns_per_route.toFixed(2)}\n`;
        });
    }
    return { report, summary };
}
/**
 * Pending Orders Report
 */
function generatePendingOrdersReport(data) {
    const { overall, by_carrier, top_drivers } = data;
    let summary = `PENDING ORDERS ANALYSIS\n`;
    summary += `${'-'.repeat(60)}\n`;
    summary += `Total Routes: ${overall?.total_routes || 0}\n`;
    summary += `Total Orders: ${overall?.total_orders || 0}\n`;
    summary += `Total Pending: ${overall?.total_pending || 0} (${(overall?.pending_rate || 0).toFixed(2)}%)\n`;
    summary += `Avg Pending per Route: ${(overall?.avg_pending_per_route || 0).toFixed(2)}\n`;
    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';
    // By Carrier
    if (by_carrier && by_carrier.length > 0) {
        report += '📦 PENDING ORDERS BY CARRIER\n';
        report += '='.repeat(60) + '\n';
        by_carrier.forEach((carrier) => {
            report += `\n${carrier.carrier}:\n`;
            report += `  Routes: ${carrier.routes} | Orders: ${carrier.total_orders}\n`;
            report += `  Pending: ${carrier.total_pending} (${carrier.pending_rate.toFixed(2)}%)\n`;
            report += `  Avg per Route: ${carrier.avg_pending_per_route.toFixed(2)}\n`;
        });
        report += '\n';
    }
    // Top Drivers with Pending
    if (top_drivers && top_drivers.length > 0) {
        report += '\n🚨 TOP DRIVERS WITH PENDING ORDERS (Top 20)\n';
        report += '='.repeat(60) + '\n';
        top_drivers.forEach((driver, idx) => {
            report += `\n${idx + 1}. ${driver.driver_name} (${driver.carrier})\n`;
            report += `   Pending: ${driver.total_pending} from ${driver.total_orders} orders (${driver.pending_rate.toFixed(2)}%)\n`;
            report += `   Routes: ${driver.routes} | Avg Pending/Route: ${driver.avg_pending_per_route.toFixed(2)}\n`;
        });
    }
    return { report, summary };
}
/**
 * Store-Specific Analysis Report
 */
function generateStoreAnalysisReport(data) {
    const { store_overview, carrier_breakdown, date_summary } = data;
    let summary = `STORE ${store_overview?.store_id || 'N/A'} ANALYSIS\n`;
    summary += `${'-'.repeat(60)}\n`;
    summary += `Total Routes: ${store_overview?.total_routes || 0}\n`;
    summary += `Total Orders: ${store_overview?.total_orders || 0}\n`;
    summary += `Avg DPH: ${(store_overview?.avg_dph || 0).toFixed(2)}\n`;
    summary += `Delivery Rate: ${(store_overview?.delivery_rate || 0).toFixed(2)}%\n`;
    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';
    // Carrier Breakdown
    if (carrier_breakdown && carrier_breakdown.length > 0) {
        report += '📦 PERFORMANCE BY CARRIER\n';
        report += '='.repeat(60) + '\n';
        carrier_breakdown.forEach((carrier) => {
            report += `\n${carrier.carrier}:\n`;
            report += `  Routes: ${carrier.routes} | Orders: ${carrier.total_orders}\n`;
            report += `  DPH: ${carrier.avg_dph.toFixed(2)} | Delivery Rate: ${carrier.delivery_rate.toFixed(2)}%\n`;
            report += `  Variance: ${carrier.avg_variance >= 0 ? '+' : ''}${carrier.avg_variance.toFixed(2)}h\n`;
        });
        report += '\n';
    }
    // Daily Summary
    if (date_summary && date_summary.length > 0) {
        report += '\n📅 DAILY PERFORMANCE SUMMARY\n';
        report += '='.repeat(60) + '\n';
        date_summary.forEach((day) => {
            report += `\n${day.date}:\n`;
            report += `  Routes: ${day.routes} | Orders: ${day.total_orders}\n`;
            report += `  DPH: ${day.avg_dph.toFixed(2)} | Delivery Rate: ${day.delivery_rate.toFixed(2)}%\n`;
        });
    }
    return { report, summary };
}
/**
 * Multi-Day Route Analysis Report
 */
function generateMultidayReport(data) {
    // Check if this is an "all stores" analysis
    if (data.stores && Array.isArray(data.stores)) {
        return generateMultidayAllStoresReport(data);
    }
    // Single store analysis
    const { summary: dataSummary, routes } = data;
    let summary = `MULTI-DAY ROUTE ANALYSIS\n`;
    summary += `${'-'.repeat(60)}\n`;
    if (dataSummary) {
        summary += `Total Routes: ${dataSummary.total_routes || 0}\n`;
        summary += `Multi-Day Routes: ${dataSummary.multi_day_routes || 0} (${dataSummary.pct_multi_day || 0}%)\n`;
        summary += `Single-Day Routes: ${dataSummary.single_day_routes || 0}\n`;
        summary += `Avg Working Hours (Multi-Day): ${dataSummary.avg_working_hours_multi_day || 0}h\n`;
    }
    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';
    // Multi-day routes details
    if (routes && routes.length > 0) {
        const multiDayRoutes = routes.filter((r) => r.multi_day);
        if (multiDayRoutes.length > 0) {
            report += '🚨 MULTI-DAY ROUTES\n';
            report += '='.repeat(60) + '\n';
            multiDayRoutes.forEach((route, idx) => {
                report += `\n${idx + 1}. ${route.courier_name} (${route.carrier}) - Store ${route.store_id}\n`;
                report += `   Date: ${route.date}\n`;
                report += `   Pickup: ${route.pickup_complete} → Dropoff: ${route.last_dropoff}\n`;
                report += `   Elapsed: ${route.elapsed_hours}h | Overnight: ${route.estimated_overnight_hours}h | Working: ${route.estimated_working_hours}h\n`;
                report += `   Orders: ${route.total_orders} | Delivered: ${route.delivered_orders} | Pending: ${route.pending_orders}\n`;
                report += `   DPH: ${route.dph}\n`;
            });
        }
        else {
            report += '\n✅ NO MULTI-DAY ROUTES FOUND\n';
        }
    }
    return { report, summary };
}
/**
 * Multi-Day All Stores Report
 */
function generateMultidayAllStoresReport(data) {
    const { total_stores_analyzed, stores_with_multi_day_routes, stores } = data;
    let summary = `MULTI-DAY ROUTE ANALYSIS - ALL STORES\n`;
    summary += `${'-'.repeat(60)}\n`;
    summary += `Total Stores Analyzed: ${total_stores_analyzed || 0}\n`;
    summary += `Stores with Multi-Day Routes: ${stores_with_multi_day_routes || 0}\n`;
    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';
    // List all stores with multi-day routes
    if (stores && stores.length > 0) {
        report += '📦 STORES WITH MULTI-DAY ROUTES\n';
        report += '='.repeat(60) + '\n';
        report += '(Sorted by % of Multi-Day Routes)\n\n';
        stores.forEach((store, idx) => {
            report += `${idx + 1}. Store ${store.store_id}\n`;
            report += `   Total Routes: ${store.total_routes}\n`;
            report += `   Multi-Day: ${store.multi_day_routes} (${store.pct_multi_day}%)\n`;
            report += `   Single-Day: ${store.single_day_routes}\n\n`;
        });
    }
    else {
        report += '\n✅ NO STORES WITH MULTI-DAY ROUTES FOUND\n';
    }
    return { report, summary };
}
/**
 * BigQuery KPI Analysis Report
 */
function generateBigQueryKPIReport(data) {
    const { overall, store_metrics } = data;
    let summary = `BIGQUERY KPI ANALYSIS\n`;
    summary += `${'-'.repeat(60)}\n`;
    if (overall) {
        summary += `Total Routes: ${overall.total_routes || 0}\n`;
        summary += `Total Orders: ${overall.total_orders || 0}\n`;
        summary += `Avg Orders/Route: ${(overall.avg_orders_per_route || 0).toFixed(2)}\n`;
        summary += `Total Driving Time: ${(overall.total_driving_hours || 0).toFixed(2)}h\n`;
    }
    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';
    // Store Metrics
    if (store_metrics && store_metrics.length > 0) {
        report += '📊 STORE PERFORMANCE METRICS\n';
        report += '='.repeat(60) + '\n\n';
        store_metrics.forEach((store) => {
            report += `Store ${store.store_id}:\n`;
            report += `  Routes: ${store.routes} | Orders: ${store.total_orders}\n`;
            report += `  Batch Density: ${store.batch_density.toFixed(2)}\n`;
            report += `  Avg Dwell: ${store.avg_dwell_time.toFixed(2)}m | Avg Load: ${store.avg_load_time.toFixed(2)}m\n`;
            report += `  Total Drive Time: ${store.total_driving_hours.toFixed(2)}h\n\n`;
        });
    }
    return { report, summary };
}
/**
 * Store Metrics Report
 */
function generateStoreMetricsReport(data, rankCount = 10) {
    const { overall, store_metrics } = data;
    // Helper function to safely format numbers
    const safeFixed = (val, decimals = 2) => {
        if (val === null || val === undefined || isNaN(val))
            return '0.' + '0'.repeat(decimals);
        return Number(val).toFixed(decimals);
    };
    let summary = `STORE METRICS BREAKDOWN\n`;
    summary += `${'-'.repeat(60)}\n`;
    if (overall) {
        summary += `Total Routes: ${overall.total_routes || 0}\n`;
        summary += `Total Orders: ${overall.total_orders || 0}\n`;
        summary += `Avg DPH: ${safeFixed(overall.avg_dph)}\n`;
        summary += `Overall Delivery Rate: ${safeFixed(overall.total_delivered / overall.total_orders * 100, 1)}%\n`;
    }
    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';
    if (store_metrics && store_metrics.length > 0) {
        const showCount = rankCount === -1 ? store_metrics.length : rankCount;
        report += `📊 TOP PERFORMING STORES - ${rankCount === -1 ? 'All' : `Top ${showCount}`}\n`;
        report += '='.repeat(60) + '\n';
        const topStores = rankCount === -1 ? store_metrics : store_metrics.slice(0, showCount);
        topStores.forEach((store, idx) => {
            report += `\n${idx + 1}. Store ${store.store_id || 'N/A'}\n`;
            report += `   Routes: ${store.routes || 0} | Orders: ${store.total_orders || 0}\n`;
            report += `   DPH: ${safeFixed(store.avg_dph)} | Delivery Rate: ${safeFixed(store.delivery_rate)}%\n`;
            report += `   Variance: ${(store.avg_variance || 0) >= 0 ? '+' : ''}${safeFixed(store.avg_variance)}h\n`;
        });
        if (rankCount !== -1) {
            report += `\n\n📉 BOTTOM PERFORMING STORES - Bottom ${showCount}\n`;
            report += '='.repeat(60) + '\n';
            const bottomStores = store_metrics.slice(-showCount).reverse();
            bottomStores.forEach((store, idx) => {
                report += `\n${idx + 1}. Store ${store.store_id || 'N/A'}\n`;
                report += `   Routes: ${store.routes || 0} | Orders: ${store.total_orders || 0}\n`;
                report += `   DPH: ${safeFixed(store.avg_dph)} | Delivery Rate: ${safeFixed(store.delivery_rate)}%\n`;
                report += `   Variance: ${(store.avg_variance || 0) >= 0 ? '+' : ''}${safeFixed(store.avg_variance)}h\n`;
            });
        }
    }
    return { report, summary };
}
/**
 * Generic fallback report generator
 */
function generateGenericReport(data) {
    // If data has a report field, use it
    if (data.report && typeof data.report === 'string') {
        const summary = data.summary || data.report.substring(0, 500);
        return { report: data.report, summary };
    }
    // Otherwise generate basic JSON dump
    let summary = 'ANALYSIS RESULTS\n';
    summary += `${'-'.repeat(60)}\n`;
    const report = JSON.stringify(data, null, 2);
    summary += report.substring(0, 500) + '...';
    return { report, summary };
}
//# sourceMappingURL=report-generator.js.map