/**
 * Swagger/OpenAPI Configuration
 * Sets up API documentation using swagger-ui-express
 */
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

// Load the OpenAPI specification
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));

// Update server URLs based on environment
const updateServerUrls = (req) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseUrl = `${protocol}://${host}/api`;
  
  // Update the swagger document servers for the current request
  const updatedDocument = {
    ...swaggerDocument,
    servers: [
      {
        url: baseUrl,
        description: 'Current server'
      },
      ...swaggerDocument.servers
    ]
  };
  
  return updatedDocument;
};

// Swagger UI options
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 4px; }
  `,
  customSiteTitle: 'Image Finder API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Add any default headers or modifications here
      return req;
    }
  }
};

/**
 * Setup Swagger documentation routes
 * @param {Express} app - Express application instance
 */
const setupSwagger = (app) => {
  // Serve the Swagger UI at /docs
  app.use('/docs', (req, res, next) => {
    // Update server URLs for the current request
    const updatedDocument = updateServerUrls(req);
    req.swaggerDoc = updatedDocument;
    next();
  }, swaggerUi.serveFiles(undefined, swaggerOptions), swaggerUi.setup(undefined, swaggerOptions));

  // Serve the raw OpenAPI spec at /api-docs
  app.get('/api-docs', (req, res) => {
    const updatedDocument = updateServerUrls(req);
    res.json(updatedDocument);
  });

  // Redirect from root to docs for convenience
  app.get('/', (req, res) => {
    res.redirect('/docs');
  });

  console.log('Swagger documentation available at: /docs');
  console.log('OpenAPI specification available at: /api-docs');
};

module.exports = {
  setupSwagger,
  swaggerDocument,
  swaggerOptions
};