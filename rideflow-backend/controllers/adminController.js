// controllers/adminController.js
// All admin-only operations

const db = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

// ─── Users ────────────────────────────────────────────────────

// GET /api/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status } = req.query;
  let sql = `
    SELECT u.UserID, CONCAT(u.FirstName,' ',u.LastName) AS FullName,
           u.Email, u.Role, u.AccountStatus, u.RegistrationDate,
           GROUP_CONCAT(p.PhoneNumber SEPARATOR ', ') AS Phones
    FROM USERS u
    LEFT JOIN USER_PHONES p ON u.UserID = p.UserID
    WHERE 1=1`;
  const params = [];
  if (role)   { sql += ' AND u.Role = ?';          params.push(role); }
  if (status) { sql += ' AND u.AccountStatus = ?'; params.push(status); }
  sql += ' GROUP BY u.UserID ORDER BY u.Role, u.RegistrationDate DESC';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// POST /api/admin/users
const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phoneNumbers } = req.body;
  if (!firstName || !lastName || !email || !password || !role) {
    return sendError(res, 'firstName, lastName, email, password, role are required.');
  }
  if (!['Rider', 'Driver', 'Admin'].includes(role)) {
    return sendError(res, 'Role must be Rider, Driver, or Admin.');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Invalid email format.', 400);
  }

  // Validate password strength
  if (password.length < 6) {
    return sendError(res, 'Password must be at least 6 characters long.', 400);
  }

  // Check if email exists
  const [existing] = await db.query('SELECT UserID FROM USERS WHERE Email = ?', [email]);
  if (existing.length > 0) {
    return sendError(res, 'Email already exists.');
  }
  
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 12);
  
  const [result] = await db.query(
    'INSERT INTO USERS (FirstName, LastName, Email, Password, Role) VALUES (?, ?, ?, ?, ?)',
    [firstName, lastName, email, hashedPassword, role]
  );
  
  // Add phone numbers if provided
  if (phoneNumbers && phoneNumbers.length > 0) {
    const phoneValues = phoneNumbers.map(phone => [result.insertId, phone]);
    await db.query('INSERT INTO USER_PHONES (UserID, PhoneNumber) VALUES ?', [phoneValues]);
  }
  
  return sendSuccess(res, { userID: result.insertId }, 'User created', 201);
});

// PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, role } = req.body;
  if (!firstName || !lastName || !email || !role) {
    return sendError(res, 'firstName, lastName, email, role are required.');
  }
  if (!['Rider', 'Driver', 'Admin'].includes(role)) {
    return sendError(res, 'Role must be Rider, Driver, or Admin.');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return sendError(res, 'Invalid email format.', 400);
  }

  await db.query(
    'UPDATE USERS SET FirstName = ?, LastName = ?, Email = ?, Role = ? WHERE UserID = ?',
    [firstName, lastName, email, role, req.params.id]
  );

  return sendSuccess(res, null, 'User updated');
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Check if user has rides as a customer
  const [customerRides] = await db.query('SELECT COUNT(*) AS count FROM RIDES WHERE CustomerID = ?', [userId]);

  // Check if user is a driver and has rides
  const [driverRows] = await db.query('SELECT DriverID FROM DRIVERS WHERE UserID = ?', [userId]);
  let driverRidesCount = 0;
  if (driverRows.length > 0) {
    const [driverRides] = await db.query('SELECT COUNT(*) AS count FROM RIDES WHERE DriverID = ?', [driverRows[0].DriverID]);
    driverRidesCount = driverRides[0].count;
  }

  if (customerRides[0].count > 0 || driverRidesCount > 0) {
    return sendError(res, 'Cannot delete user with associated rides. Suspend instead.');
  }

  await db.query('DELETE FROM USERS WHERE UserID = ?', [userId]);
  return sendSuccess(res, null, 'User deleted');
});

// PATCH /api/admin/users/:id/status
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Suspended', 'Banned'].includes(status)) {
    return sendError(res, 'Status must be Active, Suspended, or Banned.');
  }
  await db.query('UPDATE USERS SET AccountStatus = ? WHERE UserID = ?',
    [status, req.params.id]);
  return sendSuccess(res, null, `User status updated to ${status}`);
});

// PATCH /api/admin/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['Rider', 'Driver', 'Admin'].includes(role)) {
    return sendError(res, 'Role must be Rider, Driver, or Admin.');
  }
  await db.query('UPDATE USERS SET Role = ? WHERE UserID = ?',
    [role, req.params.id]);
  return sendSuccess(res, null, `User role updated to ${role}`);
});

// ─── Drivers ──────────────────────────────────────────────────

// GET /api/admin/drivers
const getAllDrivers = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT d.DriverID, CONCAT(u.FirstName,' ',u.LastName) AS DriverName,
           u.Email, u.AccountStatus,
           d.LicenseNumber, d.CNIC, d.VerificationStatus,
           d.AvailabilityStatus, d.WalletBalance, d.CommissionRate,
           l.City AS CurrentCity
    FROM DRIVERS d
    JOIN USERS u ON d.UserID = u.UserID
    LEFT JOIN LOCATIONS l ON d.CurrentLocationID = l.LocationID
    ORDER BY d.VerificationStatus, DriverName`);
  return sendSuccess(res, rows);
});

// PATCH /api/admin/drivers/:id/verify
const verifyDriver = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Verified', 'Unverified', 'Rejected'].includes(status)) {
    return sendError(res, 'Status must be Verified, Unverified, or Rejected.');
  }
  await db.query('UPDATE DRIVERS SET VerificationStatus = ? WHERE DriverID = ?',
    [status, req.params.id]);
  return sendSuccess(res, null, `Driver verification updated to ${status}`);
});

// ─── Vehicles ─────────────────────────────────────────────────

// GET /api/admin/vehicles
const getAllVehicles = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT v.*, CONCAT(u.FirstName,' ',u.LastName) AS DriverName
    FROM VEHICLES v
    JOIN DRIVERS d ON v.DriverID = d.DriverID
    JOIN USERS u ON d.UserID = u.UserID
    ORDER BY v.VerificationStatus, v.VehicleID DESC`);
  return sendSuccess(res, rows);
});

// POST /api/admin/vehicles
const createVehicle = asyncHandler(async (req, res) => {
  const { driverId, make, model, year, color, licensePlate, vehicleType } = req.body;
  if (!driverId || !make || !model || !year || !licensePlate || !vehicleType) {
    return sendError(res, 'driverId, make, model, year, licensePlate, vehicleType are required.');
  }
  if (!['Economy', 'Business', 'Bike'].includes(vehicleType)) {
    return sendError(res, 'Vehicle type must be Economy, Business, or Bike.');
  }
  
  // Check if license plate exists
  const [existing] = await db.query('SELECT VehicleID FROM VEHICLES WHERE LicensePlate = ?', [licensePlate]);
  if (existing.length > 0) {
    return sendError(res, 'License plate already exists.');
  }
  
  const [result] = await db.query(
    `INSERT INTO VEHICLES (DriverID, Make, Model, Year, Color, LicensePlate, VehicleType)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [driverId, make, model, year, color || null, licensePlate, vehicleType]
  );
  
  return sendSuccess(res, { vehicleID: result.insertId }, 'Vehicle created', 201);
});

// PUT /api/admin/vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const { make, model, year, color, licensePlate, vehicleType } = req.body;
  if (!make || !model || !year || !licensePlate || !vehicleType) {
    return sendError(res, 'make, model, year, licensePlate, vehicleType are required.');
  }
  if (!['Economy', 'Business', 'Bike'].includes(vehicleType)) {
    return sendError(res, 'Vehicle type must be Economy, Business, or Bike.');
  }
  
  await db.query(
    `UPDATE VEHICLES SET Make = ?, Model = ?, Year = ?, Color = ?, LicensePlate = ?, VehicleType = ?
     WHERE VehicleID = ?`,
    [make, model, year, color || null, licensePlate, vehicleType, req.params.id]
  );
  
  return sendSuccess(res, null, 'Vehicle updated');
});

// DELETE /api/admin/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  // Check if vehicle has associated rides
  const [rides] = await db.query('SELECT COUNT(*) AS count FROM RIDES WHERE VehicleID = ?', [req.params.id]);
  if (rides[0].count > 0) {
    return sendError(res, 'Cannot delete vehicle with associated rides. Reject instead.');
  }
  
  await db.query('DELETE FROM VEHICLES WHERE VehicleID = ?', [req.params.id]);
  return sendSuccess(res, null, 'Vehicle deleted');
});

// PATCH /api/admin/vehicles/:id/verify
const verifyVehicle = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Verified', 'Pending', 'Rejected'].includes(status)) {
    return sendError(res, 'Status must be Verified, Pending, or Rejected.');
  }
  await db.query('UPDATE VEHICLES SET VerificationStatus = ? WHERE VehicleID = ?',
    [status, req.params.id]);
  return sendSuccess(res, null, `Vehicle status updated to ${status}`);
});

// ─── Promo Codes ──────────────────────────────────────────────

// GET /api/admin/promocodes
const getAllPromoCodes = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT *, ROUND(UsageCount / UsageLimit * 100, 1) AS UsagePct
    FROM PROMOCODES ORDER BY Status, ValidTo DESC`);
  return sendSuccess(res, rows);
});

// POST /api/admin/promocodes
const createPromoCode = asyncHandler(async (req, res) => {
  const { code, discountPercentage, maxDiscount, validFrom, validTo, usageLimit } = req.body;
  if (!code || !discountPercentage || !validFrom || !validTo) {
    return sendError(res, 'code, discountPercentage, validFrom, validTo are required.');
  }
  const [result] = await db.query(
    `INSERT INTO PROMOCODES (Code, DiscountPercentage, MaxDiscount, ValidFrom, ValidTo, UsageLimit)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [code, discountPercentage, maxDiscount || null, validFrom, validTo, usageLimit || 100]
  );
  return sendSuccess(res, { promoCodeID: result.insertId }, 'Promo code created', 201);
});

// PATCH /api/admin/promocodes/:id/status
const updatePromoStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Active', 'Expired', 'Disabled'].includes(status)) {
    return sendError(res, 'Status must be Active, Expired, or Disabled.');
  }
  await db.query('UPDATE PROMOCODES SET Status = ? WHERE PromoCodeID = ?',
    [status, req.params.id]);
  return sendSuccess(res, null, `Promo code status updated to ${status}`);
});

// ─── Complaints ───────────────────────────────────────────────

// GET /api/admin/complaints
const getAllComplaints = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT c.ComplaintID, c.RideID,
           CONCAT(u.FirstName,' ',u.LastName) AS FiledBy, u.Role,
           c.Description, c.ComplaintStatus, c.CreatedAt
    FROM COMPLAINTS c JOIN USERS u ON c.UserID = u.UserID WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND c.ComplaintStatus = ?'; params.push(status); }
  sql += ' ORDER BY c.CreatedAt DESC';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// PATCH /api/admin/complaints/:id
const updateComplaint = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Open', 'Resolved', 'Dismissed'].includes(status)) {
    return sendError(res, 'Status must be Open, Resolved, or Dismissed.');
  }
  await db.query('UPDATE COMPLAINTS SET ComplaintStatus = ? WHERE ComplaintID = ?',
    [status, req.params.id]);
  return sendSuccess(res, null, `Complaint updated to ${status}`);
});

// ─── Ride Management ─────────────────────────────────────────────

// GET /api/admin/rides
const getAllRides = asyncHandler(async (req, res) => {
  const { status, from, to } = req.query;
  let sql = `
    SELECT r.*, 
           CONCAT(ru.FirstName,' ',ru.LastName) AS RiderName,
           CONCAT(du.FirstName,' ',du.LastName) AS DriverName,
           pu.City AS PickupCity, du_loc.City AS DropoffCity,
           v.Make, v.Model, v.LicensePlate
    FROM RIDES r
    JOIN USERS ru ON r.CustomerID = ru.UserID
    LEFT JOIN DRIVERS d ON r.DriverID = d.DriverID
    LEFT JOIN USERS du ON d.UserID = du.UserID
    LEFT JOIN LOCATIONS pu ON r.PickupLocationID = pu.LocationID
    LEFT JOIN LOCATIONS du_loc ON r.DropoffLocationID = du_loc.LocationID
    LEFT JOIN VEHICLES v ON r.VehicleID = v.VehicleID
    WHERE 1=1`;
  const params = [];
  if (status) { sql += ' AND r.RideStatus = ?'; params.push(status); }
  if (from && to) { sql += ' AND r.StartTime BETWEEN ? AND ?'; params.push(from, to); }
  sql += ' ORDER BY r.StartTime DESC';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// PATCH /api/admin/rides/:id/status
const updateRideStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Requested','Accepted','InProgress','Completed','Cancelled'].includes(status)) {
    return sendError(res, 'Invalid ride status.');
  }
  await db.query('UPDATE RIDES SET RideStatus = ? WHERE RideID = ?',
    [status, req.params.id]);
  return sendSuccess(res, null, `Ride status updated to ${status}`);
});

// DELETE /api/admin/rides/:id
const cancelRide = asyncHandler(async (req, res) => {
  const [ride] = await db.query('SELECT RideStatus FROM RIDES WHERE RideID = ?', [req.params.id]);
  if (!ride.length) {
    return sendError(res, 'Ride not found.', 404);
  }
  if (ride[0].RideStatus === 'Completed') {
    return sendError(res, 'Cannot cancel completed ride.');
  }
  
  await db.query('UPDATE RIDES SET RideStatus = "Cancelled" WHERE RideID = ?', [req.params.id]);
  return sendSuccess(res, null, 'Ride cancelled');
});

// ─── Ratings & Reviews Moderation ───────────────────────────────────

// GET /api/admin/ratings
const getAllRatings = asyncHandler(async (req, res) => {
  const { minScore, maxScore, flagged } = req.query;
  let sql = `
    SELECT r.RideID, r.RatedBy, r.RatedUserID, r.Score, r.Comment, r.Timestamp,
           CONCAT(rater.FirstName,' ',rater.LastName) AS RaterName,
           CONCAT(rated.FirstName,' ',rated.LastName) AS RatedUserName,
           rater.Role AS RaterRole, rated.Role AS RatedUserRole
    FROM RATINGS r
    JOIN USERS rater ON r.RatedBy = rater.UserID
    JOIN USERS rated ON r.RatedUserID = rated.UserID
    WHERE 1=1`;
  const params = [];
  if (minScore) { sql += ' AND r.Score >= ?'; params.push(minScore); }
  if (maxScore) { sql += ' AND r.Score <= ?'; params.push(maxScore); }
  if (flagged === 'true') { sql += ' AND r.Score <= 2'; }
  sql += ' ORDER BY r.Timestamp DESC';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// DELETE /api/admin/ratings/:rideId
const deleteRating = asyncHandler(async (req, res) => {
  await db.query('DELETE FROM RATINGS WHERE RideID = ? AND RatedBy = ?', 
    [req.params.rideId, req.query.ratedBy]);
  return sendSuccess(res, null, 'Rating deleted');
});

// GET /api/admin/drivers/:id/ratings
const getDriverRatings = asyncHandler(async (req, res) => {
  const driverID = req.params.id;
  
  const [driver] = await db.query(
    'SELECT d.DriverID, CONCAT(u.FirstName, " ", u.LastName) AS DriverName FROM DRIVERS d JOIN USERS u ON d.UserID = u.UserID WHERE d.DriverID = ?',
    [driverID]
  );
  
  if (!driver.length) {
    return sendError(res, 'Driver not found.', 404);
  }

  // Get rating statistics
  const [stats] = await db.query(`
    SELECT 
      COUNT(*) as TotalRatings,
      ROUND(AVG(r.Score), 2) as AverageRating,
      SUM(CASE WHEN r.Score = 5 THEN 1 ELSE 0 END) as Stars5,
      SUM(CASE WHEN r.Score = 4 THEN 1 ELSE 0 END) as Stars4,
      SUM(CASE WHEN r.Score = 3 THEN 1 ELSE 0 END) as Stars3,
      SUM(CASE WHEN r.Score = 2 THEN 1 ELSE 0 END) as Stars2,
      SUM(CASE WHEN r.Score = 1 THEN 1 ELSE 0 END) as Stars1
    FROM RATINGS r
    WHERE r.RatedUserID = (SELECT UserID FROM DRIVERS WHERE DriverID = ?)
  `, [driverID]);

  // Get recent ratings
  const [recentRatings] = await db.query(`
    SELECT r.Score, r.Comment, r.Timestamp,
           CONCAT(rater.FirstName, ' ', rater.LastName) AS RatedBy
    FROM RATINGS r
    JOIN USERS rater ON r.RatedBy = rater.UserID
    WHERE r.RatedUserID = (SELECT UserID FROM DRIVERS WHERE DriverID = ?)
    ORDER BY r.Timestamp DESC
    LIMIT 10
  `, [driverID]);

  const ratingData = {
    driverID: driverID,
    driverName: driver[0].DriverName,
    totalRatings: stats[0].TotalRatings || 0,
    averageRating: stats[0].AverageRating || 0,
    ratingDistribution: {
      "5stars": stats[0].Stars5 || 0,
      "4stars": stats[0].Stars4 || 0,
      "3stars": stats[0].Stars3 || 0,
      "2stars": stats[0].Stars2 || 0,
      "1stars": stats[0].Stars1 || 0
    },
    recentRatings: recentRatings
  };

  return sendSuccess(res, ratingData);
});

// GET /api/admin/riders/:id/ratings
const getRiderRatings = asyncHandler(async (req, res) => {
  const riderID = req.params.id;
  
  const [rider] = await db.query(
    'SELECT CONCAT(FirstName, " ", LastName) AS RiderName FROM USERS WHERE UserID = ?',
    [riderID]
  );
  
  if (!rider.length) {
    return sendError(res, 'Rider not found.', 404);
  }

  // Get rating statistics
  const [stats] = await db.query(`
    SELECT 
      COUNT(*) as TotalRatings,
      ROUND(AVG(r.Score), 2) as AverageRating,
      SUM(CASE WHEN r.Score = 5 THEN 1 ELSE 0 END) as Stars5,
      SUM(CASE WHEN r.Score = 4 THEN 1 ELSE 0 END) as Stars4,
      SUM(CASE WHEN r.Score = 3 THEN 1 ELSE 0 END) as Stars3,
      SUM(CASE WHEN r.Score = 2 THEN 1 ELSE 0 END) as Stars2,
      SUM(CASE WHEN r.Score = 1 THEN 1 ELSE 0 END) as Stars1
    FROM RATINGS r
    WHERE r.RatedUserID = ?
  `, [riderID]);

  // Get recent ratings
  const [recentRatings] = await db.query(`
    SELECT r.Score, r.Comment, r.Timestamp,
           CONCAT(rater.FirstName, ' ', rater.LastName) AS RatedBy
    FROM RATINGS r
    JOIN USERS rater ON r.RatedBy = rater.UserID
    WHERE r.RatedUserID = ?
    ORDER BY r.Timestamp DESC
    LIMIT 10
  `, [riderID]);

  const ratingData = {
    riderID: riderID,
    riderName: rider[0].RiderName,
    totalRatings: stats[0].TotalRatings || 0,
    averageRating: stats[0].AverageRating || 0,
    ratingDistribution: {
      "5stars": stats[0].Stars5 || 0,
      "4stars": stats[0].Stars4 || 0,
      "3stars": stats[0].Stars3 || 0,
      "2stars": stats[0].Stars2 || 0,
      "1stars": stats[0].Stars1 || 0
    },
    recentRatings: recentRatings
  };

  return sendSuccess(res, ratingData);
});

// GET /api/admin/notifications
const getAdminNotifications = asyncHandler(async (req, res) => {
  const [lowRatedDrivers] = await db.query(`
    SELECT d.DriverID, CONCAT(u.FirstName,' ',u.LastName) AS DriverName,
           COUNT(*) AS TotalRatings, ROUND(AVG(r.Score),2) AS AvgRating
    FROM DRIVERS d JOIN USERS u ON d.UserID=u.UserID
    JOIN RATINGS r ON r.RatedUserID=u.UserID
    GROUP BY d.DriverID, u.FirstName, u.LastName
    HAVING AVG(r.Score) < 3.0 AND COUNT(*) >= 3
    ORDER BY AvgRating ASC
  `);
  
  const [unverifiedDrivers] = await db.query(`
    SELECT COUNT(*) AS count FROM DRIVERS WHERE VerificationStatus = 'Unverified'
  `);
  
  const [pendingVehicles] = await db.query(`
    SELECT COUNT(*) AS count FROM VEHICLES WHERE VerificationStatus = 'Pending'
  `);
  
  const [openComplaints] = await db.query(`
    SELECT COUNT(*) AS count FROM COMPLAINTS WHERE ComplaintStatus = 'Open'
  `);
  
  return sendSuccess(res, {
    lowRatedDrivers,
    unverifiedDrivers: unverifiedDrivers[0].count,
    pendingVehicles: pendingVehicles[0].count,
    openComplaints: openComplaints[0].count
  });
});

// ─── Surge Pricing ────────────────────────────────────────────

// POST /api/admin/rides/:id/surge
const applySurge = asyncHandler(async (req, res) => {
  const { multiplier } = req.body;
  if (!multiplier) return sendError(res, 'multiplier is required.');
  await db.query('CALL ApplySurgePricing(?, ?)', [req.params.id, multiplier]);
  const [ride] = await db.query('SELECT Fare, SurgeMultiplier FROM RIDES WHERE RideID = ?', [req.params.id]);
  return sendSuccess(res, ride[0], `Surge x${multiplier} applied`);
});

// POST /api/admin/rides/:id/fare
const recalcFare = asyncHandler(async (req, res) => {
  await db.query('CALL CalculateFare(?)', [req.params.id]);
  const [ride] = await db.query('SELECT Fare FROM RIDES WHERE RideID = ?', [req.params.id]);
  return sendSuccess(res, ride[0], 'Fare recalculated');
});

// POST /api/admin/drivers/:id/payout
const approvePayout = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query('SELECT WalletBalance FROM DRIVERS WHERE DriverID = ?', [req.params.id]);
  if (!driver) return sendError(res, 'Driver not found.', 404);
  await db.query('CALL RequestPayout(?)', [req.params.id]);
  return sendSuccess(res, { previousBalance: driver.WalletBalance }, 'Payout processed');
});

// ─── Reports ──────────────────────────────────────────────────

// GET /api/admin/reports/revenue-by-city?from=&to=
const revenueByCity = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  let sql = `SELECT City, SUM(TotalTransactions) AS Transactions,
             SUM(GrossRevenue) AS GrossRevenue_PKR,
             SUM(TotalDiscounts) AS Discounts_PKR,
             SUM(NetRevenue) AS NetRevenue_PKR
             FROM vw_RevenueByCity WHERE 1=1`;
  const params = [];
  if (from && to) { sql += ' AND RevenueDate BETWEEN ? AND ?'; params.push(from, to); }
  sql += ' GROUP BY City ORDER BY NetRevenue_PKR DESC';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// GET /api/admin/reports/driver-earnings
const driverEarnings = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM vw_DriverEarnings ORDER BY NetEarnings DESC');
  return sendSuccess(res, rows);
});

// GET /api/admin/reports/revenue-by-payment
const revenueByPayment = asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM vw_RevenueByPaymentMethod');
  return sendSuccess(res, rows);
});

// GET /api/admin/reports/leaderboard
const leaderboard = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT City, DriverName, AvgRating, TotalRatings, TotalRides
    FROM (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY City ORDER BY AvgRating DESC) AS rnk
      FROM vw_DriverLeaderboard
    ) ranked WHERE rnk <= 10`);
  return sendSuccess(res, rows);
});

// GET /api/admin/reports/top-drivers
const topDrivers = asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM vw_TopDrivers');
  return sendSuccess(res, rows);
});

// GET /api/admin/reports/active-rides
const activeRides = asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM vw_ActiveRides');
  return sendSuccess(res, rows);
});

// GET /api/admin/reports/low-rated-drivers
const lowRatedDrivers = asyncHandler(async (req, res) => {
  const [rows] = await db.query(`
    SELECT d.DriverID, CONCAT(u.FirstName,' ',u.LastName) AS DriverName,
           u.AccountStatus, COUNT(*) AS TotalRatings,
           ROUND(AVG(r.Score),2) AS AvgRating
    FROM DRIVERS d JOIN USERS u ON d.UserID=u.UserID
    JOIN RATINGS r ON r.RatedUserID=u.UserID
    GROUP BY d.DriverID, u.FirstName, u.LastName, u.AccountStatus
    HAVING AVG(r.Score) < 3.5 ORDER BY AvgRating ASC`);
  return sendSuccess(res, rows);
});

// ─── Revenue Analytics ─────────────────────────────────────

// GET /api/admin/revenue/overview
const getRevenueOverview = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  
  let dateFilter = '';
  const params = [];
  if (from && to) {
    dateFilter = 'AND p.TransactionDate BETWEEN ? AND ?';
    params.push(from, to);
  }
  
  // Total revenue from all completed rides (including pending payments)
  const [totalRevenue] = await db.query(`
    SELECT 
      SUM(p.Amount) AS TotalRevenue,
      COUNT(p.PaymentID) AS TotalTransactions,
      SUM(p.DiscountApplied) AS TotalDiscounts,
      SUM(p.Amount - p.DiscountApplied) AS NetRevenue,
      AVG(p.Amount) AS AverageTransaction,
      MIN(p.TransactionDate) AS FirstTransaction,
      MAX(p.TransactionDate) AS LastTransaction
    FROM PAYMENTS p 
    WHERE p.PaymentStatus IN ('Paid', 'Pending') ${dateFilter}
  `, params);
  
  // Revenue by payment method
  const [revenueByMethod] = await db.query(`
    SELECT 
      p.PaymentMethod,
      COUNT(p.PaymentID) AS TransactionCount,
      SUM(p.Amount) AS Revenue,
      ROUND(SUM(p.Amount) * 100.0 / (SELECT SUM(Amount) FROM PAYMENTS WHERE PaymentStatus IN ('Paid', 'Pending') ${dateFilter}), 2) AS Percentage
    FROM PAYMENTS p 
    WHERE p.PaymentStatus IN ('Paid', 'Pending') ${dateFilter}
    GROUP BY p.PaymentMethod
    ORDER BY Revenue DESC
  `, params);
  
  // Revenue by month (last 12 months)
  const [monthlyRevenue] = await db.query(`
    SELECT 
      DATE_FORMAT(p.TransactionDate, '%Y-%m') AS Month,
      DATE_FORMAT(p.TransactionDate, '%M %Y') AS MonthLabel,
      COUNT(p.PaymentID) AS Transactions,
      SUM(p.Amount) AS Revenue,
      SUM(p.DiscountApplied) AS Discounts
    FROM PAYMENTS p 
    WHERE p.PaymentStatus IN ('Paid', 'Pending') 
      AND p.TransactionDate >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      ${dateFilter}
    GROUP BY DATE_FORMAT(p.TransactionDate, '%Y-%m'), DATE_FORMAT(p.TransactionDate, '%M %Y')
    ORDER BY Month DESC
  `, params);
  
  // Top spending customers
  const [topCustomers] = await db.query(`
    SELECT 
      u.UserID,
      CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName,
      u.Email,
      COUNT(p.PaymentID) AS TransactionCount,
      SUM(p.Amount) AS TotalSpent,
      AVG(p.Amount) AS AverageSpent,
      MAX(p.TransactionDate) AS LastTransaction
    FROM PAYMENTS p 
    JOIN USERS u ON p.CustomerID = u.UserID
    WHERE p.PaymentStatus IN ('Paid', 'Pending') ${dateFilter}
    GROUP BY u.UserID, u.FirstName, u.LastName, u.Email
    ORDER BY TotalSpent DESC
    LIMIT 10
  `, params);
  
  // Daily revenue trend (last 30 days)
  const [dailyRevenue] = await db.query(`
    SELECT 
      DATE(p.TransactionDate) AS Date,
      DATE_FORMAT(p.TransactionDate, '%d %M') AS DateLabel,
      COUNT(p.PaymentID) AS Transactions,
      SUM(p.Amount) AS Revenue
    FROM PAYMENTS p 
    WHERE p.PaymentStatus IN ('Paid', 'Pending') 
      AND p.TransactionDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ${dateFilter}
    GROUP BY DATE(p.TransactionDate), DATE_FORMAT(p.TransactionDate, '%d %M')
    ORDER BY Date DESC
  `, params);
  
  const revenueData = {
    overview: totalRevenue[0] || {
      TotalRevenue: 0,
      TotalTransactions: 0,
      TotalDiscounts: 0,
      NetRevenue: 0,
      AverageTransaction: 0,
      FirstTransaction: null,
      LastTransaction: null
    },
    byPaymentMethod: revenueByMethod,
    monthlyTrend: monthlyRevenue,
    topCustomers,
    dailyTrend: dailyRevenue
  };
  
  return sendSuccess(res, revenueData);
});

// GET /api/admin/locations
const getAllLocations = asyncHandler(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM LOCATIONS ORDER BY City, LocationName');
  return sendSuccess(res, rows);
});

// POST /api/admin/locations
const addLocation = asyncHandler(async (req, res) => {
  const { locationName, street, city, state, zip, latitude, longitude } = req.body;
  if (!street || !city || !state || !zip || !latitude || !longitude) {
    return sendError(res, 'street, city, state, zip, latitude, longitude are required.');
  }
  const [result] = await db.query(
    `INSERT INTO LOCATIONS (LocationName, Street, City, State, Zip, Latitude, Longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [locationName || null, street, city, state, zip, latitude, longitude]
  );
  return sendSuccess(res, { locationID: result.insertId }, 'Location added', 201);
});

module.exports = {
  getAllUsers, createUser, updateUser, deleteUser, updateUserStatus, updateUserRole,
  getAllDrivers, verifyDriver,
  getAllVehicles, createVehicle, updateVehicle, deleteVehicle, verifyVehicle,
  getAllPromoCodes, createPromoCode, updatePromoStatus,
  getAllComplaints, updateComplaint,
  getAllRides, updateRideStatus, cancelRide,
  getAllRatings, deleteRating, getDriverRatings, getRiderRatings, getAdminNotifications,
  applySurge, recalcFare, approvePayout,
  revenueByCity, driverEarnings, revenueByPayment,
  leaderboard, topDrivers, activeRides, lowRatedDrivers,
  getRevenueOverview,
  getAllLocations, addLocation,
};
