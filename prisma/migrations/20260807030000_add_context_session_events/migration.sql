CREATE TABLE "ContextSessionEvent" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT,
    "kind" TEXT NOT NULL,
    "elapsedMs" INTEGER NOT NULL,
    "sentenceIds" TEXT NOT NULL DEFAULT '[]',
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContextSessionEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContextSessionEvent_analysisId_elapsedMs_createdAt_idx"
ON "ContextSessionEvent"("analysisId", "elapsedMs", "createdAt");

CREATE INDEX "ContextSessionEvent_ownerWorkosUserId_createdAt_idx"
ON "ContextSessionEvent"("ownerWorkosUserId", "createdAt");

ALTER TABLE "ContextSessionEvent"
ADD CONSTRAINT "ContextSessionEvent_analysisId_fkey"
FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
