// server/routes/addresses.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// 1. GET ALL USER ADDRESSES
router.get('/', async (req, res) => {
  try {
    const addresses = await db.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(addresses);
  } catch (error) {
    console.error('Fetch Addresses Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 2. SAVE NEW ADDRESS
router.post('/', async (req, res) => {
  try {
    const { label, address, city, pincode, lat, lng, taker_name, taker_mobile } = req.body;

    if (!label || !address || !city || !pincode) {
      return res.status(400).json({ message: 'Label, address, city, and pincode are required.' });
    }

    const result = await db.query(
      `INSERT INTO addresses (user_id, label, address, city, pincode, lat, lng, taker_name, taker_mobile, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        req.user.id,
        label,
        address,
        city,
        pincode,
        lat !== undefined ? parseFloat(lat) : 12.9716,
        lng !== undefined ? parseFloat(lng) : 77.5946,
        taker_name || null,
        taker_mobile || null
      ]
    );

    res.status(201).json({
      message: 'Address saved successfully!',
      addressId: result.insertId
    });
  } catch (error) {
    console.error('Save Address Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 3. DELETE ADDRESS
router.delete('/:id', async (req, res) => {
  try {
    const addressId = req.params.id;
    await db.query(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.id]
    );
    res.json({ message: 'Address removed successfully.' });
  } catch (error) {
    console.error('Delete Address Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

module.exports = router;
