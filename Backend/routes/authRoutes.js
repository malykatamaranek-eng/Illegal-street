/**
 * Authentication Routes
 * Secure authentication with advanced rate limiting
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
    validateLogin, 
    validateRegister, 
    validateForgotPassword, 
    validateResetPassword 
} = require('../middleware/validation');
const { 
    authLimiter, 
    registrationLimiter, 
    passwordResetLimiter 
} = require('../middleware/rateLimiting');

// Login route - protected with strict auth rate limiting
router.post('/login', authLimiter, validateLogin, authController.login);

// Logout route
router.post('/logout', authController.logout);

// Register route - protected with registration rate limiting
router.post('/register', registrationLimiter, validateRegister, authController.register);

// Password reset request - protected with password reset rate limiting
router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, authController.forgotPassword);

// Password reset - protected with password reset rate limiting
router.post('/reset-password/:token', passwordResetLimiter, validateResetPassword, authController.resetPassword);

// Get current user
router.get('/me', authController.protect, authController.getMe);

// Refresh token
router.post('/refresh-token', authLimiter, authController.refreshToken);

module.exports = router;
