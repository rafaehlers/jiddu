import { handleAuth } from "@workos-inc/authkit-nextjs";
import { isWorkOSConfigured } from "@/lib/auth-config";

const authHandler = isWorkOSConfigured()
  ? handleAuth({ returnPathname: "/account" })
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
