#!/bin/bash

# 🚀 LIVE DEPLOYMENT SCRIPT - Image Finder API SaaS
# Run this script to deploy your API to production

set -e  # Exit on any error

echo "🚀 Starting deployment of Image Finder API to Railway..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}📋 Checking prerequisites...${NC}"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    curl -fsSL https://railway.app/install.sh | sh
    export PATH=$PATH:~/.railway/bin
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}🔐 Please log in to Railway:${NC}"
    railway login
fi

# Initialize Railway project
echo -e "${BLUE}🚂 Initializing Railway project...${NC}"
if [ ! -f "railway.json" ]; then
    railway init
fi

# Set environment variables securely
echo -e "${BLUE}🔐 Setting up secure environment variables...${NC}"
echo ""
echo -e "${YELLOW}We need to set up your environment variables securely.${NC}"
echo -e "${YELLOW}These will be encrypted and stored safely in Railway.${NC}"
echo ""

# Function to safely prompt for environment variables
set_env_var() {
    local var_name=$1
    local description=$2
    local is_secret=${3:-true}
    
    if [ "$is_secret" = true ]; then
        echo -e "${YELLOW}Enter $description:${NC}"
        read -s value
        echo ""
    else
        echo -e "${YELLOW}Enter $description:${NC}"
        read value
    fi
    
    if [ ! -z "$value" ]; then
        railway variables set $var_name="$value"
        echo -e "${GREEN}✅ Set $var_name${NC}"
    else
        echo -e "${RED}❌ Skipped $var_name (empty)${NC}"
    fi
}

# Set required environment variables
echo -e "${BLUE}Setting up required environment variables...${NC}"
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set ENABLE_IMAGE_CACHE=true
railway variables set MAX_IMAGE_CACHE_SIZE=1000

# Set Azure Storage (required)
echo -e "\n${YELLOW}🔐 AZURE STORAGE CONFIGURATION (Required)${NC}"
set_env_var "AZURE_STORAGE_CONNECTION_STRING" "Azure Storage Connection String" true
set_env_var "AZURE_STORAGE_CONTAINER" "Azure Storage Container Name (e.g., 'product-images')" false

# Set API Key (required for authentication)
echo -e "\n${YELLOW}🔐 API AUTHENTICATION${NC}"
# Generate a secure API key if not provided
if [ -z "$API_KEY_PROVIDED" ]; then
    echo -e "${YELLOW}Generating secure API key...${NC}"
    API_KEY=$(openssl rand -base64 32)
    railway variables set API_KEY="$API_KEY"
    echo -e "${GREEN}✅ Generated and set secure API_KEY${NC}"
    echo -e "${BLUE}💡 Your API key: $API_KEY${NC}"
    echo -e "${BLUE}💡 Save this key - your clients will need it!${NC}"
else
    set_env_var "API_KEY" "Your API Key for client authentication" true
fi

# Set optional API keys for better image quality
echo -e "\n${YELLOW}🎨 IMAGE SEARCH API KEYS (Optional - improves image quality)${NC}"
echo -e "${YELLOW}You can skip these and add them later in Railway dashboard${NC}"
set_env_var "OPENAI_API_KEY" "OpenAI API Key (for AI-generated images)" true
set_env_var "PIXABAY_API_KEY" "Pixabay API Key" true
set_env_var "UNSPLASH_ACCESS_KEY" "Unsplash Access Key" true
set_env_var "PEXELS_API_KEY" "Pexels API Key" true

echo -e "\n${GREEN}✅ Environment variables configured!${NC}"

# Deploy to Railway
echo -e "\n${BLUE}🚀 Deploying to Railway...${NC}"
railway up --detach

echo -e "\n${GREEN}🎉 Deployment initiated!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo -e "1. ${YELLOW}Monitor deployment: ${BLUE}railway logs${NC}"
echo -e "2. ${YELLOW}Get your domain: ${BLUE}railway domain${NC}" 
echo -e "3. ${YELLOW}Check health: Visit ${BLUE}https://your-app.railway.app/health${NC}"
echo ""
echo -e "${GREEN}🔗 Useful commands:${NC}"
echo -e "${BLUE}railway logs${NC}           - View deployment logs"
echo -e "${BLUE}railway status${NC}         - Check service status"  
echo -e "${BLUE}railway variables${NC}      - View environment variables"
echo -e "${BLUE}railway domain${NC}         - Get/set custom domain"
echo ""

# Wait for deployment
echo -e "${YELLOW}⏳ Waiting for deployment to complete...${NC}"
sleep 30

# Check health endpoint
echo -e "${BLUE}🏥 Checking API health...${NC}"
APP_URL=$(railway domain | grep -o 'https://[^ ]*' | head -1)
if [ ! -z "$APP_URL" ]; then
    echo -e "${BLUE}Testing health endpoint: $APP_URL/health${NC}"
    if curl -s "$APP_URL/health" | grep -q "healthy"; then
        echo -e "${GREEN}✅ API is healthy and running!${NC}"
        echo -e "${GREEN}🌐 Your API is live at: $APP_URL${NC}"
        echo -e "${GREEN}📚 API Documentation: $APP_URL/docs${NC}"
        echo -e "${GREEN}🔍 Health Check: $APP_URL/health${NC}"
    else
        echo -e "${YELLOW}⚠️  Health check pending - API may still be starting up${NC}"
        echo -e "${BLUE}Run 'railway logs' to monitor startup progress${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Domain not ready yet - check 'railway domain' in a moment${NC}"
fi

echo ""
echo -e "${GREEN}🎉 API deployment complete!${NC}"
echo -e "${BLUE}💡 Don't forget to deploy the frontend next!${NC}"