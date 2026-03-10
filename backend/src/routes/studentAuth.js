// src/routes/studentAuth.js
// POST /api/student/register — self-registration, returns 5-digit code
// POST /api/student/login    — login with 5-digit code + password
//                              token expires at midnight — forces re-login each day

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

const router = express.Router();

// -------------------------------------------------------
// Helper: Generate a unique 5-digit code
// -------------------------------------------------------
const generateUniqueCode = async () => {
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = String(Math.floor(10000 + Math.random() * 90000));
    const [existing] = await db.query(
      'SELECT id FROM students WHERE student_code = ? LIMIT 1',
      [code]
    );
    if (existing.length === 0) isUnique = true;
  }
  return code;
};

// -------------------------------------------------------
// Helper: Seconds remaining until midnight (Philippine time)
// Student token will expire at 11:59:59 PM of the current day
// so they are forced to re-login every morning
// -------------------------------------------------------
const secondsUntilMidnight = () => {
  const now      = new Date();
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);
  const diff = Math.floor((midnight - now) / 1000);
  // Minimum 60 seconds to avoid issuing already-expired tokens
  return Math.max(diff, 60);
};

// -------------------------------------------------------
// POST /api/student/register
// -------------------------------------------------------
router.post('/register', async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Full name, email, and password are required.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters.'
    });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM students WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login instead.'
      });
    }

    const student_code   = await generateUniqueCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO students (full_name, email, student_code, password) VALUES (?, ?, ?, ?)`,
      [full_name.trim(), email.toLowerCase().trim(), student_code, hashedPassword]
    );

    res.status(201).json({
      success: true,
      message: 'Enrollment successful!',
      student_code,
      student: {
        id:           result.insertId,
        full_name:    full_name.trim(),
        email:        email.toLowerCase().trim(),
        student_code,
      }
    });

  } catch (err) {
    console.error('Student register error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// -------------------------------------------------------
// POST /api/student/login
// Token expires at midnight — forces re-login each day
// -------------------------------------------------------
router.post('/login', async (req, res) => {
  const { student_code, password } = req.body;

  if (!student_code || !password) {
    return res.status(400).json({
      success: false,
      message: 'Student code and password are required.'
    });
  }

  if (!/^\d{5}$/.test(student_code)) {
    return res.status(400).json({
      success: false,
      message: 'Student code must be a 5-digit number.'
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT * FROM students WHERE student_code = ? AND is_active = 1 LIMIT 1`,
      [student_code]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student code or password.'
      });
    }

    const student  = rows[0];
    const isMatch  = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student code or password.'
      });
    }

    // Token expires at 11:59:59 PM tonight
    // Student must re-login tomorrow morning
    const expiry = secondsUntilMidnight();

    const token = jwt.sign(
      {
        id:           student.id,
        email:        student.email,
        full_name:    student.full_name,
        student_code: student.student_code,
        role:         'student'
      },
      process.env.JWT_SECRET,
      { expiresIn: expiry }
    );

    // Tell the frontend exactly when the token will expire
    // so it can schedule an auto-logout
    const expiresAt = new Date();
    expiresAt.setHours(23, 59, 59, 999);

    res.json({
      success:   true,
      message:   'Login successful.',
      token,
      expiresAt: expiresAt.toISOString(),
      student: {
        id:           student.id,
        full_name:    student.full_name,
        email:        student.email,
        student_code: student.student_code,
      }
    });

  } catch (err) {
    console.error('Student login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;