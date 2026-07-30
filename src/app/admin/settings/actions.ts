"use server";

import { redirect } from "next/navigation";
import { assertAdminUser } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  invalidateSettingsCache,
  isLiveTranscriptionDelaySetting,
  isPaperReviewModelSetting,
  setSetting,
  setStringSetting,
  type SettingKey,
} from "@/lib/settings";

const KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

export async function saveSettingsAction(formData: FormData): Promise<void> {
  await assertAdminUser();
  for (const key of KEYS) {
    const raw = formData.get(key);
    if (raw == null) continue;
    const num = Number.parseFloat(String(raw));
    if (!Number.isFinite(num) || num < 0) continue;
    if (
      (key === "credits.marginMultiplier" ||
        key === "credits.usdPerCredit") &&
      num <= 0
    ) {
      continue;
    }
    if (
      key === "credits.liveTranscription" &&
      (!Number.isSafeInteger(num) || num < 1)
    ) {
      continue;
    }
    await setSetting(key, num);
  }

  const deepModel = String(
    formData.get("paperReview.deepModel") ?? "",
  ).trim();
  if (isPaperReviewModelSetting(deepModel)) {
    await setStringSetting("paperReview.deepModel", deepModel);
  }

  const criticModel = String(
    formData.get("paperReview.criticModel") ?? "",
  ).trim();
  if (isPaperReviewModelSetting(criticModel)) {
    await setStringSetting("paperReview.criticModel", criticModel);
  }

  const transcriptionDelay = String(
    formData.get("live.transcriptionDelay") ?? "",
  ).trim();
  if (isLiveTranscriptionDelaySetting(transcriptionDelay)) {
    await setStringSetting(
      "live.transcriptionDelay",
      transcriptionDelay,
    );
  }

  redirect("/admin/settings?saved=1");
}

export async function resetSettingsAction(): Promise<void> {
  await assertAdminUser();
  await prisma.appSetting.deleteMany({});
  invalidateSettingsCache();
  redirect("/admin/settings?reset=1");
}
