-- CreateEnum
CREATE TYPE "TgLoginStatus" AS ENUM ('PENDING', 'READY', 'CONSUMED', 'EXPIRED');

-- CreateTable
CREATE TABLE "TgLoginToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "TgLoginStatus" NOT NULL DEFAULT 'PENDING',
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TgLoginToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TgLoginToken_token_key" ON "TgLoginToken"("token");

-- CreateIndex
CREATE INDEX "TgLoginToken_status_expiresAt_idx" ON "TgLoginToken"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "TgLoginToken" ADD CONSTRAINT "TgLoginToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
