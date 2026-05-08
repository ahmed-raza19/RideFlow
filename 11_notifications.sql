-- =============================================================
-- RideFlow — Notifications Table
-- System notifications for users (riders, drivers, admins)
-- =============================================================

USE rideflow;

-- Disable FK checks during creation
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing table if it exists (for clean recreation)
DROP TABLE IF EXISTS NOTIFICATIONS;

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
--    System notifications for all user types
-- ─────────────────────────────────────────────────────────────
CREATE TABLE NOTIFICATIONS (
    NotificationID    INT            AUTO_INCREMENT PRIMARY KEY,
    UserID             INT            NOT NULL,
    Title              VARCHAR(200)   NOT NULL,
    Message            TEXT           NOT NULL,
    NotificationType  ENUM('RideUpdate', 'Payment', 'Promo', 'Safety', 'System', 'Ride', 'Verification') NOT NULL,
    IsRead             BOOLEAN        DEFAULT FALSE,
    ActionURL          VARCHAR(500),  -- Deep link for action (e.g., /customer?ride=123)
    RelatedID          INT,           -- Reference to related entity (RideID, PaymentID, etc.)
    ExpiresAt          TIMESTAMP      NULL,  -- Optional expiration for time-sensitive notifications
    CreatedAt          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES USERS(UserID) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- Indexes for performance optimization
-- ─────────────────────────────────────────────────────────────

-- Index for user-specific queries
CREATE INDEX idx_notifications_user_id ON NOTIFICATIONS(UserID);

-- Index for unread notifications query
CREATE INDEX idx_notifications_user_unread ON NOTIFICATIONS(UserID, IsRead);

-- Index for sorting by creation time
CREATE INDEX idx_notifications_created_at ON NOTIFICATIONS(CreatedAt);

-- Index for notification type filtering
CREATE INDEX idx_notifications_type ON NOTIFICATIONS(NotificationType);

-- Index for related entity lookups
CREATE INDEX idx_notifications_related_id ON NOTIFICATIONS(RelatedID);

-- ─────────────────────────────────────────────────────────────
-- Triggers for automated notification creation
-- ─────────────────────────────────────────────────────────────

DELIMITER $$

-- Trigger: Notify customer when ride is accepted by driver
DROP TRIGGER IF EXISTS trg_RideAcceptedNotification$$
CREATE TRIGGER trg_RideAcceptedNotification
AFTER UPDATE ON RIDES
FOR EACH ROW
BEGIN
    IF NEW.RideStatus = 'Accepted' AND OLD.RideStatus = 'Requested' THEN
        INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, ActionURL, RelatedID)
        VALUES (
            NEW.CustomerID,
            'Ride Accepted',
            CONCAT('Your driver is on the way! Ride #', NEW.RideID, ' has been accepted.'),
            'RideUpdate',
            CONCAT('/customer?ride=', NEW.RideID),
            NEW.RideID
        );
    END IF;
END$$

-- Trigger: Notify customer when ride starts
DROP TRIGGER IF EXISTS trg_RideStartedNotification$$
CREATE TRIGGER trg_RideStartedNotification
AFTER UPDATE ON RIDES
FOR EACH ROW
BEGIN
    IF NEW.RideStatus = 'InProgress' AND OLD.RideStatus = 'Accepted' THEN
        INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, ActionURL, RelatedID)
        VALUES (
            NEW.CustomerID,
            'Ride Started',
            CONCAT('Your ride has started. Safe travels! Ride #', NEW.RideID),
            'RideUpdate',
            CONCAT('/customer?ride=', NEW.RideID),
            NEW.RideID
        );
    END IF;
END$$

-- Trigger: Notify customer when ride is completed
DROP TRIGGER IF EXISTS trg_RideCompletedNotification$$
CREATE TRIGGER trg_RideCompletedNotification
AFTER UPDATE ON RIDES
FOR EACH ROW
BEGIN
    IF NEW.RideStatus = 'Completed' AND OLD.RideStatus = 'InProgress' THEN
        INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, ActionURL, RelatedID)
        VALUES (
            NEW.CustomerID,
            'Ride Completed',
            CONCAT('Your ride is complete! Thank you for riding with us. Ride #', NEW.RideID),
            'RideUpdate',
            CONCAT('/customer?ride=', NEW.RideID),
            NEW.RideID
        );
    END IF;
END$$

-- Trigger: Notify customer when ride is cancelled
DROP TRIGGER IF EXISTS trg_RideCancelledNotification$$
CREATE TRIGGER trg_RideCancelledNotification
AFTER UPDATE ON RIDES
FOR EACH ROW
BEGIN
    IF NEW.RideStatus = 'Cancelled' AND OLD.RideStatus != 'Cancelled' THEN
        INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, RelatedID)
        VALUES (
            NEW.CustomerID,
            'Ride Cancelled',
            CONCAT('Your ride #', NEW.RideID, ' has been cancelled.'),
            'RideUpdate',
            NEW.RideID
        );
    END IF;
END$$

-- Trigger: Notify driver when they get a new ride request
DROP TRIGGER IF EXISTS trg_NewRideRequestNotification$$
CREATE TRIGGER trg_NewRideRequestNotification
AFTER INSERT ON RIDES
FOR EACH ROW
BEGIN
    -- Notify nearby online drivers (simplified for demo - in production would use location proximity)
    INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, RelatedID)
    SELECT d.UserID, 
           'New Ride Request', 
           CONCAT('New ride request available. Ride #', NEW.RideID),
           'Ride',
           NEW.RideID
    FROM DRIVERS d 
    WHERE d.AvailabilityStatus = 'Online' 
      AND d.VerificationStatus = 'Verified'
    LIMIT 10; -- Limit to 10 nearest drivers
END$$

-- Trigger: Notify user when payment is processed
DROP TRIGGER IF EXISTS trg_PaymentProcessedNotification$$
CREATE TRIGGER trg_PaymentProcessedNotification
AFTER INSERT ON PAYMENTS
FOR EACH ROW
BEGIN
    IF NEW.PaymentStatus = 'Paid' THEN
        INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, RelatedID)
        VALUES (
            NEW.CustomerID,
            'Payment Processed',
            CONCAT('Payment of PKR ', NEW.Amount, ' for ride #', NEW.RideID, ' has been processed successfully.'),
            'Payment',
            NEW.RideID
        );
    END IF;
END$$

DELIMITER ;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'NOTIFICATIONS table created with indexes and triggers.' AS Status;
