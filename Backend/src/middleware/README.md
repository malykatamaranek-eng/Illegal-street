# Middleware Layer

Complete middleware implementation for the Illegal Street backend API.

## Overview

This directory contains all middleware functions used throughout the application for:
- Authentication & Authorization
- Input Validation
- Rate Limiting
- Error Handling
- Security
- Request Logging
- File Upload

## Middleware Files

### 1. **auth.ts** - Authentication & Authorization

JWT-based authentication and role-based access control.

**Exports:**
- `authenticate` - Verify JWT token and attach user to request
- `requireAuth` - Require valid authentication (throw error if not authenticated)
- `optionalAuth` - Optional authentication (don't throw error)
- `requireRole(...roles)` - Role-based access control (USER, MODERATOR, ADMIN, SUPER_ADMIN)
- `requireAdmin` - Require admin or super admin role
- `requireSuperAdmin` - Require super admin role only

**Features:**
- Supports both cookie and Authorization header tokens
- Validates token expiration
- Checks if user still exists in database
- Attaches user to `req.user`

**Usage:**
```typescript
import { requireAuth, requireAdmin, requireRole } from './middleware';

// Require authentication
router.get('/profile', requireAuth, getProfile);

// Require admin role
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

// Require specific role
router.post('/modules', requireAuth, requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), createModule);
```

### 2. **validation.ts** - Input Validation

Express-validator based input validation for all endpoints.

**Exports:**
- `validateRegister` - Validate user registration
- `validateLogin` - Validate user login
- `validateUpdateProfile` - Validate profile updates
- `validateChangePassword` - Validate password change
- `validateCreateModule` - Validate module creation
- `validateCreateProduct` - Validate product creation
- `validateCreateOrder` - Validate order creation
- `validateCreateEvent` - Validate event creation
- `validateQuizSubmission` - Validate quiz submission
- `validatePagination` - Validate pagination params
- `validateId(paramName)` - Validate UUID IDs
- `handleValidationErrors` - Handle validation results
- `withValidation(validators)` - Wrap validators with error handler

**Features:**
- Password strength validation (min 8 chars, uppercase, lowercase, number, special)
- Email format validation
- Username validation (alphanumeric + underscore, 3-20 chars)
- UUID validation
- Array and nested object validation

**Usage:**
```typescript
import { validateRegister, handleValidationErrors } from './middleware';

router.post('/register', 
  validateRegister, 
  handleValidationErrors, 
  registerUser
);

// Or use withValidation helper
import { validateLogin, withValidation } from './middleware';

router.post('/login', 
  ...withValidation(validateLogin), 
  loginUser
);
```

### 3. **rateLimit.ts** - Rate Limiting

Redis-based distributed rate limiting to prevent abuse.

**Exports:**
- `authLimiter` - Strict limit for auth endpoints (5 req/15min)
- `apiLimiter` - General API limit (100 req/15min)
- `passwordResetLimiter` - Password reset limit (3 req/hour)
- `uploadLimiter` - File upload limit (10 uploads/hour)
- `createResourceLimiter` - Resource creation limit (20/hour)
- `createLimiter(windowMs, max, message?)` - Create custom limiter
- `closeRateLimitStore()` - Cleanup function for graceful shutdown

**Features:**
- Uses Redis for distributed rate limiting
- Returns `Retry-After` header
- Logs rate limit violations
- Graceful fallback if Redis fails

**Usage:**
```typescript
import { authLimiter, apiLimiter } from './middleware';

// Apply to auth routes
router.post('/login', authLimiter, loginUser);
router.post('/register', authLimiter, registerUser);

// Apply to all API routes
app.use('/api', apiLimiter);
```

### 4. **errorHandler.ts** - Global Error Handling

Centralized error handling with proper logging and formatting.

**Exports:**
- `errorHandler` - Main error handling middleware
- `notFoundHandler` - Handle 404 errors
- `asyncHandler(fn)` - Wrap async route handlers

**Features:**
- Handles custom error classes (ValidationError, AuthenticationError, etc.)
- Handles Prisma errors (unique constraint, not found, etc.)
- Handles JWT errors (expired, invalid, etc.)
- Handles express-validator errors
- Formats error responses consistently
- Logs errors with Winston
- Sends to Sentry in production
- Doesn't leak sensitive info in production

**Usage:**
```typescript
import { errorHandler, notFoundHandler, asyncHandler } from './middleware';

// Wrap async route handlers
router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  res.json(user);
}));

// Apply error handlers at the end
app.use(notFoundHandler);
app.use(errorHandler);
```

### 5. **security.ts** - Security Middleware

Comprehensive security middleware for protecting the API.

**Exports:**
- `securityHeaders` - Helmet security headers with CSP
- `corsOptions` - CORS configuration with whitelist
- `sanitizeInput` - Sanitize user input (prevent NoSQL injection)
- `preventParameterPollution` - Prevent HPP attacks
- `preventXSS` - Additional XSS prevention
- `csrfProtection` - CSRF token validation
- `generateCsrfToken` - Generate CSRF tokens
- `preventClickjacking` - Set X-Frame-Options
- `secureCookies` - Force secure cookie options
- `validateContentType` - Validate request Content-Type

**Features:**
- Content Security Policy configuration
- CORS with origin whitelist
- NoSQL injection prevention
- XSS prevention
- CSRF protection
- Parameter pollution prevention
- Secure headers (helmet)

**Usage:**
```typescript
import { securityHeaders, corsOptions, sanitizeInput } from './middleware';

// Apply security middleware
app.use(securityHeaders);
app.use(corsOptions);
app.use(sanitizeInput);
```

### 6. **logging.ts** - Request Logging

Request/response logging with Winston.

**Exports:**
- `requestLogger` - Log all requests
- `sensitiveRouteLogger` - Log sensitive route access
- `sanitizeLogData(data)` - Remove sensitive data from logs
- `queryLogger(query, params?)` - Log database queries
- `errorLogger(error, context?)` - Log errors with context
- `securityLogger(event, req, details?)` - Log security events
- `performanceLogger(threshold)` - Log slow requests
- `auditLogger(action, req, details?)` - Log important actions
- `devLogger(message, data?)` - Development-only logging
- `apiUsageLogger` - Log API usage for analytics

**Features:**
- Logs method, URL, status code, response time, IP, user agent
- Excludes sensitive data (passwords, tokens)
- Different log levels (info, warn, error)
- Correlation IDs for request tracking
- Performance monitoring for slow requests

**Usage:**
```typescript
import { requestLogger, auditLogger } from './middleware';

// Apply to all routes
app.use(requestLogger);

// Log specific actions
router.post('/users', requireAuth, async (req, res) => {
  const user = await createUser(req.body);
  auditLogger('User created', req, { userId: user.id });
  res.json(user);
});
```

### 7. **upload.ts** - File Upload Handling

Multer-based file upload with validation.

**Exports:**
- `uploadSingle(fieldName)` - Upload single file (disk)
- `uploadMultiple(fieldName, maxCount)` - Upload multiple files (disk)
- `uploadSingleMemory(fieldName)` - Upload single file (memory)
- `uploadMultipleMemory(fieldName, maxCount)` - Upload multiple files (memory)
- `validateImageOnly` - Validate only image files
- `cleanupUploadOnError` - Delete files on error
- `deleteFile(filePath)` - Delete file helper

**Features:**
- File type validation (images, PDFs)
- File size validation (5MB default)
- Unique filenames with UUID
- Both disk and memory storage
- Automatic subdirectories by file type
- Error handling with cleanup

**Usage:**
```typescript
import { uploadSingle, uploadMultiple, validateImageOnly } from './middleware';

// Single file upload
router.post('/avatar', 
  requireAuth, 
  uploadSingle('avatar'), 
  validateImageOnly,
  uploadAvatar
);

// Multiple files upload
router.post('/gallery', 
  requireAuth, 
  uploadMultiple('images', 5),
  validateImageOnly,
  uploadGallery
);
```

## Type Extensions

### Express Request Extension

The `types/express.d.ts` file extends the Express Request interface to include:

```typescript
declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: UserRole;
      };
      correlationId?: string;
    }
  }
}
```

This allows TypeScript to recognize `req.user` and `req.correlationId` throughout the application.

## Common Patterns

### Protected Route with Validation

```typescript
router.post('/products',
  requireAuth,
  requireAdmin,
  ...withValidation(validateCreateProduct),
  createProduct
);
```

### Rate Limited Route

```typescript
router.post('/register',
  authLimiter,
  ...withValidation(validateRegister),
  registerUser
);
```

### File Upload Route

```typescript
router.post('/upload',
  requireAuth,
  uploadLimiter,
  uploadSingle('file'),
  validateImageOnly,
  uploadFile
);
```

### Async Route with Error Handling

```typescript
router.get('/users/:id',
  requireAuth,
  ...withValidation(validateId('id')),
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.params.id);
    res.json(user);
  })
);
```

## Environment Variables

Required environment variables for middleware:

```env
# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
CORS_CREDENTIALS=true

# Upload
UPLOAD_DIR=uploads
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,image/webp

# Sentry
SENTRY_DSN=
SENTRY_ENABLED=false

# Logging
LOG_LEVEL=info
LOG_DIR=logs
```

## Testing

Example test for authentication middleware:

```typescript
import { requireAuth } from './middleware';
import { AuthenticationError } from '../utils/errors';

describe('requireAuth middleware', () => {
  it('should throw error if no token provided', async () => {
    const req = { headers: {}, cookies: {} };
    const res = {};
    const next = jest.fn();
    
    await requireAuth(req, res, next);
    
    expect(next).toHaveBeenCalledWith(
      expect.any(AuthenticationError)
    );
  });
  
  it('should attach user to request if valid token', async () => {
    const req = {
      headers: { authorization: 'Bearer valid-token' },
      cookies: {}
    };
    const res = {};
    const next = jest.fn();
    
    await requireAuth(req, res, next);
    
    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalledWith();
  });
});
```

## Best Practices

1. **Always use asyncHandler** for async route handlers
2. **Apply rate limiters** to all authentication and resource creation endpoints
3. **Validate all input** using validation middleware
4. **Use requireAuth** for protected routes
5. **Log important actions** using auditLogger
6. **Sanitize user input** to prevent injection attacks
7. **Use HTTPS** in production
8. **Rotate JWT secrets** periodically
9. **Monitor rate limit violations**
10. **Clean up uploaded files** on errors

## Troubleshooting

### JWT Token Issues
- Verify JWT_SECRET is set correctly
- Check token expiration time
- Ensure user still exists in database

### Rate Limit Issues
- Verify Redis is running and accessible
- Check Redis connection configuration
- Monitor Redis memory usage

### File Upload Issues
- Check upload directory permissions
- Verify file size limits
- Ensure allowed file types are configured

### CORS Issues
- Add origin to CORS_ORIGIN whitelist
- Verify credentials are enabled if needed
- Check preflight requests are handled

## Security Considerations

1. **Never log sensitive data** (passwords, tokens, credit cards)
2. **Always sanitize user input** before processing
3. **Use HTTPS** in production
4. **Set secure cookie options** (httpOnly, secure, sameSite)
5. **Implement rate limiting** on all endpoints
6. **Validate file uploads** (type, size, content)
7. **Use CSRF protection** for state-changing operations
8. **Set proper security headers** with Helmet
9. **Monitor and log security events**
10. **Keep dependencies updated**

## License

ISC
