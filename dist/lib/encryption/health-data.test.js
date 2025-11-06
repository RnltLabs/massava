"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Health Data Encryption Utility Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const health_data_1 = require("./health-data");
// Test encryption key (32 bytes = 64 hex characters)
const TEST_KEY = 'a'.repeat(64);
(0, vitest_1.describe)('Health Data Encryption', () => {
    // Store original env
    const originalEnv = process.env.HEALTH_DATA_ENCRYPTION_KEY;
    (0, vitest_1.beforeEach)(() => {
        // Set test key
        process.env.HEALTH_DATA_ENCRYPTION_KEY = TEST_KEY;
    });
    (0, vitest_1.afterEach)(() => {
        // Restore original env
        process.env.HEALTH_DATA_ENCRYPTION_KEY = originalEnv;
    });
    (0, vitest_1.describe)('getMasterKey', () => {
        (0, vitest_1.it)('should return master key from environment', () => {
            const key = (0, health_data_1.getMasterKey)();
            (0, vitest_1.expect)(key).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(key.length).toBe(32); // 32 bytes
        });
        (0, vitest_1.it)('should throw error if HEALTH_DATA_ENCRYPTION_KEY is not set', () => {
            delete process.env.HEALTH_DATA_ENCRYPTION_KEY;
            (0, vitest_1.expect)(() => (0, health_data_1.getMasterKey)()).toThrow('HEALTH_DATA_ENCRYPTION_KEY environment variable is not set');
        });
        (0, vitest_1.it)('should throw error if key is wrong length', () => {
            process.env.HEALTH_DATA_ENCRYPTION_KEY = 'tooshort';
            (0, vitest_1.expect)(() => (0, health_data_1.getMasterKey)()).toThrow('must be 64 hex characters');
        });
    });
    (0, vitest_1.describe)('deriveKey', () => {
        (0, vitest_1.it)('should derive consistent key from same master key and salt', () => {
            const masterKey = (0, health_data_1.getMasterKey)();
            const salt = Buffer.from('test-salt-1234567890123456789012'); // 32 bytes
            const key1 = (0, health_data_1.deriveKey)(masterKey, salt);
            const key2 = (0, health_data_1.deriveKey)(masterKey, salt);
            (0, vitest_1.expect)(key1).toBeInstanceOf(Buffer);
            (0, vitest_1.expect)(key1.length).toBe(32);
            (0, vitest_1.expect)(key1.equals(key2)).toBe(true);
        });
        (0, vitest_1.it)('should derive different keys from different salts', () => {
            const masterKey = (0, health_data_1.getMasterKey)();
            const salt1 = Buffer.from('salt1-1234567890123456789012345'); // 32 bytes
            const salt2 = Buffer.from('salt2-1234567890123456789012345'); // 32 bytes
            const key1 = (0, health_data_1.deriveKey)(masterKey, salt1);
            const key2 = (0, health_data_1.deriveKey)(masterKey, salt2);
            (0, vitest_1.expect)(key1.equals(key2)).toBe(false);
        });
    });
    (0, vitest_1.describe)('encrypt', () => {
        (0, vitest_1.it)('should encrypt plaintext successfully', () => {
            const plaintext = 'Patient has chronic back pain';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            (0, vitest_1.expect)(encrypted).toHaveProperty('encrypted');
            (0, vitest_1.expect)(encrypted).toHaveProperty('iv');
            (0, vitest_1.expect)(encrypted).toHaveProperty('authTag');
            (0, vitest_1.expect)(encrypted).toHaveProperty('salt');
            (0, vitest_1.expect)(encrypted.encrypted).toBeTruthy();
            (0, vitest_1.expect)(encrypted.iv).toBeTruthy();
            (0, vitest_1.expect)(encrypted.authTag).toBeTruthy();
            (0, vitest_1.expect)(encrypted.salt).toBeTruthy();
        });
        (0, vitest_1.it)('should produce different encrypted output each time (random salt/iv)', () => {
            const plaintext = 'Same message';
            const encrypted1 = (0, health_data_1.encrypt)(plaintext);
            const encrypted2 = (0, health_data_1.encrypt)(plaintext);
            // Different salt and IV should produce different ciphertext
            (0, vitest_1.expect)(encrypted1.salt).not.toBe(encrypted2.salt);
            (0, vitest_1.expect)(encrypted1.iv).not.toBe(encrypted2.iv);
            (0, vitest_1.expect)(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
        });
        (0, vitest_1.it)('should handle empty string', () => {
            const encrypted = (0, health_data_1.encrypt)('');
            // Empty string encrypted has metadata but empty ciphertext
            (0, vitest_1.expect)(encrypted.iv).toBeTruthy();
            (0, vitest_1.expect)(encrypted.authTag).toBeTruthy();
            (0, vitest_1.expect)(encrypted.salt).toBeTruthy();
        });
        (0, vitest_1.it)('should handle unicode characters', () => {
            const plaintext = 'Patient has Rückenschmerzen (back pain) 🏥';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            (0, vitest_1.expect)(encrypted.encrypted).toBeTruthy();
        });
    });
    (0, vitest_1.describe)('decrypt', () => {
        (0, vitest_1.it)('should decrypt encrypted data successfully', () => {
            const plaintext = 'Patient has chronic back pain';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            const decrypted = (0, health_data_1.decrypt)(encrypted);
            (0, vitest_1.expect)(decrypted).toBe(plaintext);
        });
        (0, vitest_1.it)('should handle empty string roundtrip', () => {
            const plaintext = '';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            const decrypted = (0, health_data_1.decrypt)(encrypted);
            (0, vitest_1.expect)(decrypted).toBe(plaintext);
        });
        (0, vitest_1.it)('should handle unicode characters roundtrip', () => {
            const plaintext = 'Rückenschmerzen 🏥';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            const decrypted = (0, health_data_1.decrypt)(encrypted);
            (0, vitest_1.expect)(decrypted).toBe(plaintext);
        });
        (0, vitest_1.it)('should throw error if auth tag is invalid (tampered data)', () => {
            const plaintext = 'Secret message';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            // Tamper with the encrypted data
            const tampered = {
                ...encrypted,
                encrypted: encrypted.encrypted.slice(0, -1) + 'X',
            };
            (0, vitest_1.expect)(() => (0, health_data_1.decrypt)(tampered)).toThrow('Failed to decrypt health data');
        });
        (0, vitest_1.it)('should throw error if using wrong encryption key', () => {
            const plaintext = 'Secret message';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            // Change the encryption key
            process.env.HEALTH_DATA_ENCRYPTION_KEY = 'b'.repeat(64);
            (0, vitest_1.expect)(() => (0, health_data_1.decrypt)(encrypted)).toThrow('Failed to decrypt health data');
        });
    });
    (0, vitest_1.describe)('isEncrypted', () => {
        (0, vitest_1.it)('should return true for encrypted data', () => {
            const plaintext = 'Health data';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            const serialized = (0, health_data_1.serializeEncrypted)(encrypted);
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)(serialized)).toBe(true);
        });
        (0, vitest_1.it)('should return false for plaintext', () => {
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)('Just a regular message')).toBe(false);
        });
        (0, vitest_1.it)('should return false for null', () => {
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)(null)).toBe(false);
        });
        (0, vitest_1.it)('should return false for undefined', () => {
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)(undefined)).toBe(false);
        });
        (0, vitest_1.it)('should return false for empty string', () => {
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)('')).toBe(false);
        });
        (0, vitest_1.it)('should return false for invalid JSON', () => {
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)('{invalid json')).toBe(false);
        });
        (0, vitest_1.it)('should return false for JSON missing required fields', () => {
            const incomplete = JSON.stringify({ encrypted: 'data', iv: 'data' });
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)(incomplete)).toBe(false);
        });
    });
    (0, vitest_1.describe)('serializeEncrypted', () => {
        (0, vitest_1.it)('should serialize encrypted data to JSON string', () => {
            const plaintext = 'Health data';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            const serialized = (0, health_data_1.serializeEncrypted)(encrypted);
            (0, vitest_1.expect)(typeof serialized).toBe('string');
            const parsed = JSON.parse(serialized);
            (0, vitest_1.expect)(parsed.encrypted).toBe(encrypted.encrypted);
            (0, vitest_1.expect)(parsed.iv).toBe(encrypted.iv);
            (0, vitest_1.expect)(parsed.authTag).toBe(encrypted.authTag);
            (0, vitest_1.expect)(parsed.salt).toBe(encrypted.salt);
        });
    });
    (0, vitest_1.describe)('deserializeEncrypted', () => {
        (0, vitest_1.it)('should deserialize JSON string to encrypted data', () => {
            const plaintext = 'Health data';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            const serialized = (0, health_data_1.serializeEncrypted)(encrypted);
            const deserialized = (0, health_data_1.deserializeEncrypted)(serialized);
            (0, vitest_1.expect)(deserialized.encrypted).toBe(encrypted.encrypted);
            (0, vitest_1.expect)(deserialized.iv).toBe(encrypted.iv);
            (0, vitest_1.expect)(deserialized.authTag).toBe(encrypted.authTag);
            (0, vitest_1.expect)(deserialized.salt).toBe(encrypted.salt);
        });
        (0, vitest_1.it)('should throw error for invalid JSON', () => {
            (0, vitest_1.expect)(() => (0, health_data_1.deserializeEncrypted)('{invalid json')).toThrow('Failed to deserialize encrypted data');
        });
        (0, vitest_1.it)('should throw error for missing required fields', () => {
            const incomplete = JSON.stringify({ encrypted: 'data', iv: 'data' });
            (0, vitest_1.expect)(() => (0, health_data_1.deserializeEncrypted)(incomplete)).toThrow('Invalid encrypted data format');
        });
    });
    (0, vitest_1.describe)('encryptToString', () => {
        (0, vitest_1.it)('should encrypt and serialize in one step', () => {
            const plaintext = 'Health data';
            const encrypted = (0, health_data_1.encryptToString)(plaintext);
            (0, vitest_1.expect)(typeof encrypted).toBe('string');
            (0, vitest_1.expect)((0, health_data_1.isEncrypted)(encrypted)).toBe(true);
        });
    });
    (0, vitest_1.describe)('decryptFromString', () => {
        (0, vitest_1.it)('should deserialize and decrypt in one step', () => {
            const plaintext = 'Health data';
            const encrypted = (0, health_data_1.encryptToString)(plaintext);
            const decrypted = (0, health_data_1.decryptFromString)(encrypted);
            (0, vitest_1.expect)(decrypted).toBe(plaintext);
        });
    });
    (0, vitest_1.describe)('End-to-end encryption', () => {
        (0, vitest_1.it)('should handle full roundtrip with serialize/deserialize', () => {
            const plaintext = 'Patient has diabetes and hypertension';
            // Encrypt
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            const serialized = (0, health_data_1.serializeEncrypted)(encrypted);
            // Store in "database" (simulate)
            const fromDatabase = serialized;
            // Retrieve and decrypt
            const deserialized = (0, health_data_1.deserializeEncrypted)(fromDatabase);
            const decrypted = (0, health_data_1.decrypt)(deserialized);
            (0, vitest_1.expect)(decrypted).toBe(plaintext);
        });
        (0, vitest_1.it)('should handle convenience functions roundtrip', () => {
            const plaintext = 'Patient has diabetes and hypertension';
            // Encrypt
            const encrypted = (0, health_data_1.encryptToString)(plaintext);
            // Store in "database"
            const fromDatabase = encrypted;
            // Decrypt
            const decrypted = (0, health_data_1.decryptFromString)(fromDatabase);
            (0, vitest_1.expect)(decrypted).toBe(plaintext);
        });
    });
    (0, vitest_1.describe)('Security properties', () => {
        (0, vitest_1.it)('should use unique salt for each encryption (prevents rainbow tables)', () => {
            const plaintext = 'Same message';
            const encrypted1 = (0, health_data_1.encrypt)(plaintext);
            const encrypted2 = (0, health_data_1.encrypt)(plaintext);
            (0, vitest_1.expect)(encrypted1.salt).not.toBe(encrypted2.salt);
        });
        (0, vitest_1.it)('should use unique IV for each encryption (prevents pattern analysis)', () => {
            const plaintext = 'Same message';
            const encrypted1 = (0, health_data_1.encrypt)(plaintext);
            const encrypted2 = (0, health_data_1.encrypt)(plaintext);
            (0, vitest_1.expect)(encrypted1.iv).not.toBe(encrypted2.iv);
        });
        (0, vitest_1.it)('should produce authentication tag (ensures data integrity)', () => {
            const plaintext = 'Health data';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            (0, vitest_1.expect)(encrypted.authTag).toBeTruthy();
            (0, vitest_1.expect)(encrypted.authTag.length).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should fail decryption if data is modified (authenticated encryption)', () => {
            const plaintext = 'Health data';
            const encrypted = (0, health_data_1.encrypt)(plaintext);
            // Modify ciphertext
            const modified = {
                ...encrypted,
                encrypted: 'tampered' + encrypted.encrypted,
            };
            (0, vitest_1.expect)(() => (0, health_data_1.decrypt)(modified)).toThrow();
        });
    });
});
