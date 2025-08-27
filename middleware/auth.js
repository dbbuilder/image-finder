/**
 * Authentication middleware
 */
const authenticateRequest = (req, res, next) => {
    const apiKey = process.env.API_KEY;
    const authHeader = req.headers.authorization;
  
    if (!apiKey) {
      console.warn('API_KEY is not set in environment variables');
      return next();
    }
  
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid authorization header' });
    }
  
    const receivedKey = authHeader.split(' ')[1];
    
    if (receivedKey !== apiKey) {
      return res.status(403).json({ error: 'Forbidden - Invalid API key' });
    }
  
    next();
  };
  
  module.exports = { authenticateRequest };