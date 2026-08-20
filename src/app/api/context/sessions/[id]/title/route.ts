import { withAuth } from "@workos-inc/authkit-nextjs";
import { ContextSessionTitleRequestSchema } from "@/lib/context-session-access";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const payload = ContextSessionTitleRequestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!payload.success) {
    return Response.json({ error: "Invalid session title." }, { status: 400 });
  }

  const { id } = await routeContext.params;
  const result = await prisma.analysis.updateMany({
    where: { id, ownerWorkosUserId: user.id, source: "live" },
    data: { title: payload.data.title },
  });
  if (result.count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ title: payload.data.title });
}
