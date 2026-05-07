// middleware/auth.js
// Verifies JWT and attaches decoded user to req.user
// Also exports role-guard helpers: requireAdmin, requireRider, requireDriver

const jwt = require('jsonwebtoken');

// ─── Verify Token ─────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userID, role, driverID (if driver) }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// ─── Role Guards ──────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      error: `Access denied. Required role: ${roles.join(' or ')}.`,
    });
  }
  next();
};

const requireAdmin  = requireRole('Admin');
const requireRider  = requireRole('Rider');
const requireDriver = requireRole('Driver');
const requireAny    = requireRole('Admin', 'Rider', 'Driver');

module.exports = { authenticate, requireAdmin, requireRider, requireDriver, requireAny };
