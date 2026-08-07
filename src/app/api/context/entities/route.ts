import { withAuth } from "@workos-inc/authkit-nextjs";
import { after } from "next/server";
import { ContextEntityEnrichmentRequestSchema } from "@/lib/context-knowledge-schema";
import { correctedProfileNeedsRefresh } from "@/lib/context-knowledge-cache";
import {
  assertOwnedContextSession,
  getKnowledgeEntityDTO,
  queueKnowledgeEntityProfile,
  runKnowledgeEntityProfileJob,
  upsertKnowledgeEntityFromLive,
  upsertKnowledgeEntityMention,
} from "@/lib/context-knowledge";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const { user } = await withAuth();
  if (!user) {
    return Response.json(
      { error: "Sign in to enrich context entities." },
      { status: 401 },
    );
  }

  const body = ContextEntityEnrichmentRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!body.success) {
    return Response.json({ error: "Invalid entity payload." }, { status: 400 });
  }
  const session = await assertOwnedContextSession(body.data.sessionId, user.id);
  if (!session) return Response.json({ error: "Not found" }, { status: 404 });

  const stored = await upsertKnowledgeEntityFromLive(body.data.entity);
  await upsertKnowledgeEntityMention({
    analysisId: session.id,
    ownerWorkosUserId: user.id,
    storedEntityId: stored.id,
    entity: body.data.entity,
  });
  let entity = await getKnowledgeEntityDTO(stored.id);
  if (!entity) {
    return Response.json(
      { error: "Could not create entity." },
      { status: 500 },
    );
  }

  let refreshScheduled = false;
  const correctedRefresh = correctedProfileNeedsRefresh(
    body.data.entity.userCorrectedAt,
    entity.profileFetchedAt,
  );
  if (entity.stale || correctedRefresh) {
    const jobId = await queueKnowledgeEntityProfile(entity.id, {
      force: correctedRefresh,
    });
    refreshScheduled = true;
    after(() =>
      runKnowledgeEntityProfileJob(
        jobId,
        body.data.language,
        body.data.entity.userCorrectedName ? body.data.entity.name : undefined,
      ),
    );
    if (correctedRefresh) {
      entity = (await getKnowledgeEntityDTO(stored.id)) ?? entity;
    }
  }

  return Response.json({ entity, refreshScheduled });
}
