// controllers/driverController.js
// All Driver-role operations

const db = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

// ─── Profile & Availability ───────────────────────────────────

// GET /api/driver/profile
const getProfile = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.DriverID, CONCAT(u.FirstName,' ',u.LastName) AS FullName,
            u.Email, u.AccountStatus, d.LicenseNumber, d.CNIC,
            d.VerificationStatus, d.AvailabilityStatus,
            d.WalletBalance, d.CommissionRate,
            l.City AS CurrentCity, l.LocationName AS CurrentLocation
     FROM DRIVERS d
     JOIN USERS u ON d.UserID = u.UserID
     LEFT JOIN LOCATIONS l ON d.CurrentLocationID = l.LocationID
     WHERE d.UserID = ?`,
    [req.user.userID]
  );
  if (!rows.length) return sendError(res, 'Driver profile not found.', 404);
  return sendSuccess(res, rows[0]);
});

// PATCH /api/driver/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, password } = req.body;
  const fields = []; const values = [];
  if (firstName) { fields.push('FirstName = ?'); values.push(firstName); }
  if (lastName)  { fields.push('LastName = ?');  values.push(lastName); }
  if (password) {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 12);
    fields.push('Password = ?'); values.push(hash);
  }
  if (!fields.length) return sendError(res, 'Nothing to update.');
  values.push(req.user.userID);
  await db.query(`UPDATE USERS SET ${fields.join(', ')} WHERE UserID = ?`, values);
  return sendSuccess(res, null, 'Profile updated');
});

// PATCH /api/driver/availability
const setAvailability = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['Online', 'Offline'].includes(status)) {
    return sendError(res, 'Status must be Online or Offline.');
  }
  await db.query(
    'UPDATE DRIVERS SET AvailabilityStatus = ? WHERE UserID = ?',
    [status, req.user.userID]
  );
  return sendSuccess(res, null, `Status set to ${status}`);
});

// PATCH /api/driver/location
const updateLocation = asyncHandler(async (req, res) => {
  const { locationID } = req.body;
  if (!locationID) return sendError(res, 'locationID is required.');
  await db.query(
    'UPDATE DRIVERS SET CurrentLocationID = ? WHERE UserID = ?',
    [locationID, req.user.userID]
  );
  return sendSuccess(res, null, 'Location updated');
});

// ─── Vehicles ─────────────────────────────────────────────────

// GET /api/driver/vehicles
const getMyVehicles = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  const [rows] = await db.query(
    'SELECT * FROM VEHICLES WHERE DriverID = ?', [driver.DriverID]);
  return sendSuccess(res, rows);
});

// POST /api/driver/vehicles
const addVehicle = asyncHandler(async (req, res) => {
  const { make, model, year, color, licensePlate, vehicleType } = req.body;
  if (!make || !model || !year || !licensePlate || !vehicleType) {
    return sendError(res, 'make, model, year, licensePlate, vehicleType are required.');
  }
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  const [result] = await db.query(
    `INSERT INTO VEHICLES (DriverID, Make, Model, Year, Color, LicensePlate, VehicleType)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [driver.DriverID, make, model, year, color || null, licensePlate, vehicleType]
  );
  return sendSuccess(res, { vehicleID: result.insertId }, 'Vehicle registered — pending verification', 201);
});

// ─── Rides ────────────────────────────────────────────────────

// GET /api/driver/rides/incoming
const getIncomingRides = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.RideID, CONCAT(u.FirstName,' ',u.LastName) AS RiderName,
            pl.City AS PickupCity, pl.Street AS PickupStreet,
            dl.City AS DropoffCity, r.Fare,
            r.ScheduledTime, r.SurgeMultiplier
     FROM RIDES r
     JOIN USERS u ON r.RiderID = u.UserID
     JOIN LOCATIONS pl ON r.PickupLocationID  = pl.LocationID
     JOIN LOCATIONS dl ON r.DropoffLocationID = dl.LocationID
     WHERE r.RideStatus = 'Requested'
     ORDER BY r.RideID ASC`
  );
  return sendSuccess(res, rows);
});

// PATCH /api/driver/rides/:id/accept
const acceptRide = asyncHandler(async (req, res) => {
  const { vehicleID } = req.body;
  if (!vehicleID) return sendError(res, 'vehicleID is required.');

  const [[driver]] = await db.query(
    'SELECT DriverID, VerificationStatus FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  if (driver.VerificationStatus !== 'Verified') {
    return sendError(res, 'Your driver profile is not verified yet.', 403);
  }

  // Verify vehicle belongs to this driver and is verified
  const [[vehicle]] = await db.query(
    `SELECT VehicleID FROM VEHICLES
     WHERE VehicleID = ? AND DriverID = ? AND VerificationStatus = 'Verified'`,
    [vehicleID, driver.DriverID]
  );
  if (!vehicle) return sendError(res, 'Vehicle not found or not verified.', 404);

  const [result] = await db.query(
    `UPDATE RIDES SET RideStatus = 'Accepted', DriverID = ?, VehicleID = ?
     WHERE RideID = ? AND RideStatus = 'Requested'`,
    [driver.DriverID, vehicleID, req.params.id]
  );
  if (!result.affectedRows) return sendError(res, 'Ride no longer available.');

  await db.query(
    `UPDATE DRIVERS SET AvailabilityStatus = 'In-Ride' WHERE DriverID = ?`,
    [driver.DriverID]
  );
  return sendSuccess(res, null, 'Ride accepted');
});

// PATCH /api/driver/rides/:id/start
const startRide = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  const [result] = await db.query(
    `UPDATE RIDES SET RideStatus = 'InProgress', StartTime = NOW()
     WHERE RideID = ? AND DriverID = ? AND RideStatus = 'Accepted'`,
    [req.params.id, driver.DriverID]
  );
  if (!result.affectedRows) return sendError(res, 'Cannot start — ride not found or wrong status.');
  return sendSuccess(res, null, 'Ride started');
});

// PATCH /api/driver/rides/:id/complete
const completeRide = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  const [result] = await db.query(
    `UPDATE RIDES SET RideStatus = 'Completed', EndTime = NOW()
     WHERE RideID = ? AND DriverID = ? AND RideStatus = 'InProgress'`,
    [req.params.id, driver.DriverID]
  );
  if (!result.affectedRows) return sendError(res, 'Cannot complete — ride not found or wrong status.');
  // Trigger trg_DriverOnlineAfterRide fires here automatically
  return sendSuccess(res, null, 'Ride completed. You are now Online again.');
});

// GET /api/driver/rides
const getMyRides = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  let sql = `
    SELECT r.RideID, CONCAT(u.FirstName,' ',u.LastName) AS RiderName,
           pl.City AS PickupCity, dl.City AS DropoffCity,
           r.Fare, r.Distance, r.RideStatus, r.StartTime, r.EndTime
    FROM RIDES r
    JOIN USERS u ON r.RiderID = u.UserID
    JOIN LOCATIONS pl ON r.PickupLocationID  = pl.LocationID
    JOIN LOCATIONS dl ON r.DropoffLocationID = dl.LocationID
    WHERE r.DriverID = ?`;
  const params = [driver.DriverID];
  if (status) { sql += ' AND r.RideStatus = ?'; params.push(status); }
  sql += ' ORDER BY r.RideID DESC';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// ─── Earnings & Wallet ────────────────────────────────────────

// GET /api/driver/earnings
const getEarnings = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  const [rows] = await db.query(
    'SELECT * FROM vw_DriverEarnings WHERE DriverID = ?', [driver.DriverID]);
  return sendSuccess(res, rows[0] || {});
});

// GET /api/driver/wallet
const getWallet = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    'SELECT DriverID, WalletBalance, CommissionRate FROM DRIVERS WHERE UserID = ?',
    [req.user.userID]
  );
  return sendSuccess(res, rows[0]);
});

// POST /api/driver/payout
const requestPayout = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID, WalletBalance FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  if (driver.WalletBalance <= 0) {
    return sendError(res, 'Insufficient wallet balance for payout.');
  }
  await db.query('CALL RequestPayout(?)', [driver.DriverID]);
  return sendSuccess(res, { previousBalance: driver.WalletBalance }, 'Payout requested');
});

// GET /api/driver/payments
const getMyPayments = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  const [rows] = await db.query(
    `SELECT p.PaymentID, p.RideID, p.Amount, p.DiscountApplied,
            p.PaymentMethod, p.PaymentStatus, p.TransactionDate
     FROM PAYMENTS p JOIN RIDES r ON p.RideID = r.RideID
     WHERE r.DriverID = ? ORDER BY p.TransactionDate DESC`,
    [driver.DriverID]
  );
  return sendSuccess(res, rows);
});

// ─── Ratings ──────────────────────────────────────────────────

// POST /api/driver/ratings
const rateRider = asyncHandler(async (req, res) => {
  const { rideID, riderUserID, score, comment } = req.body;
  if (!rideID || !riderUserID || !score) {
    return sendError(res, 'rideID, riderUserID, score are required.');
  }
  if (score < 1 || score > 5) return sendError(res, 'Score must be between 1 and 5.');

  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  const [[ride]] = await db.query(
    `SELECT RideID FROM RIDES WHERE RideID = ? AND DriverID = ? AND RideStatus = 'Completed'`,
    [rideID, driver.DriverID]
  );
  if (!ride) return sendError(res, 'Ride not found or not completed.', 404);

  await db.query(
    `INSERT INTO RATINGS (RideID, RatedBy, RatedUserID, Score, Comment)
     VALUES (?, ?, ?, ?, ?)`,
    [rideID, req.user.userID, riderUserID, score, comment || null]
  );
  // Trigger trg_FlagLowRatedRider may fire here automatically
  return sendSuccess(res, null, 'Rating submitted', 201);
});

// GET /api/driver/ratings
const getMyRatings = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.RideID, CONCAT(u.FirstName,' ',u.LastName) AS RatedBy,
            r.Score, r.Comment, r.Timestamp
     FROM RATINGS r JOIN USERS u ON r.RatedBy = u.UserID
     WHERE r.RatedUserID = ?
     ORDER BY r.Timestamp DESC`,
    [req.user.userID]
  );
  return sendSuccess(res, rows);
});

module.exports = {
  getProfile, updateProfile, setAvailability, updateLocation,
  getMyVehicles, addVehicle,
  getIncomingRides, acceptRide, startRide, completeRide, getMyRides,
  getEarnings, getWallet, requestPayout, getMyPayments,
  rateRider, getMyRatings,
};
