# Glossary of Terms

This document defines the key metrics and terms used in the Route Analysis Tool reports.

## Core Time Metrics

**Dwell Time**
*   **Definition:** The total time a driver spends on a break or being idle during a route. This is time not spent loading, sorting, or driving.
*   **Threshold:** A route is flagged for "Extended Dwell" if this time exceeds **30 minutes**.
*   **Indicates:** Potential time management issues, long personal breaks, or unaccounted-for waiting time.

**Load Time**
*   **Definition:** The time spent at the warehouse loading the vehicle with packages for the route.
*   **Threshold:** A route is flagged for "Extended Load" if this time exceeds **60 minutes**.
*   **Indicates:** Potential warehouse inefficiencies, loading dock delays, or issues with package readiness.

**Sort Time**
*   **Definition:** Time spent by the driver organizing packages within their vehicle for efficient delivery.

**Store Time**
*   **Definition:** The total time a driver spends at a delivery location (store). This includes the time to find the package, get it to the customer, and complete the delivery scan.

**Trip Actual Time**
*   **Definition:** The total time from the start of the route to the end, as recorded. This is the "on-the-clock" time for the driver.

## Performance & Efficiency Metrics

**Variance**
*   **Definition:** The difference between the `Trip Actual Time` and the `Estimated Duration` for a route.
*   **Calculation:** `(Trip Actual Time - Estimated Duration)`
*   **Indicates:**
    *   **Positive Variance (+):** The route took longer than planned.
    *   **Negative Variance (-):** The route was completed faster than planned.
*   **Threshold:** A route is flagged for "High Variance" if it deviates significantly (e.g., by more than 50%) from its estimate.

**Drops Per Hour**
*   **Definition:** The number of successful deliveries (drops) a driver completes per hour of their `Trip Actual Time`.
*   **Calculation:** `Total Delivered Orders / (Trip Actual Time / 60)`
*   **Indicates:** The overall efficiency of a driver on a route. A higher number is better.
*   **Threshold:** A route is flagged for "Low Efficiency" if this number falls below **8 drops per hour**.

## Return Analysis Root Causes

The following terms are used in the "Returns Breakdown" report to identify the likely reason for failed deliveries.

**Catastrophic Failure**
*   **Definition:** A route where more than 50% of the orders were returned. This is a critical issue.
*   **Indicates:** A major problem with the driver, vehicle, or route assignment that needs immediate investigation.

**Extended Break / Dwell**
*   **Definition:** The driver took a break longer than the 30-minute threshold, which reduced the available time for deliveries.

**Load Issues**
*   **Definition:** The driver spent more than 60 minutes loading the vehicle, which reduced the available time for deliveries.

**Time Management Failure**
*   **Definition:** The route took an extremely long time (e.g., >15 hours) and still had returns, indicating the driver could not manage their time effectively to complete all deliveries.

**Low Efficiency**
*   **Definition:** The driver's `Drops Per Hour` was very low (<8), suggesting they were not delivering packages at a sustainable pace.

**Volume Overload**
*   **Definition:** The driver was assigned a very high number of orders (e.g., >80), making it difficult to complete all deliveries within the planned time.

**Gave Up Early**
*   **Definition:** The driver finished their route much faster than estimated but had a high number of returns.
*   **Indicates:** The driver may have returned packages without making legitimate delivery attempts in order to finish their day early.

**Customer Access Issues**
*   **Definition:** This is the default cause when no other specific factor is identified. It suggests that returns were likely due to standard delivery challenges, such as closed businesses, no secure location to leave a package, or incorrect addresses.