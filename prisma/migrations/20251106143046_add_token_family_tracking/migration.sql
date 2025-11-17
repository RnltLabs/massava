-- DropIndex
DROP INDEX "public"."idx_audit_logs_action";

-- DropIndex
DROP INDEX "public"."idx_audit_logs_resource";

-- DropIndex
DROP INDEX "public"."idx_audit_logs_user";

-- DropIndex
DROP INDEX "public"."idx_email_verification_tokens_token_expires";

-- DropIndex
DROP INDEX "public"."idx_magic_link_tokens_token_expires";

-- DropIndex
DROP INDEX "public"."idx_new_accounts_provider_account";

-- DropIndex
DROP INDEX "public"."idx_new_accounts_user_provider";

-- DropIndex
DROP INDEX "public"."idx_new_sessions_expires";

-- DropIndex
DROP INDEX "public"."idx_new_sessions_token_expires";

-- DropIndex
DROP INDEX "public"."idx_new_sessions_user_expires";

-- DropIndex
DROP INDEX "public"."idx_password_reset_tokens_token_expires";

-- DropIndex
DROP INDEX "public"."idx_studio_ownership_studio_user";

-- DropIndex
DROP INDEX "public"."idx_studio_ownership_user_studio";

-- DropIndex
DROP INDEX "public"."idx_user_role_assignments_role";

-- DropIndex
DROP INDEX "public"."idx_user_role_assignments_user_studio";

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "parentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "revokedBy" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "refresh_tokens_parentId_idx" ON "refresh_tokens"("parentId");

-- CreateIndex
CREATE INDEX "refresh_tokens_family_revokedAt_idx" ON "refresh_tokens"("family", "revokedAt");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
