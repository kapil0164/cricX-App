#!/bin/bash
# Quick deployment setup script
# Usage: bash setup-prod.sh

echo "🚀 CricX Production Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js found: $(node --version)${NC}"

# Generate JWT Secret
echo ""
echo -e "${YELLOW}Generating secure JWT_SECRET...${NC}"
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo -e "${GREEN}✅ Generated: $JWT_SECRET${NC}"

# Backend Setup
echo ""
echo -e "${YELLOW}Setting up Backend...${NC}"
cd Backend

if [ -f ".env" ]; then
    echo -e "${RED}⚠️  .env already exists, backing up to .env.backup${NC}"
    mv .env .env.backup
fi

# Create .env from example
cp .env.example .env

# Update .env with generated secret
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/replace_with_a_secure_random_string_at_least_32_chars/$JWT_SECRET/" .env
else
    # Linux
    sed -i "s/replace_with_a_secure_random_string_at_least_32_chars/$JWT_SECRET/" .env
fi

echo -e "${GREEN}✅ Backend .env created${NC}"
echo "⚠️  IMPORTANT: Update these values in .env:"
echo "   - MONGO_URI (your MongoDB Atlas connection)"
echo "   - FRONTEND_ORIGIN (your frontend domain)"
echo "   - NODE_ENV (production)"

# Install dependencies
echo ""
echo -e "${YELLOW}Installing Backend dependencies...${NC}"
npm install --production

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install Backend dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Frontend Setup
echo ""
echo -e "${YELLOW}Setting up Frontend...${NC}"
cd ../Frontend

if [ -f ".env" ]; then
    echo -e "${RED}⚠️  .env already exists, backing up to .env.backup${NC}"
    mv .env .env.backup
fi

cp .env.example .env

echo -e "${GREEN}✅ Frontend .env created${NC}"
echo "⚠️  IMPORTANT: Update these values in .env:"
echo "   - VITE_API_URL (your backend API domain)"

# Install dependencies
echo ""
echo -e "${YELLOW}Installing Frontend dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install Frontend dependencies${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Build Frontend
echo ""
echo -e "${YELLOW}Building Frontend...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to build Frontend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend built successfully${NC}"

# Final instructions
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Edit Backend/.env with your production values:"
echo "   - MONGO_URI"
echo "   - FRONTEND_ORIGIN"
echo "   - NODE_ENV=production"
echo ""
echo "2. Edit Frontend/.env with your production values:"
echo "   - VITE_API_URL"
echo ""
echo "3. Test locally:"
echo "   - Backend: cd Backend && npm start"
echo "   - Frontend: cd Frontend && npm run preview"
echo ""
echo "4. Deploy to your platform (Vercel, Heroku, etc.)"
echo ""
echo "See SECURITY_DEPLOYMENT.md for detailed deployment instructions."
