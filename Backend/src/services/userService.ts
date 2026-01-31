import bcrypt from 'bcrypt';
import prisma from '../config/prisma';
import logger from '../config/logger';
import {
  NotFoundError,
  ValidationError,
  AuthenticationError,
  ConflictError,
} from '../utils/errors';
import {
  UserProfile,
  UserStats,
  UpdateProfileData,
  ChangePasswordData,
  UserSearchFilters,
  FollowResponse,
  UserListItem,
} from '../types/user';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

class UserService {
  /**
   * Get user profile by ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url || undefined,
        bio: user.bio || undefined,
        level: user.level,
        total_points: user.total_points,
        streak: user.streak,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      logger.error('Get user profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    try {
      // Check if username is already taken
      if (data.username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username: data.username,
            NOT: { id: userId },
          },
        });

        if (existingUser) {
          throw new ConflictError('Username already taken');
        }
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          username: data.username,
          bio: data.bio,
          avatar_url: data.avatar_url,
        },
      });

      logger.info(`User profile updated: ${userId}`);

      return this.getUserProfile(userId);
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Update user avatar
   */
  async updateAvatar(userId: string, avatarUrl: string): Promise<UserProfile> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatar_url: avatarUrl },
      });

      logger.info(`User avatar updated: ${userId}`);

      return this.getUserProfile(userId);
    } catch (error) {
      logger.error('Update avatar error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, data: ChangePasswordData): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Verify old password
      const isPasswordValid = await bcrypt.compare(data.oldPassword, user.password_hash);

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid old password');
      }

      // Hash new password
      const password_hash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password_hash },
      });

      // Invalidate all sessions except current one
      await prisma.session.deleteMany({
        where: { user_id: userId },
      });

      logger.info(`Password changed for user: ${userId}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              achievements: true,
              followers: true,
              following: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Get module stats
      const moduleProgress = await prisma.userProgress.findMany({
        where: { user_id: userId },
      });

      const modulesCompleted = moduleProgress.filter(
        (p) => p.status === 'COMPLETED'
      ).length;

      const totalTimeSpent = moduleProgress.reduce(
        (sum, p) => sum + p.time_spent,
        0
      );

      // Get quiz stats
      const quizResults = await prisma.quizResult.findMany({
        where: { user_id: userId },
      });

      const quizzesTaken = quizResults.length;
      const averageQuizScore =
        quizzesTaken > 0
          ? quizResults.reduce((sum, r) => sum + r.score, 0) / quizzesTaken
          : 0;

      return {
        level: user.level,
        total_points: user.total_points,
        streak: user.streak,
        modules_completed: modulesCompleted,
        quizzes_taken: quizzesTaken,
        average_quiz_score: parseFloat(averageQuizScore.toFixed(2)),
        time_spent: totalTimeSpent,
        achievements_count: user._count.achievements,
        followers_count: user._count.followers,
        following_count: user._count.following,
      };
    } catch (error) {
      logger.error('Get user stats error:', error);
      throw error;
    }
  }

  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<FollowResponse> {
    try {
      if (followerId === followingId) {
        throw new ValidationError('Cannot follow yourself');
      }

      // Check if both users exist
      const [follower, following] = await Promise.all([
        prisma.user.findUnique({ where: { id: followerId } }),
        prisma.user.findUnique({ where: { id: followingId } }),
      ]);

      if (!follower || !following) {
        throw new NotFoundError('User not found');
      }

      // Check if already following
      const existingFollow = await prisma.userFollow.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: followerId,
            following_id: followingId,
          },
        },
      });

      if (existingFollow) {
        throw new ConflictError('Already following this user');
      }

      // Create follow relationship
      const follow = await prisma.userFollow.create({
        data: {
          follower_id: followerId,
          following_id: followingId,
        },
      });

      logger.info(`User ${followerId} followed ${followingId}`);

      return {
        success: true,
        follower_id: follow.follower_id,
        following_id: follow.following_id,
        created_at: follow.created_at,
      };
    } catch (error) {
      logger.error('Follow user error:', error);
      throw error;
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      const follow = await prisma.userFollow.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: followerId,
            following_id: followingId,
          },
        },
      });

      if (!follow) {
        throw new NotFoundError('Follow relationship not found');
      }

      await prisma.userFollow.delete({
        where: {
          follower_id_following_id: {
            follower_id: followerId,
            following_id: followingId,
          },
        },
      });

      logger.info(`User ${followerId} unfollowed ${followingId}`);
    } catch (error) {
      logger.error('Unfollow user error:', error);
      throw error;
    }
  }

  /**
   * Get user followers
   */
  async getFollowers(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserListItem[]> {
    try {
      const followers = await prisma.userFollow.findMany({
        where: { following_id: userId },
        take: limit,
        skip: offset,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              level: true,
              total_points: true,
            },
          },
        },
      });

      return followers.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        avatar_url: f.follower.avatar_url || undefined,
        level: f.follower.level,
        total_points: f.follower.total_points,
      }));
    } catch (error) {
      logger.error('Get followers error:', error);
      throw error;
    }
  }

  /**
   * Get users being followed
   */
  async getFollowing(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<UserListItem[]> {
    try {
      const following = await prisma.userFollow.findMany({
        where: { follower_id: userId },
        take: limit,
        skip: offset,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              level: true,
              total_points: true,
            },
          },
        },
      });

      return following.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        avatar_url: f.following.avatar_url || undefined,
        level: f.following.level,
        total_points: f.following.total_points,
      }));
    } catch (error) {
      logger.error('Get following error:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(query: string, filters?: UserSearchFilters): Promise<UserListItem[]> {
    try {
      const where: any = {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      };

      if (filters?.level) {
        where.level = filters.level;
      }

      if (filters?.minPoints) {
        where.total_points = { gte: filters.minPoints };
      }

      if (filters?.maxPoints) {
        where.total_points = { ...where.total_points, lte: filters.maxPoints };
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          avatar_url: true,
          level: true,
          total_points: true,
        },
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
        orderBy: { total_points: 'desc' },
      });

      return users.map((u) => ({
        id: u.id,
        username: u.username,
        avatar_url: u.avatar_url || undefined,
        level: u.level,
        total_points: u.total_points,
      }));
    } catch (error) {
      logger.error('Search users error:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info(`User account deleted: ${userId}`);
    } catch (error) {
      logger.error('Delete account error:', error);
      throw error;
    }
  }
}

export default new UserService();
