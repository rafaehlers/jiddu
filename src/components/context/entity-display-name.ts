import type { KnowledgeEntityDTO } from "@/lib/context-knowledge-schema";
import { isPublicProfileCompatible } from "@/lib/context-profile-match";
import type { LiveContextEntity } from "@/lib/live-context-schema";

type EntityNameSource = Pick<
  LiveContextEntity,
  "name" | "aliases" | "description" | "kind" | "userCorrectedName"
>;
type PublicNameSource =
  | (Pick<KnowledgeEntityDTO, "canonicalName"> &
      Partial<Pick<KnowledgeEntityDTO, "description">>)
  | null;

export function resolveEntityDisplayName(
  entity: EntityNameSource,
  enriched: PublicNameSource,
): string {
  if (entity.userCorrectedName || !enriched) return entity.name;
  return isPublicProfileCompatible(entity, enriched)
    ? enriched.canonicalName
    : entity.name;
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
