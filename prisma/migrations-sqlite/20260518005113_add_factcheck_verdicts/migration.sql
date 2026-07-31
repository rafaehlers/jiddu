-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FactCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "sentences" TEXT NOT NULL DEFAULT '[]',
    "claims" TEXT NOT NULL DEFAULT '[]',
    "verdicts" TEXT NOT NULL DEFAULT '[]',
    "verifyStatus" TEXT NOT NULL DEFAULT 'none',
    "verifyModel" TEXT,
    "verifyStartedAt" DATETIME,
    "verifyFinishedAt" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);
INSERT INTO "new_FactCheck" ("claims", "createdAt", "errorMessage", "finishedAt", "id", "language", "model", "provider", "sentences", "source", "sourceRef", "status", "text", "title") SELECT "claims", "createdAt", "errorMessage", "finishedAt", "id", "language", "model", "provider", "sentences", "source", "sourceRef", "status", "text", "title" FROM "FactCheck";
DROP TABLE "FactCheck";
ALTER TABLE "new_FactCheck" RENAME TO "FactCheck";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
