import prisma from '../config/prisma';
import logger from '../config/logger';
import {
  CreateNotificationData,
  Notification,
  NotificationFilters,
  NotificationType,
} from '../types/notification';

// Helper to get chatGateway instance
// Note: Uses require() instead of import() to avoid circular dependency issues
// at module initialization time. This is intentional and safe since getChatGateway
// is called only after server initialization is complete.
const getChatGateway = () => {
  try {
    // Use dynamic require to avoid circular dependencies
    const server = require('../server');
    return server.chatGateway;
  } catch {
    logger.warn('ChatGateway not available yet');
    return null;
  }
};

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(data: CreateNotificationData): Promise<Notification> {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.user_id,
          message: data.message,
          read: false,
        },
      });

      logger.info(`Notification created for user: ${data.user_id}`);

      // Emit WebSocket event for real-time notification
      this.emitNotification(notification.userId, {
        id: notification.id,
        user_id: notification.userId,
        message: notification.message,
        read: notification.read,
        created_at: notification.createdAt,
        metadata: data.metadata,
      });

      return {
        id: notification.id,
        user_id: notification.userId,
        message: notification.message,
        read: notification.read,
        created_at: notification.createdAt,
        metadata: data.metadata,
      };
    } catch (error) {
      logger.error('Create notification error:', error);
      throw error;
    }
  }

  /**
   * Get user notifications with filters
   */
  async getNotifications(
    userId: string,
    filters?: NotificationFilters
  ): Promise<Notification[]> {
    try {
      const where: any = { userId: userId };

      if (filters?.read !== undefined) {
        where.read = filters.read;
      }

      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const notifications = await prisma.notification.findMany({
        where,
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { createdAt: 'desc' },
      });

      return notifications.map((n) => ({
        id: n.id,
        user_id: n.userId,
        message: n.message,
        read: n.read,
        created_at: n.createdAt,
      }));
    } catch (error) {
      logger.error('Get notifications error:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          read: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Get unread count error:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { read: true },
      });

      logger.info(`Notification marked as read: ${notificationId}`);

      return {
        id: notification.id,
        user_id: notification.userId,
        message: notification.message,
        read: notification.read,
        created_at: notification.createdAt,
      };
    } catch (error) {
      logger.error('Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: userId,
          read: false,
        },
        data: { read: true },
      });

      logger.info(`Marked ${result.count} notifications as read for user: ${userId}`);

      return result.count;
    } catch (error) {
      logger.error('Mark all as read error:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await prisma.notification.delete({
        where: { id: notificationId },
      });

      logger.info(`Notification deleted: ${notificationId}`);
    } catch (error) {
      logger.error('Delete notification error:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<number> {
    try {
      const result = await prisma.notification.deleteMany({
        where: { userId: userId },
      });

      logger.info(`Deleted ${result.count} notifications for user: ${userId}`);

      return result.count;
    } catch (error) {
      logger.error('Delete all notifications error:', error);
      throw error;
    }
  }

  /**
   * Delete read notifications
   */
  async deleteReadNotifications(userId: string): Promise<number> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          userId: userId,
          read: true,
        },
      });

      logger.info(`Deleted ${result.count} read notifications for user: ${userId}`);

      return result.count;
    } catch (error) {
      logger.error('Delete read notifications error:', error);
      throw error;
    }
  }

  /**
   * Send notification to multiple users
   */
  async broadcastNotification(
    userIds: string[],
    message: string,
    _metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const notifications = userIds.map((userId) => ({
        userId: userId,
        message,
        read: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      logger.info(`Broadcast notification sent to ${userIds.length} users`);

      // Emit WebSocket events for real-time notifications
      userIds.forEach((userId) => {
        this.emitNotification(userId, {
          user_id: userId,
          message,
          read: false,
        });
      });
    } catch (error) {
      logger.error('Broadcast notification error:', error);
      throw error;
    }
  }

  /**
   * Helper: Send achievement notification
   */
  async notifyAchievement(userId: string, achievementName: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      message: `🏆 Congratulations! You earned the "${achievementName}" achievement!`,
      type: NotificationType.ACHIEVEMENT,
      metadata: { achievement: achievementName },
    });
  }

  /**
   * Helper: Send follow notification
   */
  async notifyFollow(userId: string, followerUsername: string): Promise<void> {
    await this.createNotification({
      user_id: userId,
      message: `👥 ${followerUsername} started following you!`,
      type: NotificationType.FOLLOW,
      metadata: { follower: followerUsername },
    });
  }

  /**
   * Helper: Send module completion notification
   */
  async notifyModuleCompletion(
    userId: string,
    moduleName: string,
    pointsEarned: number
  ): Promise<void> {
    await this.createNotification({
      user_id: userId,
      message: `🎓 You completed "${moduleName}" and earned ${pointsEarned} points!`,
      type: NotificationType.MODULE,
      metadata: { module: moduleName, points: pointsEarned },
    });
  }

  /**
   * Helper: Send order notification
   */
  async notifyOrder(userId: string, orderId: string, status: string): Promise<void> {
    const statusMessages: Record<string, string> = {
      PAID: '✅ Your order has been confirmed!',
      SHIPPED: '📦 Your order has been shipped!',
      DELIVERED: '🎉 Your order has been delivered!',
      CANCELLED: '❌ Your order has been cancelled.',
    };

    await this.createNotification({
      user_id: userId,
      message: statusMessages[status] || `Order status updated: ${status}`,
      type: NotificationType.ORDER,
      metadata: { orderId, status },
    });
  }

  /**
   * Emit WebSocket notification to user
   */
  private emitNotification(userId: string, notification: any): void {
    try {
      const chatGateway = getChatGateway();
      if (chatGateway) {
        chatGateway.sendToUser(userId, 'notification', notification);
        logger.info(`WebSocket notification sent to user: ${userId}`);
      } else {
        logger.debug('ChatGateway not available - notification will be delivered via polling');
      }
    } catch (error) {
      logger.error('Error emitting notification:', error);
      // Don't throw - notification is already saved in database
    }
  }
}

export default new NotificationService();
