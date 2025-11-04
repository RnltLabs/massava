/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Health Data Encryption Utility Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  encrypt,
  decrypt,
  getMasterKey,
  deriveKey,
  isEncrypted,
  serializeEncrypted,
  deserializeEncrypted,
  encryptToString,
  decryptFromString,
  type EncryptedData,
} from './health-data';

// Test encryption key (32 bytes = 64 hex characters)
const TEST_KEY = 'a'.repeat(64);

describe('Health Data Encryption', () => {
  // Store original env
  const originalEnv = process.env.HEALTH_DATA_ENCRYPTION_KEY;

  beforeEach(() => {
    // Set test key
    process.env.HEALTH_DATA_ENCRYPTION_KEY = TEST_KEY;
  });

  afterEach(() => {
    // Restore original env
    process.env.HEALTH_DATA_ENCRYPTION_KEY = originalEnv;
  });

  describe('getMasterKey', () => {
    it('should return master key from environment', () => {
      const key = getMasterKey();
      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32); // 32 bytes
    });

    it('should throw error if HEALTH_DATA_ENCRYPTION_KEY is not set', () => {
      delete process.env.HEALTH_DATA_ENCRYPTION_KEY;
      expect(() => getMasterKey()).toThrow('HEALTH_DATA_ENCRYPTION_KEY environment variable is not set');
    });

    it('should throw error if key is wrong length', () => {
      process.env.HEALTH_DATA_ENCRYPTION_KEY = 'tooshort';
      expect(() => getMasterKey()).toThrow('must be 64 hex characters');
    });
  });

  describe('deriveKey', () => {
    it('should derive consistent key from same master key and salt', () => {
      const masterKey = getMasterKey();
      const salt = Buffer.from('test-salt-1234567890123456789012'); // 32 bytes

      const key1 = deriveKey(masterKey, salt);
      const key2 = deriveKey(masterKey, salt);

      expect(key1).toBeInstanceOf(Buffer);
      expect(key1.length).toBe(32);
      expect(key1.equals(key2)).toBe(true);
    });

    it('should derive different keys from different salts', () => {
      const masterKey = getMasterKey();
      const salt1 = Buffer.from('salt1-1234567890123456789012345'); // 32 bytes
      const salt2 = Buffer.from('salt2-1234567890123456789012345'); // 32 bytes

      const key1 = deriveKey(masterKey, salt1);
      const key2 = deriveKey(masterKey, salt2);

      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('encrypt', () => {
    it('should encrypt plaintext successfully', () => {
      const plaintext = 'Patient has chronic back pain';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toHaveProperty('encrypted');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('authTag');
      expect(encrypted).toHaveProperty('salt');
      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();
      expect(encrypted.salt).toBeTruthy();
    });

    it('should produce different encrypted output each time (random salt/iv)', () => {
      const plaintext = 'Same message';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // Different salt and IV should produce different ciphertext
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
    });

    it('should handle empty string', () => {
      const encrypted = encrypt('');
      // Empty string encrypted has metadata but empty ciphertext
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.authTag).toBeTruthy();
      expect(encrypted.salt).toBeTruthy();
    });

    it('should handle unicode characters', () => {
      const plaintext = 'Patient has Rückenschmerzen (back pain) 🏥';
      const encrypted = encrypt(plaintext);
      expect(encrypted.encrypted).toBeTruthy();
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data successfully', () => {
      const plaintext = 'Patient has chronic back pain';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle empty string roundtrip', () => {
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters roundtrip', () => {
      const plaintext = 'Rückenschmerzen 🏥';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should throw error if auth tag is invalid (tampered data)', () => {
      const plaintext = 'Secret message';
      const encrypted = encrypt(plaintext);

      // Tamper with the encrypted data
      const tampered: EncryptedData = {
        ...encrypted,
        encrypted: encrypted.encrypted.slice(0, -1) + 'X',
      };

      expect(() => decrypt(tampered)).toThrow('Failed to decrypt health data');
    });

    it('should throw error if using wrong encryption key', () => {
      const plaintext = 'Secret message';
      const encrypted = encrypt(plaintext);

      // Change the encryption key
      process.env.HEALTH_DATA_ENCRYPTION_KEY = 'b'.repeat(64);

      expect(() => decrypt(encrypted)).toThrow('Failed to decrypt health data');
    });
  });

  describe('isEncrypted', () => {
    it('should return true for encrypted data', () => {
      const plaintext = 'Health data';
      const encrypted = encrypt(plaintext);
      const serialized = serializeEncrypted(encrypted);

      expect(isEncrypted(serialized)).toBe(true);
    });

    it('should return false for plaintext', () => {
      expect(isEncrypted('Just a regular message')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isEncrypted(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isEncrypted(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      expect(isEncrypted('{invalid json')).toBe(false);
    });

    it('should return false for JSON missing required fields', () => {
      const incomplete = JSON.stringify({ encrypted: 'data', iv: 'data' });
      expect(isEncrypted(incomplete)).toBe(false);
    });
  });

  describe('serializeEncrypted', () => {
    it('should serialize encrypted data to JSON string', () => {
      const plaintext = 'Health data';
      const encrypted = encrypt(plaintext);
      const serialized = serializeEncrypted(encrypted);

      expect(typeof serialized).toBe('string');
      const parsed = JSON.parse(serialized);
      expect(parsed.encrypted).toBe(encrypted.encrypted);
      expect(parsed.iv).toBe(encrypted.iv);
      expect(parsed.authTag).toBe(encrypted.authTag);
      expect(parsed.salt).toBe(encrypted.salt);
    });
  });

  describe('deserializeEncrypted', () => {
    it('should deserialize JSON string to encrypted data', () => {
      const plaintext = 'Health data';
      const encrypted = encrypt(plaintext);
      const serialized = serializeEncrypted(encrypted);
      const deserialized = deserializeEncrypted(serialized);

      expect(deserialized.encrypted).toBe(encrypted.encrypted);
      expect(deserialized.iv).toBe(encrypted.iv);
      expect(deserialized.authTag).toBe(encrypted.authTag);
      expect(deserialized.salt).toBe(encrypted.salt);
    });

    it('should throw error for invalid JSON', () => {
      expect(() => deserializeEncrypted('{invalid json')).toThrow('Failed to deserialize encrypted data');
    });

    it('should throw error for missing required fields', () => {
      const incomplete = JSON.stringify({ encrypted: 'data', iv: 'data' });
      expect(() => deserializeEncrypted(incomplete)).toThrow('Invalid encrypted data format');
    });
  });

  describe('encryptToString', () => {
    it('should encrypt and serialize in one step', () => {
      const plaintext = 'Health data';
      const encrypted = encryptToString(plaintext);

      expect(typeof encrypted).toBe('string');
      expect(isEncrypted(encrypted)).toBe(true);
    });
  });

  describe('decryptFromString', () => {
    it('should deserialize and decrypt in one step', () => {
      const plaintext = 'Health data';
      const encrypted = encryptToString(plaintext);
      const decrypted = decryptFromString(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('End-to-end encryption', () => {
    it('should handle full roundtrip with serialize/deserialize', () => {
      const plaintext = 'Patient has diabetes and hypertension';
      
      // Encrypt
      const encrypted = encrypt(plaintext);
      const serialized = serializeEncrypted(encrypted);
      
      // Store in "database" (simulate)
      const fromDatabase = serialized;
      
      // Retrieve and decrypt
      const deserialized = deserializeEncrypted(fromDatabase);
      const decrypted = decrypt(deserialized);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle convenience functions roundtrip', () => {
      const plaintext = 'Patient has diabetes and hypertension';
      
      // Encrypt
      const encrypted = encryptToString(plaintext);
      
      // Store in "database"
      const fromDatabase = encrypted;
      
      // Decrypt
      const decrypted = decryptFromString(fromDatabase);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Security properties', () => {
    it('should use unique salt for each encryption (prevents rainbow tables)', () => {
      const plaintext = 'Same message';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should use unique IV for each encryption (prevents pattern analysis)', () => {
      const plaintext = 'Same message';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should produce authentication tag (ensures data integrity)', () => {
      const plaintext = 'Health data';
      const encrypted = encrypt(plaintext);

      expect(encrypted.authTag).toBeTruthy();
      expect(encrypted.authTag.length).toBeGreaterThan(0);
    });

    it('should fail decryption if data is modified (authenticated encryption)', () => {
      const plaintext = 'Health data';
      const encrypted = encrypt(plaintext);

      // Modify ciphertext
      const modified: EncryptedData = {
        ...encrypted,
        encrypted: 'tampered' + encrypted.encrypted,
      };

      expect(() => decrypt(modified)).toThrow();
    });
  });
});
