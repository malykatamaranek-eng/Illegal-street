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
      avatar: true,
      points: true,
      level: true,
    },
    orderBy: { points: 'desc' },
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
      avatar: true,
      points: true,
      level: true,
      monthlyPoints: true,
    },
    orderBy: { monthlyPoints: 'desc' },
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

export const getMyPosition = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      avatar: true,
      points: true,
      level: true,
      monthlyPoints: true,
    },
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  const globalRank = await prisma.user.count({
    where: {
      points: {
        gt: user.points,
      },
    },
  });
  
  const monthlyRank = await prisma.user.count({
    where: {
      monthlyPoints: {
        gt: user.monthlyPoints || 0,
      },
    },
  });
  
  res.status(200).json({
    success: true,
    data: {
      user,
      globalRank: globalRank + 1,
      monthlyRank: monthlyRank + 1,
    },
  });
});

export const getUserRanking = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatar: true,
      points: true,
      level: true,
      monthlyPoints: true,
    },
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  const globalRank = await prisma.user.count({
    where: {
      points: {
        gt: user.points,
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
  const { level } = req.params;
  const { page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const users = await prisma.user.findMany({
    where: {
      level: parseInt(level),
    },
    select: {
      id: true,
      username: true,
      avatar: true,
      points: true,
      level: true,
    },
    orderBy: { points: 'desc' },
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

export const getAllAchievements = asyncHandler(async (req: Request, res: Response) => {
  const achievements = await prisma.achievement.findMany({
    orderBy: { points: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: achievements,
  });
});

export const getAchievementById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  const achievement = await prisma.achievement.findUnique({
    where: { id },
    include: {
      userAchievements: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        take: 10,
        orderBy: { unlockedAt: 'desc' },
      },
    },
  });
  
  if (!achievement) {
    return res.status(404).json({
      success: false,
      message: 'Achievement not found',
    });
  }
  
  res.status(200).json({
    success: true,
    data: achievement,
  });
});

export const getMyBadges = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const badges = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: { unlockedAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: badges,
  });
});
