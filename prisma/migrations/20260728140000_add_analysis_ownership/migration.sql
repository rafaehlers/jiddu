ALTER TABLE "Analysis" ADD COLUMN "ownerWorkosUserId" TEXT;
ALTER TABLE "FactCheck" ADD COLUMN "ownerWorkosUserId" TEXT;
ALTER TABLE "Neutrality" ADD COLUMN "ownerWorkosUserId" TEXT;
ALTER TABLE "Explanation" ADD COLUMN "ownerWorkosUserId" TEXT;
ALTER TABLE "SlopCheck" ADD COLUMN "ownerWorkosUserId" TEXT;
ALTER TABLE "PaperReview" ADD COLUMN "ownerWorkosUserId" TEXT;

CREATE INDEX "Analysis_ownerWorkosUserId_createdAt_idx"
ON "Analysis"("ownerWorkosUserId", "createdAt");

CREATE INDEX "FactCheck_ownerWorkosUserId_createdAt_idx"
ON "FactCheck"("ownerWorkosUserId", "createdAt");

CREATE INDEX "Neutrality_ownerWorkosUserId_createdAt_idx"
ON "Neutrality"("ownerWorkosUserId", "createdAt");

CREATE INDEX "Explanation_ownerWorkosUserId_createdAt_idx"
ON "Explanation"("ownerWorkosUserId", "createdAt");

CREATE INDEX "SlopCheck_ownerWorkosUserId_createdAt_idx"
ON "SlopCheck"("ownerWorkosUserId", "createdAt");

CREATE INDEX "PaperReview_ownerWorkosUserId_createdAt_idx"
ON "PaperReview"("ownerWorkosUserId", "createdAt");
