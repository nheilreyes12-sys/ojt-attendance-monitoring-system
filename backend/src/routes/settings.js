// src/routes/settings.js
// GET  /api/settings/ssid        — get current office SSID
// PUT  /api/settings/ssid        — update office SSID (admin only)

const express      = require('express');
const db           = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings/ssid — public (students need this on load)
router.get('/ssid', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT value FROM office_settings WHERE setting_key = 'office_ssid' LIMIT 1`
    );
    res.json({ 
      success: true, 
      ssid: rows[0]?.value || 'Steerhub First Floor' 
    });
  } catch (err) {
    console.error('Get SSID error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/settings/ssid — admin only
router.put('/ssid', verifyToken, async (req, res) => {
  const { ssid } = req.body;
  if (!ssid?.trim()) {
    return res.status(400).json({ success: false, message: 'SSID is required.' });
  }

  try {
    await db.query(
      `UPDATE office_settings SET value = ? WHERE setting_key = 'office_ssid'`,
      [ssid.trim()]
    );
    res.json({ success: true, message: 'SSID updated successfully.', ssid: ssid.trim() });
  } catch (err) {
    console.error('Update SSID error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;