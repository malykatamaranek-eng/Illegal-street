import { Router } from 'express';
import * as moduleController from '../controllers/moduleController';
import {
  requireAuth,
  optionalAuth,
  validateId,
  handleValidationErrors,
  apiLimiter,
} from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// GET /api/modules
router.get(
  '/',
  apiLimiter,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString(),
    query('level').optional().isString(),
  ],
  handleValidationErrors,
  moduleController.getModules
);

// GET /api/modules/trending
router.get(
  '/trending',
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  handleValidationErrors,
  moduleController.getTrending
);

// GET /api/modules/recommended
router.get(
  '/recommended',
  optionalAuth,
  [query('limit').optional().isInt({ min: 1, max: 50 })],
  handleValidationErrors,
  moduleController.getRecommended
);

// GET /api/modules/category/:category
router.get(
  '/category/:category',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  moduleController.getModulesByCategory
);

// GET /api/modules/:id
router.get(
  '/:id',
  validateId,
  handleValidationErrors,
  moduleController.getModuleById
);

// POST /api/modules/:id/start (protected)
router.post(
  '/:id/start',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.startModule
);

// GET /api/modules/:id/content (protected)
router.get(
  '/:id/content',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.getModuleContent
);

// POST /api/modules/:id/complete (protected)
router.post(
  '/:id/complete',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.completeModule
);

// GET /api/modules/quizzes
router.get(
  '/quizzes',
  requireAuth,
  [query('moduleId').optional().isString()],
  handleValidationErrors,
  moduleController.getQuizzes
);

// GET /api/modules/quizzes/:id
router.get(
  '/quizzes/:id',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.getQuizById
);

// POST /api/modules/quizzes/:id/start (protected)
router.post(
  '/quizzes/:id/start',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.startQuiz
);

// POST /api/modules/quizzes/:id/submit (protected)
router.post(
  '/quizzes/:id/submit',
  requireAuth,
  validateId,
  [
    body('attemptId').notEmpty().withMessage('Attempt ID is required'),
    body('answers').isObject().withMessage('Answers must be an object'),
  ],
  handleValidationErrors,
  moduleController.submitQuiz
);

// GET /api/modules/quizzes/:id/results (protected)
router.get(
  '/quizzes/:id/results',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.getQuizResults
);

// GET /api/modules/events
router.get(
  '/events',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('upcoming').optional().isBoolean(),
  ],
  handleValidationErrors,
  moduleController.getEvents
);

// GET /api/modules/events/:id
router.get(
  '/events/:id',
  validateId,
  handleValidationErrors,
  moduleController.getEventById
);

// POST /api/modules/events/:id/register (protected)
router.post(
  '/events/:id/register',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.registerForEvent
);

// DELETE /api/modules/events/:id/unregister (protected)
router.delete(
  '/events/:id/unregister',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.unregisterFromEvent
);

// GET /api/modules/meetings
router.get(
  '/meetings',
  requireAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  moduleController.getMeetings
);

// GET /api/modules/meetings/:id
router.get(
  '/meetings/:id',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.getMeetingById
);

// POST /api/modules/meetings/:id/join (protected)
router.post(
  '/meetings/:id/join',
  requireAuth,
  validateId,
  handleValidationErrors,
  moduleController.joinMeeting
);

export default router;
