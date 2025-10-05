# Route Analysis Dashboard - Usage Guide

## What This Tool Does

Analyzes Dedicated Van Delivery data to answer:
1. **Are drivers on road for planned duration?** (8.33hr @ 10AM, 7.33hr @ 12PM)
2. **Which routes/drivers are outliers?** (>10% deviation from target)
3. **What's causing variance?** (breaks, delays, route issues)

## Quick Start

```bash
# One-time setup
./setup.sh

# Run analysis
npm start -- /path/to/your/delivery-data.csv
```

## Understanding the Output

### Summary Section
```json
{
  "summary": {
    "total_routes": 289,
    "outlier_routes": 216,        // Routes >10% off target
    "outlier_percentage": 74.74,  // WARNING: 74% of routes are outliers!
    "routes_with_extended_dwell": 44,  // Breaks >30 min
    "routes_with_extended_load": 5,    // Load time >60 min
    "avg_actual_hours": 9.19,     // Average time on road
    "avg_target_hours": 7.12      // Average planned time
  }
}
```

**Key Insight**: If `outlier_percentage` is high (>20%), your routes are not matching planned targets.

### Departure Time Analysis

```json
{
  "10AM_routes": {
    "count": 182,
    "target_hours": 8.33,        // What we plan for
    "avg_actual_hours": 9.69,    // What's actually happening
    "avg_variance_pct": 16.03,   // 16% over target on average
    "outliers": 143              // 78% are outliers!
  }
}
```

**Action Items**:
- If `avg_actual_hours` >> `target_hours`: Routes taking too long (investigate delays)
- If `avg_actual_hours` << `target_hours`: Routes too short (not maximizing road time)

### Carrier Performance

```json
{
  "NTG": {
    "total_routes": 144,
    "is_outlier": 114,           // 114 outlier routes
    "outlier_rate": 79.17,       // 79% outlier rate - HIGHEST
    "has_extended_dwell": 26,    // 26 routes with long breaks
    "has_extended_load": 0
  }
}
```

**Use This To**:
- Identify carriers that need intervention
- Compare carrier performance
- Focus on carriers with high `extended_dwell` (break issues)

### Worst Performing Routes

Routes with the biggest **negative** variance (too short, not maximizing road time):

```json
{
  "Carrier": "JW Logistics",
  "Courier Name": "Jerry Ford",
  "target_hours": 8.33,
  "trip_actual_hours": 0.50,      // Only 30 minutes on road!
  "variance_percentage": -93.99,  // 94% under target
  "Driver Dwell Time": 104.73,    // 105 min break - RED FLAG!
  "Total Orders": 3               // Very few orders delivered
}
```

**Action**: Talk to this driver/carrier about the 105-minute dwell time.

### Over Target Routes

Routes exceeding planned time the most:

```json
{
  "Carrier": "DeliverOL",
  "target_hours": 8.33,
  "trip_actual_hours": 14.72,     // Almost 15 hours!
  "variance_percentage": 76.71,   // 77% over target
  "Driver Dwell Time": 12.58,     // Normal break
  "Total Orders": 76              // Lots of orders
}
```

**Possible Causes**: Traffic, route inefficiency, difficult deliveries, vehicle issues

## Real-World Analysis Example

### Scenario: Weekly Route Performance Review

```bash
# Pull this week's data from your system
# Run the analysis
npm start -- weekly-routes-2025-10-01.csv > report.json

# Review the output
cat report.json | jq '.summary'
```

### What to Look For

1. **High Outlier %** (>20%)
   - Routes not matching plan
   - Need to adjust targets or investigate delays

2. **Extended Dwell Times**
   - Drivers taking long breaks
   - Coordinate with carriers

3. **Carrier Outlier Rates**
   - Compare performance across carriers
   - Address issues with underperformers

4. **Individual Driver Issues**
   - Check `worst_performing_routes` section
   - Follow up on specific drivers

## Interpreting Variance

- **Negative variance** (-50%): Route was 50% shorter than target
  - ❌ Not maximizing road time
  - ❌ Lower batch density
  - ❌ Higher cost per delivery

- **Positive variance** (+50%): Route was 50% longer than target
  - ⚠️ Possible inefficiency
  - ⚠️ Or just high order volume (check `Total Orders`)

- **Target**: ±10% variance is acceptable

## Integration Ideas

### 1. Daily Automated Reports
```bash
#!/bin/bash
# daily-analysis.sh
npm start -- /data/daily-routes-$(date +%Y-%m-%d).csv > /reports/daily-$(date +%Y-%m-%d).json
```

### 2. Alert on High Outlier Rate
```bash
OUTLIER_PCT=$(npm start -- data.csv 2>/dev/null | jq '.summary.outlier_percentage')
if (( $(echo "$OUTLIER_PCT > 30" | bc -l) )); then
  echo "⚠️ High outlier rate: $OUTLIER_PCT%" | mail -s "Route Alert" ops@company.com
fi
```

### 3. Carrier Scorecard
```bash
npm start -- monthly-data.csv | jq '.carrier_performance' > carrier-scorecard.json
```

## Troubleshooting

### No outliers detected
- Check if CSV has correct columns
- Verify `Trip Planned Start` times are 10AM or 12PM

### All routes show "Other" departure category
- Departure times aren't 10AM or 12PM
- Adjust Python script logic for your specific times

### Negative dwell time
- Data quality issue
- `Pickup Enroute` timestamp might be after `Pickup Arrived`

## Next Steps

After analyzing your data:

1. **Identify top 3 carriers** with highest outlier rates → Schedule calls
2. **Review worst 10 routes** → Follow up with specific drivers
3. **Track week-over-week trends** → Are things improving?
4. **Adjust targets** if consistently over/under

## Support

See [README.md](../README.md) for technical details and [CLAUDE.md](../CLAUDE.md) for project context.
