import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { quizService } from '../services';
import logger from '../config/logger';
import prisma from '../config/prisma';

// GET /api/quizzes - Get all quizzes with filtering
export const getQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1');
  const limit = parseInt((req.query.limit as string) || '20');
  const moduleId = req.query.moduleId as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;
  const search = req.query.search as string | undefined;
  const skip = (page - 1) * limit;
  
  const where: any = {};
  
  if (moduleId && typeof moduleId === 'string') {
    where.moduleId = moduleId;
  }
  
  if (difficulty && typeof difficulty === 'string') {
    where.module = {
      difficulty: difficulty,
    };
  }
  
  if (search && typeof search === 'string') {
    where.title = {
      contains: search,
      mode: 'insensitive' as const,
    };
  }
  
  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where,
      skip,
      take: limit,
      include: {
        module: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            category: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    }),
    prisma.quiz.count({ where }),
  ]);
  
  return res.status(200).json({
    success: true,
    data: {
      quizzes: quizzes.map((quiz) => ({
        ...quiz,
        questions: undefined, // Don't send questions in list view
        totalAttempts: quiz._count.results,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// GET /api/quizzes/:id - Get quiz by ID (with questions)
export const getQuizById = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          difficulty: true,
          category: true,
          points: true,
        },
      },
    },
  });
  
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

// POST /api/quizzes/:id/start - Start a quiz attempt
export const startQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  
  // Verify quiz exists
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { module: true },
  });
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }
  
  // Create quiz attempt
  const attempt = await prisma.quizResult.create({
    data: {
      userId,
      quizId: id as string,
    },
  });
  
  logger.info(`User ${userId} started quiz ${id} (attempt ${attempt.id})`);
  
  return res.status(200).json({
    success: true,
    message: 'Quiz started successfully',
    data: {
      attemptId: attempt.id,
      quizId: quiz.id,
      title: quiz.title,
      questionsCount: (quiz.questions as any[])?.length || 0,
      startedAt: attempt.createdAt,
    },
  });
});

// POST /api/quizzes/:id/submit - Submit quiz answers
export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  const { attemptId, answers } = req.body;
  
  if (!attemptId || !answers) {
    return res.status(400).json({
      success: false,
      message: 'Attempt ID and answers are required',
    });
  }
  
  // Get quiz with questions
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { module: true },
  });
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }
  
  // Verify attempt belongs to user
  const attempt = await prisma.quizResult.findFirst({
    where: {
      id: attemptId as string,
      userId,
      quizId: id as string,
    },
  });
  
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: 'Quiz attempt not found',
    });
  }
  
  if (attempt.completedAt) {
    return res.status(400).json({
      success: false,
      message: 'Quiz already submitted',
    });
  }
  
  // Calculate score using quizService
  const result = await quizService.calculateScore(quiz, answers);
  
  // Update attempt with results
  const updatedAttempt = await prisma.quizResult.update({
    where: { id: attemptId },
    data: {
      answers,
      score: result.score,
      passed: result.passed,
      completedAt: new Date(),
    },
  });
  
  // Update user points if passed
  if (result.passed && quiz.module?.points) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: {
          increment: quiz.module.points,
        },
      },
    });
  }
  
  logger.info(`User ${userId} submitted quiz ${id} - Score: ${result.score}% - ${result.passed ? 'PASSED' : 'FAILED'}`);
  
  return res.status(200).json({
    success: true,
    message: 'Quiz submitted successfully',
    data: {
      attemptId: updatedAttempt.id,
      score: result.score,
      passed: result.passed,
      correctAnswers: result.correctAnswers,
      totalQuestions: result.totalQuestions,
      pointsEarned: result.passed ? (quiz.module?.points || 0) : 0,
      completedAt: updatedAttempt.completedAt,
    },
  });
});

// GET /api/quizzes/:id/results - Get quiz results for current user
export const getQuizResults = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const id = req.params.id as string;
  
  const attempts = await prisma.quizResult.findMany({
    where: {
      userId,
      quizId: id as string,
    },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          module: {
            select: {
              title: true,
              difficulty: true,
            },
          },
        },
      },
    },
    orderBy: {
      completedAt: 'desc',
    },
  });
  
  return res.status(200).json({
    success: true,
    data: {
      attempts,
      bestScore: Math.max(...attempts.map((a) => a.score), 0),
      totalAttempts: attempts.length,
      passed: attempts.some((a) => a.passed),
    },
  });
});

// GET /api/quizzes/user/attempts - Get all quiz attempts for current user
export const getUserQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const page = parseInt((req.query.page as string) || '1');
  const limit = parseInt((req.query.limit as string) || '20');
  const completed = req.query.completed as string | undefined;
  const skip = (page - 1) * limit;
  
  const where: any = { userId };
  
  if (typeof completed === 'string') {
    if (completed === 'true') {
      where.completedAt = { not: null };
    } else if (completed === 'false') {
      where.completedAt = null;
    }
  }
  
  const [attempts, total] = await Promise.all([
    prisma.quizResult.findMany({
      where,
      skip,
      take: limit,
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc' as const,
      },
    }),
    prisma.quizResult.count({ where }),
  ]);
  
  return res.status(200).json({
    success: true,
    data: {
      attempts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// GET /api/quizzes/motorization - Get quizzes related to motorization
export const getMotoryzationQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1');
  const limit = parseInt((req.query.limit as string) || '20');
  const skip = (page - 1) * limit;
  
  const [quizzes, total] = await Promise.all([
    prisma.quiz.findMany({
      where: {
        OR: [
          { title: { contains: 'motorization', mode: 'insensitive' } },
          { title: { contains: 'vehicle', mode: 'insensitive' } },
          { title: { contains: 'automotive', mode: 'insensitive' } },
          { title: { contains: 'car', mode: 'insensitive' } },
          { module: { category: { contains: 'motorization', mode: 'insensitive' } } },
        ],
      },
      skip,
      take: limit,
      include: {
        module: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            category: true,
          },
        },
      },
    }),
    prisma.quiz.count({
      where: {
        OR: [
          { title: { contains: 'motorization', mode: 'insensitive' } },
          { title: { contains: 'vehicle', mode: 'insensitive' } },
          { title: { contains: 'automotive', mode: 'insensitive' } },
          { title: { contains: 'car', mode: 'insensitive' } },
          { module: { category: { contains: 'motorization', mode: 'insensitive' } } },
        ],
      },
    }),
  ]);
  
  return res.status(200).json({
    success: true,
    data: {
      quizzes: quizzes.map((quiz) => ({
        ...quiz,
        questions: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
});

// GET /api/quizzes/leaderboard/:id - Get quiz leaderboard
export const getQuizLeaderboard = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const limit = parseInt((req.query.limit as string) || '50');
  
  const quiz = await prisma.quiz.findUnique({
    where: { id: id as string },
    select: { id: true, title: true },
  });
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }
  
  // Get best attempts for each user
  const leaderboard = await prisma.$queryRaw<any[]>`
    SELECT 
      u.id,
      u.username,
      u.avatar_url as "avatarUrl",
      MAX(qr.score) as score,
      MIN(qr.completed_at) as "firstCompletedAt",
      COUNT(*) as attempts
    FROM users u
    INNER JOIN quiz_results qr ON u.id = qr.user_id
    WHERE qr.quiz_id = ${id}
      AND qr.completed_at IS NOT NULL
      AND qr.passed = true
    GROUP BY u.id, u.username, u.avatar_url
    ORDER BY score DESC, "firstCompletedAt" ASC
    LIMIT ${limit}
  `;
  
  return res.status(200).json({
    success: true,
    data: {
      quiz,
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        ...entry,
      })),
    },
  });
});
