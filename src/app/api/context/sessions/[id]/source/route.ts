import { withAuth } from "@workos-inc/authkit-nextjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { normalizeCapturedSourceUrl } from "@/lib/live-source-context";

export const runtime = "nodejs";

const SourceSchema = z.object({
  sourceUrl: z.string().trim().max(2_048).nullable(),
});

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = SourceSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return Response.json({ error: "Invalid source payload." }, { status: 400 });
  }
  const sourceUrl = payload.data.sourceUrl
    ? normalizeCapturedSourceUrl(payload.data.sourceUrl)
    : null;
  if (payload.data.sourceUrl && !sourceUrl) {
    return Response.json({ error: "Invalid captured source URL." }, { status: 400 });
  }

  const { id } = await routeContext.params;
  const [analysis, factCheck] = await Promise.all([
    prisma.analysis.findFirst({
      where: { id, ownerWorkosUserId: user.id, source: "live" },
      select: { id: true },
    }),
    prisma.factCheck.findFirst({
      where: { id, ownerWorkosUserId: user.id },
      select: { verifyStatus: true },
    }),
  ]);
  if (!analysis) return Response.json({ error: "Not found" }, { status: 404 });
  if (factCheck?.verifyStatus === "running") {
    return Response.json(
      { error: "Wait for the current verification to finish." },
      { status: 409 },
    );
  }

  await prisma.$transaction([
    prisma.analysis.update({
      where: { id },
      data: { sourceRef: sourceUrl },
    }),
    prisma.factCheck.updateMany({
      where: { id, ownerWorkosUserId: user.id },
      data: {
        sourceRef: sourceUrl,
        verdicts: JSON.stringify([]),
        refreshCounts: JSON.stringify({}),
        verifyStatus: "none",
        verifyModel: null,
        verifyStartedAt: null,
        verifyFinishedAt: null,
        errorMessage: null,
      },
    }),
    prisma.neutrality.updateMany({
      where: { id, ownerWorkosUserId: user.id },
      data: { sourceRef: sourceUrl },
    }),
  ]);

  return Response.json({ sourceUrl, verdicts: [] });
}
