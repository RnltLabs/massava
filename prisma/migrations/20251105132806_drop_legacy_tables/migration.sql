-- Drop Legacy Tables Migration
-- This migration removes all Phase 1 & 2 tables after Phase 3 migration is complete

-- Drop legacy bookings table (2 old records - already migrated to new_bookings)
DROP TABLE IF EXISTS "bookings" CASCADE;

-- Drop legacy customers table (empty)
DROP TABLE IF EXISTS "customers" CASCADE;

-- Drop legacy studio_owners table (empty)
DROP TABLE IF EXISTS "studio_owners" CASCADE;

-- Drop legacy NextAuth tables (replaced by new_accounts/new_sessions)
DROP TABLE IF EXISTS "accounts" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;

-- Verification Token table can stay (still used for password reset)
-- Email Verification Token table stays (still used)
