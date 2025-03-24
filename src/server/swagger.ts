import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'QBank API Documentation',
      version: '1.0.0',
      description: 'API documentation for the QBank question generation system',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{
      bearerAuth: [],
    }],
  },
  apis: ['./src/server/routes/*.ts'], // Path to the API routes
};

export const specs = swaggerJsdoc(options);