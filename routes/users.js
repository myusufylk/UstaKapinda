const express = require('express');
const router = express.Router();

// Basit bir kullanıcı listesi endpoint'i
router.get('/', (req, res) => {
  res.json({ message: 'Kullanıcılar endpointi çalışıyor.' });
});

module.exports = router; 