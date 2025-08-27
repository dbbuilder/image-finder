
// Load environment variables
require('dotenv').config();
const imageCache = require('./cache/image-cache');


const { processImageWithOverlay } = require('./image-processor');


const { searchGoogleImages } = require('./config/google-search');

console.log('ENV VARIABLES:', {
    hasAzureConnection: !!process.env.AZURE_STORAGE_CONNECTION_STRING,
    azureConnStringLength: process.env.AZURE_STORAGE_CONNECTION_STRING?.length,
    containerName: process.env.AZURE_STORAGE_CONTAINER,
  });
  


/**
 * Image Finder API
 * Finds, processes, and stores product images based on descriptors
 */
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const { authenticateRequest } = require('./middleware/auth');
const { productImageRateLimiter } = require('./middleware/rate-limit');
const storage = require('./config/storage');
const { searchProductImage } = require('./config/search-api');
const { generateFallbackImage } = require('./fallback-image');
const { errorHandler } = require('./middleware/error-handler');
const { setupSwagger } = require('./config/swagger');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Add security headers
app.use(helmet());

// Request logging
app.use(morgan('combined'));

// Parse request body
app.use(bodyParser.json());

// Setup Swagger documentation (before rate limiting and auth)
setupSwagger(app);

// Apply rate limiting middleware - 25 requests per minute
app.use('/api/product-image', productImageRateLimiter);

// Apply authentication middleware
app.use('/api/product-image', authenticateRequest);

// Initialize storage during application startup
app.on('ready', async () => {
  const initialized = await storage.initializeStorage();
  if (initialized) {
    console.log('Azure Storage initialized successfully');
  } else {
    console.warn('Failed to initialize Azure Storage');
  }
});

// API Endpoint for product image generation
app.post('/api/product-image', async (req, res) => {
  try {
    // Validate request body
    const { productId, productType, upc, isbn, description, brand } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    // At least one search parameter is required
    if (!productType && !upc && !isbn && !description && !brand) {
      return res.status(400).json({ 
        error: 'At least one of productType, upc, isbn, description, or brand is required' 
      });
    }
      
  // Build search query
  let searchQuery = '';
  if (productType) searchQuery += `${productType} `;
  if (brand) searchQuery += `${brand} `;
  if (description) searchQuery += `${description} `;
  if (upc) searchQuery += `UPC:${upc} `;
  if (isbn) searchQuery += `ISBN:${isbn}`;

  searchQuery = searchQuery.trim();

  // Create product info object to use throughout the process
  const productInfo = {
    productId,
    productType,
    brand,
    description,
    upc,
    isbn
  };

  
// First try Google Image Search for high-quality matches
let imageUrl = await searchGoogleImages(searchQuery);

// If Google search doesn't find a good match, fall back to other search APIs
if (!imageUrl) {
  console.log('No good match from Google Images, trying other search APIs');
  imageUrl = await searchProductImage(searchQuery);
}

  let imageBuffer;

  if (imageUrl) {
    // Download image if found
    try {
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      imageBuffer = imageResponse.data;
    } catch (error) {
      console.error('Error downloading image:', error);
      // If download fails, we'll use fallback image instead
      imageBuffer = null;
    }
  }

  let processedImageBuffer;

  if (imageBuffer) {
    // Apply product information overlay to the downloaded image
    console.log(`Image found from search APIs for product ${productId}. Adding text overlay.`);
    processedImageBuffer = await processImageWithOverlay(imageBuffer, productInfo);
  } else {
    // If no image found via search APIs, use the fallback generator
    // which will try AI generation first, then fall back to static gradient image
    console.log('No image found from search APIs. Using fallback generator.');
    try {
      processedImageBuffer = await generateFallbackImage(
        productId, 
        productType, 
        brand, 
        description,
        upc,
        isbn
      );
    } catch (error) {
      console.error('Error in fallback image generation:', error);
      // Create an ultra-simple fallback as last resort
      const canvas = createCanvas(300, 300);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#2c3e50'; // Dark blue background as a last resort
      ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`Product ${productId}`, 150, 150);
      processedImageBuffer = canvas.toBuffer('image/png');
    }
  }

  // Upload processed image to Azure Blob Storage
    // Upload to Azure Blob Storage
    const fileName = `temp-${productId}.png`;
    const uploadedUrl = await storage.uploadImage(processedImageBuffer, fileName);
    
    // Return success response
    return res.status(201).json({
      success: true,
      imageUrl: uploadedUrl,
      fileName
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    return res.status(500).json({ 
      error: 'Failed to process image request',
      details: error.message
    });
  }
});

// GET endpoint to check if an image exists
app.get('/api/product-image/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const fileName = `temp-${productId}.png`;
    
    const result = await storage.imageExists(fileName);
    
    if (result.exists) {
      return res.status(200).json({
        exists: true,
        imageUrl: result.url,
        fileName
      });
    } else {
      return res.status(404).json({
        exists: false,
        message: 'Image not found'
      });
    }
  } catch (error) {
    console.error('Error checking image:', error);
    return res.status(500).json({ 
      error: 'Failed to check image',
      details: error.message
    });
  }
});

// DELETE endpoint to remove an image
app.delete('/api/product-image/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const fileName = `temp-${productId}.png`;
    
    const deleted = await storage.deleteImage(fileName);
    
    if (deleted) {
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    return res.status(500).json({ 
      error: 'Failed to delete image',
      details: error.message
    });
  }
});

/**
 * Process image: resize, add product ID, and convert to PNG
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} productId - Product ID to add to image
 * @returns {Promise<Buffer>} - Processed image buffer
 */
async function processImage(imageBuffer, productId) {
  try {
    // Resize image and maintain aspect ratio, ensuring largest dimension is 300px
    let processedImage = sharp(imageBuffer);
    const metadata = await processedImage.metadata();
    
    if (metadata.width > metadata.height && metadata.width > 300) {
      processedImage = processedImage.resize({
        width: 300,
        fit: sharp.fit.inside,
        withoutEnlargement: true
      });
    } else if (metadata.height > 300) {
      processedImage = processedImage.resize({
        height: 300,
        fit: sharp.fit.inside,
        withoutEnlargement: true
      });
    }
    
    // Convert to PNG
    processedImage = processedImage.png({ quality: 90 });
    
    // Get dimensions after resize
    const resizedMetadata = await processedImage.toBuffer({ resolveWithObject: true });
    const { data: resizedImageBuffer, info: resizedInfo } = resizedMetadata;
    
    // Create a canvas to add the product ID text
    const canvas = createCanvas(resizedInfo.width, resizedInfo.height);
    const ctx = canvas.getContext('2d');
    
    // Load the resized image onto the canvas
    const image = await loadImage(resizedImageBuffer);
    ctx.drawImage(image, 0, 0);
    
    // Add product ID text at the bottom
    const fontSize = Math.max(10, Math.floor(resizedInfo.width / 30));
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    const text = `ID: ${productId}`;
    const textWidth = ctx.measureText(text).width;
    
    ctx.fillText(
      text, 
      (resizedInfo.width - textWidth) / 2, 
      resizedInfo.height - 10
    );
    
    // Convert canvas to buffer
    const finalImageBuffer = canvas.toBuffer('image/png');
    
    // Web optimize the PNG
    return sharp(finalImageBuffer)
      .png({ 
        compressionLevel: 9,
        adaptiveFiltering: true,
        quality: 85
      })
      .toBuffer();
      
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Apply error handler middleware (should be the last middleware)
app.use(errorHandler);

// Start server
const server = app.listen(port, () => {
  console.log(`Image Finder API running on port ${port}`);
  // Emit ready event after server starts
  app.emit('ready');
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});



/**
 * Cache management endpoints
 * Available only to authenticated users
 */

// Clear image cache
app.post('/api/admin/cache/clear', authenticateRequest, async (req, res) => {
  try {
    const success = await imageCache.clearCache();
    if (success) {
      return res.status(200).json({
        success: true,
        message: 'Image cache cleared successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to clear image cache'
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return res.status(500).json({ 
      error: 'Failed to clear cache',
      details: error.message
    });
  }
});

// Get cache statistics (if you want to add this feature later)
app.get('/api/admin/cache/stats', authenticateRequest, async (req, res) => {
  try {
    // In a future implementation, you could add cache statistics
    return res.status(200).json({
      success: true,
      message: 'Cache statistics endpoint (not implemented yet)'
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return res.status(500).json({ 
      error: 'Failed to get cache statistics',
      details: error.message
    });
  }
});



module.exports = app; // For testing