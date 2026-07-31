-- CreateTable
CREATE TABLE "VerdictFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "factCheckId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "verdictSnapshot" TEXT NOT NULL,
    "userReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "ip" TEXT,
    "resolutionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateIndex
CREATE INDEX "VerdictFeedback_status_createdAt_idx" ON "VerdictFeedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VerdictFeedback_factCheckId_idx" ON "VerdictFeedback"("factCheckId");
