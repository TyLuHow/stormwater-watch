#!/bin/bash

echo "🚀 Stormwater Watch Quick Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check for .env file
if [ ! -f .env ]; then
  echo -e "${YELLOW}📋 Creating .env from template...${NC}"
  cp .env.example .env
  echo -e "${RED}⚠️  Please edit .env with your API keys!${NC}"
  echo ""
  echo "Required environment variables:"
  echo "  - DATABASE_URL"
  echo "  - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  echo "  - UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN"
  echo "  - RESEND_API_KEY"
  echo "  - MAPBOX_TOKEN, NEXT_PUBLIC_MAPBOX_TOKEN"
  echo "  - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
  echo "  - CRON_SECRET (generate with: openssl rand -hex 16)"
  echo ""
  exit 1
fi

echo -e "${GREEN}✓${NC} .env file found"

# Install dependencies
echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ npm install failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Dependencies installed"

# Push database schema
echo ""
echo -e "${YELLOW}🗄️  Setting up database schema...${NC}"
npm run db:push

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Database setup failed${NC}"
  echo "Please check your DATABASE_URL in .env"
  exit 1
fi

echo -e "${GREEN}✓${NC} Database schema created"

# Initialize Supabase
echo ""
echo -e "${YELLOW}☁️  Initializing Supabase storage...${NC}"
npm run setup:supabase

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Supabase initialization failed${NC}"
  echo "Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
  exit 1
fi

echo -e "${GREEN}✓${NC} Supabase storage initialized"

# Seed database
echo ""
echo -e "${YELLOW}🌱 Seeding database with test data...${NC}"
npm run db:seed

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Database seeding failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Database seeded"

# Validate setup
echo ""
echo -e "${YELLOW}✅ Validating setup...${NC}"
npm run setup:validate

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Setup validation failed${NC}"
  echo "Please check the errors above and fix your .env configuration"
  exit 1
fi

echo ""
echo "================================"
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the generated test data in Prisma Studio:"
echo "     ${GREEN}npm run db:studio${NC}"
echo ""
echo "  2. Start the development server:"
echo "     ${GREEN}npm run dev${NC}"
echo ""
echo "  3. Open http://localhost:3000 in your browser"
echo ""
echo "For production deployment:"
echo "  - Update .env.production with production secrets"
echo "  - Configure Vercel environment variables"
echo "  - Deploy with: ${GREEN}vercel --prod${NC}"
echo ""
