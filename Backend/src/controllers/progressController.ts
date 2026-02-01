import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/prisma';
import logger from '../config/logger';

export const getProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const progress = await prisma.userProgress.findMany({
    where: { userId },
    include: {
      module: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: progress,
  });
});

export const getModuleProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { moduleId } = req.params;
  
  const progress = await prisma.userProgress.findFirst({
    where: {
      userId,
      moduleId,
    },
    include: {
      module: true,
    },
  });
  
  if (!progress) {
    return res.status(404).json({
      success: false,
      message: 'Progress not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: progress,
  });
});

export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const [totalModules, completedModules, inProgressModules, totalTimeSpent] = await Promise.all([
    prisma.userProgress.count({
      where: { userId },
    }),
    prisma.userProgress.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    }),
    prisma.userProgress.count({
      where: {
        userId,
        status: 'IN_PROGRESS',
      },
    }),
    prisma.userProgress.aggregate({
      where: { userId },
      _sum: {
        timeSpent: true,
      },
    }),
  ]);
  
  const completionRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  
  res.status(200).json({
    success: true,
    data: {
      totalModules,
      completedModules,
      inProgressModules,
      totalTimeSpent: totalTimeSpent._sum.timeSpent || 0,
      completionRate: Math.round(completionRate * 100) / 100,
    },
  });
});

export const getChart = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { period = 'week' } = req.query;
  
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const progress = await prisma.userProgress.findMany({
    where: {
      userId,
      startedAt: {
        gte: startDate,
      },
    },
    select: {
      startedAt: true,
      completedAt: true,
      progress: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: progress,
  });
});

export const getStreak = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  // Get user's activity log
  const activities = await prisma.userActivity.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
    take: 365,
  });
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  let previousDate: Date | null = null;
  
  activities.forEach((activity) => {
    if (!previousDate) {
      tempStreak = 1;
    } else {
      const diffDays = Math.floor(
        (previousDate.getTime() - activity.date.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
    
    previousDate = activity.date;
  });
  
  if (tempStreak > longestStreak) {
    longestStreak = tempStreak;
  }
  
  // Check if user was active today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayActivity = activities.find((a) => {
    const activityDate = new Date(a.date);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });
  
  currentStreak = todayActivity ? tempStreak : 0;
  
  res.status(200).json({
    success: true,
    data: {
      currentStreak,
      longestStreak,
    },
  });
});

export const resetStreak = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  // This is typically called when user wants to reset their streak manually
  logger.info(`User ${userId} reset their streak`);
  
  res.status(200).json({
    success: true,
    message: 'Streak reset successfully',
  });
});

export const getCalendar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { year, month } = req.query;
  
  const startDate = new Date(
    parseInt(year as string),
    parseInt(month as string) - 1,
    1
  );
  const endDate = new Date(
    parseInt(year as string),
    parseInt(month as string),
    0
  );
  
  const activities = await prisma.userActivity.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: 'asc' },
  });
  
  res.status(200).json({
    success: true,
    data: activities,
  });
});

export const getTimeSpent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { period = 'week' } = req.query;
  
  const days = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const timeSpent = await prisma.userProgress.aggregate({
    where: {
      userId,
      startedAt: {
        gte: startDate,
      },
    },
    _sum: {
      timeSpent: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: {
      timeSpent: timeSpent._sum.timeSpent || 0,
      period,
    },
  });
});

export const getCompletionRate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const [total, completed] = await Promise.all([
    prisma.userProgress.count({
      where: { userId },
    }),
    prisma.userProgress.count({
      where: {
        userId,
        status: 'COMPLETED',
      },
    }),
  ]);
  
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  
  res.status(200).json({
    success: true,
    data: {
      total,
      completed,
      completionRate: Math.round(completionRate * 100) / 100,
    },
  });
});

export const exportProgress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { format = 'json' } = req.query;
  
  const progress = await prisma.userProgress.findMany({
    where: { userId },
    include: {
      module: true,
    },
  });
  
  if (format === 'csv') {
    // Convert to CSV
    const csv = [
      'Module,Status,Progress,Started,Completed,Time Spent',
      ...progress.map((p) =>
        [
          p.module.title,
          p.status,
          p.progress,
          p.startedAt?.toISOString(),
          p.completedAt?.toISOString() || '',
          p.timeSpent || 0,
        ].join(',')
      ),
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=progress.csv');
    return res.send(csv);
  }
  
  res.status(200).json({
    success: true,
    data: progress,
  });
});

export const getGoals = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const goals = await prisma.userGoal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: goals,
  });
});

export const createGoal = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { title, description, targetDate, targetValue } = req.body;
  
  const goal = await prisma.userGoal.create({
    data: {
      userId,
      title,
      description,
      targetDate: new Date(targetDate),
      targetValue,
      currentValue: 0,
    },
  });
  
  logger.info(`User ${userId} created goal: ${title}`);
  
  res.status(201).json({
    success: true,
    message: 'Goal created successfully',
    data: goal,
  });
});
