/**
 * Input Sanitization Middleware
 * Provides XSS protection using DOMPurify
 */

const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitize a value recursively
 */
const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        // Clean HTML and script tags
        return DOMPurify.sanitize(value, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
            KEEP_CONTENT: true,
        });
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (typeof value === 'object' && value !== null) {
        const sanitized = {};
        for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key)) {
                sanitized[key] = sanitizeValue(value[key]);
            }
        }
        return sanitized;
    }
    return value;
};

/**
 * Middleware to sanitize request body, query, and params
 */
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        req.query = sanitizeValue(req.query);
    }
    if (req.params) {
        req.params = sanitizeValue(req.params);
    }
    next();
};

module.exports = sanitizeInput;
