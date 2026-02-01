import sodium from 'libsodium-wrappers';
import logger from '../config/logger';
import { InternalServerError } from '../utils/errors';

class EncryptionService {
  private initialized = false;

  /**
   * Initialize libsodium
   */
  private async init(): Promise<void> {
    if (!this.initialized) {
      await sodium.ready;
      this.initialized = true;
    }
  }

  /**
   * Generate a key pair for encryption
   */
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    try {
      await this.init();

      const keyPair = sodium.crypto_box_keypair();

      return {
        publicKey: sodium.to_base64(keyPair.publicKey),
        privateKey: sodium.to_base64(keyPair.privateKey),
      };
    } catch (error) {
      logger.error('Key pair generation error:', error);
      throw new InternalServerError('Failed to generate key pair');
    }
  }

  /**
   * Encrypt a message
   * @param message - Plain text message
   * @param recipientPublicKey - Recipient's public key (base64)
   * @param senderPrivateKey - Sender's private key (base64)
   */
  async encryptMessage(
    message: string,
    recipientPublicKey: string,
    senderPrivateKey: string
  ): Promise<string> {
    try {
      await this.init();

      // Convert from base64
      const recipientPublicKeyUint8 = sodium.from_base64(recipientPublicKey);
      const senderPrivateKeyUint8 = sodium.from_base64(senderPrivateKey);

      // Generate nonce
      const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES);

      // Encrypt message
      const messageUint8 = sodium.from_string(message);
      const ciphertext = sodium.crypto_box_easy(
        messageUint8,
        nonce,
        recipientPublicKeyUint8,
        senderPrivateKeyUint8
      );

      // Combine nonce and ciphertext
      const combined = new Uint8Array(nonce.length + ciphertext.length);
      combined.set(nonce);
      combined.set(ciphertext, nonce.length);

      // Return as base64
      return sodium.to_base64(combined);
    } catch (error) {
      logger.error('Message encryption error:', error);
      throw new InternalServerError('Failed to encrypt message');
    }
  }

  /**
   * Decrypt a message
   * @param encryptedMessage - Encrypted message (base64)
   * @param recipientPrivateKey - Recipient's private key (base64)
   * @param senderPublicKey - Sender's public key (base64)
   */
  async decryptMessage(
    encryptedMessage: string,
    recipientPrivateKey: string,
    senderPublicKey: string
  ): Promise<string> {
    try {
      await this.init();

      // Convert from base64
      const combined = sodium.from_base64(encryptedMessage);
      const recipientPrivateKeyUint8 = sodium.from_base64(recipientPrivateKey);
      const senderPublicKeyUint8 = sodium.from_base64(senderPublicKey);

      // Extract nonce and ciphertext
      const nonce = combined.slice(0, sodium.crypto_box_NONCEBYTES);
      const ciphertext = combined.slice(sodium.crypto_box_NONCEBYTES);

      // Decrypt message
      const decrypted = sodium.crypto_box_open_easy(
        ciphertext,
        nonce,
        senderPublicKeyUint8,
        recipientPrivateKeyUint8
      );

      // Convert to string
      return sodium.to_string(decrypted);
    } catch (error) {
      logger.error('Message decryption error:', error);
      throw new InternalServerError('Failed to decrypt message');
    }
  }

  /**
   * Hash data using sodium's generic hash
   */
  async hash(data: string): Promise<string> {
    try {
      await this.init();

      const hash = sodium.crypto_generichash(32, sodium.from_string(data));
      return sodium.to_hex(hash);
    } catch (error) {
      logger.error('Hashing error:', error);
      throw new InternalServerError('Failed to hash data');
    }
  }

  /**
   * Generate a random token
   */
  async generateRandomToken(length: number = 32): Promise<string> {
    try {
      await this.init();

      const token = sodium.randombytes_buf(length);
      return sodium.to_hex(token);
    } catch (error) {
      logger.error('Token generation error:', error);
      throw new InternalServerError('Failed to generate token');
    }
  }
}

export default new EncryptionService();
