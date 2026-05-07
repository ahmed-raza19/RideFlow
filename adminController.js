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
           u.AccountStatus, COUNT(r.Score) AS TotalRatings,
           ROUND(AVG(r.Score),2) AS AvgRating
    FROM DRIVERS d JOIN USERS u ON d.UserID=u.UserID
    JOIN RATINGS r ON r.RatedUserID=u.UserID
    GROUP BY d.DriverID, u.FirstName, u.LastName, u.AccountStatus
    HAVING AVG(r.Score) < 3.5 ORDER BY AvgRating ASC`);
  return sendSuccess(res, rows);
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
  getAllUsers, updateUserStatus,
  getAllDrivers, verifyDriver,
  getAllVehicles, verifyVehicle,
  getAllPromoCodes, createPromoCode, updatePromoStatus,
  getAllComplaints, updateComplaint,
  applySurge, recalcFare, approvePayout,
  revenueByCity, driverEarnings, revenueByPayment,
  leaderboard, topDrivers, activeRides, lowRatedDrivers,
  getAllLocations, addLocation,
};
