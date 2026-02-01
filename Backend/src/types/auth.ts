export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    username: string;
    avatar_url?: string;
    level: number;
    total_points: number;
  };
  tokens: AuthTokens;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
}

export interface EmailVerificationToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
}

export interface TwoFactorAuth {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}
