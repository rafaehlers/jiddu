"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "../auth";
import {
  DEFAULT_SETTINGS,
  invalidateSettingsCache,
  setSetting,
  type SettingKey,
} from "@/lib/settings";

async function assertAdmin(): Promise<void> {
  const jar = await cookies();
  if (!adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("Forbidden");
  }
}

const KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

export async function saveSettingsAction(formData: FormData): Promise<void> {
  await assertAdmin();
  for (const key of KEYS) {
    const raw = formData.get(key);
    if (raw == null) continue;
    const num = Number.parseFloat(String(raw));
    if (!Number.isFinite(num) || num < 0) continue;
    await setSetting(key, num);
  }
  redirect("/admin/settings?saved=1");
}

export async function resetSettingsAction(): Promise<void> {
  await assertAdmin();
  await prisma.appSetting.deleteMany({});
  invalidateSettingsCache();
  redirect("/admin/settings?reset=1");
}
