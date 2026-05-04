-- =============================================================
-- RideFlow — Phase 1: Environment Setup
-- Run this file as the MySQL root user ONCE before anything else
-- =============================================================

-- 1. Enforce strict mode for data integrity
SET GLOBAL sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- 2. Create the database
DROP DATABASE IF EXISTS rideflow;
CREATE DATABASE rideflow
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE rideflow;

-- 3. Create application-level MySQL users
--    (Passwords are examples — change before production use)

-- Admin user: full control
DROP USER IF EXISTS 'admin_user'@'localhost';
CREATE USER 'admin_user'@'localhost' IDENTIFIED BY 'Admin@RideFlow2026';

-- Rider user: limited read/write
DROP USER IF EXISTS 'rider_user'@'localhost';
CREATE USER 'rider_user'@'localhost' IDENTIFIED BY 'Rider@RideFlow2026';

-- Driver user: limited read/write
DROP USER IF EXISTS 'driver_user'@'localhost';
CREATE USER 'driver_user'@'localhost' IDENTIFIED BY 'Driver@RideFlow2026';

SELECT 'Phase 1 — Setup complete. Database rideflow created.' AS Status;
