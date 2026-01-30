/**
 * Cookie Consent Routes
 * GDPR-compliant cookie consent management with rate limiting
 */

const express = require('express');
const router = express.Router();
const cookieConsentController = require('../controllers/cookieConsentController');
const { apiLimiter } = require('../middleware/rateLimiting');

// Get cookie consent preferences
router.get('/preferences', apiLimiter, cookieConsentController.getPreferences);

// Save cookie consent preferences
router.post('/preferences', apiLimiter, cookieConsentController.savePreferences);

// Get cookie policy
router.get('/policy', cookieConsentController.getPolicy);

module.exports = router;
