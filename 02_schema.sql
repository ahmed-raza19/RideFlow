-- =============================================================
-- RideFlow — Phase 2: Schema Creation
-- Student: 24i_0026 / 24i_0127
-- Course:  Database Systems Lab (AI & DS) — Spring 2026
-- =============================================================

USE rideflow;

-- Disable FK checks during creation to allow any order
SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
--    All platform participants: Rider, Driver, Admin
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS USERS (
    UserID           INT            AUTO_INCREMENT PRIMARY KEY,
    FirstName        VARCHAR(50)    NOT NULL,
    LastName         VARCHAR(50)    NOT NULL,
    Email            VARCHAR(100)   UNIQUE NOT NULL,
    Password         VARCHAR(255)   NOT NULL,   -- store as bcrypt hash
    Role             ENUM('Rider', 'Driver', 'Admin') NOT NULL,
    AccountStatus    ENUM('Active', 'Suspended', 'Banned') DEFAULT 'Active',
    RegistrationDate TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- 2. USER_PHONES  (multi-valued attribute of USERS)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS USER_PHONES (
    UserID      INT         NOT NULL,
    PhoneNumber VARCHAR(20) NOT NULL,
    PRIMARY KEY (UserID, PhoneNumber),
    FOREIGN KEY (UserID) REFERENCES USERS(UserID) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 3. LOCATIONS
--    Reusable geographic points used as pickup / drop-off
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS LOCATIONS (
    LocationID   INT            AUTO_INCREMENT PRIMARY KEY,
    LocationName VARCHAR(100),
    Street       VARCHAR(255)   NOT NULL,
    City         VARCHAR(100)   NOT NULL,
    State        VARCHAR(100)   NOT NULL,
    Zip          VARCHAR(20)    NOT NULL,
    Latitude     DECIMAL(10,8)  NOT NULL,
    Longitude    DECIMAL(11,8)  NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 4. DRIVERS
--    Extends USERS with driver-specific attributes
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS DRIVERS (
    DriverID           INT            AUTO_INCREMENT PRIMARY KEY,
    UserID             INT            UNIQUE NOT NULL,
    LicenseNumber      VARCHAR(50)    UNIQUE NOT NULL,
    CNIC               VARCHAR(20)    UNIQUE NOT NULL,
    ProfilePhoto       VARCHAR(255),
    VerificationStatus ENUM('Verified', 'Unverified', 'Rejected') DEFAULT 'Unverified',
    AvailabilityStatus ENUM('Online', 'Offline', 'In-Ride')       DEFAULT 'Offline',
    WalletBalance      DECIMAL(10,2)  DEFAULT 0.00,
    CommissionRate     DECIMAL(5,2)   DEFAULT 10.00
                           CHECK (CommissionRate BETWEEN 0 AND 100),
    CurrentLocationID  INT,
    FOREIGN KEY (UserID)            REFERENCES USERS(UserID)     ON DELETE CASCADE,
    FOREIGN KEY (CurrentLocationID) REFERENCES LOCATIONS(LocationID) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 5. VEHICLES
--    Vehicles registered by drivers (1 driver : N vehicles)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS VEHICLES (
    VehicleID          INT          AUTO_INCREMENT PRIMARY KEY,
    DriverID           INT          NOT NULL,
    Make               VARCHAR(50)  NOT NULL,
    Model              VARCHAR(50)  NOT NULL,
    Year               INT          NOT NULL CHECK (Year BETWEEN 1990 AND 2100),
    Color              VARCHAR(30),
    LicensePlate       VARCHAR(20)  UNIQUE NOT NULL,
    VehicleType        ENUM('Economy', 'Business', 'Bike') NOT NULL,
    VerificationStatus ENUM('Verified', 'Pending', 'Rejected') DEFAULT 'Pending',
    FOREIGN KEY (DriverID) REFERENCES DRIVERS(DriverID) ON DELETE CASCADE
);

-- ─────────────────────────────────────────────────────────────
-- 6. PROMOCODES
--    Discount codes with validity window and usage cap
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS PROMOCODES (
    PromoCodeID        INT           AUTO_INCREMENT PRIMARY KEY,
    Code               VARCHAR(20)   UNIQUE NOT NULL,
    DiscountPercentage DECIMAL(5,2)  CHECK (DiscountPercentage BETWEEN 0 AND 100),
    MaxDiscount        DECIMAL(10,2),
    ValidFrom          DATETIME      NOT NULL,
    ValidTo            DATETIME      NOT NULL,
    UsageLimit         INT           DEFAULT 100,
    UsageCount         INT           DEFAULT 0,   -- tracks redemptions
    Status             ENUM('Active', 'Expired', 'Disabled') DEFAULT 'Active'
);

-- ─────────────────────────────────────────────────────────────
-- 7. RIDES
--    Core ride lifecycle entity
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS RIDES (
    RideID            INT           AUTO_INCREMENT PRIMARY KEY,
    RiderID           INT           NOT NULL,   -- UserID of the rider
    DriverID          INT,
    VehicleID         INT,
    PickupLocationID  INT           NOT NULL,
    DropoffLocationID INT           NOT NULL,
    RideStatus        ENUM('Requested','Accepted','InProgress','Completed','Cancelled')
                          DEFAULT 'Requested',
    Fare              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    Distance          DECIMAL(10,2),           -- kilometres
    ScheduledTime     DATETIME,
    StartTime         DATETIME,
    EndTime           DATETIME,
    SurgeMultiplier   DECIMAL(3,2)  DEFAULT 1.00,
    FOREIGN KEY (RiderID)           REFERENCES USERS(UserID),
    FOREIGN KEY (DriverID)          REFERENCES DRIVERS(DriverID),
    FOREIGN KEY (VehicleID)         REFERENCES VEHICLES(VehicleID),
    FOREIGN KEY (PickupLocationID)  REFERENCES LOCATIONS(LocationID),
    FOREIGN KEY (DropoffLocationID) REFERENCES LOCATIONS(LocationID)
);

-- ─────────────────────────────────────────────────────────────
-- 8. PAYMENTS
--    One payment per completed ride (1:1 with RIDES)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS PAYMENTS (
    PaymentID       INT           AUTO_INCREMENT PRIMARY KEY,
    RideID          INT           UNIQUE NOT NULL,
    PromoCodeID     INT,
    RiderID         INT           NOT NULL,
    Amount          DECIMAL(10,2) NOT NULL,
    PaymentMethod   ENUM('Cash', 'CreditCard', 'Wallet') NOT NULL,
    PaymentStatus   ENUM('Paid', 'Pending', 'Failed', 'Refunded') DEFAULT 'Pending',
    TransactionDate TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    DiscountApplied DECIMAL(10,2) DEFAULT 0.00,
    FOREIGN KEY (RideID)       REFERENCES RIDES(RideID),
    FOREIGN KEY (RiderID)      REFERENCES USERS(UserID),
    FOREIGN KEY (PromoCodeID)  REFERENCES PROMOCODES(PromoCodeID)
);

-- ─────────────────────────────────────────────────────────────
-- 9. COMPLAINTS
--    User-filed complaints tied to a specific ride
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS COMPLAINTS (
    ComplaintID     INT  AUTO_INCREMENT PRIMARY KEY,
    RideID          INT  NOT NULL,
    UserID          INT  NOT NULL,
    Description     TEXT NOT NULL,
    ComplaintStatus ENUM('Open', 'Resolved', 'Dismissed') DEFAULT 'Open',
    CreatedAt       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (RideID)  REFERENCES RIDES(RideID),
    FOREIGN KEY (UserID)  REFERENCES USERS(UserID)
);

-- ─────────────────────────────────────────────────────────────
-- 10. RATINGS  (Weak Entity — PK is (RideID, RatedBy))
--     Mutual ratings after every completed ride
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS RATINGS (
    RideID      INT       NOT NULL,
    RatedBy     INT       NOT NULL,
    RatedUserID INT       NOT NULL,
    Score       INT       NOT NULL CHECK (Score BETWEEN 1 AND 5),
    Comment     TEXT,
    Timestamp   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (RideID, RatedBy),
    FOREIGN KEY (RideID)      REFERENCES RIDES(RideID),
    FOREIGN KEY (RatedBy)     REFERENCES USERS(UserID),
    FOREIGN KEY (RatedUserID) REFERENCES USERS(UserID)
);

-- ─────────────────────────────────────────────────────────────
-- 11. USER_PROMOCODES  (Associative — M:N USERS ↔ PROMOCODES)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS USER_PROMOCODES (
    UserID      INT NOT NULL,
    PromoCodeID INT NOT NULL,
    RedeemedAt  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (UserID, PromoCodeID),
    FOREIGN KEY (UserID)      REFERENCES USERS(UserID)      ON DELETE CASCADE,
    FOREIGN KEY (PromoCodeID) REFERENCES PROMOCODES(PromoCodeID) ON DELETE CASCADE
);

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Phase 2 — Schema created: 11 tables.' AS Status;
