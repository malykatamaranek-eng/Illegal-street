import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/prisma';
import logger from '../config/logger';
import redis from '../config/redis';
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../utils/errors';
import {
  RegisterData,
  LoginData,
  AuthTokens,
  LoginResponse,
  TokenPayload,
} from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const { email, username, password } = data;

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          throw new ConflictError('Email already registered');
        }
        throw new ConflictError('Username already taken');
      }

      // Hash password
      const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash: password_hash,
        },
      });

      logger.info(`User registered: ${user.id} - ${email}`);

      // Generate tokens
      const tokens = await this.generateTokens(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar_url: user.avatarUrl || undefined,
          level: user.level,
          total_points: user.totalPoints,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const { email, password } = data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new AuthenticationError('Invalid email or password');
      }

      logger.info(`User logged in: ${user.id} - ${email}`);

      // Generate tokens
      const tokens = await this.generateTokens(user.id);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar_url: user.avatarUrl || undefined,
          level: user.level,
          total_points: user.totalPoints,
        },
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT access and refresh tokens
   */
  async generateTokens(userId: string): Promise<AuthTokens> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          admin: {
            select: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const payload: TokenPayload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.admin?.role || 'USER',
      };

      // Generate access token
      const accessToken = jwt.sign(payload as object, JWT_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRY,
      } as jwt.SignOptions);

      // Generate refresh token
      const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRY,
      } as jwt.SignOptions);

      // Calculate expiry
      const expiresIn = this.parseExpiry(JWT_ACCESS_EXPIRY);

      // Store refresh token in database
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + this.parseExpiry(JWT_REFRESH_EXPIRY));

      await prisma.refreshToken.create({
        data: {
          userId: userId,
          token: refreshToken,
          expiresAt: expiresAt,
        },
      });

      // Store session
      const sessionExpiresAt = new Date();
      sessionExpiresAt.setSeconds(sessionExpiresAt.getSeconds() + expiresIn);

      await prisma.session.create({
        data: {
          userId: userId,
          token: accessToken,
          refreshToken: refreshToken,
          expiresAt: sessionExpiresAt,
        },
      });

      return {
        accessToken,
        refreshToken,
        expiresIn,
      };
    } catch (error) {
      logger.error('Token generation error:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

      // Check if session exists
      const session = await prisma.session.findFirst({
        where: {
          token,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!session) {
        throw new AuthenticationError('Invalid or expired token');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired');
      }
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string };

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!storedToken) {
        throw new AuthenticationError('Invalid or expired refresh token');
      }

      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(decoded.userId);

      logger.info(`Tokens refreshed for user: ${decoded.userId}`);

      return tokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Refresh token expired');
      }
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        // Delete specific session
        await prisma.session.delete({
          where: { id: sessionId },
        });
      } else {
        // Delete all sessions for user
        await prisma.session.deleteMany({
          where: { userId: userId },
        });

        // Delete all refresh tokens
        await prisma.refreshToken.deleteMany({
          where: { userId: userId },
        });
      }

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Forgot password - Send reset email
   */
  async forgotPassword(email: string): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists
        return 'If the email exists, a reset link has been sent';
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Store token in Redis (expires in 1 hour)
      const tokenKey = `password-reset:${hashedToken}`;
      await redis.setex(tokenKey, 3600, user.id);

      logger.info(`Password reset token generated for user: ${user.id}`);

      return resetToken;
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Hash the token to match stored version
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const tokenKey = `password-reset:${hashedToken}`;

      // Get user ID from Redis
      const userId = await redis.get(tokenKey);

      if (!userId) {
        throw new AuthenticationError('Invalid or expired reset token');
      }

      // Hash new password
      const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: password_hash },
      });

      // Delete reset token
      await redis.del(tokenKey);

      // Invalidate all sessions
      await this.logout(userId);

      logger.info(`Password reset for user: ${userId}`);
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      const tokenKey = `email-verification:${hashedToken}`;

      const userId = await redis.get(tokenKey);

      if (!userId) {
        throw new AuthenticationError('Invalid or expired verification token');
      }

      // Mark email as verified (we can add a field to schema if needed)
      // For now, we'll just delete the token
      await redis.del(tokenKey);

      logger.info(`Email verified for user: ${userId}`);
    } catch (error) {
      logger.error('Email verification error:', error);
      throw error;
    }
  }

  /**
   * Setup 2FA for user
   */
  async setup2FA(userId: string): Promise<{ secret: string; qrCode: string }> {
    try {
      // Generate secret
      const secret = crypto.randomBytes(20).toString('base64');

      // Store secret in Redis temporarily
      const secretKey = `2fa-setup:${userId}`;
      await redis.setex(secretKey, 600, secret); // 10 minutes

      // In production, use a library like speakeasy to generate QR code
      const qrCode = `otpauth://totp/IllegalStreet:${userId}?secret=${encodeURIComponent(secret)}&issuer=IllegalStreet`;

      logger.info(`2FA setup initiated for user: ${userId}`);

      return { secret, qrCode };
    } catch (error) {
      logger.error('2FA setup error:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA code
   */
  async verify2FA(userId: string, code: string): Promise<boolean> {
    try {
      // Get secret from Redis
      const secretKey = `2fa-setup:${userId}`;
      const secret = await redis.get(secretKey);

      if (!secret) {
        throw new ValidationError('2FA setup not found or expired');
      }

      // In production, use speakeasy to verify the code
      // For now, simple validation
      const isValid = code.length === 6 && /^\d+$/.test(code);

      if (isValid) {
        // Store 2FA secret permanently
        const permanentKey = `2fa:${userId}`;
        await redis.set(permanentKey, secret);
        await redis.del(secretKey);

        logger.info(`2FA enabled for user: ${userId}`);
      }

      return isValid;
    } catch (error) {
      logger.error('2FA verification error:', error);
      throw error;
    }
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const [, value = '15', unit = 'm'] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num;
      case 'm':
        return num * 60;
      case 'h':
        return num * 3600;
      case 'd':
        return num * 86400;
      default:
        return 900;
    }
  }
}

export default new AuthService();
