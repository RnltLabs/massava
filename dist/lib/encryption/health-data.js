"use strict";
/**
 * Copyright (c) 2025 Roman Reinelt / RNLT Labs
 * All rights reserved.
 *
 * Health Data Encryption Utility
 *
 * GDPR Art. 9 Compliance - Special Category Data (Health Data)
 * Implements AES-256-GCM encryption with PBKDF2 key derivation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMasterKey = getMasterKey;
exports.getMasterKeyResult = getMasterKeyResult;
exports.deriveKey = deriveKey;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.decryptResult = decryptResult;
exports.isEncrypted = isEncrypted;
exports.serializeEncrypted = serializeEncrypted;
exports.deserializeEncrypted = deserializeEncrypted;
exports.deserializeEncryptedResult = deserializeEncryptedResult;
exports.encryptToString = encryptToString;
exports.decryptFromString = decryptFromString;
exports.decryptFromStringResult = decryptFromStringResult;
const crypto_1 = require("crypto");
const result_1 = require("@/lib/result");
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits for GCM
const SALT_LENGTH = 32; // 256 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100000; // OWASP recommended minimum
const PBKDF2_DIGEST = 'sha512';
/**
 * Get master encryption key from environment
 * @throws Error if HEALTH_DATA_ENCRYPTION_KEY is not set
 * @deprecated Use getMasterKeyResult instead for Result-based error handling
 */
function getMasterKey() {
    const masterKey = process.env.HEALTH_DATA_ENCRYPTION_KEY;
    if (!masterKey) {
        throw new Error('HEALTH_DATA_ENCRYPTION_KEY environment variable is not set. ' +
            'Generate one with: openssl rand -hex 32');
    }
    // Master key should be 64 hex characters (32 bytes)
    if (masterKey.length !== 64) {
        throw new Error('HEALTH_DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
            'Generate one with: openssl rand -hex 32');
    }
    return Buffer.from(masterKey, 'hex');
}
/**
 * Get master encryption key from environment - Result-based (no exceptions)
 * Preferred over getMasterKey for new code
 *
 * @returns Ok(Buffer) if key is valid, Err(string) otherwise
 */
function getMasterKeyResult() {
    const masterKey = process.env.HEALTH_DATA_ENCRYPTION_KEY;
    if (!masterKey) {
        return (0, result_1.err)('HEALTH_DATA_ENCRYPTION_KEY environment variable is not set. ' +
            'Generate one with: openssl rand -hex 32');
    }
    // Master key should be 64 hex characters (32 bytes)
    if (masterKey.length !== 64) {
        return (0, result_1.err)('HEALTH_DATA_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ' +
            'Generate one with: openssl rand -hex 32');
    }
    return (0, result_1.ok)(Buffer.from(masterKey, 'hex'));
}
/**
 * Derive encryption key from master key using PBKDF2
 * @param masterKey - Master encryption key
 * @param salt - Random salt for key derivation
 * @returns Derived encryption key
 */
function deriveKey(masterKey, salt) {
    return (0, crypto_1.pbkdf2Sync)(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}
/**
 * Encrypt plaintext using AES-256-GCM
 * @param plaintext - Data to encrypt
 * @returns Encrypted data structure
 */
function encrypt(plaintext) {
    // Generate random salt and IV
    const salt = (0, crypto_1.randomBytes)(SALT_LENGTH);
    const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
    // Derive encryption key from master key
    const masterKey = getMasterKey();
    const key = deriveKey(masterKey, salt);
    // Create cipher
    const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, key, iv);
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
 * @deprecated Use decryptResult instead for Result-based error handling
 */
function decrypt(encryptedData) {
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
        const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        // Decrypt data
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    catch (error) {
        throw new Error('Failed to decrypt health data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}
/**
 * Decrypt encrypted data using AES-256-GCM - Result-based (no exceptions)
 * Preferred over decrypt for new code
 *
 * @param encryptedData - Encrypted data structure
 * @returns Ok(string) with decrypted plaintext, or Err(string) if decryption fails
 */
function decryptResult(encryptedData) {
    try {
        // Convert from base64
        const iv = Buffer.from(encryptedData.iv, 'base64');
        const authTag = Buffer.from(encryptedData.authTag, 'base64');
        const salt = Buffer.from(encryptedData.salt, 'base64');
        const encrypted = encryptedData.encrypted;
        // Derive encryption key from master key
        const masterKeyResult = getMasterKeyResult();
        if (!masterKeyResult.ok) {
            return (0, result_1.err)(masterKeyResult.error);
        }
        const masterKey = masterKeyResult.value;
        const key = deriveKey(masterKey, salt);
        // Create decipher
        const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);
        // Decrypt data
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return (0, result_1.ok)(decrypted);
    }
    catch (error) {
        return (0, result_1.err)('Failed to decrypt health data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}
/**
 * Check if a string is encrypted data (JSON format)
 * @param value - String to check
 * @returns True if value appears to be encrypted data
 */
function isEncrypted(value) {
    if (!value)
        return false;
    try {
        const parsed = JSON.parse(value);
        return (typeof parsed === 'object' &&
            'encrypted' in parsed &&
            'iv' in parsed &&
            'authTag' in parsed &&
            'salt' in parsed);
    }
    catch {
        return false;
    }
}
/**
 * Serialize encrypted data to JSON string for database storage
 * @param encryptedData - Encrypted data structure
 * @returns JSON string
 */
function serializeEncrypted(encryptedData) {
    return JSON.stringify(encryptedData);
}
/**
 * Deserialize encrypted data from JSON string
 * @param serialized - JSON string from database
 * @returns Encrypted data structure
 * @throws Error if JSON is invalid or missing required fields
 * @deprecated Use deserializeEncryptedResult instead for Result-based error handling
 */
function deserializeEncrypted(serialized) {
    try {
        const parsed = JSON.parse(serialized);
        if (!parsed.encrypted ||
            !parsed.iv ||
            !parsed.authTag ||
            !parsed.salt) {
            throw new Error('Invalid encrypted data format: missing required fields');
        }
        return {
            encrypted: parsed.encrypted,
            iv: parsed.iv,
            authTag: parsed.authTag,
            salt: parsed.salt,
        };
    }
    catch (error) {
        throw new Error('Failed to deserialize encrypted data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}
/**
 * Deserialize encrypted data from JSON string - Result-based (no exceptions)
 * Preferred over deserializeEncrypted for new code
 *
 * @param serialized - JSON string from database
 * @returns Ok(EncryptedData) if valid, Err(string) otherwise
 */
function deserializeEncryptedResult(serialized) {
    try {
        const parsed = JSON.parse(serialized);
        if (!parsed.encrypted ||
            !parsed.iv ||
            !parsed.authTag ||
            !parsed.salt) {
            return (0, result_1.err)('Invalid encrypted data format: missing required fields');
        }
        return (0, result_1.ok)({
            encrypted: parsed.encrypted,
            iv: parsed.iv,
            authTag: parsed.authTag,
            salt: parsed.salt,
        });
    }
    catch (error) {
        return (0, result_1.err)('Failed to deserialize encrypted data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
}
/**
 * Encrypt plaintext and return as serialized JSON string
 * Convenience function combining encrypt + serialize
 */
function encryptToString(plaintext) {
    const encrypted = encrypt(plaintext);
    return serializeEncrypted(encrypted);
}
/**
 * Decrypt from serialized JSON string
 * Convenience function combining deserialize + decrypt
 * @deprecated Use decryptFromStringResult instead for Result-based error handling
 */
function decryptFromString(serialized) {
    const encrypted = deserializeEncrypted(serialized);
    return decrypt(encrypted);
}
/**
 * Decrypt from serialized JSON string - Result-based (no exceptions)
 * Preferred over decryptFromString for new code
 * Convenience function combining deserialize + decrypt
 *
 * @param serialized - JSON string from database
 * @returns Ok(string) with decrypted plaintext, or Err(string) if deserialization or decryption fails
 */
function decryptFromStringResult(serialized) {
    const deserializeResult = deserializeEncryptedResult(serialized);
    if (!deserializeResult.ok) {
        return (0, result_1.err)(deserializeResult.error);
    }
    return decryptResult(deserializeResult.value);
}
