import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';

// Request logger middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Generate correlation ID for request tracking
  const correlationId = uuidv4();
  req.correlationId = correlationId;

  // Capture start time
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to log response
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Get response size
    const contentLength = res.getHeader('content-length');

    // Prepare log data
    const logData = {
      correlationId,
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: contentLength ? `${contentLength}B` : 'N/A',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      userId: req.user?.id,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
    };

    // Determine log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with server error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', logData);
    } else {
      logger.info('Request completed successfully', logData);
    }

    // Call original end function
    return originalEnd.call(this, chunk, encoding, callback);
  };

  // Log incoming request
  logger.info('Incoming request', {
    correlationId,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
  });

  next();
};

// Log only sensitive routes (auth, payment, etc.)
export const sensitiveRouteLogger = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  logger.warn('Sensitive route accessed', {
    correlationId: req.correlationId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });
  next();
};

// Exclude sensitive data from logs
export const sanitizeLogData = (data: any): any => {
  const sensitiveFields = [
    'password',
    'password_hash',
    'token',
    'refresh_token',
    'access_token',
    'secret',
    'api_key',
    'credit_card',
    'ssn',
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  const sanitized: any = {};
  for (const key in data) {
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof data[key] === 'object') {
      sanitized[key] = sanitizeLogData(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
};

// Log database queries (for debugging)
export const queryLogger = (query: string, params?: any[]): void => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Database query', {
      query,
      params: params ? sanitizeLogData(params) : undefined,
    });
  }
};

// Log errors with context
export const errorLogger = (
  error: Error,
  context?: Record<string, any>
): void => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...sanitizeLogData(context || {}),
  });
};

// Log security events
export const securityLogger = (
  event: string,
  req: Request,
  details?: Record<string, any>
): void => {
  logger.warn('Security event', {
    event,
    correlationId: req.correlationId,
    ip: req.ip,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString(),
    ...sanitizeLogData(details || {}),
  });
};

// Performance logger for slow requests
export const performanceLogger = (threshold: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      if (responseTime > threshold) {
        logger.warn('Slow request detected', {
          correlationId: req.correlationId,
          method: req.method,
          url: req.originalUrl || req.url,
          responseTime: `${responseTime}ms`,
          threshold: `${threshold}ms`,
          userId: req.user?.id,
        });
      }
    });

    next();
  };
};

// Audit logger for important actions
export const auditLogger = (
  action: string,
  req: Request,
  details?: Record<string, any>
): void => {
  logger.info('Audit log', {
    action,
    correlationId: req.correlationId,
    userId: req.user?.id,
    userEmail: req.user?.email,
    ip: req.ip,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...sanitizeLogData(details || {}),
  });
};

// Development-only logger
export const devLogger = (message: string, data?: any): void => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(message, sanitizeLogData(data));
  }
};

// Log API usage for analytics
export const apiUsageLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.on('finish', () => {
    logger.info('API usage', {
      correlationId: req.correlationId,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });
  });
  next();
};
