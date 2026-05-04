-- =============================================================
-- RideFlow — Phase 5: Stored Procedures (FIXED)
-- Fix: CalculateFare used CASE with multiple SET per branch
--      which is invalid MySQL syntax. Replaced with IF/ELSEIF.
-- =============================================================
USE rideflow;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────
-- PROCEDURE 1: CalculateFare(RideID)
-- FIX: Replaced CASE...WHEN with IF/ELSEIF to allow multiple
--      SET statements per branch (MySQL CASE restriction).
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS CalculateFare$$
CREATE PROCEDURE CalculateFare(IN p_RideID INT)
BEGIN
    DECLARE v_vehicle_type VARCHAR(20);
    DECLARE v_distance     DECIMAL(10,2);
    DECLARE v_duration_min DECIMAL(10,2);
    DECLARE v_surge        DECIMAL(3,2);
    DECLARE v_base         DECIMAL(10,2) DEFAULT 50.00;
    DECLARE v_per_km       DECIMAL(10,2) DEFAULT 20.00;
    DECLARE v_per_min      DECIMAL(10,2) DEFAULT 2.00;
    DECLARE v_fare         DECIMAL(10,2);

    SELECT v.VehicleType,
           r.Distance,
           TIMESTAMPDIFF(MINUTE, r.StartTime, r.EndTime),
           r.SurgeMultiplier
      INTO v_vehicle_type, v_distance, v_duration_min, v_surge
      FROM RIDES r
      JOIN VEHICLES v ON r.VehicleID = v.VehicleID
     WHERE r.RideID = p_RideID;

    -- FIX: Use IF/ELSEIF instead of CASE for multi-SET branches
    IF v_vehicle_type = 'Economy' THEN
        SET v_base = 50.00; SET v_per_km = 20.00; SET v_per_min = 2.00;
    ELSEIF v_vehicle_type = 'Business' THEN
        SET v_base = 100.00; SET v_per_km = 35.00; SET v_per_min = 4.00;
    ELSEIF v_vehicle_type = 'Bike' THEN
        SET v_base = 30.00; SET v_per_km = 12.00; SET v_per_min = 1.50;
    END IF;

    SET v_fare = (v_base
                  + v_per_km  * COALESCE(v_distance, 5.0)
                  + v_per_min * COALESCE(v_duration_min, 15.0)
                 ) * COALESCE(v_surge, 1.00);

    UPDATE RIDES SET Fare = ROUND(v_fare, 2) WHERE RideID = p_RideID;
    SELECT CONCAT('Fare for RideID ', p_RideID, ' set to PKR ', ROUND(v_fare,2)) AS Result;
END$$


-- ─────────────────────────────────────────────────────────────
-- PROCEDURE 2: ApplySurgePricing(RideID, Multiplier)
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS ApplySurgePricing$$
CREATE PROCEDURE ApplySurgePricing(IN p_RideID INT, IN p_Multiplier DECIMAL(3,2))
BEGIN
    IF p_Multiplier < 1.00 OR p_Multiplier > 5.00 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Surge multiplier must be between 1.00 and 5.00';
    END IF;
    UPDATE RIDES SET SurgeMultiplier = p_Multiplier WHERE RideID = p_RideID;
    CALL CalculateFare(p_RideID);
    SELECT CONCAT('Surge x', p_Multiplier, ' applied to RideID ', p_RideID) AS Result;
END$$


-- ─────────────────────────────────────────────────────────────
-- PROCEDURE 3: ApplyPromoCode(RideID, PromoCode)
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS ApplyPromoCode$$
CREATE PROCEDURE ApplyPromoCode(IN p_RideID INT, IN p_Code VARCHAR(20))
BEGIN
    DECLARE v_promo_id    INT DEFAULT NULL;
    DECLARE v_disc_pct    DECIMAL(5,2);
    DECLARE v_max_disc    DECIMAL(10,2);
    DECLARE v_valid_from  DATETIME;
    DECLARE v_valid_to    DATETIME;
    DECLARE v_usage_limit INT;
    DECLARE v_usage_count INT;
    DECLARE v_status      VARCHAR(20);
    DECLARE v_fare        DECIMAL(10,2);
    DECLARE v_rider_id    INT;
    DECLARE v_discount    DECIMAL(10,2);

    SELECT PromoCodeID, DiscountPercentage, MaxDiscount,
           ValidFrom, ValidTo, UsageLimit, UsageCount, Status
      INTO v_promo_id, v_disc_pct, v_max_disc,
           v_valid_from, v_valid_to, v_usage_limit, v_usage_count, v_status
      FROM PROMOCODES WHERE Code = p_Code;

    IF v_promo_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Promo code not found.';
    END IF;
    IF v_status != 'Active' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Promo code is not active.';
    END IF;
    IF NOW() NOT BETWEEN v_valid_from AND v_valid_to THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Promo code has expired or is not yet valid.';
    END IF;
    IF v_usage_count >= v_usage_limit THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Promo code usage limit reached.';
    END IF;

    SELECT Fare, RiderID INTO v_fare, v_rider_id FROM RIDES WHERE RideID = p_RideID;

    SET v_discount = v_fare * (v_disc_pct / 100.0);
    IF v_max_disc IS NOT NULL AND v_discount > v_max_disc THEN
        SET v_discount = v_max_disc;
    END IF;

    UPDATE PAYMENTS
       SET DiscountApplied = v_discount,
           Amount          = GREATEST(v_fare - v_discount, 0),
           PromoCodeID     = v_promo_id
     WHERE RideID = p_RideID;

    UPDATE PROMOCODES SET UsageCount = UsageCount + 1 WHERE PromoCodeID = v_promo_id;
    INSERT IGNORE INTO USER_PROMOCODES (UserID, PromoCodeID) VALUES (v_rider_id, v_promo_id);

    SELECT CONCAT('Promo ', p_Code, ' applied. Discount: PKR ', ROUND(v_discount,2)) AS Result;
END$$


-- ─────────────────────────────────────────────────────────────
-- PROCEDURE 4: RequestPayout(DriverID)
-- ─────────────────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS RequestPayout$$
CREATE PROCEDURE RequestPayout(IN p_DriverID INT)
BEGIN
    DECLARE v_balance DECIMAL(10,2) DEFAULT NULL;
    SELECT WalletBalance INTO v_balance FROM DRIVERS WHERE DriverID = p_DriverID;
    IF v_balance IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Driver not found.';
    END IF;
    IF v_balance <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient wallet balance for payout.';
    END IF;
    SELECT CONCAT('Payout of PKR ', ROUND(v_balance,2), ' approved for DriverID ', p_DriverID) AS Result;
    UPDATE DRIVERS SET WalletBalance = 0.00 WHERE DriverID = p_DriverID;
END$$

DELIMITER ;
SELECT 'Phase 5 — Stored procedures fixed and created.' AS Status;
