import { Storage } from './storage';
const ADMIN_CREDENTIALS = [
    { username: 'admin1', password: 'Illegal@2024', role: 'admin' },
    { username: 'admin2', password: 'StreetAdmin@123', role: 'admin' },
    { username: 'admin3', password: 'SecurePass@456', role: 'admin' }
];
export class Auth {
    static getAuthState() {
        const token = Storage.getLocal(this.TOKEN_KEY);
        const user = Storage.getLocal(this.USER_KEY);
        const expiry = Storage.getLocal(this.EXPIRY_KEY);
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
    static setAuth(token, user, expiresIn = 86400000) {
        const expiry = Date.now() + expiresIn;
        Storage.setLocal(this.TOKEN_KEY, token);
        Storage.setLocal(this.USER_KEY, user);
        Storage.setLocal(this.EXPIRY_KEY, expiry);
    }
    static isAdmin() {
        const { user } = this.getAuthState();
        return user?.role === 'admin';
    }
    static isModerator() {
        const { user } = this.getAuthState();
        return user?.role === 'moderator' || user?.role === 'admin';
    }
    static checkAdminCredentials(username, password) {
        return ADMIN_CREDENTIALS.some(admin => admin.username === username && admin.password === password);
    }
    static getCurrentUser() {
        return this.getAuthState().user;
    }
    static getToken() {
        return this.getAuthState().token;
    }
    static updateUser(userData) {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ...userData };
            Storage.setLocal(this.USER_KEY, updatedUser);
        }
    }
    static logout() {
        Storage.removeLocal(this.TOKEN_KEY);
        Storage.removeLocal(this.USER_KEY);
        Storage.removeLocal(this.EXPIRY_KEY);
    }
    static isTokenExpired() {
        const expiry = Storage.getLocal(this.EXPIRY_KEY);
        if (!expiry)
            return true;
        return Date.now() > expiry;
    }
    static refreshToken(expiresIn = 86400000) {
        const expiry = Date.now() + expiresIn;
        Storage.setLocal(this.EXPIRY_KEY, expiry);
    }
    static getAuthHeader() {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    }
    static hasPermission(requiredRole) {
        const { user } = this.getAuthState();
        if (!user)
            return false;
        const roleHierarchy = { user: 0, moderator: 1, admin: 2 };
        return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
    }
    static redirectByRole() {
        const { isAuthenticated } = this.getAuthState();
        if (!isAuthenticated) {
            window.location.href = '/login.html';
            return;
        }
        if (this.isAdmin()) {
            window.location.href = '/admin.html';
        }
        else {
            window.location.href = '/dashboard.html';
        }
    }
    static requireAuth() {
        const { isAuthenticated } = this.getAuthState();
        if (!isAuthenticated || this.isTokenExpired()) {
            this.logout();
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }
    static requireAdmin() {
        if (!this.requireAuth())
            return false;
        if (!this.isAdmin()) {
            window.location.href = '/dashboard.html';
            return false;
        }
        return true;
    }
}
Auth.TOKEN_KEY = 'auth_token';
Auth.USER_KEY = 'user_data';
Auth.EXPIRY_KEY = 'token_expiry';
export const { getAuthState, setAuth, isAdmin, isModerator, getCurrentUser, getToken, updateUser, logout, isTokenExpired, refreshToken, getAuthHeader, hasPermission, redirectByRole, requireAuth, requireAdmin, checkAdminCredentials } = Auth;
//# sourceMappingURL=auth.js.map