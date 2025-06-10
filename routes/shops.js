const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');

// HİZMETE GÖRE DÜKKAN LİSTELEME
router.get('/', async (req, res) => {
  try {
    const { service } = req.query;
    let filter = {};
    if (service) {
      filter.services = service;
    }
    const shops = await Shop.find(filter).select('name address phone services');
    res.json(shops);
  } catch (error) {
    res.status(500).json({ error: 'Dükkanlar alınırken bir hata oluştu' });
  }
});

module.exports = router; 