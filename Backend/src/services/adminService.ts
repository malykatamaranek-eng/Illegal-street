import prisma from '../config/prisma';
import logger from '../config/logger';
import bcrypt from 'bcrypt';

export class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalModules,
        totalProducts,
        totalOrders,
        revenue,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.module.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalPrice: true },
          where: { status: 'DELIVERED' },
        }),
      ]);

      return {
        totalUsers,
        totalModules,
        totalProducts,
        totalOrders,
        revenue: Number(revenue._sum.totalPrice || 0),
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get all users with pagination
   */
  async getAllUsers(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
            level: true,
            totalPoints: true,
            createdAt: true,
            admin: {
              select: {
                role: true,
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
      ]);

      return {
        users,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Create new user
   */
  async createUser(data: {
    email: string;
    username: string;
    password: string;
    role?: string;
  }) {
    try {
      const { email, username, password, role } = data;

      // Check if user exists
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existing) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
        },
      });

      // Create admin role if specified
      if (role && (role === 'ADMIN' || role === 'SUPER_ADMIN')) {
        await prisma.admin.create({
          data: {
            userId: user.id,
            role,
          },
        });
      }

      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: any) {
    try {
      const updateData: any = {};

      if (data.email) updateData.email = data.email;
      if (data.username) updateData.username = data.username;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.level) updateData.level = parseInt(data.level);
      if (data.totalPoints !== undefined)
        updateData.totalPoints = parseInt(data.totalPoints);

      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, 12);
      }

      return await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string) {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
      return true;
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Log admin action
   */
  async logAction(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    changes?: any,
    ipAddress?: string
  ) {
    try {
      return await prisma.auditLog.create({
        data: {
          adminId,
          action,
          targetType,
          targetId,
          changes,
          ipAddress,
        },
      });
    } catch (error) {
      logger.error('Error logging admin action:', error);
      // Don't throw - logging should not break the operation
      return null;
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(page: number = 1, limit: number = 50) {
    try {
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          include: {
            admin: {
              include: {
                user: {
                  select: {
                    username: true,
                    email: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count(),
      ]);

      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error fetching audit logs:', error);
      throw new Error('Failed to fetch audit logs');
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    userId: string,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      const skip = (page - 1) * limit;

      const [activities, total] = await Promise.all([
        prisma.userActivity.findMany({
          where: { userId },
          skip,
          take: limit,
          orderBy: { timestamp: 'desc' },
        }),
        prisma.userActivity.count({ where: { userId } }),
      ]);

      return {
        activities,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      throw new Error('Failed to fetch user activity');
    }
  }

  /**
   * Manage modules (CRUD operations handled by controllers)
   */

  /**
   * Get order statistics
   */
  async getOrderStats() {
    try {
      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        revenue,
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.order.aggregate({
          _sum: { totalPrice: true },
          where: { status: 'DELIVERED' },
        }),
      ]);

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        revenue: Number(revenue._sum.totalPrice || 0),
      };
    } catch (error) {
      logger.error('Error fetching order stats:', error);
      throw new Error('Failed to fetch order statistics');
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: string) {
    try {
      return await prisma.order.update({
        where: { id: orderId },
        data: { status: status as any },
      });
    } catch (error) {
      logger.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }
}

export default new AdminService();
