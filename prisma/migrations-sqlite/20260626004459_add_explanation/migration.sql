-- CreateTable
CREATE TABLE "Explanation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'undergrad',
    "overview" TEXT,
    "blocks" TEXT NOT NULL DEFAULT '[]',
    "findings" TEXT NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "reviewedAt" DATETIME
);
