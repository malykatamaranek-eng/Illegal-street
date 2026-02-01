import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_EXPIRE: z.string().optional(),
  REFRESH_TOKEN_EXPIRE: z.string().optional(),

  // API Keys
  API_KEY: z.string().optional(),
  HMAC_SECRET: z.string().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  ALLOWED_ORIGINS: z.string().optional(),

  // App
  APP_NAME: z.string().default('Illegal Street'),

  // API
  API_VERSION: z.string().default('v1'),

  // File Upload
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Email (Optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Admin
  ADMIN_EMAIL: z.string().email().optional(),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Session
  SESSION_SECRET: z.string().optional(),

  // Encryption
  ENCRYPTION_KEY: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_DIR: z.string().default('./logs'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Invalid environment configuration');
  }
};

export const env = parseEnv();

// Export typed environment variables
export default {
  // Server
  NODE_ENV: env.NODE_ENV,
  PORT: env.PORT,
  HOST: env.HOST,
  IS_PRODUCTION: env.NODE_ENV === 'production',
  IS_DEVELOPMENT: env.NODE_ENV === 'development',
  IS_TEST: env.NODE_ENV === 'test',

  // Database
  DATABASE_URL: env.DATABASE_URL,

  // Redis
  REDIS_URL: env.REDIS_URL,

  // JWT
  JWT_SECRET: env.JWT_SECRET,
  JWT_REFRESH_SECRET: env.JWT_REFRESH_SECRET || env.JWT_SECRET,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: env.JWT_REFRESH_EXPIRES_IN,
  JWT_EXPIRE: env.JWT_EXPIRE || env.JWT_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRE: env.REFRESH_TOKEN_EXPIRE || env.JWT_REFRESH_EXPIRES_IN,

  // API Keys
  API_KEY: env.API_KEY,
  HMAC_SECRET: env.HMAC_SECRET,

  // CORS
  CORS_ORIGIN: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  ALLOWED_ORIGINS: env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),

  // App
  APP_NAME: env.APP_NAME,

  // API
  API_VERSION: env.API_VERSION,

  // File Upload
  MAX_FILE_SIZE: env.MAX_FILE_SIZE,
  UPLOAD_DIR: env.UPLOAD_DIR,

  // Email
  SMTP: {
    HOST: env.SMTP_HOST,
    PORT: env.SMTP_PORT,
    USER: env.SMTP_USER,
    PASSWORD: env.SMTP_PASSWORD,
    FROM: env.EMAIL_FROM,
  },

  // Admin
  ADMIN_EMAIL: env.ADMIN_EMAIL,

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: env.RATE_LIMIT_WINDOW_MS,
    MAX_REQUESTS: env.RATE_LIMIT_MAX_REQUESTS,
  },

  // Session
  SESSION_SECRET: env.SESSION_SECRET || env.JWT_SECRET,

  // Encryption
  ENCRYPTION_KEY: env.ENCRYPTION_KEY,

  // Logging
  LOG_LEVEL: env.LOG_LEVEL,
  LOG_DIR: env.LOG_DIR,
};
