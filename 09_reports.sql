-- =============================================================
-- RideFlow — Phase 9: Reporting Queries
-- All queries can be run independently after seeding.
-- =============================================================
USE rideflow;

-- ─────────────────────────────────────────────────────────────
-- REPORT 1: Total platform revenue by city (all time)
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 1 — Revenue by City' AS '';
SELECT
    City,
    SUM(TotalTransactions)  AS Transactions,
    SUM(GrossRevenue)       AS GrossRevenue_PKR,
    SUM(TotalDiscounts)     AS Discounts_PKR,
    SUM(NetRevenue)         AS NetRevenue_PKR
FROM   vw_RevenueByCity
GROUP  BY City
ORDER  BY NetRevenue_PKR DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 2: Revenue by city for a specific date range
--           (change the dates to suit your data)
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 2 — Revenue by City (April 2026)' AS '';
SELECT
    City,
    SUM(GrossRevenue)   AS GrossRevenue_PKR,
    SUM(NetRevenue)     AS NetRevenue_PKR
FROM   vw_RevenueByCity
WHERE  RevenueDate BETWEEN '2026-04-01' AND '2026-04-30'
GROUP  BY City
ORDER  BY NetRevenue_PKR DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 3: Total driver earnings and commissions paid
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 3 — Driver Earnings Summary' AS '';
SELECT
    DriverName,
    CompletedRides,
    GrossEarnings,
    PlatformCommission,
    NetEarnings,
    CurrentWallet
FROM   vw_DriverEarnings
ORDER  BY NetEarnings DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 4: Revenue breakdown by payment method
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 4 — Revenue by Payment Method' AS '';
SELECT * FROM vw_RevenueByPaymentMethod;


-- ─────────────────────────────────────────────────────────────
-- REPORT 5: Refund and dispute totals
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 5 — Refunds and Failed Payments' AS '';
SELECT
    PaymentStatus,
    COUNT(PaymentID)    AS Count,
    SUM(Amount)         AS TotalAmount_PKR
FROM   PAYMENTS
WHERE  PaymentStatus IN ('Refunded', 'Failed')
GROUP  BY PaymentStatus;


-- ─────────────────────────────────────────────────────────────
-- REPORT 6: Top 10 drivers per city by average rating
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 6 — Driver Leaderboard (Top 10 per City)' AS '';
SELECT City, DriverName, AvgRating, TotalRatings, TotalRides
FROM (
    SELECT *,
           ROW_NUMBER() OVER (PARTITION BY City ORDER BY AvgRating DESC) AS rnk
    FROM   vw_DriverLeaderboard
) ranked
WHERE rnk <= 10;

-- ─────────────────────────────────────────────────────────────
-- REPORT 7: Currently active rides
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 7 — Active (InProgress) Rides' AS '';
SELECT * FROM vw_ActiveRides;


-- ─────────────────────────────────────────────────────────────
-- REPORT 8: Open complaints summary
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 8 — Open Complaints' AS '';
SELECT
    c.ComplaintID,
    c.RideID,
    CONCAT(u.FirstName,' ',u.LastName) AS FiledBy,
    c.Description,
    c.CreatedAt
FROM   COMPLAINTS c
JOIN   USERS      u ON c.UserID = u.UserID
WHERE  c.ComplaintStatus = 'Open'
ORDER  BY c.CreatedAt DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 9: Promo code usage report
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 9 — Promo Code Usage' AS '';
SELECT
    Code,
    DiscountPercentage,
    MaxDiscount,
    UsageLimit,
    UsageCount,
    ROUND(UsageCount / UsageLimit * 100, 1) AS UsagePct,
    Status,
    ValidTo
FROM   PROMOCODES
ORDER  BY UsagePct DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 10: EXPLAIN example — verifying index on RIDES
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 10 — EXPLAIN: rides by status' AS '';
EXPLAIN SELECT RideID, RiderID, DriverID, Fare
        FROM   RIDES
        WHERE  RideStatus = 'Completed';

SELECT 'Phase 9 — Reporting queries complete.' AS Status;


-- =============================================================
-- ADDITIONAL REPORTS — Required by Rubric (Components 2 & 3)
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- REPORT 11: Aggregate + HAVING — Drivers with AVG rating < 3.5
--   (REQUIRED BY RUBRIC — Component 2: HAVING clause)
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 11 — Drivers with AVG Rating < 3.5 (HAVING clause)' AS '';
SELECT
    d.DriverID,
    CONCAT(u.FirstName, ' ', u.LastName)  AS DriverName,
    COUNT(r.Score)                         AS TotalRatings,
    ROUND(AVG(r.Score), 2)                AS AvgRating
FROM   DRIVERS  d
JOIN   USERS    u ON d.UserID      = u.UserID
JOIN   RATINGS  r ON r.RatedUserID = u.UserID
GROUP  BY d.DriverID, u.FirstName, u.LastName
HAVING AVG(r.Score) < 3.5
ORDER  BY AvgRating ASC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 12: COUNT trips completed per driver (Aggregate)
--   (REQUIRED BY RUBRIC — Component 2: COUNT with GROUP BY)
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 12 — Completed Trips per Driver (COUNT + GROUP BY)' AS '';
SELECT
    CONCAT(u.FirstName, ' ', u.LastName)  AS DriverName,
    COUNT(r.RideID)                        AS CompletedTrips,
    ROUND(SUM(r.Fare), 2)                 AS TotalFareCollected_PKR
FROM   DRIVERS d
JOIN   USERS   u  ON d.UserID    = u.UserID
JOIN   RIDES   r  ON r.DriverID  = d.DriverID
WHERE  r.RideStatus = 'Completed'
GROUP  BY d.DriverID, u.FirstName, u.LastName
ORDER  BY CompletedTrips DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 13: LEFT JOIN — ALL Riders including those with no rides
--   (REQUIRED BY RUBRIC — Component 3: LEFT JOIN)
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 13 — All Riders including those with no rides (LEFT JOIN)' AS '';
SELECT
    u.UserID,
    CONCAT(u.FirstName, ' ', u.LastName)  AS RiderName,
    u.Email,
    u.AccountStatus,
    COUNT(r.RideID)                        AS TotalRides,
    COALESCE(SUM(r.Fare), 0)              AS TotalSpent_PKR
FROM   USERS  u
LEFT JOIN RIDES r ON r.RiderID = u.UserID AND r.RideStatus = 'Completed'
WHERE  u.Role = 'Rider'
GROUP  BY u.UserID, u.FirstName, u.LastName, u.Email, u.AccountStatus
ORDER  BY TotalRides DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 14: INNER JOIN — Full Trip Report (Riders+Rides+Drivers+Vehicles)
--   (REQUIRED BY RUBRIC — Component 3: INNER JOIN)
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 14 — Full Trip Report: Riders, Rides, Drivers, Vehicles (INNER JOIN)' AS '';
SELECT
    r.RideID,
    CONCAT(ru.FirstName, ' ', ru.LastName) AS Rider,
    CONCAT(du.FirstName, ' ', du.LastName) AS Driver,
    CONCAT(v.Make, ' ', v.Model)           AS Vehicle,
    v.VehicleType,
    pl.City                                AS PickupCity,
    dl.City                                AS DropoffCity,
    r.Fare                                 AS Fare_PKR,
    r.RideStatus,
    r.StartTime,
    r.EndTime
FROM   RIDES      r
JOIN   USERS      ru ON r.RiderID   = ru.UserID
JOIN   DRIVERS    d  ON r.DriverID  = d.DriverID
JOIN   USERS      du ON d.UserID    = du.UserID
JOIN   VEHICLES   v  ON r.VehicleID = v.VehicleID
JOIN   LOCATIONS  pl ON r.PickupLocationID  = pl.LocationID
JOIN   LOCATIONS  dl ON r.DropoffLocationID = dl.LocationID
ORDER  BY r.RideID DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 15: JOIN Payments + PromoCodes — Discount per Ride
--   (REQUIRED BY RUBRIC — Component 3: JOIN on Payments+PromoCodes)
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 15 — Payment Discount Usage per Ride (Payments JOIN PromoCodes)' AS '';
SELECT
    p.PaymentID,
    p.RideID,
    p.Amount                               AS AmountPaid_PKR,
    p.DiscountApplied                      AS Discount_PKR,
    pc.Code                                AS PromoCode,
    pc.DiscountPercentage,
    p.PaymentMethod,
    p.PaymentStatus,
    p.TransactionDate
FROM   PAYMENTS   p
LEFT JOIN PROMOCODES pc ON p.PromoCodeID = pc.PromoCodeID
ORDER  BY p.TransactionDate DESC;


-- ─────────────────────────────────────────────────────────────
-- REPORT 16: Top Drivers View — avg rating > 4.5
--   (REQUIRED BY RUBRIC — Component 4: TopDriversView)
-- ─────────────────────────────────────────────────────────────
SELECT 'REPORT 16 — Top Drivers (AvgRating > 4.5) via vw_TopDrivers' AS '';
SELECT DriverName, City, AvgRating, TotalRatings, TotalRides, VerificationStatus
FROM   vw_TopDrivers;

SELECT 'Phase 9 — All 16 reports complete (Rubric-aligned).' AS Status;

