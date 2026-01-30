/**
 * Security Utilities
 * Helper functions for detecting suspicious activity
 */

const logger = require('../config/logger');

/**
 * IP address tracking for suspicious activity
 */
const ipAttempts = new Map();

/**
 * Check if IP has too many failed attempts
 * @param {string} ip - IP address to check
 * @param {number} maxAttempts - Maximum allowed attempts
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {boolean} True if suspicious
 */
const isSuspiciousIP = (ip, maxAttempts = 10, timeWindow = 15 * 60 * 1000) => {
    const now = Date.now();
    
    if (!ipAttempts.has(ip)) {
        ipAttempts.set(ip, []);
    }
    
    const attempts = ipAttempts.get(ip);
    
    // Remove old attempts outside time window
    const recentAttempts = attempts.filter(timestamp => now - timestamp < timeWindow);
    ipAttempts.set(ip, recentAttempts);
    
    return recentAttempts.length >= maxAttempts;
};

/**
 * Record failed attempt for IP
 * @param {string} ip - IP address
 */
const recordFailedAttempt = (ip) => {
    if (!ipAttempts.has(ip)) {
        ipAttempts.set(ip, []);
    }
    
    const attempts = ipAttempts.get(ip);
    attempts.push(Date.now());
    
    // Check if this IP is now suspicious
    if (isSuspiciousIP(ip)) {
        logger.logSuspiciousActivity('EXCESSIVE_FAILED_ATTEMPTS', {
            ip,
            attempts: attempts.length,
            timeWindow: '15 minutes',
        });
    }
};

/**
 * Check for suspicious user agent
 * @param {string} userAgent - User agent string
 * @returns {boolean} True if suspicious
 */
const isSuspiciousUserAgent = (userAgent) => {
    if (!userAgent) return true;
    
    const suspiciousPatterns = [
        /bot/i,
        /crawler/i,
        /spider/i,
        /scraper/i,
        /curl/i,
        /wget/i,
        /python/i,
        /java(?!script)/i,
        /perl/i,
        /ruby/i,
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
};

/**
 * Check for SQL injection patterns in input
 * @param {string} input - Input to check
 * @returns {boolean} True if suspicious
 */
const hasSQLInjectionPattern = (input) => {
    if (typeof input !== 'string') return false;
    
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b)/i,
        /(--|;|\/\*|\*\/|xp_|sp_)/i,
        /(\bOR\b.*=.*|AND.*=.*|\bOR\b.*\bLIKE\b)/i,
        /(WAITFOR\s+DELAY|BENCHMARK|SLEEP\s*\()/i,
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Check for XSS patterns in input
 * @param {string} input - Input to check
 * @returns {boolean} True if suspicious
 */
const hasXSSPattern = (input) => {
    if (typeof input !== 'string') return false;
    
    // Remove all whitespace and check for script tags
    // This prevents bypasses with spaces, tabs, newlines
    const normalized = input.toLowerCase().replace(/\s/g, '');
    
    const xssPatterns = [
        /<script/i,  // Simple detection of script tag start
        /<\/script>/i,  // Simple detection of script tag end
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
    ];
    
    // Check normalized string for script patterns
    if (normalized.includes('<script') || normalized.includes('</script>')) {
        return true;
    }
    
    return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Analyze request for suspicious patterns
 * @param {object} req - Express request object
 * @returns {object} Analysis result
 */
const analyzeRequest = (req) => {
    const suspicious = {
        isSuspicious: false,
        reasons: [],
    };
    
    // Check IP
    if (isSuspiciousIP(req.ip)) {
        suspicious.isSuspicious = true;
        suspicious.reasons.push('Excessive requests from IP');
    }
    
    // Check user agent
    if (isSuspiciousUserAgent(req.get('user-agent'))) {
        suspicious.isSuspicious = true;
        suspicious.reasons.push('Suspicious user agent');
    }
    
    // Check request body for injection patterns
    if (req.body) {
        const checkObject = (obj, path = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const currentPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'string') {
                    if (hasSQLInjectionPattern(value)) {
                        suspicious.isSuspicious = true;
                        suspicious.reasons.push(`SQL injection pattern in ${currentPath}`);
                    }
                    if (hasXSSPattern(value)) {
                        suspicious.isSuspicious = true;
                        suspicious.reasons.push(`XSS pattern in ${currentPath}`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    checkObject(value, currentPath);
                }
            }
        };
        
        checkObject(req.body);
    }
    
    return suspicious;
};

/**
 * Middleware to detect and log suspicious activity
 */
const detectSuspiciousActivity = (req, res, next) => {
    const analysis = analyzeRequest(req);
    
    if (analysis.isSuspicious) {
        logger.logSuspiciousActivity('SUSPICIOUS_REQUEST', {
            ip: req.ip,
            path: req.path,
            method: req.method,
            userAgent: req.get('user-agent'),
            reasons: analysis.reasons,
        });
        
        // You might want to block or challenge the request here
        // For now, we just log it and continue
    }
    
    next();
};

/**
 * Clean up old IP attempts (run periodically)
 */
const cleanupIPTracking = () => {
    const now = Date.now();
    const timeWindow = 15 * 60 * 1000; // 15 minutes
    
    for (const [ip, attempts] of ipAttempts.entries()) {
        const recentAttempts = attempts.filter(timestamp => now - timestamp < timeWindow);
        
        if (recentAttempts.length === 0) {
            ipAttempts.delete(ip);
        } else {
            ipAttempts.set(ip, recentAttempts);
        }
    }
};

// Run cleanup every 5 minutes
setInterval(cleanupIPTracking, 5 * 60 * 1000);

module.exports = {
    isSuspiciousIP,
    recordFailedAttempt,
    isSuspiciousUserAgent,
    hasSQLInjectionPattern,
    hasXSSPattern,
    analyzeRequest,
    detectSuspiciousActivity,
    cleanupIPTracking,
};
