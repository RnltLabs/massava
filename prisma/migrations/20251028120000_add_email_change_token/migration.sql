-- CreateTable
CREATE TABLE IF NOT EXISTS "email_change_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "oldEmail" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "email_change_tokens_token_key" ON "email_change_tokens"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_change_tokens_userId_idx" ON "email_change_tokens"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_change_tokens_token_idx" ON "email_change_tokens"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "email_change_tokens_expiresAt_idx" ON "email_change_tokens"("expiresAt");
