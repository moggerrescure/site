-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
  'LOGIN', 'LOGIN_FAILED', 'LOGOUT',
  'PROFILE_CREATE', 'PROFILE_UPDATE',
  'PROFILE_SOFT_DELETE', 'PROFILE_RESTORE', 'PROFILE_HARD_DELETE',
  'TREE_CREATE', 'TREE_DELETE',
  'USER_ROLE_CHANGE',
  'ACCESS_CODE_GENERATE', 'ACCESS_CODE_REDEEM'
);

-- CreateTable
CREATE TABLE "AuditLog" (
  "id"         TEXT PRIMARY KEY,
  "action"     "AuditAction" NOT NULL,
  "userId"     TEXT,
  "entityType" TEXT,
  "entityId"   TEXT,
  "oldValue"   JSONB,
  "newValue"   JSONB,
  "metadata"   JSONB,
  "ipAddress"  TEXT,
  "userAgent"  TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- FK
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "AuditLog_userId_createdAt_idx"      ON "AuditLog"("userId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx"   ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_action_createdAt_idx"      ON "AuditLog"("action", "createdAt");
CREATE INDEX "AuditLog_createdAt_idx"             ON "AuditLog"("createdAt");
