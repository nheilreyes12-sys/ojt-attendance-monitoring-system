// server.js — Main entry point
require('dotenv').config();

const express = require('express');
const cors    = require('cors');

// Routes
const adminAuthRoutes   = require('./src/routes/adminAuth');
const studentAuthRoutes = require('./src/routes/studentAuth');
const attendanceRoutes  = require('./src/routes/attendance');
const settingsRoutes    = require('./src/routes/settings');
const studentsRoutes    = require('./src/routes/students');
const networkRoutes     = require('./src/routes/network');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Trust proxy ─────────────────────────────────────────
app.set('trust proxy', true);

// ── CORS — allow both localhost and network IP ──────────
// This fixes "Failed to fetch" on phones accessing via 192.168.0.x
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  `http://${process.env.HOST_IP || '192.168.0.127'}:3000`,
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Also allow any 192.168.0.x origin dynamically
    if (/^http:\/\/192\.168\.0\.\d+:3000$/.test(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

// ── Routes ──────────────────────────────────────────────
app.use('/api/admin',      adminAuthRoutes);
app.use('/api/student',    studentAuthRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/students',   studentsRoutes);
app.use('/api/network',    networkRoutes);

// ── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OJT Backend is running ✅' });
});

// ── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// ── Start Server — listen on all interfaces ─────────────
// '0.0.0.0' allows phones on the same WiFi to reach the backend
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 OJT Backend running on http://localhost:${PORT}`);
  console.log(`📱 Network access: http://192.168.0.127:${PORT}`);
});