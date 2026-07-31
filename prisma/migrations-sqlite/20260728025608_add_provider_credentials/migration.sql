-- CreateTable
CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workosUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "connectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ProviderCredential_workosUserId_idx" ON "ProviderCredential"("workosUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCredential_workosUserId_provider_key" ON "ProviderCredential"("workosUserId", "provider");
