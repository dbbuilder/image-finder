# Getting Started with Image Finder API

This guide will help you set up and start using the Image Finder API in just a few minutes.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Azure Storage Account (or Docker for local testing)
- API key for authentication

### 1. Installation

```bash
# Clone the repository (or download the package)
git clone <repository-url>
cd imagefinder

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configuration

Edit your `.env` file with your settings:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Authentication
API_KEY=your-secure-api-key-here

# Azure Storage (Required)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=product-images

# Image Search APIs (Optional - enhances search quality)
PIXABAY_API_KEY=your-pixabay-key
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key
OPENAI_API_KEY=your-openai-key

# Cache Configuration
ENABLE_IMAGE_CACHE=true
MAX_IMAGE_CACHE_SIZE=1000
```

### 3. Start the Server

```bash
# Development mode (with hot-reload)
npm run dev

# Production mode
npm start
```

### 4. Verify Installation

Open your browser to `http://localhost:3000` - you should see the API documentation!

## 📖 API Documentation

- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI Spec**: `http://localhost:3000/api-docs`

## 🔧 Configuration Guide

### Azure Storage Setup

1. Create an Azure Storage Account
2. Create a container named `product-images`
3. Set public read access for the container
4. Copy the connection string to your `.env` file

### API Keys Setup

#### Required
- **API_KEY**: Create a secure random string for client authentication

#### Optional (improves image search quality)
- **PIXABAY_API_KEY**: Register at https://pixabay.com/api/docs/
- **UNSPLASH_ACCESS_KEY**: Register at https://unsplash.com/developers
- **PEXELS_API_KEY**: Register at https://www.pexels.com/api/
- **OPENAI_API_KEY**: Get from https://platform.openai.com/api-keys

## 💡 Usage Examples

### cURL
```bash
# Create a product image
curl -X POST http://localhost:3000/api/product-image \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "LAP-001",
    "productType": "Laptop",
    "brand": "Dell",
    "description": "15-inch gaming laptop"
  }'

# Check if image exists
curl -H "Authorization: Bearer your-api-key" \
  http://localhost:3000/api/product-image/LAP-001
```

### JavaScript
```javascript
const response = await fetch('http://localhost:3000/api/product-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'LAP-001',
    productType: 'Laptop',
    brand: 'Dell',
    description: '15-inch gaming laptop'
  })
});

const result = await response.json();
console.log('Image URL:', result.imageUrl);
```

### Python
```python
import requests

response = requests.post('http://localhost:3000/api/product-image', 
  headers={
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  },
  json={
    'productId': 'LAP-001',
    'productType': 'Laptop',
    'brand': 'Dell',
    'description': '15-inch gaming laptop'
  }
)

result = response.json()
print('Image URL:', result['imageUrl'])
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npx jest tests/app.test.js
```

## 🐳 Docker Deployment

### Local Development
```bash
# Build and run with Docker
docker build -t image-finder .
docker run -p 3000:3000 --env-file .env image-finder
```

### Production with Docker Compose
```bash
cd deployment
docker-compose -f docker-compose.production.yml up -d
```

## 🔍 Troubleshooting

### Common Issues

**1. "Azure Storage not configured" error**
- Check your `AZURE_STORAGE_CONNECTION_STRING` in `.env`
- Ensure the storage account exists and is accessible

**2. Images not generating**
- Verify at least one image search API key is configured
- Check the logs for specific error messages

**3. Authentication errors**
- Ensure you're sending the `Authorization: Bearer <api-key>` header
- Verify your API key matches the one in `.env`

**4. Rate limiting**
- Default limit is 25 requests per minute per IP
- Check response headers for rate limit information

### Getting Help

1. Check the [API Documentation](http://localhost:3000/docs)
2. Review the [examples directory](./examples/)
3. Look at the server logs for error details
4. Ensure all required environment variables are set

## 🚀 Deployment Options

### Azure Container Apps (Recommended)
- Serverless scaling
- Built-in load balancing
- Easy CI/CD integration
- See `deployment/azure-container-apps.yaml`

### Traditional VPS/Server
- Use the included Dockerfile
- Set up reverse proxy (nginx/apache)
- Configure SSL certificates
- Monitor with your preferred tools

### Kubernetes
- Use the Docker image as a base
- Configure resource limits
- Set up horizontal pod autoscaling
- See examples in `deployment/` directory

## 📈 Production Checklist

- [ ] Secure API keys (use Azure Key Vault or similar)
- [ ] Configure proper CORS settings
- [ ] Set up monitoring and alerting
- [ ] Configure log aggregation
- [ ] Enable HTTPS/SSL
- [ ] Set resource limits appropriate for your usage
- [ ] Configure backup strategy for cache
- [ ] Test rate limiting configuration
- [ ] Set up health check monitoring

## 📝 Support

For issues and questions:
- Check the documentation at `/docs`
- Review example code in `/examples`
- Check server logs for error details