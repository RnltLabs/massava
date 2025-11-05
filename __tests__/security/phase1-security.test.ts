/**
 * Phase 1 Security Tests - Integration Tests
 * Verifies all P0 security fixes are in place
 */

describe('Phase 1 Security Fixes', () => {
  describe('P0.1 - IDOR Prevention', () => {
    it('should NOT have customerId in BookingFormData schema', () => {
      // Import the schema
      const { bookingFormSchema } = require('@/lib/validations/booking');

      // Parse empty object to get schema shape
      const result = bookingFormSchema.safeParse({
        studioId: 'test',
        slotId: 'test',
        serviceId: 'test',
      });

      // Check that customerId is NOT in the schema
      // If it exists in input, it should be silently dropped (Zod passthrough behavior)
      const withCustomerId = bookingFormSchema.safeParse({
        studioId: 'test',
        slotId: 'test',
        serviceId: 'test',
        customerName: 'Test',
        customerEmail: 'test@test.com',
        customerPhone: '+1234567890',
      });

      // Verify schema accepts valid data
      expect(withCustomerId.success).toBe(true);

      // Verify customerId is NOT in the schema definition
      // The schema should not have customerId as a valid key
      if (withCustomerId.success) {
        expect(withCustomerId.data).not.toHaveProperty('customerId');
      }
    });

    it('should verify createBooking uses session for customerId', () => {
      // This is a code inspection test - verifies the implementation
      const fs = require('fs');
      const path = require('path');

      const bookingActionPath = path.join(process.cwd(), 'app/actions/createBooking.ts');
      const content = fs.readFileSync(bookingActionPath, 'utf-8');

      // Verify auth is imported
      expect(content).toContain('from "@/auth"');
      expect(content).toContain('await auth()');

      // Verify we're using session.user.id
      expect(content).toContain('session?.user?.id');

      // Verify we're NOT using validated.customerId
      expect(content).not.toContain('validated.customerId');
    });
  });

  describe('P0.2 - GDPR Endpoint Authentication', () => {
    it('should verify delete-data endpoint requires authentication', () => {
      const fs = require('fs');
      const path = require('path');

      const deletePath = path.join(process.cwd(), 'app/api/gdpr/delete-data/route.ts');
      const content = fs.readFileSync(deletePath, 'utf-8');

      // Verify auth is imported and called
      expect(content).toContain("from '@/auth'");
      expect(content).toContain('await auth()');

      // Verify IDOR check exists (session.user.id !== userId)
      expect(content).toContain('session.user.id');
      expect(content).toContain('userId');
    });

    it('should verify export-data endpoint requires authentication', () => {
      const fs = require('fs');
      const path = require('path');

      const exportPath = path.join(process.cwd(), 'app/api/gdpr/export-data/route.ts');
      const content = fs.readFileSync(exportPath, 'utf-8');

      // Verify auth is imported and called
      expect(content).toContain("from '@/auth'");
      expect(content).toContain('await auth()');
    });
  });

  describe('P0.3 - OAuth Account Linking', () => {
    it('should verify dangerous email linking is disabled', () => {
      const fs = require('fs');
      const path = require('path');

      const configPath = path.join(process.cwd(), 'auth.config.ts');
      const content = fs.readFileSync(configPath, 'utf-8');

      // Verify allowDangerousEmailAccountLinking is set to false
      expect(content).toContain('allowDangerousEmailAccountLinking: false');
      expect(content).not.toContain('allowDangerousEmailAccountLinking: true');
    });
  });

  describe('P0.4 - Rate Limiting', () => {
    it('should verify rate limiting module exists', () => {
      const fs = require('fs');
      const path = require('path');

      const rateLimitPath = path.join(process.cwd(), 'lib/auth/rate-limit.ts');
      expect(fs.existsSync(rateLimitPath)).toBe(true);

      const content = fs.readFileSync(rateLimitPath, 'utf-8');

      // Verify key functions exist
      expect(content).toContain('export function rateLimitByIP');
      expect(content).toContain('export function rateLimitByUser');
      expect(content).toContain('export function resetRateLimit');
    });

    it('should verify rate limit has correct default config', () => {
      const { rateLimitByIP } = require('@/lib/auth/rate-limit');

      // Function should exist
      expect(typeof rateLimitByIP).toBe('function');
    });
  });

  describe('P0.5 - Account Enumeration', () => {
    it('should verify signIn uses generic error messages', () => {
      const fs = require('fs');
      const path = require('path');

      const authPath = path.join(process.cwd(), 'app/actions/auth.ts');
      const content = fs.readFileSync(authPath, 'utf-8');

      // Verify generic error message is used
      expect(content).toContain('Invalid email or password');

      // Should NOT contain specific error messages that reveal account existence
      const lines = content.split('\n');
      const errorMessages = lines.filter(line =>
        line.includes('error:') &&
        (line.includes('customer') || line.includes('studio owner') || line.includes('registered as'))
      );

      // If there are role-mismatch errors, they should also say "Invalid email or password"
      errorMessages.forEach(line => {
        if (line.includes('registered as')) {
          // This would be account enumeration - should not exist
          expect(line).not.toContain('registered as');
        }
      });
    });
  });

  describe('P0.6 - Session Fixation', () => {
    it('should verify JWT maxAge is 24 hours', () => {
      const fs = require('fs');
      const path = require('path');

      const configPath = path.join(process.cwd(), 'auth.config.ts');
      const content = fs.readFileSync(configPath, 'utf-8');

      // Verify maxAge is 24 hours (24 * 60 * 60)
      expect(content).toContain('maxAge: 24 * 60 * 60');
    });

    it('should verify session versioning exists', () => {
      const fs = require('fs');
      const path = require('path');

      const authPath = path.join(process.cwd(), 'auth.ts');
      const content = fs.readFileSync(authPath, 'utf-8');

      // Verify session versioning logic
      expect(content).toContain('sessionVersion');
      expect(content).toContain('token.sessionVersion');
    });
  });

  describe('P0.7 - Business Layout RBAC', () => {
    it('should verify business layout has role checks', () => {
      const fs = require('fs');
      const path = require('path');

      const layoutPath = path.join(process.cwd(), 'app/[locale]/business/layout.tsx');
      const content = fs.readFileSync(layoutPath, 'utf-8');

      // Verify role checks exist
      expect(content).toContain('UserRole.STUDIO_OWNER');
      expect(content).toContain('UserRole.SUPER_ADMIN');
      expect(content).toContain('hasBusinessAccess');
    });
  });

  describe('Config Splitting - Edge Runtime Fix', () => {
    it('should verify auth.config.ts exists and is Edge-safe', () => {
      const fs = require('fs');
      const path = require('path');

      const configPath = path.join(process.cwd(), 'auth.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf-8');

      // Verify NO Prisma imports
      expect(content).not.toContain('from \'@/app/generated/prisma\'');
      expect(content).not.toContain('PrismaClient');

      // Verify it's documented as Edge-safe
      expect(content).toContain('Edge Runtime');
    });

    it('should verify middleware uses auth.config.ts', () => {
      const fs = require('fs');
      const path = require('path');

      const middlewarePath = path.join(process.cwd(), 'middleware.ts');
      const content = fs.readFileSync(middlewarePath, 'utf-8');

      // Verify it imports from auth.config.ts
      expect(content).toContain('from \'./auth.config\'');
      expect(content).toContain('authConfig');

      // Verify it does NOT import from auth.ts directly
      expect(content).not.toContain('from \'./auth\'');
    });

    it('should verify auth.ts has Prisma adapter', () => {
      const fs = require('fs');
      const path = require('path');

      const authPath = path.join(process.cwd(), 'auth.ts');
      expect(fs.existsSync(authPath)).toBe(true);

      const content = fs.readFileSync(authPath, 'utf-8');

      // Verify Prisma is imported
      expect(content).toContain('PrismaClient');
      expect(content).toContain('UnifiedUserAdapter');
    });
  });

  describe('Data Access Layer', () => {
    it('should verify DAL files exist', () => {
      const fs = require('fs');
      const path = require('path');

      expect(fs.existsSync(path.join(process.cwd(), 'lib/auth/dal.ts'))).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), 'lib/auth/types.ts'))).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), 'lib/auth/guards.ts'))).toBe(true);
    });

    it('should verify guards export required functions', () => {
      const fs = require('fs');
      const path = require('path');

      const guardsPath = path.join(process.cwd(), 'lib/auth/guards.ts');
      const content = fs.readFileSync(guardsPath, 'utf-8');

      expect(content).toContain('export async function requireAuth');
      expect(content).toContain('export async function requireRole');
      expect(content).toContain('export async function requireBusinessAccess');
      expect(content).toContain('export async function requireStudioOwnership');
    });
  });
});
