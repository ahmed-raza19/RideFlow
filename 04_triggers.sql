-- =============================================================
-- RideFlow — Phase 4: Triggers (Business Logic)
-- =============================================================
USE rideflow;

DELIMITER $$

-- ─────────────────────────────────────────────────────────────
-- TRIGGER 1: After a new RATING is inserted —
--   If the rated user is a Driver AND their new average score
--   drops below 3.5, suspend their account automatically.
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_SuspendLowRatedDriver$$
CREATE TRIGGER trg_SuspendLowRatedDriver
AFTER INSERT ON RATINGS
FOR EACH ROW
BEGIN
    DECLARE v_role        VARCHAR(20);
    DECLARE v_avg_score   DECIMAL(5,2);
    DECLARE v_driver_id   INT;

    -- Check if the rated user is a Driver
    SELECT Role INTO v_role FROM USERS WHERE UserID = NEW.RatedUserID;

    IF v_role = 'Driver' THEN
        -- Calculate new average rating for this driver
        SELECT AVG(Score)
          INTO v_avg_score
          FROM RATINGS
         WHERE RatedUserID = NEW.RatedUserID;

        IF v_avg_score < 3.5 THEN
            -- Suspend the driver's user account
            UPDATE USERS
               SET AccountStatus = 'Suspended'
             WHERE UserID = NEW.RatedUserID;

            -- Also set them offline so they can't accept rides
            UPDATE DRIVERS
               SET AvailabilityStatus = 'Offline'
             WHERE UserID = NEW.RatedUserID;
        END IF;
    END IF;
END$$


-- ─────────────────────────────────────────────────────────────
-- TRIGGER 2: After a RIDE is updated to 'Completed' —
--   Reset the driver's AvailabilityStatus back to 'Online'
--   so they can receive new ride requests.
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_DriverOnlineAfterRide$$
CREATE TRIGGER trg_DriverOnlineAfterRide
AFTER UPDATE ON RIDES
FOR EACH ROW
BEGIN
    IF NEW.RideStatus = 'Completed' AND OLD.RideStatus != 'Completed' THEN
        UPDATE DRIVERS
           SET AvailabilityStatus = 'Online'
         WHERE DriverID = NEW.DriverID;
    END IF;
END$$


-- ─────────────────────────────────────────────────────────────
-- TRIGGER 3: After a new PAYMENT is inserted —
--   Deduct platform commission from the ride fare and
--   credit the net earnings to the driver's WalletBalance.
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_CreditDriverWallet$$
CREATE TRIGGER trg_CreditDriverWallet
AFTER INSERT ON PAYMENTS
FOR EACH ROW
BEGIN
    DECLARE v_driver_id      INT;
    DECLARE v_commission_rate DECIMAL(5,2);
    DECLARE v_net_earnings   DECIMAL(10,2);

    -- Only credit on successfully paid rides
    IF NEW.PaymentStatus = 'Paid' THEN
        -- Get the DriverID from the ride
        SELECT DriverID
          INTO v_driver_id
          FROM RIDES
         WHERE RideID = NEW.RideID;

        -- Get the driver's commission rate
        SELECT CommissionRate
          INTO v_commission_rate
          FROM DRIVERS
         WHERE DriverID = v_driver_id;

        -- Net = Amount after discount, minus platform commission
        SET v_net_earnings = (NEW.Amount - NEW.DiscountApplied)
                             * (1 - v_commission_rate / 100);

        -- Credit the wallet
        UPDATE DRIVERS
           SET WalletBalance = WalletBalance + v_net_earnings
         WHERE DriverID = v_driver_id;
    END IF;
END$$


-- ─────────────────────────────────────────────────────────────
-- TRIGGER 4 (Optional): After a new RATING is inserted —
--   If the rated user is a Rider AND their average drops
--   below 3.0, flag them as Suspended for admin review.
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_FlagLowRatedRider$$
CREATE TRIGGER trg_FlagLowRatedRider
AFTER INSERT ON RATINGS
FOR EACH ROW
BEGIN
    DECLARE v_role      VARCHAR(20);
    DECLARE v_avg_score DECIMAL(5,2);

    SELECT Role INTO v_role FROM USERS WHERE UserID = NEW.RatedUserID;

    IF v_role = 'Rider' THEN
        SELECT AVG(Score)
          INTO v_avg_score
          FROM RATINGS
         WHERE RatedUserID = NEW.RatedUserID;

        IF v_avg_score < 3.0 THEN
            UPDATE USERS
               SET AccountStatus = 'Suspended'
             WHERE UserID = NEW.RatedUserID;
        END IF;
    END IF;
END$$




-- ─────────────────────────────────────────────────────────────
-- TRIGGER 5: (REQUIRED BY RUBRIC — Component 5)
--   After a PAYMENT is inserted with PaymentStatus = 'Paid',
--   automatically update the corresponding RIDE status to
--   'Completed' and set EndTime = NOW() if not already set.
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_PaymentCompleteRide$$
CREATE TRIGGER trg_PaymentCompleteRide
AFTER INSERT ON PAYMENTS
FOR EACH ROW
BEGIN
    IF NEW.PaymentStatus = 'Paid' THEN
        UPDATE RIDES
           SET RideStatus = 'Completed',
               EndTime    = COALESCE(EndTime, NOW())
         WHERE RideID     = NEW.RideID
           AND RideStatus != 'Completed';   -- idempotent guard
    END IF;
END$$


-- ─────────────────────────────────────────────────────────────
-- TRIGGER 6: Increment promo UsageCount via trigger
--   (REQUIRED BY RUBRIC — Component 5)
--   Fires AFTER INSERT on USER_PROMOCODES (junction table),
--   which is written by ApplyPromoCode procedure.
-- ─────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_IncrPromoUsage$$
CREATE TRIGGER trg_IncrPromoUsage
AFTER INSERT ON USER_PROMOCODES
FOR EACH ROW
BEGIN
    UPDATE PROMOCODES
       SET UsageCount = UsageCount + 1
     WHERE PromoCodeID = NEW.PromoCodeID;
END$$


DELIMITER ;

-- ─────────────────────────────────────────────────────────────
-- MySQL EVENT SCHEDULER (REQUIRED BY RUBRIC — Component 5)
--   Expires promo codes every night at midnight by setting
--   their Status to 'Expired' if ValidTo < CURDATE().
-- ─────────────────────────────────────────────────────────────
SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS evt_ExpirePromoCodes;
CREATE EVENT evt_ExpirePromoCodes
    ON SCHEDULE EVERY 1 DAY
    STARTS TIMESTAMP(CURDATE(), '00:00:00')
    DO
        UPDATE PROMOCODES
           SET Status = 'Expired'
         WHERE ValidTo < CURDATE()
           AND Status = 'Active';

-- ─────────────────────────────────────────────────────────────
-- TRIGGER 7: Notify admin when driver is auto-flagged
--   Creates notification for admin review when driver
--   average rating drops below 3.5
-- ─────────────────────────────────────────────────────────────
DELIMITER $$                          
DROP TRIGGER IF EXISTS trg_NotifyAdminLowRatedDriver;
CREATE TRIGGER trg_NotifyAdminLowRatedDriver
AFTER INSERT ON RATINGS
FOR EACH ROW
BEGIN
    DECLARE v_role        VARCHAR(20);
    DECLARE v_avg_score   DECIMAL(5,2);
    DECLARE v_driver_id   INT;
    DECLARE v_was_suspended BOOLEAN DEFAULT FALSE;

    -- Check if rated user is a Driver
    SELECT Role INTO v_role FROM USERS WHERE UserID = NEW.RatedUserID;

    IF v_role = 'Driver' THEN
        -- Calculate new average rating for this driver
        SELECT AVG(Score), d.DriverID
          INTO v_avg_score, v_driver_id
          FROM RATINGS r
          JOIN DRIVERS d ON d.UserID = r.RatedUserID
         WHERE r.RatedUserID = NEW.RatedUserID;

        -- Check if this rating caused suspension (avg < 3.5)
        IF v_avg_score < 3.5 THEN
            -- Check if driver was already suspended
            SELECT AccountStatus = 'Suspended' INTO v_was_suspended
            FROM USERS 
            WHERE UserID = NEW.RatedUserID;
            
            -- Only notify if this is a new suspension
            IF NOT v_was_suspended THEN
                -- Create admin notification
                INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, RelatedID)
                SELECT u.UserID, 
                       'Driver Auto-Flagged',
                       CONCAT('Driver #', v_driver_id, ' has been auto-suspended due to low average rating (', ROUND(v_avg_score, 2), ').'),
                       'System',
                       v_driver_id
                FROM USERS u WHERE u.Role = 'Admin';
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;

SELECT 'Phase 4 — Triggers created: 7 triggers + 1 Event Scheduler.' AS Status;

