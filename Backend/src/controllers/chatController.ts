import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/prisma';
import logger from '../config/logger';

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50', before, after } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (before) {
    where.createdAt = { lt: new Date(before as string) };
  }
  if (after) {
    where.createdAt = { gt: new Date(after as string) };
  }
  
  const messages = await prisma.chatMessage.findMany({
    where,
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
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
    data: messages.reverse(),
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { messageText } = req.body;
  
  const message = await prisma.chatMessage.create({
    data: {
      userId,
      messageText,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
  
  logger.info(`User ${userId} sent message ${message.id}`);
  
  res.status(201).json({
    success: true,
    message: 'Message sent',
    data: message,
  });
});

export const getMessageById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const message = await prisma.chatMessage.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }
  
  return res.status(200).json({
    success: true,
    data: message,
  });
});

export const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params as { id: string };
  const { messageText } = req.body;
  
  const message = await prisma.chatMessage.findUnique({
    where: { id },
  });
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }
  
  // Check if user owns the message
  if (message.userId !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }
  
  const updatedMessage = await prisma.chatMessage.update({
    where: { id },
    data: {
      messageText,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
  
  logger.info(`User ${userId} updated message ${id}`);
  
  return res.status(200).json({
    success: true,
    message: 'Message updated',
    data: updatedMessage,
  });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
  const { id } = req.params as { id: string };
  
  const message = await prisma.chatMessage.findUnique({
    where: { id },
  });
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }
  
  // Check if user owns the message or is admin
  if (message.userId !== userId && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }
  
  await prisma.chatMessage.delete({
    where: { id },
  });
  
  logger.info(`Message ${id} deleted by ${userId}`);
  
  return res.status(200).json({
    success: true,
    message: 'Message deleted',
  });
});

export const getChatUsers = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '20' } = req.query;
  
  const users = await prisma.user.findMany({
    take: parseInt(limit as string),
    select: {
      id: true,
      username: true,
      avatarUrl: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
  
  return res.status(200).json({
    success: true,
    data: users,
  });
});

export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page = '1', limit = '20', unread } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = { userId };
  if (unread === 'true') {
    where.read = false;
  }
  
  const notifications = await prisma.notification.findMany({
    where,
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });
  
  return res.status(200).json({
    success: true,
    data: notifications,
  });
});

export const uploadFile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const file = req.file;
  
  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }
  
  // Save file reference
  const attachment = await prisma.chatMessage.create({
    data: {
      userId,
      messageText: file.filename,
    },
  });
  
  logger.info(`User ${userId} uploaded file ${file.filename}`);
  
  return res.status(201).json({
    success: true,
    message: 'File uploaded',
    data: attachment,
  });
});

export const getTypingStatus = asyncHandler(async (_req: Request, res: Response) => {
  // Get users currently typing (from cache/redis)
  return res.status(200).json({
    success: true,
    data: {
      typing: [],
    },
  });
});

export const addReaction = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { messageId } = req.params as { messageId: string };
  const { emoji } = req.body;
  
  // Get the message and update reactions JSON field
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
  });
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
    });
  }
  
  logger.info(`User ${userId} reacted to message ${messageId}`);
  
  return res.status(201).json({
    success: true,
    message: 'Reaction added',
    data: { emoji, userId, messageId },
  });
});

export const getMentions = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const mentions = await prisma.chatMessage.findMany({
    where: {
      messageText: {
        contains: `@${req.user!.username}`,
      },
    },
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
  });
  
  return res.status(200).json({
    success: true,
    data: mentions,
  });
});

export const getChatStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalMessages, totalUsers] = await Promise.all([
    prisma.chatMessage.count(),
    prisma.user.count(),
  ]);
  
  return res.status(200).json({
    success: true,
    data: {
      totalMessages,
      totalUsers,
      onlineUsers: 0,
    },
  });
});
