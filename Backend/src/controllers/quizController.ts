import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { quizService } from '../services';
import logger from '../config/logger';

/**
 * Quiz Controller
 * Handles all quiz-related endpoints (8 endpoints)
 */

// 1. Get all quizzes
export const getAllQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId, page = '1', limit = '20' } = req.query;
  
  const quizzes = await quizService.getQuizzes(moduleId as string);
  
  return res.status(200).json({
    success: true,
    data: quizzes,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    },
  });
});

// 2. Get quiz by ID
export const getQuizById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const quiz = await quizService.getQuizById(id);
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }
  
  return res.status(200).json({
    success: true,
    data: quiz,
  });
});

// 3. Start quiz attempt
export const startQuizAttempt = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const attempt = await quizService.startQuizAttempt(userId, id);
  
  logger.info(`User ${userId} started quiz ${id}`);
  
  return res.status(200).json({
    success: true,
    message: 'Quiz attempt started',
    data: attempt,
  });
});

// 4. Submit quiz answers
export const submitQuizAnswers = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  const { attemptId, answers } = req.body;
  
  const result = await quizService.submitQuizAnswers(userId, id, attemptId, answers);
  
  logger.info(`User ${userId} submitted quiz ${id} with score ${result.score}`);
  
  return res.status(200).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: result,
  });
});

// 5. Get quiz results/attempts
export const getQuizAttempts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const attempts = await quizService.getQuizAttempts(userId, id);
  
  return res.status(200).json({
    success: true,
    data: attempts,
  });
});

// 6. Get user's best score for a quiz
export const getBestScore = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const bestScore = await quizService.getBestScore(userId, id);
  
  return res.status(200).json({
    success: true,
    data: { bestScore },
  });
});

// 7. Get quiz statistics
export const getQuizStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const stats = await quizService.getQuizStatistics(id);
  
  return res.status(200).json({
    success: true,
    data: stats,
  });
});

// 8. Get quiz leaderboard
export const getQuizLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { limit = '10' } = req.query;
  
  const leaderboard = await quizService.getQuizLeaderboard(id, parseInt(limit as string));
  
  return res.status(200).json({
    success: true,
    data: leaderboard,
  });
});

export default {
  getAllQuizzes,
  getQuizById,
  startQuizAttempt,
  submitQuizAnswers,
  getQuizAttempts,
  getBestScore,
  getQuizStatistics,
  getQuizLeaderboard,
};
