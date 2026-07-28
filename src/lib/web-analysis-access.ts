import "server-only";

import { withAuth } from "@workos-inc/authkit-nextjs";
import { effectiveAnalysisAccessMode } from "@/lib/analysis-access";
import { isWorkOSConfigured } from "@/lib/auth-config";
import { hasAvailableJidduCredits } from "@/lib/jiddu-credits";

export type WebAnalysisAccess = {
  apiKey?: string;
  userId?: string;
  email?: string;
  billing: "platform" | "jiddu";
};

export async function requireWebAnalysisAccess(): Promise<
  WebAnalysisAccess | Response
> {
  if (!isWorkOSConfigured()) {
    return jsonError(
      "Analysis access is not configured on this deployment.",
      503,
      "access_not_configured",
    );
  }

  const { user } = await withAuth();
  if (!user) {
    return jsonError(
      "Sign in to run an analysis.",
      401,
      "authentication_required",
    );
  }

  if ((await effectiveAnalysisAccessMode(user)) === "platform") {
    if (!process.env.OPENROUTER_API_KEY) {
      return jsonError(
        "Platform analysis access is temporarily unavailable.",
        503,
        "platform_key_unavailable",
      );
    }
    return {
      userId: user.id,
      email: user.email,
      billing: "platform",
    };
  }

  if (
    process.env.OPENROUTER_API_KEY &&
    (await hasAvailableJidduCredits(user.id))
  ) {
    return {
      userId: user.id,
      email: user.email,
      billing: "jiddu",
    };
  }

  return jsonError(
    "Jiddu credits are required to run this analysis.",
    402,
    "jiddu_credits_required",
  );
}

export function isAccessResponse(
  value: WebAnalysisAccess | Response,
): value is Response {
  return value instanceof Response;
}

function jsonError(error: string, status: number, code: string): Response {
  return Response.json({ error, code }, { status });
}
