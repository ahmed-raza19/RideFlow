// server.js — RideFlow REST API entry point
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { globalErrorHandler } = require('./utils/helpers');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'OK', app: 'RideFlow API', time: new Date().toISOString() })
);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/admin',  require('./routes/admin'));
app.use('/api/rider',  require('./routes/rider'));
app.use('/api/driver', require('./routes/driver'));

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, error: 'Route not found.' })
);

// ─── Global Error Handler ─────────────────────────────────────
app.use(globalErrorHandler);

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀  RideFlow API running on http://localhost:${PORT}`);
  console.log(`    ENV: ${process.env.NODE_ENV || 'development'}`);
});
