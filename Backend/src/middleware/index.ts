// Authentication & Authorization
export {
  authenticate,
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireSuperAdmin,
} from './auth';

// Validation
export {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateCreateModule,
  validateCreateProduct,
  validateCreateOrder,
  validatePagination,
  validateId,
  validateCreateEvent,
  validateQuizSubmission,
  withValidation,
} from './validation';

// Rate Limiting
export {
  createLimiter,
  authLimiter,
  apiLimiter,
  passwordResetLimiter,
  uploadLimiter,
  createResourceLimiter,
  closeRateLimitStore,
} from './rateLimit';

// Error Handling
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from './errorHandler';

// Security
export {
  securityHeaders,
  corsOptions,
  sanitizeInput,
  preventParameterPollution,
  preventXSS,
  csrfProtection,
  generateCsrfToken,
  preventClickjacking,
  secureCookies,
  validateContentType,
} from './security';

// Logging
export {
  requestLogger,
  sensitiveRouteLogger,
  sanitizeLogData,
  queryLogger,
  errorLogger,
  securityLogger,
  performanceLogger,
  auditLogger,
  devLogger,
  apiUsageLogger,
} from './logging';

// File Upload
export {
  uploadSingle,
  uploadMultiple,
  uploadSingleMemory,
  uploadMultipleMemory,
  validateImageOnly,
  cleanupUploadOnError,
  deleteFile,
} from './upload';
