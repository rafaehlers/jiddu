import { signOut } from "@workos-inc/authkit-nextjs";
import { appBaseUrl, isWorkOSConfigured } from "@/lib/auth-config";

export async function GET(request: Request) {
  if (!isWorkOSConfigured()) {
    return Response.redirect(
      new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    );
  }
  await signOut({ returnTo: appBaseUrl(request.url) });
}
