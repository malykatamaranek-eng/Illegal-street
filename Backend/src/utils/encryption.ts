import crypto from 'crypto';

/**
 * Encryption utilities for Illegal Street Backend
 * Note: For production, use proper encryption libraries and key management
 */

/**
 * Simple base64 encoding (NOT encryption)
 * For display/transport purposes only
 */
export const encodeBase64 = (data: string): string => {
  return Buffer.from(data).toString('base64');
};

/**
 * Simple base64 decoding (NOT decryption)
 */
export const decodeBase64 = (data: string): string => {
  return Buffer.from(data, 'base64').toString('utf8');
};

/**
 * Hash data using SHA-256
 */
export const hash = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Create HMAC signature
 */
export const createHmac = (data: string, secret: string): string => {
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
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

/**
 * Generate cryptographically secure random bytes
 */
export const randomBytes = (length: number): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Derive a key from password using PBKDF2
 */
export const deriveKey = (password: string, salt: string, keyLength: number = 32): Buffer => {
  return crypto.pbkdf2Sync(password, salt, 100000, keyLength, 'sha256');
};

/**
 * Encrypt sensitive data with AES-256-GCM (authenticated encryption)
 */
export const encryptAES = (text: string, password: string): string => {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(password, salt.toString('hex'), 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

/**
 * Decrypt AES-256-GCM encrypted data
 */
export const decryptAES = (encryptedText: string, password: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted text format');
  }
  
  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const authTag = Buffer.from(parts[2], 'hex');
  const encrypted = parts[3];
  
  const key = deriveKey(password, salt.toString('hex'), 32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Backward compatibility (deprecated - use encodeBase64 instead)
export const encrypt = encodeBase64;
export const decrypt = decodeBase64;
