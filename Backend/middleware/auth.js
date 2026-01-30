/**
 * JWT Authentication Middleware
 * Verifies JWT tokens from cookies and protects routes
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Middleware to protect routes - requires authentication
 * Extracts JWT from cookie and verifies it
 */
exports.protect = async (req, res, next) => {
    try {
        let token;

        // Get token from cookie
        if (req.cookies.token) {
            token = req.cookies.token;
        }
        // Also check Authorization header as fallback
        else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Check if token exists
        if (!token || token === 'none') {
            return res.status(401).json({
                status: 'fail',
                message: 'Nie jesteś zalogowany. Proszę się zalogować.'
            });
        }

        try {
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from database
            const users = await db.query(
                'SELECT id, username, email, role FROM users WHERE id = ?',
                [decoded.id]
            );

            if (users.length === 0) {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Użytkownik nie istnieje'
                });
            }

            // Attach user to request
            req.user = users[0];
            next();

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Token wygasł. Proszę zalogować się ponownie.'
                });
            }
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    status: 'fail',
                    message: 'Token jest nieprawidłowy'
                });
            }

            throw error;
        }

    } catch (error) {
        logger.error('Auth middleware error:', { error: error.message, stack: error.stack });
        return res.status(500).json({
            status: 'error',
            message: 'Wystąpił błąd podczas weryfikacji tokenu'
        });
    }
};

/**
 * Middleware to restrict access to specific roles
 * Usage: restrictTo('admin', 'moderator')
 */
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Nie jesteś zalogowany'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'Nie masz uprawnień do wykonania tej operacji'
            });
        }
        
        next();
    };
};

/**
 * Optional authentication - doesn't fail if no token
 * Useful for routes that work differently for authenticated users
 */
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;

        if (req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token || token === 'none') {
            req.user = null;
            return next();
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const users = await db.query(
                'SELECT id, username, email, role FROM users WHERE id = ?',
                [decoded.id]
            );

            if (users.length > 0) {
                req.user = users[0];
            } else {
                req.user = null;
            }
        } catch (error) {
            req.user = null;
        }

        next();
    } catch (error) {
        logger.error('Optional auth middleware error:', { error: error.message });
        req.user = null;
        next();
    }
};
