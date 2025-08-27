#!/bin/bash

# 🌐 FRONTEND DEPLOYMENT SCRIPT - Vue.js SaaS to Vercel
# Run this script to deploy your SaaS frontend

set -e  # Exit on any error

echo "🌐 Starting deployment of Vue.js SaaS Frontend to Vercel..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the saas-frontend directory${NC}"
    exit 1
fi

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required. Please install Node.js first.${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is required. Please install npm first.${NC}"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel@latest
fi

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

# Get API URL from user
echo -e "\n${YELLOW}🔗 BACKEND API CONFIGURATION${NC}"
echo -e "${YELLOW}Enter your Railway API URL (from previous step):${NC}"
echo -e "${BLUE}Format: https://your-app-name.railway.app${NC}"
read -p "API URL: " API_URL

# Validate API URL
if [ -z "$API_URL" ]; then
    echo -e "${RED}❌ API URL is required${NC}"
    exit 1
fi

# Remove trailing slash if present
API_URL=$(echo "$API_URL" | sed 's:/*$::')

# Create production environment file
echo -e "${BLUE}⚙️  Creating production environment configuration...${NC}"
cat > .env.production << EOF
VUE_APP_API_URL=$API_URL/api
VUE_APP_DOCS_URL=$API_URL/docs
VUE_APP_HEALTH_URL=$API_URL/health
NODE_ENV=production
EOF

echo -e "${GREEN}✅ Environment configuration created${NC}"

# Build the project to test
echo -e "${BLUE}🔨 Testing build...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors and try again.${NC}"
    exit 1
fi

# Deploy to Vercel
echo -e "\n${BLUE}🚀 Deploying to Vercel...${NC}"

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Vercel:${NC}"
    vercel login
fi

# Deploy
echo -e "${BLUE}Deploying to production...${NC}"
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Frontend deployment successful!${NC}"
    
    # Get deployment URL
    FRONTEND_URL=$(vercel --prod --yes | grep -o 'https://[^ ]*' | tail -1)
    if [ ! -z "$FRONTEND_URL" ]; then
        echo -e "${GREEN}🌐 Your SaaS is live at: $FRONTEND_URL${NC}"
        
        # Test the deployment
        echo -e "\n${BLUE}🧪 Testing deployment...${NC}"
        if curl -s "$FRONTEND_URL" | grep -q "ImageAPI"; then
            echo -e "${GREEN}✅ Frontend is loading correctly!${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend might still be deploying...${NC}"
        fi
        
        echo -e "\n${GREEN}📋 DEPLOYMENT SUMMARY${NC}"
        echo -e "${BLUE}Frontend URL: $FRONTEND_URL${NC}"
        echo -e "${BLUE}API URL: $API_URL${NC}"
        echo -e "${BLUE}Documentation: $API_URL/docs${NC}"
        echo -e "${BLUE}Health Check: $API_URL/health${NC}"
        
    fi
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 SAAS DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${BLUE}🔧 Next Steps:${NC}"
echo -e "1. ${YELLOW}Test your API: ${BLUE}curl $API_URL/health${NC}"
echo -e "2. ${YELLOW}Browse docs: ${BLUE}$API_URL/docs${NC}"
echo -e "3. ${YELLOW}Test SaaS: ${BLUE}$FRONTEND_URL${NC}"
echo -e "4. ${YELLOW}Set up custom domain (optional)${NC}"
echo -e "5. ${YELLOW}Configure monitoring${NC}"
echo ""
echo -e "${GREEN}🔗 Useful Vercel commands:${NC}"
echo -e "${BLUE}vercel --prod${NC}         - Redeploy to production"
echo -e "${BLUE}vercel logs${NC}           - View deployment logs"
echo -e "${BLUE}vercel domains${NC}        - Manage custom domains"
echo -e "${BLUE}vercel env${NC}            - Manage environment variables"