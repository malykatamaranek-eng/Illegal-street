export class Encryption {
    static async generateKey() {
        return await window.crypto.subtle.generateKey({
            name: this.ALGORITHM,
            length: this.KEY_LENGTH
        }, true, ['encrypt', 'decrypt']);
    }
    static async exportKey(key) {
        const exported = await window.crypto.subtle.exportKey('raw', key);
        return this.arrayBufferToBase64(exported);
    }
    static async importKey(keyString) {
        const keyBuffer = this.base64ToArrayBuffer(keyString);
        return await window.crypto.subtle.importKey('raw', keyBuffer, {
            name: this.ALGORITHM,
            length: this.KEY_LENGTH
        }, true, ['encrypt', 'decrypt']);
    }
    static async encrypt(message, key) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
            const encrypted = await window.crypto.subtle.encrypt({
                name: this.ALGORITHM,
                iv: iv
            }, key, data);
            const combined = new Uint8Array(iv.length + encrypted.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(encrypted), iv.length);
            return this.arrayBufferToBase64(combined.buffer);
        }
        catch (error) {
            console.error('Encryption error:', error);
            throw new Error('Failed to encrypt message');
        }
    }
    static async decrypt(encryptedMessage, key) {
        try {
            const combined = new Uint8Array(this.base64ToArrayBuffer(encryptedMessage));
            const iv = combined.slice(0, this.IV_LENGTH);
            const data = combined.slice(this.IV_LENGTH);
            const decrypted = await window.crypto.subtle.decrypt({
                name: this.ALGORITHM,
                iv: iv
            }, key, data);
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        }
        catch (error) {
            console.error('Decryption error:', error);
            throw new Error('Failed to decrypt message');
        }
    }
    static async generateKeyPair() {
        return await window.crypto.subtle.generateKey({
            name: 'RSA-OAEP',
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: 'SHA-256'
        }, true, ['encrypt', 'decrypt']);
    }
    static async exportPublicKey(key) {
        const exported = await window.crypto.subtle.exportKey('spki', key);
        return this.arrayBufferToBase64(exported);
    }
    static async importPublicKey(keyString) {
        const keyBuffer = this.base64ToArrayBuffer(keyString);
        return await window.crypto.subtle.importKey('spki', keyBuffer, {
            name: 'RSA-OAEP',
            hash: 'SHA-256'
        }, true, ['encrypt']);
    }
    static async hash(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return this.arrayBufferToBase64(hashBuffer);
    }
    static generateRandomString(length = 32) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    static arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
    static base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
    static isSupported() {
        return !!(window.crypto && window.crypto.subtle);
    }
}
Encryption.ALGORITHM = 'AES-GCM';
Encryption.KEY_LENGTH = 256;
Encryption.IV_LENGTH = 12;
export const { generateKey, exportKey, importKey, encrypt, decrypt, generateKeyPair, exportPublicKey, importPublicKey, hash, generateRandomString, isSupported } = Encryption;
//# sourceMappingURL=encryption.js.map