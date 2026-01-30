import { Auth } from './utils/auth';
import { Storage } from './utils/storage';
import { Encryption } from './utils/encryption';
class App {
    constructor() {
        this.state = {
            user: null,
            theme: 'dark',
            language: 'pl',
            notifications: [],
            cart: []
        };
        this.listeners = new Map();
        this.init();
    }
    init() {
        this.loadState();
        this.setupEventListeners();
        this.checkAuth();
        this.setupTheme();
    }
    loadState() {
        const savedState = Storage.getLocal('app_state');
        if (savedState) {
            this.state = { ...this.state, ...savedState };
        }
    }
    saveState() {
        Storage.setLocal('app_state', this.state);
    }
    setupEventListeners() {
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkAuth();
            }
        });
        window.addEventListener('online', () => {
            this.showNotification('Połączenie zostało przywrócone', 'success');
        });
        window.addEventListener('offline', () => {
            this.showNotification('Brak połączenia z internetem', 'warning');
        });
    }
    checkAuth() {
        const authState = Auth.getAuthState();
        this.state.user = authState.user;
        if (Auth.isTokenExpired()) {
            Auth.logout();
            this.showNotification('Sesja wygasła. Zaloguj się ponownie.', 'warning');
        }
    }
    setupTheme() {
        const theme = this.state.theme;
        document.documentElement.setAttribute('data-theme', theme);
    }
    getState() {
        return { ...this.state };
    }
    setState(updates) {
        this.state = { ...this.state, ...updates };
        this.saveState();
        this.emit('stateChange', this.state);
    }
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }
    unsubscribe(event, callback) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
        }
    }
    emit(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }
    showNotification(message, type = 'info', duration = 3000) {
        const notification = { id: Date.now(), message, type, duration };
        this.state.notifications.push(notification);
        this.emit('notification', notification);
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }
    removeNotification(id) {
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
        this.emit('notificationRemoved', id);
    }
    addToCart(item) {
        const existingItem = this.state.cart.find(i => i.id === item.id);
        if (existingItem) {
            existingItem.quantity += 1;
        }
        else {
            this.state.cart.push({ ...item, quantity: 1 });
        }
        this.saveState();
        this.emit('cartUpdated', this.state.cart);
        this.showNotification('Produkt dodany do koszyka', 'success');
    }
    removeFromCart(itemId) {
        this.state.cart = this.state.cart.filter(item => item.id !== itemId);
        this.saveState();
        this.emit('cartUpdated', this.state.cart);
    }
    updateCartQuantity(itemId, quantity) {
        const item = this.state.cart.find(i => i.id === itemId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(itemId);
            }
            else {
                item.quantity = quantity;
                this.saveState();
                this.emit('cartUpdated', this.state.cart);
            }
        }
    }
    clearCart() {
        this.state.cart = [];
        this.saveState();
        this.emit('cartUpdated', this.state.cart);
    }
    getCartTotal() {
        return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    getCartCount() {
        return this.state.cart.reduce((count, item) => count + item.quantity, 0);
    }
    setTheme(theme) {
        this.state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        this.saveState();
        this.emit('themeChanged', theme);
    }
    toggleTheme() {
        const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    setLanguage(language) {
        this.state.language = language;
        this.saveState();
        this.emit('languageChanged', language);
    }
}
const app = new App();
window.app = app;
window.Auth = Auth;
window.IllegalStorage = Storage;
window.Encryption = Encryption;
export default app;
export { App, Auth, Storage, Encryption };
//# sourceMappingURL=main.js.map