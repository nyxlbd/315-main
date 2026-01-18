const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// CORS Middleware (STRICT, handles preflight and only allows your origins)
const allowedOrigins = [
  'http://localhost:5173',
  'https://315-eight.vercel.app'
];

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// Handle preflight requests for all routes
app.options('*', cors());

// Add this after your CORS setup, before any other routes
app.get('/test', (req, res) => {
  res.json({ ok: true, origin: req.headers.origin });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/seller', require('./routes/seller'));
app.use('/api/admin', require('./routes/admin'));

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverApi: {
        dbName: 'pinecitymade',
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });
    
    console.log('✅ MongoDB connected successfully!');
    
    // Ping to confirm connection
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log('✅ Pinged your deployment. Connection verified!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});