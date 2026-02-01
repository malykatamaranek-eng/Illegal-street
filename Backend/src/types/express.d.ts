import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: UserRole;
      };
      correlationId?: string;
    }
  }
}

export {};
