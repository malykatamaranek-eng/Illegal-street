/**
 * Illegal Street - Secure Backend Server
 * High-security Express.js server with comprehensive protection measures
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import custom middleware
const logger = require('./config/logger');
const sanitizeInput = require('./middleware/sanitization');
const { globalLimiter, authLimiter } = require('./middleware/rateLimiting');
const { detectSuspiciousActivity } = require('./middleware/security');

const app = express();

// ===== SECURITY MIDDLEWARE =====

// 1. Helmet - Set security HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
}));

// 2. CORS configuration with strict origin policy
const corsOptions = {
    origin: function (origin, callback) {
        const whitelist = process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',') 
            : ['http://localhost:3000', 'http://localhost:8080'];
        
        if (!origin || whitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// 3. Rate limiting - Prevent brute force attacks
app.use('/api/', globalLimiter);

// Stricter rate limiting for authentication endpoints
app.use('/api/auth/', authLimiter);

// 4. Body parser with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Cookie parser for secure cookie handling
// Note: CSRF protection is implemented via SameSite=strict cookies
// This is the modern approach recommended after csurf deprecation
app.use(cookieParser());

// 6. Data sanitization against NoSQL injection
app.use(mongoSanitize());

// 7. Input sanitization against XSS attacks
app.use(sanitizeInput);

// 8. Prevent HTTP Parameter Pollution
app.use(hpp());

// 9. Compression middleware
app.use(compression());

// ===== CUSTOM SECURITY MIDDLEWARE =====

// Secure headers middleware
app.use((req, res, next) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Add additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    
    next();
});

// Request logging middleware (with sanitization)
app.use((req, res, next) => {
    logger.http(`${req.method} ${req.path} - IP: ${req.ip}`);
    next();
});

// Suspicious activity detection middleware
app.use(detectSuspiciousActivity);

// ===== SERVE STATIC FILES =====
app.use(express.static(path.join(__dirname, '../Frontend'), {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// ===== ROUTES =====
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const cookieConsentRoutes = require('./routes/cookieConsentRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cookie-consent', cookieConsentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running securely',
        timestamp: new Date().toISOString()
    });
});

// ===== ERROR HANDLING =====

// 404 handler
app.use((req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: 'Nie znaleziono żądanego zasobu'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`, {
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
    });
    
    // Don't leak error details in production
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? 'Wystąpił błąd serwera' 
        : err.message;
    
    res.status(statusCode).json({
        status: 'error',
        message: message
    });
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const jwtRotation = require('./config/jwtRotation');

app.listen(PORT, HOST, async () => {
    logger.info(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║          ILLEGAL STREET - SECURE BACKEND SERVER           ║
║                                                            ║
║  Status: Running with high-security configuration         ║
║  Port: ${PORT}                                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                            ║
║  Security Features Active:                                ║
║  ✓ Helmet (Security Headers + Permissions-Policy)         ║
║  ✓ CORS Protection                                        ║
║  ✓ Advanced Rate Limiting (Per-Endpoint)                  ║
║  ✓ DOMPurify XSS Protection                               ║
║  ✓ NoSQL Injection Prevention                             ║
║  ✓ SQL Injection Prevention (Prepared Statements)         ║
║  ✓ Secure Cookies (httpOnly, secure, sameSite)            ║
║  ✓ Input Validation & Sanitization                        ║
║  ✓ HPP (HTTP Parameter Pollution) Prevention              ║
║  ✓ Compression                                            ║
║  ✓ Winston Structured Logging                             ║
║  ✓ Suspicious Activity Detection                          ║
║  ✓ JWT Key Rotation Management                            ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
    
    // Check JWT key rotation on startup
    try {
        await jwtRotation.checkAndRotate();
    } catch (error) {
        logger.error('JWT rotation check failed', { error: error.message });
    }
});

module.exports = app;
