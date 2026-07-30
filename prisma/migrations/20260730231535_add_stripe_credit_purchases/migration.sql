-- CreateTable
CREATE TABLE "StripeCreditPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "fulfilledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StripeCreditPurchase_workosUserId_fkey" FOREIGN KEY ("workosUserId") REFERENCES "JidduCreditAccount" ("workosUserId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "StripeCreditPurchase_stripeCheckoutSessionId_key" ON "StripeCreditPurchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCreditPurchase_stripePaymentIntentId_key" ON "StripeCreditPurchase"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "StripeCreditPurchase_workosUserId_createdAt_idx" ON "StripeCreditPurchase"("workosUserId", "createdAt");

-- CreateIndex
CREATE INDEX "StripeCreditPurchase_fulfilledAt_idx" ON "StripeCreditPurchase"("fulfilledAt");
