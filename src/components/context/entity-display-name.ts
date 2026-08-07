import type { KnowledgeEntityDTO } from "@/lib/context-knowledge-schema";
import type { LiveContextEntity } from "@/lib/live-context-schema";

type EntityNameSource = Pick<LiveContextEntity, "name" | "userCorrectedName">;
type PublicNameSource = Pick<KnowledgeEntityDTO, "canonicalName"> | null;

export function resolveEntityDisplayName(
  entity: EntityNameSource,
  enriched: PublicNameSource,
): string {
  return entity.userCorrectedName
    ? entity.name
    : (enriched?.canonicalName ?? entity.name);
}

export function shouldPersistEntityName(
  requestedName: string,
  entity: EntityNameSource,
  enriched: PublicNameSource,
): boolean {
  const name = requestedName.trim();
  if (!name) return false;
  if (name !== entity.name) return true;
  if (entity.userCorrectedName) return false;

  const publicName = enriched?.canonicalName?.trim();
  return Boolean(
    publicName && normalizeName(publicName) !== normalizeName(name),
  );
}

function normalizeName(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase();
}
