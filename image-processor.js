/**
 * Enhanced Image Processing
 * For use with all image sources (search APIs, AI, and fallback)
 */
const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

/**
 * Process any image (from search, AI, or static) with text overlay
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} productInfo - Product details for text overlay
 * @returns {Promise<Buffer>} - Processed image buffer
 */
async function processImageWithOverlay(imageBuffer, productInfo) {
  try {
    const { productId, productType, brand, description, upc, isbn } = productInfo;
    
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
    
    // Get dimensions after resize
    const resizedMetadata = await processedImage.toBuffer({ resolveWithObject: true });
    const { data: resizedImageBuffer, info: resizedInfo } = resizedMetadata;
    
    // Create a canvas to add text overlays
    const canvas = createCanvas(resizedInfo.width, resizedInfo.height);
    const ctx = canvas.getContext('2d');
    
    // Load the resized image onto the canvas
    const image = await loadImageFromBuffer(resizedImageBuffer);
    ctx.drawImage(image, 0, 0);
    
    // Add semi-transparent overlay bar at the bottom for text
    const overlayHeight = determineOverlayHeight(productInfo);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, resizedInfo.height - overlayHeight, resizedInfo.width, overlayHeight);
    
    // Set up text rendering
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    // Add product information
    const textY = addProductInfoOverlay(ctx, productInfo, resizedInfo.width, resizedInfo.height);
    
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
    console.error('Error processing image with overlay:', error);
    throw new Error('Failed to process image with overlay');
  }
}

/**
 * Determines how tall the overlay bar should be based on available product info
 * @param {Object} productInfo - Product details
 * @returns {number} - Height in pixels
 */
function determineOverlayHeight(productInfo) {
  const { productType, brand, description, upc, isbn } = productInfo;
  let count = 0;
  
  if (productType) count++;
  if (brand) count++;
  if (description) count++;
  if (upc || isbn) count++;
  
  // Base height plus additional height per field
  return Math.max(30, count * 18 + 10);
}

/**
 * Add product information as text overlay
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} productInfo - Product information
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {number} - Y position after adding text
 */
function addProductInfoOverlay(ctx, productInfo, width, height) {
  const { productId, productType, brand, description, upc, isbn } = productInfo;
  const maxTextWidth = width - 20;
  
  // Start position at the bottom of the overlay
  const overlayHeight = determineOverlayHeight(productInfo);
  let yPos = height - overlayHeight + 18; // Start with padding from top of overlay
  
  // Add product type and brand on the same line if both are short
  if (productType && brand && 
      ctx.measureText(productType + ' - ' + brand).width <= maxTextWidth) {
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`${productType} - ${brand}`, width / 2, yPos);
    yPos += 16;
  } else {
    // Otherwise add them separately
    if (productType) {
      ctx.font = 'bold 12px Arial';
      ctx.fillText(truncateText(productType, maxTextWidth, ctx), width / 2, yPos);
      yPos += 16;
    }
    
    if (brand) {
      ctx.font = '12px Arial';
      ctx.fillText(truncateText(brand, maxTextWidth, ctx), width / 2, yPos);
      yPos += 16;
    }
  }
  
  // Add shortened description
  if (description) {
    ctx.font = 'italic 11px Arial';
    ctx.fillText(truncateText(description, maxTextWidth, ctx), width / 2, yPos);
    yPos += 16;
  }
  
  // Add UPC/ISBN if available
  if (upc || isbn) {
    const idText = upc ? `UPC: ${upc}` : `ISBN: ${isbn}`;
    ctx.font = '10px Arial';
    ctx.fillText(truncateText(idText, maxTextWidth, ctx), width / 2, yPos);
    yPos += 14;
  }
  
  // Always add product ID at the very bottom
  ctx.font = '10px Arial';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fillText(`ID: ${productId}`, width / 2, height - 5);
  
  return yPos;
}

/**
 * Helper function to load image from buffer
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Image>} - Loaded image
 */
async function loadImageFromBuffer(buffer) {
  const { loadImage } = require('canvas');
  
  // Create a data URL from the buffer
  const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
  
  // Load the image
  return await loadImage(dataUrl);
}

/**
 * Truncates text if it's longer than maxWidth
 * @param {string} text - Text to truncate
 * @param {number} maxWidth - Maximum width in pixels
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @returns {string} - Truncated text with ellipsis if needed
 */
function truncateText(text, maxWidth, ctx) {
  if (!text) return '';
  
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  let truncatedText = text;
  while (ctx.measureText(truncatedText + '...').width > maxWidth && truncatedText.length > 0) {
    truncatedText = truncatedText.substring(0, truncatedText.length - 1);
  }
  
  return truncatedText + '...';
}

module.exports = { processImageWithOverlay };