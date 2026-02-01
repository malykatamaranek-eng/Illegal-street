import prisma from '../config/prisma';
import logger from '../config/logger';

export class RankingService {
  /**
   * Get global leaderboard
   */
  async getGlobalRanking(limit: number = 50, page: number = 1) {
    try {
      const skip = (page - 1) * limit;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            level: true,
            totalPoints: true,
            streak: true,
          },
          orderBy: [{ totalPoints: 'desc' }, { level: 'desc' }],
          take: limit,
          skip,
        }),
        prisma.user.count(),
      ]);

      // Add rank to each user
      const rankedUsers = users.map((user, index) => ({
        ...user,
        rank: skip + index + 1,
      }));

      return {
        users: rankedUsers,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error fetching global ranking:', error);
      throw new Error('Failed to fetch global ranking');
    }
  }

  /**
   * Get monthly leaderboard
   */
  async getMonthlyRanking(limit: number = 50, page: number = 1) {
    try {
      const skip = (page - 1) * limit;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get users with progress in current month
      const usersWithProgress = await prisma.userProgress.groupBy({
        by: ['userId'],
        where: {
          startedAt: { gte: startOfMonth },
        },
        _sum: { timeSpent: true },
        _count: { id: true },
      });

      // Get full user details
      const userIds = usersWithProgress.map((u) => u.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          level: true,
          totalPoints: true,
          streak: true,
        },
      });

      // Combine and calculate monthly points
      const rankedUsers = usersWithProgress
        .map((progress) => {
          const user = users.find((u) => u.id === progress.userId);
          if (!user) return null;

          return {
            ...user,
            monthlyProgress: progress._count.id,
            monthlyTimeSpent: progress._sum.timeSpent || 0,
            monthlyPoints: progress._count.id * 10, // Simple calculation
          };
        })
        .filter((u) => u !== null)
        .sort((a, b) => b!.monthlyPoints - a!.monthlyPoints)
        .slice(skip, skip + limit)
        .map((user, index) => ({
          ...user,
          rank: skip + index + 1,
        }));

      return {
        users: rankedUsers,
        total: usersWithProgress.length,
        page,
        totalPages: Math.ceil(usersWithProgress.length / limit),
      };
    } catch (error) {
      logger.error('Error fetching monthly ranking:', error);
      throw new Error('Failed to fetch monthly ranking');
    }
  }

  /**
   * Get user rank
   */
  async getUserRank(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { totalPoints: true, level: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Count users with more points
      const higherRankedCount = await prisma.user.count({
        where: {
          OR: [
            { totalPoints: { gt: user.totalPoints } },
            {
              totalPoints: user.totalPoints,
              level: { gt: user.level },
            },
          ],
        },
      });

      const rank = higherRankedCount + 1;
      const totalUsers = await prisma.user.count();

      return {
        rank,
        totalUsers,
        percentile: ((totalUsers - rank) / totalUsers) * 100,
      };
    } catch (error) {
      logger.error('Error fetching user rank:', error);
      throw new Error('Failed to fetch user rank');
    }
  }

  /**
   * Get top achievers by category
   */
  async getTopByCategory(category: string, limit: number = 10) {
    try {
      const moduleProgress = await prisma.userProgress.groupBy({
        by: ['userId'],
        where: {
          module: { category },
          status: 'COMPLETED',
        },
        _count: { id: true },
        _sum: { timeSpent: true },
      });

      const userIds = moduleProgress
        .sort((a, b) => b._count.id - a._count.id)
        .slice(0, limit)
        .map((p) => p.userId);

      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          level: true,
          totalPoints: true,
        },
      });

      return moduleProgress
        .filter((p) => userIds.includes(p.userId))
        .map((progress, index) => {
          const user = users.find((u) => u.id === progress.userId);
          return {
            ...user,
            rank: index + 1,
            completedInCategory: progress._count.id,
            timeSpentInCategory: progress._sum.timeSpent || 0,
          };
        });
    } catch (error) {
      logger.error('Error fetching top by category:', error);
      throw new Error('Failed to fetch top by category');
    }
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string) {
    try {
      return await prisma.achievement.findMany({
        where: { userId },
        orderBy: { earnedAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error fetching user achievements:', error);
      throw new Error('Failed to fetch user achievements');
    }
  }

  /**
   * Award achievement to user
   */
  async awardAchievement(userId: string, badgeName: string) {
    try {
      // Check if already awarded
      const existing = await prisma.achievement.findFirst({
        where: { userId, badgeName },
      });

      if (existing) {
        return existing;
      }

      return await prisma.achievement.create({
        data: {
          userId,
          badgeName,
        },
      });
    } catch (error) {
      logger.error('Error awarding achievement:', error);
      throw new Error('Failed to award achievement');
    }
  }

  /**
   * Check and award achievements based on user progress
   */
  async checkAndAwardAchievements(userId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userProgress: true,
          achievements: true,
        },
      });

      if (!user) return;

      const achievements = user.achievements.map((a) => a.badgeName);
      const newAchievements = [];

      // First module completed
      const completedModules = user.userProgress.filter(
        (p) => p.status === 'COMPLETED'
      ).length;
      if (completedModules >= 1 && !achievements.includes('first_module')) {
        await this.awardAchievement(userId, 'first_module');
        newAchievements.push('first_module');
      }

      // 10 modules completed
      if (completedModules >= 10 && !achievements.includes('module_master')) {
        await this.awardAchievement(userId, 'module_master');
        newAchievements.push('module_master');
      }

      // 7-day streak
      if (user.streak >= 7 && !achievements.includes('week_warrior')) {
        await this.awardAchievement(userId, 'week_warrior');
        newAchievements.push('week_warrior');
      }

      // Level 10 reached
      if (user.level >= 10 && !achievements.includes('level_10')) {
        await this.awardAchievement(userId, 'level_10');
        newAchievements.push('level_10');
      }

      // 1000 points
      if (user.totalPoints >= 1000 && !achievements.includes('point_collector')) {
        await this.awardAchievement(userId, 'point_collector');
        newAchievements.push('point_collector');
      }

      return newAchievements;
    } catch (error) {
      logger.error('Error checking achievements:', error);
      // Don't throw - achievement checking should not break the app
      return [];
    }
  }
}

export default new RankingService();
