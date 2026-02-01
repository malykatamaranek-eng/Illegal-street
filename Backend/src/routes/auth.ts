import { Router } from 'express';
import * as authController from '../controllers/authController';
import {
  requireAuth,
  validateRegister,
  validateLogin,
  authLimiter,
  passwordResetLimiter,
  handleValidationErrors,
} from '../middleware';
import { body } from 'express-validator';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  validateRegister,
  handleValidationErrors,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  validateLogin,
  handleValidationErrors,
  authController.login
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  handleValidationErrors,
  authController.refresh
);

// POST /api/auth/logout (protected)
router.post('/logout', requireAuth, authController.logout);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  passwordResetLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
  ],
  handleValidationErrors,
  authController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  passwordResetLimiter,
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ],
  handleValidationErrors,
  authController.resetPassword
);

// POST /api/auth/verify-email
router.post(
  '/verify-email',
  [
    body('token').notEmpty().withMessage('Verification token is required'),
  ],
  handleValidationErrors,
  authController.verifyEmail
);

// POST /api/auth/2fa/setup (protected)
router.post('/2fa/setup', requireAuth, authController.setup2FA);

// POST /api/auth/2fa/verify (protected)
router.post(
  '/2fa/verify',
  requireAuth,
  [
    body('code').notEmpty().withMessage('2FA code is required'),
  ],
  handleValidationErrors,
  authController.verify2FA
);

// GET /api/auth/verify (protected)
router.get('/verify', requireAuth, authController.verifySession);

export default router;
