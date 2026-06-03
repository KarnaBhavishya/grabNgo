// server/config/db.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const mockFilePath = path.join(__dirname, 'mock_db_store.json');

let pool = null;
let isMock = false;

// Mock database storage for seamless fallback testing
const mockDB = {
  users: [
    { id: 1, name: 'Koushik', email: 'saikoushik510@gmail.com', mobile: '9999999999', password: '', role: 'admin', is_verified: 1, is_active: 1 },
    { id: 2, name: 'Fresh Mart Owner', email: 'owner@grabngo.com', mobile: '8888888888', password: '', role: 'shopowner', is_verified: 1, is_active: 1 },
    { id: 3, name: 'John Customer', email: 'customer@grabngo.com', mobile: '7777777777', password: '', role: 'customer', is_verified: 1, is_active: 1 }
  ],
  addresses: [
    { id: 1, user_id: 3, label: 'Home', address: '123 Main St, Tech City', city: 'Tech City', pincode: '560001', lat: 12.9716, lng: 77.5946, taker_name: 'John Customer', taker_mobile: '7777777777', is_default: 1 }
  ],
  categories: [
    { id: 1, name: 'Grocery', icon: '🛒', is_active: 1 },
    { id: 2, name: 'Bakery', icon: '🍞', is_active: 1 },
    { id: 3, name: 'Pharmacy', icon: '💊', is_active: 1 },
    { id: 4, name: 'Vegetables', icon: '🥦', is_active: 1 },
    { id: 5, name: 'Dairy', icon: '🥛', is_active: 1 },
    { id: 6, name: 'Meat', icon: '🥩', is_active: 1 },
    { id: 7, name: 'General', icon: '🏪', is_active: 1 },
    { id: 8, name: 'Sweets', icon: '🍬', is_active: 1 },
    { id: 9, name: 'Stationery', icon: '📝', is_active: 1 },
    { id: 10, name: 'Electronics', icon: '🔌', is_active: 1 },
    { id: 11, name: 'Pet Store', icon: '🐾', is_active: 1 },
    { id: 12, name: 'Fruits', icon: '🍎', is_active: 1 },
    { id: 13, name: 'Beverages', icon: '🥤', is_active: 1 }
  ],
  shops: [
    {
      id: 1,
      owner_id: 2,
      category_id: 1,
      name: 'Fresh Mart Grocery',
      description: 'Your one-stop organic grocery and household shop.',
      shop_photo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
      mobile: '8888888888',
      address: '22 Tech Park Road, Sector 4',
      city: 'Bengaluru',
      pincode: '560001',
      lat: 12.9722,
      lng: 77.5950,
      open_time: '09:00:00',
      close_time: '21:00:00',
      working_days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      is_open: 1,
      has_delivery: 1,
      payment_online: 1,
      payment_cash: 1,
      rating: 4.5,
      total_reviews: 12,
      is_approved: 1,
      is_active: 1
    },
    {
      id: 2,
      owner_id: 2,
      category_id: 2,
      name: 'Golden Crust Bakery',
      description: 'Freshly baked breads, pastries, and custom cakes.',
      shop_photo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&q=80',
      mobile: '8888888888',
      address: '15 High Street, Malleswaram',
      city: 'Bengaluru',
      pincode: '560003',
      lat: 12.9750,
      lng: 77.5900,
      open_time: '08:00:00',
      close_time: '22:00:00',
      working_days: 'Mon,Tue,Wed,Thu,Fri,Sat',
      is_open: 1,
      has_delivery: 0,
      payment_online: 1,
      payment_cash: 1,
      rating: 4.8,
      total_reviews: 28,
      is_approved: 1,
      is_active: 1
    },
    {
      id: 3,
      owner_id: 2,
      category_id: 3,
      name: 'Wellness Pharmacy',
      description: 'Prescription medicines and general healthcare items.',
      shop_photo: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=500&q=80',
      mobile: '8888888888',
      address: '77 Clinic Lane, Indiranagar',
      city: 'Bengaluru',
      pincode: '560038',
      lat: 12.9600,
      lng: 77.6400,
      open_time: '24 Hours',
      close_time: '24 Hours',
      working_days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      is_open: 1,
      has_delivery: 1,
      payment_online: 1,
      payment_cash: 1,
      rating: 4.2,
      total_reviews: 8,
      is_approved: 0, // Pending Admin Approval demo!
      is_active: 1
    }
  ],
  products: [
    { id: 1, shop_id: 1, name: 'Organic Fresh Bananas', description: 'Sweet local organic yellow bananas, farm fresh.', price: 49.00, stock: 150, unit: 'kg', image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80', is_available: 1 },
    { id: 2, shop_id: 1, name: 'Basmati Rice Premium', description: 'Long grain, highly aromatic aged basmati rice.', price: 120.00, stock: 45, unit: 'kg', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80', is_available: 1 },
    { id: 3, shop_id: 1, name: 'Farm Eggs Box', description: 'Pack of 12 clean farm-fresh protein-rich brown eggs.', price: 80.00, stock: 30, unit: 'piece', image: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&q=80', is_available: 1 },
    { id: 4, shop_id: 1, name: 'Cold Pressed Coconut Oil', description: '100% natural cooking oil, 1 litre bottle.', price: 240.00, stock: 20, unit: 'litre', image: 'https://images.unsplash.com/photo-1614749514827-7f55b91a1fb3?w=300&q=80', is_available: 1 },
    
    { id: 5, shop_id: 2, name: 'Fresh Sourdough Bread', description: 'Classic crusty artisan sourdough made daily.', price: 90.00, stock: 15, unit: 'piece', image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&q=80', is_available: 1 },
    { id: 6, shop_id: 2, name: 'Chocolate Ganache Pastry', description: 'Rich Belgian chocolate mousse layers.', price: 75.00, stock: 8, unit: 'piece', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80', is_available: 1 }
  ],
  orders: [],
  order_items: [],
  order_timeline: [],
  payments: [],
  reviews: [],
  notifications: [],
  otps: []
};

const saveMockDB = () => {
  try {
    fs.writeFileSync(mockFilePath, JSON.stringify(mockDB, null, 2), 'utf8');
  } catch (err) {
    console.error('❌ Failed to save mock DB store:', err.message);
  }
};

const loadMockDB = () => {
  try {
    if (fs.existsSync(mockFilePath)) {
      const data = fs.readFileSync(mockFilePath, 'utf8');
      const parsed = JSON.parse(data);
      mockDB.users = parsed.users || mockDB.users;
      mockDB.addresses = parsed.addresses || mockDB.addresses;
      mockDB.categories = parsed.categories || mockDB.categories;
      mockDB.shops = parsed.shops || mockDB.shops;
      mockDB.products = parsed.products || mockDB.products;
      mockDB.orders = parsed.orders || [];
      mockDB.order_items = parsed.order_items || [];
      mockDB.order_timeline = parsed.order_timeline || [];
      mockDB.payments = parsed.payments || [];
      mockDB.reviews = parsed.reviews || [];
      mockDB.notifications = parsed.notifications || [];
      mockDB.otps = parsed.otps || [];
      console.log('💾 Loaded persistent mock database from mock_db_store.json!');
    }
    // Always ensure Admin credentials are updated and seeded
    initMockPasswords();
  } catch (err) {
    console.error('❌ Failed to load mock DB store:', err.message);
    initMockPasswords();
  }
};

// Seed default hashes for mock users
const initMockPasswords = async () => {
  const salt = await bcrypt.genSalt(10);
  const defaultHash = await bcrypt.hash('Password123', salt);
  const adminHash = await bcrypt.hash('Koushik@123', salt);
  
  // Force update mock admin ID 1 to match exact user credentials
  const adminUser = mockDB.users.find(u => u.id === 1 || u.role === 'admin');
  if (adminUser) {
    adminUser.name = 'Koushik';
    adminUser.email = 'saikoushik510@gmail.com';
    adminUser.password = adminHash;
  }

  mockDB.users.forEach(u => {
    if (!u.password) {
      u.password = u.role === 'admin' ? adminHash : defaultHash;
    }
  });
  saveMockDB();
};

loadMockDB();

// The main DB connection query function
const query = async (sql, params = []) => {
  if (isMock) {
    return runMockQuery(sql, params);
  }

  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('❌ Database Query Error:', error.message);
    throw error;
  }
};

// Simple Mock SQL simulation for runtime stability without MySQL
const runMockQuery = async (sql, params) => {
  const cleanSql = sql.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. USER AUTH & DETAILS MOCKS
  if (cleanSql.includes('select * from users where email = ?')) {
    const user = mockDB.users.find(u => u.email.toLowerCase() === params[0].toLowerCase());
    return user ? [user] : [];
  }
  if (cleanSql.includes('select * from users where id = ?')) {
    const user = mockDB.users.find(u => u.id === parseInt(params[0]));
    return user ? [user] : [];
  }
  if (cleanSql.includes('insert into users')) {
    // INSERT INTO users (name, email, mobile, password, role) VALUES (?, ?, ?, ?, ?)
    const newUser = {
      id: mockDB.users.length + 1,
      name: params[0],
      email: params[1],
      mobile: params[2],
      password: params[3],
      role: params[4] || 'customer',
      is_verified: 1,
      is_active: 1,
      created_at: new Date()
    };
    mockDB.users.push(newUser);
    saveMockDB();
    return { insertId: newUser.id, affectedRows: 1 };
  }
  if (cleanSql.includes('select * from users') && !cleanSql.includes('where')) {
    return mockDB.users;
  }
  if (cleanSql.includes('update users set') && cleanSql.includes('id = ?')) {
    const userId = parseInt(params[params.length - 1]);
    const user = mockDB.users.find(u => u.id === userId);
    if (user) {
      if (params[0] !== undefined) user.name = params[0];
      if (params[1] !== undefined) user.email = params[1];
      if (params[2] !== undefined) user.mobile = params[2];
      if (params[3] !== undefined) user.role = params[3];
      if (params[4] !== undefined) user.is_active = parseInt(params[4]);
      saveMockDB();
    }
    return { affectedRows: 1 };
  }
  if (cleanSql.includes('delete from users where id = ?')) {
    const id = parseInt(params[0]);
    mockDB.users = mockDB.users.filter(u => u.id !== id);
    saveMockDB();
    return { affectedRows: 1 };
  }

  // ADDRESSES MOCKS
  if (cleanSql.includes('select * from addresses where user_id = ?')) {
    return mockDB.addresses.filter(a => a.user_id === parseInt(params[0]));
  }
  if (cleanSql.includes('insert into addresses')) {
    // user_id, label, address, city, pincode, lat, lng, taker_name, taker_mobile, is_default
    const newAddress = {
      id: mockDB.addresses.length + 1,
      user_id: parseInt(params[0]),
      label: params[1],
      address: params[2],
      city: params[3],
      pincode: params[4],
      lat: parseFloat(params[5]),
      lng: parseFloat(params[6]),
      taker_name: params[7],
      taker_mobile: params[8],
      is_default: params[9] !== undefined ? parseInt(params[9]) : 0,
      created_at: new Date()
    };
    mockDB.addresses.push(newAddress);
    saveMockDB();
    return { insertId: newAddress.id, affectedRows: 1 };
  }
  if (cleanSql.includes('delete from addresses where id = ? and user_id = ?')) {
    const id = parseInt(params[0]);
    const userId = parseInt(params[1]);
    mockDB.addresses = mockDB.addresses.filter(a => !(a.id === id && a.user_id === userId));
    saveMockDB();
    return { affectedRows: 1 };
  }

  // 2. CATEGORIES MOCKS
  if (cleanSql.includes('select * from categories')) {
    return mockDB.categories.filter(c => c.is_active);
  }

  // 3. SHOPS MOCKS
  // Admin: all shops with owner + category details
  if (cleanSql.includes('owner_name') && cleanSql.includes('owner_email') && cleanSql.includes('from shops')) {
    return mockDB.shops.map(s => {
      const cat = mockDB.categories.find(c => c.id === s.category_id);
      const owner = mockDB.users.find(u => u.id === s.owner_id);
      return {
        ...s,
        category_name: cat ? cat.name : 'General',
        owner_name: owner ? owner.name : 'Unknown',
        owner_email: owner ? owner.email : 'Unknown',
        owner_mobile: owner ? owner.mobile : 'Unknown'
      };
    });
  }
  if (cleanSql.includes('select s.*, c.name as category_name')) {
    // Fetch shops with category details
    return mockDB.shops.map(s => {
      const cat = mockDB.categories.find(c => c.id === s.category_id);
      return { ...s, category_name: cat ? cat.name : 'General' };
    });
  }
  if (cleanSql.includes('select * from shops where owner_id = ?')) {
    return mockDB.shops.filter(s => s.owner_id === parseInt(params[0]));
  }
  if (cleanSql.includes('select * from shops where id = ?')) {
    const shop = mockDB.shops.find(s => s.id === parseInt(params[0]));
    return shop ? [shop] : [];
  }
  if (cleanSql.includes('update shops set is_open = ? where id = ?')) {
    const shop = mockDB.shops.find(s => s.id === parseInt(params[1]));
    if (shop) shop.is_open = parseInt(params[0]);
    saveMockDB();
    return { affectedRows: 1 };
  }
  // Admin full shop update (includes is_approved + is_active)
  if (cleanSql.includes('update shops set') && cleanSql.includes('is_approved = ?') && cleanSql.includes('is_active = ?') && cleanSql.includes('where id = ?')) {
    const shopId = parseInt(params[params.length - 1]);
    const shop = mockDB.shops.find(s => s.id === shopId);
    if (shop) {
      if (params[0] !== undefined) shop.name = params[0];
      if (params[1] !== undefined) shop.description = params[1];
      if (params[2] !== undefined) shop.mobile = params[2];
      if (params[3] !== undefined) shop.address = params[3];
      if (params[4] !== undefined) shop.city = params[4];
      if (params[5] !== undefined) shop.pincode = params[5];
      if (params[6] !== undefined) shop.lat = parseFloat(params[6]);
      if (params[7] !== undefined) shop.lng = parseFloat(params[7]);
      if (params[8] !== undefined) shop.open_time = params[8];
      if (params[9] !== undefined) shop.close_time = params[9];
      if (params[10] !== undefined) shop.working_days = params[10];
      if (params[11] !== undefined) shop.is_approved = parseInt(params[11]);
      if (params[12] !== undefined) shop.is_active = parseInt(params[12]);
      saveMockDB();
    }
    return { affectedRows: 1 };
  }
  // Owner shop settings update (no is_approved/is_active)
  if (cleanSql.includes('update shops set name = ?, description = ?') || (cleanSql.includes('update shops set') && cleanSql.includes('mobile = ?') && cleanSql.includes('id = ?'))) {
    const shopId = parseInt(params[params.length - 1]);
    const shop = mockDB.shops.find(s => s.id === shopId);
    if (shop) {
      if (params[0] !== undefined) shop.name = params[0];
      if (params[1] !== undefined) shop.description = params[1];
      if (params[2] !== undefined) shop.mobile = params[2];
      if (params[3] !== undefined) shop.address = params[3];
      if (params[4] !== undefined) shop.city = params[4];
      if (params[5] !== undefined) shop.pincode = params[5];
      if (params[6] !== undefined) shop.lat = parseFloat(params[6]);
      if (params[7] !== undefined) shop.lng = parseFloat(params[7]);
      if (params[8] !== undefined) shop.open_time = params[8];
      if (params[9] !== undefined) shop.close_time = params[9];
      if (params[10] !== undefined) shop.working_days = params[10];
      saveMockDB();
    }
    return { affectedRows: 1 };
  }
  if (cleanSql.includes('insert into shops')) {
    // owner_id, category_id, name, description, shop_photo, mobile, address, city, pincode, lat, lng, open_time, close_time, working_days
    const newShop = {
      id: mockDB.shops.length + 1,
      owner_id: parseInt(params[0]),
      category_id: parseInt(params[1]),
      name: params[2],
      description: params[3],
      shop_photo: params[4] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80',
      mobile: params[5],
      address: params[6],
      city: params[7],
      pincode: params[8],
      lat: parseFloat(params[9]),
      lng: parseFloat(params[10]),
      open_time: params[11],
      close_time: params[12],
      working_days: params[13] || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      is_open: 1,
      has_delivery: 0,
      payment_online: 1,
      payment_cash: 1,
      rating: 4.0,
      total_reviews: 0,
      is_approved: 0, // Pending approved
      is_active: 1
    };
    mockDB.shops.push(newShop);
    saveMockDB();
    return { insertId: newShop.id, affectedRows: 1 };
  }
  if (cleanSql.includes('update shops set is_approved = ?')) {
    // approve or reject shops
    const id = parseInt(params[1]);
    const shop = mockDB.shops.find(s => s.id === id);
    if (shop) shop.is_approved = parseInt(params[0]);
    saveMockDB();
    return { affectedRows: 1 };
  }

  // 4. PRODUCTS MOCKS
  if (cleanSql.includes('select * from products where shop_id = ?')) {
    return mockDB.products.filter(p => p.shop_id === parseInt(params[0]));
  }
  if (cleanSql.includes('insert into products')) {
    // shop_id, name, description, price, stock, unit, image
    const newProduct = {
      id: mockDB.products.length + 1,
      shop_id: parseInt(params[0]),
      name: params[1],
      description: params[2],
      price: parseFloat(params[3]),
      stock: parseInt(params[4]),
      unit: params[5],
      image: params[6] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
      is_available: 1
    };
    mockDB.products.push(newProduct);
    saveMockDB();
    return { insertId: newProduct.id, affectedRows: 1 };
  }
  if (cleanSql.includes('delete from products where id = ?')) {
    const id = parseInt(params[0]);
    mockDB.products = mockDB.products.filter(p => p.id !== id);
    saveMockDB();
    return { affectedRows: 1 };
  }

  // 5. ORDERS & TRACKING MOCKS
  if (cleanSql.includes('insert into orders')) {
    // customer_id, shop_id, order_number, manual_list, uploaded_image, subtotal, platform_fee, total_amount, payment_mode, payment_status, special_note, delivery_mode, delivery_address_text
    const newOrder = {
      id: mockDB.orders.length + 1,
      customer_id: parseInt(params[0]),
      shop_id: parseInt(params[1]),
      order_number: params[2],
      manual_list: params[3],
      uploaded_image: params[4],
      subtotal: parseFloat(params[5]),
      platform_fee: parseFloat(params[6]),
      total_amount: parseFloat(params[7]),
      payment_mode: params[8],
      payment_status: params[9] || 'pending',
      order_status: 'placed',
      special_note: params[10],
      estimated_time: 25,
      delivery_mode: params[11] || 'pickup',
      delivery_address_text: params[12] || null,
      created_at: new Date()
    };
    mockDB.orders.push(newOrder);

    // Seed initial placed event to timeline
    mockDB.order_timeline.push({
      id: mockDB.order_timeline.length + 1,
      order_id: newOrder.id,
      status: 'placed',
      changed_by: newOrder.customer_id,
      note: 'Order placed successfully.',
      changed_at: new Date()
    });

    saveMockDB();
    return { insertId: newOrder.id, affectedRows: 1 };
  }
  if (cleanSql.includes('insert into order_items')) {
    // order_id, product_id, item_name, price, quantity, subtotal
    const newItem = {
      id: mockDB.order_items.length + 1,
      order_id: parseInt(params[0]),
      product_id: params[1] ? parseInt(params[1]) : null,
      item_name: params[2],
      price: parseFloat(params[3]),
      quantity: parseInt(params[4]),
      subtotal: parseFloat(params[5])
    };
    mockDB.order_items.push(newItem);
    saveMockDB();
    return { insertId: newItem.id, affectedRows: 1 };
  }
  if (cleanSql.includes('select o.*, s.name as shop_name')) {
    // Fetch orders with shop details
    let ordersFiltered = mockDB.orders;
    if (cleanSql.includes('customer_id = ?')) {
      ordersFiltered = ordersFiltered.filter(o => o.customer_id === parseInt(params[0]));
    } else if (cleanSql.includes('shop_id = ?')) {
      ordersFiltered = ordersFiltered.filter(o => o.shop_id === parseInt(params[0]));
    }
    
    return ordersFiltered.map(o => {
      const shop = mockDB.shops.find(s => s.id === o.shop_id);
      const cust = mockDB.users.find(u => u.id === o.customer_id);
      return { 
        ...o, 
        shop_name: shop ? shop.name : 'Unknown Shop',
        shop_address: shop ? shop.address : 'Unknown Address',
        shop_mobile: shop ? shop.mobile : 'Unknown Mobile',
        customer_name: cust ? cust.name : 'Guest'
      };
    }).sort((a,b) => b.id - a.id);
  }
  if (cleanSql.includes('select * from orders where id = ?')) {
    const order = mockDB.orders.find(o => o.id === parseInt(params[0]));
    if (order) {
      const shop = mockDB.shops.find(s => s.id === order.shop_id);
      return [{ 
        ...order, 
        shop_name: shop ? shop.name : 'Unknown Shop',
        shop_address: shop ? shop.address : 'Unknown Address',
        shop_mobile: shop ? shop.mobile : 'Unknown Mobile'
      }];
    }
    return [];
  }
  if (cleanSql.includes('select * from order_items where order_id = ?')) {
    return mockDB.order_items.filter(oi => oi.order_id === parseInt(params[0]));
  }
  if (cleanSql.includes('select * from order_timeline where order_id = ?')) {
    return mockDB.order_timeline.filter(t => t.order_id === parseInt(params[0]))
      .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  }
  if (cleanSql.includes('update orders set order_status')) {
    let newStatus = params[0];
    let orderId = parseInt(params[params.length - 1]);
    let note = `Order status changed to ${newStatus}`;
    let changedBy = 2; // simulated shop owner ID

    if (cleanSql.includes('cancelled')) {
      newStatus = 'cancelled';
      note = 'Order cancelled by the customer.';
    }

    const order = mockDB.orders.find(o => o.id === orderId);
    if (order) {
      order.order_status = newStatus;
      if (cleanSql.includes('cancelled')) {
        order.cancelled_by = 'customer';
        changedBy = order.customer_id;
      } else {
        if (params.length > 2 && cleanSql.includes('estimated_time')) {
          order.estimated_time = parseInt(params[1]);
        }
        
        const isDelivery = order.delivery_mode === 'delivery';
        if (newStatus === 'accepted') note = `Order accepted. Packing will begin shortly.`;
        if (newStatus === 'packing') note = `The shop owner has started packing your fresh groceries!`;
        if (newStatus === 'ready') {
          note = isDelivery 
            ? `Order is out for delivery! The rider is bringing your package.`
            : `Your package is ready! Grab & Go now from the shop.`;
        }
        if (newStatus === 'picked') {
          note = isDelivery 
            ? `Order delivered safely to your address. Enjoy your groceries!`
            : `Order picked up and completed. Thank you!`;
        }
      }
      
      // Auto-update timeline when status changes
      mockDB.order_timeline.push({
        id: mockDB.order_timeline.length + 1,
        order_id: orderId,
        status: newStatus,
        changed_by: changedBy,
        note: note,
        changed_at: new Date()
      });
      saveMockDB();
    }
    return { affectedRows: 1 };
  }
  if (cleanSql.includes('update orders set payment_status = ?')) {
    const orderId = parseInt(params[1]);
    const order = mockDB.orders.find(o => o.id === orderId);
    if (order) order.payment_status = params[0];
    saveMockDB();
    return { affectedRows: 1 };
  }

  // 6. GLOBAL ADMIN STATS MOCKS
  if (cleanSql.includes('select count(*) as count from users') || cleanSql.includes('select count(*)')) {
    if (cleanSql.includes('role = \'shopowner\'')) {
      return [{ count: mockDB.shops.length }];
    }
    if (cleanSql.includes('users')) {
      return [{ count: mockDB.users.length }];
    }
    if (cleanSql.includes('orders')) {
      return [{ count: mockDB.orders.length }];
    }
  }
  if (cleanSql.includes('sum(total_amount)')) {
    const sum = mockDB.orders.reduce((acc, o) => acc + o.total_amount, 0);
    return [{ total_sales: sum || 0 }];
  }

  // REVIEWS MOCKS
  if (cleanSql.includes('select r.*, u.name as customer_name') && cleanSql.includes('from reviews')) {
    const shopId = parseInt(params[0]);
    return mockDB.reviews
      .filter(r => r.shop_id === shopId)
      .map(r => {
        const user = mockDB.users.find(u => u.id === r.customer_id);
        return { ...r, customer_name: user ? user.name : 'Customer' };
      })
      .sort((a, b) => b.id - a.id);
  }
  if (cleanSql.includes('insert into reviews')) {
    const newReview = {
      id: mockDB.reviews.length + 1,
      customer_id: parseInt(params[0]),
      shop_id: parseInt(params[1]),
      order_id: parseInt(params[2]),
      rating: parseInt(params[3]),
      comment: params[4] || null,
      created_at: new Date()
    };
    mockDB.reviews.push(newReview);
    // Update shop rating average
    const shopReviews = mockDB.reviews.filter(r => r.shop_id === newReview.shop_id);
    const avgRating = shopReviews.reduce((sum, r) => sum + r.rating, 0) / shopReviews.length;
    const shop = mockDB.shops.find(s => s.id === newReview.shop_id);
    if (shop) {
      shop.rating = parseFloat(avgRating.toFixed(1));
      shop.total_reviews = shopReviews.length;
    }
    saveMockDB();
    return { insertId: newReview.id, affectedRows: 1 };
  }
  if (cleanSql.includes('select * from reviews where customer_id = ? and order_id = ?')) {
    const review = mockDB.reviews.find(r => r.customer_id === parseInt(params[0]) && r.order_id === parseInt(params[1]));
    return review ? [review] : [];
  }
  // Per-shop customer orders
  if (cleanSql.includes('customer_id = ?') && cleanSql.includes('shop_id = ?') && cleanSql.includes('from orders')) {
    const customerId = parseInt(params[0]);
    const shopId = parseInt(params[1]);
    return mockDB.orders
      .filter(o => o.customer_id === customerId && o.shop_id === shopId)
      .map(o => {
        const shop = mockDB.shops.find(s => s.id === o.shop_id);
        return {
          ...o,
          shop_name: shop ? shop.name : 'Unknown Shop'
        };
      })
      .sort((a, b) => b.id - a.id);
  }
  // Update shop photo
  if (cleanSql.includes('update shops set shop_photo = ?')) {
    const shopId = parseInt(params[1]);
    const shop = mockDB.shops.find(s => s.id === shopId);
    if (shop) {
      shop.shop_photo = params[0];
      saveMockDB();
    }
    return { affectedRows: 1 };
  }

  // DEFAULT FALLBACK
  return [];
};

// Auto migration function
const runMigrations = async (connection) => {
  console.log('🔄 Running Database Migrations...');
  
  // 1. Users Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      mobile VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('customer','shopowner','admin') DEFAULT 'customer',
      profile_photo VARCHAR(255) DEFAULT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
  `);

  // 2. Addresses Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      label VARCHAR(50) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(50) NOT NULL,
      pincode VARCHAR(10) NOT NULL,
      lat DECIMAL(10,8) NOT NULL,
      lng DECIMAL(11,8) NOT NULL,
      taker_name VARCHAR(100) DEFAULT NULL,
      taker_mobile VARCHAR(20) DEFAULT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 3. Categories Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      icon VARCHAR(100) DEFAULT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default categories if empty
  const [cats] = await connection.query('SELECT COUNT(*) as count FROM categories');
  if (cats[0].count === 0) {
    console.log('🌱 Seeding categories...');
    await connection.query(`
      INSERT INTO categories (name, icon) VALUES
      ('Grocery',    '🛒'),
      ('Bakery',     '🍞'),
      ('Pharmacy',   '💊'),
      ('Vegetables', '🥦'),
      ('Dairy',      '🥛'),
      ('Meat',       '🥩'),
      ('General',    '🏪'),
      ('Sweets',     '🍬'),
      ('Stationery', '📝'),
      ('Electronics','🔌'),
      ('Pet Store',  '🐾'),
      ('Fruits',     '🍎'),
      ('Beverages',  '🥤');
    `);
  }

  // 4. Shops Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS shops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      owner_id INT NOT NULL,
      category_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT DEFAULT NULL,
      shop_photo VARCHAR(255) DEFAULT NULL,
      mobile VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      city VARCHAR(50) NOT NULL,
      pincode VARCHAR(10) NOT NULL,
      lat DECIMAL(10,8) NOT NULL,
      lng DECIMAL(11,8) NOT NULL,
      open_time TIME NOT NULL,
      close_time TIME NOT NULL,
      working_days VARCHAR(100) NOT NULL,
      is_open BOOLEAN DEFAULT TRUE,
      has_delivery BOOLEAN DEFAULT FALSE,
      payment_online BOOLEAN DEFAULT TRUE,
      payment_cash BOOLEAN DEFAULT TRUE,
      rating DECIMAL(2,1) DEFAULT 0.0,
      total_reviews INT DEFAULT 0,
      is_approved BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // 5. Products Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      shop_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT DEFAULT NULL,
      image VARCHAR(255) DEFAULT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 0,
      unit VARCHAR(20) DEFAULT NULL,
      is_available BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE CASCADE
    );
  `);

  // 6. Orders Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      shop_id INT NOT NULL,
      order_number VARCHAR(20) UNIQUE NOT NULL,
      manual_list TEXT DEFAULT NULL,
      uploaded_image VARCHAR(255) DEFAULT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      platform_fee DECIMAL(10,2) DEFAULT 0.00,
      total_amount DECIMAL(10,2) NOT NULL,
      payment_mode ENUM('online','cash') NOT NULL,
      payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
      order_status ENUM('placed','accepted','packing','ready','picked','cancelled') DEFAULT 'placed',
      special_note TEXT DEFAULT NULL,
      estimated_time INT DEFAULT NULL,
      cancelled_by ENUM('customer','shopowner','admin') DEFAULT NULL,
      cancel_reason TEXT DEFAULT NULL,
      delivery_mode ENUM('pickup','delivery') DEFAULT 'pickup',
      delivery_address_text TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    );
  `);

  // 7. Order Items Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT DEFAULT NULL,
      item_name VARCHAR(100) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      quantity INT NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );
  `);

  // 8. Order Status Timeline Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS order_timeline (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      status ENUM('placed','accepted','packing','ready','picked','cancelled') NOT NULL,
      changed_by INT NOT NULL,
      note TEXT DEFAULT NULL,
      changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );
  `);

  // 9. Payments Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      customer_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_mode ENUM('online','cash') NOT NULL,
      payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
      razorpay_order_id VARCHAR(100) DEFAULT NULL,
      razorpay_payment_id VARCHAR(100) DEFAULT NULL,
      razorpay_signature VARCHAR(255) DEFAULT NULL,
      paid_at TIMESTAMP DEFAULT NULL,
      refunded_at TIMESTAMP DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (customer_id) REFERENCES users(id)
    );
  `);

  // 10. Reviews Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT NOT NULL,
      shop_id INT NOT NULL,
      order_id INT NOT NULL,
      rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_review (customer_id, order_id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (shop_id) REFERENCES shops(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  // 11. Notifications Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(100) NOT NULL,
      message TEXT NOT NULL,
      type ENUM('order','payment','promo','system') DEFAULT 'order',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 12. Delivered Orders Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS delivered_orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      order_number VARCHAR(20) NOT NULL,
      customer_id INT NOT NULL,
      shop_id INT NOT NULL,
      customer_name VARCHAR(100) NOT NULL,
      items_summary TEXT DEFAULT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      platform_fee DECIMAL(10,2) DEFAULT 0.00,
      total_amount DECIMAL(10,2) NOT NULL,
      payment_mode ENUM('online','cash') NOT NULL,
      payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'paid',
      delivered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      delivery_note TEXT DEFAULT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (shop_id) REFERENCES shops(id)
    );
  `);

  // Seed default admin and shop owner users if empty
  const [usersCount] = await connection.query('SELECT COUNT(*) as count FROM users');
  if (usersCount[0].count === 0) {
    console.log('🌱 Seeding initial user accounts...');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('Password123', salt);
    const adminHash = await bcrypt.hash('Koushik@123', salt);
    
    // Admin, Shop Owner, Customer
    await connection.query(`
      INSERT INTO users (name, email, mobile, password, role, is_verified, is_active) VALUES
      ('Koushik', 'saikoushik510@gmail.com', '9999999999', ?, 'admin', 1, 1),
      ('Fresh Mart Owner', 'owner@grabngo.com', '8888888888', ?, 'shopowner', 1, 1),
      ('John Customer', 'customer@grabngo.com', '7777777777', ?, 'customer', 1, 1)
    `, [adminHash, hash, hash]);

    // Seed default shop for owner (user_id = 2)
    await connection.query(`
      INSERT INTO shops (owner_id, category_id, name, description, shop_photo, mobile, address, city, pincode, lat, lng, open_time, close_time, working_days, is_open, has_delivery, rating, total_reviews, is_approved)
      VALUES (2, 1, 'Fresh Mart Grocery', 'Your one-stop organic grocery and household shop.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80', '8888888888', '22 Tech Park Road, Sector 4', 'Bengaluru', '560001', 12.97220000, 77.59500000, '09:00:00', '21:00:00', 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 1, 1, 4.5, 12, 1)
    `);

    // Seed products for Fresh Mart Grocery (shop_id = 1)
    await connection.query(`
      INSERT INTO products (shop_id, name, description, price, stock, unit, image, is_available) VALUES
      (1, 'Organic Fresh Bananas', 'Sweet local organic yellow bananas, farm fresh.', 49.00, 150, 'kg', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300&q=80', 1),
      (1, 'Basmati Rice Premium', 'Long grain, highly aromatic aged basmati rice.', 120.00, 45, 'kg', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80', 1),
      (1, 'Farm Eggs Box', 'Pack of 12 clean farm-fresh protein-rich brown eggs.', 80.00, 30, 'piece', 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=300&q=80', 1),
      (1, 'Cold Pressed Coconut Oil', '100% natural cooking oil, 1 litre bottle.', 240.00, 20, 'litre', 'https://images.unsplash.com/photo-1614749514827-7f55b91a1fb3?w=300&q=80', 1)
    `);
  }

  // Ensure the custom Admin user exists and has the correct password in MySQL database
  try {
    const [existing] = await connection.query('SELECT * FROM users WHERE email = ?', ['saikoushik510@gmail.com']);
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('Koushik@123', salt);
    if (existing.length === 0) {
      await connection.query(`
        INSERT INTO users (name, email, mobile, password, role, is_verified, is_active) 
        VALUES ('Koushik', 'saikoushik510@gmail.com', '9999999999', ?, 'admin', 1, 1)
      `, [adminHash]);
      console.log('🛡️  Custom Admin user Koushik seeded into MySQL database successfully!');
    } else {
      await connection.query(`
        UPDATE users SET name = 'Koushik', password = ?, role = 'admin' WHERE email = 'saikoushik510@gmail.com'
      `, [adminHash]);
      console.log('🛡️  Custom Admin user Koushik details verified/updated in MySQL successfully!');
    }
  } catch (err) {
    console.warn('⚠️ Could not auto-seed/update custom Admin user in database:', err.message);
  }

  // Alter tables for delivery details safely
  try {
    await connection.query(`ALTER TABLE addresses ADD COLUMN taker_name VARCHAR(100) DEFAULT NULL`);
  } catch (err) {}
  try {
    await connection.query(`ALTER TABLE addresses ADD COLUMN taker_mobile VARCHAR(20) DEFAULT NULL`);
  } catch (err) {}
  try {
    await connection.query(`ALTER TABLE orders ADD COLUMN delivery_mode ENUM('pickup','delivery') DEFAULT 'pickup'`);
  } catch (err) {}
  try {
    await connection.query(`ALTER TABLE orders ADD COLUMN delivery_address_text TEXT DEFAULT NULL`);
  } catch (err) {}

  console.log('✅ Database Migrations completed successfully.');
};

// Database Connection Orchestrator
const connectDB = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || 'yourpassword';
  const port = process.env.DB_PORT || 3306;
  const database = process.env.DB_NAME || 'grabngo';

  try {
    // Attempt standard connection to the specific database
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test connection
    const testConn = await pool.getConnection();
    console.log('✅ Connected to MySQL Server!');
    testConn.release();

    // Run migrations
    await runMigrations(pool);
  } catch (error) {
    console.warn(`⚠️  MySQL Connection (Database: ${database}) failed:`, error.message);
    console.log('⚙️  Attempting to auto-create database if not existing...');

    try {
      // Connect to server without database first to try creating it
      const tempPool = mysql.createPool({ host, user, password, port });
      const tempConn = await tempPool.getConnection();
      await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
      tempConn.release();
      await tempPool.end();

      console.log(`🎉 Database \`${database}\` created/verified! Re-attempting connection...`);
      
      // Retry pool setup with database name
      pool = mysql.createPool({
        host,
        user,
        password,
        database,
        port,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const retryConn = await pool.getConnection();
      console.log('✅ Re-connection successful!');
      retryConn.release();

      await runMigrations(pool);
    } catch (createErr) {
      console.warn('❌ Auto-migration failed. Switching to high-fidelity mock database fallback.');
      console.log('🚀 Running in MOCK DATABASE MODE. No local MySQL required for full capability!');
      isMock = true;
    }
  }
};

module.exports = {
  query,
  connectDB,
  isMock: () => isMock
};
