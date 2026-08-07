import { withAuth } from "@workos-inc/authkit-nextjs";
import {
  canReadKnowledgeEntity,
  getKnowledgeEntityDTO,
} from "@/lib/context-knowledge";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { user } = await withAuth();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  if (!(await canReadKnowledgeEntity(id, user.id))) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const entity = await getKnowledgeEntityDTO(id);
  if (!entity) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ entity });
}
