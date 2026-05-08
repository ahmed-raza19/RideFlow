// controllers/riderController.js
// All Rider-role operations

const db = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');
const wsServer = require('../utils/websocket');
const { createNotification } = require('./notificationController');
const { emitToLocation, emitToUser } = require('../config/socket');

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
  let sql = `
    SELECT v.VehicleID, v.Make, v.Model, v.Year, v.Color, v.VehicleType, v.LicensePlate,
           d.DriverID, d.AvailabilityStatus, d.VerificationStatus,
           CONCAT(u.FirstName, ' ', u.LastName) AS DriverName,
           ROUND(AVG(r.Score), 2) AS AvgRating,
           COUNT(r.RideID) AS TotalRides
    FROM VEHICLES v
    JOIN DRIVERS d ON v.DriverID = d.DriverID
    JOIN USERS u ON d.UserID = u.UserID
    LEFT JOIN RATINGS r ON r.RatedUserID = u.UserID
    WHERE v.VerificationStatus = 'Verified' 
      AND d.VerificationStatus = 'Verified'
      AND d.AvailabilityStatus = 'Online'`;
  const params = [];
  if (type) { sql += ' AND v.VehicleType = ?'; params.push(type); }
  sql += ' GROUP BY v.VehicleID, d.DriverID, u.UserID';
  const [rows] = await db.query(sql, params);
  
  // Group by vehicle type and add availability info
  const vehicleTypes = ['Economy', 'Business', 'Bike'];
  const result = vehicleTypes.map(vType => {
    const availableVehicles = rows.filter(v => v.VehicleType === vType);
    return {
      Type: vType,
      Available: availableVehicles.length,
      EstimatedFare: vType === 'Economy' ? 'PKR 100-200' : vType === 'Business' ? 'PKR 200-400' : 'PKR 50-100',
      EstimatedTime: vType === 'Bike' ? '5-10 min' : '8-15 min',
      Vehicles: availableVehicles.slice(0, 3) // Show top 3 available drivers
    };
  });
  
  return sendSuccess(res, result);
});

// ─── Rides ────────────────────────────────────────────────────

// POST /api/rider/rides
const requestRide = asyncHandler(async (req, res) => {
  const { pickupLocationID, dropoffLocationID, vehicleType, scheduledTime } = req.body;
  if (!pickupLocationID || !dropoffLocationID || !vehicleType) {
    return sendError(res, 'pickupLocationID, dropoffLocationID, and vehicleType are required.');
  }

  // Calculate distance and fare
  const [distanceData] = await db.query(
    `SELECT 
      (6371 * acos(cos(radians(pl.Latitude)) * cos(radians(dl.Latitude)) * 
       cos(radians(dl.Longitude) - radians(pl.Longitude)) + 
       sin(radians(pl.Latitude)) * sin(radians(dl.Latitude)))) AS Distance,
       pl.City AS PickupCity, dl.City AS DropoffCity
     FROM LOCATIONS pl, LOCATIONS dl 
     WHERE pl.LocationID = ? AND dl.LocationID = ?`,
    [pickupLocationID, dropoffLocationID]
  );

  if (!distanceData.length) {
    return sendError(res, 'Invalid pickup or dropoff location.');
  }

  const distance = distanceData[0].Distance || 5.0; // Default 5km if calculation fails
  
  // Base fare calculation by vehicle type
  const baseFares = { 'Economy': 100, 'Business': 200, 'Bike': 50 };
  const perKmRates = { 'Economy': 20, 'Business': 35, 'Bike': 15 };
  const baseFare = baseFares[vehicleType] || 100;
  const perKmRate = perKmRates[vehicleType] || 20;
  const distanceFare = Math.round(distance * perKmRate * 100) / 100;
  const subtotal = baseFare + distanceFare;
  
  // Apply surge pricing (1.0x - 2.5x)
  const surgeMultiplier = await calculateSurgeMultiplier(pickupLocationID, vehicleType);
  const surgeAmount = Math.round(subtotal * (surgeMultiplier - 1) * 100) / 100;
  const finalFare = Math.round((subtotal + surgeAmount) * 100) / 100;
  
  // Fare breakdown for response
  const fareBreakdown = {
    baseFare: baseFare,
    distanceFare: distanceFare,
    distance: Math.round(distance * 100) / 100,
    perKmRate: perKmRate,
    subtotal: subtotal,
    surgeMultiplier: surgeMultiplier,
    surgeAmount: surgeAmount,
    discount: 0,
    total: finalFare
  };

  const [result] = await db.query(
    `INSERT INTO RIDES (CustomerID, PickupLocationID, DropoffLocationID, RideStatus, 
                       Fare, Distance, ScheduledTime, SurgeMultiplier)
     VALUES (?, ?, ?, 'Requested', ?, ?, ?, ?)`,
    [req.user.userID, pickupLocationID, dropoffLocationID, 
     finalFare, distance, scheduledTime || null, surgeMultiplier]
  );

  const rideId = result.insertId;

  // Get ride details for broadcasting to drivers
  const [rideDetails] = await db.query(
    `SELECT r.*, CONCAT(u.FirstName,' ',u.LastName) AS CustomerName,
            pl.City AS PickupCity, pl.Street AS PickupStreet,
            dl.City AS DropoffCity, dl.Street AS DropoffStreet
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
    emitToLocation(pickupLocationID, 'new_ride_request', {
      rideId: ride.RideID,
      customerName: ride.CustomerName,
      pickupCity: ride.PickupCity,
      pickupStreet: ride.PickupStreet,
      dropoffCity: ride.DropoffCity,
      dropoffStreet: ride.DropoffStreet,
      fare: ride.Fare,
      distance: ride.Distance,
      vehicleType: vehicleType,
      surgeMultiplier: ride.SurgeMultiplier,
      timestamp: new Date()
    });

    // Also emit to specific customer
    emitToUser(req.user.userID, 'ride_request_created', {
      rideId: ride.RideID,
      status: 'Requested',
      message: 'Your ride request has been submitted to drivers'
    });
  }

  // Broadcast ride update via WebSocket (for rider UI)
  wsServer.broadcastRideUpdate(rideId, req.user.userID, {
    status: 'Requested',
    message: 'Finding your driver...',
    fare: finalFare,
    distance: distance,
    surgeMultiplier: surgeMultiplier
  });

  // Create notification for ride request
  createNotification(
    req.user.userID,
    'Ride Requested',
    `Your ${vehicleType} ride has been requested. We're finding you a driver.`,
    'RideUpdate',
    `/customer?ride=${rideId}`
  ).catch(err => console.error('Failed to create notification:', err));
  
  return sendSuccess(res, { 
    rideID: rideId, 
    fare: finalFare, 
    distance: distance,
    surgeMultiplier: surgeMultiplier,
    fareBreakdown: fareBreakdown,
    estimatedDuration: Math.round(distance * 2) // Rough estimate: 2 min per km
  }, 'Ride requested', 201);
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
    WHERE r.CustomerID = ?`;
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
     WHERE r.RideID = ? AND r.CustomerID = ?`,
    [req.params.id, req.user.userID]
  );
  if (!rows.length) return sendError(res, 'Ride not found.', 404);
  return sendSuccess(res, rows[0]);
});

// PATCH /api/rider/rides/:id/cancel
const cancelRide = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  // Get ride details before cancelling
  const [[ride]] = await db.query(
    `SELECT r.RideID, r.RideStatus, r.DriverID, r.CustomerID, r.Fare
     FROM RIDES r
     WHERE r.RideID = ? AND r.CustomerID = ?`,
    [req.params.id, req.user.userID]
  );

  if (!ride) {
    return sendError(res, 'Ride not found.', 404);
  }

  // Allow cancellation only if ride is Requested or Accepted
  if (!['Requested', 'Accepted'].includes(ride.RideStatus)) {
    return sendError(res, 'Cannot cancel — ride is already in progress or completed.');
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Cancel the ride
    const [result] = await conn.query(
      `UPDATE RIDES SET RideStatus = 'Cancelled'
       WHERE RideID = ? AND CustomerID = ? AND RideStatus IN ('Requested', 'Accepted')`,
      [req.params.id, req.user.userID]
    );

    if (!result.affectedRows) {
      await conn.rollback();
      return sendError(res, 'Cannot cancel — ride not found or already in progress/completed.');
    }

    // Check for existing payment and process refund if applicable
    const [[existingPayment]] = await conn.query(
      `SELECT PaymentID, Amount, PaymentMethod, PaymentStatus 
       FROM PAYMENTS WHERE RideID = ?`,
      [req.params.id]
    );

    let refundAmount = 0;
    let cancellationFee = 0;
    let refundMethod = 'original';

    if (existingPayment) {
      if (existingPayment.PaymentStatus === 'Paid') {
        // Calculate refund amount based on payment method and timing
        if (ride.RideStatus === 'Requested') {
          // Full refund for pre-acceptance cancellation
          refundAmount = existingPayment.Amount;
          cancellationFee = 0;
        } else if (ride.RideStatus === 'Accepted') {
          // Partial refund after driver acceptance (cancellation fee applies)
          cancellationFee = Math.min(existingPayment.Amount * 0.10, 50); // 10% or PKR 50 max
          refundAmount = existingPayment.Amount - cancellationFee;
        }

        // Handle different refund methods
        if (existingPayment.PaymentMethod === 'Wallet') {
          // Credit back to rider wallet (if riders had wallets)
          // For now, just mark as refunded since riders don't have wallet balance
          refundMethod = 'wallet_credit';
        } else if (existingPayment.PaymentMethod === 'CreditCard') {
          // Process refund to original payment method
          refundMethod = 'card_refund';
        } else {
          // Cash payments - no refund needed
          refundMethod = 'cash_no_refund';
          refundAmount = 0;
          cancellationFee = existingPayment.Amount;
        }

        // Update payment status to refunded with refund details
        await conn.query(
          `UPDATE PAYMENTS 
           SET PaymentStatus = 'Refunded',
               Amount = CASE 
                 WHEN PaymentMethod = 'Cash' THEN 0
                 ELSE ? 
               END,
               DiscountApplied = CASE 
                 WHEN PaymentMethod = 'Cash' THEN ?
                 ELSE 0
               END
           WHERE PaymentID = ?`,
          [existingPayment.Amount - refundAmount, existingPayment.PaymentID]
        );

        // Create refund record for audit trail
        await conn.query(
          `INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, RelatedID)
           VALUES (?, 'Refund Processed', ?, 'Payment', ?)`,
          [req.user.userID, 
           `Refund of PKR ${refundAmount.toFixed(2)} processed for cancelled ride #${req.params.id}. Refund method: ${refundMethod}`, 
           req.params.id]
        );

      } else if (existingPayment.PaymentStatus === 'Pending') {
        // Cancel pending payment
        await conn.query(
          `UPDATE PAYMENTS 
           SET PaymentStatus = 'Failed' 
           WHERE PaymentID = ?`,
          [existingPayment.PaymentID]
        );
        refundMethod = 'cancelled_pending';
      }
    }

    // If driver was assigned, create notification
    if (ride.DriverID) {
      const [[driver]] = await conn.query(
        'SELECT UserID FROM DRIVERS WHERE DriverID = ?',
        [ride.DriverID]
      );
      if (driver) {
        await conn.query(
          `INSERT INTO NOTIFICATIONS (UserID, Title, Message, NotificationType, RelatedID)
           VALUES (?, 'Ride Cancelled', ?, 'RideUpdate', ?)`,
          [driver.UserID, `Ride #${ride.RideID} has been cancelled by the rider.`, ride.RideID]
        );
        
        // Emit real-time notification
        const { emitToUser } = require('../config/socket');
        emitToUser(driver.UserID, 'ride_cancelled_by_rider', {
          rideId: ride.RideID,
          reason: reason || 'Rider cancelled',
          timestamp: new Date()
        });
      }
    }

    await conn.commit();

    return sendSuccess(res, {
      rideID: req.params.id,
      rideStatus: 'Cancelled',
      refundAmount: refundAmount,
      cancellationFee: cancellationFee,
      refundMethod: refundMethod,
      originalPaymentMethod: existingPayment?.PaymentMethod,
      message: refundAmount > 0 
        ? `Ride cancelled. Refund of PKR ${refundAmount.toFixed(2)} will be processed via ${refundMethod.replace('_', ' ')}.` 
        : cancellationFee > 0 
          ? `Ride cancelled. Cancellation fee of PKR ${cancellationFee.toFixed(2)} applies.`
          : 'Ride cancelled successfully.'
    }, 'Ride cancelled');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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
    'SELECT RideID FROM RIDES WHERE RideID = ? AND CustomerID = ?',
    [rideID, req.user.userID]
  );
  if (!ride) return sendError(res, 'Ride not found or not yours.', 404);

  const [result] = await db.query(
    `INSERT INTO PAYMENTS (RideID, CustomerID, Amount, PaymentMethod, PaymentStatus, DiscountApplied)
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
     WHERE p.CustomerID = ? ORDER BY p.TransactionDate DESC`,
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
  const { rideID, score, comment } = req.body;
  if (!rideID || !score) {
    return sendError(res, 'rideID and score are required.');
  }
  if (score < 1 || score > 5) return sendError(res, 'Score must be between 1 and 5.');

  // Verify ride completed & belongs to this rider, and get driver info
  const [[ride]] = await db.query(
    `SELECT r.RideID, d.UserID AS DriverUserID 
     FROM RIDES r 
     JOIN DRIVERS d ON r.DriverID = d.DriverID 
     WHERE r.RideID = ? AND r.CustomerID = ? AND r.RideStatus = 'Completed'`,
    [rideID, req.user.userID]
  );
  if (!ride) return sendError(res, 'Ride not found or not completed.', 404);

  // Check if already rated
  const [[existingRating]] = await db.query(
    'SELECT RideID FROM RATINGS WHERE RideID = ? AND RatedBy = ?',
    [rideID, req.user.userID]
  );
  if (existingRating) return sendError(res, 'You have already rated this ride.', 400);

  await db.query(
    `INSERT INTO RATINGS (RideID, RatedBy, RatedUserID, Score, Comment)
     VALUES (?, ?, ?, ?, ?)`,
    [rideID, req.user.userID, ride.DriverUserID, score, comment || null]
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

// Helper function to calculate surge multiplier
const calculateSurgeMultiplier = async (locationID, vehicleType) => {
  // Check active rides in the area (within last 30 minutes)
  const [activeRides] = await db.query(`
    SELECT COUNT(*) as ActiveRides 
    FROM RIDES r 
    JOIN LOCATIONS l ON r.PickupLocationID = l.LocationID 
    WHERE r.RideStatus IN ('Requested', 'Accepted', 'InProgress') 
      AND r.PickupLocationID = ? 
      AND r.StartTime > DATE_SUB(NOW(), INTERVAL 30 MINUTE)
  `, [locationID]);
  
  const activeCount = activeRides[0].ActiveRides;
  
  // Calculate surge based on demand
  if (activeCount >= 10) return 2.5; // Very high demand
  if (activeCount >= 7) return 2.0;  // High demand
  if (activeCount >= 4) return 1.5;  // Medium demand
  if (activeCount >= 2) return 1.2;  // Low demand
  return 1.0; // Normal pricing
};

// ─── Saved Locations ───────────────────────────────────────────────

// GET /api/rider/saved-locations
const getSavedLocations = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT sl.*, l.City, l.Street 
     FROM SAVED_LOCATIONS sl 
     LEFT JOIN LOCATIONS l ON sl.LocationID = l.LocationID 
     WHERE sl.UserID = ? ORDER BY sl.IsDefault DESC, sl.CreatedAt DESC`,
    [req.user.userID]
  );
  return sendSuccess(res, rows);
});

// POST /api/rider/saved-locations
const addSavedLocation = asyncHandler(async (req, res) => {
  const { locationName, address, locationType, locationID, latitude, longitude, isDefault } = req.body;
  if (!locationName || !address) {
    return sendError(res, 'locationName and address are required.');
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // If setting as default, unset other defaults
    if (isDefault) {
      await conn.query('UPDATE SAVED_LOCATIONS SET IsDefault = FALSE WHERE UserID = ?', [req.user.userID]);
    }

    const [result] = await conn.query(
      `INSERT INTO SAVED_LOCATIONS (UserID, LocationName, Address, LocationType, LocationID, Latitude, Longitude, IsDefault)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.userID, locationName, address, locationType || 'Other', locationID || null, latitude || null, longitude || null, isDefault || false]
    );

    await conn.commit();
    return sendSuccess(res, { savedLocationID: result.insertId }, 'Location saved', 201);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// PATCH /api/rider/saved-locations/:id
const updateSavedLocation = asyncHandler(async (req, res) => {
  const { locationName, address, locationType, isDefault } = req.body;
  const savedLocationID = req.params.id;

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // If setting as default, unset other defaults
    if (isDefault) {
      await conn.query('UPDATE SAVED_LOCATIONS SET IsDefault = FALSE WHERE UserID = ?', [req.user.userID]);
    }

    const fields = [];
    const values = [];
    if (locationName) { fields.push('LocationName = ?'); values.push(locationName); }
    if (address) { fields.push('Address = ?'); values.push(address); }
    if (locationType) { fields.push('LocationType = ?'); values.push(locationType); }
    if (isDefault !== undefined) { fields.push('IsDefault = ?'); values.push(isDefault); }

    if (fields.length === 0) {
      await conn.rollback();
      return sendError(res, 'No fields to update.');
    }

    values.push(savedLocationID, req.user.userID);
    await conn.query(
      `UPDATE SAVED_LOCATIONS SET ${fields.join(', ')} WHERE SavedLocationID = ? AND UserID = ?`,
      values
    );

    await conn.commit();
    return sendSuccess(res, null, 'Location updated');
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// DELETE /api/rider/saved-locations/:id
const deleteSavedLocation = asyncHandler(async (req, res) => {
  const [result] = await db.query(
    'DELETE FROM SAVED_LOCATIONS WHERE SavedLocationID = ? AND UserID = ?',
    [req.params.id, req.user.userID]
  );
  if (!result.affectedRows) {
    return sendError(res, 'Location not found.', 404);
  }
  return sendSuccess(res, null, 'Location deleted');
});

// ─── Safety Features ───────────────────────────────────────────────

// POST /api/rider/sos
const triggerSOS = asyncHandler(async (req, res) => {
  const { rideID, locationLat, locationLng } = req.body;
  
  const [result] = await db.query(
    `INSERT INTO SAFETY_ALERTS (UserID, RideID, AlertType, AlertData, LocationLat, LocationLng)
     VALUES (?, ?, 'SOS', ?, ?, ?)`,
    [req.user.userID, rideID || null, JSON.stringify({ timestamp: new Date() }), locationLat || null, locationLng || null]
  );

  // TODO: Send emergency SMS to contacts, notify emergency services
  // For now, just log the alert
  
  return sendSuccess(res, { alertID: result.insertId }, 'SOS alert triggered', 201);
});

// POST /api/rider/share-trip
const shareTrip = asyncHandler(async (req, res) => {
  const { rideID, shareWith, message } = req.body;
  if (!rideID || !shareWith) {
    return sendError(res, 'rideID and shareWith are required.');
  }

  // Verify ride belongs to this rider
  const [[ride]] = await db.query(
    'SELECT RideID FROM RIDES WHERE RideID = ? AND CustomerID = ?',
    [rideID, req.user.userID]
  );
  if (!ride) return sendError(res, 'Ride not found.', 404);

  const [result] = await db.query(
    `INSERT INTO SAFETY_ALERTS (UserID, RideID, AlertType, AlertData)
     VALUES (?, ?, 'ShareTrip', ?)`,
    [req.user.userID, rideID, JSON.stringify({ shareWith, message, timestamp: new Date() })]
  );

  // TODO: Send share link via SMS/email
  // For now, just log the share

  return sendSuccess(res, { alertID: result.insertId, shareLink: `https://rideflow.app/share/${result.insertId}` }, 'Trip shared', 201);
});

// GET /api/rider/emergency-contacts
const getEmergencyContacts = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM EMERGENCY_CONTACTS WHERE UserID = ? ORDER BY IsPrimary DESC, ContactName ASC',
    [req.user.userID]
  );
  return sendSuccess(res, rows);
});

// POST /api/rider/emergency-contacts
const addEmergencyContact = asyncHandler(async (req, res) => {
  const { contactName, contactPhone, contactEmail, contactRelation, isPrimary } = req.body;
  if (!contactName || !contactPhone) {
    return sendError(res, 'contactName and contactPhone are required.');
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // If setting as primary, unset other primaries
    if (isPrimary) {
      await conn.query('UPDATE EMERGENCY_CONTACTS SET IsPrimary = FALSE WHERE UserID = ?', [req.user.userID]);
    }

    const [result] = await conn.query(
      `INSERT INTO EMERGENCY_CONTACTS (UserID, ContactName, ContactPhone, ContactEmail, ContactRelation, IsPrimary)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.userID, contactName, contactPhone, contactEmail || null, contactRelation || null, isPrimary || false]
    );

    await conn.commit();
    return sendSuccess(res, { contactID: result.insertId }, 'Emergency contact added', 201);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// DELETE /api/rider/emergency-contacts/:id
const deleteEmergencyContact = asyncHandler(async (req, res) => {
  const [result] = await db.query(
    'DELETE FROM EMERGENCY_CONTACTS WHERE ContactID = ? AND UserID = ?',
    [req.params.id, req.user.userID]
  );
  if (!result.affectedRows) {
    return sendError(res, 'Emergency contact not found.', 404);
  }
  return sendSuccess(res, null, 'Emergency contact deleted');
});

module.exports = {
  getProfile, updateProfile, addPhone, removePhone,
  getLocations, getAvailableDrivers, getVehicles,
  requestRide, getRideHistory, getRideDetail, cancelRide,
  makePayment, getPaymentHistory,
  getActivePromoCodes, applyPromo, getMyPromoCodes,
  rateDriver,
  fileComplaint, getMyComplaints,
  getSavedLocations, addSavedLocation, updateSavedLocation, deleteSavedLocation,
  triggerSOS, shareTrip, getEmergencyContacts, addEmergencyContact, deleteEmergencyContact,
  calculateSurgeMultiplier
};
