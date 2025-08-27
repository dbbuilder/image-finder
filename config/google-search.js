/**
 * Google Custom Search API integration for product images
 */
const axios = require('axios');

/**
 * Search for product images using Google Custom Search API
 * 
 * @param {string} query - Search query
 * @returns {Promise<string|null>} - URL of the best image match or null
 */
async function searchGoogleImages(query) {
  // Check if Google API credentials are available
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
    console.log('Google Search API credentials not configured, skipping Google image search');
    return null;
  }

  try {
    console.log(`Searching Google Images for: ${query}`);
    
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        q: query,
        cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
        key: process.env.GOOGLE_API_KEY,
        searchType: 'image',
        imgSize: 'medium',       // Prefer medium-sized images
        imgType: 'photo',        // Prefer photos over illustrations
        num: 5,                  // Get 5 results to filter from
        rights: 'cc_publicdomain,cc_attribute,cc_sharealike', // Optional: focus on licensed images
        safe: 'active'           // Safe search
      }
    });
    
    // Check if we got any results
    if (response.data.items && response.data.items.length > 0) {
      // Filter for high-quality matches
      const goodMatches = filterQualityImages(response.data.items, query);
      
      if (goodMatches.length > 0) {
        console.log(`Found ${goodMatches.length} good image matches from Google`);
        return goodMatches[0].link;
      } else {
        console.log('No good quality matches found in Google results');
      }
    } else {
      console.log('No Google image search results found');
    }
    
    return null;
  } catch (error) {
    console.error('Error searching Google Images:', error.message);
    return null;
  }
}

/**
 * Filter image results for high quality matches
 * 
 * @param {Array} items - Image result items from Google API
 * @param {string} query - Original search query
 * @returns {Array} - Filtered list of good quality images
 */
function filterQualityImages(items, query) {
  // Convert query to lowercase array of terms for matching
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  return items.filter(item => {
    // Check image dimensions - filter out tiny or oddly proportioned images
    const width = parseInt(item.image?.width || 0);
    const height = parseInt(item.image?.height || 0);
    
    // Skip if dimensions are missing or invalid
    if (!width || !height) return false;
    
    // Check aspect ratio - avoid extreme rectangles
    const aspectRatio = width / height;
    if (aspectRatio < 0.5 || aspectRatio > 2) return false;
    
    // Skip very small images
    if (width < 200 || height < 200) return false;
    
    // Check for descriptive text match with query
    const titleText = (item.title || '').toLowerCase();
    const snippetText = (item.snippet || '').toLowerCase();
    
    // Count how many query terms match in the title/snippet
    const matchCount = queryTerms.filter(term => 
      titleText.includes(term) || snippetText.includes(term)
    ).length;
    
    // Require at least 50% of query terms to match
    const matchRatio = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
    return matchRatio >= 0.5;
  });
}

module.exports = { searchGoogleImages };