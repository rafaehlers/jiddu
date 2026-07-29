"use server";

import { signOut } from "@workos-inc/authkit-nextjs";
import { redirect } from "next/navigation";
import { appBaseUrl, isWorkOSConfigured } from "@/lib/auth-config";

export async function signOutAction() {
  if (!isWorkOSConfigured()) {
    redirect(appBaseUrl());
  }

  await signOut({ returnTo: appBaseUrl() });
}
