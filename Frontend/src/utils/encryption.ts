// ===== E2E Encryption Utility =====
// Handles end-to-end encryption for chat messages using Web Crypto API

export class Encryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  // Generate a new encryption key
  static async generateKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Export key to base64 string
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  // Import key from base64 string
  static async importKey(keyString: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyString);
    return await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt a message
  static async encrypt(message: string, key: CryptoKey): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      
      // Generate random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Encrypt the data
      const encrypted = await window.crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        data
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  // Decrypt a message
  static async decrypt(encryptedMessage: string, key: CryptoKey): Promise<string> {
    try {
      const combined = new Uint8Array(this.base64ToArrayBuffer(encryptedMessage));
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const data = combined.slice(this.IV_LENGTH);

      // Decrypt the data
      const decrypted = await window.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv
        },
        key,
        data
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  // Generate a key pair for asymmetric encryption (RSA)
  static async generateKeyPair(): Promise<CryptoKeyPair> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Export public key
  static async exportPublicKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('spki', key);
    return this.arrayBufferToBase64(exported);
  }

  // Import public key
  static async importPublicKey(keyString: string): Promise<CryptoKey> {
    const keyBuffer = this.base64ToArrayBuffer(keyString);
    return await window.crypto.subtle.importKey(
      'spki',
      keyBuffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );
  }

  // Hash a message (for verification)
  static async hash(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  // Generate random string (for keys, IDs, etc.)
  static generateRandomString(length: number = 32): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Helper: Convert ArrayBuffer to base64
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Helper: Convert base64 to ArrayBuffer
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Check if Web Crypto API is available
  static isSupported(): boolean {
    return !!(window.crypto && window.crypto.subtle);
  }
}

// Export convenience functions
export const {
  generateKey,
  exportKey,
  importKey,
  encrypt,
  decrypt,
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  hash,
  generateRandomString,
  isSupported
} = Encryption;
