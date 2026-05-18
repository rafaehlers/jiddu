-- CreateTable
CREATE TABLE "FactCheck" (
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
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);
