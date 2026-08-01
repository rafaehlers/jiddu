"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type { LiveClaimVerification } from "@/lib/live/use-live-claim-verification";

type Props = Pick<
  LiveClaimVerification,
  "status" | "progress" | "error" | "start"
>;

export function LiveClaimVerificationPanel({
  status,
  progress,
  error,
  start,
}: Props) {
  const { t } = useI18n();
  const running = status === "running";

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-col gap-3 rounded-lg border border-rule bg-paper p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-start gap-2">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-muted" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{t.fc_verify_panel_title}</p>
            <p className="text-xs leading-snug text-muted">
              {t.fc_verify_panel_desc}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 self-start sm:self-auto">
          {running ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted">
              <Loader2 className="size-3.5 animate-spin" />
              {progress.done}/{progress.total}
            </span>
          ) : null}
          {!running ? (
            <button
              type="button"
              onClick={() => void start()}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {status === "complete" || status === "failed"
                ? t.fc_reverify_button
                : t.fc_verify_button}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
