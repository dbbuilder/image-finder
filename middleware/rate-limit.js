/**
 * Rate limiting middleware
 * Limits API requests to 25 per minute per IP address
 */
const rateLimit = require('express-rate-limit');

// Create rate limiter for product image API
const productImageRateLimiter = rateLimit({
  windowMs: 600 * 1000, // 10 minute
  max: 2500, // limit each IP to 25 requests per minute
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests',
    message: 'You have exceeded the rate limit of 25 requests per minute. Please try again later.'
  },
  // Optional: skip rate limiting for trusted IPs
  skip: (req) => {
    const trustedIps = process.env.TRUSTED_IPS ? process.env.TRUSTED_IPS.split(',') : [];
    return trustedIps.includes(req.ip);
  }
});

module.exports = {
  productImageRateLimiter
};
