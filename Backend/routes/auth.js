const router  = require('express').Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const { validateEmail, validatePassword, validateName, sanitizeString } = require('../utils/validation');

// ⚠️ JWT_SECRET is required - it will fail fast if not set
const JWT_SECRET  = process.env.JWT_SECRET;
const JWT_EXPIRES = '7d';

if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set');
}

// Helper — create and return signed token + user info
function sendToken(user, statusCode, res) {
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.status(statusCode).json({
    success: true,
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
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    if (!validateName(name)) {
      return res.status(400).json({ error: 'Name must be 2-50 characters.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Sanitize and create user
    const sanitizedName = sanitizeString(name);
    const avatar = sanitizedName.slice(0, 2).toUpperCase();
    const user = await User.create({
      name: sanitizedName,
      email: email.toLowerCase(),
      password,
      avatar,
    });

    sendToken(user, 201, res);
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// ── POST /api/auth/signin ──────────────────────────────
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email.' });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    sendToken(user, 200, res);
  } catch (err) {
    console.error('❌ Signin error:', err.message);
    res.status(500).json({ error: 'Failed to sign in. Please try again.' });
  }
});

// ── GET /api/auth/me — verify token, return user ──────
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ Auth check error:', err.message);
    res.status(500).json({ error: 'Failed to verify token.' });
  }
});

module.exports = router;