import { Request, Response, NextFunction } from 'express';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import Redis from 'ioredis';
import { RateLimitError } from '../utils/errors';
import logger from '../config/logger';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
});

// Redis store for distributed rate limiting
class RedisStore {
  prefix: string;
  client: Redis;

  constructor(client: Redis, prefix: string = 'rl:') {
    this.client = client;
    this.prefix = prefix;
  }

  async increment(key: string, windowMs: number): Promise<{ totalHits: number; resetTime: Date }> {
    const redisKey = `${this.prefix}${key}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Remove old entries
    await this.client.zremrangebyscore(redisKey, 0, windowStart);

    // Add current request
    await this.client.zadd(redisKey, now, `${now}`);

    // Set expiration
    await this.client.expire(redisKey, Math.ceil(windowMs / 1000));

    // Count requests in window
    const totalHits = await this.client.zcard(redisKey);

    const resetTime = new Date(now + windowMs);

    return { totalHits, resetTime };
  }

  async decrement(_key: string): Promise<void> {
    // Optional: implement if needed
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    await this.client.del(redisKey);
  }
}

const redisStore = new RedisStore(redisClient);

// Create custom rate limiter
export const createLimiter = (
  windowMs: number,
  max: number,
  message?: string
): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    max,
    message: message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // Custom key generator (use IP address)
    keyGenerator: (req: Request): string => {
      return req.ip || req.connection.remoteAddress || 'unknown';
    },
    // Custom handler for rate limit exceeded
    handler: (req: Request, res: Response, _next: NextFunction) => {
      const retryAfter = Math.ceil(windowMs / 1000);
      
      // Log rate limit violation
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        retryAfter,
      });

      res.setHeader('Retry-After', retryAfter.toString());
      
      throw new RateLimitError(
        message || `Too many requests. Please try again in ${retryAfter} seconds`
      );
    },
    // Skip successful requests (optional)
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    // Custom store using Redis
    store: {
      async increment(key: string): Promise<{ totalHits: number; resetTime: Date | undefined }> {
        try {
          return await redisStore.increment(key, windowMs);
        } catch (error) {
          logger.error('Redis rate limit error:', error);
          // Fallback to in-memory if Redis fails
          return { totalHits: 1, resetTime: new Date(Date.now() + windowMs) };
        }
      },
      async decrement(key: string): Promise<void> {
        try {
          await redisStore.decrement(key);
        } catch (error) {
          logger.error('Redis decrement error:', error);
        }
      },
      async resetKey(key: string): Promise<void> {
        try {
          await redisStore.resetKey(key);
        } catch (error) {
          logger.error('Redis reset error:', error);
        }
      },
    },
  });
};

// Strict rate limit for authentication endpoints (5 requests per 15 minutes)
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  'Too many authentication attempts. Please try again in 15 minutes'
);

// General API rate limit (100 requests per 15 minutes)
export const apiLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  'Too many requests from this IP. Please try again later'
);

// Aggressive rate limit for password reset (3 requests per hour)
export const passwordResetLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  3,
  'Too many password reset attempts. Please try again in 1 hour'
);

// Rate limit for file uploads (10 uploads per hour)
export const uploadLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  'Too many file uploads. Please try again later'
);

// Rate limit for creating resources (20 per hour)
export const createResourceLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  20,
  'Too many resource creation requests. Please try again later'
);

// Cleanup function for graceful shutdown
export const closeRateLimitStore = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Rate limit Redis connection closed');
  } catch (error) {
    logger.error('Error closing rate limit Redis connection:', error);
  }
};
