-- Add fields for historical timeline events
ALTER TABLE "TimelineEvent" ADD COLUMN "iconKey" TEXT;
ALTER TABLE "TimelineEvent" ADD COLUMN "createdById" TEXT;
ALTER TABLE "TimelineEvent" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Indexes for new columns
CREATE INDEX "TimelineEvent_createdById_idx" ON "TimelineEvent"("createdById");
CREATE INDEX "TimelineEvent_deletedAt_idx" ON "TimelineEvent"("deletedAt");

-- FK: who created the event (admin user); SET NULL on user delete to preserve event
ALTER TABLE "TimelineEvent"
  ADD CONSTRAINT "TimelineEvent_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
