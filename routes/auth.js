const express = require('express');
const router = express.Router();

// Basit bir test endpointi
router.get('/test', (req, res) => {
  res.json({ msg: 'Auth route çalışıyor!' });
});

module.exports = router; 