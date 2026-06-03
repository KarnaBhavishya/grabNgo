// server/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Protect all admin routes with auth and admin role check
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// 1. GET SYSTEM ANALYTICS & STATS
router.get('/stats', async (req, res) => {
  try {
    const totalShops = await db.query("SELECT COUNT(*) as count FROM shops");
    const pendingShops = await db.query("SELECT COUNT(*) as count FROM shops WHERE is_approved = 0");
    const totalUsers = await db.query("SELECT COUNT(*) as count FROM users");
    const totalOrders = await db.query("SELECT COUNT(*) as count FROM orders");
    const salesSum = await db.query("SELECT SUM(total_amount) as total_sales FROM orders WHERE payment_status = 'paid'");

    res.json({
      totalShops: totalShops[0].count,
      pendingShops: pendingShops[0].count,
      totalUsers: totalUsers[0].count,
      totalOrders: totalOrders[0].count,
      totalSales: parseFloat(salesSum[0].total_sales || 0).toFixed(2)
    });
  } catch (error) {
    console.error('Fetch Admin Stats Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 2. GET PENDING SHOPS
router.get('/pending-shops', async (req, res) => {
  try {
    const shops = await db.query(
      `SELECT s.*, u.name as owner_name, u.email as owner_email, c.name as category_name
       FROM shops s
       JOIN users u ON s.owner_id = u.id
       JOIN categories c ON s.category_id = c.id
       WHERE s.is_approved = 0`
    );
    res.json(shops);
  } catch (error) {
    console.error('Fetch Pending Shops Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 3. APPROVE / REJECT SHOP
router.patch('/shops/:id/approve', async (req, res) => {
  try {
    const { approve } = req.body; // boolean
    const shopId = req.params.id;

    await db.query('UPDATE shops SET is_approved = ? WHERE id = ?', [approve ? 1 : 0, shopId]);
    res.json({ message: `Shop has been ${approve ? 'Approved' : 'Rejected'} successfully.` });
  } catch (error) {
    console.error('Approve Shop Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 4. GET ALL USERS (CRUD)
router.get('/users', async (req, res) => {
  try {
    const users = await db.query('SELECT * FROM users');
    // Strip sensitive password field from response
    const safeUsers = users.map(({ password, ...rest }) => rest);
    res.json(safeUsers);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 5. DELETE USER (CRUD)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account!' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'User account has been deleted successfully.' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 6. MANAGE CATEGORIES (ADD NEW)
router.post('/categories', async (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    await db.query('INSERT INTO categories (name, icon, is_active) VALUES (?, ?, 1)', [name, icon || '📦']);
    res.status(201).json({ message: 'Category created successfully!' });
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 7. UPDATE USER (CRUD)
router.patch('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, mobile, role, is_active } = req.body;

    if (!name || !email || !mobile || !role) {
      return res.status(400).json({ message: 'Name, email, mobile, and role are required.' });
    }

    await db.query(
      'UPDATE users SET name = ?, email = ?, mobile = ?, role = ?, is_active = ? WHERE id = ?',
      [name, email, mobile, role, is_active !== undefined ? parseInt(is_active) : 1, userId]
    );

    res.json({ message: 'User account details modified successfully.' });
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 8. GET ALL SHOPS WITH OWNER DETAILS (Admin shops management)
router.get('/shops', async (req, res) => {
  try {
    const shops = await db.query(
      `SELECT s.*, u.name as owner_name, u.email as owner_email, u.mobile as owner_mobile, c.name as category_name
       FROM shops s
       JOIN users u ON s.owner_id = u.id
       JOIN categories c ON s.category_id = c.id`
    );
    res.json(shops);
  } catch (error) {
    console.error('Fetch All Shops Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 9. UPDATE ANY SHOP (Admin full edit)
router.patch('/shops/:id', async (req, res) => {
  try {
    const shopId = req.params.id;
    const { name, description, mobile, address, city, pincode, lat, lng, open_time, close_time, working_days, is_approved, is_active } = req.body;

    const shops = await db.query('SELECT * FROM shops WHERE id = ?', [shopId]);
    if (shops.length === 0) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    const shop = shops[0];
    await db.query(
      `UPDATE shops SET 
        name = ?, description = ?, mobile = ?, address = ?, city = ?, pincode = ?, 
        lat = ?, lng = ?, open_time = ?, close_time = ?, working_days = ?,
        is_approved = ?, is_active = ?
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
        is_approved !== undefined ? parseInt(is_approved) : shop.is_approved,
        is_active !== undefined ? parseInt(is_active) : shop.is_active,
        shopId
      ]
    );

    res.json({ message: 'Shop details modified successfully by Admin!' });
  } catch (error) {
    console.error('Admin Update Shop Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

module.exports = router;
