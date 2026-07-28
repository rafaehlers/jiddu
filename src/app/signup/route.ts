import { getSignUpUrl } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { isWorkOSConfigured } from "@/lib/auth-config";

export async function GET(request: Request) {
  if (!isWorkOSConfigured()) {
    return Response.json(
      { error: "WorkOS authentication is not configured." },
      { status: 503 },
    );
  }

  const requested = new URL(request.url).searchParams.get("returnTo");
  const returnTo =
    requested?.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/account";

  redirect(await getSignUpUrl({ returnTo }));
}
