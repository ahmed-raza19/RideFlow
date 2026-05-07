// controllers/authController.js
// POST /api/auth/register
// POST /api/auth/login
// GET  /api/auth/me

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

// ─── Helpers ──────────────────────────────────────────────────
const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

// ─── POST /api/auth/register ──────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role, phone } = req.body;

  if (!firstName || !lastName || !email || !password || !role) {
    return sendError(res, 'firstName, lastName, email, password, role are required.');
  }
  if (!['Rider', 'Driver'].includes(role)) {
    return sendError(res, 'Role must be Rider or Driver. Admins are created manually.');
  }

  // Check duplicate email
  const [existing] = await db.query('SELECT UserID FROM USERS WHERE Email = ?', [email]);
  if (existing.length) return sendError(res, 'Email already registered.', 409);

  const hash = await bcrypt.hash(password, 12);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO USERS (FirstName, LastName, Email, Password, Role)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hash, role]
    );
    const userID = result.insertId;

    // Insert phone if provided
    if (phone) {
      await conn.query(
        'INSERT INTO USER_PHONES (UserID, PhoneNumber) VALUES (?, ?)',
        [userID, phone]
      );
    }

    // If Driver — create skeleton driver profile
    if (role === 'Driver') {
      const { licenseNumber, cnic } = req.body;
      if (!licenseNumber || !cnic) {
        await conn.rollback();
        return sendError(res, 'licenseNumber and cnic are required for Driver registration.');
      }
      await conn.query(
        `INSERT INTO DRIVERS (UserID, LicenseNumber, CNIC) VALUES (?, ?, ?)`,
        [userID, licenseNumber, cnic]
      );
    }

    await conn.commit();

    const token = signToken({ userID, role });
    return sendSuccess(res, { userID, role, token }, 'Registration successful', 201);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, 'Email and password required.');

  const [rows] = await db.query(
    'SELECT UserID, FirstName, LastName, Email, Password, Role, AccountStatus FROM USERS WHERE Email = ?',
    [email]
  );
  if (!rows.length) return sendError(res, 'Invalid email or password.', 401);

  const user = rows[0];
  if (user.AccountStatus === 'Banned') {
    return sendError(res, 'Your account has been banned. Contact support.', 403);
  }
  if (user.AccountStatus === 'Suspended') {
    return sendError(res, 'Your account is suspended. Contact support.', 403);
  }

  const match = await bcrypt.compare(password, user.Password);
  if (!match) return sendError(res, 'Invalid email or password.', 401);

  // For drivers, include driverID in token
  let driverID = null;
  if (user.Role === 'Driver') {
    const [d] = await db.query('SELECT DriverID FROM DRIVERS WHERE UserID = ?', [user.UserID]);
    if (d.length) driverID = d[0].DriverID;
  }

  const token = signToken({ userID: user.UserID, role: user.Role, driverID });
  return sendSuccess(res, {
    token,
    user: {
      userID:    user.UserID,
      firstName: user.FirstName,
      lastName:  user.LastName,
      email:     user.Email,
      role:      user.Role,
      driverID,
    },
  }, 'Login successful');
});

// ─── GET /api/auth/me ─────────────────────────────────────────
const me = asyncHandler(async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.UserID, u.FirstName, u.LastName, u.Email, u.Role,
            u.AccountStatus, u.RegistrationDate,
            GROUP_CONCAT(p.PhoneNumber SEPARATOR ', ') AS Phones
     FROM USERS u
     LEFT JOIN USER_PHONES p ON u.UserID = p.UserID
     WHERE u.UserID = ?
     GROUP BY u.UserID`,
    [req.user.userID]
  );
  if (!rows.length) return sendError(res, 'User not found.', 404);
  return sendSuccess(res, rows[0]);
});

module.exports = { register, login, me };
