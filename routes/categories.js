const express = require('express');
const router = express.Router();

// Basit bir kategori listesi endpoint'i
router.get('/', (req, res) => {
  res.json({ message: 'Kategoriler endpointi çalışıyor.' });
});

module.exports = router; 