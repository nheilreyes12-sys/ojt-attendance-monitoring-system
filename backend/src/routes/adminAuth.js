// src/routes/adminAuth.js
// POST /api/admin/login — replaces Supabase Auth

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email and password are required.' 
    });
  }

  try {
    // Find admin by email
    const [rows] = await db.query(
      'SELECT * FROM admin_users WHERE email = ? LIMIT 1',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    const admin = rows[0];

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      admin: {
        id:    admin.id,
        email: admin.email,
      }
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;