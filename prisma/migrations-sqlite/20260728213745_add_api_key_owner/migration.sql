-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN "ownerEmail" TEXT;
ALTER TABLE "ApiKey" ADD COLUMN "ownerWorkosUserId" TEXT;

-- CreateIndex
CREATE INDEX "ApiKey_ownerWorkosUserId_idx" ON "ApiKey"("ownerWorkosUserId");

-- CreateIndex
CREATE INDEX "ApiKey_ownerEmail_idx" ON "ApiKey"("ownerEmail");
