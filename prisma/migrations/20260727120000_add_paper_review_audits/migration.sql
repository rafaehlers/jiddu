ALTER TABLE "PaperReview" ADD COLUMN "reviewDepth" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "PaperReview" ADD COLUMN "specsReviews" TEXT;
ALTER TABLE "PaperReview" ADD COLUMN "computationAudit" TEXT;
ALTER TABLE "PaperReview" ADD COLUMN "sourceAudit" TEXT;
ALTER TABLE "PaperReview" ADD COLUMN "qualityAudit" TEXT;
ALTER TABLE "PaperReview" ADD COLUMN "retentionAudit" TEXT;
