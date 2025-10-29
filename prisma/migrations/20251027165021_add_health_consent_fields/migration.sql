-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "explicitHealthConsent" BOOLEAN DEFAULT false,
ADD COLUMN     "healthConsentGivenAt" TIMESTAMP(3),
ADD COLUMN     "healthConsentText" TEXT,
ADD COLUMN     "healthConsentWithdrawnAt" TIMESTAMP(3);
