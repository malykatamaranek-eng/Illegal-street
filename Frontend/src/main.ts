// ===== Main Application Entry Point =====
// Initializes the application and manages global state

import { Auth } from './utils/auth';
import { Storage } from './utils/storage';
import { Encryption } from './utils/encryption';

// Global application state
interface AppState {
  user: any;
  theme: 'dark' | 'light';
  language: 'pl' | 'en';
  notifications: any[];
  cart: any[];
}

class App {
  private state: AppState;
  private listeners: Map<string, Set<Function>>;

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

  // Initialize application
  private init(): void {
    this.loadState();
    this.setupEventListeners();
    this.checkAuth();
    this.setupTheme();
  }

  // Load state from storage
  private loadState(): void {
    const savedState = Storage.getLocal<AppState>('app_state');
    if (savedState) {
      this.state = { ...this.state, ...savedState };
    }
  }

  // Save state to storage
  private saveState(): void {
    Storage.setLocal('app_state', this.state);
  }

  // Setup global event listeners
  private setupEventListeners(): void {
    // Handle page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkAuth();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      this.showNotification('Połączenie zostało przywrócone', 'success');
    });

    window.addEventListener('offline', () => {
      this.showNotification('Brak połączenia z internetem', 'warning');
    });
  }

  // Check authentication status
  private checkAuth(): void {
    const authState = Auth.getAuthState();
    this.state.user = authState.user;
    
    if (Auth.isTokenExpired()) {
      Auth.logout();
      this.showNotification('Sesja wygasła. Zaloguj się ponownie.', 'warning');
    }
  }

  // Setup theme
  private setupTheme(): void {
    const theme = this.state.theme;
    document.documentElement.setAttribute('data-theme', theme);
  }

  // Get current state
  getState(): AppState {
    return { ...this.state };
  }

  // Update state
  setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    this.saveState();
    this.emit('stateChange', this.state);
  }

  // Subscribe to state changes
  subscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  // Unsubscribe from state changes
  unsubscribe(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  // Emit event
  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Show notification
  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration: number = 3000): void {
    const notification = { id: Date.now(), message, type, duration };
    this.state.notifications.push(notification);
    this.emit('notification', notification);

    // Auto-remove after duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, duration);
  }

  // Remove notification
  removeNotification(id: number): void {
    this.state.notifications = this.state.notifications.filter(n => n.id !== id);
    this.emit('notificationRemoved', id);
  }

  // Cart management
  addToCart(item: any): void {
    const existingItem = this.state.cart.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.state.cart.push({ ...item, quantity: 1 });
    }
    this.saveState();
    this.emit('cartUpdated', this.state.cart);
    this.showNotification('Produkt dodany do koszyka', 'success');
  }

  removeFromCart(itemId: string): void {
    this.state.cart = this.state.cart.filter(item => item.id !== itemId);
    this.saveState();
    this.emit('cartUpdated', this.state.cart);
  }

  updateCartQuantity(itemId: string, quantity: number): void {
    const item = this.state.cart.find(i => i.id === itemId);
    if (item) {
      if (quantity <= 0) {
        this.removeFromCart(itemId);
      } else {
        item.quantity = quantity;
        this.saveState();
        this.emit('cartUpdated', this.state.cart);
      }
    }
  }

  clearCart(): void {
    this.state.cart = [];
    this.saveState();
    this.emit('cartUpdated', this.state.cart);
  }

  getCartTotal(): number {
    return this.state.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  getCartCount(): number {
    return this.state.cart.reduce((count, item) => count + item.quantity, 0);
  }

  // Theme management
  setTheme(theme: 'dark' | 'light'): void {
    this.state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.saveState();
    this.emit('themeChanged', theme);
  }

  toggleTheme(): void {
    const newTheme = this.state.theme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  // Language management
  setLanguage(language: 'pl' | 'en'): void {
    this.state.language = language;
    this.saveState();
    this.emit('languageChanged', language);
  }
}

// Create global app instance
const app = new App();

// Export to window for global access
declare global {
  interface Window {
    app: App;
    Auth: typeof Auth;
    IllegalStorage: typeof Storage;
    Encryption: typeof Encryption;
  }
}

window.app = app;
window.Auth = Auth;
window.IllegalStorage = Storage;
window.Encryption = Encryption;

// Export for module usage
export default app;
export { App, Auth, Storage, Encryption };
