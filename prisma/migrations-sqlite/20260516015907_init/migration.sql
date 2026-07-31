-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "summary" TEXT,
    "sentences" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
