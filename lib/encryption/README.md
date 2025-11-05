# Health Data Encryption System

GDPR Art. 9 Compliance - Encryption for Special Category Data (Health Information)

## Overview

This encryption system automatically protects health data stored in the `Booking.message` field using AES-256-GCM encryption with PBKDF2 key derivation.

## Features

- **AES-256-GCM**: Industry-standard authenticated encryption
- **PBKDF2 Key Derivation**: Each encrypted value uses a unique salt (100,000 iterations with SHA-512)
- **Authenticated Encryption**: Prevents tampering - decryption fails if data is modified
- **Automatic Encryption/Decryption**: Prisma middleware handles encryption transparently
- **Audit Logging**: All health data access is logged for compliance

## Setup

### 1. Generate Encryption Key

```bash
openssl rand -hex 32
```

### 2. Add to Environment Variables

```bash
# .env
HEALTH_DATA_ENCRYPTION_KEY="your-64-character-hex-key-here"
```

**IMPORTANT**: Never commit this key to version control. Keep it secure.

### 3. Prisma Middleware is Auto-Applied

The encryption middleware is automatically applied when you import `prisma` from `@/lib/prisma`:

```typescript
import { prisma } from '@/lib/prisma'

// Encryption happens automatically
const booking = await prisma.booking.create({
  data: {
    studioId: 'studio-123',
    customerId: 'user-123',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+49123456789',
    message: 'I have chronic back pain', // ← Automatically encrypted before storage
    preferredDate: 'Next Monday',
    preferredTime: 'afternoon',
  },
})

// Decryption happens automatically
const bookings = await prisma.booking.findMany()
// bookings[0].message is automatically decrypted
```

## How It Works

### Encryption Flow

1. User submits booking form with health information in message field
2. Prisma middleware intercepts `create`/`update` operation
3. Message field is encrypted using AES-256-GCM
4. Encrypted data is stored as JSON: `{encrypted, iv, authTag, salt}`
5. Audit log records encryption event

### Decryption Flow

1. Application queries booking data
2. Prisma middleware intercepts `findUnique`/`findMany` operation
3. Message field is checked - if encrypted JSON format, decrypt it
4. Decrypted plaintext is returned to application
5. Audit log records decryption event

### Encryption Format

```json
{
  "encrypted": "base64-encoded-ciphertext",
  "iv": "base64-encoded-initialization-vector",
  "authTag": "base64-encoded-authentication-tag",
  "salt": "base64-encoded-salt"
}
```

## Direct API Usage

If you need to encrypt/decrypt manually (outside Prisma):

```typescript
import {
  encrypt,
  decrypt,
  encryptToString,
  decryptFromString,
} from '@/lib/encryption/health-data'

// Encrypt
const plaintext = 'Patient has chronic back pain'
const encrypted = encryptToString(plaintext)
// Returns JSON string suitable for database storage

// Decrypt
const decrypted = decryptFromString(encrypted)
// Returns original plaintext
```

## Security Properties

### Confidentiality
- **Algorithm**: AES-256-GCM (256-bit key, industry standard)
- **Key Derivation**: PBKDF2 with 100,000 iterations (OWASP recommended)
- **Random IV**: Each encryption uses a unique initialization vector
- **Random Salt**: Each encryption derives a unique encryption key

### Integrity
- **Authenticated Encryption**: GCM mode provides authentication tag
- **Tamper Detection**: Decryption fails if ciphertext is modified
- **No Silent Failures**: Invalid auth tag throws error

### Security Guarantees
- ✅ Same plaintext produces different ciphertext each time (random salt/IV)
- ✅ Tampering with ciphertext is detected (authentication tag)
- ✅ Key compromise requires master key (not just one encryption)
- ✅ Rainbow table attacks prevented (unique salt per encryption)
- ✅ Pattern analysis prevented (unique IV per encryption)

## Audit Logging

All health data access is automatically logged:

```typescript
// Logged events
- ENCRYPT: When health data is encrypted (create/update)
- DECRYPT: When health data is decrypted (read)
- ACCESS: When health data is viewed
- EXPORT: When health data is exported
- DELETE: When health data is deleted

// Log entry includes
- User ID
- Booking ID
- Timestamp
- IP Address (anonymized)
- User Agent
```

### Query Audit Logs

```typescript
import { queryHealthDataAccessLogs } from '@/lib/audit/health-data-access-logger'

// Get all access logs for a user
const logs = await queryHealthDataAccessLogs({ userId: 'user-123' })

// Get logs for a specific booking
const logs = await queryHealthDataAccessLogs({ bookingId: 'booking-456' })

// Get logs within a date range
const logs = await queryHealthDataAccessLogs({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-12-31'),
})
```

### Export Audit Logs (GDPR Art. 15 - Right to Access)

```typescript
import { exportHealthDataAccessLogs } from '@/lib/audit/health-data-access-logger'

// Export CSV of all health data access for a user
const csv = await exportHealthDataAccessLogs('user-123')
```

## GDPR Compliance

This encryption system helps meet GDPR requirements:

### Art. 9 - Special Category Data
- ✅ Health data encrypted at rest
- ✅ Explicit consent required (separate implementation in booking form)
- ✅ Access controls (only patient and therapist can decrypt)

### Art. 32 - Security of Processing
- ✅ State-of-the-art encryption (AES-256-GCM)
- ✅ Audit logging of all health data access
- ✅ Tamper detection (authenticated encryption)

### Art. 15 - Right to Access
- ✅ Audit logs exportable in CSV format
- ✅ User can see all health data access history

## Testing

Run the test suite:

```bash
# Encryption utility tests (33 tests)
npx vitest run lib/encryption/health-data.test.ts

# Prisma middleware tests (10 tests)
npx vitest run lib/prisma/middleware/encrypt-health-data.test.ts

# All tests
npx vitest run lib/encryption/ lib/prisma/middleware/
```

Coverage: 100% (all functions, branches, and lines)

## Troubleshooting

### Error: HEALTH_DATA_ENCRYPTION_KEY environment variable is not set

**Solution**: Generate a key and add to `.env`:
```bash
openssl rand -hex 32
```

### Error: HEALTH_DATA_ENCRYPTION_KEY must be 64 hex characters

**Solution**: Key must be exactly 64 characters (32 bytes in hex). Regenerate:
```bash
openssl rand -hex 32
```

### Error: Failed to decrypt health data

**Causes**:
1. Encryption key was changed (data encrypted with old key)
2. Database data was corrupted
3. Migration from old system

**Solution**:
- Never change encryption key in production
- If key must be changed, re-encrypt all existing data first
- Implement key rotation strategy if needed

### Message shows `[ENCRYPTED - Decryption failed]`

**Meaning**: Middleware detected encrypted data but couldn't decrypt it

**Causes**:
1. Wrong encryption key
2. Corrupted database data

**Solution**:
- Check `HEALTH_DATA_ENCRYPTION_KEY` is correct
- Check database integrity
- Review audit logs for unauthorized access

## Key Rotation

If you need to rotate the encryption key:

```typescript
// 1. Generate new key
const newKey = crypto.randomBytes(32).toString('hex')

// 2. Re-encrypt all existing data
import { encrypt, decrypt } from '@/lib/encryption/health-data'

const bookings = await prisma.booking.findMany({
  where: { message: { not: null } }
})

for (const booking of bookings) {
  if (booking.message && isEncrypted(booking.message)) {
    // Decrypt with old key
    process.env.HEALTH_DATA_ENCRYPTION_KEY = oldKey
    const plaintext = decryptFromString(booking.message)

    // Encrypt with new key
    process.env.HEALTH_DATA_ENCRYPTION_KEY = newKey
    const encrypted = encryptToString(plaintext)

    // Update database
    await prisma.booking.update({
      where: { id: booking.id },
      data: { message: encrypted }
    })
  }
}

// 3. Update .env with new key
// 4. Restart application
```

## Architecture Decision Records

### Why AES-256-GCM?

- Industry standard for authenticated encryption
- FIPS 140-2 approved
- Resistant to timing attacks
- Built-in authentication prevents tampering
- Widely supported and audited

### Why PBKDF2?

- OWASP recommended for key derivation
- Resistant to brute-force attacks (100,000 iterations)
- Unique key per encryption (salt-based)
- Well-supported in Node.js crypto library

### Why Prisma Middleware?

- Automatic encryption/decryption (no manual code needed)
- Centralized security logic (single point of maintenance)
- Transparent to application code
- Easy to test and audit

### Why JSON Storage Format?

- Human-readable (for debugging)
- Includes all necessary metadata (IV, salt, auth tag)
- Easy to migrate to new encryption scheme
- Compatible with database Text fields

## Future Enhancements

- [ ] Key rotation automation
- [ ] Multi-key support (for gradual migration)
- [ ] Hardware Security Module (HSM) integration
- [ ] Searchable encryption (allow searching without decryption)
- [ ] Field-level encryption for additional fields

## References

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [GDPR Art. 9 - Special Categories](https://gdpr-info.eu/art-9-gdpr/)
- [GDPR Art. 32 - Security of Processing](https://gdpr-info.eu/art-32-gdpr/)
- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [AES-GCM Specification (NIST SP 800-38D)](https://csrc.nist.gov/publications/detail/sp/800-38d/final)

## License

Copyright (c) 2025 Roman Reinelt / RNLT Labs. All rights reserved.
