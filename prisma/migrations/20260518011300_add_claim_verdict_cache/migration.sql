-- CreateTable
CREATE TABLE "ClaimVerdict" (
    "hash" TEXT NOT NULL PRIMARY KEY,
    "statement" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "rationale" TEXT NOT NULL,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "verifyModel" TEXT NOT NULL,
    "cachedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "ClaimVerdict_expiresAt_idx" ON "ClaimVerdict"("expiresAt");
