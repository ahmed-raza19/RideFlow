const WebSocket = require('ws');
const geolib = require('geolib');
const db = require('../config/db');

// Simple state management
const activeDrivers = new Map(); // driverId -> location
const activeRides = new Map();   // rideId -> tracking data
const driverSockets = new Map(); // driverId -> socket
const riderSockets = new Map();  // riderId -> socket
let wss = null;

// Initialize WebSocket server
function initializeWebSocketServer() {
  if (wss) return wss;
  
  wss = new WebSocket.Server({ port: process.env.WEBSOCKET_PORT || 8080 });
  
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    const userType = url.searchParams.get('userType'); // 'driver' or 'rider'
    
    if (userId && userType) {
      if (userType === 'driver') {
        driverSockets.set(userId, ws);
      } else if (userType === 'rider') {
        riderSockets.set(userId, ws);
      }
      
      ws.on('close', () => {
        if (userType === 'driver') {
          driverSockets.delete(userId);
        } else if (userType === 'rider') {
          riderSockets.delete(userId);
        }
      });
    }
  });
  
  console.log(`WebSocket server initialized on port ${process.env.WEBSOCKET_PORT || 8080}`);
  return wss;
}

// Update driver location
async function updateDriverLocation(driverId, latitude, longitude) {
  activeDrivers.set(driverId, { 
    lat: latitude, 
    lng: longitude, 
    timestamp: Date.now() 
  });
  
  // Notify rider if driver is in active ride
  const ride = await findActiveRideByDriver(driverId);
  if (ride) {
    broadcastToRider(ride.CustomerID, {
      type: 'driver_location',
      location: { latitude, longitude },
      rideId: ride.RideID
    });
  }
}

// Find active ride for driver
async function findActiveRideByDriver(driverId) {
  const [rides] = await db.query(
    'SELECT * FROM RIDES WHERE DriverID = ? AND RideStatus IN ("Accepted", "In Progress")',
    [driverId]
  );
  return rides[0] || null;
}

// Find nearest available driver
async function findNearestDriver(pickupLat, pickupLng, vehicleType) {
  const availableDrivers = Array.from(activeDrivers.entries())
    .filter(([driverId, location]) => isDriverAvailable(driverId, vehicleType))
    .map(([driverId, location]) => ({
      driverId,
      distance: geolib.getDistance(
        { latitude: pickupLat, longitude: pickupLng },
        { latitude: location.lat, longitude: location.lng }
      )
    }))
    .sort((a, b) => a.distance - b.distance);

  return availableDrivers[0]?.driverId;
}

// Check if driver is available for specific vehicle type
async function isDriverAvailable(driverId, vehicleType) {
  const [drivers] = await db.query(`
    SELECT d.*, v.VehicleType 
    FROM DRIVERS d 
    JOIN VEHICLES v ON d.DriverID = v.DriverID 
    WHERE d.DriverID = ? AND d.AvailabilityStatus = 'Online' AND v.VehicleType = ?
  `, [driverId, vehicleType]);
  
  return drivers.length > 0;
}

// Broadcast message to rider
function broadcastToRider(riderId, message) {
  const riderSocket = riderSockets.get(riderId.toString());
  if (riderSocket && riderSocket.readyState === WebSocket.OPEN) {
    riderSocket.send(JSON.stringify(message));
  }
}

// Broadcast message to driver
function broadcastToDriver(driverId, message) {
  const driverSocket = driverSockets.get(driverId.toString());
  if (driverSocket && driverSocket.readyState === WebSocket.OPEN) {
    driverSocket.send(JSON.stringify(message));
  }
}

// Start ride tracking
async function startRideTracking(req, res) {
  const { rideId } = req.params;
  const userId = req.user.userID;

  try {
    // Verify user is part of this ride
    const [rides] = await db.query(
      'SELECT * FROM RIDES WHERE RideID = ? AND (CustomerID = ? OR DriverID IN (SELECT DriverID FROM DRIVERS WHERE UserID = ?))',
      [rideId, userId, userId]
    );

    if (rides.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to track this ride' });
    }

    const ride = rides[0];
    
    // Initialize tracking data
    activeRides.set(rideId, {
      rideId,
      customerId: ride.CustomerID,
      driverId: ride.DriverID,
      startTime: Date.now(),
      status: 'tracking'
    });

    res.json({ success: true, message: 'Ride tracking started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get ride tracking data
async function getRideTracking(req, res) {
  const { rideId } = req.params;
  const userId = req.user.userID;

  try {
    // Verify user is part of this ride
    const [rides] = await db.query(
      'SELECT * FROM RIDES WHERE RideID = ? AND (CustomerID = ? OR DriverID IN (SELECT DriverID FROM DRIVERS WHERE UserID = ?))',
      [rideId, userId, userId]
    );

    if (rides.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to view this ride' });
    }

    const ride = rides[0];
    const trackingData = activeRides.get(rideId);
    const driverLocation = activeDrivers.get(ride.DriverId);

    // Get pickup and dropoff locations
    const [pickupLocation] = await db.query(
      'SELECT * FROM LOCATIONS WHERE LocationID = ?',
      [ride.PickupLocationID]
    );
    
    const [dropoffLocation] = await db.query(
      'SELECT * FROM LOCATIONS WHERE LocationID = ?',
      [ride.DropoffLocationID]
    );

    res.json({
      success: true,
      ride: {
        rideId: ride.RideID,
        status: ride.RideStatus,
        pickupLocation: pickupLocation[0],
        dropoffLocation: dropoffLocation[0]
      },
      driverLocation: driverLocation || null,
      trackingData: trackingData || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Update driver location endpoint
async function updateLocation(req, res) {
  const { latitude, longitude } = req.body;
  const userId = req.user.userID;

  try {
    // Get driver ID from user ID
    const [drivers] = await db.query(
      'SELECT DriverID FROM DRIVERS WHERE UserID = ?',
      [userId]
    );

    if (drivers.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverId = drivers[0].DriverID;
    
    // Update driver location
    await updateDriverLocation(driverId, latitude, longitude);
    
    // Update database
    await db.query(
      'UPDATE LOCATIONS SET Latitude = ?, Longitude = ? WHERE LocationID = (SELECT CurrentLocationID FROM DRIVERS WHERE DriverID = ?)',
      [latitude, longitude, driverId]
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Stop ride tracking
async function stopRideTracking(req, res) {
  const { rideId } = req.params;
  const userId = req.user.userID;

  try {
    // Verify user is part of this ride
    const [rides] = await db.query(
      'SELECT * FROM RIDES WHERE RideID = ? AND (CustomerID = ? OR DriverID IN (SELECT DriverID FROM DRIVERS WHERE UserID = ?))',
      [rideId, userId, userId]
    );

    if (rides.length === 0) {
      return res.status(403).json({ error: 'Unauthorized to stop tracking this ride' });
    }

    // Remove from active tracking
    activeRides.delete(rideId);

    res.json({ success: true, message: 'Ride tracking stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
// Initialize WebSocket server when module is loaded
initializeWebSocketServer();

// Export functions
module.exports = {
  startRideTracking,
  getRideTracking,
  updateLocation,
  stopRideTracking,
  updateDriverLocation,
  findNearestDriver,
  broadcastToRider,
  broadcastToDriver
};
