/**
 * Advanced Rate Limiting Middleware
 * Per-endpoint rate limiting with user and IP tracking
 */

const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Create a rate limiter with custom options
 */
const createRateLimiter = (options = {}) => {
    const defaultOptions = {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            logger.logSuspiciousActivity('RATE_LIMIT_EXCEEDED', {
                ip: req.ip,
                path: req.path,
                method: req.method,
            });
            res.status(429).json({
                status: 'fail',
                message: 'Zbyt wiele zapytań. Spróbuj ponownie później.',
            });
        },
    };

    return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Global rate limiter - 100 requests per 15 minutes
 */
const globalLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Zbyt wiele zapytań z tego adresu IP. Spróbuj ponownie za 15 minut.',
});

/**
 * Auth endpoints - 5 login attempts per 15 minutes
 */
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.',
});

/**
 * Registration endpoint - 3 registrations per hour
 */
const registrationLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Zbyt wiele prób rejestracji. Spróbuj ponownie za godzinę.',
});

/**
 * Password reset - 3 attempts per hour
 */
const passwordResetLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: 'Zbyt wiele prób resetowania hasła. Spróbuj ponownie za godzinę.',
});

/**
 * API endpoints - 30 requests per minute
 */
const apiLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: 'Zbyt wiele zapytań do API. Spróbuj ponownie za minutę.',
});

/**
 * Strict limiter for sensitive operations - 10 requests per hour
 */
const strictLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Przekroczono limit zapytań. Spróbuj ponownie później.',
});

module.exports = {
    createRateLimiter,
    globalLimiter,
    authLimiter,
    registrationLimiter,
    passwordResetLimiter,
    apiLimiter,
    strictLimiter,
};
