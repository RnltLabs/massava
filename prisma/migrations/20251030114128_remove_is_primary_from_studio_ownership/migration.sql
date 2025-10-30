-- AlterTable: Remove isPrimary column from studio_ownership
-- YAGNI: isPrimary was unused in business logic, removed for simplicity
ALTER TABLE "studio_ownership" DROP COLUMN "isPrimary";
