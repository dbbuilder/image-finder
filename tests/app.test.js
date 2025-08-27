const request = require('supertest');
const { BlobServiceClient } = require('@azure/storage-blob');
const app = require('../app');

// Mock dependencies
jest.mock('@azure/storage-blob');
jest.mock('axios');
jest.mock('sharp', () => {
  return jest.fn().mockImplementation(() => {
    return {
      resize: jest.fn().mockReturnThis(),
      png: jest.fn().mockReturnThis(),
      metadata: jest.fn().mockResolvedValue({ width: 400, height: 300 }),
      toBuffer: jest.fn().mockImplementation((options) => {
        if (options && options.resolveWithObject) {
          return Promise.resolve({
            data: Buffer.from('mock-image-data'),
            info: { width: 300, height: 200 }
          });
        }
        return Promise.resolve(Buffer.from('mock-image-data'));
      })
    };
  });
});
jest.mock('canvas', () => {
  const mockContext = {
    fillStyle: '',
    font: '',
    fillRect: jest.fn(),
    fillText: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 100 }),
    drawImage: jest.fn(),
    strokeStyle: '',
    lineWidth: 0,
    strokeRect: jest.fn(),
    textAlign: ''
  };
  
  const mockCanvas = {
    getContext: jest.fn().mockReturnValue(mockContext),
    toBuffer: jest.fn().mockImplementation(() => Buffer.from('mock-canvas-data'))
  };
  
  return {
    createCanvas: jest.fn().mockReturnValue(mockCanvas),
    loadImage: jest.fn().mockResolvedValue({})
  };
});

// Mock the search product image function
jest.mock('../config/search-api', () => ({
  searchProductImage: jest.fn().mockResolvedValue('https://example.com/image.jpg')
}));

// Mock Blob Storage Client
const mockBlockBlobClient = {
  url: 'https://storage.example.com/container/temp-123.png',
  upload: jest.fn().mockResolvedValue({}),
  exists: jest.fn().mockResolvedValue(true),
  delete: jest.fn().mockResolvedValue({})
};

const mockContainerClient = {
  getBlockBlobClient: jest.fn().mockReturnValue(mockBlockBlobClient)
};

BlobServiceClient.fromConnectionString.mockReturnValue({
  getContainerClient: jest.fn().mockReturnValue(mockContainerClient)
});

// Mock axios
const axios = require('axios');
axios.get.mockResolvedValue({
  data: Buffer.from('mock-image-data'),
  responseType: 'arraybuffer'
});

describe('Image Finder API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/product-image', () => {
    it('should return 400 if productId is missing', async () => {
      const response = await request(app)
        .post('/api/product-image')
        .send({
          productType: 'Laptop',
          description: 'A great laptop'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Product ID is required');
    });

    it('should return 400 if all search parameters are missing', async () => {
      const response = await request(app)
        .post('/api/product-image')
        .send({
          productId: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('At least one of productType');
    });

    it('should process and store an image successfully', async () => {
      const response = await request(app)
        .post('/api/product-image')
        .send({
          productId: '123',
          productType: 'Laptop',
          brand: 'TechBrand',
          description: 'A powerful laptop'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('imageUrl');
      expect(response.body).toHaveProperty('fileName', 'temp-123.png');
      
      // Verify the right methods were called
      expect(axios.get).toHaveBeenCalled();
      expect(mockContainerClient.getBlockBlobClient).toHaveBeenCalledWith('temp-123.png');
      expect(mockBlockBlobClient.upload).toHaveBeenCalled();
    });
  });

  describe('GET /api/product-image/:productId', () => {
    it('should return the image URL if it exists', async () => {
      mockBlockBlobClient.exists.mockResolvedValueOnce(true);
      
      const response = await request(app)
        .get('/api/product-image/123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('exists', true);
      expect(response.body).toHaveProperty('imageUrl');
    });

    it('should return 404 if the image does not exist', async () => {
      mockBlockBlobClient.exists.mockResolvedValueOnce(false);
      
      const response = await request(app)
        .get('/api/product-image/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('exists', false);
    });
  });

  describe('DELETE /api/product-image/:productId', () => {
    it('should delete the image if it exists', async () => {
      mockBlockBlobClient.exists.mockResolvedValueOnce(true);
      
      const response = await request(app)
        .delete('/api/product-image/123');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(mockBlockBlobClient.delete).toHaveBeenCalled();
    });

    it('should return 404 if the image does not exist', async () => {
      mockBlockBlobClient.exists.mockResolvedValueOnce(false);
      
      const response = await request(app)
        .delete('/api/product-image/999');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(mockBlockBlobClient.delete).not.toHaveBeenCalled();
    });
  });

  describe('Health Check', () => {
    it('should return 200 for health check endpoint', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
    });
  });
});