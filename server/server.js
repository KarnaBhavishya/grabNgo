// server/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, isMock } = require('./config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const shopRoutes = require('./routes/shops');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const addressRoutes = require('./routes/addresses');

app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/addresses', addressRoutes);

// Health Check & Environment Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    appName: 'GrabNGo API Gateway',
    databaseMode: isMock() ? 'Mock Memory Mode (No local MySQL required)' : 'MySQL Production Mode',
    timestamp: new Date()
  });
});

// App Entry & Database Connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 GrabNGo Server running on port ${PORT}`);
    console.log(`🔌 API Gateway: http://localhost:${PORT}/api/status`);
    console.log(`🛡️  Database Mode: ${isMock() ? 'InMemory Mock Fallback' : 'MySQL Active Connection'}`);
    console.log(`===================================================`);
  });
};

startServer();
