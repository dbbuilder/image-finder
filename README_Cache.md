# AI Image Cache System Documentation

The image cache system optimizes your Image Finder API by storing and reusing AI-generated images for similar products. This significantly reduces the number of API calls to expensive AI image generation services.

## How It Works

1. **Similarity-Based Caching**:
   - Images are cached based on product type, description, and brand
   - Product-specific details (ID, UPC, ISBN) are applied as overlays

2. **Intelligent Key Generation**:
   - Creates a hash key from normalized product attributes
   - Focuses on the most significant descriptive elements

3. **Cache Management**:
   - Automatically prunes least-used entries when the cache grows too large
   - Tracks usage statistics for each cached image
   - Provides admin endpoints to clear the cache

## Configuration

In your `.env` file:

```
# Image Cache Configuration
ENABLE_IMAGE_CACHE=true              # Enable/disable the cache system
IMAGE_CACHE_DIR=./cache/images       # Directory to store cached images
MAX_IMAGE_CACHE_SIZE=1000            # Maximum number of images to keep in cache
```

## Cache Process Flow

1. **Cache Lookup**:
   - Before making any AI API calls, check if a similar product image exists
   - If found, retrieve and apply the current product ID overlay

2. **Cache Storage**:
   - When an AI service successfully generates an image, store it in the cache
   - The raw image (before product-specific overlays) is cached
   - Metadata is stored separately for efficient lookups

3. **Cache Maintenance**:
   - Least frequently accessed images are removed when the cache exceeds its size limit
   - Cache metadata is persistent between application restarts

## Benefits

1. **Cost Reduction**:
   - Minimizes expensive AI API calls by reusing images for similar products
   - One AI-generated image can serve multiple similar products

2. **Improved Performance**:
   - Cached images load instantly, eliminating AI generation wait times
   - Reduces dependency on external API availability

3. **Consistent Appearance**:
   - Products with similar descriptions get similar base images
   - Overlays still provide product-specific information

## Administration

The following API endpoints are available for cache management:

- `POST /api/admin/cache/clear` - Clear all cached images
- `GET /api/admin/cache/stats` - View cache statistics (future implementation)

Both endpoints require the same authentication as your main product image API.

## Technical Details

The cache system consists of:

1. **File-based Storage**:
   - Raw images stored as PNG files
   - Metadata stored in a JSON file

2. **In-memory Index**:
   - Fast lookups using an in-memory cache of metadata
   - Automatically synchronized with the file system

3. **Similarity Algorithm**:
   - MD5 hash of normalized product attributes
   - Focuses on product type and descriptive elements
   - Ignores minor differences in formatting