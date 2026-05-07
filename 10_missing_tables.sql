-- =============================================================
-- RideFlow — Missing Database Tables for Enhanced Driver Features
-- =============================================================
USE rideflow;
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- DRIVER_DOCUMENTS: Store driver verification documents
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DRIVER_DOCUMENTS (
    DocumentID      INT            AUTO_INCREMENT PRIMARY KEY,
    DriverID        INT            NOT NULL,
    DocumentType    ENUM('License', 'CNIC', 'VehicleRegistration', 'Insurance') NOT NULL,
    DocumentUrl     VARCHAR(500)   NOT NULL,
    Status          ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    UploadedAt      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    ReviewedAt      TIMESTAMP      NULL,
    ReviewedBy      INT            NULL, -- Admin UserID
    ReviewComments  TEXT           NULL,
    FOREIGN KEY (DriverID) REFERENCES DRIVERS(DriverID) ON DELETE CASCADE,
    FOREIGN KEY (ReviewedBy) REFERENCES USERS(UserID) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS: System notifications for users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS NOTIFICATIONS (
    NotificationID  INT            AUTO_INCREMENT PRIMARY KEY,
    UserID          INT            NOT NULL,
    Title           VARCHAR(200)   NOT NULL,
    Message         TEXT           NOT NULL,
    Type            ENUM('Ride', 'Payment', 'Verification', 'Safety', 'System') NOT NULL,
    IsRead          BOOLEAN        DEFAULT FALSE,
    CreatedAt       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    ExpiresAt       TIMESTAMP      NULL,
    RelatedID       INT            NULL, -- RideID, PaymentID, etc.
    FOREIGN KEY (UserID) REFERENCES USERS(UserID) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- SOS_ALERTS: Emergency alerts from drivers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS SOS_ALERTS (
    AlertID         INT            AUTO_INCREMENT PRIMARY KEY,
    DriverID        INT            NOT NULL,
    RideID          INT            NULL,
    LocationID      INT            NULL,
    AlertTime       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    Status          ENUM('Active', 'Resolved', 'FalseAlarm') DEFAULT 'Active',
    ResolvedAt       TIMESTAMP      NULL,
    ResolvedBy      INT            NULL, -- Admin UserID
    Notes           TEXT           NULL,
    FOREIGN KEY (DriverID) REFERENCES DRIVERS(DriverID) ON DELETE CASCADE,
    FOREIGN KEY (RideID) REFERENCES RIDES(RideID) ON DELETE SET NULL,
    FOREIGN KEY (LocationID) REFERENCES LOCATIONS(LocationID) ON DELETE SET NULL,
    FOREIGN KEY (ResolvedBy) REFERENCES USERS(UserID) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- RIDE_TIMELINE: Detailed timeline of ride events
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS RIDE_TIMELINE (
    TimelineID      INT            AUTO_INCREMENT PRIMARY KEY,
    RideID          INT            NOT NULL,
    EventType       ENUM('Requested', 'Accepted', 'DriverEnRoute', 'Arrived', 'Started', 'InProgress', 'Completed', 'Cancelled') NOT NULL,
    EventTime       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    LocationID      INT            NULL,
    DriverID        INT            NULL,
    Notes           TEXT           NULL,
    FOREIGN KEY (RideID) REFERENCES RIDES(RideID) ON DELETE CASCADE,
    FOREIGN KEY (LocationID) REFERENCES LOCATIONS(LocationID) ON DELETE SET NULL,
    FOREIGN KEY (DriverID) REFERENCES DRIVERS(DriverID) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- Indexes for performance optimization
-- ─────────────────────────────────────────────────────────────

-- Driver Documents indexes
CREATE INDEX idx_driver_documents_driver_id ON DRIVER_DOCUMENTS(DriverID);
CREATE INDEX idx_driver_documents_status ON DRIVER_DOCUMENTS(Status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON NOTIFICATIONS(UserID);
CREATE INDEX idx_notifications_is_read ON NOTIFICATIONS(IsRead);
CREATE INDEX idx_notifications_created_at ON NOTIFICATIONS(CreatedAt);

-- SOS Alerts indexes
CREATE INDEX idx_sos_alerts_driver_id ON SOS_ALERTS(DriverID);
CREATE INDEX idx_sos_alerts_status ON SOS_ALERTS(Status);
CREATE INDEX idx_sos_alerts_alert_time ON SOS_ALERTS(AlertTime);

-- Ride Timeline indexes
CREATE INDEX idx_ride_timeline_ride_id ON RIDE_TIMELINE(RideID);
CREATE INDEX idx_ride_timeline_event_time ON RIDE_TIMELINE(EventTime);

-- ─────────────────────────────────────────────────────────────
-- Triggers for new tables
-- ─────────────────────────────────────────────────────────────

DELIMITER $$

-- Trigger: Create timeline entry when ride status changes
DROP TRIGGER IF EXISTS trg_RideTimelineUpdate$$
CREATE TRIGGER trg_RideTimelineUpdate
AFTER UPDATE ON RIDES
FOR EACH ROW
BEGIN
    IF NEW.RideStatus != OLD.RideStatus THEN
        INSERT INTO RIDE_TIMELINE (RideID, EventType, DriverID, Notes)
        VALUES (NEW.RideID, NEW.RideStatus, NEW.DriverID, 
                CONCAT('Status changed from ', OLD.RideStatus, ' to ', NEW.RideStatus));
    END IF;
END$$

-- Trigger: Create notification for new ride request
DROP TRIGGER IF EXISTS trg_NewRideNotification$$
CREATE TRIGGER trg_NewRideNotification
AFTER INSERT ON RIDES
FOR EACH ROW
BEGIN
    -- Notify nearby drivers (simplified - in real implementation would use location proximity)
    INSERT INTO NOTIFICATIONS (UserID, Title, Message, Type, RelatedID)
    SELECT d.UserID, 
           'New Ride Request', 
           CONCAT('New ride request from ', (SELECT CONCAT(u.FirstName, ' ', u.LastName) 
                                            FROM USERS u WHERE u.UserID = NEW.CustomerID)),
           'Ride',
           NEW.RideID
    FROM DRIVERS d 
    WHERE d.AvailabilityStatus = 'Online' 
    LIMIT 5; -- Limit to 5 nearest drivers for demo
END$$

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Missing tables created: DRIVER_DOCUMENTS, NOTIFICATIONS, SOS_ALERTS, RIDE_TIMELINE with indexes and triggers.' AS Status;
