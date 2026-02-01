import prisma from '../config/prisma';
import logger from '../config/logger';
import redis from '../config/redis';
import {
  GlobalStats,
  ModuleStats,
  DashboardStats,
  UserActivityStats,
  ActivityMetadata,
} from '../types/analytics';

class AnalyticsService {
  /**
   * Track user activity
   */
  async trackUserActivity(
    userId: string,
    action: string,
    metadata?: ActivityMetadata
  ): Promise<void> {
    try {
      // Store activity in Redis for fast access
      const activityKey = `user:activity:${userId}`;
      const timestamp = Date.now();

      const activityData = JSON.stringify({
        action,
        metadata,
        timestamp,
      });

      // Add to sorted set with timestamp as score
      await redis.zadd(activityKey, timestamp, activityData);

      // Set expiry (30 days)
      await redis.expire(activityKey, 2592000);

      // Increment action counter
      const actionCountKey = `user:action-count:${userId}:${action}`;
      await redis.incr(actionCountKey);
      await redis.expire(actionCountKey, 2592000);

      logger.debug(`Activity tracked for user ${userId}: ${action}`);
    } catch (error) {
      logger.error('Track user activity error:', error);
      // Don't throw error - analytics shouldn't break the flow
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<any> {
    try {
      // Use cache
      const cacheKey = `stats:user:${userId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              achievements: true,
              followers: true,
              following: true,
              quizResults: true,
              orders: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      // Get progress stats
      const progress = await prisma.userProgress.findMany({
        where: { userId: userId },
      });

      const completedModules = progress.filter((p) => p.status === 'COMPLETED').length;
      const inProgressModules = progress.filter((p) => p.status === 'IN_PROGRESS').length;
      const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);

      // Get quiz stats
      const quizResults = await prisma.quizResult.findMany({
        where: { userId: userId },
      });

      const averageScore =
        quizResults.length > 0
          ? quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length
          : 0;

      const stats = {
        user_id: userId,
        level: user.level,
        total_points: user.totalPoints,
        streak: user.streak,
        modules: {
          completed: completedModules,
          in_progress: inProgressModules,
          total: progress.length,
        },
        quizzes: {
          total: user._count.quizResults,
          average_score: parseFloat(averageScore.toFixed(2)),
        },
        time_spent: totalTimeSpent,
        social: {
          followers: user._count.followers,
          following: user._count.following,
        },
        achievements: user._count.achievements,
        orders: user._count.orders,
      };

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(stats));

      return stats;
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Get global platform statistics
   */
  async getGlobalStats(): Promise<GlobalStats> {
    try {
      const cacheKey = 'stats:global';
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const [
        totalUsers,
        totalModules,
        totalQuizzes,
        totalProducts,
        totalOrders,
        totalEvents,
        totalAchievements,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.module.count(),
        prisma.quiz.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.event.count(),
        prisma.achievement.count(),
      ]);

      // Get active users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeUsersToday = await prisma.session.count({
        where: {
          createdAt: {
            gte: today,
          },
        },
      });

      // Get average user level
      const avgLevel = await prisma.user.aggregate({
        _avg: {
          level: true,
        },
      });

      const stats: GlobalStats = {
        total_users: totalUsers,
        active_users_today: activeUsersToday,
        total_modules: totalModules,
        total_quizzes: totalQuizzes,
        total_products: totalProducts,
        total_orders: totalOrders,
        total_events: totalEvents,
        avg_user_level: parseFloat((avgLevel._avg.level || 0).toFixed(2)),
        total_achievements: totalAchievements,
      };

      // Cache for 10 minutes
      await redis.setex(cacheKey, 600, JSON.stringify(stats));

      return stats;
    } catch (error) {
      logger.error('Get global stats error:', error);
      throw error;
    }
  }

  /**
   * Get module statistics
   */
  async getModuleStats(moduleId: string): Promise<ModuleStats> {
    try {
      const cacheKey = `stats:module:${moduleId}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const progress = await prisma.userProgress.findMany({
        where: { moduleId: moduleId },
      });

      const totalEnrollments = progress.length;
      const completions = progress.filter((p) => p.status === 'COMPLETED').length;
      const completionRate = totalEnrollments > 0 ? (completions / totalEnrollments) * 100 : 0;

      const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);
      const averageTimeSpent = totalEnrollments > 0 ? totalTimeSpent / totalEnrollments : 0;

      // Get quiz scores for this module
      const quizzes = await prisma.quiz.findMany({
        where: { moduleId: moduleId },
      });

      // Get all quiz results for this module
      const quizResults = await prisma.quizResult.findMany({
        where: {
          quizId: {
            in: quizzes.map((q) => q.id),
          },
        },
      });

      const allScores = quizResults.map((r) => r.score);
      const averageScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

      const stats: ModuleStats = {
        module_id: moduleId,
        total_enrollments: totalEnrollments,
        completion_rate: parseFloat(completionRate.toFixed(2)),
        average_score: parseFloat(averageScore.toFixed(2)),
        average_time_spent: Math.round(averageTimeSpent),
        difficulty_rating: 0, // Can be calculated from user feedback
      };

      // Cache for 15 minutes
      await redis.setex(cacheKey, 900, JSON.stringify(stats));

      return stats;
    } catch (error) {
      logger.error('Get module stats error:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const cacheKey = 'stats:dashboard';
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      // User stats
      const [totalUsers, newToday, newThisWeek, newThisMonth, activeToday] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: today } } }),
        prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
        prisma.session.count({ where: { createdAt: { gte: today } } }),
      ]);

      // Module stats
      const [totalModules, totalCompletions] = await Promise.all([
        prisma.module.count(),
        prisma.userProgress.count({ where: { status: 'COMPLETED' } }),
      ]);

      const totalEnrollments = await prisma.userProgress.count();
      const avgCompletionRate =
        totalEnrollments > 0 ? (totalCompletions / totalEnrollments) * 100 : 0;

      // Quiz stats
      const [totalQuizzes, totalAttempts] = await Promise.all([
        prisma.quiz.count(),
        prisma.quizResult.count(),
      ]);

      const quizResults = await prisma.quizResult.findMany();
      const avgScore =
        quizResults.length > 0
          ? quizResults.reduce((sum, r) => sum + r.score, 0) / quizResults.length
          : 0;

      // Order stats
      const [totalOrders, pendingOrders, completedOrders, orders] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.order.findMany(),
      ]);

      const totalRevenue = orders.reduce(
        (sum, order) => sum + parseFloat(order.totalPrice.toString()),
        0
      );

      // Event stats
      const [totalEvents, upcomingEvents, totalRegistrations] = await Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { status: 'UPCOMING' } }),
        prisma.eventRegistration.count(),
      ]);

      const stats: DashboardStats = {
        users: {
          total: totalUsers,
          new_today: newToday,
          new_this_week: newThisWeek,
          new_this_month: newThisMonth,
          active_today: activeToday,
        },
        modules: {
          total: totalModules,
          total_completions: totalCompletions,
          average_completion_rate: parseFloat(avgCompletionRate.toFixed(2)),
        },
        quizzes: {
          total: totalQuizzes,
          total_attempts: totalAttempts,
          average_score: parseFloat(avgScore.toFixed(2)),
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          completed: completedOrders,
          total_revenue: parseFloat(totalRevenue.toFixed(2)),
        },
        events: {
          total: totalEvents,
          upcoming: upcomingEvents,
          total_registrations: totalRegistrations,
        },
      };

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(stats));

      return stats;
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }

  /**
   * Get user activity statistics from Redis
   */
  async getUserActivityStats(userId: string): Promise<UserActivityStats> {
    try {
      const activityKey = `user:activity:${userId}`;

      // Get all activities
      const activities = await redis.zrange(activityKey, 0, -1);
      const totalActions = activities.length;

      if (totalActions === 0) {
        return {
          user_id: userId,
          total_actions: 0,
          actions_by_type: {},
          last_activity: new Date(),
          most_active_hour: 0,
          most_active_day: 'N/A',
        };
      }

      // Parse activities
      const parsedActivities = activities.map((a) => JSON.parse(a));

      // Count by type
      const actionsByType: Record<string, number> = {};
      const hourCounts: Record<number, number> = {};
      const dayCounts: Record<string, number> = {};

      parsedActivities.forEach((activity) => {
        actionsByType[activity.action] = (actionsByType[activity.action] || 0) + 1;

        const date = new Date(activity.timestamp);
        const hour = date.getHours();
        const day = date.toLocaleDateString('en-US', { weekday: 'long' });

        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });

      // Find most active hour and day
      const mostActiveHour = Object.entries(hourCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
      const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => (b[1] > a[1] ? b : a))[0];

      // Get last activity
      const lastActivity = parsedActivities[parsedActivities.length - 1];

      return {
        user_id: userId,
        total_actions: totalActions,
        actions_by_type: actionsByType,
        last_activity: new Date(lastActivity.timestamp),
        most_active_hour: parseInt(mostActiveHour),
        most_active_day: mostActiveDay,
      };
    } catch (error) {
      logger.error('Get user activity stats error:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific resource
   */
  async clearCache(resource: string, id?: string): Promise<void> {
    try {
      const pattern = id ? `stats:${resource}:${id}` : `stats:${resource}*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`Cleared ${keys.length} cache keys for ${resource}`);
      }
    } catch (error) {
      logger.error('Clear cache error:', error);
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<any[]> {
    try {
      const cacheKey = `stats:leaderboard:${limit}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }

      const users = await prisma.user.findMany({
        take: limit,
        orderBy: [{ totalPoints: 'desc' }, { level: 'desc' }],
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          level: true,
          totalPoints: true,
          streak: true,
        },
      });

      const leaderboard = users.map((user, index) => ({
        rank: index + 1,
        ...user,
      }));

      // Cache for 5 minutes
      await redis.setex(cacheKey, 300, JSON.stringify(leaderboard));

      return leaderboard;
    } catch (error) {
      logger.error('Get leaderboard error:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
