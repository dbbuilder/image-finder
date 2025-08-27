/**
 * Azure Storage Configuration and Helper Functions
 * This module encapsulates all Azure Blob Storage operations for the Image Finder API
 */
const { BlobServiceClient } = require('@azure/storage-blob');

// Validate environment variables
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER;

if (!connectionString) {
  console.error('ERROR: AZURE_STORAGE_CONNECTION_STRING environment variable is not set');
}

if (!containerName) {
  console.error('ERROR: AZURE_STORAGE_CONTAINER environment variable is not set');
}

// Initialize the blob service client
let blobServiceClient = null;
let containerClient = null;

try {
  if (connectionString) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
  }
} catch (error) {
  console.error('Error initializing Azure Storage client:', error.message);
}

/**
 * Upload an image buffer to Azure Blob Storage
 * 
 * @param {Buffer} imageBuffer - The image data to upload
 * @param {string} fileName - The name to give the blob
 * @returns {Promise<string>} - URL of the uploaded blob
 */
async function uploadImage(imageBuffer, fileName) {
  if (!containerClient) {
    throw new Error('Azure Storage not configured. Check environment variables.');
  }

  try {
    // Get a block blob client
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    // Upload the image
    await blockBlobClient.upload(imageBuffer, imageBuffer.length, {
      blobHTTPHeaders: {
        blobContentType: 'image/png',
        blobCacheControl: 'public, max-age=86400' // Cache for 1 day
      }
    });
    
    // Return the URL to the blob
    return blockBlobClient.url;
  } catch (error) {
    console.error('Error uploading image to Azure Storage:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Check if an image exists in Azure Blob Storage
 * 
 * @param {string} fileName - The name of the blob to check
 * @returns {Promise<{exists: boolean, url: string|null}>} - Object with exists flag and URL if exists
 */
async function imageExists(fileName) {
  if (!containerClient) {
    throw new Error('Azure Storage not configured. Check environment variables.');
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    const exists = await blockBlobClient.exists();
    
    return {
      exists,
      url: exists ? blockBlobClient.url : null
    };
  } catch (error) {
    console.error('Error checking if image exists in Azure Storage:', error);
    throw new Error(`Failed to check if image exists: ${error.message}`);
  }
}

/**
 * Delete an image from Azure Blob Storage
 * 
 * @param {string} fileName - The name of the blob to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
async function deleteImage(fileName) {
  if (!containerClient) {
    throw new Error('Azure Storage not configured. Check environment variables.');
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    const exists = await blockBlobClient.exists();
    
    if (!exists) {
      return false;
    }
    
    await blockBlobClient.delete();
    return true;
  } catch (error) {
    console.error('Error deleting image from Azure Storage:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}

/**
 * Initialize the storage container if it doesn't exist
 * This should be called during application startup
 */
async function initializeStorage() {
  if (!containerClient) {
    console.warn('Azure Storage not configured. Skipping container initialization.');
    return false;
  }

  try {
    // Create the container if it doesn't exist
    const containerExists = await containerClient.exists();
    
    if (!containerExists) {
      console.log(`Container '${containerName}' does not exist. Creating...`);
      const createContainerResponse = await containerClient.create({
        access: 'blob' // Allows public read access for blobs
      });
      console.log(`Container '${containerName}' created successfully.`);
    } else {
      console.log(`Container '${containerName}' already exists.`);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing storage container:', error);
    return false;
  }
}

// Export the storage functions
module.exports = {
  uploadImage,
  imageExists,
  deleteImage,
  initializeStorage,
  isConfigured: !!containerClient
};

