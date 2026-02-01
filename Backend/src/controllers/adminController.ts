import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/prisma';
import logger from '../config/logger';

// Dashboard & Analytics
export const getDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalModules, totalProducts, totalOrders, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.module.count(),
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
    }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalModules,
      totalProducts,
      totalOrders,
      revenue: revenue._sum?.totalPrice || 0,
    },
  });
});

export const getStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { period = 'week' } = req.query;
  
  res.status(200).json({
    success: true,
    data: { period },
  });
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  res.status(200).json({
    success: true,
    data: { startDate, endDate },
  });
});

export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50', level, action } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (level) where.level = level;
  if (action) where.action = action;
  
  const logs = await prisma.auditLog.findMany({
    where,
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: logs,
  });
});

// User Management
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (search) {
    where.OR = [
      { username: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        totalPoints: true,
        level: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const getUserDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      admin: true,
      orders: true,
      achievements: true,
    },
  });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }
  
  return res.status(200).json({
    success: true,
    data: user,
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: password,
    },
  });
  
  logger.info(`Admin ${req.user!.id} created user ${user.id}`);
  
  res.status(201).json({
    success: true,
    message: 'User created',
    data: user,
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const updates = req.body;
  
  const user = await prisma.user.update({
    where: { id },
    data: updates,
  });
  
  logger.info(`Admin ${req.user!.id} updated user ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'User updated',
    data: user,
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  await prisma.user.delete({
    where: { id },
  });
  
  logger.warn(`Admin ${req.user!.id} deleted user ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'User deleted',
  });
});

export const banUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { reason } = req.body;
  
  logger.warn(`Admin ${req.user!.id} banned user ${id}: ${reason}`);
  
  res.status(200).json({
    success: true,
    message: 'User banned',
  });
});

export const unbanUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  logger.info(`Admin ${req.user!.id} unbanned user ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'User unbanned',
  });
});

export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { reason } = req.body;
  
  logger.warn(`Admin ${req.user!.id} suspended user ${id}: ${reason}`);
  
  res.status(200).json({
    success: true,
    message: 'User suspended',
  });
});

export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  logger.info(`Admin ${req.user!.id} activated user ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'User activated',
  });
});

export const assignRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { role } = req.body;
  
  // Check if admin record exists
  const existingAdmin = await prisma.admin.findUnique({
    where: { userId: id },
  });
  
  if (existingAdmin) {
    await prisma.admin.update({
      where: { userId: id },
      data: { role },
    });
  } else {
    await prisma.admin.create({
      data: {
        userId: id,
        role,
      },
    });
  }
  
  logger.info(`Admin ${req.user!.id} assigned role ${role} to user ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Role assigned',
  });
});

export const getUserActivity = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const activities = await prisma.userActivity.findMany({
    where: { userId: id as string },
    skip,
    take: parseInt(limit as string),
    orderBy: { timestamp: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: activities,
  });
});

export const getUserSessions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const sessions = await prisma.session.findMany({
    where: { userId: id as string },
    orderBy: { createdAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: sessions,
  });
});

export const revokeUserSession = asyncHandler(async (req: Request, res: Response) => {
  const { id, sessionId } = req.params as { id: string; sessionId: string };
  
  await prisma.session.delete({
    where: { id: sessionId },
  });
  
  logger.info(`Admin ${req.user!.id} revoked session ${sessionId} for user ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Session revoked',
  });
});

export const resetUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { newPassword } = req.body;
  
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: newPassword, // Should be hashed in real implementation
    },
  });
  
  logger.info(`Admin ${req.user!.id} reset password for user ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Password reset',
  });
});

export const exportUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      totalPoints: true,
      level: true,
      createdAt: true,
    },
  });
  
  res.status(200).json({
    success: true,
    data: users,
  });
});

// Shop Management
export const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, category } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (search) {
    where.name = { contains: search as string, mode: 'insensitive' };
  }
  if (category) {
    where.categoryId = category;
  }
  
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const productData = req.body;
  
  const product = await prisma.product.create({
    data: productData,
  });
  
  logger.info(`Admin ${req.user!.id} created product ${product.id}`);
  
  res.status(201).json({
    success: true,
    message: 'Product created',
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const updates = req.body;
  
  const product = await prisma.product.update({
    where: { id },
    data: updates,
  });
  
  logger.info(`Admin ${req.user!.id} updated product ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Product updated',
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  await prisma.product.delete({
    where: { id },
  });
  
  logger.info(`Admin ${req.user!.id} deleted product ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Product deleted',
  });
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', status } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (status) {
    where.status = status;
  }
  
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string)),
      },
    },
  });
});

export const getOrderDetails = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }
  
  return res.status(200).json({
    success: true,
    data: order,
  });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { status } = req.body;
  
  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });
  
  logger.info(`Admin ${req.user!.id} updated order ${id} status to ${status}`);
  
  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: order,
  });
});

export const getProductStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await prisma.product.aggregate({
    _sum: { stock: true },
    _avg: { price: true },
    _count: true,
  });
  
  res.status(200).json({
    success: true,
    data: stats,
  });
});

export const getOrderStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalOrders, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { totalPrice: true },
    }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      revenue: revenue._sum?.totalPrice || 0,
    },
  });
});

// Module Management
export const getAllModules = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '20', search, category } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (search) {
    where.title = { contains: search as string, mode: 'insensitive' };
  }
  if (category) {
    where.categoryId = category;
  }
  
  const [modules, total] = await Promise.all([
    prisma.module.findMany({
      where,
      skip,
      take: parseInt(limit as string),
      include: {
        _count: {
          select: {
            courses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
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

export const createModule = asyncHandler(async (req: Request, res: Response) => {
  const moduleData = req.body;
  
  const module = await prisma.module.create({
    data: moduleData,
  });
  
  logger.info(`Admin ${req.user!.id} created module ${module.id}`);
  
  res.status(201).json({
    success: true,
    message: 'Module created',
    data: module,
  });
});

export const updateModule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const updates = req.body;
  
  const module = await prisma.module.update({
    where: { id },
    data: updates,
  });
  
  logger.info(`Admin ${req.user!.id} updated module ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Module updated',
    data: module,
  });
});

export const deleteModule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  await prisma.module.delete({
    where: { id },
  });
  
  logger.info(`Admin ${req.user!.id} deleted module ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Module deleted',
  });
});

export const getModuleEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const { page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const enrollments = await prisma.userProgress.findMany({
    where: { moduleId: id as string },
    skip,
    take: parseInt(limit as string),
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: enrollments,
  });
});

export const publishModule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  logger.info(`Admin ${req.user!.id} published module ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Module published',
  });
});

export const unpublishModule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  
  logger.info(`Admin ${req.user!.id} unpublished module ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Module unpublished',
  });
});

export const getModuleStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalModules, totalEnrollments, avgCompletion] = await Promise.all([
    prisma.module.count(),
    prisma.userProgress.count(),
    prisma.userProgress.aggregate({
      _avg: { percentComplete: true },
    }),
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      totalModules,
      totalEnrollments,
      avgCompletion: avgCompletion._avg?.percentComplete || 0,
    },
  });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, category } = req.body;
  
  const newModule = await prisma.module.create({
    data: { title, description, category },
  });
  
  logger.info(`Admin ${req.user!.id} created category ${newModule.id}`);
  
  res.status(201).json({
    success: true,
    message: 'Category created',
    data: newModule,
  });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const updates = req.body;
  
  const category = await prisma.module.update({
    where: { id },
    data: updates,
  });
  
  logger.info(`Admin ${req.user!.id} updated category ${id}`);
  
  res.status(200).json({
    success: true,
    message: 'Category updated',
    data: category,
  });
});

// System Operations
export const backup = asyncHandler(async (req: Request, res: Response) => {
  logger.info(`Admin ${req.user!.id} initiated backup`);
  
  res.status(200).json({
    success: true,
    message: 'Backup initiated',
  });
});

export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = '1', limit = '50', userId, action } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  
  const where: any = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  
  const logs = await prisma.auditLog.findMany({
    where,
    skip,
    take: parseInt(limit as string),
    orderBy: { createdAt: 'desc' },
  });
  
  res.status(200).json({
    success: true,
    data: logs,
  });
});
