/**
 * Search API Configuration and Implementation
 * This module encapsulates the search API functionality for the Image Finder API
 */
const axios = require('axios');

// Multiple API configurations for image search
const searchApis = [
  // Primary API (set in env vars)
  {
    name: 'primary',
    enabled: !!(process.env.PRIMARY_SEARCH_API_ENDPOINT && process.env.PRIMARY_SEARCH_API_KEY),
    endpoint: process.env.PRIMARY_SEARCH_API_ENDPOINT,
    key: process.env.PRIMARY_SEARCH_API_KEY,
    keyHeader: process.env.PRIMARY_SEARCH_API_KEY_HEADER || 'Authorization',
    keyPrefix: process.env.PRIMARY_SEARCH_API_KEY_PREFIX || 'Bearer ',
    queryParam: process.env.PRIMARY_SEARCH_QUERY_PARAM || 'q',
    responseParser: (data) => {
      // Custom parser based on the API structure specified in env
      const path = process.env.PRIMARY_SEARCH_RESULT_PATH?.split('.') || ['items', 0, 'link'];
      return path.reduce((obj, key) => obj && obj[key], data);
    }
  },
  // Free Pixabay API
  {
    name: 'pixabay',
    enabled: !!(process.env.PIXABAY_API_KEY),
    endpoint: 'https://pixabay.com/api/',
    key: process.env.PIXABAY_API_KEY,
    keyHeader: null, // Uses query parameter instead
    queryParam: 'q',
    params: {
      key: process.env.PIXABAY_API_KEY,
      safesearch: true,
      per_page: 3
    },
    responseParser: (data) => {
      return data.hits && data.hits.length > 0 ? data.hits[0].largeImageURL : null;
    }
  },
  // Free Unsplash API
  {
    name: 'unsplash',
    enabled: !!(process.env.UNSPLASH_ACCESS_KEY),
    endpoint: 'https://api.unsplash.com/search/photos',
    key: process.env.UNSPLASH_ACCESS_KEY,
    keyHeader: 'Authorization',
    keyPrefix: 'Client-ID ',
    queryParam: 'query',
    responseParser: (data) => {
      return data.results && data.results.length > 0 ? data.results[0].urls.regular : null;
    }
  },
  // Free Pexels API
  {
    name: 'pexels',
    enabled: !!(process.env.PEXELS_API_KEY),
    endpoint: 'https://api.pexels.com/v1/search',
    key: process.env.PEXELS_API_KEY,
    keyHeader: 'Authorization',
    keyPrefix: '',
    queryParam: 'query',
    params: {
      per_page: 1
    },
    responseParser: (data) => {
      return data.photos && data.photos.length > 0 ? data.photos[0].src.large : null;
    }
  },
  // OpenVerse API - Creative Commons images (completely free, no API key needed)
  {
    name: 'openverse',
    enabled: true,
    endpoint: 'https://api.openverse.engineering/v1/images/',
    key: null,
    queryParam: 'q',
    params: {
      license_type: 'commercial',
      page_size: 1
    },
    responseParser: (data) => {
      return data.results && data.results.length > 0 ? data.results[0].url : null;
    }
  }
];

/**
 * Search for product image using multiple external APIs
 * @param {string} query - Search query
 * @returns {Promise<string|null>} - URL of found image or null
 */
async function searchProductImage(query) {
  // Filter to only enabled APIs
  const enabledApis = searchApis.filter(api => api.enabled);
  
  if (enabledApis.length === 0) {
    console.warn('No search APIs are configured. Configure at least one search API.');
    return null;
  }
  
  // Try each API in sequence until we get a result
  for (const api of enabledApis) {
    try {
      console.log(`Trying to search image with ${api.name} API`);
      
      // Prepare request config
      const requestConfig = {
        params: {
          [api.queryParam]: query,
        }
      };
      
      // Add any additional parameters specific to this API
      if (api.params) {
        requestConfig.params = { ...requestConfig.params, ...api.params };
      }
      
      // Add API key to headers if specified
      if (api.key && api.keyHeader) {
        requestConfig.headers = {
          [api.keyHeader]: `${api.keyPrefix || ''}${api.key}`
        };
      }
      
      // For APIs that need the key as a parameter instead of a header
      if (api.key && !api.keyHeader && !requestConfig.params.key) {
        requestConfig.params.key = api.key;
      }
      
      // Make the request
      const response = await axios.get(api.endpoint, requestConfig);
      
      // Use the appropriate parser for this API
      const imageUrl = api.responseParser(response.data);
      
      if (imageUrl) {
        console.log(`Found image using ${api.name} API`);
        return imageUrl;
      }
    } catch (error) {
      console.error(`Error searching with ${api.name} API:`, error.message);
      // Continue to next API on failure
    }
  }
  
  console.log('No image found with any configured API');
  return null;
}

module.exports = { 
  searchProductImage,
  searchApis // Export for testing
};