import { Router } from 'express';
import * as userController from '../controllers/userController';
import {
  requireAuth,
  validateUpdateProfile,
  validateChangePassword,
  validateId,
  handleValidationErrors,
  uploadSingle,
  apiLimiter,
} from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// GET /api/users/profile (protected)
router.get('/profile', requireAuth, userController.getProfile);

// PUT /api/users/profile (protected)
router.put(
  '/profile',
  requireAuth,
  validateUpdateProfile,
  handleValidationErrors,
  userController.updateProfile
);

// PUT /api/users/avatar (protected, upload)
router.put(
  '/avatar',
  requireAuth,
  uploadSingle('avatar'),
  userController.updateAvatar
);

// PUT /api/users/password (protected)
router.put(
  '/password',
  requireAuth,
  validateChangePassword,
  handleValidationErrors,
  userController.changePassword
);

// GET /api/users/sessions (protected)
router.get('/sessions', requireAuth, userController.getSessions);

// DELETE /api/users/sessions/:id (protected)
router.delete(
  '/sessions/:id',
  requireAuth,
  validateId,
  handleValidationErrors,
  userController.deleteSession
);

// GET /api/users/search
router.get(
  '/search',
  apiLimiter,
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  userController.searchUsers
);

// DELETE /api/users/account (protected)
router.delete(
  '/account',
  requireAuth,
  [
    body('password').notEmpty().withMessage('Password is required for account deletion'),
  ],
  handleValidationErrors,
  userController.deleteAccount
);

// GET /api/users/:id
router.get(
  '/:id',
  validateId,
  handleValidationErrors,
  userController.getUserById
);

// GET /api/users/:id/achievements
router.get(
  '/:id/achievements',
  validateId,
  handleValidationErrors,
  userController.getUserAchievements
);

// GET /api/users/:id/purchases (protected)
router.get(
  '/:id/purchases',
  requireAuth,
  validateId,
  handleValidationErrors,
  userController.getUserPurchases
);

// GET /api/users/stats/:id
router.get(
  '/stats/:id',
  validateId,
  handleValidationErrors,
  userController.getUserStats
);

// POST /api/users/:id/follow (protected)
router.post(
  '/:id/follow',
  requireAuth,
  validateId,
  handleValidationErrors,
  userController.followUser
);

// DELETE /api/users/:id/unfollow (protected)
router.delete(
  '/:id/unfollow',
  requireAuth,
  validateId,
  handleValidationErrors,
  userController.unfollowUser
);

// GET /api/users/:id/followers
router.get(
  '/:id/followers',
  validateId,
  handleValidationErrors,
  userController.getFollowers
);

export default router;
