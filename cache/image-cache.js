/**
 * Image Cache Module
 * Stores and retrieves AI-generated images based on product attributes
 * to minimize redundant AI image generation
 */
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

// Configuration
const CACHE_DIR = process.env.IMAGE_CACHE_DIR || path.join(__dirname, '../cache/images');
const CACHE_METADATA_FILE = path.join(CACHE_DIR, 'metadata.json');
const MAX_CACHE_SIZE = parseInt(process.env.MAX_IMAGE_CACHE_SIZE || '1000');
const CACHE_ENABLED = process.env.ENABLE_IMAGE_CACHE !== 'false';

// In-memory cache for faster lookups
let cacheMetadata = {};
let cacheInitialized = false;

/**
 * Initialize the cache directory and load metadata
 * @returns {Promise<boolean>} - Success status
 */
async function initializeCache() {
  if (!CACHE_ENABLED) {
    console.log('Image cache is disabled');
    return false;
  }

  try {
    // Create cache directory if it doesn't exist
    try {
      await fs.mkdir(CACHE_DIR, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }

    // Load cache metadata if exists
    try {
      const data = await fs.readFile(CACHE_METADATA_FILE, 'utf8');
      cacheMetadata = JSON.parse(data);
      console.log(`Loaded ${Object.keys(cacheMetadata).length} cached image entries`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Error loading cache metadata:', err);
      }
      cacheMetadata = {};
    }

    cacheInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize image cache:', error);
    return false;
  }
}

/**
 * Save cache metadata to disk
 * @returns {Promise<boolean>} - Success status
 */
async function saveCacheMetadata() {
  if (!CACHE_ENABLED || !cacheInitialized) return false;

  try {
    await fs.writeFile(CACHE_METADATA_FILE, JSON.stringify(cacheMetadata, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving cache metadata:', error);
    return false;
  }
}

/**
 * Generate a cache key based on product attributes
 * @param {Object} productInfo - Product information
 * @returns {string} - Cache key
 */
function generateCacheKey(productInfo) {
  const { productType, description, brand } = productInfo;
  
  // Normalize text for consistent key generation
  const normalizeText = (text) => (text || '').toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Combine the key elements in a way that focuses on the core attributes
  const keyElements = [
    normalizeText(productType),
    normalizeText(description).substring(0, 100), // Limit description length
    normalizeText(brand)
  ].filter(Boolean).join('|');
  
  // Generate a hash for the key
  return crypto.createHash('md5').update(keyElements).digest('hex');
}

/**
 * Find a similar image in the cache based on product attributes
 * @param {Object} productInfo - Product information to match
 * @returns {Promise<Buffer|null>} - Image buffer if found, null otherwise
 */
async function findCachedImage(productInfo) {
  if (!CACHE_ENABLED || !cacheInitialized) return null;

  try {
    const cacheKey = generateCacheKey(productInfo);
    
    // Check if we have a direct match
    if (cacheMetadata[cacheKey]) {
      const cachedInfo = cacheMetadata[cacheKey];
      const imagePath = path.join(CACHE_DIR, cachedInfo.filename);
      
      try {
        // Check if file exists and read it
        const imageBuffer = await fs.readFile(imagePath);
        console.log(`Cache hit: Found image for ${productInfo.productType} / ${productInfo.brand}`);
        
        // Update access information
        cachedInfo.lastAccessed = Date.now();
        cachedInfo.accessCount++;
        await saveCacheMetadata();
        
        return imageBuffer;
      } catch (readError) {
        if (readError.code === 'ENOENT') {
          // File doesn't exist, remove from metadata
          delete cacheMetadata[cacheKey];
          await saveCacheMetadata();
        }
      }
    }
    
    // If we get here, we didn't find a direct match
    return null;
  } catch (error) {
    console.error('Error finding cached image:', error);
    return null;
  }
}

/**
 * Store an image in the cache
 * @param {Object} productInfo - Product information
 * @param {Buffer} imageBuffer - Image data to cache
 * @returns {Promise<boolean>} - Success status
 */
async function cacheImage(productInfo, imageBuffer) {
  if (!CACHE_ENABLED || !cacheInitialized) return false;

  try {
    const cacheKey = generateCacheKey(productInfo);
    const filename = `${cacheKey}.png`;
    const imagePath = path.join(CACHE_DIR, filename);
    
    // Store the image
    await fs.writeFile(imagePath, imageBuffer);
    
    // Update metadata
    cacheMetadata[cacheKey] = {
      filename,
      productType: productInfo.productType,
      brand: productInfo.brand,
      descriptionSummary: (productInfo.description || '').substring(0, 50) + '...',
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 1
    };
    
    // Prune cache if it's getting too large
    await pruneCache();
    
    // Save updated metadata
    await saveCacheMetadata();
    
    console.log(`Cached image for ${productInfo.productType} / ${productInfo.brand}`);
    return true;
  } catch (error) {
    console.error('Error caching image:', error);
    return false;
  }
}

/**
 * Remove least used or oldest entries when cache exceeds maximum size
 * @returns {Promise<void>}
 */
async function pruneCache() {
  const cacheSize = Object.keys(cacheMetadata).length;
  
  if (cacheSize <= MAX_CACHE_SIZE) return;
  
  // Calculate how many items to remove
  const itemsToRemove = cacheSize - MAX_CACHE_SIZE;
  
  // Convert to array and sort by access count and last accessed time
  const entries = Object.entries(cacheMetadata).map(([key, info]) => ({
    key,
    ...info
  }));
  
  // Sort entries (less frequently accessed and older entries first)
  entries.sort((a, b) => {
    // First compare by access count
    if (a.accessCount !== b.accessCount) {
      return a.accessCount - b.accessCount;
    }
    // Then by last accessed time
    return a.lastAccessed - b.lastAccessed;
  });
  
  // Remove the least important entries
  const entriesToRemove = entries.slice(0, itemsToRemove);
  
  for (const entry of entriesToRemove) {
    try {
      const imagePath = path.join(CACHE_DIR, entry.filename);
      await fs.unlink(imagePath);
      delete cacheMetadata[entry.key];
      console.log(`Pruned cached image: ${entry.productType} / ${entry.brand}`);
    } catch (error) {
      console.error(`Error pruning cache entry ${entry.key}:`, error);
    }
  }
}

/**
 * Clear the entire image cache
 * @returns {Promise<boolean>} - Success status
 */
async function clearCache() {
  if (!cacheInitialized) await initializeCache();
  
  try {
    // Get all files in the cache directory
    const files = await fs.readdir(CACHE_DIR);
    
    // Delete all image files
    for (const file of files) {
      if (file.endsWith('.png')) {
        await fs.unlink(path.join(CACHE_DIR, file));
      }
    }
    
    // Reset metadata
    cacheMetadata = {};
    await saveCacheMetadata();
    
    console.log('Image cache cleared');
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

// Initialize cache on module load
initializeCache();

module.exports = {
  findCachedImage,
  cacheImage,
  clearCache
};