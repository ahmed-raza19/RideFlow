const express = require('express');
const router = express.Router();
const { startRideTracking, getRideTracking, updateLocation, stopRideTracking } = require('../controllers/rideTrackingController');
const auth = require('../middleware/auth');

// POST /api/rides/:rideId/start-tracking
router.post('/:rideId/start-tracking', auth, startRideTracking);

// GET /api/rides/:rideId/tracking
router.get('/:rideId/tracking', auth, getRideTracking);

// POST /api/drivers/location
router.post('/location', auth, updateLocation);

// POST /api/rides/:rideId/stop-tracking
router.post('/:rideId/stop-tracking', auth, stopRideTracking);

module.exports = router;
