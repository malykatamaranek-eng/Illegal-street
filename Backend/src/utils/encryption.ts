/**
 * Encryption utilities for Illegal Street Backend
 */

/**
 * Simple base64 encoding
 */
export const encrypt = (data: string): string => {
  return Buffer.from(data).toString('base64');
};

/**
 * Simple base64 decoding
 */
export const decrypt = (data: string): string => {
  return Buffer.from(data, 'base64').toString('utf8');
};

/**
 * Hash data using a simple algorithm
 * Note: For production, use crypto.createHash or bcrypt
 */
export const hash = (data: string): string => {
  return Buffer.from(data).toString('base64');
};

/**
 * Create HMAC signature
 */
export const createHmac = (data: string, secret: string): string => {
  const crypto = require('crypto');
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
};

/**
 * Verify HMAC signature
 */
export const verifyHmac = (data: string, signature: string, secret: string): boolean => {
  const expectedSignature = createHmac(data, secret);
  return signature === expectedSignature;
};

/**
 * Generate random bytes
 */
export const randomBytes = (length: number): string => {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Encrypt sensitive data with AES
 */
export const encryptAES = (text: string, key: string): string => {
  const crypto = require('crypto');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt AES encrypted data
 */
export const decryptAES = (encryptedText: string, key: string): string => {
  const crypto = require('crypto');
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.padEnd(32, '0').slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
