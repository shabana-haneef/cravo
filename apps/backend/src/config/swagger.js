import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cravo API',
      version: '1.0.0',
      description: 'API documentation for the Cravo Multi-Vendor Marketplace',
      contact: {
        name: 'API Support',
        url: 'https://cravo.app/support',
        email: 'support@cravo.app',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.cravo.app',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token to authenticate',
        },
      },
    },
  },
  // Paths to files containing OpenAPI definitions (we will document auth.routes.js first)
  apis: ['./src/modules/*/routes/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
