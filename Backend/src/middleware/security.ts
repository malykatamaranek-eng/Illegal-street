import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Helmet security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});

// CORS configuration with whitelist
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

export const corsOptions = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
});

// Sanitize user input to prevent NoSQL injection
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key: ${key} in request from ${req.ip}`);
  },
});

// Prevent parameter pollution
export const preventParameterPollution = hpp({
  whitelist: [
    'page',
    'limit',
    'sort',
    'fields',
    'category',
    'difficulty',
    'status',
  ],
});

// Additional XSS prevention
export const preventXSS = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Sanitize request body, query, and params
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // More comprehensive sanitization
      return obj
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') // Remove vbscript: protocol
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers with better regex
    }
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((key) => {
        obj[key] = sanitize(obj[key]);
      });
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// CSRF protection for state-changing operations
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Check CSRF token from header or body
  const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
  const sessionToken = req.cookies?.csrfToken;

  if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid CSRF token',
    });
  }

  next();
};

// Generate and set CSRF token
export const generateCsrfToken = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate a random token
  const token = require('crypto').randomBytes(32).toString('hex');

  // Set token in cookie
  res.cookie('csrfToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
  });

  // Attach token to response for client to use
  res.locals.csrfToken = token;

  next();
};

// Prevent clickjacking
export const preventClickjacking = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
};

// Set secure cookies
export const secureCookies = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Override res.cookie to add security options
  const originalCookie = res.cookie.bind(res);
  res.cookie = (name: string, value: any, options?: any) => {
    const secureOptions = {
      ...options,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    };
    return originalCookie(name, value, secureOptions);
  };
  next();
};

// Content type validation
export const validateContentType = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Only check for POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    if (!contentType) {
      return res.status(400).json({
        status: 'error',
        message: 'Content-Type header is required',
      });
    }

    // Accept JSON or multipart/form-data
    const validTypes = ['application/json', 'multipart/form-data'];
    const isValid = validTypes.some((type) => contentType.includes(type));

    if (!isValid) {
      return res.status(415).json({
        status: 'error',
        message: 'Unsupported Content-Type',
      });
    }
  }

  next();
};
