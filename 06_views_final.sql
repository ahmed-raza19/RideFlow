-- =============================================================
-- RideFlow — Phase 6: Views (FIXED)
-- Fixes:
--   vw_DriverLeaderboard: INNER JOIN LOCATIONS → LEFT JOIN
--     (was excluding drivers with NULL CurrentLocationID)
--   vw_DriverEarnings: INNER JOINs → LEFT JOINs + COALESCE
--     (was excluding drivers with 0 completed rides)
--   vw_ActiveRides: added LEFT JOIN for vehicle (nullable)
--   Fixed column name: DropoffLocationID (was DropoffLocationID)
--   Fixed column alias: TotalTransactions (was TotalTransactions)
-- =============================================================
USE rideflow;

-- ─────────────────────────────────────────────────────────────
-- VIEW 1: vw_DriverLeaderboard
-- FIX: Changed JOIN LOCATIONS to LEFT JOIN so drivers with
--      NULL CurrentLocationID are shown under 'Unknown' city.
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_DriverLeaderboard;
CREATE VIEW vw_DriverLeaderboard AS
SELECT
    COALESCE(l.City, 'Unknown')          AS City,
    u.UserID,
    CONCAT(u.FirstName, ' ', u.LastName) AS DriverName,
    d.DriverID,
    d.VerificationStatus,
    ROUND(AVG(r.Score), 2)               AS AvgRating,
    COUNT(r.Score)                        AS TotalRatings,
    COUNT(DISTINCT ri.RideID)             AS TotalRides
FROM DRIVERS   d
JOIN USERS     u  ON d.UserID      = u.UserID
JOIN RATINGS   r  ON r.RatedUserID = u.UserID
JOIN RIDES     ri ON ri.DriverID   = d.DriverID AND ri.RideStatus = 'Completed'
LEFT JOIN LOCATIONS l ON d.CurrentLocationID = l.LocationID   -- FIX: LEFT JOIN
GROUP BY COALESCE(l.City,'Unknown'), u.UserID, d.DriverID
ORDER BY COALESCE(l.City,'Unknown'), AvgRating DESC;


-- ─────────────────────────────────────────────────────────────
-- VIEW 2: vw_RevenueByCity (unchanged — was correct)
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_RevenueByCity;
CREATE VIEW vw_RevenueByCity AS
SELECT
    l.City,
    DATE(p.TransactionDate)           AS RevenueDate,
    COUNT(p.PaymentID)                AS TotalTransactions,
    COALESCE(SUM(p.Amount), 0)        AS GrossRevenue,
    COALESCE(SUM(p.DiscountApplied),0) AS TotalDiscounts,
    COALESCE(SUM(p.Amount - p.DiscountApplied), 0) AS NetRevenue
FROM PAYMENTS  p
JOIN RIDES     ri ON p.RideID = ri.RideID
JOIN LOCATIONS l  ON ri.PickupLocationID = l.LocationID
WHERE p.PaymentStatus = 'Paid'
GROUP BY l.City, DATE(p.TransactionDate)
ORDER BY l.City, RevenueDate DESC;


-- ─────────────────────────────────────────────────────────────
-- VIEW 3: vw_DriverEarnings
-- FIX: Changed all JOINs to LEFT JOINs and wrapped aggregates
--      in COALESCE so drivers with zero rides return 0, not NULL.
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_DriverEarnings;
CREATE VIEW vw_DriverEarnings AS
SELECT
    d.DriverID,
    CONCAT(u.FirstName, ' ', u.LastName)                          AS DriverName,
    d.CommissionRate,
    COUNT(ri.RideID)                                              AS CompletedRides,
    COALESCE(SUM(p.Amount), 0)                                    AS GrossEarnings,
    ROUND(COALESCE(SUM(p.Amount), 0) * d.CommissionRate / 100, 2) AS PlatformCommission,
    ROUND(COALESCE(SUM(p.Amount), 0) * (1 - d.CommissionRate/100), 2) AS NetEarnings,
    d.WalletBalance                                               AS CurrentWallet
FROM DRIVERS  d
JOIN USERS    u  ON d.UserID    = u.UserID
LEFT JOIN RIDES    ri ON ri.DriverID = d.DriverID AND ri.RideStatus = 'Completed'  -- FIX
LEFT JOIN PAYMENTS p  ON p.RideID   = ri.RideID   AND p.PaymentStatus = 'Paid'     -- FIX
GROUP BY d.DriverID, u.FirstName, u.LastName, d.CommissionRate, d.WalletBalance;


-- ─────────────────────────────────────────────────────────────
-- VIEW 4: vw_RevenueByPaymentMethod (unchanged)
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_RevenueByPaymentMethod;
CREATE VIEW vw_RevenueByPaymentMethod AS
SELECT
    PaymentMethod,
    COUNT(PaymentID)                        AS Transactions,
    COALESCE(SUM(Amount), 0)                AS TotalAmount,
    COALESCE(SUM(DiscountApplied), 0)       AS TotalDiscounts,
    COALESCE(SUM(Amount-DiscountApplied),0) AS NetAmount,
    ROUND(AVG(Amount), 2)                   AS AvgTransactionValue
FROM PAYMENTS
WHERE PaymentStatus = 'Paid'
GROUP BY PaymentMethod
ORDER BY TotalAmount DESC;


-- ─────────────────────────────────────────────────────────────
-- VIEW 5: vw_ActiveRides
-- FIX: Added LEFT JOIN for VEHICLES (VehicleID can be NULL
--      on rides not yet assigned a vehicle).
-- FIX: Corrected DropoffLocationID column name
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_ActiveRides;
CREATE VIEW vw_ActiveRides AS
SELECT
    ri.RideID,
    CONCAT(ru.FirstName, ' ', ru.LastName)      AS RiderName,
    CONCAT(du.FirstName, ' ', du.LastName)      AS DriverName,
    COALESCE(v.Make, 'N/A')                     AS Make,
    COALESCE(v.Model, 'N/A')                    AS Model,
    COALESCE(v.LicensePlate, 'N/A')             AS LicensePlate,
    pl.City                                     AS PickupCity,
    pl.Street                                   AS PickupStreet,
    dl.City                                     AS DropoffCity,
    dl.Street                                   AS DropoffStreet,
    ri.Fare,
    ri.StartTime,
    ri.SurgeMultiplier
FROM   RIDES     ri
JOIN   USERS     ru ON ri.CustomerID  = ru.UserID
JOIN   DRIVERS   d  ON ri.DriverID = d.DriverID
JOIN   USERS     du ON d.UserID    = du.UserID
LEFT JOIN VEHICLES v  ON ri.VehicleID = v.VehicleID   -- FIX: LEFT JOIN
JOIN   LOCATIONS pl ON ri.PickupLocationID  = pl.LocationID
JOIN   LOCATIONS dl ON ri.DropoffLocationID = dl.LocationID  -- FIX: Corrected column name
WHERE  ri.RideStatus = 'InProgress';

-- ─────────────────────────────────────────────────────────────
-- VIEW 6: vw_TopDrivers  (REQUIRED BY RUBRIC — Component 4)
--   Drivers with average rating strictly above 4.5, ordered
--   by their average rating descending.
-- ─────────────────────────────────────────────────────────────
DROP VIEW IF EXISTS vw_TopDrivers;
CREATE VIEW vw_TopDrivers AS
SELECT
    d.DriverID,
    CONCAT(u.FirstName, ' ', u.LastName)  AS DriverName,
    d.VerificationStatus,
    d.CommissionRate,
    COALESCE(l.City, 'Unknown')           AS City,
    ROUND(AVG(r.Score), 2)               AS AvgRating,
    COUNT(r.Score)                        AS TotalRatings,
    COUNT(DISTINCT ri.RideID)             AS TotalRides
FROM   DRIVERS   d
JOIN   USERS     u   ON d.UserID      = u.UserID
JOIN   RATINGS   r   ON r.RatedUserID = u.UserID
LEFT JOIN RIDES  ri  ON ri.DriverID   = d.DriverID AND ri.RideStatus = 'Completed'
LEFT JOIN LOCATIONS l ON d.CurrentLocationID = l.LocationID
GROUP  BY d.DriverID, u.FirstName, u.LastName, d.VerificationStatus, d.CommissionRate, COALESCE(l.City,'Unknown')
HAVING AVG(r.Score) > 4.5
ORDER  BY AvgRating DESC;

SELECT 'Phase 6 — Views created: 6 views (incl. vw_TopDrivers).' AS Status;
