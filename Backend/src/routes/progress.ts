import { Router } from 'express';
import * as progressController from '../controllers/progressController';
import {
  requireAuth,
  validateId,
  handleValidationErrors,
} from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// GET /api/progress (protected)
router.get('/', requireAuth, progressController.getProgress);

// GET /api/progress/statistics (protected)
router.get('/statistics', requireAuth, progressController.getStatistics);

// GET /api/progress/chart (protected)
router.get(
  '/chart',
  requireAuth,
  [query('period').optional().isIn(['week', 'month', 'year'])],
  handleValidationErrors,
  progressController.getChart
);

// GET /api/progress/streak (protected)
router.get('/streak', requireAuth, progressController.getStreak);

// POST /api/progress/streak/reset (protected)
router.post('/streak/reset', requireAuth, progressController.resetStreak);

// GET /api/progress/calendar (protected)
router.get(
  '/calendar',
  requireAuth,
  [
    query('year').notEmpty().isInt({ min: 2000, max: 2100 }),
    query('month').notEmpty().isInt({ min: 1, max: 12 }),
  ],
  handleValidationErrors,
  progressController.getCalendar
);

// GET /api/progress/time-spent (protected)
router.get(
  '/time-spent',
  requireAuth,
  [query('period').optional().isIn(['week', 'month', 'year'])],
  handleValidationErrors,
  progressController.getTimeSpent
);

// GET /api/progress/completion-rate (protected)
router.get('/completion-rate', requireAuth, progressController.getCompletionRate);

// GET /api/progress/export (protected)
router.get(
  '/export',
  requireAuth,
  [query('format').optional().isIn(['json', 'csv'])],
  handleValidationErrors,
  progressController.exportProgress
);

// GET /api/progress/goals (protected)
router.get('/goals', requireAuth, progressController.getGoals);

// POST /api/progress/goals (protected)
router.post(
  '/goals',
  requireAuth,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional().isString(),
    body('targetDate').notEmpty().isISO8601().withMessage('Valid target date is required'),
    body('targetValue').notEmpty().isInt({ min: 1 }).withMessage('Target value must be positive'),
  ],
  handleValidationErrors,
  progressController.createGoal
);

// GET /api/progress/module/:moduleId (protected)
router.get(
  '/module/:moduleId',
  requireAuth,
  validateId,
  handleValidationErrors,
  progressController.getModuleProgress
);

export default router;
