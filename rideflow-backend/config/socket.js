// config/socket.js
// Socket.IO configuration for real-time driver features

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      socket.userId = decoded.userID;
      socket.userRole = decoded.role;
      
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    // Driver-specific events
    if (socket.userRole === 'Driver') {
      handleDriverConnection(socket);
    }

    // Customer events
    if (socket.userRole === 'Rider') {
      handleCustomerConnection(socket);
    }

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
      handleDisconnection(socket);
    });
  });

  return io;
};

const handleDriverConnection = (socket) => {
  const driverId = socket.userId;

  // Join driver-specific room
  socket.join(`driver_${driverId}`);

  // Join online drivers room
  socket.join('online_drivers');

  // Handle driver going online
  socket.on('driver_online', async (data) => {
    try {
      const { locationID, vehicleID } = data;
      
      // Update driver status in database
      await require('../controllers/driverController').setAvailability(
        { body: { status: 'Online' }, user: { userID: driverId } },
        { json: () => {} }
      );

      // Join location-based room for ride requests
      if (locationID) {
        socket.join(`location_${locationID}`);
      }

      // Broadcast to admin dashboard
      io.to('admin_dashboard').emit('driver_status_update', {
        driverId,
        status: 'Online',
        locationID,
        vehicleID,
        timestamp: new Date()
      });

      socket.emit('status_updated', { status: 'Online' });
    } catch (error) {
      socket.emit('error', { message: 'Failed to go online' });
    }
  });

  // Handle driver going offline
  socket.on('driver_offline', async () => {
    try {
      await require('../controllers/driverController').setAvailability(
        { body: { status: 'Offline' }, user: { userID: driverId } },
        { json: () => {} }
      );

      // Leave location-based rooms
      const rooms = Array.from(socket.rooms);
      rooms.forEach(room => {
        if (room.startsWith('location_')) {
          socket.leave(room);
        }
      });

      io.to('admin_dashboard').emit('driver_status_update', {
        driverId,
        status: 'Offline',
        timestamp: new Date()
      });

      socket.emit('status_updated', { status: 'Offline' });
    } catch (error) {
      socket.emit('error', { message: 'Failed to go offline' });
    }
  });

  // Handle location updates
  socket.on('update_location', async (data) => {
    try {
      const { latitude, longitude, locationID } = data;
      
      // Update driver location in database
      await require('../controllers/driverController').updateLocation(
        { body: { locationID }, user: { userID: driverId } },
        { json: () => {} }
      );

      // Broadcast to active ride (if any)
      const db = require('../config/db');
      const [activeRide] = await db.query(
        'SELECT RideID, CustomerID FROM RIDES WHERE DriverID = ? AND RideStatus IN ("Accepted", "InProgress")',
        [driverId]
      );

      if (activeRide.length > 0) {
        io.to(`customer_${activeRide[0].CustomerID}`).emit('driver_location_update', {
          rideId: activeRide[0].RideID,
          latitude,
          longitude,
          timestamp: new Date()
        });
      }

      // Update location room if changed
      if (locationID) {
        const rooms = Array.from(socket.rooms);
        rooms.forEach(room => {
          if (room.startsWith('location_') && room !== `location_${locationID}`) {
            socket.leave(room);
          }
        });
        socket.join(`location_${locationID}`);
      }

    } catch (error) {
      socket.emit('error', { message: 'Failed to update location' });
    }
  });

  // Handle ride acceptance
  socket.on('accept_ride', async (data) => {
    try {
      const { rideId, vehicleID } = data;
      
      // Accept ride through controller
      await require('../controllers/driverController').acceptRide(
        { params: { id: rideId }, body: { vehicleID }, user: { userID: driverId } },
        { json: () => {} }
      );

      // Get ride details
      const db = require('../config/db');
      const [rideDetails] = await db.query(
        `SELECT r.*, CONCAT(u.FirstName, ' ', u.LastName) AS CustomerName
         FROM RIDES r JOIN USERS u ON r.CustomerID = u.UserID
         WHERE r.RideID = ?`,
        [rideId]
      );

      if (rideDetails.length > 0) {
        const ride = rideDetails[0];
        
        // Notify customer
        io.to(`customer_${ride.CustomerID}`).emit('ride_accepted', {
          rideId: ride.RideID,
          driverId,
          vehicleID,
          estimatedArrival: '5-10 minutes'
        });

        // Notify other drivers that ride is taken
        io.to('online_drivers').emit('ride_taken', { rideId });

        // Update driver status
        socket.emit('ride_status_update', {
          rideId,
          status: 'Accepted',
          customerName: ride.CustomerName
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to accept ride' });
    }
  });

  // Handle ride start
  socket.on('start_ride', async (data) => {
    try {
      const { rideId } = data;
      
      await require('../controllers/driverController').startRide(
        { params: { id: rideId }, user: { userID: driverId } },
        { json: () => {} }
      );

      // Get customer ID
      const db = require('../config/db');
      const [ride] = await db.query(
        'SELECT CustomerID FROM RIDES WHERE RideID = ?',
        [rideId]
      );

      if (ride.length > 0) {
        // Notify customer
        io.to(`customer_${ride[0].CustomerID}`).emit('ride_started', {
          rideId,
          startTime: new Date()
        });

        // Update driver
        socket.emit('ride_status_update', {
          rideId,
          status: 'InProgress'
        });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to start ride' });
    }
  });

  // Handle ride completion
  socket.on('complete_ride', async (data) => {
    try {
      const { rideId } = data;
      
      await require('../controllers/driverController').completeRide(
        { params: { id: rideId }, user: { userID: driverId } },
        { json: () => {} }
      );

      // Get customer ID
      const db = require('../config/db');
      const [ride] = await db.query(
        'SELECT CustomerID FROM RIDES WHERE RideID = ?',
        [rideId]
      );

      if (ride.length > 0) {
        // Notify customer
        io.to(`customer_${ride[0].CustomerID}`).emit('ride_completed', {
          rideId,
          endTime: new Date()
        });

        // Update driver
        socket.emit('ride_status_update', {
          rideId,
          status: 'Completed'
        });

        // Request rating
        socket.emit('request_rating', { rideId });
      }
    } catch (error) {
      socket.emit('error', { message: 'Failed to complete ride' });
    }
  });

  // Handle SOS alert
  socket.on('sos_alert', async (data) => {
    try {
      const { rideId, location } = data;
      
      // Create SOS alert
      await require('../controllers/driverController').sendSOS(
        { body: {}, user: { userID: driverId } },
        { json: () => {} }
      );

      // Broadcast to emergency services (admin dashboard)
      io.to('admin_dashboard').emit('emergency_alert', {
        driverId,
        rideId,
        location,
        timestamp: new Date(),
        type: 'SOS'
      });

      // Notify nearby drivers
      io.to('online_drivers').emit('emergency_nearby', {
        driverId,
        location,
        message: 'Driver nearby needs assistance'
      });

      socket.emit('sos_sent', { timestamp: new Date() });
    } catch (error) {
      socket.emit('error', { message: 'Failed to send SOS alert' });
    }
  });
};

const handleCustomerConnection = (socket) => {
  const customerId = socket.userId;
  
  // Join customer-specific room
  socket.join(`customer_${customerId}`);

  // Handle ride request
  socket.on('request_ride', async (data) => {
    try {
      const { pickupLocationID, dropoffLocationID, vehicleType } = data;
      
      // Create ride request (this would be handled by the ride controller)
      // For now, we'll broadcast to online drivers in the pickup location
      
      io.to(`location_${pickupLocationID}`).emit('new_ride_request', {
        customerId,
        pickupLocationID,
        dropoffLocationID,
        vehicleType,
        timestamp: new Date()
      });

      socket.emit('ride_request_submitted', { 
        message: 'Ride request submitted, waiting for driver acceptance' 
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to submit ride request' });
    }
  });
};

const handleDisconnection = (socket) => {
  // Handle cleanup on disconnection
  if (socket.userRole === 'Driver') {
    // Optionally mark driver as offline after timeout
    setTimeout(async () => {
      try {
        // Check if driver is still offline
        const db = require('../config/db');
        const [driver] = await db.query(
          'SELECT AvailabilityStatus FROM DRIVERS WHERE UserID = ?',
          [socket.userId]
        );

        if (driver.length > 0 && driver[0].AvailabilityStatus !== 'Offline') {
          // Don't automatically change status - let explicit offline handle it
          console.log(`Driver ${socket.userId} disconnected but status remains unchanged`);
        }
      } catch (error) {
        console.error('Error handling driver disconnection:', error);
      }
    }, 30000); // 30 second grace period
  }
};

// Helper functions to emit events from other parts of the application
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

const emitToDrivers = (event, data) => {
  if (io) {
    io.to('online_drivers').emit(event, data);
  }
};

const emitToLocation = (locationId, event, data) => {
  if (io) {
    io.to(`location_${locationId}`).emit(event, data);
  }
};

const emitToAdmins = (event, data) => {
  if (io) {
    io.to('admin_dashboard').emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  emitToUser,
  emitToDrivers,
  emitToLocation,
  emitToAdmins,
  getIO: () => io
};
