import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/prisma';
import logger from '../config/logger';

export const getModules = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, level } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  if (level) {
    where.level = level;
  }
  
  const [modules, total] = await Promise.all([
    prisma.module.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: { category: true },
    }),
    prisma.module.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      modules,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const getModuleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      category: true,
      lessons: true,
      quizzes: true,
    },
  });
  
  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: module,
  });
});

export const getModulesByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const modules = await prisma.module.findMany({
    where: {
      category: {
        slug: category,
      },
    },
    skip,
    take: parseInt(limit as string),
    include: { category: true },
  });
  
  res.status(200).json({
    success: true,
    data: modules,
  });
});

export const startModule = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  const progress = await prisma.userModuleProgress.create({
    data: {
      userId,
      moduleId: id,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });
  
  logger.info(`User ${userId} started module ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Module started',
    data: progress,
  });
});

export const getModuleContent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const lessons = await prisma.lesson.findMany({
    where: { moduleId: id },
    orderBy: { order: 'asc' },
  });
  
  res.status(200).json({
    success: true,
    data: lessons,
  });
});

export const completeModule = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  const progress = await prisma.userModuleProgress.updateMany({
    where: {
      userId,
      moduleId: id,
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      progress: 100,
    },
  });
  
  logger.info(`User ${userId} completed module ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Module completed',
  });
});

export const getQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const { moduleId } = req.query;
  
  const where: any = {};
  if (moduleId) {
    where.moduleId = moduleId as string;
  }
  
  const quizzes = await prisma.quiz.findMany({
    where,
    include: {
      module: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: quizzes,
  });
});

export const getQuizById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          options: true,
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
  
  res.status(200).json({
    success: true,
    data: quiz,
  });
});

export const startQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId: id,
      startedAt: new Date(),
    },
  });
  
  logger.info(`User ${userId} started quiz ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Quiz started',
    data: attempt,
  });
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { attemptId, answers } = req.body;
  
  // Calculate score
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: {
      questions: {
        include: {
          options: true,
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
  
  let correctAnswers = 0;
  const totalQuestions = quiz.questions.length;
  
  quiz.questions.forEach((question) => {
    const userAnswer = answers[question.id];
    const correctOption = question.options.find((opt) => opt.isCorrect);
    
    if (userAnswer === correctOption?.id) {
      correctAnswers++;
    }
  });
  
  const score = (correctAnswers / totalQuestions) * 100;
  const passed = score >= (quiz.passingScore || 70);
  
  const attempt = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt: new Date(),
      score,
      passed,
    },
  });
  
  logger.info(`User ${userId} submitted quiz ${id} with score ${score}`);
  
  res.status(200).json({
    success: true,
    message: 'Quiz submitted',
    data: {
      score,
      passed,
      correctAnswers,
      totalQuestions,
    },
  });
});

export const getQuizResults = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      quizId: id,
    },
    orderBy: { startedAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: attempts,
  });
});

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', upcoming } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (upcoming === 'true') {
    where.startDate = { gte: new Date() };
  }
  
  const events = await prisma.event.findMany({
    where,
    skip,
    take: parseInt(limit as string),
    orderBy: { startDate: 'asc' },
  });
  
  res.status(200).json({
    success: true,
    data: events,
  });
});

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
      },
    },
  });
  
  if (!event) {
    return res.status(404).json({
      success: false,
      message: 'Event not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: event,
  });
});

export const registerForEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  const registration = await prisma.eventRegistration.create({
    data: {
      userId,
      eventId: id,
    },
  });
  
  logger.info(`User ${userId} registered for event ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Registered for event',
    data: registration,
  });
});

export const unregisterFromEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  await prisma.eventRegistration.deleteMany({
    where: {
      userId,
      eventId: id,
    },
  });
  
  logger.info(`User ${userId} unregistered from event ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Unregistered from event',
  });
});

export const getMeetings = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const meetings = await prisma.meeting.findMany({
    skip,
    take: parseInt(limit as string),
    orderBy: { scheduledAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: meetings,
  });
});

export const getMeetingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const meeting = await prisma.meeting.findUnique({
    where: { id },
  });
  
  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: meeting,
  });
});

export const joinMeeting = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
  logger.info(`User ${userId} joined meeting ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Joined meeting',
    data: {
      meetingId: id,
      joinUrl: `https://meeting.example.com/${id}`,
    },
  });
});

export const getTrending = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '10' } = req.query;
  
  const modules = await prisma.module.findMany({
    take: parseInt(limit as string),
    orderBy: {
      enrollments: {
        _count: 'desc',
      },
    },
    include: {
      category: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: modules,
  });
});

export const getRecommended = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { limit = '10' } = req.query;
  
  // Simple recommendation: get popular modules
  const modules = await prisma.module.findMany({
    take: parseInt(limit as string),
    orderBy: {
      enrollments: {
        _count: 'desc',
      },
    },
    include: {
      category: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: modules,
  });
});
