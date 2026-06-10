-- Add GDPR consent timestamp + IP to User
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "acceptedTermsAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "acceptedTermsIp" TEXT;
