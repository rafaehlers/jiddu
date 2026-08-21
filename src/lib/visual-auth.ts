import "server-only";

import { withAuth } from "@workos-inc/authkit-nextjs";
import type { User } from "@workos-inc/node";
import { notFound, redirect } from "next/navigation";
import { isVisualOwnerIdentity } from "@/lib/visual-access";

export async function requireVisualPage(): Promise<User> {
  const { user } = await withAuth();
  if (!user) redirect("/login?returnTo=/visual");
  if (!isVisualOwnerIdentity(user)) notFound();
  return user;
}
