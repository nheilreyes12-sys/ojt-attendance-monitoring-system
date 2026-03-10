// src/routes/network.js
// GET /api/network/check
// Returns the client's real IP address as seen by the server.
// This bypasses browser WebRTC restrictions that caused null IPs.

const express = require('express');
const router  = express.Router();

router.get('/check', (req, res) => {
  // Get real IP — works behind proxies too
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '';

  // Strip IPv6 prefix if present (e.g. "::ffff:192.168.0.127" → "192.168.0.127")
  const cleanIP = ip.replace(/^::ffff:/, '');

  res.json({ success: true, ip: cleanIP });
});

module.exports = router;