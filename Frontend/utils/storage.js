export class Storage {
    static setLocal(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(key, serialized);
        }
        catch (error) {
            console.error(`Error saving to localStorage:`, error);
        }
    }
    static getLocal(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
        catch (error) {
            console.error(`Error reading from localStorage:`, error);
            return null;
        }
    }
    static removeLocal(key) {
        try {
            localStorage.removeItem(key);
        }
        catch (error) {
            console.error(`Error removing from localStorage:`, error);
        }
    }
    static clearLocal() {
        try {
            localStorage.clear();
        }
        catch (error) {
            console.error(`Error clearing localStorage:`, error);
        }
    }
    static setSession(key, value) {
        try {
            const serialized = JSON.stringify(value);
            sessionStorage.setItem(key, serialized);
        }
        catch (error) {
            console.error(`Error saving to sessionStorage:`, error);
        }
    }
    static getSession(key) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
        catch (error) {
            console.error(`Error reading from sessionStorage:`, error);
            return null;
        }
    }
    static removeSession(key) {
        try {
            sessionStorage.removeItem(key);
        }
        catch (error) {
            console.error(`Error removing from sessionStorage:`, error);
        }
    }
    static clearSession() {
        try {
            sessionStorage.clear();
        }
        catch (error) {
            console.error(`Error clearing sessionStorage:`, error);
        }
    }
    static isAvailable(type = 'local') {
        try {
            const storage = type === 'local' ? localStorage : sessionStorage;
            const test = '__storage_test__';
            storage.setItem(test, test);
            storage.removeItem(test);
            return true;
        }
        catch {
            return false;
        }
    }
}
export const { setLocal, getLocal, removeLocal, clearLocal, setSession, getSession, removeSession, clearSession } = Storage;
//# sourceMappingURL=storage.js.map