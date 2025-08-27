# Image Finder API Documentation

## Overview

This REST API service handles product image discovery, processing, and storage. It accepts product identifiers and descriptions, finds a matching image, processes it to add a product ID watermark, optimizes it for web, and stores it in Azure Blob Storage.

## Base URL

```
https://your-domain.com/api
```

## Authentication

This API requires authentication. Please include your API key in the request header:

```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Create Product Image

Finds, processes, and stores a product image based on provided identifiers.

**URL**: `/product-image`

**Method**: `POST`

**Request Body**:

```json
{
  "productId": "ABC123",            // Required: Unique identifier for the product
  "productType": "Laptop",          // Optional: Type of product
  "upc": "123456789012",            // Optional: Universal Product Code
  "isbn": "9781234567897",          // Optional: International Standard Book Number
  "description": "15-inch laptop",  // Optional: Product description
  "brand": "TechBrand"              // Optional: Brand or product line
}
```

**Note**: At least one search parameter (productType, upc, isbn, description, or brand) is required in addition to the productId.

**Success Response (201 Created)**:

```json
{
  "success": true,
  "imageUrl": "https://yourstorage.blob.core.windows.net/products/temp-ABC123.png",
  "fileName": "temp-ABC123.png"
}
```

**Error Responses**:

- **400 Bad Request**: Missing required fields
- **404 Not Found**: No suitable image found
- **500 Internal Server Error**: Server-side processing error

### Check if Image Exists

Checks if a processed image exists for a given product ID.

**URL**: `/product-image/:productId`

**Method**: `GET`

**URL Parameters**:

- `productId`: The product identifier

**Success Response (200 OK)**:

```json
{
  "exists": true,
  "imageUrl": "https://yourstorage.blob.core.windows.net/products/temp-ABC123.png",
  "fileName": "temp-ABC123.png"
}
```

**Error Response (404 Not Found)**:

```json
{
  "exists": false,
  "message": "Image not found"
}
```

### Delete Product Image

Removes a product image from storage.

**URL**: `/product-image/:productId`

**Method**: `DELETE`

**URL Parameters**:

- `productId`: The product identifier

**Success Response (200 OK)**:

```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

**Error Response (404 Not Found)**:

```json
{
  "success": false,
  "message": "Image not found"
}
```

## Image Processing Details

- Images are resized so the largest dimension is 300 pixels while maintaining aspect ratio
- All images are converted to PNG format
- Product ID is added as a small watermark at the bottom of the image
- Images are optimized for web performance

### Fallback Image Generation

If no suitable image is found across all configured search APIs, the service automatically generates a basic fallback image containing:

- Product type (if provided)
- Brand name (if provided)
- Product ID
- A simple placeholder design

This ensures that your application always receives an image URL, even when no matching image can be found online.

## Rate Limiting

The API is limited to 25 requests per IP address per minute. This helps prevent abuse and ensures fair usage of the service.

Requests that exceed this limit will receive a 429 (Too Many Requests) response with information about when to retry.

The API provides rate limit information in the response headers:
- `RateLimit-Limit`: Maximum number of requests allowed per window
- `RateLimit-Remaining`: Number of requests remaining in the current window
- `RateLimit-Reset`: Time when the rate limit window resets (in seconds)

If you need to make more frequent requests from trusted servers, you can configure them in the `TRUSTED_IPS` environment variable.

## Environment Setup

Required environment variables:

```
PORT=3000
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER=your_container_name
```

### Image Search API Configuration

The API supports multiple image search providers with automatic fallback. You can configure any or all of the following:

```
# Primary/Custom API
PRIMARY_SEARCH_API_ENDPOINT=https://api.example.com/search
PRIMARY_SEARCH_API_KEY=your_primary_api_key
PRIMARY_SEARCH_API_KEY_HEADER=Authorization
PRIMARY_SEARCH_API_KEY_PREFIX=Bearer 
PRIMARY_SEARCH_QUERY_PARAM=q
PRIMARY_SEARCH_RESULT_PATH=items.0.link

# Free APIs (with registration)
PIXABAY_API_KEY=your_pixabay_api_key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
PEXELS_API_KEY=your_pexels_api_key
```

Note: OpenVerse API (Creative Commons images) is always enabled as a fallback and requires no API key.

## Dependencies

- Node.js 16+
- Express.js
- Azure Blob Storage SDK
- Sharp (for image processing)
- Node-canvas (for adding text to images)

## npm install express body-parser axios sharp canvas dotenv morgan helmet express-rate-limit @azure/storage-blob
## npm install openai@^4.0.0 form-data@^4.0.0
