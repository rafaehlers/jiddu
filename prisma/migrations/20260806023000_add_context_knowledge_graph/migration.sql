-- CreateTable
CREATE TABLE "KnowledgeEntity" (
    "id" TEXT NOT NULL,
    "canonicalKey" TEXT NOT NULL,
    "canonicalName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "wikipediaUrl" TEXT,
    "wikidataId" TEXT,
    "profileLanguage" TEXT,
    "profileStatus" TEXT NOT NULL DEFAULT 'pending',
    "profileFetchedAt" TIMESTAMP(3),
    "profileExpiresAt" TIMESTAMP(3),
    "publiclyEnrichedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEntityAlias" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'und',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeEntityAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEntitySnapshot" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntitySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEntitySource" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "summary" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntitySource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRelation" (
    "id" TEXT NOT NULL,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'related_coverage',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "firstObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastObservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRelationSource" (
    "id" TEXT NOT NULL,
    "relationId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "summary" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeRelationSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEntityMention" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "localEntityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "sentenceIds" TEXT NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntityMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRelationMention" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "ownerWorkosUserId" TEXT NOT NULL,
    "relationId" TEXT,
    "sourceEntityId" TEXT NOT NULL,
    "targetEntityId" TEXT NOT NULL,
    "sourceLocalEntityId" TEXT NOT NULL,
    "targetLocalEntityId" TEXT NOT NULL,
    "localRelationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "normalizedLabel" TEXT NOT NULL,
    "sentenceIds" TEXT NOT NULL DEFAULT '[]',
    "confidence" DOUBLE PRECISION NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeRelationMention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEnrichmentJob" (
    "id" TEXT NOT NULL,
    "targetKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "entityId" TEXT,
    "relationId" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "runAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEnrichmentJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeEntity_canonicalKey_key" ON "KnowledgeEntity"("canonicalKey");
CREATE UNIQUE INDEX "KnowledgeEntity_wikidataId_key" ON "KnowledgeEntity"("wikidataId");
CREATE INDEX "KnowledgeEntity_type_canonicalName_idx" ON "KnowledgeEntity"("type", "canonicalName");
CREATE INDEX "KnowledgeEntity_profileExpiresAt_idx" ON "KnowledgeEntity"("profileExpiresAt");
CREATE INDEX "KnowledgeEntity_publiclyEnrichedAt_idx" ON "KnowledgeEntity"("publiclyEnrichedAt");
CREATE UNIQUE INDEX "KnowledgeEntityAlias_entityId_normalizedName_language_key" ON "KnowledgeEntityAlias"("entityId", "normalizedName", "language");
CREATE INDEX "KnowledgeEntityAlias_normalizedName_language_idx" ON "KnowledgeEntityAlias"("normalizedName", "language");
CREATE UNIQUE INDEX "KnowledgeSource_url_key" ON "KnowledgeSource"("url");
CREATE INDEX "KnowledgeSource_sourceType_retrievedAt_idx" ON "KnowledgeSource"("sourceType", "retrievedAt");
CREATE INDEX "KnowledgeSource_publishedAt_idx" ON "KnowledgeSource"("publishedAt");
CREATE UNIQUE INDEX "KnowledgeEntitySnapshot_entityId_sourceId_language_key" ON "KnowledgeEntitySnapshot"("entityId", "sourceId", "language");
CREATE INDEX "KnowledgeEntitySnapshot_entityId_expiresAt_idx" ON "KnowledgeEntitySnapshot"("entityId", "expiresAt");
CREATE UNIQUE INDEX "KnowledgeEntitySource_entityId_sourceId_key" ON "KnowledgeEntitySource"("entityId", "sourceId");
CREATE INDEX "KnowledgeEntitySource_entityId_expiresAt_idx" ON "KnowledgeEntitySource"("entityId", "expiresAt");
CREATE UNIQUE INDEX "KnowledgeRelation_sourceEntityId_targetEntityId_normalizedLabel_key" ON "KnowledgeRelation"("sourceEntityId", "targetEntityId", "normalizedLabel");
CREATE INDEX "KnowledgeRelation_sourceEntityId_lastObservedAt_idx" ON "KnowledgeRelation"("sourceEntityId", "lastObservedAt");
CREATE INDEX "KnowledgeRelation_targetEntityId_lastObservedAt_idx" ON "KnowledgeRelation"("targetEntityId", "lastObservedAt");
CREATE UNIQUE INDEX "KnowledgeRelationSource_relationId_sourceId_key" ON "KnowledgeRelationSource"("relationId", "sourceId");
CREATE INDEX "KnowledgeRelationSource_relationId_expiresAt_idx" ON "KnowledgeRelationSource"("relationId", "expiresAt");
CREATE UNIQUE INDEX "KnowledgeEntityMention_analysisId_entityId_key" ON "KnowledgeEntityMention"("analysisId", "entityId");
CREATE INDEX "KnowledgeEntityMention_analysisId_localEntityId_idx" ON "KnowledgeEntityMention"("analysisId", "localEntityId");
CREATE INDEX "KnowledgeEntityMention_ownerWorkosUserId_createdAt_idx" ON "KnowledgeEntityMention"("ownerWorkosUserId", "createdAt");
CREATE UNIQUE INDEX "KnowledgeRelationMention_analysisId_sourceEntityId_targetEntityId_normalizedLabel_key" ON "KnowledgeRelationMention"("analysisId", "sourceEntityId", "targetEntityId", "normalizedLabel");
CREATE INDEX "KnowledgeRelationMention_analysisId_localRelationId_idx" ON "KnowledgeRelationMention"("analysisId", "localRelationId");
CREATE INDEX "KnowledgeRelationMention_ownerWorkosUserId_createdAt_idx" ON "KnowledgeRelationMention"("ownerWorkosUserId", "createdAt");
CREATE UNIQUE INDEX "KnowledgeEnrichmentJob_targetKey_kind_key" ON "KnowledgeEnrichmentJob"("targetKey", "kind");
CREATE INDEX "KnowledgeEnrichmentJob_status_runAfter_idx" ON "KnowledgeEnrichmentJob"("status", "runAfter");

-- AddForeignKey
ALTER TABLE "KnowledgeEntityAlias" ADD CONSTRAINT "KnowledgeEntityAlias_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "KnowledgeEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeEntitySnapshot" ADD CONSTRAINT "KnowledgeEntitySnapshot_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "KnowledgeEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeEntitySnapshot" ADD CONSTRAINT "KnowledgeEntitySnapshot_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeEntitySource" ADD CONSTRAINT "KnowledgeEntitySource_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "KnowledgeEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeEntitySource" ADD CONSTRAINT "KnowledgeEntitySource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeRelation" ADD CONSTRAINT "KnowledgeRelation_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "KnowledgeEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeRelation" ADD CONSTRAINT "KnowledgeRelation_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "KnowledgeEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeRelationSource" ADD CONSTRAINT "KnowledgeRelationSource_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "KnowledgeRelation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeRelationSource" ADD CONSTRAINT "KnowledgeRelationSource_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "KnowledgeSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeEntityMention" ADD CONSTRAINT "KnowledgeEntityMention_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeEntityMention" ADD CONSTRAINT "KnowledgeEntityMention_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "KnowledgeEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeRelationMention" ADD CONSTRAINT "KnowledgeRelationMention_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeRelationMention" ADD CONSTRAINT "KnowledgeRelationMention_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "KnowledgeRelation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgeRelationMention" ADD CONSTRAINT "KnowledgeRelationMention_sourceEntityId_fkey" FOREIGN KEY ("sourceEntityId") REFERENCES "KnowledgeEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeRelationMention" ADD CONSTRAINT "KnowledgeRelationMention_targetEntityId_fkey" FOREIGN KEY ("targetEntityId") REFERENCES "KnowledgeEntity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeEnrichmentJob" ADD CONSTRAINT "KnowledgeEnrichmentJob_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "KnowledgeEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgeEnrichmentJob" ADD CONSTRAINT "KnowledgeEnrichmentJob_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "KnowledgeRelation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
