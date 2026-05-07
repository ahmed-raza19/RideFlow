// controllers/riderController.js
// All Rider-role operations

const db = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

// ─── Profile ──────────────────────────────────────────────────

// GET /api/rider/profile
const getProfile = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.UserID, u.FirstName, u.LastName, u.Email,
            u.AccountStatus, u.RegistrationDate,
            GROUP_CONCAT(p.PhoneNumber SEPARATOR ', ') AS Phones
     FROM USERS u LEFT JOIN USER_PHONES p ON u.UserID = p.UserID
     WHERE u.UserID = ? GROUP BY u.UserID`,
    [req.user.userID]
  );
  return sendSuccess(res, rows[0]);
});

// PATCH /api/rider/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, email } = req.body;
  if (!firstName && !lastName && !email) {
    return sendError(res, 'Provide at least one field to update.');
  }
  const fields = [];
  const values = [];
  if (firstName) { fields.push('FirstName = ?'); values.push(firstName); }
  if (lastName)  { fields.push('LastName = ?');  values.push(lastName); }
  if (email)     { fields.push('Email = ?');     values.push(email); }
  values.push(req.user.userID);
  await db.query(`UPDATE USERS SET ${fields.join(', ')} WHERE UserID = ?`, values);
  return sendSuccess(res, null, 'Profile updated');
});

// POST /api/rider/phones
const addPhone = asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return sendError(res, 'phoneNumber is required.');
  await db.query('INSERT INTO USER_PHONES (UserID, PhoneNumber) VALUES (?, ?)',
    [req.user.userID, phoneNumber]);
  return sendSuccess(res, null, 'Phone number added', 201);
});

// DELETE /api/rider/phones/:phone
const removePhone = asyncHandler(async (req, res) => {
  await db.query('DELETE FROM USER_PHONES WHERE UserID = ? AND PhoneNumber = ?',
    [req.user.userID, req.params.phone]);
  return sendSuccess(res, null, 'Phone number removed');
});

// ─── Browsing ─────────────────────────────────────────────────

// GET /api/rider/locations
const getLocations = asyncHandler(async (req, res) => {
  const { city } = req.query;
  let sql = 'SELECT * FROM LOCATIONS WHERE 1=1';
  const params = [];
  if (city) { sql += ' AND City = ?'; params.push(city); }
  sql += ' ORDER BY City, LocationName';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// GET /api/rider/drivers/available?city=
const getAvailableDrivers = asyncHandler(async (req, res) => {
  const { city } = req.query;
  let sql = `
    SELECT d.DriverID, d.AvailabilityStatus, d.VerificationStatus,
           l.City, l.LocationName,
           ROUND(AVG(r.Score),2) AS AvgRating
    FROM DRIVERS d
    LEFT JOIN LOCATIONS l ON d.CurrentLocationID = l.LocationID
    LEFT JOIN RATINGS r ON r.RatedUserID = (SELECT UserID FROM DRIVERS WHERE DriverID = d.DriverID)
    WHERE d.AvailabilityStatus = 'Online' AND d.VerificationStatus = 'Verified'`;
  const params = [];
  if (city) { sql += ' AND l.City = ?'; params.push(city); }
  sql += ' GROUP BY d.DriverID, d.AvailabilityStatus, d.VerificationStatus, l.City, l.LocationName';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// GET /api/rider/vehicles
const getVehicles = asyncHandler(async (req, res) => {
  const { type } = req.query;
  let sql = `SELECT VehicleID, Make, Model, Year, Color, VehicleType, LicensePlate
             FROM VEHICLES WHERE VerificationStatus = 'Verified'`;
  const params = [];
  if (type) { sql += ' AND VehicleType = ?'; params.push(type); }
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// ─── Rides ────────────────────────────────────────────────────

// POST /api/rider/rides
const requestRide = asyncHandler(async (req, res) => {
  const { pickupLocationID, dropoffLocationID, scheduledTime } = req.body;
  if (!pickupLocationID || !dropoffLocationID) {
    return sendError(res, 'pickupLocationID and dropoffLocationID are required.');
  }
  const [result] = await db.query(
    `INSERT INTO RIDES (RiderID, PickupLocationID, DropoffLocationID, RideStatus, Fare, ScheduledTime)
     VALUES (?, ?, ?, 'Requested', 0.00, ?)`,
    [req.user.userID, pickupLocationID, dropoffLocationID, scheduledTime || null]
  );
  return sendSuccess(res, { rideID: result.insertId }, 'Ride requested', 201);
});

// GET /api/rider/rides
const getRideHistory = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let sql = `
    SELECT r.RideID, pl.City AS PickupCity, pl.Street AS PickupStreet,
           dl.City AS DropoffCity, dl.Street AS DropoffStreet,
           r.RideStatus, r.Fare, r.Distance, r.StartTime, r.EndTime,
           r.SurgeMultiplier, r.ScheduledTime,
           CONCAT(u.FirstName,' ',u.LastName) AS DriverName
    FROM RIDES r
    JOIN LOCATIONS pl ON r.PickupLocationID  = pl.LocationID
    JOIN LOCATIONS dl ON r.DropoffLocationID = dl.LocationID
    LEFT JOIN DRIVERS d ON r.DriverID = d.DriverID
    LEFT JOIN USERS u ON d.UserID = u.UserID
    WHERE r.RiderID = ?`;
  const params = [req.user.userID];
  if (status) { sql += ' AND r.RideStatus = ?'; params.push(status); }
  sql += ' ORDER BY r.RideID DESC';
  const [rows] = await db.query(sql, params);
  return sendSuccess(res, rows);
});

// GET /api/rider/rides/:id
const getRideDetail = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.*, pl.City AS PickupCity, dl.City AS DropoffCity,
            pl.Street AS PickupStreet, dl.Street AS DropoffStreet
     FROM RIDES r
     JOIN LOCATIONS pl ON r.PickupLocationID  = pl.LocationID
     JOIN LOCATIONS dl ON r.DropoffLocationID = dl.LocationID
     WHERE r.RideID = ? AND r.RiderID = ?`,
    [req.params.id, req.user.userID]
  );
  if (!rows.length) return sendError(res, 'Ride not found.', 404);
  return sendSuccess(res, rows[0]);
});

// PATCH /api/rider/rides/:id/cancel
const cancelRide = asyncHandler(async (req, res) => {
  const [result] = await db.query(
    `UPDATE RIDES SET RideStatus = 'Cancelled'
     WHERE RideID = ? AND RiderID = ? AND RideStatus = 'Requested'`,
    [req.params.id, req.user.userID]
  );
  if (!result.affectedRows) {
    return sendError(res, 'Cannot cancel — ride not found or already accepted/completed.');
  }
  return sendSuccess(res, null, 'Ride cancelled');
});

// ─── Payments ─────────────────────────────────────────────────

// POST /api/rider/payments
const makePayment = asyncHandler(async (req, res) => {
  const { rideID, amount, paymentMethod } = req.body;
  if (!rideID || !amount || !paymentMethod) {
    return sendError(res, 'rideID, amount, paymentMethod are required.');
  }
  // Ensure ride belongs to this rider
  const [[ride]] = await db.query(
    'SELECT RideID FROM RIDES WHERE RideID = ? AND RiderID = ?',
    [rideID, req.user.userID]
  );
  if (!ride) return sendError(res, 'Ride not found or not yours.', 404);

  const [result] = await db.query(
    `INSERT INTO PAYMENTS (RideID, RiderID, Amount, PaymentMethod, PaymentStatus, DiscountApplied)
     VALUES (?, ?, ?, ?, 'Paid', 0.00)`,
    [rideID, req.user.userID, amount, paymentMethod]
  );
  // Triggers fire: trg_PaymentCompleteRide + trg_CreditDriverWallet
  return sendSuccess(res, { paymentID: result.insertId }, 'Payment processed', 201);
});

// GET /api/rider/payments
const getPaymentHistory = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT p.PaymentID, p.RideID, p.Amount, p.DiscountApplied,
            p.PaymentMethod, p.PaymentStatus, p.TransactionDate,
            pc.Code AS PromoCode
     FROM PAYMENTS p
     LEFT JOIN PROMOCODES pc ON p.PromoCodeID = pc.PromoCodeID
     WHERE p.RiderID = ? ORDER BY p.TransactionDate DESC`,
    [req.user.userID]
  );
  return sendSuccess(res, rows);
});

// ─── Promo Codes ──────────────────────────────────────────────

// GET /api/rider/promocodes
const getActivePromoCodes = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT Code, DiscountPercentage, MaxDiscount, ValidTo,
            UsageLimit - UsageCount AS Remaining
     FROM PROMOCODES
     WHERE Status = 'Active' AND NOW() BETWEEN ValidFrom AND ValidTo
       AND UsageCount < UsageLimit`
  );
  return sendSuccess(res, rows);
});

// POST /api/rider/rides/:id/promo
const applyPromo = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) return sendError(res, 'code is required.');
  await db.query('CALL ApplyPromoCode(?, ?)', [req.params.id, code]);
  const [[payment]] = await db.query(
    'SELECT Amount, DiscountApplied FROM PAYMENTS WHERE RideID = ?', [req.params.id]);
  return sendSuccess(res, payment, `Promo ${code} applied`);
});

// GET /api/rider/my-promocodes
const getMyPromoCodes = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT pc.Code, pc.DiscountPercentage, pc.MaxDiscount,
            pc.ValidTo, pc.Status, up.RedeemedAt
     FROM USER_PROMOCODES up
     JOIN PROMOCODES pc ON up.PromoCodeID = pc.PromoCodeID
     WHERE up.UserID = ?`,
    [req.user.userID]
  );
  return sendSuccess(res, rows);
});

// ─── Ratings ──────────────────────────────────────────────────

// POST /api/rider/ratings
const rateDriver = asyncHandler(async (req, res) => {
  const { rideID, driverUserID, score, comment } = req.body;
  if (!rideID || !driverUserID || !score) {
    return sendError(res, 'rideID, driverUserID, score are required.');
  }
  if (score < 1 || score > 5) return sendError(res, 'Score must be between 1 and 5.');

  // Verify ride completed & belongs to this rider
  const [[ride]] = await db.query(
    `SELECT RideID FROM RIDES WHERE RideID = ? AND RiderID = ? AND RideStatus = 'Completed'`,
    [rideID, req.user.userID]
  );
  if (!ride) return sendError(res, 'Ride not found or not completed.', 404);

  await db.query(
    `INSERT INTO RATINGS (RideID, RatedBy, RatedUserID, Score, Comment)
     VALUES (?, ?, ?, ?, ?)`,
    [rideID, req.user.userID, driverUserID, score, comment || null]
  );
  // Trigger trg_SuspendLowRatedDriver may fire here automatically
  return sendSuccess(res, null, 'Rating submitted', 201);
});

// ─── Complaints ───────────────────────────────────────────────

// POST /api/rider/complaints
const fileComplaint = asyncHandler(async (req, res) => {
  const { rideID, description } = req.body;
  if (!rideID || !description) return sendError(res, 'rideID and description are required.');
  const [result] = await db.query(
    `INSERT INTO COMPLAINTS (RideID, UserID, Description) VALUES (?, ?, ?)`,
    [rideID, req.user.userID, description]
  );
  return sendSuccess(res, { complaintID: result.insertId }, 'Complaint filed', 201);
});

// GET /api/rider/complaints
const getMyComplaints = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT ComplaintID, RideID, Description, ComplaintStatus, CreatedAt
     FROM COMPLAINTS WHERE UserID = ? ORDER BY CreatedAt DESC`,
    [req.user.userID]
  );
  return sendSuccess(res, rows);
});

module.exports = {
  getProfile, updateProfile, addPhone, removePhone,
  getLocations, getAvailableDrivers, getVehicles,
  requestRide, getRideHistory, getRideDetail, cancelRide,
  makePayment, getPaymentHistory,
  getActivePromoCodes, applyPromo, getMyPromoCodes,
  rateDriver,
  fileComplaint, getMyComplaints,
};
