/*
  Warnings:

  - You are about to drop the `_CustomerFavorites` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_CustomerFavorites" DROP CONSTRAINT "_CustomerFavorites_B_fkey";

-- AlterTable
ALTER TABLE "new_bookings" ALTER COLUMN "customerId" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."_CustomerFavorites";

-- ===========================================================================
-- Phase 7: Auth Query Performance Optimization Indexes
-- ===========================================================================
-- Expected improvement: 45ms → <5ms for permission checks (-89%)
-- Target: Studio permission checks from 45ms to <5ms
-- Fixes: Perf-003 (missing composite indexes)
-- ===========================================================================

-- ===== User Table Indexes =====

-- Index for email lookups (used in every sign-in and getCurrentUser)
-- Covers: getUserByEmail(), getCurrentUser() - most frequent auth queries
CREATE INDEX IF NOT EXISTS "idx_user_email_active" ON "users"("email", "isActive", "isSuspended")
WHERE "isActive" = true AND "isSuspended" = false;

-- Index for ID lookups with active filter (used in permission checks)
CREATE INDEX IF NOT EXISTS "idx_user_id_active" ON "users"("id", "isActive", "isSuspended")
WHERE "isActive" = true AND "isSuspended" = false;

-- Index for primary role filtering (used in permission checks)
CREATE INDEX IF NOT EXISTS "idx_user_primary_role" ON "users"("primaryRole", "isActive")
WHERE "isActive" = true;

-- ===== UserRoleAssignment Table Indexes =====

-- Composite index for finding user roles (used in permission checks)
-- Covers: roles.where({ userId }) queries in getCurrentUser()
CREATE INDEX IF NOT EXISTS "idx_user_role_assignments_user_studio" ON "user_role_assignments"("userId", "studioId");

-- Index for role-specific lookups
CREATE INDEX IF NOT EXISTS "idx_user_role_assignments_role" ON "user_role_assignments"("role", "userId");

-- Index for studio-scoped roles
CREATE INDEX IF NOT EXISTS "idx_user_role_assignments_studio" ON "user_role_assignments"("studioId", "role")
WHERE "studioId" IS NOT NULL;

-- Index for expired role cleanup
CREATE INDEX IF NOT EXISTS "idx_user_role_assignments_expires" ON "user_role_assignments"("expiresAt")
WHERE "expiresAt" IS NOT NULL;

-- ===== StudioOwnership Table Indexes =====

-- Composite index for ownership checks (most critical query)
-- Covers: checkStudioOwnership(), checkStudioAccess()
-- This is the PRIMARY index for studio permission checks (45ms → <5ms)
CREATE INDEX IF NOT EXISTS "idx_studio_ownership_user_studio" ON "studio_ownership"("userId", "studioId");

-- Reverse index for finding all owners of a studio
CREATE INDEX IF NOT EXISTS "idx_studio_ownership_studio_user" ON "studio_ownership"("studioId", "userId");

-- Index for pending invitations
CREATE INDEX IF NOT EXISTS "idx_studio_ownership_invited" ON "studio_ownership"("invitedAt", "acceptedAt")
WHERE "acceptedAt" IS NULL;

-- ===== NewSession Table Indexes =====

-- Composite index for session lookups by user (used in session validation)
-- Covers: session validation and cleanup queries
CREATE INDEX IF NOT EXISTS "idx_new_sessions_user_expires" ON "new_sessions"("userId", "expires");

-- Index for session token lookups (most frequent - every request)
-- Note: sessionToken already has unique constraint, but explicit index helps
CREATE INDEX IF NOT EXISTS "idx_new_sessions_token_expires" ON "new_sessions"("sessionToken", "expires");

-- Index for cleanup queries (finding expired sessions)
CREATE INDEX IF NOT EXISTS "idx_new_sessions_expires" ON "new_sessions"("expires");

-- ===== NewAccount Table Indexes (OAuth) =====

-- Composite index for OAuth provider lookups
-- Covers: OAuth sign-in and account linking
CREATE INDEX IF NOT EXISTS "idx_new_accounts_user_provider" ON "new_accounts"("userId", "provider");

-- Index for provider account lookups
CREATE INDEX IF NOT EXISTS "idx_new_accounts_provider_account" ON "new_accounts"("provider", "providerAccountId");

-- ===== AuditLog Table Indexes =====

-- Index for finding audit logs by user
CREATE INDEX IF NOT EXISTS "idx_audit_logs_user" ON "audit_logs"("userId", "createdAt");

-- Composite index for resource audit trail
CREATE INDEX IF NOT EXISTS "idx_audit_logs_resource" ON "audit_logs"("resource", "resourceId", "createdAt");

-- Index for action-based queries
CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action", "createdAt");

-- ===== Token Table Indexes =====

-- Index for magic link token lookups
CREATE INDEX IF NOT EXISTS "idx_magic_link_tokens_token_expires" ON "magic_link_tokens"("token", "expiresAt", "used");

-- Index for email verification token lookups
CREATE INDEX IF NOT EXISTS "idx_email_verification_tokens_token_expires" ON "email_verification_tokens"("token", "expiresAt", "used");

-- Index for password reset token lookups
CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_token_expires" ON "password_reset_tokens"("token", "expiresAt", "used");

-- ===========================================================================
-- Performance Analysis Query Examples (for verification)
-- ===========================================================================
-- After applying this migration, run these queries to verify index usage:
--
-- 1. Check studio ownership (should use idx_studio_ownership_user_studio):
--    EXPLAIN ANALYZE
--    SELECT * FROM "studio_ownership"
--    WHERE "userId" = 'test-id' AND "studioId" = 'studio-id';
--
-- 2. Check user email lookup (should use idx_user_email_active):
--    EXPLAIN ANALYZE
--    SELECT * FROM "users"
--    WHERE "email" = 'test@example.com'
--      AND "isActive" = true
--      AND "isSuspended" = false;
--
-- 3. Check session lookup (should use idx_new_sessions_user_expires):
--    EXPLAIN ANALYZE
--    SELECT * FROM "new_sessions"
--    WHERE "userId" = 'test-id' AND "expires" > NOW();
--
-- Expected: All queries should show "Index Scan" not "Seq Scan"
-- ===========================================================================
