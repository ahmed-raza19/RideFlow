-- =============================================================
-- RideFlow — Phase 3: Seed Data
-- Realistic sample data for all 11 tables (dependency order)
-- =============================================================
USE rideflow;
SET FOREIGN_KEY_CHECKS = 0;

-- ─── 1. LOCATIONS ────────────────────────────────────────────
INSERT INTO LOCATIONS (LocationName, Street, City, State, Zip, Latitude, Longitude) VALUES
('Gulshan Chowrangi',   '5-C Block 7 Gulshan-e-Iqbal', 'Karachi',   'Sindh',  '75300', 24.92090000, 67.09270000),
('DHA Phase 6',         'Khayaban-e-Iqbal',             'Karachi',   'Sindh',  '75500', 24.81160000, 67.07580000),
('Blue Area',           'Jinnah Avenue',                 'Islamabad', 'ICT',    '44000', 33.72740000, 73.09320000),
('F-7 Markaz',          'F-7 Super Market',              'Islamabad', 'ICT',    '44000', 33.72890000, 73.05390000),
('Mall Road',           '1 Mall Road',                   'Lahore',    'Punjab', '54000', 31.56940000, 74.31220000),
('Johar Town',          'Sector D Johar Town',           'Lahore',    'Punjab', '54782', 31.46440000, 74.27160000),
('Clifton Block 5',     'Sea View Road',                 'Karachi',   'Sindh',  '75600', 24.81780000, 67.02980000),
('Saddar Bazar',        'Saddar Main Road',              'Karachi',   'Sindh',  '74400', 24.85980000, 67.01080000),
('G-9 Markaz',          'Karachi Company G-9',           'Islamabad', 'ICT',    '44040', 33.68720000, 73.04810000),
('Model Town',          'Model Town Link Road',          'Lahore',    'Punjab', '54700', 31.48470000, 74.33210000),
('Nazimabad No. 3',     'Nazimabad Block 3',             'Karachi',   'Sindh',  '74600', 24.90640000, 67.04320000),
('PWD Society',         'PWD Road',                      'Islamabad', 'ICT',    '44000', 33.65830000, 73.10470000);

-- ─── 2. USERS ────────────────────────────────────────────────
INSERT INTO USERS (FirstName, LastName, Email, Password, Role, AccountStatus) VALUES
-- Admins
('Ali',     'Raza',      'ali.raza@rideflow.pk',    '$2b$12$admin1hash', 'Admin',  'Active'),
-- Riders
('Sara',    'Ahmed',     'sara.ahmed@gmail.com',    '$2b$12$rider1hash', 'Rider',  'Active'),
('Hamza',   'Khan',      'hamza.khan@gmail.com',    '$2b$12$rider2hash', 'Rider',  'Active'),
('Ayesha',  'Malik',     'ayesha.malik@gmail.com',  '$2b$12$rider3hash', 'Rider',  'Active'),
('Usman',   'Sheikh',    'usman.sheikh@gmail.com',  '$2b$12$rider4hash', 'Rider',  'Active'),
('Fatima',  'Siddiqui',  'fatima.s@gmail.com',      '$2b$12$rider5hash', 'Rider',  'Active'),
-- Drivers
('Bilal',   'Hussain',   'bilal.driver@gmail.com',  '$2b$12$drv01hash',  'Driver', 'Active'),
('Kamran',  'Iqbal',     'kamran.iqbal@gmail.com',  '$2b$12$drv02hash',  'Driver', 'Active'),
('Nadeem',  'Butt',      'nadeem.butt@gmail.com',   '$2b$12$drv03hash',  'Driver', 'Active'),
('Zubair',  'Qureshi',   'zubair.q@gmail.com',      '$2b$12$drv04hash',  'Driver', 'Active'),
('Tariq',   'Mehmood',   'tariq.m@gmail.com',       '$2b$12$drv05hash',  'Driver', 'Active');

-- ─── 3. USER_PHONES ──────────────────────────────────────────
INSERT INTO USER_PHONES (UserID, PhoneNumber) VALUES
(1,  '+92-300-1111111'),
(2,  '+92-311-2222222'),
(3,  '+92-321-3333333'),
(3,  '+92-333-3333399'),  -- Hamza has 2 numbers
(4,  '+92-345-4444444'),
(5,  '+92-312-5555555'),
(6,  '+92-301-6666666'),
(7,  '+92-333-7777777'),
(8,  '+92-300-8888888'),
(9,  '+92-321-9999999'),
(10, '+92-311-1010101'),
(11, '+92-345-1111222');

-- ─── 4. DRIVERS ──────────────────────────────────────────────
INSERT INTO DRIVERS (UserID, LicenseNumber, CNIC, VerificationStatus, AvailabilityStatus, WalletBalance, CommissionRate, CurrentLocationID) VALUES
(7,  'LHR-2019-00781', '35202-1234567-1', 'Verified', 'Online',   1250.00, 10.00, 5),
(8,  'KHI-2020-04521', '42201-2345678-2', 'Verified', 'Online',    980.50, 12.00, 1),
(9,  'ISB-2018-03312', '61101-3456789-3', 'Verified', 'Offline',   450.00, 10.00, 3),
(10, 'LHR-2021-07891', '35201-4567890-4', 'Verified', 'In-Ride',  2100.75, 15.00, 6),
(11, 'KHI-2022-09934', '42301-5678901-5', 'Unverified','Offline',    0.00, 10.00, 7);

-- ─── 5. VEHICLES ─────────────────────────────────────────────
INSERT INTO VEHICLES (DriverID, Make, Model, Year, Color, LicensePlate, VehicleType, VerificationStatus) VALUES
(1, 'Suzuki', 'Alto',    2020, 'White',  'LHR-1234', 'Economy',  'Verified'),
(2, 'Toyota', 'Corolla', 2019, 'Silver', 'KHI-5678', 'Business', 'Verified'),
(3, 'Honda',  'Civic',   2021, 'Black',  'ISB-9012', 'Business', 'Verified'),
(4, 'Yamaha', 'YBR125',  2022, 'Red',    'LHR-3456', 'Bike',     'Verified'),
(5, 'Suzuki', 'Cultus',  2018, 'Blue',   'KHI-7890', 'Economy',  'Pending'),
(1, 'Honda',  'BRV',     2023, 'Grey',   'LHR-2468', 'Business', 'Verified');

-- ─── 6. PROMOCODES ───────────────────────────────────────────
INSERT INTO PROMOCODES (Code, DiscountPercentage, MaxDiscount, ValidFrom, ValidTo, UsageLimit, UsageCount, Status) VALUES
('WELCOME10',  10.00,  50.00, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 500,  45, 'Active'),
('RIDE20',     20.00, 100.00, '2026-03-01 00:00:00', '2026-06-30 23:59:59', 200,  90, 'Active'),
('SAVE15',     15.00,  75.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 100, 100, 'Expired'),
('FLAT50',      0.00,  50.00, '2026-04-01 00:00:00', '2026-04-30 23:59:59',  50,  50, 'Disabled'),
('NEWUSER25',  25.00, 150.00, '2026-05-01 00:00:00', '2026-07-31 23:59:59', 300,   5, 'Active');

-- ─── 7. RIDES ────────────────────────────────────────────────
INSERT INTO RIDES (CustomerID, DriverID, VehicleID, PickupLocationID, DropoffLocationID, RideStatus, Fare, Distance, ScheduledTime, StartTime, EndTime, SurgeMultiplier) VALUES
(2, 1, 1, 1,  2,  'Completed',  320.00, 12.50, NULL,                  '2026-04-10 09:00:00', '2026-04-10 09:35:00', 1.00),
(3, 2, 2, 7,  8,  'Completed',  180.00,  7.20, NULL,                  '2026-04-11 14:00:00', '2026-04-11 14:22:00', 1.00),
(4, 3, 3, 3,  4,  'Completed',  250.00,  9.80, NULL,                  '2026-04-12 08:30:00', '2026-04-12 09:05:00', 1.50),
(5, 4, 4, 5,  6,  'Completed',   95.00,  5.30, NULL,                  '2026-04-13 18:00:00', '2026-04-13 18:20:00', 1.00),
(6, 1, 1, 2,  11, 'Completed',  400.00, 15.00, NULL,                  '2026-04-14 07:45:00', '2026-04-14 08:30:00', 2.00),
(2, 2, 2, 8,  1,  'Cancelled',    0.00,  NULL, NULL,                  NULL,                  NULL,                  1.00),
(3, 3, 3, 4,  9,  'InProgress', 200.00,  8.00, NULL,                  '2026-05-04 15:00:00', NULL,                  1.00),
(4, 1, 6, 6,  10, 'Accepted',     0.00,  NULL, '2026-05-05 09:00:00', NULL,                  NULL,                  1.00),
(5, 2, 2, 1,  3,  'Requested',    0.00,  NULL, NULL,                  NULL,                  NULL,                  1.00),
(6, 4, 4, 10, 5,  'Completed',  130.00,  6.80, NULL,                  '2026-04-20 10:00:00', '2026-04-20 10:25:00', 1.00);

-- ─── 8. PAYMENTS ─────────────────────────────────────────────
INSERT INTO PAYMENTS (RideID, PromoCodeID, CustomerID, Amount, PaymentMethod, PaymentStatus, DiscountApplied) VALUES
(1,  1, 2, 288.00, 'Cash',       'Paid',    32.00),
(2,  NULL, 3, 180.00, 'Wallet',  'Paid',     0.00),
(3,  2, 4, 200.00, 'CreditCard', 'Paid',    50.00),
(4,  NULL, 5,  95.00, 'Cash',    'Paid',     0.00),
(5,  NULL, 6, 400.00, 'Wallet',  'Paid',     0.00),
(10, 1, 6, 117.00, 'Cash',       'Paid',    13.00);

-- ─── 9. USER_PROMOCODES ──────────────────────────────────────
INSERT INTO USER_PROMOCODES (UserID, PromoCodeID) VALUES
(2, 1), (3, 2), (4, 2), (6, 1), (5, 5);

-- ─── 10. RATINGS ─────────────────────────────────────────────
-- (RideID, RatedBy) is the composite PK
INSERT INTO RATINGS (RideID, RatedBy, RatedUserID, Score, Comment) VALUES
-- Ride 1: Sara rates Driver Bilal; Bilal rates Sara
(1, 2,  7,  5, 'Excellent ride, very professional!'),
(1, 7,  2,  4, 'Polite passenger, on time.'),
-- Ride 2
(2, 3,  8,  4, 'Good driver, smooth ride.'),
(2, 8,  3,  5, 'Great experience.'),
-- Ride 3
(3, 4,  9,  3, 'Took a longer route.'),
(3, 9,  4,  4, 'Decent.'),
-- Ride 4
(4, 5,  10, 5, 'Super fast bike delivery!'),
(4, 10, 5,  5, 'Perfect passenger.'),
-- Ride 5
(5, 6,  7,  2, 'Driver was late and rude.'),
(5, 7,  6,  3, 'OK passenger.'),
-- Ride 10
(10, 6, 10, 4, 'Good ride overall.'),
(10, 10, 6, 5, 'Very friendly passenger.');

-- ─── 11. COMPLAINTS ──────────────────────────────────────────
INSERT INTO COMPLAINTS (RideID, UserID, Description, ComplaintStatus) VALUES
(5, 6, 'Driver arrived 15 minutes late and was unprofessional.', 'Open'),
(3, 4, 'Driver took a longer route, increasing the fare.', 'Resolved'),
(2, 3, 'App showed wrong pickup location.', 'Dismissed');

SET FOREIGN_KEY_CHECKS = 1;
SELECT 'Phase 3 — Seed data loaded: 11 tables populated.' AS Status;
