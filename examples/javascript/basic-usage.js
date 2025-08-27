/**
 * Basic Image Finder API Usage Examples - JavaScript/Node.js
 * 
 * This file demonstrates how to use the Image Finder API
 * in a Node.js environment with axios.
 * 
 * Install dependencies:
 * npm install axios dotenv
 */

const axios = require('axios');
require('dotenv').config();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('Error: API_KEY environment variable is required');
  process.exit(1);
}

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 30000 // 30 second timeout for image processing
});

/**
 * Example 1: Create product image for a laptop
 */
async function createLaptopImage() {
  try {
    console.log('Creating image for laptop...');
    
    const response = await apiClient.post('/product-image', {
      productId: 'LAP-001',
      productType: 'Laptop',
      brand: 'TechBrand',
      description: '15-inch gaming laptop with RTX 4070 graphics card'
    });

    console.log('✅ Success:', response.data);
    console.log('Image URL:', response.data.imageUrl);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating laptop image:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 2: Create product image using UPC code
 */
async function createProductByUPC() {
  try {
    console.log('Creating image for product with UPC...');
    
    const response = await apiClient.post('/product-image', {
      productId: 'UPC-001',
      productType: 'Electronics',
      upc: '123456789012',
      brand: 'Samsung',
      description: 'Wireless noise-cancelling headphones'
    });

    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating UPC product image:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 3: Create book image using ISBN
 */
async function createBookImage() {
  try {
    console.log('Creating image for book...');
    
    const response = await apiClient.post('/product-image', {
      productId: 'BOOK-001',
      productType: 'Book',
      isbn: '9781234567897',
      description: 'Complete guide to modern web development',
      brand: 'Tech Publisher'
    });

    console.log('✅ Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creating book image:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 4: Check if product image exists
 */
async function checkImageExists(productId) {
  try {
    console.log(`Checking if image exists for product: ${productId}...`);
    
    const response = await apiClient.get(`/product-image/${productId}`);
    
    console.log('✅ Image exists:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Image not found for product:', productId);
      return { exists: false };
    }
    console.error('❌ Error checking image:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 5: Delete product image
 */
async function deleteProductImage(productId) {
  try {
    console.log(`Deleting image for product: ${productId}...`);
    
    const response = await apiClient.delete(`/product-image/${productId}`);
    
    console.log('✅ Image deleted:', response.data);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Image not found for deletion:', productId);
      return { success: false, message: 'Image not found' };
    }
    console.error('❌ Error deleting image:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Example 6: Batch process multiple products
 */
async function batchProcessProducts() {
  const products = [
    {
      productId: 'MOUSE-001',
      productType: 'Computer Mouse',
      brand: 'Logitech',
      description: 'Wireless ergonomic mouse'
    },
    {
      productId: 'KEYBOARD-001',
      productType: 'Keyboard',
      brand: 'Corsair',
      description: 'Mechanical gaming keyboard with RGB lighting'
    },
    {
      productId: 'MONITOR-001',
      productType: 'Monitor',
      brand: 'Dell',
      description: '27-inch 4K display'
    }
  ];

  console.log('Starting batch processing...');
  const results = [];

  for (const product of products) {
    try {
      console.log(`Processing: ${product.productId}...`);
      
      const response = await apiClient.post('/product-image', product);
      results.push({
        productId: product.productId,
        success: true,
        imageUrl: response.data.imageUrl
      });
      
      console.log(`✅ Completed: ${product.productId}`);
      
      // Add delay to respect rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      results.push({
        productId: product.productId,
        success: false,
        error: error.response?.data?.error || error.message
      });
      console.error(`❌ Failed: ${product.productId} - ${error.message}`);
    }
  }

  console.log('\n📊 Batch Processing Results:');
  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.productId}: ${result.imageUrl}`);
    } else {
      console.log(`❌ ${result.productId}: ${result.error}`);
    }
  });

  return results;
}

/**
 * Example 7: Error handling and retry logic
 */
async function createImageWithRetry(productData, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries} for product: ${productData.productId}`);
      
      const response = await apiClient.post('/product-image', productData);
      console.log('✅ Success on attempt', attempt);
      return response.data;
      
    } catch (error) {
      console.log(`❌ Attempt ${attempt} failed:`, error.response?.data?.error || error.message);
      
      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }
      
      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Main function to run all examples
 */
async function runExamples() {
  console.log('🚀 Starting Image Finder API Examples\n');

  try {
    // Example 1: Create laptop image
    await createLaptopImage();
    console.log('\n---\n');

    // Example 2: Create product by UPC
    await createProductByUPC();
    console.log('\n---\n');

    // Example 3: Create book image
    await createBookImage();
    console.log('\n---\n');

    // Example 4: Check if image exists
    await checkImageExists('LAP-001');
    console.log('\n---\n');

    // Example 5: Batch processing
    await batchProcessProducts();
    console.log('\n---\n');

    // Example 6: Retry logic example
    await createImageWithRetry({
      productId: 'RETRY-001',
      productType: 'Test Product',
      description: 'Product for testing retry logic'
    });

    console.log('\n✅ All examples completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Examples failed:', error.message);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples();
}

// Export functions for use in other modules
module.exports = {
  createLaptopImage,
  createProductByUPC,
  createBookImage,
  checkImageExists,
  deleteProductImage,
  batchProcessProducts,
  createImageWithRetry,
  apiClient
};