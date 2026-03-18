const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const JWT_SECRET  = process.env.JWT_SECRET || 'cricx_secret_change_in_prod';
const JWT_EXPIRES = '7d';

// Helper — create and return signed token + user info
function sendToken(user, statusCode, res) {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.status(statusCode).json({
    token,
    user: {
      _id:    user._id,
      name:   user.name,
      email:  user.email,
      avatar: user.avatar,
    },
  });
}

// ── POST /api/auth/signup ──────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate fields
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: 'An account with this email already exists.' });

    // Create user — password is hashed via pre-save hook in User.js
    const avatar = name.slice(0, 2).toUpperCase();
    const user   = await User.create({ name, email, password, avatar });

    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/auth/signin ──────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    // Find user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    if (!user)
      return res.status(401).json({ error: 'No account found with this email.' });

    const match = await user.matchPassword(password);
    if (!match)
      return res.status(401).json({ error: 'Incorrect password.' });

    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/auth/me — verify token, return user ──────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided.' });

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
});

module.exports = router;