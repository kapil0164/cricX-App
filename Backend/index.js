require('dotenv').config(); // load .env first
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // React dev ports
}));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/matches', require('./routes/matches'));

// ── Health check ───────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Connect to MongoDB then start server ────────────────
const PORT     = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cricx';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });