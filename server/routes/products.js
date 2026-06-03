// server/routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// 1. GET ALL PRODUCTS FOR A SPECIFIC SHOP (with internal item search)
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { search } = req.query;
    const shopId = req.params.shopId;

    let sql = 'SELECT * FROM products WHERE shop_id = ? AND is_available = 1';
    const params = [shopId];

    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const products = await db.query(sql, params);
    res.json(products);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 2. ADD PRODUCT TO SHOP (Shopowner CRUD)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { shop_id, name, description, price, stock, unit, image } = req.body;

    if (!shop_id || !name || !price) {
      return res.status(400).json({ message: 'Shop ID, Name, and Price are required.' });
    }

    // Verify ownership
    const shops = await db.query('SELECT * FROM shops WHERE id = ?', [shop_id]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found.' });
    }
    if (shops[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. You do not own this shop.' });
    }

    const result = await db.query(
      'INSERT INTO products (shop_id, name, description, price, stock, unit, image, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [shop_id, name, description, price, stock || 0, unit || 'piece', image]
    );

    res.status(201).json({
      message: 'Product added successfully!',
      productId: result.insertId
    });

  } catch (error) {
    console.error('Add Product Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 3. DELETE PRODUCT (Shopowner CRUD)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;

    // Fetch product to verify ownership
    const products = await db.query('SELECT * FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = products[0];
    const shops = await db.query('SELECT * FROM shops WHERE id = ?', [product.shop_id]);
    
    if (shops.length === 0 || shops[0].owner_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized. You do not own the shop housing this product.' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [productId]);
    res.json({ message: 'Product deleted successfully.' });

  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

module.exports = router;
