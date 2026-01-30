/**
 * User Routes
 * Protected user management endpoints with rate limiting
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { apiLimiter, strictLimiter } = require('../middleware/rateLimiting');
const { validateUpdateProfile, validateChangePassword } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Get user profile - moderate rate limiting
router.get('/profile', apiLimiter, userController.getProfile);

// Update user profile - moderate rate limiting
router.put('/profile', apiLimiter, validateUpdateProfile, userController.updateProfile);

// Change password - strict rate limiting (sensitive operation)
router.put('/change-password', strictLimiter, validateChangePassword, userController.changePassword);

// Delete account - strict rate limiting (sensitive operation)
router.delete('/account', strictLimiter, userController.deleteAccount);

module.exports = router;
