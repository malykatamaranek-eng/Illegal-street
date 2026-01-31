import { Router } from 'express';
import * as rankingController from '../controllers/rankingController';
import {
  requireAuth,
  optionalAuth,
  validateId,
  handleValidationErrors,
  apiLimiter,
} from '../middleware';
import { query } from 'express-validator';

const router = Router();

// GET /api/ranking/global
router.get(
  '/global',
  apiLimiter,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  rankingController.getGlobalRanking
);

// GET /api/ranking/monthly
router.get(
  '/monthly',
  apiLimiter,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  rankingController.getMonthlyRanking
);

// GET /api/ranking/me (protected)
router.get('/me', requireAuth, rankingController.getMyPosition);

// GET /api/ranking/user/:id
router.get(
  '/user/:id',
  validateId,
  handleValidationErrors,
  rankingController.getUserRanking
);

// GET /api/ranking/level/:level
router.get(
  '/level/:level',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  rankingController.getRankingByLevel
);

// GET /api/ranking/achievements
router.get('/achievements', apiLimiter, rankingController.getAllAchievements);

// GET /api/ranking/achievements/:id
router.get(
  '/achievements/:id',
  validateId,
  handleValidationErrors,
  rankingController.getAchievementById
);

// GET /api/ranking/badges (protected)
router.get('/badges', requireAuth, rankingController.getMyBadges);

export default router;
