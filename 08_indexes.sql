-- =============================================================
-- RideFlow — Phase 8: Indexes & Optimization
-- =============================================================
USE rideflow;

-- ─── RIDES table ─────────────────────────────────────────────
-- Speed up queries that filter by rider, driver, or ride status
CREATE INDEX  idx_rides_riderid     ON RIDES (RiderID);
CREATE INDEX  idx_rides_driverid    ON RIDES (DriverID);
CREATE INDEX  idx_rides_status      ON RIDES (RideStatus);
CREATE INDEX  idx_rides_starttime   ON RIDES (StartTime);

-- ─── RATINGS table ───────────────────────────────────────────
-- Fast average-rating computation per rated user
CREATE INDEX  idx_ratings_rateduserid ON RATINGS (RatedUserID);
CREATE INDEX  idx_ratings_rideid      ON RATINGS (RideID);

-- ─── LOCATIONS table ─────────────────────────────────────────
-- City-based grouping used in revenue and leaderboard views
CREATE INDEX  idx_locations_city ON LOCATIONS (City);

-- ─── PAYMENTS table ──────────────────────────────────────────
-- Date-range financial queries
CREATE INDEX idx_payments_transdate  ON PAYMENTS (TransactionDate);
CREATE INDEX  idx_payments_status     ON PAYMENTS (PaymentStatus);
CREATE INDEX idx_payments_riderid    ON PAYMENTS (RiderID);

-- ─── USERS table ─────────────────────────────────────────────
-- Login lookup by email, role-based filtering
CREATE INDEX  idx_users_email  ON USERS (Email);
CREATE INDEX  idx_users_role   ON USERS (Role);

-- ─── DRIVERS table ───────────────────────────────────────────
-- Matching available drivers
CREATE INDEX  idx_drivers_availability ON DRIVERS (AvailabilityStatus);
CREATE INDEX  idx_drivers_location     ON DRIVERS (CurrentLocationID);

-- ─── COMPLAINTS table ────────────────────────────────────────
CREATE INDEX  idx_complaints_status ON COMPLAINTS (ComplaintStatus);

-- Verify index creation
SHOW INDEX FROM RIDES;
SHOW INDEX FROM PAYMENTS;
SHOW INDEX FROM RATINGS;

SELECT 'Phase 8 — Indexes created.' AS Status;
