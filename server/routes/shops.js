// server/routes/shops.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// 1. GET ALL SHOPS (with category, search, sorting and approval filtering)
router.get('/', async (req, res) => {
  try {
    const { category, search, sort, lat, lng } = req.query;
    
    let sql = `
      SELECT s.*, c.name as category_name 
      FROM shops s 
      JOIN categories c ON s.category_id = c.id
      WHERE s.is_approved = 1 AND s.is_active = 1
    `;
    const params = [];

    // Filter by Category name or Category ID
    if (category && category !== 'All') {
      sql += ` AND (c.name = ? OR s.category_id = ?)`;
      params.push(category, category);
    }

    // Search query
    if (search) {
      sql += ` AND s.name LIKE ?`;
      params.push(`%${search}%`);
    }

    let shops = await db.query(sql, params);

    // Calculate simulated distances if coords provided
    const customerLat = parseFloat(lat) || 12.9716;
    const customerLng = parseFloat(lng) || 77.5946;

    shops = shops.map(shop => {
      let shopLat = parseFloat(shop.lat);
      let shopLng = parseFloat(shop.lng);

      // If the customer is far away from Bengaluru, dynamically shift mock shop coordinates
      // to center near the customer. This preserves realistic local pickup distances (1-5km) and prep times!
      const isFarAway = Math.abs(customerLat - 12.9716) > 1.5 || Math.abs(customerLng - 77.5946) > 1.5;
      if (isFarAway) {
        shopLat = customerLat + (shopLat - 12.9716);
        shopLng = customerLng + (shopLng - 77.5946);
      }

      // Simulated distance in km (simple calculation)
      const distance = Math.sqrt(Math.pow(shopLat - customerLat, 2) + Math.pow(shopLng - customerLng, 2)) * 100;
      const roundedDistance = Math.max(0.2, parseFloat(distance.toFixed(1)));
      
      // Estimated pickup time based on distance (e.g. 15 mins base + 5 mins/km)
      const pickupTime = Math.ceil(15 + roundedDistance * 5);

      return {
        ...shop,
        lat: shopLat,
        lng: shopLng,
        distance: roundedDistance,
        pickup_time: pickupTime
      };
    });

    // Sorting
    if (sort === 'Nearest') {
      shops.sort((a, b) => a.distance - b.distance);
    } else if (sort === 'Rating') {
      shops.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'Popular') {
      shops.sort((a, b) => b.total_reviews - a.total_reviews);
    }

    res.json(shops);
  } catch (error) {
    console.error('Fetch Shops Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 2. GET OWNER SHOPS
router.get('/owner', authenticateToken, async (req, res) => {
  try {
    const shops = await db.query('SELECT * FROM shops WHERE owner_id = ?', [req.user.id]);
    res.json(shops);
  } catch (error) {
    console.error('Fetch Owner Shops Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 3. CREATE SHOP (Shop owner registration)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, category_id, description, shop_photo, mobile, address, city, pincode, lat, lng, open_time, close_time, working_days } = req.body;

    if (!name || !category_id || !mobile || !address || !city || !pincode || !open_time || !close_time) {
      return res.status(400).json({ message: 'All essential shop fields are required.' });
    }

    // Insert Shop into DB (defaults to NOT APPROVED until Admin reviews)
    const result = await db.query(
      `INSERT INTO shops (owner_id, category_id, name, description, shop_photo, mobile, address, city, pincode, lat, lng, open_time, close_time, working_days, is_open, has_delivery, rating, total_reviews, is_approved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 4.0, 0, 0)`,
      [
        req.user.id,
        category_id,
        name,
        description,
        shop_photo || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
        mobile,
        address,
        city,
        pincode,
        lat || 12.9716,
        lng || 77.5946,
        open_time,
        close_time,
        working_days || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'
      ]
    );

    res.status(201).json({
      message: 'Shop registration submitted successfully. Pending Administrator approval!',
      shopId: result.insertId
    });

  } catch (error) {
    console.error('Create Shop Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 4. TOGGLE SHOP OPEN STATE
router.patch('/:id/toggle-open', authenticateToken, async (req, res) => {
  try {
    const { is_open } = req.body;
    const shopId = req.params.id;

    // Check shop ownership first
    const shops = await db.query('SELECT * FROM shops WHERE id = ?', [shopId]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const shop = shops[0];
    if (shop.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. You do not own this shop.' });
    }

    await db.query('UPDATE shops SET is_open = ? WHERE id = ?', [is_open ? 1 : 0, shopId]);
    res.json({ message: `Shop successfully ${is_open ? 'Opened' : 'Closed'}!`, is_open });

  } catch (error) {
    console.error('Toggle Shop State Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 5. UPDATE SHOP SETTINGS (Modify name, phone number, location, etc.)
router.patch('/:id/settings', authenticateToken, async (req, res) => {
  try {
    const shopId = req.params.id;
    const { name, description, shop_photo, mobile, address, city, pincode, lat, lng, open_time, close_time, working_days } = req.body;

    // Check shop ownership
    const shops = await db.query('SELECT * FROM shops WHERE id = ?', [shopId]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const shop = shops[0];
    if (shop.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized. You do not own this shop.' });
    }

    await db.query(
      `UPDATE shops SET 
        name = ?, 
        description = ?, 
        mobile = ?, 
        address = ?, 
        city = ?, 
        pincode = ?, 
        lat = ?, 
        lng = ?, 
        open_time = ?, 
        close_time = ?, 
        working_days = ? 
       WHERE id = ?`,
      [
        name || shop.name,
        description !== undefined ? description : shop.description,
        mobile || shop.mobile,
        address || shop.address,
        city || shop.city,
        pincode || shop.pincode,
        lat !== undefined ? parseFloat(lat) : shop.lat,
        lng !== undefined ? parseFloat(lng) : shop.lng,
        open_time || shop.open_time,
        close_time || shop.close_time,
        working_days || shop.working_days,
        shopId
      ]
    );

    res.json({ message: 'Shop settings modified successfully!' });

  } catch (error) {
    console.error('Update Shop Settings Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 6. UPDATE SHOP PHOTO
router.patch('/:id/photo', authenticateToken, async (req, res) => {
  try {
    const shopId = req.params.id;
    const { shop_photo } = req.body;

    if (!shop_photo) {
      return res.status(400).json({ message: 'Photo URL is required.' });
    }

    const shops = await db.query('SELECT * FROM shops WHERE id = ?', [shopId]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const shop = shops[0];
    if (shop.owner_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    await db.query('UPDATE shops SET shop_photo = ? WHERE id = ?', [shop_photo, shopId]);
    res.json({ message: 'Shop photo updated successfully!' });

  } catch (error) {
    console.error('Update Shop Photo Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 7. GET SHOP REVIEWS
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await db.query(
      `SELECT r.*, u.name as customer_name
       FROM reviews r
       JOIN users u ON r.customer_id = u.id
       WHERE r.shop_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(reviews);
  } catch (error) {
    console.error('Fetch Reviews Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 8. POST SHOP REVIEW
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    const shopId = req.params.id;

    if (!order_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid order_id and rating (1-5) are required.' });
    }

    // Check duplicate review
    const existing = await db.query(
      'SELECT * FROM reviews WHERE customer_id = ? AND order_id = ?',
      [req.user.id, order_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this order.' });
    }

    await db.query(
      `INSERT INTO reviews (customer_id, shop_id, order_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, shopId, order_id, rating, comment || null]
    );

    res.status(201).json({ message: 'Review submitted successfully!' });
  } catch (error) {
    console.error('Post Review Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

module.exports = router;
