// ===== Authentication Utility =====
// Handles authentication state and operations

import { Storage } from './storage';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  avatar?: string;
  level: number;
  points: number;
  streak: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = [
  { username: 'admin1', password: 'Illegal@2024', role: 'admin' },
  { username: 'admin2', password: 'StreetAdmin@123', role: 'admin' },
  { username: 'admin3', password: 'SecurePass@456', role: 'admin' }
];

export class Auth {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly USER_KEY = 'user_data';
  private static readonly EXPIRY_KEY = 'token_expiry';

  // Get current authentication state
  static getAuthState(): AuthState {
    const token = Storage.getLocal<string>(this.TOKEN_KEY);
    const user = Storage.getLocal<User>(this.USER_KEY);
    const expiry = Storage.getLocal<number>(this.EXPIRY_KEY);

    // Check if token is expired
    if (expiry && Date.now() > expiry) {
      this.logout();
      return { isAuthenticated: false, user: null, token: null };
    }

    return {
      isAuthenticated: !!token && !!user,
      user: user,
      token: token
    };
  }

  // Set authentication data
  static setAuth(token: string, user: User, expiresIn: number = 86400000): void {
    const expiry = Date.now() + expiresIn; // Default 24 hours
    Storage.setLocal(this.TOKEN_KEY, token);
    Storage.setLocal(this.USER_KEY, user);
    Storage.setLocal(this.EXPIRY_KEY, expiry);
  }

  // Check if user is admin
  static isAdmin(): boolean {
    const { user } = this.getAuthState();
    return user?.role === 'admin';
  }

  // Check if user is moderator or admin
  static isModerator(): boolean {
    const { user } = this.getAuthState();
    return user?.role === 'moderator' || user?.role === 'admin';
  }

  // Check admin credentials (for hardcoded admins)
  static checkAdminCredentials(username: string, password: string): boolean {
    return ADMIN_CREDENTIALS.some(
      admin => admin.username === username && admin.password === password
    );
  }

  // Get current user
  static getCurrentUser(): User | null {
    return this.getAuthState().user;
  }

  // Get auth token
  static getToken(): string | null {
    return this.getAuthState().token;
  }

  // Update user data
  static updateUser(userData: Partial<User>): void {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      Storage.setLocal(this.USER_KEY, updatedUser);
    }
  }

  // Logout
  static logout(): void {
    Storage.removeLocal(this.TOKEN_KEY);
    Storage.removeLocal(this.USER_KEY);
    Storage.removeLocal(this.EXPIRY_KEY);
  }

  // Check if token is expired
  static isTokenExpired(): boolean {
    const expiry = Storage.getLocal<number>(this.EXPIRY_KEY);
    if (!expiry) return true;
    return Date.now() > expiry;
  }

  // Refresh token expiry
  static refreshToken(expiresIn: number = 86400000): void {
    const expiry = Date.now() + expiresIn;
    Storage.setLocal(this.EXPIRY_KEY, expiry);
  }

  // Get authorization header
  static getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Check if user has permission
  static hasPermission(requiredRole: 'user' | 'moderator' | 'admin'): boolean {
    const { user } = this.getAuthState();
    if (!user) return false;

    const roleHierarchy = { user: 0, moderator: 1, admin: 2 };
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  }

  // Redirect based on role
  static redirectByRole(): void {
    const { isAuthenticated } = this.getAuthState();
    
    if (!isAuthenticated) {
      window.location.href = '/login.html';
      return;
    }

    if (this.isAdmin()) {
      window.location.href = '/admin.html';
    } else {
      window.location.href = '/dashboard.html';
    }
  }

  // Protected route check
  static requireAuth(): boolean {
    const { isAuthenticated } = this.getAuthState();
    if (!isAuthenticated || this.isTokenExpired()) {
      this.logout();
      window.location.href = '/login.html';
      return false;
    }
    return true;
  }

  // Admin only route check
  static requireAdmin(): boolean {
    if (!this.requireAuth()) return false;
    
    if (!this.isAdmin()) {
      window.location.href = '/dashboard.html';
      return false;
    }
    return true;
  }
}

// Export convenience functions
export const {
  getAuthState,
  setAuth,
  isAdmin,
  isModerator,
  getCurrentUser,
  getToken,
  updateUser,
  logout,
  isTokenExpired,
  refreshToken,
  getAuthHeader,
  hasPermission,
  redirectByRole,
  requireAuth,
  requireAdmin,
  checkAdminCredentials
} = Auth;
