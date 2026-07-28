-- CreateTable
CREATE TABLE "PlatformAccessGrant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccessGrant_email_key" ON "PlatformAccessGrant"("email");

-- CreateIndex
CREATE INDEX "PlatformAccessGrant_email_idx" ON "PlatformAccessGrant"("email");
