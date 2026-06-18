/**
 * Input validation utilities
 * Validates user inputs to prevent injection attacks and invalid data
 */

// ── Email validation ────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

// ── Password validation ─────────────────────────────────
// Min 6 chars, at least 1 number and 1 special char for production
function validatePassword(password, strict = false) {
  if (!password || typeof password !== 'string') return false;

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  if (strict) {
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasNumber || !hasSpecial) {
      return { valid: false, error: 'Password must contain at least one number and special character' };
    }
  }

  return { valid: true };
}

// ── Name validation ────────────────────────────────────
function validateName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

// ── String sanitization ────────────────────────────────
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>"']/g, '').substring(0, 255);
}

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  sanitizeString,
};
