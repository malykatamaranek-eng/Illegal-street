import { Request, Response } from 'express';
import { userService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../config/logger';
import prisma from '../config/prisma';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await userService.getUser(userId);
  
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const updatedUser = await userService.updateProfile(userId, req.body);
  logger.info(`User profile updated: ${userId}`);
  
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

export const updateAvatar = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  
  const updatedUser = await userService.updateAvatar(userId, file);
  logger.info(`Avatar updated: ${userId}`);
  
  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully',
    data: updatedUser,
  });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { currentPassword, newPassword } = req.body;
  
  await userService.updatePassword(userId, currentPassword, newPassword);
  logger.info(`Password changed: ${userId}`);
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const user = await userService.getUser(id);
  
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  const sessions = await prisma.session.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: sessions,
  });
});

export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id: sessionId } = req.params as { id: string };
  
  await prisma.session.delete({
    where: {
      id: sessionId,
      userId,
    },
  });
  logger.info(`Session deleted: ${sessionId}`);
  
  res.status(200).json({
    success: true,
    message: 'Session deleted successfully',
  });
});

export const getUserAchievements = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const achievements = await prisma.achievement.findMany({
    orderBy: { createdAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: achievements,
  });
});

export const getUserPurchases = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  
  // Users can only view their own purchases
  if (userId !== id) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }
  
  const purchases = await userService.getUserPurchases(id);
  
  res.status(200).json({
    success: true,
    data: purchases,
  });
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      totalPoints: true,
      level: true,
      streak: true,
      _count: {
        select: {
          quizResults: true,
          orders: true,
        },
      },
    },
  });
  
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const followUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id: targetUserId } = req.params as { id: string };
  
  await prisma.follow.create({
    data: {
      followerId: userId,
      followingId: targetUserId,
    },
  });
  
  logger.info(`User ${userId} followed ${targetUserId}`);
  
  res.status(200).json({
    success: true,
    message: 'User followed successfully',
  });
});

export const unfollowUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id: targetUserId } = req.params as { id: string };
  
  await prisma.follow.deleteMany({
    where: {
      followerId: userId,
      followingId: targetUserId,
    },
  });
  
  logger.info(`User ${userId} unfollowed ${targetUserId}`);
  
  res.status(200).json({
    success: true,
    message: 'User unfollowed successfully',
  });
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const followers = await prisma.follow.findMany({
    where: { followingId: id },
    include: {
      follower: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
  
  res.status(200).json({
    success: true,
    data: followers,
  });
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const results = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
    },
    skip,
    take: parseInt(limit as string),
  });
  
  res.status(200).json({
    success: true,
    data: results,
  });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { password } = req.body;
  
  await userService.deleteUser(userId, password);
  logger.warn(`Account deleted: ${userId}`);
  
  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});
