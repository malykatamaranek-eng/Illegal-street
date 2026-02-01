import prisma from '../config/prisma';
import logger from '../config/logger';
import { ModuleStatus } from '@prisma/client';

export class ProgressService {
  /**
   * Get user progress overview
   */
  async getUserProgress(userId: string) {
    try {
      const [progress, stats] = await Promise.all([
        prisma.userProgress.findMany({
          where: { userId },
          include: {
            module: {
              select: {
                id: true,
                title: true,
                category: true,
                difficulty: true,
                points: true,
              },
            },
          },
          orderBy: { startedAt: 'desc' },
        }),
        this.getUserStats(userId),
      ]);

      return { progress, stats };
    } catch (error) {
      logger.error('Error fetching user progress:', error);
      throw new Error('Failed to fetch user progress');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    try {
      const [
        totalModules,
        completedModules,
        inProgressModules,
        totalTimeSpent,
        user,
      ] = await Promise.all([
        prisma.userProgress.count({ where: { userId } }),
        prisma.userProgress.count({
          where: { userId, status: ModuleStatus.COMPLETED },
        }),
        prisma.userProgress.count({
          where: { userId, status: ModuleStatus.IN_PROGRESS },
        }),
        prisma.userProgress.aggregate({
          where: { userId },
          _sum: { timeSpent: true },
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { level: true, totalPoints: true, streak: true },
        }),
      ]);

      return {
        totalModules,
        completedModules,
        inProgressModules,
        totalTimeSpent: totalTimeSpent._sum.timeSpent || 0,
        level: user?.level || 1,
        totalPoints: user?.totalPoints || 0,
        streak: user?.streak || 0,
        completionRate:
          totalModules > 0 ? (completedModules / totalModules) * 100 : 0,
      };
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }

  /**
   * Start module progress
   */
  async startModule(userId: string, moduleId: string) {
    try {
      const existing = await prisma.userProgress.findUnique({
        where: {
          userId_moduleId: { userId, moduleId },
        },
      });

      if (existing) {
        return existing;
      }

      return await prisma.userProgress.create({
        data: {
          userId,
          moduleId,
          status: ModuleStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
        include: {
          module: true,
        },
      });
    } catch (error) {
      logger.error('Error starting module:', error);
      throw new Error('Failed to start module');
    }
  }

  /**
   * Update module progress
   */
  async updateProgress(
    userId: string,
    moduleId: string,
    percentComplete: number,
    timeSpent: number
  ) {
    try {
      const data: any = {
        percentComplete,
        timeSpent,
      };

      if (percentComplete >= 100) {
        data.status = ModuleStatus.COMPLETED;
        data.completedAt = new Date();

        // Award points to user
        const module = await prisma.module.findUnique({
          where: { id: moduleId },
          select: { points: true },
        });

        if (module) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              totalPoints: { increment: module.points },
            },
          });
        }
      }

      return await prisma.userProgress.update({
        where: {
          userId_moduleId: { userId, moduleId },
        },
        data,
        include: {
          module: true,
        },
      });
    } catch (error) {
      logger.error('Error updating progress:', error);
      throw new Error('Failed to update progress');
    }
  }

  /**
   * Get progress chart data
   */
  async getProgressChart(userId: string, period: string = 'week') {
    try {
      const now = new Date();
      let startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 7);
      }

      const activities = await prisma.userActivity.findMany({
        where: {
          userId,
          timestamp: { gte: startDate },
        },
        orderBy: { timestamp: 'asc' },
      });

      // Group by date
      const chartData: Record<string, { date: string; count: number }> = {};
      
      activities.forEach((activity) => {
        const dateStr: string = activity.timestamp.toISOString().split('T')[0];
        if (!chartData[dateStr]) {
          chartData[dateStr] = { date: dateStr, count: 0 };
        }
        chartData[dateStr].count++;
      });

      return Object.values(chartData);
    } catch (error) {
      logger.error('Error fetching progress chart:', error);
      throw new Error('Failed to fetch progress chart');
    }
  }

  /**
   * Track user activity
   */
  async trackActivity(userId: string, action: string, metadata?: any) {
    try {
      return await prisma.userActivity.create({
        data: {
          userId,
          action,
          metadata: metadata || {},
        },
      });
    } catch (error) {
      logger.error('Error tracking activity:', error);
      // Don't throw - activity tracking should not break the app
      return null;
    }
  }

  /**
   * Get user goals
   */
  async getUserGoals(userId: string) {
    try {
      return await prisma.goal.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching user goals:', error);
      throw new Error('Failed to fetch user goals');
    }
  }

  /**
   * Create user goal
   */
  async createGoal(
    userId: string,
    title: string,
    description: string,
    targetValue: number,
    deadline?: Date
  ) {
    try {
      return await prisma.goal.create({
        data: {
          userId,
          title,
          description,
          targetValue,
          deadline,
        },
      });
    } catch (error) {
      logger.error('Error creating goal:', error);
      throw new Error('Failed to create goal');
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(goalId: string, currentValue: number) {
    try {
      const goal = await prisma.goal.findUnique({ where: { id: goalId } });

      if (!goal) {
        throw new Error('Goal not found');
      }

      const data: any = { currentValue };

      if (currentValue >= goal.targetValue) {
        data.completed = true;
      }

      return await prisma.goal.update({
        where: { id: goalId },
        data,
      });
    } catch (error) {
      logger.error('Error updating goal:', error);
      throw new Error('Failed to update goal');
    }
  }
}

export default new ProgressService();
