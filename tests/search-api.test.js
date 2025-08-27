const axios = require('axios');
const { searchProductImage } = require('../config/search-api');

// Mock axios
jest.mock('axios');

describe('Search API', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock environment variables
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });
  afterAll(() => {
    process.env = originalEnv;
  });

  describe('searchProductImage', () => {
    it('should return null if no APIs are enabled', async () => {
      // Clear any API configurations
      process.env.PRIMARY_SEARCH_API_ENDPOINT = '';
      process.env.PRIMARY_SEARCH_API_KEY = '';
      process.env.PIXABAY_API_KEY = '';
      process.env.UNSPLASH_ACCESS_KEY = '';
      process.env.PEXELS_API_KEY = '';
      
      // Mock console.warn to avoid test output noise
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await searchProductImage('laptop');
      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('No search APIs are configured')
      );
    });

    it('should use primary API if configured', async () => {
      // Configure primary API
      process.env.PRIMARY_SEARCH_API_ENDPOINT = 'https://api.example.com/search';
      process.env.PRIMARY_SEARCH_API_KEY = 'primary-api-key';
      process.env.PRIMARY_SEARCH_API_KEY_HEADER = 'Authorization';
      process.env.PRIMARY_SEARCH_API_KEY_PREFIX = 'Bearer ';
      process.env.PRIMARY_SEARCH_QUERY_PARAM = 'q';
      process.env.PRIMARY_SEARCH_RESULT_PATH = 'items.0.link';

      // Mock response from primary API
      axios.get.mockResolvedValueOnce({
        data: {
          items: [
            { link: 'https://example.com/laptop-image.jpg' }
          ]
        }
      });

      const result = await searchProductImage('laptop');
      
      expect(result).toBe('https://example.com/laptop-image.jpg');
      expect(axios.get).toHaveBeenCalledWith('https://api.example.com/search', {
        params: { q: 'laptop' },
        headers: { 'Authorization': 'Bearer primary-api-key' }
      });
    });

    it('should fall back to Pixabay if primary API fails', async () => {
      // Configure APIs
      process.env.PRIMARY_SEARCH_API_ENDPOINT = 'https://api.example.com/search';
      process.env.PRIMARY_SEARCH_API_KEY = 'primary-api-key';
      process.env.PIXABAY_API_KEY = 'pixabay-api-key';

      // Mock primary API failure
      axios.get.mockRejectedValueOnce(new Error('API error'));
      
      // Mock Pixabay success
      axios.get.mockResolvedValueOnce({
        data: {
          hits: [
            { largeImageURL: 'https://pixabay.com/laptop-image.jpg' }
          ]
        }
      });

      // Mock console.error to avoid test output noise
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await searchProductImage('laptop');
      
      expect(result).toBe('https://pixabay.com/laptop-image.jpg');
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(axios.get.mock.calls[1][0]).toBe('https://pixabay.com/api/');
      expect(axios.get.mock.calls[1][1].params).toHaveProperty('key', 'pixabay-api-key');
    });

    it('should fall back to OpenVerse if all other APIs fail', async () => {
      // Configure APIs
      process.env.PRIMARY_SEARCH_API_ENDPOINT = 'https://api.example.com/search';
      process.env.PRIMARY_SEARCH_API_KEY = 'primary-api-key';
      process.env.PIXABAY_API_KEY = 'pixabay-api-key';
      process.env.UNSPLASH_ACCESS_KEY = 'unsplash-api-key';
      process.env.PEXELS_API_KEY = 'pexels-api-key';

      // Mock all API failures except OpenVerse
      axios.get.mockRejectedValueOnce(new Error('Primary API error'));
      axios.get.mockRejectedValueOnce(new Error('Pixabay API error'));
      axios.get.mockRejectedValueOnce(new Error('Unsplash API error'));
      axios.get.mockRejectedValueOnce(new Error('Pexels API error'));
      
      // Mock OpenVerse success
      axios.get.mockResolvedValueOnce({
        data: {
          results: [
            { url: 'https://openverse.org/laptop-image.jpg' }
          ]
        }
      });

      // Mock console.error to avoid test output noise
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await searchProductImage('laptop');
      
      expect(result).toBe('https://openverse.org/laptop-image.jpg');
      expect(axios.get).toHaveBeenCalledTimes(5);
      expect(axios.get.mock.calls[4][0]).toBe('https://api.openverse.engineering/v1/images/');
    });

    it('should return null if all APIs fail', async () => {
      // Configure APIs
      process.env.PRIMARY_SEARCH_API_ENDPOINT = 'https://api.example.com/search';
      process.env.PRIMARY_SEARCH_API_KEY = 'primary-api-key';
      
      // Mock all API failures
      axios.get.mockRejectedValue(new Error('API error'));
      
      // Mock console.error and log to avoid test output noise
      jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(console, 'log').mockImplementation(() => {});

      const result = await searchProductImage('laptop');
      
      expect(result).toBeNull();
      expect(console.log).toHaveBeenCalledWith('No image found with any configured API');
    });

    it('should use Unsplash with correct authorization format', async () => {
      // Only configure Unsplash
      process.env.UNSPLASH_ACCESS_KEY = 'unsplash-api-key';
      process.env.PRIMARY_SEARCH_API_ENDPOINT = '';
      process.env.PIXABAY_API_KEY = '';

      // Mock Unsplash success
      axios.get.mockResolvedValueOnce({
        data: {
          results: [
            { urls: { regular: 'https://unsplash.com/laptop-image.jpg' } }
          ]
        }
      });

      const result = await searchProductImage('laptop');
      
      expect(result).toBe('https://unsplash.com/laptop-image.jpg');
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get.mock.calls[0][0]).toBe('https://api.unsplash.com/search/photos');
      expect(axios.get.mock.calls[0][1].headers).toHaveProperty('Authorization', 'Client-ID unsplash-api-key');
    });

    it('should use Pexels with correct authorization header', async () => {
      // Only configure Pexels
      process.env.PEXELS_API_KEY = 'pexels-api-key';
      process.env.PRIMARY_SEARCH_API_ENDPOINT = '';
      process.env.PIXABAY_API_KEY = '';
      process.env.UNSPLASH_ACCESS_KEY = '';

      // Mock Pexels success
      axios.get.mockResolvedValueOnce({
        data: {
          photos: [
            { src: { large: 'https://pexels.com/laptop-image.jpg' } }
          ]
        }
      });

      const result = await searchProductImage('laptop');
      
      expect(result).toBe('https://pexels.com/laptop-image.jpg');
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get.mock.calls[0][0]).toBe('https://api.pexels.com/v1/search');
      expect(axios.get.mock.calls[0][1].headers).toHaveProperty('Authorization', 'pexels-api-key');
    });

    it('should handle empty search results correctly', async () => {
      // Configure Pixabay only
      process.env.PIXABAY_API_KEY = 'pixabay-api-key';
      process.env.PRIMARY_SEARCH_API_ENDPOINT = '';
      
      // Mock Pixabay empty response
      axios.get.mockResolvedValueOnce({
        data: { hits: [] }
      });
      
      // Mock OpenVerse empty response
      axios.get.mockResolvedValueOnce({
        data: { results: [] }
      });

      const result = await searchProductImage('nonexistent product');
      
      expect(result).toBeNull();
      expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});