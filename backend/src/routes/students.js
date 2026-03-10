// src/routes/students.js
// GET  /api/students              — list all students (admin only)
// PUT  /api/students/:id/hours    — update required hours (admin only)
// GET  /api/students/:id/profile  — get student profile including required_hours (student)

const express         = require('express');
const db              = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/students — admin only ───────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [students] = await db.query(
      `SELECT id, full_name, email, student_code, is_active, required_hours, registered_at
       FROM students ORDER BY full_name ASC`
    );
    res.json({ success: true, students });
  } catch (err) {
    console.error('Fetch students error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── PUT /api/students/:id/hours — admin sets required hours ──
router.put('/:id/hours', verifyToken, async (req, res) => {
  const { id }             = req.params;
  const { required_hours } = req.body;

  if (required_hours === undefined || required_hours === null) {
    return res.status(400).json({ success: false, message: 'required_hours is required.' });
  }

  const hours = parseFloat(required_hours);
  if (isNaN(hours) || hours < 0) {
    return res.status(400).json({ success: false, message: 'required_hours must be a positive number.' });
  }

  try {
    await db.query(
      `UPDATE students SET required_hours = ? WHERE id = ?`,
      [hours, id]
    );
    res.json({ success: true, message: 'Required hours updated.', required_hours: hours });
  } catch (err) {
    console.error('Update required hours error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ── GET /api/students/:id/profile — student reads own profile ──
router.get('/:id/profile', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT id, full_name, email, student_code, required_hours, registered_at
       FROM students WHERE id = ? AND is_active = 1 LIMIT 1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    res.json({ success: true, student: rows[0] });
  } catch (err) {
    console.error('Fetch profile error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;