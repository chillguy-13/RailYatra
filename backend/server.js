const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Redis connection
require('./config/redis');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(compression());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/trains', require('./routes/trains'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: '🚂 RailYatra API is running!' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5001;
const startTime = Date.now();

console.log('🔌 Connecting to MongoDB...');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rail-yatra';

mongoose
  .connect(mongoUri, {
    family: 4, // Enforce IPv4 to avoid Node.js localhost IPv6 DNS lookup delays
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  })
  .then(async () => {
    const dbConnectedTime = Date.now() - startTime;
    console.log(`✅ MongoDB connected in ${dbConnectedTime}ms`);
    
    // Seed admin user on startup
    await require('./config/seeder')();
    
    app.listen(PORT, () => {
      const totalStartupTime = Date.now() - startTime;
      console.log(`🚀 RailYatra Server running on port ${PORT} (Booted in ${totalStartupTime}ms)`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Make sure MongoDB is running locally on 127.0.0.1:27017');
    process.exit(1);
  });
