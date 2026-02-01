import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import routes from './routes';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  securityHeaders,
  apiLimiter,
} from './middleware';
import logger from './config/logger';

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Sanitization
app.use(mongoSanitize());
app.use(hpp());

// Logging
app.use(requestLogger);

// Rate limiting
app.use('/api', apiLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Illegal Street Backend API',
    version: process.env.API_VERSION || 'v1',
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

logger.info('Application initialized successfully');

export default app;
