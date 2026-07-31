-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "sentences" TEXT NOT NULL DEFAULT '[]',
    "findings" TEXT NOT NULL DEFAULT '[]',
    "transcript" TEXT,
    "audioDurationMs" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT,
    "ownerEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "rateCapacity" INTEGER,
    "ratePerHour" INTEGER,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderCredential" (
    "id" TEXT NOT NULL,
    "workosUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "encryptedSecret" TEXT NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAccessGrant" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JidduCreditAccount" (
    "workosUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JidduCreditAccount_pkey" PRIMARY KEY ("workosUserId")
);

-- CreateTable
CREATE TABLE "JidduCreditTransaction" (
    "id" TEXT NOT NULL,
    "workosUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "feature" TEXT,
    "resourceId" TEXT,
    "rateVersion" TEXT,
    "note" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "actorWorkosUserId" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "reasoningTokens" INTEGER,
    "cachedTokens" INTEGER,
    "providerCostMicros" INTEGER,
    "billedCostMicros" INTEGER,
    "marginMultiplier" DOUBLE PRECISION,
    "usdPerCredit" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JidduCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JidduCreditReservation" (
    "id" TEXT NOT NULL,
    "workosUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "actualAmount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feature" TEXT NOT NULL,
    "resourceId" TEXT,
    "rateVersion" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "JidduCreditReservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JidduCreditPackage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JidduCreditPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeCreditPurchase" (
    "id" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePriceId" TEXT NOT NULL,
    "workosUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "packageId" TEXT,
    "packageName" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "livemode" BOOLEAN NOT NULL,
    "fulfilledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeCreditPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlopCheck" (
    "id" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "summary" TEXT,
    "sentences" TEXT NOT NULL DEFAULT '[]',
    "findings" TEXT NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SlopCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Neutrality" (
    "id" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "textType" TEXT,
    "verdict" TEXT NOT NULL DEFAULT 'pending',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rationale" TEXT,
    "sentences" TEXT NOT NULL DEFAULT '[]',
    "findings" TEXT NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Neutrality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Explanation" (
    "id" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "Explanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaperReview" (
    "id" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stage" TEXT NOT NULL DEFAULT 'ingest',
    "source" TEXT NOT NULL DEFAULT 'pdf',
    "sourceRef" TEXT,
    "title" TEXT,
    "author" TEXT,
    "venueTarget" TEXT NOT NULL,
    "venueProfile" TEXT,
    "reviewDate" TEXT NOT NULL,
    "language" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "reviewDepth" TEXT NOT NULL DEFAULT 'standard',
    "parser" TEXT,
    "text" TEXT NOT NULL,
    "pages" TEXT NOT NULL DEFAULT '[]',
    "complexity" TEXT NOT NULL DEFAULT '[]',
    "ledger" TEXT,
    "research" TEXT,
    "specsReviews" TEXT,
    "computationAudit" TEXT,
    "initialReview" TEXT,
    "sourceAudit" TEXT,
    "qualityAudit" TEXT,
    "retentionAudit" TEXT,
    "review" TEXT,
    "markdown" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "PaperReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerdictFeedback" (
    "id" TEXT NOT NULL,
    "factCheckId" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "verdictSnapshot" TEXT NOT NULL,
    "userReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "ip" TEXT,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "VerdictFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClaimVerdict" (
    "hash" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rationale" TEXT NOT NULL,
    "sources" TEXT NOT NULL DEFAULT '[]',
    "verifyModel" TEXT NOT NULL,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClaimVerdict_pkey" PRIMARY KEY ("hash")
);

-- CreateTable
CREATE TABLE "FactCheck" (
    "id" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT,
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
    "refreshCounts" TEXT NOT NULL DEFAULT '{}',
    "verifyStatus" TEXT NOT NULL DEFAULT 'none',
    "verifyModel" TEXT,
    "verifyStartedAt" TIMESTAMP(3),
    "verifyFinishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "FactCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Analysis_ownerWorkosUserId_createdAt_idx" ON "Analysis"("ownerWorkosUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_keyHash_idx" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_revokedAt_idx" ON "ApiKey"("revokedAt");

-- CreateIndex
CREATE INDEX "ApiKey_ownerWorkosUserId_idx" ON "ApiKey"("ownerWorkosUserId");

-- CreateIndex
CREATE INDEX "ApiKey_ownerEmail_idx" ON "ApiKey"("ownerEmail");

-- CreateIndex
CREATE INDEX "ProviderCredential_workosUserId_idx" ON "ProviderCredential"("workosUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderCredential_workosUserId_provider_key" ON "ProviderCredential"("workosUserId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccessGrant_email_key" ON "PlatformAccessGrant"("email");

-- CreateIndex
CREATE INDEX "PlatformAccessGrant_email_idx" ON "PlatformAccessGrant"("email");

-- CreateIndex
CREATE INDEX "JidduCreditAccount_email_idx" ON "JidduCreditAccount"("email");

-- CreateIndex
CREATE INDEX "JidduCreditAccount_updatedAt_idx" ON "JidduCreditAccount"("updatedAt");

-- CreateIndex
CREATE INDEX "JidduCreditTransaction_workosUserId_createdAt_idx" ON "JidduCreditTransaction"("workosUserId", "createdAt");

-- CreateIndex
CREATE INDEX "JidduCreditTransaction_kind_createdAt_idx" ON "JidduCreditTransaction"("kind", "createdAt");

-- CreateIndex
CREATE INDEX "JidduCreditTransaction_resourceId_idx" ON "JidduCreditTransaction"("resourceId");

-- CreateIndex
CREATE INDEX "JidduCreditReservation_workosUserId_status_idx" ON "JidduCreditReservation"("workosUserId", "status");

-- CreateIndex
CREATE INDEX "JidduCreditReservation_expiresAt_status_idx" ON "JidduCreditReservation"("expiresAt", "status");

-- CreateIndex
CREATE INDEX "JidduCreditReservation_resourceId_idx" ON "JidduCreditReservation"("resourceId");

-- CreateIndex
CREATE INDEX "JidduCreditPackage_active_sortOrder_idx" ON "JidduCreditPackage"("active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCreditPurchase_stripeCheckoutSessionId_key" ON "StripeCreditPurchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCreditPurchase_stripePaymentIntentId_key" ON "StripeCreditPurchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "StripeCreditPurchase_workosUserId_createdAt_idx" ON "StripeCreditPurchase"("workosUserId", "createdAt");

-- CreateIndex
CREATE INDEX "StripeCreditPurchase_fulfilledAt_idx" ON "StripeCreditPurchase"("fulfilledAt");

-- CreateIndex
CREATE INDEX "SlopCheck_ownerWorkosUserId_createdAt_idx" ON "SlopCheck"("ownerWorkosUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Neutrality_ownerWorkosUserId_createdAt_idx" ON "Neutrality"("ownerWorkosUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Explanation_ownerWorkosUserId_createdAt_idx" ON "Explanation"("ownerWorkosUserId", "createdAt");

-- CreateIndex
CREATE INDEX "PaperReview_ownerWorkosUserId_createdAt_idx" ON "PaperReview"("ownerWorkosUserId", "createdAt");

-- CreateIndex
CREATE INDEX "VerdictFeedback_status_createdAt_idx" ON "VerdictFeedback"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VerdictFeedback_factCheckId_idx" ON "VerdictFeedback"("factCheckId");

-- CreateIndex
CREATE INDEX "ClaimVerdict_expiresAt_idx" ON "ClaimVerdict"("expiresAt");

-- CreateIndex
CREATE INDEX "FactCheck_ownerWorkosUserId_createdAt_idx" ON "FactCheck"("ownerWorkosUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "JidduCreditTransaction" ADD CONSTRAINT "JidduCreditTransaction_workosUserId_fkey" FOREIGN KEY ("workosUserId") REFERENCES "JidduCreditAccount"("workosUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JidduCreditReservation" ADD CONSTRAINT "JidduCreditReservation_workosUserId_fkey" FOREIGN KEY ("workosUserId") REFERENCES "JidduCreditAccount"("workosUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeCreditPurchase" ADD CONSTRAINT "StripeCreditPurchase_workosUserId_fkey" FOREIGN KEY ("workosUserId") REFERENCES "JidduCreditAccount"("workosUserId") ON DELETE CASCADE ON UPDATE CASCADE;
