import { Request, Response } from 'express';
import { userService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../config/logger';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await userService.getProfile(userId);
  
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
  
  await userService.changePassword(userId, currentPassword, newPassword);
  logger.info(`Password changed: ${userId}`);
  
  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.getUserById(id);
  
  res.status(200).json({
    success: true,
    data: user,
  });
});

export const getSessions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const sessions = await userService.getUserSessions(userId);
  
  res.status(200).json({
    success: true,
    data: sessions,
  });
});

export const deleteSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id: sessionId } = req.params;
  
  await userService.deleteSession(userId, sessionId);
  logger.info(`Session deleted: ${sessionId}`);
  
  res.status(200).json({
    success: true,
    message: 'Session deleted successfully',
  });
});

export const getUserAchievements = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const achievements = await userService.getUserAchievements(id);
  
  res.status(200).json({
    success: true,
    data: achievements,
  });
});

export const getUserPurchases = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  
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
  const { id } = req.params;
  const stats = await userService.getUserStats(id);
  
  res.status(200).json({
    success: true,
    data: stats,
  });
});

export const followUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id: targetUserId } = req.params;
  
  await userService.followUser(userId, targetUserId);
  logger.info(`User ${userId} followed ${targetUserId}`);
  
  res.status(200).json({
    success: true,
    message: 'User followed successfully',
  });
});

export const unfollowUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id: targetUserId } = req.params;
  
  await userService.unfollowUser(userId, targetUserId);
  logger.info(`User ${userId} unfollowed ${targetUserId}`);
  
  res.status(200).json({
    success: true,
    message: 'User unfollowed successfully',
  });
});

export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const followers = await userService.getFollowers(id);
  
  res.status(200).json({
    success: true,
    data: followers,
  });
});

export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { q, page, limit } = req.query;
  const results = await userService.searchUsers(
    q as string,
    parseInt(page as string) || 1,
    parseInt(limit as string) || 20
  );
  
  res.status(200).json({
    success: true,
    data: results,
  });
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { password } = req.body;
  
  await userService.deleteAccount(userId, password);
  logger.warn(`Account deleted: ${userId}`);
  
  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});
