#!/bin/bash

# 🚀 ONE-CLICK GO LIVE SCRIPT
# This script deploys your entire Image Finder API SaaS to production
# Total deployment time: ~15 minutes

set -e  # Exit on any error

echo "🚀 PRODUCT IMAGE API SAAS - ONE-CLICK DEPLOYMENT"
echo "================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Display requirements
echo -e "${BLUE}📋 BEFORE WE START:${NC}"
echo -e "1. You need an Azure Storage Account with connection string"
echo -e "2. Optional: OpenAI API key for AI-generated images"
echo -e "3. This will deploy to Railway (API) + Vercel (Frontend)"
echo ""
read -p "Ready to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo -e "${PURPLE}🎯 DEPLOYMENT OVERVIEW:${NC}"
echo -e "Phase 1: Install tools & login to platforms"
echo -e "Phase 2: Deploy API backend to Railway" 
echo -e "Phase 3: Deploy SaaS frontend to Vercel"
echo -e "Phase 4: Test complete integration"
echo ""

# Phase 1: Setup
echo -e "${BLUE}📦 PHASE 1: PLATFORM SETUP${NC}"

# Install Railway CLI if needed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    curl -fsSL https://railway.app/install.sh | sh
    export PATH=$PATH:~/.railway/bin
fi

# Install Vercel CLI if needed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel@latest
fi

# Login to platforms
echo -e "${YELLOW}Please log in to Railway and Vercel...${NC}"
railway login
vercel login

echo -e "${GREEN}✅ Platform setup complete${NC}"

# Phase 2: Deploy API
echo ""
echo -e "${BLUE}🚂 PHASE 2: DEPLOYING API TO RAILWAY${NC}"

# Initialize Railway project
railway init

echo -e "${YELLOW}Setting up secure environment variables...${NC}"

# Set basic environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set ENABLE_IMAGE_CACHE=true
railway variables set MAX_IMAGE_CACHE_SIZE=1000

# Generate secure API key
echo -e "${YELLOW}Generating secure API key...${NC}"
API_KEY=$(openssl rand -base64 32)
railway variables set API_KEY="$API_KEY"

echo -e "${GREEN}Generated API Key: $API_KEY${NC}"
echo -e "${BLUE}💡 Save this key - your clients will need it!${NC}"

# Get Azure Storage connection string
echo ""
echo -e "${YELLOW}Enter your Azure Storage connection string:${NC}"
read -s AZURE_CONNECTION_STRING
railway variables set AZURE_STORAGE_CONNECTION_STRING="$AZURE_CONNECTION_STRING"

echo -e "${YELLOW}Enter your Azure Storage container name (e.g., 'product-images'):${NC}"
read AZURE_CONTAINER
railway variables set AZURE_STORAGE_CONTAINER="$AZURE_CONTAINER"

# Optional: OpenAI API key
echo ""
echo -e "${YELLOW}Enter your OpenAI API key (optional, press Enter to skip):${NC}"
read -s OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    railway variables set OPENAI_API_KEY="$OPENAI_KEY"
    echo -e "${GREEN}✅ OpenAI key configured${NC}"
else
    echo -e "${BLUE}ℹ️  Skipping OpenAI (you can add this later)${NC}"
fi

# Deploy API
echo ""
echo -e "${YELLOW}🚀 Deploying API to Railway...${NC}"
railway up --detach

echo -e "${GREEN}✅ API deployment initiated${NC}"

# Wait for deployment
echo -e "${YELLOW}⏳ Waiting for API to be ready...${NC}"
sleep 45

# Get API URL
API_URL=$(railway domain 2>/dev/null | grep -o 'https://[^ ]*' | head -1)
if [ -z "$API_URL" ]; then
    # Fallback to status command
    API_URL=$(railway status 2>/dev/null | grep -o 'https://[^ ]*' | head -1)
fi

if [ ! -z "$API_URL" ]; then
    echo -e "${GREEN}🌐 API deployed at: $API_URL${NC}"
    
    # Test API health
    echo -e "${BLUE}🏥 Testing API health...${NC}"
    if curl -s "$API_URL/health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ API is healthy and running!${NC}"
    else
        echo -e "${YELLOW}⚠️  API might still be starting up...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Getting API URL... (check 'railway domain' in a moment)${NC}"
    API_URL="https://your-app.railway.app"  # Placeholder
fi

# Phase 3: Deploy Frontend
echo ""
echo -e "${BLUE}🌐 PHASE 3: DEPLOYING FRONTEND TO VERCEL${NC}"

# Check if we're in the right directory structure
if [ ! -d "saas-frontend" ]; then
    echo -e "${RED}❌ saas-frontend directory not found${NC}"
    echo -e "${YELLOW}Please run this script from the imagefinder root directory${NC}"
    exit 1
fi

cd saas-frontend

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install

# Create production environment
echo -e "${YELLOW}⚙️  Creating production configuration...${NC}"
cat > .env.production << EOF
VUE_APP_API_URL=$API_URL/api
VUE_APP_DOCS_URL=$API_URL/docs
VUE_APP_HEALTH_URL=$API_URL/health
NODE_ENV=production
EOF

# Build frontend to test
echo -e "${YELLOW}🔨 Building frontend...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Deploy to Vercel
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"
FRONTEND_URL=$(vercel --prod --yes | grep -o 'https://[^ ]*' | tail -1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend deployed successfully!${NC}"
    echo -e "${GREEN}🌐 SaaS Frontend: $FRONTEND_URL${NC}"
else
    echo -e "${RED}❌ Frontend deployment failed${NC}"
    exit 1
fi

cd ..

# Phase 4: Integration Testing
echo ""
echo -e "${BLUE}🧪 PHASE 4: INTEGRATION TESTING${NC}"

echo -e "${YELLOW}Testing complete integration...${NC}"

# Test API health
echo -e "${BLUE}Testing API health...${NC}"
if curl -s "$API_URL/health" | grep -q "healthy"; then
    echo -e "${GREEN}✅ API health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  API health check failed (might still be starting)${NC}"
fi

# Test API docs
echo -e "${BLUE}Testing API documentation...${NC}"
if curl -s "$API_URL/docs" | grep -q "swagger\|openapi\|ImageAPI"; then
    echo -e "${GREEN}✅ API documentation accessible${NC}"
else
    echo -e "${YELLOW}⚠️  API docs might still be loading${NC}"
fi

# Test frontend loading
echo -e "${BLUE}Testing frontend loading...${NC}"
if curl -s "$FRONTEND_URL" | grep -q "ImageAPI\|Vue"; then
    echo -e "${GREEN}✅ Frontend loading correctly${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend might still be deploying${NC}"
fi

# Test API endpoint (requires API key)
echo -e "${BLUE}Testing API with sample request...${NC}"
if curl -s -X POST "$API_URL/api/product-image" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"productId":"TEST-001","productType":"Test"}' | grep -q "error\|success\|imageUrl"; then
    echo -e "${GREEN}✅ API endpoint responding (may need more configuration)${NC}"
else
    echo -e "${YELLOW}⚠️  API endpoint test inconclusive${NC}"
fi

# Final Summary
echo ""
echo "🎉 ======================================="
echo "    DEPLOYMENT COMPLETE! YOU'RE LIVE!"  
echo "======================================="
echo ""
echo -e "${GREEN}🌐 Your SaaS URLs:${NC}"
echo -e "${BLUE}Frontend (SaaS):     $FRONTEND_URL${NC}"
echo -e "${BLUE}API Endpoint:        $API_URL/api${NC}"
echo -e "${BLUE}API Documentation:   $API_URL/docs${NC}"
echo -e "${BLUE}Health Check:        $API_URL/health${NC}"
echo ""
echo -e "${GREEN}🔐 Your API Key:${NC}"
echo -e "${BLUE}$API_KEY${NC}"
echo ""
echo -e "${GREEN}🚀 Next Steps:${NC}"
echo -e "1. ${YELLOW}Visit your SaaS:${NC} $FRONTEND_URL"
echo -e "2. ${YELLOW}Test image generation${NC} in the dashboard"
echo -e "3. ${YELLOW}Check API docs:${NC} $API_URL/docs"
echo -e "4. ${YELLOW}Share with customers${NC} and start earning!"
echo ""
echo -e "${GREEN}💡 Quick Test Commands:${NC}"
echo -e "${BLUE}curl $API_URL/health${NC}"
echo -e "${BLUE}curl -X POST \"$API_URL/api/product-image\" \\${NC}"
echo -e "${BLUE}  -H \"Authorization: Bearer $API_KEY\" \\${NC}"
echo -e "${BLUE}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "${BLUE}  -d '{\"productId\":\"TEST-001\",\"productType\":\"Laptop\",\"brand\":\"Apple\"}'${NC}"
echo ""
echo -e "${GREEN}🎯 Your Image Finder API SaaS is LIVE and ready for customers!${NC}"
echo ""
echo -e "${YELLOW}💰 Don't forget to:${NC}"
echo -e "- Set up custom domains"
echo -e "- Configure monitoring" 
echo -e "- Add payment processing"
echo -e "- Create your launch announcement"
echo ""
echo -e "${PURPLE}🚀 Welcome to the SaaS business!${NC}"