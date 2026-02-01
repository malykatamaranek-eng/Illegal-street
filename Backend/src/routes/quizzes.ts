import { Router } from 'express';
import * as quizController from '../controllers/quizController';
import {
  requireAuth,
  validateId,
  handleValidationErrors,
  apiLimiter,
} from '../middleware';
import { body, query } from 'express-validator';

const router = Router();

// GET /api/quizzes - Get all quizzes with filtering
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('moduleId').optional().isString(),
    query('difficulty').optional().isIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
    query('search').optional().isString(),
  ],
  handleValidationErrors,
  quizController.getQuizzes
);

// GET /api/quizzes/motorization - Get motorization-related quizzes
router.get(
  '/motorization',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  handleValidationErrors,
  quizController.getMotoryzationQuizzes
);

// GET /api/quizzes/user/attempts - Get user's quiz attempts
router.get(
  '/user/attempts',
  requireAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('completed').optional().isBoolean(),
  ],
  handleValidationErrors,
  quizController.getUserQuizzes
);

// GET /api/quizzes/:id - Get quiz by ID
router.get(
  '/:id',
  validateId,
  handleValidationErrors,
  quizController.getQuizById
);

// POST /api/quizzes/:id/start - Start a quiz attempt
router.post(
  '/:id/start',
  requireAuth,
  apiLimiter,
  validateId,
  handleValidationErrors,
  quizController.startQuiz
);

// POST /api/quizzes/:id/submit - Submit quiz answers
router.post(
  '/:id/submit',
  requireAuth,
  apiLimiter,
  validateId,
  [
    body('attemptId').notEmpty().withMessage('Attempt ID is required'),
    body('answers').isObject().withMessage('Answers must be an object'),
  ],
  handleValidationErrors,
  quizController.submitQuiz
);

// GET /api/quizzes/:id/results - Get quiz results
router.get(
  '/:id/results',
  requireAuth,
  validateId,
  handleValidationErrors,
  quizController.getQuizResults
);

// GET /api/quizzes/:id/leaderboard - Get quiz leaderboard
router.get(
  '/:id/leaderboard',
  validateId,
  [query('limit').optional().isInt({ min: 1, max: 100 })],
  handleValidationErrors,
  quizController.getQuizLeaderboard
);

export default router;
