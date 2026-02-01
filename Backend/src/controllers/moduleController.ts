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
  const { id } = req.params as { id: string };
  
  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      quizzes: true,
    },
  });
  
  if (!module) {
    return res.status(404).json({
      success: false,
      message: 'Module not found',
    });
  }
  
  return res.status(200).json({
    success: true,
    data: module,
  });
});

export const getModulesByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params as { category: string };
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const modules = await prisma.module.findMany({
    where: {
      category: category,
    },
    skip,
    take: parseInt(limit as string),
  });
  
  return res.status(200).json({
    success: true,
    data: modules,
  });
});

export const startModule = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const progress = await prisma.userProgress.create({
    data: {
      userId,
      moduleId: id,
      status: 'IN_PROGRESS',
    },
  });
  
  logger.info(`User ${userId} started module ${id}`);
  
  return res.status(200).json({
    success: true,
    message: 'Module started',
    data: progress,
  });
});

export const getModuleContent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const lessons = await prisma.course.findMany({
    where: { moduleId: id },
  });
  
  return res.status(200).json({
    success: true,
    data: lessons,
  });
});

export const completeModule = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  await prisma.userProgress.updateMany({
    where: {
      userId,
      moduleId: id,
    },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      percentComplete: 100,
    },
  });
  
  logger.info(`User ${userId} completed module ${id}`);
  
  return res.status(200).json({
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
  
  return res.status(200).json({
    success: true,
    data: quizzes,
  });
});

export const getQuizById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const quiz = await prisma.quiz.findUnique({
    where: { id },
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

export const startQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const attempt = await prisma.quizResult.create({
    data: {
      userId,
      quizId: id,
      score: 0,
      answers: {},
    },
  });
  
  logger.info(`User ${userId} started quiz ${id}`);
  
  return res.status(200).json({
    success: true,
    message: 'Quiz started',
    data: attempt,
  });
});

export const submitQuiz = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  const { attemptId } = req.body;
  
  // Calculate score
  const quiz = await prisma.quiz.findUnique({
    where: { id },
  });
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      message: 'Quiz not found',
    });
  }
  
  const score = 85; // Placeholder calculation
  
  await prisma.quizResult.update({
    where: { id: attemptId },
    data: {
      completedAt: new Date(),
      score,
    },
  });
  
  logger.info(`User ${userId} submitted quiz ${id} with score ${score}`);
  
  return res.status(200).json({
    success: true,
    message: 'Quiz submitted',
    data: {
      score,
      passed: score >= 70,
    },
  });
});

export const getQuizResults = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const attempts = await prisma.quizResult.findMany({
    where: {
      userId,
      quizId: id,
    },
  });
  
  return res.status(200).json({
    success: true,
    data: attempts,
  });
});

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', upcoming } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (upcoming === 'true') {
    where.date = { gte: new Date() };
  }
  
  const events = await prisma.event.findMany({
    where,
    skip,
    take: parseInt(limit as string),
    orderBy: { date: 'asc' },
  });
  
  return res.status(200).json({
    success: true,
    data: events,
  });
});

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
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
  
  return res.status(200).json({
    success: true,
    data: event,
  });
});

export const registerForEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  const registration = await prisma.eventRegistration.create({
    data: {
      userId,
      eventId: id,
    },
  });
  
  logger.info(`User ${userId} registered for event ${id}`);
  
  return res.status(200).json({
    success: true,
    message: 'Registered for event',
    data: registration,
  });
});

export const unregisterFromEvent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  await prisma.eventRegistration.deleteMany({
    where: {
      userId,
      eventId: id,
    },
  });
  
  logger.info(`User ${userId} unregistered from event ${id}`);
  
  return res.status(200).json({
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
    orderBy: { createdAt: 'desc' },
  });
  
  return res.status(200).json({
    success: true,
    data: meetings,
  });
});

export const getMeetingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const meeting = await prisma.meeting.findUnique({
    where: { id },
  });
  
  if (!meeting) {
    return res.status(404).json({
      success: false,
      message: 'Meeting not found',
    });
  }
  
  return res.status(200).json({
    success: true,
    data: meeting,
  });
});

export const joinMeeting = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  logger.info(`User ${userId} joined meeting ${id}`);
  
  return res.status(200).json({
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
  });
  
  return res.status(200).json({
    success: true,
    data: modules,
  });
});

export const getRecommended = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '10' } = req.query;
  
  // Simple recommendation: get popular modules
  const modules = await prisma.module.findMany({
    take: parseInt(limit as string),
  });
  
  return res.status(200).json({
    success: true,
    data: modules,
  });
});
