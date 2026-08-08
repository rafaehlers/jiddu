import { withAuth } from "@workos-inc/authkit-nextjs";
import { z } from "zod";
import { ClientContextReplayEventSchema } from "@/lib/context-replay-schema";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const EventBatchSchema = z.object({
  events: z.array(ClientContextReplayEventSchema).min(1).max(50),
});

export async function POST(
  request: Request,
  routeContext: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const payload = EventBatchSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return Response.json({ error: "Invalid event batch." }, { status: 400 });
  }

  const { id } = await routeContext.params;
  const analysis = await prisma.analysis.findFirst({
    where: { id, ownerWorkosUserId: user.id, source: "live" },
    select: { id: true },
  });
  if (!analysis) return Response.json({ error: "Not found" }, { status: 404 });

  const result = await prisma.contextSessionEvent.createMany({
    data: payload.data.events.map((event) => ({
      id: event.id,
      analysisId: analysis.id,
      ownerWorkosUserId: user.id,
      kind: event.kind,
      elapsedMs: event.elapsedMs,
      sentenceIds: JSON.stringify(event.sentenceIds),
      payload: JSON.stringify(event.payload),
      createdAt: new Date(event.createdAt),
    })),
    skipDuplicates: true,
  });

  return Response.json({ accepted: result.count });
}
