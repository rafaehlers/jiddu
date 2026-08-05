-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "inviterWorkosUserId" TEXT NOT NULL,
    "inviterEmail" TEXT NOT NULL,
    "inviterName" TEXT,
    "inviteeEmail" TEXT NOT NULL,
    "message" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "tokenHash" TEXT NOT NULL,
    "rewardCredits" INTEGER NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'queued',
    "resendEmailId" TEXT,
    "lastDeliveryError" TEXT,
    "sentAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedByWorkosUserId" TEXT,
    "rewardTransactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_inviteeEmail_key" ON "Invitation"("inviteeEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_acceptedByWorkosUserId_key" ON "Invitation"("acceptedByWorkosUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_rewardTransactionId_key" ON "Invitation"("rewardTransactionId");

-- CreateIndex
CREATE INDEX "Invitation_inviterWorkosUserId_createdAt_idx" ON "Invitation"("inviterWorkosUserId", "createdAt");

-- CreateIndex
CREATE INDEX "Invitation_deliveryStatus_createdAt_idx" ON "Invitation"("deliveryStatus", "createdAt");

-- CreateIndex
CREATE INDEX "Invitation_expiresAt_acceptedAt_idx" ON "Invitation"("expiresAt", "acceptedAt");
