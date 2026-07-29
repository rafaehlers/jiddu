import { handleAuth } from "@workos-inc/authkit-nextjs";
import { appBaseUrl, isWorkOSConfigured } from "@/lib/auth-config";

const authHandler = isWorkOSConfigured()
  ? handleAuth({
      returnPathname: "/account",
      // The container listens on 0.0.0.0:3000 behind the production proxy.
      // Pin callback redirects to the canonical public origin instead of
      // deriving their host from the container-facing request URL.
      baseURL: appBaseUrl(),
    })
  : null;

export async function GET(request: Parameters<ReturnType<typeof handleAuth>>[0]) {
  if (!authHandler) {
    return Response.json(
      { error: "WorkOS authentication is not configured." },
      { status: 503 },
    );
  }
  return authHandler(request);
}
