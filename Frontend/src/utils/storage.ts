// ===== Storage Utility =====
// Handles localStorage and sessionStorage operations with error handling

export class Storage {
  // LocalStorage operations
  static setLocal(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving to localStorage:`, error);
    }
  }

  static getLocal<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage:`, error);
      return null;
    }
  }

  static removeLocal(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from localStorage:`, error);
    }
  }

  static clearLocal(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error(`Error clearing localStorage:`, error);
    }
  }

  // SessionStorage operations
  static setSession(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving to sessionStorage:`, error);
    }
  }

  static getSession<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from sessionStorage:`, error);
      return null;
    }
  }

  static removeSession(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing from sessionStorage:`, error);
    }
  }

  static clearSession(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error(`Error clearing sessionStorage:`, error);
    }
  }

  // Check if storage is available
  static isAvailable(type: 'local' | 'session' = 'local'): boolean {
    try {
      const storage = type === 'local' ? localStorage : sessionStorage;
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Export convenience functions
export const { setLocal, getLocal, removeLocal, clearLocal, setSession, getSession, removeSession, clearSession } = Storage;
