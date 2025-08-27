# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a REST API service for product image discovery, processing, and storage. The API finds matching images for products based on descriptors, processes them with watermarks, and stores them in Azure Blob Storage. It includes AI-generated fallback images and a sophisticated caching system.

## Architecture

### Core Components
- **Express.js API Server** (`app.js`) - Main REST API with endpoints for CRUD operations
- **Image Processing Pipeline** (`image-processor.js`) - Handles image resizing, watermarking, and optimization using Sharp and Canvas
- **Multi-Provider Search System** - Hierarchical search across Google Images, Pixabay, Unsplash, Pexels, and OpenVerse APIs
- **Azure Blob Storage Integration** (`config/storage.js`) - Blob upload/download with container management
- **AI Image Generation Fallback** (`fallback-image.js`) - OpenAI DALL-E integration with gradient fallback
- **Intelligent Cache System** (`cache/image-cache.js`) - MD5-based caching with LRU eviction and metadata tracking

### Search Strategy
1. **Google Images** (primary) - High-quality product matches
2. **Fallback APIs** - Pixabay, Unsplash, Pexels (configurable)
3. **AI Generation** - DALL-E for missing products
4. **Static Fallback** - Generated gradient with product info

### Middleware Stack
- **Authentication** (`middleware/auth.js`) - Bearer token validation
- **Rate Limiting** (`middleware/rate-limit.js`) - 25 requests/minute per IP
- **Error Handling** (`middleware/error-handler.js`) - Centralized error responses
- Security headers via Helmet

## Common Commands

### Development
```bash
npm run dev          # Start with nodemon for hot-reload
npm start           # Production start
npm test            # Run Jest test suite
npm run lint        # ESLint code checking
```

### Testing
```bash
# Run specific test file
npx jest tests/app.test.js

# Run tests with coverage
npx jest --coverage

# Run tests in watch mode
npx jest --watch
```

### Docker Operations
```bash
# Build container
docker build -t imagefinder .

# Run container with environment
docker run -p 3000:3000 --env-file .env imagefinder

# Production deployment
docker run -d --name imagefinder-prod -p 3000:3000 --env-file .env imagefinder
```

## Environment Configuration

### Required Variables
```bash
PORT=3000
AZURE_STORAGE_CONNECTION_STRING=your_azure_connection_string
AZURE_STORAGE_CONTAINER=your_container_name
API_KEY=your_api_key_for_authentication
```

### Search API Configuration
```bash
# Primary search API
PRIMARY_SEARCH_API_ENDPOINT=https://api.example.com/search
PRIMARY_SEARCH_API_KEY=your_key
PRIMARY_SEARCH_API_KEY_HEADER=Authorization
PRIMARY_SEARCH_API_KEY_PREFIX=Bearer
PRIMARY_SEARCH_QUERY_PARAM=q
PRIMARY_SEARCH_RESULT_PATH=items.0.link

# Image provider APIs
PIXABAY_API_KEY=your_pixabay_key
UNSPLASH_ACCESS_KEY=your_unsplash_key  
PEXELS_API_KEY=your_pexels_key
OPENAI_API_KEY=your_openai_key
```

### Cache Configuration
```bash
ENABLE_IMAGE_CACHE=true
IMAGE_CACHE_DIR=./cache/images
MAX_IMAGE_CACHE_SIZE=1000
```

## Key API Endpoints

- `POST /api/product-image` - Create/generate product image
- `GET /api/product-image/:productId` - Check if image exists
- `DELETE /api/product-image/:productId` - Remove image
- `POST /api/admin/cache/clear` - Clear image cache (authenticated)
- `GET /health` - Health check endpoint

## Testing Architecture

### Mocked Dependencies
- Azure Blob Storage SDK (`@azure/storage-blob`)
- Sharp image processing
- Canvas rendering
- Axios HTTP client
- Search API modules

### Test Coverage
- Request validation (missing fields, auth)
- Image processing pipeline
- Azure storage operations
- Cache management
- Error handling scenarios

## Development Notes

### Image Processing Pipeline
Images are processed through a multi-stage pipeline:
1. **Download** from search APIs or AI generation
2. **Resize** to max 300px maintaining aspect ratio
3. **Watermark** with product ID at bottom
4. **Optimize** PNG compression for web
5. **Upload** to Azure Blob Storage

### Cache Strategy
The cache uses MD5 hashing of normalized product attributes (type, description, brand) for consistent key generation. It implements LRU eviction based on access count and timestamps.

### Error Handling
- Graceful fallbacks at each search tier
- Azure storage connection validation
- Comprehensive error logging
- User-friendly error responses

## Production Considerations

### Performance
- Image cache reduces AI generation costs
- Rate limiting prevents abuse
- Optimized PNG compression
- Parallel search API calls

### Security
- Bearer token authentication
- Helmet security headers
- Input validation and sanitization
- Trusted IP configuration for rate limiting

### Monitoring
- Morgan access logging
- Health check endpoint
- Cache statistics tracking
- Error logging with details