import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/prisma';

export const getGlobalRanking = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      totalPoints: true,
      level: true,
    },
    orderBy: { totalPoints: 'desc' },
    skip,
    take: parseInt(limit as string),
  });
  
  const usersWithRank = users.map((user, index) => ({
    ...user,
    rank: skip + index + 1,
  }));
  
  res.status(200).json({
    success: true,
    data: usersWithRank,
  });
});

export const getMonthlyRanking = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      totalPoints: true,
      level: true,
    },
    orderBy: { totalPoints: 'desc' },
    skip,
    take: parseInt(limit as string),
  });
  
  const usersWithRank = users.map((user, index) => ({
    ...user,
    rank: skip + index + 1,
  }));
  
  res.status(200).json({
    success: true,
    data: usersWithRank,
  });
});

export const getMyPosition = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      totalPoints: true,
      level: true,
    },
  });
  
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }
  
  const globalRank = await prisma.user.count({
    where: {
      totalPoints: {
        gt: user.totalPoints,
      },
    },
  });
  
  const monthlyRank = 0; // Monthly points removed from schema
  
  res.status(200).json({
    success: true,
    data: {
      user,
      globalRank: globalRank + 1,
      monthlyRank: monthlyRank + 1,
    },
  });
});

export const getUserRanking = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      totalPoints: true,
      level: true,
    },
  });
  
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }
  
  const globalRank = await prisma.user.count({
    where: {
      totalPoints: {
        gt: user.totalPoints,
      },
    },
  });
  
  res.status(200).json({
    success: true,
    data: {
      user,
      globalRank: globalRank + 1,
    },
  });
});

export const getRankingByLevel = asyncHandler(async (req: Request, res: Response) => {
  const { level } = req.params as { level: string };
  const { page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const users = await prisma.user.findMany({
    where: {
      level: parseInt(level),
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      totalPoints: true,
      level: true,
    },
    orderBy: { totalPoints: 'desc' },
    skip,
    take: parseInt(limit as string),
  });
  
  const usersWithRank = users.map((user, index) => ({
    ...user,
    rank: skip + index + 1,
  }));
  
  res.status(200).json({
    success: true,
    data: usersWithRank,
  });
});

export const getAllAchievements = asyncHandler(async (_req: Request, res: Response) => {
  const achievements = await prisma.achievement.findMany({
    orderBy: { id: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: achievements,
  });
});

export const getAchievementById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params as { id: string };
  
  const achievement = await prisma.achievement.findUnique({
    where: { id },
  });
  
  if (!achievement) {
    res.status(404).json({
      success: false,
      message: 'Achievement not found',
    });
    return;
  }
  
  res.status(200).json({
    success: true,
    data: achievement,
  });
});

export const getMyBadges = asyncHandler(async (_req: Request, res: Response) => {
  const badges = await prisma.achievement.findMany({
    orderBy: { id: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: badges,
  });
});
