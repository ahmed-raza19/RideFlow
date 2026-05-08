// middleware/auth_test.js
// Temporary authentication bypass for testing admin dashboard

const authenticate = (req, res, next) => {
  // Temporary bypass for testing - remove this in production!
  req.user = {
    userId: 20,
    email: 'test.admin@rideflow.com',
    role: 'Admin'
  };
  next();
};

// Role Guards
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

const requireAdmin   = requireRole('Admin');
const requireRider   = requireRole('Rider');
const requireDriver  = requireRole('Driver');
const requireAny     = requireRole('Admin', 'Rider', 'Driver');

module.exports = { authenticate, requireAdmin, requireRider, requireDriver, requireAny };
