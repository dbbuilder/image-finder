const imageCache = require('./cache/image-cache');
// Near the top with your other imports
const { processImageWithOverlay } = require('./image-processor');


/**
 * Enhanced Fallback Image Generator with AI Integration
 * Attempts to use AI image generation services before falling back to static image
 */
const { createCanvas } = require('canvas');
const axios = require('axios');
const { OpenAI } = require('openai');
const sharp = require('sharp');

// Initialize OpenAI client if API key is available
const openai = process.env.OPENAI_API_KEY ? 
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/**
 * Generate a product image using available services
 * 1. Try Adobe Firefly (if credentials available)
 * 2. Try OpenAI DALL-E (if API key available)
 * 3. Try Ideogram (if API key available)
 * 4. Create a static gradient fallback image
 * 
 * @param {string} productId - Product ID to display on the image
 * @param {string} productType - Type of product
 * @param {string} brand - Brand name
 * @param {string} description - Product description
 * @param {string} upc - UPC code
 * @param {string} isbn - ISBN number
 * @returns {Promise<Buffer>} - Buffer containing the generated image

// Then modify your generateFallbackImage function to use the cache:

/**
 * Generate a product image using available services with caching
 * 1. Check cache for similar product image
 * 2. Try Adobe Firefly (if credentials available)
 * 3. Try OpenAI DALL-E (if API key available)
 * 4. Try Ideogram (if API key available)
 * 5. Create a static gradient fallback image
 * 
 * @param {string} productId - Product ID to display on the image
 * @param {string} productType - Type of product
 * @param {string} brand - Brand name
 * @param {string} description - Product description
 * @param {string} upc - UPC code
 * @param {string} isbn - ISBN number
 * @returns {Promise<Buffer>} - Buffer containing the generated image
 */
async function generateFallbackImage(productId, productType = '', brand = '', description = '', upc = '', isbn = '') {
  // Create product info object for cache lookup and later use
  const productInfo = {
    productId,
    productType,
    brand, 
    description,
    upc,
    isbn
  };
  
  // First check if we have a cached image for similar product
  const cachedImage = await imageCache.findCachedImage(productInfo);
  if (cachedImage) {
    console.log(`Using cached AI image for product ${productId}`);
    // Process the cached image with the current product ID and return
    return processImageWithOverlay(cachedImage, productInfo);
  }
  
  // Only attempt AI generation if enabled in environment
  const enableAI = process.env.ENABLE_AI_GENERATION !== 'false';
  
  let generatedImageBuffer = null;
  
  if (enableAI) {
    // Create a prompt for AI image generation
    const prompt = createAIPrompt(productType, brand, description);
    
    // Try Adobe Firefly if credentials are available
    if (process.env.ADOBE_CLIENT_ID && process.env.ADOBE_CLIENT_SECRET) {
      try {
        console.log(`Attempting Adobe Firefly for product ${productId}`);
        const fireflyImage = await generateAdobeFireflyImage(prompt);
        if (fireflyImage) {
          console.log(`Successfully generated Adobe Firefly image for product ${productId}`);
          generatedImageBuffer = fireflyImage;
        }
      } catch (error) {
        console.error(`Adobe Firefly generation failed: ${error.message}`);
      }
    }
    
    // Try OpenAI DALL-E if API key is available and we don't have an image yet
    if (!generatedImageBuffer && openai) {
      try {
        console.log(`Attempting OpenAI DALL-E for product ${productId}`);
        const dalleImage = await generateOpenAIImage(prompt);
        if (dalleImage) {
          console.log(`Successfully generated OpenAI DALL-E image for product ${productId}`);
          generatedImageBuffer = dalleImage;
        }
      } catch (error) {
        console.error(`OpenAI DALL-E generation failed: ${error.message}`);
      }
    }
    
    // Try Ideogram if API key is available and we still don't have an image
    if (!generatedImageBuffer && process.env.IDEOGRAM_API_KEY) {
      try {
        console.log(`Attempting Ideogram for product ${productId}`);
        const ideogramImage = await generateIdeogramImage(prompt);
        if (ideogramImage) {
          console.log(`Successfully generated Ideogram image for product ${productId}`);
          generatedImageBuffer = ideogramImage;
        }
      } catch (error) {
        console.error(`Ideogram generation failed: ${error.message}`);
      }
    }
    
    // If we successfully generated an image with any service, cache it and process it
    if (generatedImageBuffer) {
      // Cache the raw generated image before adding any overlays
      await imageCache.cacheImage(productInfo, generatedImageBuffer);
      
      // Process the image with product-specific overlay
      return processImageWithOverlay(generatedImageBuffer, productInfo);
    }
  }
  
  // All AI attempts failed or AI is disabled, generate static fallback image
  console.log(`Using static fallback image for product ${productId}`);
  return generateStaticFallbackImage(productId, productType, brand, description, upc, isbn);
}

/**
 * Process an AI-generated image to add product ID and ensure proper format
 * 
 * @param {Buffer} imageBuffer - AI-generated image buffer
 * @param {string} productId - Product ID to add to image
 * @returns {Promise<Buffer>} - Processed image buffer
 */
async function processAIImage(imageBuffer, productId) {
  try {
    // Resize image maintaining aspect ratio, ensuring largest dimension is 300px
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
    
    // Create a canvas to add the product ID text
    const canvas = createCanvas(resizedInfo.width, resizedInfo.height);
    const ctx = canvas.getContext('2d');
    
    // Load the resized image onto the canvas
    const image = await loadImageFromBuffer(resizedImageBuffer);
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
    console.error('Error processing AI-generated image:', error);
    throw new Error('Failed to process AI-generated image');
  }
}

/**
 * Helper function to load image from buffer
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<Image>} - Loaded image
 */
async function loadImageFromBuffer(buffer) {
  const { createCanvas, loadImage } = require('canvas');
  
  // Create a data URL from the buffer
  const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
  
  // Load the image
  return await loadImage(dataUrl);
}

/**
 * Generate a static fallback image with gradient background and white text
 * 
 * @param {string} productId - Product ID to display on the image
 * @param {string} productType - Type of product
 * @param {string} brand - Brand name
 * @param {string} description - Product description
 * @param {string} upc - UPC code
 * @param {string} isbn - ISBN number
 * @returns {Promise<Buffer>} - Buffer containing the generated image
 */
async function generateStaticFallbackImage(productId, productType, brand, description, upc, isbn) {
  try {
    // Create a blank canvas 
    const width = 300;
    const height = 300;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background (dark blue to purple)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2c3e50');    // Dark blue
    gradient.addColorStop(1, '#8e44ad');    // Purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add a subtle pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < width; i += 20) {
      for (let j = 0; j < height; j += 20) {
        ctx.fillRect(i, j, 10, 10);
      }
    }
    
    // Add a border with a slight glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Set up text rendering with shadow for better contrast
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.textAlign = 'center';
    
    // Calculate vertical positioning based on what information is available
    let yPosition = 60;
    const lineHeight = 22;
    const smallLineHeight = 16;
    
    // Product Type 
    if (productType) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.font = 'bold 20px Arial';
      
      const maxWidth = width - 40;
      let fontSize = 20;
      
      // Handle long text
      if (ctx.measureText(productType).width > maxWidth) {
        while (ctx.measureText(productType).width > maxWidth && fontSize > 14) {
          fontSize -= 1;
          ctx.font = `bold ${fontSize}px Arial`;
        }
      }
      
      ctx.fillText(truncateText(productType, maxWidth, ctx), width / 2, yPosition);
      yPosition += lineHeight;
    }
    
    // Brand
    if (brand) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '18px Arial';
      
      const maxWidth = width - 40;
      ctx.fillText(truncateText(brand, maxWidth, ctx), width / 2, yPosition);
      yPosition += lineHeight;
    }
    
    // Description (truncated if needed)
    if (description) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.font = '14px Arial';
      
      const maxWidth = width - 40;
      const lines = wrapText(description, maxWidth, ctx);
      
      // Limit to 3 lines max
      const maxLines = 3;
      for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
        ctx.fillText(lines[i], width / 2, yPosition);
        yPosition += smallLineHeight;
      }
      
      // Add ellipsis if truncated
      if (lines.length > maxLines) {
        ctx.fillText('...', width / 2, yPosition);
        yPosition += smallLineHeight;
      }
    }
    
    // UPC
    if (upc) {
      yPosition = Math.max(yPosition + 5, 190); // Ensure minimum spacing
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '13px Arial';
      ctx.fillText(`UPC: ${upc}`, width / 2, yPosition);
      yPosition += smallLineHeight;
    }
    
    // ISBN
    if (isbn) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '13px Arial';
      ctx.fillText(`ISBN: ${isbn}`, width / 2, yPosition);
      yPosition += smallLineHeight;
    }
    
    // No Image Available text
    yPosition = Math.max(yPosition + 10, 230);
    ctx.font = 'italic 15px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('No Image Available', width / 2, yPosition);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Add product ID at bottom
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(`ID: ${productId}`, width / 2, height - 15);
    
    // Add a subtle radial gradient overlay for depth
    const radialGradient = ctx.createRadialGradient(
      width / 2, height / 2, 50,
      width / 2, height / 2, width
    );
    radialGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    radialGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    ctx.fillStyle = radialGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Convert to buffer and return
    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error generating static fallback image:', error);
    throw new Error('Failed to generate static fallback image');
  }
}

/**
 * Generate image using Adobe Firefly API
 * 
 * @param {string} prompt - Text prompt for image generation
 * @returns {Promise<Buffer>} - Image buffer or null if failed
 */
async function generateAdobeFireflyImage(prompt) {
  try {
    // Adobe Firefly API configuration
    const clientId = process.env.ADOBE_CLIENT_ID;
    const clientSecret = process.env.ADOBE_CLIENT_SECRET;
    
    // Get access token
    const tokenResponse = await axios.post(
      'https://ims-na1.adobelogin.com/ims/token/v3',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'openid,AdobeID,firefly_api'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const accessToken = tokenResponse.data.access_token;
    
    // Generate image
    const response = await axios.post(
      'https://firefly-api.adobe.io/v2/images/generate',
      {
        prompt: prompt,
        contentClass: "product", 
        height: 1024,
        width: 1024,
        n: 1
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'x-api-key': clientId,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Check if we got a valid result
    if (response.data && response.data.outputs && response.data.outputs.length > 0) {
      const imageUrl = response.data.outputs[0].url;
      
      // Download the image
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      return imageResponse.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating Adobe Firefly image:', error);
    throw error;
  }
}

/**
 * Generate image using OpenAI DALL-E API
 * 
 * @param {string} prompt - Text prompt for image generation
 * @returns {Promise<Buffer>} - Image buffer or null if failed
 */
async function generateOpenAIImage(prompt) {
  try {
    // Generate image URL
    const response = await openai.images.generate({
      model: "dall-e-2",
      prompt: prompt,
      size: "256x256",
      n: 1,
    });
    
    // Get the image URL
    const imageUrl = response.data[0].url;
    
    // Download the image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return imageResponse.data;
  } catch (error) {
    console.error('Error generating OpenAI image:', error);
    throw error;
  }
}

/**
 * Generate image using Ideogram API
 * 
 * @param {string} prompt - Text prompt for image generation
 * @returns {Promise<Buffer>} - Image buffer or null if failed
 */
async function generateIdeogramImage(prompt) {
  try {
    // Ideogram API (assumes you have an API key)
    const apiKey = process.env.IDEOGRAM_API_KEY;
    
    // Generate image
    const response = await axios.post(
      'https://api.ideogram.ai/api/v1/images',
      {
        prompt: prompt,
        style: "product", // Use a style appropriate for product images
        aspect_ratio: "1:1"
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Check if we got a valid result
    if (response.data && response.data.images && response.data.images.length > 0) {
      const imageUrl = response.data.images[0].url;
      
      // Download the image
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      return imageResponse.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error generating Ideogram image:', error);
    throw error;
  }
}

/**
 * Create an optimal prompt for AI image generation based on product info
 */
function createAIPrompt(productType, brand, description) {
  // Create a base prompt template for product photography
  let prompt = "Professional product photograph with clean white background, studio lighting,";
  
  // Add product details to the prompt
  if (productType) {
    prompt += ` ${productType},`;
  }
  
  if (brand) {
    prompt += ` ${brand} brand,`;
  }
  
  if (description) {
    prompt += ` ${description},`;
  }
  
  // Add some professional photography guidelines
  prompt += " high resolution, crisp details, professional e-commerce style product photography";
  
  return prompt;
}

/**
 * Truncates text if it's longer than maxWidth
 * @param {string} text - Text to truncate
 * @param {number} maxWidth - Maximum width in pixels
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @returns {string} - Truncated text with ellipsis if needed
 */
function truncateText(text, maxWidth, ctx) {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  
  let truncatedText = text;
  while (ctx.measureText(truncatedText + '...').width > maxWidth && truncatedText.length > 0) {
    truncatedText = truncatedText.substring(0, truncatedText.length - 1);
  }
  
  return truncatedText + '...';
}

/**
 * Wraps text into multiple lines based on max width
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width in pixels
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @returns {string[]} - Array of text lines
 */
function wrapText(text, maxWidth, ctx) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine !== '') {
    lines.push(currentLine);
  }
  
  return lines;
}

module.exports = { generateFallbackImage };