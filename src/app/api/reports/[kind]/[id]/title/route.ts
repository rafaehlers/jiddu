import { withAuth } from "@workos-inc/authkit-nextjs";
import {
  ReportTitleKindSchema,
  ReportTitleRequestSchema,
} from "@/lib/report-title-schema";
import { updateOwnedReportTitle } from "@/lib/report-title-server";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  routeContext: { params: Promise<{ id: string; kind: string }> },
) {
  const { user } = await withAuth();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const [payload, params] = await Promise.all([
    request.json().catch(() => null),
    routeContext.params,
  ]);
  const titleResult = ReportTitleRequestSchema.safeParse(payload);
  const kindResult = ReportTitleKindSchema.safeParse(params.kind);
  if (!titleResult.success || !kindResult.success) {
    return Response.json({ error: "Invalid report title." }, { status: 400 });
  }

  const updated = await updateOwnedReportTitle({
    id: params.id,
    kind: kindResult.data,
    ownerWorkosUserId: user.id,
    title: titleResult.data.title,
  });
  if (!updated) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ title: titleResult.data.title });
}
