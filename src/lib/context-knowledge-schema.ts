import { z } from "zod";
import {
  LiveContextEntitySchema,
  LiveContextRelationSchema,
} from "./live-context-schema";

export const ContextLanguageSchema = z.enum(["en", "pt", "es"]);

export const ContextEntityEnrichmentRequestSchema = z.object({
  sessionId: z.string().trim().min(1),
  language: ContextLanguageSchema,
  entity: LiveContextEntitySchema,
});

export const ContextNewsRequestSchema = z.discriminatedUnion("target", [
  z.object({
    target: z.literal("entity"),
    sessionId: z.string().trim().min(1),
    language: ContextLanguageSchema,
    entity: LiveContextEntitySchema,
  }),
  z.object({
    target: z.literal("relation"),
    sessionId: z.string().trim().min(1),
    language: ContextLanguageSchema,
    relation: LiveContextRelationSchema,
    sourceEntity: LiveContextEntitySchema,
    targetEntity: LiveContextEntitySchema,
  }),
]);

export type KnowledgeSourceDTO = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  sourceType: string;
  publishedAt: string | null;
  retrievedAt: string;
  summary: string | null;
};

export type KnowledgeEntityDTO = {
  id: string;
  canonicalName: string;
  type: string;
  description: string | null;
  imageUrl: string | null;
  wikipediaUrl: string | null;
  wikidataId: string | null;
  profileLanguage: string | null;
  profileStatus: string;
  profileFetchedAt: string | null;
  profileExpiresAt: string | null;
  publiclyEnriched: boolean;
  stale: boolean;
  aliases: string[];
  sources: KnowledgeSourceDTO[];
};

export type KnowledgeRelationDTO = {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  label: string;
  description: string | null;
  status: string;
  confidence: number;
  sources: KnowledgeSourceDTO[];
};
