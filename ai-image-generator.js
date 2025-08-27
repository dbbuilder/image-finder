/**
 * AI Image Generator Module
 * Supports multiple AI image generation services with fallback
 */
const axios = require('axios');
const { OpenAI } = require('openai');
const FormData = require('form-data');
const sharp = require('sharp');
const { generateFallbackImage } = require('./fallback-image');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Try multiple AI services to generate a product image
 * Falls back through various services in order of preference
 * 
 * @param {Object} product - Product information
 * @param {string} product.productId - Product ID
 * @param {string} product.productType - Type of product
 * @param {string} product.brand - Brand name
 * @param {string} product.description - Product description
 * @param {string} product.upc - UPC code
 * @param {string} product.isbn - ISBN number
 * @returns {Promise<Buffer>} - Image buffer
 */
async function generateAIProductImage(product) {
  const { productId, productType, brand, description, upc, isbn } = product;
  
  // Create a detailed prompt for the AI service
  const prompt = createPrompt(product);
  console.log(`Generated prompt for product ${productId}: ${prompt}`);
  
  // Try Adobe Firefly first (since you have Creative Cloud)
  try {
    console.log(`Attempting to generate image with Adobe Firefly for product ${productId}`);
    const fireflyImage = await generateAdobeFireflyImage(prompt);
    if (fireflyImage) {
      console.log(`Successfully generated Adobe Firefly image for product ${productId}`);
      return processAIGeneratedImage(fireflyImage, productId);
    }
  } catch (error) {
    console.error(`Adobe Firefly generation failed for product ${productId}:`, error.message);
  }
  
  // Try OpenAI DALL-E as second option
  try {
    console.log(`Attempting to generate image with DALL-E for product ${productId}`);
    const dalleImage = await generateOpenAIImage(prompt);
    if (dalleImage) {
      console.log(`Successfully generated DALL-E image for product ${productId}`);
      return processAIGeneratedImage(dalleImage, productId);
    }
  } catch (error) {
    console.error(`DALL-E generation failed for product ${productId}:`, error.message);
  }
  
  // Try Ideogram as third option
  try {
    console.log(`Attempting to generate image with Ideogram for product ${productId}`);
    const ideogramImage = await generateIdeogramImage(prompt);
    if (ideogramImage) {
      console.log(`Successfully generated Ideogram image for product ${productId}`);
      return processAIGeneratedImage(ideogramImage, productId);
    }
  } catch (error) {
    console.error(`Ideogram generation failed for product ${productId}:`, error.message);
  }
  
  // All AI generation methods failed, fall back to the static generator
  console.log(`All AI image generation attempts failed for product ${productId}. Using static fallback.`);
  return generateFallbackImage(
    productId, 
    productType, 
    brand, 
    description,
    upc, 
    isbn
  );
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
        contentClass: "product", // Indicate it's a product image
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
    //const response = await openai.images.generate({
      //model: "dall-e-3",
      //prompt: prompt,
      //size: "1024x1024",
     // quality: "standard",
    //  n: 1,
   // });


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
 * Process AI-generated image - resize, add product ID, convert to PNG
 * 
 * @param {Buffer} imageBuffer - AI-generated image buffer
 * @param {string} productId - Product ID to add to image
 * @returns {Promise<Buffer>} - Processed image buffer
 */
async function processAIGeneratedImage(imageBuffer, productId) {
  try {
    // Process the image similarly to the main API code
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
    
    // Add product ID text (using sharp's composite feature)
    // Would need to create a text overlay image with Canvas first
    // For simplicity, just returning the resized image for now
    
    // Convert to PNG and optimize
    return processedImage
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
 * Create an optimal prompt for AI image generation based on product info
 * 
 * @param {Object} product - Product information
 * @returns {string} - Optimized prompt for AI services
 */
function createPrompt(product) {
  const { productType, brand, description } = product;
  
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

module.exports = { generateAIProductImage };