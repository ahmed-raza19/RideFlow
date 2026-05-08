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

// PATCH /api/driver/vehicles/:id
const editVehicle = asyncHandler(async (req, res) => {
  const { make, model, year, color, licensePlate, vehicleType } = req.body;
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  // Verify vehicle belongs to this driver
  const [[vehicle]] = await db.query(
    'SELECT VehicleID FROM VEHICLES WHERE VehicleID = ? AND DriverID = ?',
    [req.params.id, driver.DriverID]
  );
  if (!vehicle) return sendError(res, 'Vehicle not found or does not belong to you.', 404);
  
  const fields = [];
  const values = [];
  if (make) { fields.push('Make = ?'); values.push(make); }
  if (model) { fields.push('Model = ?'); values.push(model); }
  if (year) { fields.push('Year = ?'); values.push(year); }
  if (color !== undefined) { fields.push('Color = ?'); values.push(color); }
  if (licensePlate) { fields.push('LicensePlate = ?'); values.push(licensePlate); }
  if (vehicleType) { fields.push('VehicleType = ?'); values.push(vehicleType); }
  
  if (!fields.length) return sendError(res, 'Nothing to update.');
  
  // Reset verification status if key fields changed
  if (licensePlate || vehicleType) {
    fields.push('VerificationStatus = ?');
    values.push('Pending');
  }
  
  values.push(req.params.id);
  await db.query(`UPDATE VEHICLES SET ${fields.join(', ')} WHERE VehicleID = ?`, values);
  return sendSuccess(res, null, 'Vehicle updated successfully');
});

// DELETE /api/driver/vehicles/:id
const removeVehicle = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  // Check if vehicle is in active ride
  const [[activeRide]] = await db.query(
    'SELECT RideID FROM RIDES WHERE VehicleID = ? AND RideStatus IN ("Accepted", "InProgress")',
    [req.params.id]
  );
  if (activeRide) {
    return sendError(res, 'Cannot remove vehicle currently in a ride.', 400);
  }
  
  const [result] = await db.query(
    'DELETE FROM VEHICLES WHERE VehicleID = ? AND DriverID = ?',
    [req.params.id, driver.DriverID]
  );
  if (!result.affectedRows) return sendError(res, 'Vehicle not found.', 404);
  return sendSuccess(res, null, 'Vehicle removed successfully');
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
     JOIN USERS u ON r.CustomerID = u.UserID
     JOIN LOCATIONS pl ON r.PickupLocationID  = pl.LocationID
     JOIN LOCATIONS dl ON r.DropoffLocationID = dl.LocationID
     WHERE r.RideStatus = 'Requested'
     ORDER BY r.RideID ASC`
  );
  return sendSuccess(res, rows);
});

// POST /api/driver/rides/request (for customers to create ride requests)
const createRideRequest = asyncHandler(async (req, res) => {
  const { customerID, pickupLocationID, dropoffLocationID, vehicleType, fare } = req.body;
  
  if (!customerID || !pickupLocationID || !dropoffLocationID) {
    return sendError(res, 'Missing required fields');
  }

  // Create ride request
  const [result] = await db.query(
    `INSERT INTO RIDES (CustomerID, PickupLocationID, DropoffLocationID, Fare, VehicleType, RideStatus)
     VALUES (?, ?, ?, ?, ?, 'Requested')`,
    [customerID, pickupLocationID, dropoffLocationID, fare || 0, vehicleType || 'Economy']
  );

  const rideId = result.insertId;

  // Get ride details for broadcasting
  const [rideDetails] = await db.query(
    `SELECT r.*, CONCAT(u.FirstName,' ',u.LastName) AS CustomerName,
            pl.City AS PickupCity, pl.Street AS PickupStreet,
            dl.City AS DropoffCity
     FROM RIDES r
     JOIN USERS u ON r.CustomerID = u.UserID
     JOIN LOCATIONS pl ON r.PickupLocationID = pl.LocationID
     JOIN LOCATIONS dl ON r.DropoffLocationID = dl.LocationID
     WHERE r.RideID = ?`,
    [rideId]
  );

  if (rideDetails.length > 0) {
    const ride = rideDetails[0];
    
    // Emit real-time event to online drivers in the pickup location
    const { emitToLocation, emitToUser } = require('./socket');
    emitToLocation(pickupLocationID, 'new_ride_request', {
      rideId: ride.RideID,
      customerName: ride.CustomerName,
      pickupCity: ride.PickupCity,
      pickupStreet: ride.PickupStreet,
      dropoffCity: ride.DropoffCity,
      fare: ride.Fare,
      vehicleType: ride.VehicleType,
      timestamp: new Date()
    });

    // Also emit to specific customer
    emitToUser(customerID, 'ride_request_created', {
      rideId: ride.RideID,
      status: 'Requested',
      message: 'Your ride request has been submitted'
    });
  }

  return sendSuccess(res, { rideId }, 'Ride request created', 201);
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

  // Get ride details for real-time notifications
  const [rideDetails] = await db.query(
    `SELECT r.*, CONCAT(u.FirstName,' ',u.LastName) AS CustomerName, u.UserID as CustomerID
     FROM RIDES r
     JOIN USERS u ON r.CustomerID = u.UserID
     WHERE r.RideID = ?`,
    [req.params.id]
  );

  if (rideDetails.length > 0) {
    const ride = rideDetails[0];
    
    // Emit real-time events
    const { emitToUser, emitToDrivers } = require('./socket');
    
    // Notify customer that ride was accepted
    emitToUser(ride.CustomerID, 'ride_accepted', {
      rideId: ride.RideID,
      driverId: driver.DriverID,
      vehicleID,
      driverName: `${req.user.firstName || ''} ${req.user.lastName || ''}`,
      estimatedArrival: '5-10 minutes',
      timestamp: new Date()
    });

    // Notify other drivers that ride is taken
    emitToDrivers('ride_taken', {
      rideId: ride.RideID,
      timestamp: new Date()
    });

    // Create notification for customer
    await db.query(
      `INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, RelatedID)
       VALUES (?, 'Ride Accepted', 'Your driver is on the way!', 'Ride', ?)`,
      [ride.CustomerID, ride.RideID]
    );
  }

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
    JOIN USERS u ON r.CustomerID = u.UserID
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

// ─── Profile Enhancements ───────────────────────────────────

// POST /api/driver/profile/photo
const uploadProfilePhoto = asyncHandler(async (req, res) => {
  // This would typically handle file upload with multer/cloudinary
  // For now, we'll accept a URL
  const { photoUrl } = req.body;
  if (!photoUrl) return sendError(res, 'Photo URL is required.');
  
  await db.query(
    'UPDATE DRIVERS SET ProfilePhoto = ? WHERE UserID = ?',
    [photoUrl, req.user.userID]
  );
  return sendSuccess(res, { photoUrl }, 'Profile photo updated');
});

// POST /api/driver/documents
const uploadDocuments = asyncHandler(async (req, res) => {
  const { documentType, documentUrl } = req.body;
  if (!documentType || !documentUrl) {
    return sendError(res, 'Document type and URL are required.');
  }
  
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  // Insert into DRIVER_DOCUMENTS table (would need to be created)
  const [result] = await db.query(
    'INSERT INTO DRIVER_DOCUMENTS (DriverID, DocumentType, DocumentUrl, Status) VALUES (?, ?, ?, "Pending")',
    [driver.DriverID, documentType, documentUrl]
  );
  return sendSuccess(res, { documentID: result.insertId }, 'Document uploaded for verification');
});

// POST /api/driver/verification-request
const requestVerification = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID, VerificationStatus FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  if (driver.VerificationStatus === 'Verified') {
    return sendError(res, 'Driver is already verified.', 400);
  }
  
  // Check if required documents are uploaded
  const [[docCount]] = await db.query(
    'SELECT COUNT(*) as count FROM DRIVER_DOCUMENTS WHERE DriverID = ? AND Status = "Pending"',
    [driver.DriverID]
  );
  
  if (docCount.count < 2) {
    return sendError(res, 'Please upload required documents before requesting verification.', 400);
  }
  
  await db.query(
    'UPDATE DRIVERS SET VerificationStatus = "Pending Review" WHERE DriverID = ?',
    [driver.DriverID]
  );
  return sendSuccess(res, null, 'Verification request submitted');
});

// ─── Notifications ───────────────────────────────────────────────

// GET /api/driver/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [rows] = await db.query(
    `SELECT NotificationID, Title, Message, NotificationType, IsRead, CreatedAt
     FROM NOTIFICATIONS 
     WHERE UserID = ? 
     ORDER BY CreatedAt DESC 
     LIMIT 50`,
    [req.user.userID]
  );
  return sendSuccess(res, rows);
});

// PATCH /api/driver/notifications/:id/read
const markNotificationRead = asyncHandler(async (req, res) => {
  const [result] = await db.query(
    'UPDATE NOTIFICATIONS SET IsRead = 1 WHERE NotificationID = ? AND UserID = ?',
    [req.params.id, req.user.userID]
  );
  if (!result.affectedRows) return sendError(res, 'Notification not found.', 404);
  return sendSuccess(res, null, 'Notification marked as read');
});

// ─── Safety Features ───────────────────────────────────────────────

// POST /api/driver/sos
const sendSOS = asyncHandler(async (req, res) => {
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  // Check if driver is in active ride
  const [[activeRide]] = await db.query(
    'SELECT RideID, PickupLocationID, DropoffLocationID FROM RIDES WHERE DriverID = ? AND RideStatus IN ("Accepted", "InProgress")',
    [driver.DriverID]
  );
  
  const [result] = await db.query(
    'INSERT INTO SOS_ALERTS (DriverID, RideID, LocationID, AlertTime, Status) VALUES (?, ?, ?, NOW(), "Active")',
    [driver.DriverID, activeRide?.RideID || null, activeRide?.PickupLocationID || null]
  );
  
  // In real implementation, this would trigger notifications to emergency services
  return sendSuccess(res, { alertID: result.insertId }, 'SOS alert sent');
});

// POST /api/driver/report-rider
const reportRider = asyncHandler(async (req, res) => {
  const { rideID, reason, description } = req.body;
  if (!rideID || !reason) {
    return sendError(res, 'Ride ID and reason are required.');
  }
  
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  // Verify ride belongs to this driver
  const [[ride]] = await db.query(
    'SELECT CustomerID FROM RIDES WHERE RideID = ? AND DriverID = ? AND RideStatus = "Completed"',
    [rideID, driver.DriverID]
  );
  if (!ride) return sendError(res, 'Ride not found or not completed.', 404);
  
  const [result] = await db.query(
    'INSERT INTO COMPLAINTS (RideID, UserID, Description, ComplaintStatus) VALUES (?, ?, ?, "Open")',
    [rideID, req.user.userID, `Rider Report: ${reason} - ${description || ''}`]
  );
  return sendSuccess(res, { complaintID: result.insertId }, 'Rider reported successfully');
});

// POST /api/driver/share-trip
const shareTrip = asyncHandler(async (req, res) => {
  const { rideID, contactPhone } = req.body;
  if (!rideID || !contactPhone) {
    return sendError(res, 'Ride ID and contact phone are required.');
  }
  
  const [[driver]] = await db.query(
    'SELECT DriverID FROM DRIVERS WHERE UserID = ?', [req.user.userID]);
  
  const [[ride]] = await db.query(
    `SELECT r.RideID, r.PickupLocationID, r.DropoffLocationID, 
            CONCAT(u.FirstName, ' ', u.LastName) AS RiderName,
            pl.City AS PickupCity, dl.City AS DropoffCity
     FROM RIDES r
     JOIN USERS u ON r.CustomerID = u.UserID
     JOIN LOCATIONS pl ON r.PickupLocationID = pl.LocationID
     JOIN LOCATIONS dl ON r.DropoffLocationID = dl.LocationID
     WHERE r.RideID = ? AND r.DriverID = ? AND r.RideStatus IN ("Accepted", "InProgress")`,
    [rideID, driver.DriverID]
  );
  
  if (!ride) return sendError(res, 'Active ride not found.', 404);
  
  // In real implementation, this would send SMS/share link
  return sendSuccess(res, {
    rideDetails: ride,
    shareMessage: `Trip shared with ${contactPhone}`
  }, 'Trip details shared');
});

module.exports = {
  getProfile, updateProfile, setAvailability, updateLocation,
  getMyVehicles, addVehicle, editVehicle, removeVehicle,
  uploadProfilePhoto, uploadDocuments, requestVerification,
  getIncomingRides, createRideRequest, acceptRide, startRide, completeRide, getMyRides,
  getEarnings, getWallet, requestPayout, getMyPayments,
  rateRider, getMyRatings,
  getNotifications, markNotificationRead,
  sendSOS, reportRider, shareTrip,
};
