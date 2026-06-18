require('dotenv').config(); // load .env first
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const { generalLimiter, authLimiter, securityHeaders, requestLogger, validateInput } = require('./middleware/security');

const app = express();

// ── Environment Validation ──────────────────────────────
if (!process.env.JWT_SECRET) {
  console.error('❌ Missing JWT_SECRET environment variable. This is required for security.');
  process.exit(1);
}

// ── Security Middleware ─────────────────────────────────
app.use(securityHeaders);
app.use(requestLogger);
app.use(generalLimiter);

// ── Middleware ──────────────────────────────────────────
// Allow configuring frontend origin via environment for deployment.
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN; // e.g. https://app.example.com
const allowedOrigins = [
  FRONTEND_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:3000',
].filter(Boolean);

function isLocalhostOrigin(origin) {
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1'].includes(url.hostname);
  } catch {
    return false;
  }
}

app.use(cors({
  origin: function (origin, callback) {
    // allow server-to-server or tools without origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.NODE_ENV !== 'production' && isLocalhostOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(validateInput);

// ── Routes ─────────────────────────────────────────────
// Auth endpoints get stricter rate limiting
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/matches', require('./routes/matches'));

// ── Health check ───────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV || 'development' }));

// ── Error Handling ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Connect to MongoDB then start server ────────────────
const PORT     = process.env.PORT     || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cricx';

if (!MONGO_URI) {
  console.error('❌ Missing MONGO_URI environment variable.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 CORS enabled for: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });