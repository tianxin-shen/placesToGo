import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import placesRoutes from './routes/places';
import wantToGoRoutes from './routes/wantToGo';
import authRouter from './routes/auth';

// Load environment variables
dotenv.config();

const app: Express = express();

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Add Vary header for proper caching
app.use((req, res, next) => {
  res.setHeader('Vary', 'Origin');
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Travel Planner API',
      version: '1.0.0',
      description: 'API documentation for Travel Planner application',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        UserProfile: {
          type: 'object',
          properties: {
            id: { 
              type: 'string',
              description: 'User ID'
            },
            email: { 
              type: 'string',
              description: 'User email address'
            },
            name: { 
              type: 'string',
              description: 'User display name'
            },
            profilePicture: { 
              type: 'string',
              description: 'URL to user profile picture'
            },
            role: { 
              type: 'string', 
              enum: ['user', 'admin'],
              description: 'User role'
            },
            status: { 
              type: 'string', 
              enum: ['active', 'inactive', 'suspended'],
              description: 'User account status'
            },
            preferences: {
              type: 'object',
              properties: {
                language: { 
                  type: 'string',
                  description: 'User preferred language'
                },
                timezone: { 
                  type: 'string',
                  description: 'User timezone'
                },
                notifications: { 
                  type: 'boolean',
                  description: 'Whether user wants notifications'
                }
              },
              description: 'User preferences'
            },
            authMethods: {
              type: 'object',
              properties: {
                google: {
                  type: 'object',
                  properties: {
                    id: { 
                      type: 'string',
                      description: 'Google user ID'
                    },
                    email: { 
                      type: 'string',
                      description: 'Google email address'
                    }
                  },
                  description: 'Google authentication method'
                },
                email: {
                  type: 'object',
                  properties: {
                    email: { 
                      type: 'string',
                      description: 'Email address'
                    },
                    verified: { 
                      type: 'boolean',
                      description: 'Whether email is verified'
                    }
                  },
                  description: 'Email authentication method'
                },
                apple: {
                  type: 'object',
                  properties: {
                    id: { 
                      type: 'string',
                      description: 'Apple user ID'
                    },
                    email: { 
                      type: 'string',
                      description: 'Apple email address'
                    }
                  },
                  description: 'Apple authentication method'
                },
                facebook: {
                  type: 'object',
                  properties: {
                    id: { 
                      type: 'string',
                      description: 'Facebook user ID'
                    },
                    email: { 
                      type: 'string',
                      description: 'Facebook email address'
                    }
                  },
                  description: 'Facebook authentication method'
                }
              },
              description: 'User authentication methods'
            },
            createdAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            lastLoginAt: { 
              type: 'string', 
              format: 'date-time',
              description: 'Last login timestamp'
            }
          },
          description: 'User profile information'
        },
        AuthError: {
          type: 'object',
          properties: {
            code: { 
              type: 'string',
              description: 'Error code for programmatic handling'
            },
            message: { 
              type: 'string',
              description: 'Human-readable error message'
            },
            details: { 
              type: 'object',
              description: 'Additional error details (optional)'
            }
          },
          description: 'Authentication error response'
        },
        LoginResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/UserProfile'
            },
            token: {
              type: 'string',
              description: 'JWT access token'
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token'
            }
          },
          description: 'Successful authentication response'
        },
        GoogleLoginRequest: {
          type: 'object',
          required: ['token'],
          properties: {
            token: {
              type: 'string',
              description: 'Google ID token from client-side authentication'
            }
          },
          description: 'Google authentication request'
        }
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes
app.use('/api/places', placesRoutes);
app.use('/api/want-to-go', wantToGoRoutes);
app.use('/api/auth', authRouter);

// Basic route for testing
app.get('/', (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "1800");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
  res.setHeader("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, PATCH, OPTIONS");
  res.json({ message: 'Welcome to Travel Planner API' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

export default app; 