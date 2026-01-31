import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../config/logger';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  logger.info(`User registered: ${req.body.email}`);
  
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  logger.info(`User logged in: ${req.body.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  
  res.status(200).json({
    success: true,
    message: 'Token refreshed',
    data: result,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
  
  await authService.logout(userId, token);
  logger.info(`User logged out: ${userId}`);
  
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  
  res.status(200).json({
    success: true,
    message: 'Password reset email sent',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  
  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  await authService.verifyEmail(token);
  
  res.status(200).json({
    success: true,
    message: 'Email verified successfully',
  });
});

export const setup2FA = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const result = await authService.setup2FA(userId);
  
  res.status(200).json({
    success: true,
    message: '2FA setup initiated',
    data: result,
  });
});

export const verify2FA = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { code } = req.body;
  const result = await authService.verify2FA(userId, code);
  
  res.status(200).json({
    success: true,
    message: '2FA verified',
    data: result,
  });
});

export const verifySession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  
  res.status(200).json({
    success: true,
    message: 'Session valid',
    data: {
      user: req.user,
    },
  });
});
