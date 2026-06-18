# Deployment and Deployment Security

This project is now **~90% ready for production deployment**. All critical security measures have been implemented.

## 🔐 Security Implementation Status

See **[SECURITY_DEPLOYMENT.md](./SECURITY_DEPLOYMENT.md)** for complete security details and pre-deployment checklist.

### What's Been Secured:
✅ Rate limiting (100 req/15 min, 5 auth attempts/15 min)
✅ Security headers (CORS, clickjacking, XSS, MIME sniffing)
✅ Input validation & sanitization
✅ NoSQL injection prevention
✅ Password hashing (bcryptjs, 12 rounds)
✅ JWT authentication (7-day expiration)
✅ Environment variable secrets management
✅ Request logging
✅ HTTPS redirect configuration
✅ Error handling (generic messages in production)

---

## 🚀 Quick Start

### 1. Automated Setup (Recommended)
```bash
bash setup-prod.sh
```
This script will:
- Generate a secure JWT_SECRET
- Create .env files with examples
- Install dependencies
- Build the frontend

### 2. Manual Setup

#### Backend Configuration
```bash
cd Backend
cp .env.example .env
# Edit .env and fill in:
# - MONGO_URI (MongoDB Atlas connection)
# - JWT_SECRET (already generated securely)
# - FRONTEND_ORIGIN (e.g., https://yourdomain.com)
# - NODE_ENV=production

npm install --production
```

#### Frontend Configuration
```bash
cd Frontend
cp .env.example .env
# Edit .env and fill in:
# - VITE_API_URL (e.g., https://api.yourdomain.com/api)

npm install
VITE_API_URL="https://api.yourdomain.com/api" npm run build
```

---

## 📋 Environment Variables

### Backend (.env)

**Required:**
- `MONGO_URI` — MongoDB connection string (production)
- `JWT_SECRET` — Secure random 32+ character string (regenerate for production)
- `FRONTEND_ORIGIN` — Your frontend URL (e.g., https://yourdomain.com)

**Optional:**
- `PORT` — Server port (default: 5000)
- `NODE_ENV` — Environment (development|production, default: development)
- `RATE_LIMIT_WINDOW` — Rate limit window in minutes (default: 15)
- `RATE_LIMIT_MAX_REQUESTS` — Max requests per window (default: 100)

**Generate a new JWT_SECRET for production:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Frontend (.env)

**Required:**
- `VITE_API_URL` — Backend API URL (e.g., https://api.yourdomain.com/api)

---

## 🏃 Running the Application

### Development
```bash
# Terminal 1: Backend
cd Backend
npm run dev

# Terminal 2: Frontend
cd Frontend
npm run dev
```

### Production
```bash
# Backend
cd Backend
NODE_ENV=production npm start

# Frontend (pre-built, serve dist/)
cd Frontend
npm run preview
# or use any static host (Vercel, Netlify, S3, etc.)
```

---

## ☁️ Deployment Platforms

### Option 1: Vercel (Frontend) + Heroku (Backend)

**Backend on Heroku:**
```bash
heroku create your-api-name
heroku config:set JWT_SECRET="your-generated-secret"
heroku config:set MONGO_URI="your-mongodb-uri"
heroku config:set FRONTEND_ORIGIN="https://yourdomain.com"
heroku config:set NODE_ENV="production"
git push heroku main
```

**Frontend on Vercel:**
```bash
npm i -g vercel
cd Frontend
vercel --prod
# Set VITE_API_URL in dashboard
```

### Option 2: Netlify (Frontend) + AWS/Render (Backend)

**Frontend:**
- Connect GitHub repo to Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Add environment variable: `VITE_API_URL=https://api.yourdomain.com/api`

**Backend:**
- Deploy to AWS ECS, Render, Railway, or your own server
- Set environment variables in platform dashboard

### Option 3: Full Stack on Single VPS

```bash
# On your server
git clone <repo>
cd cricX/Backend
npm install --production
NODE_ENV=production npm start &

# Use PM2 to keep it running
npm install -g pm2
pm2 start index.js --name "cricx-api"
pm2 startup
pm2 save
```

---

## 🔒 Pre-Deployment Security Checklist

- [ ] Generate new `JWT_SECRET` and store securely
- [ ] Set `MONGO_URI` to production MongoDB Atlas
- [ ] Set `FRONTEND_ORIGIN` to production domain
- [ ] Enable HTTPS on both frontend and backend
- [ ] Test CORS from production domain
- [ ] Test rate limiting
- [ ] Test JWT authentication
- [ ] Run security headers check: https://securityheaders.com/
- [ ] Set up database backups
- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Monitor logs regularly

See **[SECURITY_DEPLOYMENT.md](./SECURITY_DEPLOYMENT.md)** for complete checklist and detailed instructions.

---

## 📊 Health Check

Test if backend is running:
```bash
curl https://api.yourdomain.com/api/health
# Response: {"status":"ok","env":"production"}
```

---

## 📞 Support

For detailed security configuration, see: **[SECURITY_DEPLOYMENT.md](./SECURITY_DEPLOYMENT.md)**
