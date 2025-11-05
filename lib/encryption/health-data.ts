/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Health Data Encryption Utility
 * 
 * GDPR Art. 9 Compliance - Special Category Data (Health Data)
 * Implements AES-256-GCM encryption with PBKDF2 key derivation
 */

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const SALT_LENGTH = 32; // 256 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const PBKDF2_DIGEST = 'sha512';

/**
 * Structure for encrypted data
 */
export interface EncryptedData {
  encrypted: string; // Base64 encoded ciphertext
  iv: string; // Base64 encoded initialization vector
  authTag: string; // Base64 encoded authentication tag
  salt: string; // Base64 encoded salt for key derivation
}

/**
 * Get master encryption key from environment
 * @throws Error if HEALTH_DATA_ENCRYPTION_KEY is not set
 */
export function getMasterKey(): Buffer {
  const masterKey = process.env.HEALTH_DATA_ENCRYPTION_KEY;

  if (!masterKey) {
    throw new Error(
      'HEALTH_DATA_ENCRYPTION_KEY environment variable is not set. ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  // Master key should be 64 hex characters (32 bytes)
  if (masterKey.length !== 64) {
    throw new Error(
      'HEALTH_DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
      'Generate one with: openssl rand -hex 32'
    );
  }

  return Buffer.from(masterKey, 'hex');
}

/**
 * Derive encryption key from master key using PBKDF2
 * @param masterKey - Master encryption key
 * @param salt - Random salt for key derivation
 * @returns Derived encryption key
 */
export function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return pbkdf2Sync(
    masterKey,
    salt,
    PBKDF2_ITERATIONS,
    KEY_LENGTH,
    PBKDF2_DIGEST
  );
}

/**
 * Encrypt plaintext using AES-256-GCM
 * @param plaintext - Data to encrypt
 * @returns Encrypted data structure
 */
export function encrypt(plaintext: string): EncryptedData {
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive encryption key from master key
  const masterKey = getMasterKey();
  const key = deriveKey(masterKey, salt);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv);

  // Encrypt data
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  // Get authentication tag (for GCM mode)
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    salt: salt.toString('base64'),
  };
}

/**
 * Decrypt encrypted data using AES-256-GCM
 * @param encryptedData - Encrypted data structure
 * @returns Decrypted plaintext
 * @throws Error if decryption fails (wrong key, corrupted data, etc.)
 */
export function decrypt(encryptedData: EncryptedData): string {
  try {
    // Convert from base64
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const encrypted = encryptedData.encrypted;

    // Derive encryption key from master key
    const masterKey = getMasterKey();
    const key = deriveKey(masterKey, salt);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(
      'Failed to decrypt health data: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}

/**
 * Check if a string is encrypted data (JSON format)
 * @param value - String to check
 * @returns True if value appears to be encrypted data
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;

  try {
    const parsed = JSON.parse(value);
    return (
      typeof parsed === 'object' &&
      'encrypted' in parsed &&
      'iv' in parsed &&
      'authTag' in parsed &&
      'salt' in parsed
    );
  } catch {
    return false;
  }
}

/**
 * Serialize encrypted data to JSON string for database storage
 * @param encryptedData - Encrypted data structure
 * @returns JSON string
 */
export function serializeEncrypted(encryptedData: EncryptedData): string {
  return JSON.stringify(encryptedData);
}

/**
 * Deserialize encrypted data from JSON string
 * @param serialized - JSON string from database
 * @returns Encrypted data structure
 * @throws Error if JSON is invalid or missing required fields
 */
export function deserializeEncrypted(serialized: string): EncryptedData {
  try {
    const parsed = JSON.parse(serialized);

    if (
      !parsed.encrypted ||
      !parsed.iv ||
      !parsed.authTag ||
      !parsed.salt
    ) {
      throw new Error('Invalid encrypted data format: missing required fields');
    }

    return {
      encrypted: parsed.encrypted,
      iv: parsed.iv,
      authTag: parsed.authTag,
      salt: parsed.salt,
    };
  } catch (error) {
    throw new Error(
      'Failed to deserialize encrypted data: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}

/**
 * Encrypt plaintext and return as serialized JSON string
 * Convenience function combining encrypt + serialize
 */
export function encryptToString(plaintext: string): string {
  const encrypted = encrypt(plaintext);
  return serializeEncrypted(encrypted);
}

/**
 * Decrypt from serialized JSON string
 * Convenience function combining deserialize + decrypt
 */
export function decryptFromString(serialized: string): string {
  const encrypted = deserializeEncrypted(serialized);
  return decrypt(encrypted);
}
