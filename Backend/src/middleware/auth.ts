import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { AuthenticationError, AuthorizationError } from '../utils/errors';

// Import UserRole enum from Prisma
enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Extract token from cookies or Authorization header
const extractToken = (req: Request): string | null => {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  return null;
};

// Verify JWT token and decode payload
export const verifyToken = (token: string): JWTPayload => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token');
    }
    throw new AuthenticationError('Token verification failed');
  }
};

// Authenticate user and attach to request
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);

    // Check if user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      throw new AuthenticationError('User no longer exists');
    }

    // Determine user role
    const role = user.admin ? user.admin.role : UserRole.USER;

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      username: user.username,
      role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Require authentication (throw error if not authenticated)
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authenticate(req, res, (err) => {
      if (err) {
        throw err;
      }
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }
      next();
    });
  } catch (error) {
    next(error);
  }
};

// Optional authentication (don't throw error if not authenticated)
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (user) {
      const role = user.admin ? user.admin.role : UserRole.USER;
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role,
      };
    }

    next();
  } catch (_error) {
    // For optional auth, we don't throw errors
    next();
  }
};

// Role-based access control
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new AuthorizationError(
          `Access denied. Required roles: ${roles.join(', ')}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Require admin role (ADMIN or SUPER_ADMIN)
export const requireAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const adminRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
    if (!adminRoles.includes(req.user.role)) {
      throw new AuthorizationError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Require super admin role
export const requireSuperAdmin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (req.user.role !== UserRole.SUPER_ADMIN) {
      throw new AuthorizationError('Super admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
