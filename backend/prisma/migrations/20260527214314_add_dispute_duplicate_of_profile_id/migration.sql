-- AlterTable
ALTER TABLE "ProfileDispute" ADD COLUMN     "duplicateOfProfileId" TEXT;

-- CreateIndex
CREATE INDEX "ProfileDispute_duplicateOfProfileId_idx" ON "ProfileDispute"("duplicateOfProfileId");

-- AddForeignKey
ALTER TABLE "ProfileDispute" ADD CONSTRAINT "ProfileDispute_duplicateOfProfileId_fkey" FOREIGN KEY ("duplicateOfProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

