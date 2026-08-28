CREATE TABLE "ResultIdReservation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResultIdReservation_pkey" PRIMARY KEY ("id")
);

-- Preserve every existing public identifier in the global namespace. This
-- keeps legacy links valid and prevents a deleted URL from being reassigned.
INSERT INTO "ResultIdReservation" ("id")
SELECT "id" FROM "Analysis"
UNION
SELECT "id" FROM "FactCheck"
UNION
SELECT "id" FROM "Neutrality"
UNION
SELECT "id" FROM "Explanation"
UNION
SELECT "id" FROM "SlopCheck"
UNION
SELECT "id" FROM "PaperReview"
ON CONFLICT ("id") DO NOTHING;
