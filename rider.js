// routes/rider.js
const router = require('express').Router();
const { authenticate, requireRider } = require('../middleware/auth');
const C = require('../controllers/riderController');

// All rider routes require JWT + Rider role
router.use(authenticate, requireRider);

// ─── Profile ──────────────────────────────────────────────────
router.get   ('/profile',                   C.getProfile);
router.patch ('/profile',                   C.updateProfile);
router.post  ('/phones',                    C.addPhone);
router.delete('/phones/:phone',             C.removePhone);

// ─── Browsing ─────────────────────────────────────────────────
router.get   ('/locations',                 C.getLocations);
router.get   ('/drivers/available',         C.getAvailableDrivers);
router.get   ('/vehicles',                  C.getVehicles);

// ─── Rides ────────────────────────────────────────────────────
router.post  ('/rides',                     C.requestRide);
router.get   ('/rides',                     C.getRideHistory);
router.get   ('/rides/:id',                 C.getRideDetail);
router.patch ('/rides/:id/cancel',          C.cancelRide);
router.post  ('/rides/:id/promo',           C.applyPromo);

// ─── Payments ─────────────────────────────────────────────────
router.post  ('/payments',                  C.makePayment);
router.get   ('/payments',                  C.getPaymentHistory);

// ─── Promo Codes ──────────────────────────────────────────────
router.get   ('/promocodes',                C.getActivePromoCodes);
router.get   ('/my-promocodes',             C.getMyPromoCodes);

// ─── Ratings ──────────────────────────────────────────────────
router.post  ('/ratings',                   C.rateDriver);

// ─── Complaints ───────────────────────────────────────────────
router.post  ('/complaints',                C.fileComplaint);
router.get   ('/complaints',                C.getMyComplaints);

module.exports = router;
