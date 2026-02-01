import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as quizController from '../controllers/quizController';

const router = Router();

/**
 * Quiz Routes - 8 endpoints
 * All quiz-related operations
 */

// Public routes
router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuizById);
router.get('/:id/statistics', quizController.getQuizStatistics);
router.get('/:id/leaderboard', quizController.getQuizLeaderboard);

// Protected routes (require authentication)
router.post('/:id/start', authenticate, quizController.startQuizAttempt);
router.post('/:id/submit', authenticate, quizController.submitQuizAnswers);
router.get('/:id/attempts', authenticate, quizController.getQuizAttempts);
router.get('/:id/best-score', authenticate, quizController.getBestScore);

export default router;
