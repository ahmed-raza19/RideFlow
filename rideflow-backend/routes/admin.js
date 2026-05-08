// routes/admin.js
const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth_test');
const C = require('../controllers/adminController');

// All admin routes require JWT + Admin role
router.use(authenticate, requireAdmin);

// ─── Users ────────────────────────────────────────────────────
router.get   ('/users',                     C.getAllUsers);
router.post  ('/users',                     C.createUser);
router.put   ('/users/:id',                  C.updateUser);
router.delete('/users/:id',                  C.deleteUser);
router.patch ('/users/:id/status',          C.updateUserStatus);
router.patch ('/users/:id/role',            C.updateUserRole);

// ─── Drivers ──────────────────────────────────────────────────
router.get   ('/drivers',                   C.getAllDrivers);
router.patch ('/drivers/:id/verify',        C.verifyDriver);
router.post  ('/drivers/:id/payout',        C.approvePayout);

// ─── Vehicles ─────────────────────────────────────────────────
router.get   ('/vehicles',                  C.getAllVehicles);
router.post  ('/vehicles',                  C.createVehicle);
router.put   ('/vehicles/:id',              C.updateVehicle);
router.delete('/vehicles/:id',              C.deleteVehicle);
router.patch ('/vehicles/:id/verify',       C.verifyVehicle);

// ─── Promo Codes ──────────────────────────────────────────────
router.get   ('/promocodes',                C.getAllPromoCodes);
router.post  ('/promocodes',                C.createPromoCode);
router.patch ('/promocodes/:id/status',     C.updatePromoStatus);

// ─── Complaints ───────────────────────────────────────────────
router.get   ('/complaints',                C.getAllComplaints);
router.patch ('/complaints/:id',            C.updateComplaint);

// ─── Ride Management ────────────────────────────────────────────
router.get   ('/rides',                     C.getAllRides);
router.patch ('/rides/:id/status',          C.updateRideStatus);
router.delete('/rides/:id',                 C.cancelRide);

// ─── Ratings & Reviews ─────────────────────────────────────────────
router.get   ('/ratings',                   C.getAllRatings);
router.delete('/ratings/:rideId',           C.deleteRating);
router.get   ('/drivers/:id/ratings',        C.getDriverRatings);
router.get   ('/riders/:id/ratings',         C.getRiderRatings);

// ─── Notifications ────────────────────────────────────────────────
router.get   ('/notifications',             C.getAdminNotifications);

// ─── Ride Controls ────────────────────────────────────────────
router.post  ('/rides/:id/surge',           C.applySurge);
router.post  ('/rides/:id/fare',            C.recalcFare);

// ─── Locations ────────────────────────────────────────────────
router.get   ('/locations',                 C.getAllLocations);
router.post  ('/locations',                 C.addLocation);

// ─── Revenue Analytics ───────────────────────────────────────
router.get   ('/revenue/overview',           C.getRevenueOverview);

// ─── Reports ──────────────────────────────────────────────────
router.get   ('/reports/revenue-by-city',   C.revenueByCity);
router.get   ('/reports/driver-earnings',   C.driverEarnings);
router.get   ('/reports/revenue-by-payment',C.revenueByPayment);
router.get   ('/reports/leaderboard',       C.leaderboard);
router.get   ('/reports/top-drivers',       C.topDrivers);
router.get   ('/reports/active-rides',      C.activeRides);
router.get   ('/reports/low-rated-drivers', C.lowRatedDrivers);

module.exports = router;
