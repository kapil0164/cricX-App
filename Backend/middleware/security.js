const rateLimit = require('express-rate-limit');

// ── Rate Limiting ────────────────────────────────────────
// Limit API requests to prevent brute force attacks
const generalLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // Default: 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Default: 100 requests per window
  message: 'Too many requests, please try again later.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,  // Disable `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV === 'test', // Skip rate limiting in test mode
});

// Stricter limits for auth endpoints (prevent brute force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true, // Don't count successful requests
});

// ── Security Headers ─────────────────────────────────────
// Add security headers to responses
function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (prevent camera, microphone access etc.)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // HTTPS redirect (only in production)
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  }

  next();
}

// ── Request Logging ──────────────────────────────────────
// Log incoming requests (simple version, use morgan for production)
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? '❌' : '✅';
    console.log(
      `${level} ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}

// ── Input Validation Middleware ──────────────────────────
// Sanitize and validate common inputs
function validateInput(req, res, next) {
  // Prevent NoSQL injection by validating JSON fields
  if (req.body && typeof req.body === 'object') {
    const validateObject = (obj) => {
      for (const key in obj) {
        const value = obj[key];
        // Check for suspicious patterns like $where, $function, etc.
        if (typeof value === 'object' && value !== null) {
          if (key.startsWith('$') || (typeof value === 'object' && Object.keys(value).some(k => k.startsWith('$')))) {
            return false;
          }
          if (!validateObject(value)) return false;
        }
      }
      return true;
    };

    if (!validateObject(req.body)) {
      return res.status(400).json({ error: 'Invalid input detected' });
    }
  }

  next();
}

module.exports = {
  generalLimiter,
  authLimiter,
  securityHeaders,
  requestLogger,
  validateInput,
};
