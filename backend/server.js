const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const sellerRoutes = require('./routes/seller');
const adminRoutes = require('./routes/admin');
const supabase = require('./config/supabase');

const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Global Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase JSON limit to support Base64 image payload uploads
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));
app.use(morgan('dev'));

// API Routing
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/admin', adminRoutes);

// Root Health Route
app.get('/', async (req, res) => {
  let dbStatus = 'healthy';
  try {
    // Quick probe to check if database is reachable
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" or similar empty table status codes
      dbStatus = `degraded (${error.message})`;
    }
  } catch (err) {
    dbStatus = `unreachable (${err.message})`;
  }

  res.json({
    appName: 'Artify Marketplace API',
    version: '1.0.0',
    status: 'online',
    databaseConnection: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Artify Backend Service running on port ${PORT}`);
  console.log(`👉 API Health endpoint: http://localhost:${PORT}/`);
});
