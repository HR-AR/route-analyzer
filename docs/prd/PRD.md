# Product Requirement Document

## Objective
Build a quick analysis tool to validate Dedicated Van Delivery route performance against planned targets and identify operational outliers (extended breaks, inefficiencies).

## Success Metrics
- [ ] Validation loop passes
- [ ] Correctly processes raw delivery data format
- [ ] Identifies routes deviating >10% from target hours (8.33hr @ 10AM, 7.33hr @ 12PM)
- [ ] Flags extended breaks and idle time outliers
- [ ] Generates actionable carrier performance reports

## Context for AI

### Business Goal
Maximize driver time on road to increase batch density and reduce per-delivery costs. Currently planning 8.33hr routes for 10AM departures and 7.33hr routes for 12PM departures. Need to verify actual performance matches plan and catch issues (long breaks, route inefficiencies) requiring carrier intervention.

### User Impact
Operations team needs rapid, repeatable analysis when pulling weekly/daily delivery data. Must quickly answer:
- Are drivers actually on road for planned duration?
- Which routes/drivers are outliers?
- What's causing the variance (breaks, delays, route issues)?

### Technical Constraints
- **Stack**: Python for data processing (pandas-friendly), Node.js/TypeScript for potential web interface
- **Data Format**: Raw delivery operation data (format TBD based on uploaded sample)
- **Timeline**: Quick MVP for immediate use
- **Deployment**: Local analysis tool (can upload data files) with option for future web dashboard
