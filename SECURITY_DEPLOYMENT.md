# Security & Deployment Checklist

This document outlines all security measures implemented and pre-deployment requirements.

## ✅ Security Features Implemented

### 1. **Environment Variables & Secrets**
- ✅ `.env` files added to `.gitignore` (both Frontend & Backend)
- ✅ New secure `JWT_SECRET` generated and stored in `.env`
- ✅ `.env.example` files created with helpful comments
- ✅ Environment variable validation in code (fails fast if `JWT_SECRET` missing)

### 2. **Rate Limiting**
- ✅ General rate limiter: 100 requests per 15 minutes
- ✅ Auth rate limiter: 5 attempts per 15 minutes (prevents brute force)
- ✅ Configurable via environment variables: `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX_REQUESTS`

### 3. **Security Headers**
- ✅ `X-Frame-Options: DENY` - Prevents clickjacking
- ✅ `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- ✅ `X-XSS-Protection: 1; mode=block` - XSS protection
- ✅ `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer leakage
- ✅ `Permissions-Policy` - Restricts access to camera, microphone, geolocation
- ✅ HTTPS redirect in production (via `x-forwarded-proto` header)

### 4. **Input Validation & Sanitization**
- ✅ Email validation (format check)
- ✅ Password validation (min 6 characters, can enforce stronger requirements)
- ✅ Name validation (2-50 characters)
- ✅ String sanitization (removes dangerous characters)
- ✅ NoSQL injection prevention (detects suspicious `$` operators)
- ✅ Request body validation middleware

### 5. **CORS Configuration**
- ✅ Dynamic CORS origin from `FRONTEND_ORIGIN` environment variable
- ✅ Credentials enabled for JWT authentication
- ✅ Only whitelisted origins allowed
- ✅ Localhost fallbacks for development

### 6. **Authentication & Password Security**
- ✅ Passwords hashed with bcryptjs (12 rounds)
- ✅ JWT tokens with 7-day expiration
- ✅ No passwords exposed in API responses
- ✅ Removed hardcoded fallback secrets
- ✅ Proper error messages (no user enumeration hints)

### 7. **Request Logging**
- ✅ All requests logged with status code and response time
- ✅ Easy to identify errors (❌ for 4xx/5xx, ✅ for success)
- ✅ Can be upgraded to Morgan for production

### 8. **Error Handling**
- ✅ Generic error messages in production (no sensitive data leaks)
- ✅ Detailed error logging for debugging
- ✅ Centralized error handler middleware

---

## 📋 Pre-Deployment Checklist

### Backend Configuration

- [ ] **1. Generate New JWT_SECRET for Production**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Copy the output and set it as `JWT_SECRET` in your production environment.

- [ ] **2. Set Frontend Origin**
  ```bash
  FRONTEND_ORIGIN=https://yourdomain.com
  ```

- [ ] **3. Configure MongoDB Atlas**
  - Create cluster on MongoDB Atlas
  - Get connection string
  - Set `MONGO_URI` to production connection string
  - Example: `mongodb+srv://user:password@cluster.mongodb.net/cricx?retryWrites=true&w=majority`

- [ ] **4. Set Environment to Production**
  ```bash
  NODE_ENV=production
  ```

- [ ] **5. Install Dependencies**
  ```bash
  cd Backend
  npm install --production
  ```

- [ ] **6. Test Backend Locally**
  ```bash
  npm run dev
  # or
  npm start
  ```

### Frontend Configuration

- [ ] **7. Set API URL for Production**
  ```bash
  VITE_API_URL=https://api.yourdomain.com/api
  ```
  (Adjust the domain to match your backend deployment)

- [ ] **8. Build Frontend**
  ```bash
  cd Frontend
  npm install
  npm run build
  ```

- [ ] **9. Verify Build Output**
  Check that `dist/` folder contains optimized production files.

### Deployment Platform Setup

- [ ] **10. Deploy Backend**
  **Option A: Heroku**
  ```bash
  heroku create your-api-name
  heroku config:set JWT_SECRET="your-generated-secret"
  heroku config:set MONGO_URI="your-mongodb-uri"
  heroku config:set FRONTEND_ORIGIN="https://yourdomain.com"
  heroku config:set NODE_ENV="production"
  git push heroku main
  ```

  **Option B: Render/Railway/AWS**
  - Set environment variables in platform dashboard
  - Deploy from GitHub or upload build

  **Option C: Your Own Server**
  ```bash
  ssh user@server.com
  cd /path/to/cricx/Backend
  npm install --production
  NODE_ENV=production npm start
  # Use PM2 or systemd to keep it running
  ```

- [ ] **11. Deploy Frontend**
  **Option A: Vercel**
  ```bash
  npm install -g vercel
  cd Frontend
  vercel --prod
  # Set VITE_API_URL in Vercel dashboard
  ```

  **Option B: Netlify**
  - Connect repository
  - Set build command: `npm run build`
  - Set environment: `VITE_API_URL=https://api.yourdomain.com/api`
  - Deploy

  **Option C: AWS S3 + CloudFront**
  - Upload `dist/` to S3
  - Create CloudFront distribution
  - Update DNS

### HTTPS & Domain Setup

- [ ] **12. Get SSL Certificate**
  - **Let's Encrypt (Free):** Use on your server or platform
  - **Platform:** Most provide automatic HTTPS (Vercel, Netlify, Heroku)
  - **CloudFlare:** Free tier includes HTTPS

- [ ] **13. Update DNS Records**
  ```
  yourdomain.com     → Frontend host
  api.yourdomain.com → Backend host
  ```

- [ ] **14. Verify HTTPS**
  - Test with: `https://yourdomain.com`
  - Check SSL certificate validity
  - Verify backend API is accessible over HTTPS

### Security Testing

- [ ] **15. Test CORS**
  ```javascript
  // From browser console at yourdomain.com
  fetch('https://api.yourdomain.com/api/health').then(r => r.json()).then(console.log)
  ```

- [ ] **16. Test Rate Limiting**
  - Make 100+ requests in 15 minutes
  - Should get `429 Too Many Requests`

- [ ] **17. Test JWT Authentication**
  - Sign up and log in
  - Token should be stored in localStorage
  - Token should expire after 7 days

- [ ] **18. Test Input Validation**
  - Try invalid email: `test@`
  - Try weak password: `123`
  - Try malicious input: `{"$where": "..."}`
  - All should be rejected

- [ ] **19. Security Headers Check**
  Use: https://securityheaders.com/
  - Should show A or A+ rating
  - All security headers present

- [ ] **20. SSL Certificate Check**
  Use: https://www.sslshopper.com/ssl-checker.html
  - Certificate valid and trusted
  - No mixed content warnings

---

## 🚀 Production Deployment Commands

### Backend (Node.js)
```bash
cd Backend
npm install --production
NODE_ENV=production \
  JWT_SECRET="your-secret-here" \
  MONGO_URI="your-mongo-uri" \
  FRONTEND_ORIGIN="https://yourdomain.com" \
  PORT=5000 \
  npm start
```

### Frontend (Build & Deploy)
```bash
cd Frontend
npm install
VITE_API_URL="https://api.yourdomain.com/api" npm run build
# Upload dist/ folder to your host
```

---

## 🔐 Security Best Practices

1. **Secrets Management:**
   - Never commit `.env` files
   - Use platform secret management
   - Rotate secrets regularly
   - Use strong random strings (32+ characters)

2. **Monitoring:**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor API logs for suspicious activity
   - Set up alerts for rate limit violations

3. **Database:**
   - Regular backups (MongoDB Atlas auto-backups)
   - Use strong database credentials
   - Enable IP whitelist (Atlas Security)

4. **Updates:**
   - Keep dependencies updated
   - Monitor for security vulnerabilities: `npm audit`
   - Use long-term support versions

5. **API Versioning:**
   - Plan for API v2 in future
   - Use `/api/v1/` in routes for versioning

6. **Logging & Auditing:**
   - Log all authentication attempts
   - Log data modifications
   - Implement audit trails for sensitive operations

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)

---

## ✨ Final Status: ~90% Ready to Deploy

All critical security measures are in place. Complete the checklist above before going to production.

**Questions?** Check logs: `console.log()` output and error tracking services.
