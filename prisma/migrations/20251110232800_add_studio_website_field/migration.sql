-- Add website column to studios table
-- This migration adds an optional website field for studio profiles

ALTER TABLE "studios" ADD COLUMN IF NOT EXISTS "website" TEXT;
