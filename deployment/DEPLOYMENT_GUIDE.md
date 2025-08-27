# Deployment Guide - Image Finder API SaaS

This guide covers deploying the Image Finder API as a complete SaaS solution using the most cost-effective platform combination.

## 🏗️ Recommended Architecture

### **Split Deployment** (Best ROI)
- **Backend API**: Railway (~$5-20/month)
- **Frontend SaaS**: Vercel (Free)
- **Database**: Railway PostgreSQL (~$5/month) 
- **Total Cost**: ~$10-25/month for full SaaS

## 🚀 Backend Deployment (Railway)

### Why Railway for API?
- ✅ **Perfect for Docker**: Native support, zero config
- ✅ **Persistent Storage**: Built-in volumes for image cache  
- ✅ **Long-running processes**: No timeout limits
- ✅ **Easy scaling**: Auto-scale based on CPU/memory
- ✅ **Database integration**: One-click PostgreSQL/Redis
- ✅ **Environment variables**: Secure secret management

### Railway Setup

1. **Connect Repository**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and init
   railway login
   railway init
   ```

2. **Configure Environment Variables**
   ```bash
   # Set environment variables in Railway dashboard
   NODE_ENV=production
   PORT=3000
   AZURE_STORAGE_CONNECTION_STRING=your_connection_string
   AZURE_STORAGE_CONTAINER=product-images
   API_KEY=your_secure_api_key
   OPENAI_API_KEY=your_openai_key
   # ... other API keys
   ```

3. **Add Persistent Volume**
   - Go to Railway dashboard
   - Add volume: `/usr/src/app/cache` (10GB recommended)
   - This preserves your image cache between deployments

4. **Deploy**
   ```bash
   railway up
   ```

### Database Setup (Railway)
```bash
# Add PostgreSQL database
railway add postgresql

# Add Redis for caching (optional)
railway add redis
```

## 🌐 Frontend Deployment (Vercel)

### Why Vercel for Frontend?
- ✅ **Free tier**: Perfect for startups
- ✅ **Vue.js optimized**: Built-in support
- ✅ **Global CDN**: Lightning-fast worldwide
- ✅ **Custom domains**: Free HTTPS certificates
- ✅ **Git integration**: Auto-deploy on push

### Vercel Setup

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Configure Environment Variables**
   ```bash
   # In saas-frontend/.env.production
   VUE_APP_API_URL=https://your-app-name.railway.app
   VUE_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
   ```

3. **Deploy**
   ```bash
   cd saas-frontend
   vercel --prod
   ```

## 💳 Add Payment Processing

### Stripe Integration
```bash
# Add to both environments
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Database Schema
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  plan VARCHAR(50) DEFAULT 'free',
  api_key VARCHAR(255) UNIQUE,
  images_used_current_month INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image generations table
CREATE TABLE image_generations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id VARCHAR(255) NOT NULL,
  image_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  cost_credits INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Alternative Deployment Options

### Option 1: All-Railway (Simplest)
- **Cost**: ~$15-30/month
- **Setup**: Single platform, easier management
- **Frontend**: Railway static site hosting

### Option 2: Render.com (Railway Alternative)
- **Cost**: Similar to Railway
- **Pros**: Good documentation, stable platform
- **Cons**: Less modern than Railway

### Option 3: DigitalOcean App Platform
- **Cost**: $12+/month
- **Pros**: Predictable pricing, good performance  
- **Cons**: Less flexible than Railway

### Option 4: Cloudflare Pages + Railway
- **Frontend**: Cloudflare Pages (Free, fast)
- **Backend**: Railway API
- **Pros**: Best performance globally
- **Setup**: More complex CORS configuration

## 📊 Cost Comparison

| Platform Combination | Monthly Cost | Scaling | Complexity |
|-----------------------|--------------|---------|------------|
| **Railway + Vercel** | $10-25 | Excellent | Low |
| All-Railway | $15-30 | Good | Very Low |
| Render + Vercel | $10-25 | Good | Low |
| Azure Container Apps | $30-100+ | Excellent | High |
| AWS/GCP | $25-75+ | Excellent | High |

## 🚀 Quick Start Commands

```bash
# 1. Deploy API to Railway
cd /path/to/imagefinder
railway init
railway up

# 2. Deploy Frontend to Vercel  
cd saas-frontend
vercel --prod

# 3. Configure custom domains
vercel domains add yourdomain.com
railway domain add api.yourdomain.com
```

## 🔒 Production Checklist

### Security
- [ ] API keys in environment variables (not code)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] SSL certificates enabled
- [ ] Stripe webhooks configured

### Monitoring  
- [ ] Health check endpoints working
- [ ] Error logging configured
- [ ] Performance monitoring setup
- [ ] Database backups enabled
- [ ] Uptime monitoring (UptimeRobot/Pingdom)

### Business
- [ ] Stripe payment processing working
- [ ] Email notifications configured
- [ ] Analytics tracking setup
- [ ] Terms of service & privacy policy
- [ ] Customer support system

## 🎯 Scaling Strategy

### Phase 1: MVP (Railway + Vercel)
- Cost: ~$10-25/month
- Handles: ~10K API calls/month
- Users: 0-100

### Phase 2: Growth (Add Redis + CDN)
- Cost: ~$25-50/month  
- Handles: ~100K API calls/month
- Users: 100-1000

### Phase 3: Scale (Consider microservices)
- Cost: ~$100+/month
- Handles: 1M+ API calls/month
- Users: 1000+
- Consider: Dedicated image processing workers

## 🆘 Support & Troubleshooting

### Common Issues
1. **Image processing timeouts**: Check Railway CPU limits
2. **Storage issues**: Verify persistent volume mounted
3. **API key errors**: Check environment variables
4. **CORS errors**: Verify frontend/backend domain configuration

### Getting Help
- Railway: https://docs.railway.app
- Vercel: https://vercel.com/docs
- Stripe: https://stripe.com/docs

This architecture gives you enterprise-grade reliability at startup prices!