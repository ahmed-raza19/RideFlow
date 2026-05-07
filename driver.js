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

// ─── Rides ────────────────────────────────────────────────────
router.get   ('/rides/incoming',            C.getIncomingRides);
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
