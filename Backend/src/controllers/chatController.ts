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
          avatar: true,
        },
      },
      reactions: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: messages.reverse(),
  });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { content, replyToId } = req.body;
  
  const message = await prisma.chatMessage.create({
    data: {
      userId,
      content,
      replyToId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
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
  const { id } = req.params;
  
  const message = await prisma.chatMessage.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
      replyTo: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
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
  
  res.status(200).json({
    success: true,
    data: message,
  });
});

export const updateMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { content } = req.body;
  
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
      content,
      edited: true,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    },
  });
  
  logger.info(`User ${userId} updated message ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Message updated',
    data: updatedMessage,
  });
});

export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
  const { id } = req.params;
  
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
  
  res.status(200).json({
    success: true,
    message: 'Message deleted',
  });
});

export const getChatUsers = asyncHandler(async (req: Request, res: Response) => {
  const { limit = '20', online } = req.query;
  
  const where: any = {};
  if (online === 'true') {
    where.isOnline = true;
  }
  
  const users = await prisma.user.findMany({
    where,
    take: parseInt(limit as string),
    select: {
      id: true,
      username: true,
      avatar: true,
      isOnline: true,
      lastSeen: true,
    },
    orderBy: {
      lastSeen: 'desc',
    },
  });
  
  res.status(200).json({
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
  
  res.status(200).json({
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
  const attachment = await prisma.chatAttachment.create({
    data: {
      userId,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
    },
  });
  
  logger.info(`User ${userId} uploaded file ${file.filename}`);
  
  res.status(201).json({
    success: true,
    message: 'File uploaded',
    data: attachment,
  });
});

export const getTypingStatus = asyncHandler(async (req: Request, res: Response) => {
  // Get users currently typing (from cache/redis)
  res.status(200).json({
    success: true,
    data: {
      typing: [],
    },
  });
});

export const addReaction = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { messageId } = req.params;
  const { emoji } = req.body;
  
  // Check if reaction already exists
  const existing = await prisma.messageReaction.findFirst({
    where: {
      messageId,
      userId,
      emoji,
    },
  });
  
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'Reaction already exists',
    });
  }
  
  const reaction = await prisma.messageReaction.create({
    data: {
      messageId,
      userId,
      emoji,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
        },
      },
    },
  });
  
  logger.info(`User ${userId} reacted to message ${messageId}`);
  
  res.status(201).json({
    success: true,
    message: 'Reaction added',
    data: reaction,
  });
});

export const getMentions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const mentions = await prisma.chatMessage.findMany({
    where: {
      content: {
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
          avatar: true,
        },
      },
    },
  });
  
  res.status(200).json({
    success: true,
    data: mentions,
  });
});

export const getChatStats = asyncHandler(async (req: Request, res: Response) => {
  const [totalMessages, totalUsers, onlineUsers] = await Promise.all([
    prisma.chatMessage.count(),
    prisma.user.count(),
    prisma.user.count({
      where: {
        isOnline: true,
      },
    }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalMessages,
      totalUsers,
      onlineUsers,
    },
  });
});
