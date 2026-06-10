-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_ACCEPTED', 'RESOLVED_REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('WRONG_INFO', 'INAPPROPRIATE', 'OWNERSHIP_CLAIM', 'DUPLICATE', 'OTHER');

-- CreateEnum
CREATE TYPE "MergeStatus" AS ENUM ('PENDING_OWNERS', 'PENDING_ADMIN', 'APPROVED', 'EXECUTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LegacyContactStatus" AS ENUM ('PENDING', 'ACTIVE', 'TRIGGERED', 'TRANSFERRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "LegacyClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'DISPUTE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'DISPUTE_UPDATE_STATUS';
ALTER TYPE "AuditAction" ADD VALUE 'DISPUTE_RESOLVE';
ALTER TYPE "AuditAction" ADD VALUE 'DISPUTE_WITHDRAW';
ALTER TYPE "AuditAction" ADD VALUE 'MERGE_REQUEST_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'MERGE_REQUEST_OWNER_APPROVE';
ALTER TYPE "AuditAction" ADD VALUE 'MERGE_REQUEST_ADMIN_APPROVE';
ALTER TYPE "AuditAction" ADD VALUE 'MERGE_REQUEST_REJECT';
ALTER TYPE "AuditAction" ADD VALUE 'MERGE_REQUEST_EXECUTE';
ALTER TYPE "AuditAction" ADD VALUE 'MERGE_REQUEST_CANCEL';
ALTER TYPE "AuditAction" ADD VALUE 'LEGACY_CONTACT_SET';
ALTER TYPE "AuditAction" ADD VALUE 'LEGACY_CONTACT_INVITE_SEND';
ALTER TYPE "AuditAction" ADD VALUE 'LEGACY_CONTACT_INVITE_ACCEPT';
ALTER TYPE "AuditAction" ADD VALUE 'LEGACY_CONTACT_REVOKE';
ALTER TYPE "AuditAction" ADD VALUE 'LEGACY_CONTACT_TRIGGER';
ALTER TYPE "AuditAction" ADD VALUE 'LEGACY_CLAIM_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'LEGACY_CLAIM_APPROVE';
ALTER TYPE "AuditAction" ADD VALUE 'LEGACY_CLAIM_REJECT';
ALTER TYPE "AuditAction" ADD VALUE 'OWNERSHIP_TRANSFER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "legacyInactivityDays" INTEGER NOT NULL DEFAULT 90;

-- CreateTable
CREATE TABLE "ProfileDispute" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "DisputeReason" NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolverId" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "mergeRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileMergeRequest" (
    "id" TEXT NOT NULL,
    "sourceProfileId" TEXT NOT NULL,
    "targetProfileId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "MergeStatus" NOT NULL DEFAULT 'PENDING_OWNERS',
    "sourceOwnerApprovedAt" TIMESTAMP(3),
    "sourceOwnerApprovedBy" TEXT,
    "targetOwnerApprovedAt" TIMESTAMP(3),
    "targetOwnerApprovedBy" TEXT,
    "adminApprovedAt" TIMESTAMP(3),
    "adminApprovedBy" TEXT,
    "executedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileMergeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyContact" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "heirUserId" TEXT,
    "heirEmail" TEXT NOT NULL,
    "heirName" TEXT,
    "status" "LegacyContactStatus" NOT NULL DEFAULT 'PENDING',
    "inviteTokenHash" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "inviteSentAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "triggeredAt" TIMESTAMP(3),
    "inactivityDays" INTEGER NOT NULL DEFAULT 90,
    "message" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegacyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyClaim" (
    "id" TEXT NOT NULL,
    "legacyContactId" TEXT NOT NULL,
    "claimantId" TEXT NOT NULL,
    "status" "LegacyClaimStatus" NOT NULL DEFAULT 'PENDING',
    "evidence" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegacyClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfileDispute_mergeRequestId_key" ON "ProfileDispute"("mergeRequestId");

-- CreateIndex
CREATE INDEX "ProfileDispute_profileId_idx" ON "ProfileDispute"("profileId");

-- CreateIndex
CREATE INDEX "ProfileDispute_reporterId_idx" ON "ProfileDispute"("reporterId");

-- CreateIndex
CREATE INDEX "ProfileDispute_status_idx" ON "ProfileDispute"("status");

-- CreateIndex
CREATE INDEX "ProfileDispute_reason_idx" ON "ProfileDispute"("reason");

-- CreateIndex
CREATE INDEX "ProfileDispute_createdAt_idx" ON "ProfileDispute"("createdAt");

-- CreateIndex
CREATE INDEX "ProfileMergeRequest_sourceProfileId_idx" ON "ProfileMergeRequest"("sourceProfileId");

-- CreateIndex
CREATE INDEX "ProfileMergeRequest_targetProfileId_idx" ON "ProfileMergeRequest"("targetProfileId");

-- CreateIndex
CREATE INDEX "ProfileMergeRequest_requesterId_idx" ON "ProfileMergeRequest"("requesterId");

-- CreateIndex
CREATE INDEX "ProfileMergeRequest_status_idx" ON "ProfileMergeRequest"("status");

-- CreateIndex
CREATE INDEX "ProfileMergeRequest_createdAt_idx" ON "ProfileMergeRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyContact_ownerId_key" ON "LegacyContact"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "LegacyContact_inviteTokenHash_key" ON "LegacyContact"("inviteTokenHash");

-- CreateIndex
CREATE INDEX "LegacyContact_heirUserId_idx" ON "LegacyContact"("heirUserId");

-- CreateIndex
CREATE INDEX "LegacyContact_heirEmail_idx" ON "LegacyContact"("heirEmail");

-- CreateIndex
CREATE INDEX "LegacyContact_status_idx" ON "LegacyContact"("status");

-- CreateIndex
CREATE INDEX "LegacyContact_triggeredAt_idx" ON "LegacyContact"("triggeredAt");

-- CreateIndex
CREATE INDEX "LegacyClaim_legacyContactId_idx" ON "LegacyClaim"("legacyContactId");

-- CreateIndex
CREATE INDEX "LegacyClaim_claimantId_idx" ON "LegacyClaim"("claimantId");

-- CreateIndex
CREATE INDEX "LegacyClaim_status_idx" ON "LegacyClaim"("status");

-- CreateIndex
CREATE INDEX "LegacyClaim_expiresAt_idx" ON "LegacyClaim"("expiresAt");

-- AddForeignKey
ALTER TABLE "ProfileDispute" ADD CONSTRAINT "ProfileDispute_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileDispute" ADD CONSTRAINT "ProfileDispute_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileDispute" ADD CONSTRAINT "ProfileDispute_mergeRequestId_fkey" FOREIGN KEY ("mergeRequestId") REFERENCES "ProfileMergeRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMergeRequest" ADD CONSTRAINT "ProfileMergeRequest_sourceProfileId_fkey" FOREIGN KEY ("sourceProfileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMergeRequest" ADD CONSTRAINT "ProfileMergeRequest_targetProfileId_fkey" FOREIGN KEY ("targetProfileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileMergeRequest" ADD CONSTRAINT "ProfileMergeRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyContact" ADD CONSTRAINT "LegacyContact_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyContact" ADD CONSTRAINT "LegacyContact_heirUserId_fkey" FOREIGN KEY ("heirUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyClaim" ADD CONSTRAINT "LegacyClaim_legacyContactId_fkey" FOREIGN KEY ("legacyContactId") REFERENCES "LegacyContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyClaim" ADD CONSTRAINT "LegacyClaim_claimantId_fkey" FOREIGN KEY ("claimantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
