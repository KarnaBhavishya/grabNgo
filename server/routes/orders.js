// server/routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// 1. PLACE ORDER
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { shop_id, items, manual_list, uploaded_image, subtotal, platform_fee, total_amount, payment_mode, special_note, delivery_mode, delivery_address_text } = req.body;

    if (!shop_id || (!items && !manual_list && !uploaded_image)) {
      return res.status(400).json({ message: 'Missing essential ordering details.' });
    }

    // Generate Unique Order Number
    const timestamp = Date.now().toString().slice(-8);
    const orderNumber = `GNG-${new Date().getFullYear()}${timestamp}`;

    // Payment status determines initial state based on mode
    const paymentStatus = payment_mode === 'online' ? 'paid' : 'pending';

    // Insert Order details
    const result = await db.query(
      `INSERT INTO orders (customer_id, shop_id, order_number, manual_list, uploaded_image, subtotal, platform_fee, total_amount, payment_mode, payment_status, order_status, special_note, estimated_time, delivery_mode, delivery_address_text)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'placed', ?, 25, ?, ?)`,
      [
        req.user.id,
        shop_id,
        orderNumber,
        manual_list || null,
        uploaded_image || null,
        subtotal || 0.00,
        platform_fee || 0.00,
        total_amount || 0.00,
        payment_mode,
        paymentStatus,
        special_note || null,
        delivery_mode || 'pickup',
        delivery_address_text || null
      ]
    );

    const orderId = result.insertId;

    // Add individual order items if available
    if (items && items.length > 0) {
      for (const item of items) {
        await db.query(
          `INSERT INTO order_items (order_id, product_id, item_name, price, quantity, subtotal)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id || item.id,
            item.name,
            item.price,
            item.quantity,
            item.price * item.quantity
          ]
        );
      }
    } else if (manual_list) {
      // Simulate adding a single placeholder manual list item if typed
      await db.query(
        `INSERT INTO order_items (order_id, product_id, item_name, price, quantity, subtotal)
         VALUES (?, NULL, 'Custom Grocery List Item', 0.00, 1, 0.00)`,
        [orderId]
      );
    }

    // Insert initial Order Placed step in Timeline
    await db.query(
      `INSERT INTO order_timeline (order_id, status, changed_by, note)
       VALUES (?, 'placed', ?, 'Your order has been placed successfully.')`,
      [orderId, req.user.id]
    );

    res.status(201).json({
      message: 'Order placed successfully!',
      orderId,
      orderNumber
    });

  } catch (error) {
    console.error('Place Order Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 2. GET CUSTOMER ORDERS
router.get('/customer', authenticateToken, async (req, res) => {
  try {
    const orders = await db.query(
      `SELECT o.*, s.name as shop_name, s.shop_photo, s.mobile as shop_mobile, s.address as shop_address
       FROM orders o
       JOIN shops s ON o.shop_id = s.id
       WHERE o.customer_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(orders);
  } catch (error) {
    console.error('Fetch Customer Orders Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 2b. GET CUSTOMER ORDERS FOR A SPECIFIC SHOP
router.get('/customer/shop/:shopId', authenticateToken, async (req, res) => {
  try {
    const orders = await db.query(
      `SELECT o.*, s.name as shop_name
       FROM orders o
       JOIN shops s ON o.shop_id = s.id
       WHERE o.customer_id = ? AND o.shop_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id, req.params.shopId]
    );
    res.json(orders);
  } catch (error) {
    console.error('Fetch Customer Shop Orders Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 3. GET OWNER ORDERS (All orders for shops belonging to owner)
router.get('/owner', authenticateToken, async (req, res) => {
  try {
    const orders = await db.query(
      `SELECT o.*, s.name as shop_name, u.name as customer_name, u.mobile as customer_mobile
       FROM orders o
       JOIN shops s ON o.shop_id = s.id
       JOIN users u ON o.customer_id = u.id
       WHERE s.owner_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    
    // Attach order items to each order
    const populatedOrders = [];
    for (const order of orders) {
      const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      populatedOrders.push({
        ...order,
        items
      });
    }

    res.json(populatedOrders);
  } catch (error) {
    console.error('Fetch Owner Orders Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 4. GET SINGLE ORDER DETAILS & TRACKING TIMELINE
router.get('/:id/tracking', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;

    const orders = await db.query(
      `SELECT o.*, s.name as shop_name, s.address as shop_address, s.mobile as shop_mobile, s.lat as shop_lat, s.lng as shop_lng
       FROM orders o
       JOIN shops s ON o.shop_id = s.id
       WHERE o.id = ?`,
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orders[0];

    // Ensure permissions
    if (order.customer_id !== req.user.id && req.user.role !== 'shopowner' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized access to this order.' });
    }

    const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    const timeline = await db.query(
      'SELECT * FROM order_timeline WHERE order_id = ? ORDER BY changed_at ASC',
      [orderId]
    );

    res.json({
      order,
      items,
      timeline
    });

  } catch (error) {
    console.error('Fetch Order Tracking Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 5. UPDATE ORDER STATUS (Shop Owner Flow: placed -> accepted -> packing -> ready -> picked)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, estimated_time, payment_status } = req.body;
    const orderId = req.params.id;

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const orders = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orders[0];

    // Verify ownership
    const shops = await db.query('SELECT * FROM shops WHERE id = ?', [order.shop_id]);
    if (shops.length === 0 || (shops[0].owner_id !== req.user.id && req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Unauthorized. You do not manage this order\'s shop.' });
    }

    // Update query variables
    let updateSql = 'UPDATE orders SET order_status = ?';
    const params = [status];

    if (estimated_time) {
      updateSql += ', estimated_time = ?';
      params.push(estimated_time);
    }

    if (payment_status) {
      updateSql += ', payment_status = ?';
      params.push(payment_status);
    }

    updateSql += ' WHERE id = ?';
    params.push(orderId);

    await db.query(updateSql, params);

    // Write log entry in Timeline
    let note = `Order status updated to ${status}.`;
    const isDelivery = order.delivery_mode === 'delivery';
    if (status === 'accepted') note = `Order accepted by ${shops[0].name}. Packing will begin shortly.`;
    if (status === 'packing') note = `The shop owner has started packing your fresh groceries!`;
    if (status === 'ready') {
      note = isDelivery 
        ? `Order is out for delivery! The rider is bringing your package.`
        : `Your package is ready! Grab & Go now from the shop.`;
    }
    if (status === 'picked') {
      note = isDelivery 
        ? `Order delivered safely to your address. Enjoy your groceries!`
        : `Order picked up and completed. Thank you!`;
    }
    if (status === 'cancelled') note = `Order cancelled.`;

    await db.query(
      `INSERT INTO order_timeline (order_id, status, changed_by, note)
       VALUES (?, ?, ?, ?)`,
      [orderId, status, req.user.id, note]
    );

    res.json({ message: 'Order status updated successfully!', status });

  } catch (error) {
    console.error('Update Order Status Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

// 6. CANCEL ORDER (Before Shop acceptance only)
router.patch('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;

    const orders = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const order = orders[0];

    // Check customer rights
    if (order.customer_id !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized.' });
    }

    // Order can ONLY be cancelled if status is 'placed'
    if (order.order_status !== 'placed') {
      return res.status(400).json({ message: 'Order cannot be cancelled after shop acceptance.' });
    }

    await db.query(`UPDATE orders SET order_status = 'cancelled', cancelled_by = 'customer' WHERE id = ?`, [orderId]);

    // Log timeline
    await db.query(
      `INSERT INTO order_timeline (order_id, status, changed_by, note)
       VALUES (?, 'cancelled', ?, 'Order cancelled by the customer.')`,
      [orderId, req.user.id]
    );

    res.json({ message: 'Order cancelled successfully.' });

  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ message: 'Internal Server Error.' });
  }
});

module.exports = router;
