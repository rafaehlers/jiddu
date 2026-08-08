"use client";

import { useId, type ReactNode } from "react";
import { ThinkingOrb } from "thinking-orbs";

export function AnalysisLoadingDialog({
  detail,
  stage,
}: {
  detail: ReactNode;
  stage: string;
}) {
  const titleId = useId();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 px-6 backdrop-blur-[2px]"
    >
      <div
        role="status"
        aria-live="polite"
        className="flex w-full max-w-md flex-col items-center gap-5 rounded-lg border border-rule bg-paper px-8 py-8 text-center shadow-lg sm:gap-6 sm:px-12 sm:py-10"
      >
        <ThinkingOrb
          state="solving"
          size={64}
          theme="auto"
          aria-hidden="true"
        />

        <div className="flex min-h-[3.5rem] flex-col gap-1">
          <p
            id={titleId}
            className="font-serif text-xl transition-opacity duration-200 sm:text-2xl"
          >
            {stage}…
          </p>
          <p className="text-sm text-muted">{detail}</p>
        </div>
      </div>
    </div>
  );
}
