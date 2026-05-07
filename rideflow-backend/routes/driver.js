// routes/driver.js
const router = require('express').Router();
const { authenticate, requireDriver } = require('../middleware/auth');
const C = require('../controllers/driverController');

// All driver routes require JWT + Driver role
router.use(authenticate, requireDriver);

// ─── Profile & Availability ───────────────────────────────────
router.get   ('/profile',                   C.getProfile);
router.patch ('/profile',                   C.updateProfile);
router.patch ('/availability',              C.setAvailability);
router.patch ('/location',                  C.updateLocation);

// ─── Vehicles ─────────────────────────────────────────────────
router.get   ('/vehicles',                  C.getMyVehicles);
router.post  ('/vehicles',                  C.addVehicle);
router.patch ('/vehicles/:id',               C.editVehicle);
router.delete('/vehicles/:id',               C.removeVehicle);

// ─── Profile Enhancements ───────────────────────────────────
router.post  ('/profile/photo',             C.uploadProfilePhoto);
router.post  ('/documents',                  C.uploadDocuments);
router.post  ('/verification-request',       C.requestVerification);

// ─── Notifications ───────────────────────────────────────────
router.get   ('/notifications',              C.getNotifications);
router.patch ('/notifications/:id/read',    C.markNotificationRead);

// ─── Safety Features ───────────────────────────────────────────
router.post  ('/sos',                        C.sendSOS);
router.post  ('/report-rider',               C.reportRider);
router.post  ('/share-trip',                 C.shareTrip);

// ─── Rides ────────────────────────────────────────────────────
router.get   ('/rides/incoming',            C.getIncomingRides);
router.post  ('/rides/request',             C.createRideRequest);
router.get   ('/rides',                     C.getMyRides);
router.patch ('/rides/:id/accept',          C.acceptRide);
router.patch ('/rides/:id/start',           C.startRide);
router.patch ('/rides/:id/complete',        C.completeRide);

// ─── Earnings & Wallet ────────────────────────────────────────
router.get   ('/earnings',                  C.getEarnings);
router.get   ('/wallet',                    C.getWallet);
router.post  ('/payout',                    C.requestPayout);
router.get   ('/payments',                  C.getMyPayments);

// ─── Ratings ──────────────────────────────────────────────────
router.post  ('/ratings',                   C.rateRider);
router.get   ('/ratings',                   C.getMyRatings);

module.exports = router;
