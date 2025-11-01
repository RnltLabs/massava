-- Migration: Remove legacy Studio.ownerId relation to StudioOwner
-- Now using User -> StudioOwnership -> Studio for ownership tracking

-- Step 1: Migrate existing studio_owners to users table (if not already migrated)
-- This creates User records for any StudioOwner that doesn't have a corresponding User
INSERT INTO users (id, email, "emailVerified", password, name, image, "primaryRole", "isActive", "isSuspended", "createdAt", "updatedAt")
SELECT
  so.id,
  so.email,
  so."emailVerified",
  so.password,
  so.name,
  so.image,
  'STUDIO_OWNER'::"UserRole",
  true,
  false,
  so."createdAt",
  so."updatedAt"
FROM studio_owners so
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.email = so.email
)
ON CONFLICT (email) DO NOTHING;

-- Step 2: Create StudioOwnership records for existing studios
-- Maps old ownerId to new User-based ownership
INSERT INTO studio_ownership ("userId", "studioId", "isPrimary", "canTransfer", "invitedAt")
SELECT
  u.id as "userId",
  s.id as "studioId",
  true as "isPrimary",
  true as "canTransfer",
  NOW() as "invitedAt"
FROM studios s
JOIN studio_owners so ON s."ownerId" = so.id
JOIN users u ON u.email = so.email
WHERE s."ownerId" IS NOT NULL
ON CONFLICT ("userId", "studioId") DO NOTHING;

-- Step 3: Drop the foreign key constraint first
ALTER TABLE "studios" DROP CONSTRAINT IF EXISTS "studios_ownerId_fkey";

-- Step 4: Drop the ownerId column
ALTER TABLE "studios" DROP COLUMN IF EXISTS "ownerId";

-- Step 5: Drop the ownerId index (if it exists)
DROP INDEX IF EXISTS "studios_ownerId_idx";
