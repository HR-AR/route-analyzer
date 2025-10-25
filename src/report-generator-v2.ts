/**
 * Report Generator V2 - Complete rewrite to match actual Python script outputs
 * Handles all Nash CSV analysis types with proper data structure mapping
 */

export interface AnalysisResult {
  [key: string]: any;
}

// Helper function to safely format numbers
const safeFixed = (val: any, decimals: number = 2): string => {
  if (val === null || val === undefined || isNaN(val)) return '0.' + '0'.repeat(decimals);
  return Number(val).toFixed(decimals);
};

const safeNumber = (val: any, defaultVal: number = 0): number => {
  if (val === null || val === undefined || isNaN(val)) return defaultVal;
  return Number(val);
};

/**
 * Main entry point - detects analysis type and generates appropriate report
 */
export function generateReport(data: AnalysisResult, analysisType: string, ranking: string | number = 10): { report: string; summary: string } {
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
    case 'failed-orders':
      return generateFailedOrdersReport(data);
    case 'time-breakdown':
      return generateTimeBreakdownReport(data);
    default:
      return generateGenericReport(data);
  }
}

/**
 * Returns Breakdown Report
 * Expected input: { top_return_routes: [...], patterns: {total_routes_with_returns, ...} }
 */
function generateReturnsReport(data: any): { report: string; summary: string } {
  const patterns = data.patterns || {};
  const topRoutes = data.top_return_routes || [];

  let summary = `RETURNS ANALYSIS\n`;
  summary += `${'-'.repeat(60)}\n`;
  summary += `Total Routes with Returns: ${patterns.total_routes_with_returns || 0}\n`;
  summary += `Total Orders: ${patterns.total_orders || 0}\n`;
  summary += `Total Returns: ${patterns.total_returns || 0}\n`;
  summary += `Overall Return Rate: ${safeFixed(patterns.avg_return_rate, 2)}%\n`;

  let report = summary + '\n';
  report += '='.repeat(60) + '\n\n';

  if (topRoutes.length > 0) {
    report += '🚨 TOP ROUTES WITH RETURNS\n';
    report += '='.repeat(60) + '\n\n';
    topRoutes.forEach((route: any, idx: number) => {
      report += `${idx + 1}. Store ${route.store_id} - ${route.driver} (${route.carrier})\n`;
      report += `   Date: ${route.date}\n`;
      report += `   Orders: ${route.total_orders} | Returns: ${route.returned} (${safeFixed(route.return_rate, 1)}%)\n`;
      report += `   Delivered: ${route.delivered} | Pending: ${route.pending}\n\n`;
    });
  } else {
    report += '✅ NO RETURNS FOUND\n';
  }

  return { report, summary };
}

/**
 * Pending Orders Report
 * Expected input: { top_pending_routes: [...], patterns: {total_routes_with_pending, ...} }
 */
function generatePendingOrdersReport(data: any): { report: string; summary: string } {
  const patterns = data.patterns || {};
  const topRoutes = data.top_pending_routes || [];

  let summary = `PENDING ORDERS ANALYSIS\n`;
  summary += `${'-'.repeat(60)}\n`;
  summary += `Total Routes with Pending: ${patterns.total_routes_with_pending || 0}\n`;
  summary += `Total Orders: ${patterns.total_orders || 0}\n`;
  summary += `Total Pending: ${patterns.total_pending_orders || 0}\n`;
  summary += `Avg Pending Rate: ${safeFixed(patterns.avg_pending_rate * 100, 2)}%\n`;

  let report = summary + '\n';
  report += '='.repeat(60) + '\n\n';

  if (topRoutes.length > 0) {
    report += '⏳ TOP ROUTES WITH PENDING ORDERS\n';
    report += '='.repeat(60) + '\n\n';
    topRoutes.forEach((route: any, idx: number) => {
      report += `${idx + 1}. Store ${route.store_id} - ${route.driver} (${route.carrier})\n`;
      report += `   Date: ${route.date}\n`;
      report += `   Orders: ${route.total_orders} | Pending: ${route.pending} (${safeFixed(route.pending_rate * 100, 1)}%)\n`;
      report += `   Delivered: ${route.delivered} | Returned: ${route.returned}\n\n`;
    });
  } else {
    report += '✅ NO PENDING ORDERS FOUND\n';
  }

  return { report, summary };
}

/**
 * Failed Orders Report
 * Simple store-level breakdown
 */
function generateFailedOrdersReport(data: any): { report: string; summary: string } {
  // Check if this is route_analyzer output
  if (data.failed_orders_summary) {
    const summary_data = data.failed_orders_summary;

    let summary = `FAILED ORDERS ANALYSIS\n`;
    summary += `${'-'.repeat(60)}\n`;
    summary += `Total Failed Orders: ${summary_data.total_failed_orders || 0}\n`;
    summary += `Routes with Failures: ${summary_data.routes_with_failures || 0}\n`;
    summary += `Failure Rate: ${safeFixed((summary_data.total_failed_orders / summary_data.total_orders * 100), 2)}%\n`;

    let report = summary + '\n';
    report += '='.repeat(60) + '\n\n';

    // By Store breakdown
    if (data.failed_by_store && data.failed_by_store.length > 0) {
      report += '📊 FAILED ORDERS BY STORE\n';
      report += '='.repeat(60) + '\n\n';
      data.failed_by_store.forEach((store: any) => {
        report += `Store ${store.store_id}: ${store.failed_orders} failures from ${store.total_orders} orders (${safeFixed(store.failure_rate * 100, 2)}%)\n`;
      });
    }

    return { report, summary };
  }

  // Fallback for generic structure
  return generateGenericReport(data);
}

/**
 * Time Breakdown Report with Store-Level Aggregation
 */
function generateTimeBreakdownReport(data: any): { report: string; summary: string } {
  // If data has overall stats
  const overall = data.overall_stats || data.overall || {};

  let summary = `TIME BREAKDOWN ANALYSIS\n`;
  summary += `${'-'.repeat(60)}\n`;
  summary += `Total Routes: ${overall.total_routes || 0}\n`;
  summary += `Avg Dwell Time: ${safeFixed(overall.avg_dwell_time)} min\n`;
  summary += `Avg Load Time: ${safeFixed(overall.avg_load_time)} min\n`;
  summary += `Avg Driving Time: ${safeFixed(overall.avg_driving_time)} min\n`;

  let report = summary + '\n';
  report += '='.repeat(60) + '\n\n';

  // By Store if available
  if (data.by_store && Array.isArray(data.by_store)) {
    report += '📊 TIME BREAKDOWN BY STORE\n';
    report += '='.repeat(60) + '\n\n';
    data.by_store.forEach((store: any) => {
      report += `Store ${store.store_id}: ${store.routes} routes\n`;
      report += `  Avg Dwell: ${safeFixed(store.avg_dwell_time)}m | Load: ${safeFixed(store.avg_load_time)}m | Drive: ${safeFixed(store.avg_driving_time)}m\n\n`;
    });
  }

  return { report, summary };
}

/**
 * Driver Store Analysis Report
 */
function generateDriverStoreReport(data: any, rankCount: number = 10): { report: string; summary: string } {
  // Python script returns "overall" not "store_overview"
  const store_overview = data.store_overview || data.overall;
  const { driver_metrics, problem_routes } = data;

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
    worstDrivers.forEach((driver: any, idx: number) => {
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
      bestDrivers.forEach((driver: any, idx: number) => {
        report += `${idx + 1}. ${driver.driver_name || 'N/A'} (${driver.carrier || 'N/A'})\n`;
        report += `   DPH: ${safeFixed(driver.avg_dph)} | Routes: ${driver.total_routes || 0} | Orders: ${driver.total_orders || 0}\n`;
        report += `   Delivered: ${driver.total_delivered || 0} | Returns: ${driver.total_returns || 0} | Pending: ${driver.total_pending || 0}\n`;
        report += `   Dwell: ${safeFixed(driver.avg_dwell_time, 1)}m | Load: ${safeFixed(driver.avg_load_time, 1)}m\n`;
        report += `   Variance: ${(driver.avg_variance_hours || 0) >= 0 ? '+' : ''}${safeFixed(driver.avg_variance_hours)}h\n\n`;
      });
    }
  }

  return { report, summary };
}

/**
 * Store-Specific Analysis Report
 */
function generateStoreAnalysisReport(data: any): { report: string; summary: string } {
  // Python returns {summary, daily_routes, issues, trends}
  const summaryData = data.summary || {};
  const daily_routes = data.daily_routes || [];
  const issues = data.issues || {};
  const trends = data.trends || {};

  let summary = `STORE ${summaryData?.store_id || 'N/A'} ANALYSIS\n`;
  summary += `${'-'.repeat(60)}\n`;
  summary += `Total Routes: ${summaryData?.total_routes || 0}\n`;
  summary += `Total Orders: ${summaryData?.total_orders_delivered || 0}\n`;
  summary += `Avg DPH: ${safeFixed(summaryData?.avg_drops_per_hour)}\n`;
  summary += `Delivery Rate: ${safeFixed((summaryData?.total_orders_delivered / (summaryData?.total_orders_delivered + summaryData?.total_pending || 1)) * 100, 1)}%\n`;

  let report = summary + '\n';
  report += '='.repeat(60) + '\n\n';

  // Daily Routes
  if (daily_routes && daily_routes.length > 0) {
    report += '📅 DAILY PERFORMANCE\n';
    report += '='.repeat(60) + '\n\n';
    daily_routes.slice(0, 10).forEach((day: any) => {
      report += `${day.date}: ${day.routes} routes | DPH: ${safeFixed(day.drops_per_hour)} | Variance: ${day.variance_pct}%\n`;
    });
    report += '\n';
  }

  // Issues
  if (issues && Object.keys(issues).length > 0) {
    report += '⚠️ IDENTIFIED ISSUES\n';
    report += '='.repeat(60) + '\n';
    if (issues.high_variance_days) report += `High Variance Days: ${issues.high_variance_days}\n`;
    if (issues.low_dph_days) report += `Low DPH Days: ${issues.low_dph_days}\n`;
    if (issues.pending_orders_present) report += `Pending Orders: Yes\n`;
    report += '\n';
  }

  return { report, summary };
}

/**
 * Multi-Day Route Analysis Report
 */
function generateMultidayReport(data: any): { report: string; summary: string } {
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
  }

  let report = summary + '\n';
  report += '='.repeat(60) + '\n\n';

  if (routes && routes.length > 0) {
    const multiDayRoutes = routes.filter((r: any) => r.multi_day);
    if (multiDayRoutes.length > 0) {
      report += '🚨 MULTI-DAY ROUTES\n';
      report += '='.repeat(60) + '\n';
      multiDayRoutes.forEach((route: any, idx: number) => {
        report += `\n${idx + 1}. Store ${route.store_id} - ${route.courier_name} (${route.carrier})\n`;
        report += `   Trip ID: ${route.trip_id || 'N/A'}\n`;
        report += `   Pickup: ${route.pickup_complete} → Dropoff: ${route.last_dropoff}\n`;
        report += `   Working Hours: ${route.estimated_working_hours}h\n`;
      });
    } else {
      report += '\n✅ NO MULTI-DAY ROUTES FOUND\n';
    }
  }

  return { report, summary };
}

function generateMultidayAllStoresReport(data: any): { report: string; summary: string } {
  const { total_stores_analyzed, stores_with_multi_day_routes, stores } = data;

  let summary = `MULTI-DAY ROUTE ANALYSIS - ALL STORES\n`;
  summary += `${'-'.repeat(60)}\n`;
  summary += `Total Stores Analyzed: ${total_stores_analyzed || 0}\n`;
  summary += `Stores with Multi-Day Routes: ${stores_with_multi_day_routes || 0}\n`;

  let report = summary + '\n';
  report += '='.repeat(60) + '\n\n';

  if (stores && stores.length > 0) {
    report += '📦 STORES WITH MULTI-DAY ROUTES\n';
    report += '='.repeat(60) + '\n\n';
    stores.forEach((store: any, idx: number) => {
      report += `${idx + 1}. Store ${store.store_id}: ${store.multi_day_routes} routes (${store.pct_multi_day}%)\n`;
    });
  } else {
    report += '\n✅ NO STORES WITH MULTI-DAY ROUTES\n';
  }

  return { report, summary };
}

/**
 * BigQuery KPI Analysis Report
 */
function generateBigQueryKPIReport(data: any): { report: string; summary: string } {
  const { overall, store_metrics, top_10_stores, bottom_10_stores } = data;

  let summary = `BIGQUERY KPI ANALYSIS\n`;
  summary += `${'-'.repeat(60)}\n`;
  if (overall) {
    summary += `Total Routes: ${overall.total_routes || 0}\n`;
    summary += `Total Orders: ${overall.total_orders || 0}\n`;
    summary += `Unique Stores: ${overall.unique_stores || 0}\n`;
    summary += `Avg Batch Density: ${safeFixed(overall.batch_density)}\n`;
    summary += `Avg Dwell Time: ${safeFixed(overall.avg_dwell_time)} min\n`;
    summary += `Avg Load Time: ${safeFixed(overall.avg_load_time)} min\n`;
    summary += `Avg Driving Time: ${safeFixed(overall.avg_driving_time)} min\n`;
  }

  let report = summary + '\n';
  report += '='.repeat(60) + '\n\n';

  // Top Performing Stores
  if (top_10_stores && top_10_stores.length > 0) {
    report += `📊 TOP ${top_10_stores.length} STORES (by Batch Density)\n`;
    report += '='.repeat(60) + '\n\n';
    top_10_stores.forEach((store: any, idx: number) => {
      report += `${idx + 1}. Store ${store.store_id}\n`;
      report += `   Routes: ${store.route_count || 0} | Orders: ${store.total_orders || 0} | Delivered: ${store.delivered_orders || 0}\n`;
      report += `   Batch Density: ${safeFixed(store.batch_density)} orders/route\n`;
      report += `   Dwell Time: ${safeFixed(store.avg_dwell_time)} min | Load Time: ${safeFixed(store.avg_load_time)} min\n`;
      report += `   Driving Time: ${safeFixed(store.avg_driving_time)} min | Total Time: ${safeFixed(store.avg_total_time)} min\n`;
      if (store.carriers && store.carriers.length > 0) {
        report += `   Carriers: ${store.carriers.join(', ')}\n`;
      }
      report += '\n';
    });
  }

  // Bottom Performing Stores
  if (bottom_10_stores && bottom_10_stores.length > 0) {
    report += `📉 BOTTOM ${bottom_10_stores.length} STORES (by Batch Density)\n`;
    report += '='.repeat(60) + '\n\n';
    bottom_10_stores.forEach((store: any, idx: number) => {
      report += `${idx + 1}. Store ${store.store_id}\n`;
      report += `   Routes: ${store.route_count || 0} | Orders: ${store.total_orders || 0} | Delivered: ${store.delivered_orders || 0}\n`;
      report += `   Batch Density: ${safeFixed(store.batch_density)} orders/route\n`;
      report += `   Dwell Time: ${safeFixed(store.avg_dwell_time)} min | Load Time: ${safeFixed(store.avg_load_time)} min\n`;
      report += `   Driving Time: ${safeFixed(store.avg_driving_time)} min | Total Time: ${safeFixed(store.avg_total_time)} min\n`;
      if (store.carriers && store.carriers.length > 0) {
        report += `   Carriers: ${store.carriers.join(', ')}\n`;
      }
      report += '\n';
    });
  }

  // All Store Metrics (if showing all)
  if ((!top_10_stores || top_10_stores.length === 0) && store_metrics && store_metrics.length > 0) {
    report += '📊 ALL STORE PERFORMANCE METRICS\n';
    report += '='.repeat(60) + '\n\n';
    store_metrics.forEach((store: any, idx: number) => {
      report += `${idx + 1}. Store ${store.store_id}\n`;
      report += `   Routes: ${store.route_count || 0} | Orders: ${store.total_orders || 0} | Delivered: ${store.delivered_orders || 0}\n`;
      report += `   Batch Density: ${safeFixed(store.batch_density)} orders/route\n`;
      report += `   Dwell Time: ${safeFixed(store.avg_dwell_time)} min | Load Time: ${safeFixed(store.avg_load_time)} min\n`;
      report += `   Driving Time: ${safeFixed(store.avg_driving_time)} min | Total Time: ${safeFixed(store.avg_total_time)} min\n`;
      if (store.carriers && store.carriers.length > 0) {
        report += `   Carriers: ${store.carriers.join(', ')}\n`;
      }
      report += '\n';
    });
  }

  return { report, summary };
}

/**
 * Store Metrics Report
 */
function generateStoreMetricsReport(data: any, rankCount: number = 10): { report: string; summary: string } {
  const { overall, store_metrics } = data;

  let summary = `STORE METRICS BREAKDOWN\n`;
  summary += `${'-'.repeat(60)}\n`;
  if (overall) {
    summary += `Total Routes: ${overall.total_routes || 0}\n`;
    summary += `Total Orders: ${overall.total_orders || 0}\n`;
    summary += `Avg DPH: ${safeFixed(overall.avg_dph)}\n`;
    summary += `Overall Delivery Rate: ${safeFixed(overall.total_delivered / overall.total_orders * 100, 1)}%\n`;

    // Drive Time Summary
    if (overall.avg_planned_hours !== undefined || overall.avg_actual_hours !== undefined) {
      const planned = safeNumber(overall.avg_planned_hours);
      const actual = safeNumber(overall.avg_actual_hours);
      const variance = safeNumber(overall.avg_variance_hours);
      const variancePct = planned > 0 ? ((actual - planned) / planned * 100) : 0;

      summary += `Avg Planned Drive Time: ${safeFixed(planned, 2)} hrs\n`;
      if (overall.avg_actual_hours !== undefined) {
        summary += `Avg Actual Drive Time: ${safeFixed(actual, 2)} hrs\n`;
        summary += `Avg Variance: ${variance >= 0 ? '+' : ''}${safeFixed(variance, 2)} hrs (${variancePct >= 0 ? '+' : ''}${safeFixed(variancePct, 1)}%)\n`;
      }
    }
  }

  let report = summary + '\n';
  report += '='.repeat(60) + '\n\n';

  if (store_metrics && store_metrics.length > 0) {
    const showCount = rankCount === -1 ? store_metrics.length : rankCount;

    report += `📊 TOP PERFORMING STORES - ${rankCount === -1 ? 'All' : `Top ${showCount}`}\n`;
    report += '='.repeat(60) + '\n';
    const topStores = rankCount === -1 ? store_metrics : store_metrics.slice(0, showCount);
    topStores.forEach((store: any, idx: number) => {
      report += `\n${idx + 1}. Store ${store.store_id || 'N/A'}\n`;
      report += `   Routes: ${store.routes || 0} | Orders: ${store.total_orders || 0}\n`;
      report += `   DPH: ${safeFixed(store.avg_dph)} | Delivery Rate: ${safeFixed(store.delivery_rate)}%\n`;
      report += `   Returns: ${store.returned_orders || 0} | Pending: ${store.pending_orders || 0}\n`;

      // Drive Time Metrics
      if (store.avg_planned_hours !== undefined || store.avg_actual_hours !== undefined) {
        const planned = safeNumber(store.avg_planned_hours);
        const actual = safeNumber(store.avg_actual_hours);
        const variance = safeNumber(store.avg_variance_hours);
        const variancePct = planned > 0 ? ((actual - planned) / planned * 100) : 0;

        report += `   Planned Drive Time: ${safeFixed(planned, 2)} hrs`;
        if (store.avg_actual_hours !== undefined) {
          report += ` | Actual: ${safeFixed(actual, 2)} hrs`;
          report += ` | Variance: ${variance >= 0 ? '+' : ''}${safeFixed(variance, 2)} hrs (${variancePct >= 0 ? '+' : ''}${safeFixed(variancePct, 1)}%)`;
        }
        report += `\n`;
      }
    });

    if (rankCount !== -1) {
      report += `\n\n📉 BOTTOM PERFORMING STORES - Bottom ${showCount}\n`;
      report += '='.repeat(60) + '\n';
      const bottomStores = store_metrics.slice(-showCount).reverse();
      bottomStores.forEach((store: any, idx: number) => {
        report += `\n${idx + 1}. Store ${store.store_id || 'N/A'}\n`;
        report += `   Routes: ${store.routes || 0} | Orders: ${store.total_orders || 0}\n`;
        report += `   DPH: ${safeFixed(store.avg_dph)} | Delivery Rate: ${safeFixed(store.delivery_rate)}%\n`;
        report += `   Returns: ${store.returned_orders || 0} | Pending: ${store.pending_orders || 0}\n`;

        // Drive Time Metrics
        if (store.avg_planned_hours !== undefined || store.avg_actual_hours !== undefined) {
          const planned = safeNumber(store.avg_planned_hours);
          const actual = safeNumber(store.avg_actual_hours);
          const variance = safeNumber(store.avg_variance_hours);
          const variancePct = planned > 0 ? ((actual - planned) / planned * 100) : 0;

          report += `   Planned Drive Time: ${safeFixed(planned, 2)} hrs`;
          if (store.avg_actual_hours !== undefined) {
            report += ` | Actual: ${safeFixed(actual, 2)} hrs`;
            report += ` | Variance: ${variance >= 0 ? '+' : ''}${safeFixed(variance, 2)} hrs (${variancePct >= 0 ? '+' : ''}${safeFixed(variancePct, 1)}%)`;
          }
          report += `\n`;
        }
      });
    }
  }

  return { report, summary };
}

/**
 * Generic fallback report generator
 */
function generateGenericReport(data: any): { report: string; summary: string } {
  if (data.report && typeof data.report === 'string') {
    const summary = data.summary || data.report.substring(0, 500);
    return { report: data.report, summary };
  }

  let summary = 'ANALYSIS RESULTS\n';
  summary += `${'-'.repeat(60)}\n`;

  const report = JSON.stringify(data, null, 2);
  summary += report.substring(0, 500) + '...';

  return { report, summary };
}
