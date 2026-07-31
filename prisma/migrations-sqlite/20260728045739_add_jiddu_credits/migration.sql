-- CreateTable
CREATE TABLE "JidduCreditAccount" (
    "workosUserId" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JidduCreditTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JidduCreditTransaction_workosUserId_fkey" FOREIGN KEY ("workosUserId") REFERENCES "JidduCreditAccount" ("workosUserId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JidduCreditReservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workosUserId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "actualAmount" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "feature" TEXT NOT NULL,
    "resourceId" TEXT,
    "rateVersion" TEXT NOT NULL,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "settledAt" DATETIME,
    CONSTRAINT "JidduCreditReservation_workosUserId_fkey" FOREIGN KEY ("workosUserId") REFERENCES "JidduCreditAccount" ("workosUserId") ON DELETE CASCADE ON UPDATE CASCADE
);

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
