import { JIDDU_OPENAPI } from "@/lib/openapi";

export const dynamic = "force-static";

export function GET() {
  return Response.json(JIDDU_OPENAPI, {
    headers: {
      "cache-control": "public, max-age=300",
    },
  });
}
