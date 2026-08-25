"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquareText } from "lucide-react";
import type { LiveContext } from "@/lib/live-context-schema";
import { useI18n } from "@/lib/i18n/provider";
import { ReportDeliveryActions } from "@/components/report-delivery-actions";
import { ReportTitle } from "@/components/report-title";
import { ShareLinkBar } from "@/components/share-link-bar";
import { LiveContextPanel } from "./context-panel";
import {
  TranscriptStream,
  type TranscriptStreamHandle,
} from "./transcript-stream";

type Props = {
  canEditTitle: boolean;
  canEmail: boolean;
  id: string;
  title: string;
  transcript: string;
  context: LiveContext;
  audioDurationMs: number | null;
};

export function LiveContextRecapView({
  canEditTitle,
  canEmail,
  id,
  title,
  transcript,
  context,
  audioDurationMs,
}: Props) {
  const { t } = useI18n();
  const transcriptRef = useRef<TranscriptStreamHandle>(null);
  const jump = useCallback((sentenceId: string) => {
    transcriptRef.current?.focusSentence(sentenceId);
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/live"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Jiddu Live
      </Link>
      <header className="mb-6">
        <ReportTitle
          canEdit={canEditTitle}
          className="font-serif text-3xl tracking-tight sm:text-4xl"
          fallback="Jiddu Live"
          id={id}
          kind="live"
          title={title}
        />
        {audioDurationMs ? (
          <p className="mt-2 text-sm text-muted">
            {formatDuration(audioDurationMs)}
          </p>
        ) : null}
      </header>

      <div className="mb-6">
        <ShareLinkBar
          rightSlot={
            <ReportDeliveryActions
              canEmail={canEmail}
              id={id}
              kind="live"
              printHref={`/live/${id}/print`}
            />
          }
        />
      </div>

      <section className="rounded-xl border border-rule bg-paper p-4 sm:p-5">
        <h2 className="flex items-center gap-2 font-serif text-2xl">
          <MessageSquareText
            aria-hidden="true"
            className="size-5 text-accent-hi"
          />
          {t.live_transcript_heading}
        </h2>
        <TranscriptStream
          ref={transcriptRef}
          transcript={transcript}
          variant="report"
          className="mt-4"
        />
      </section>

      <section className="mt-6">
        <LiveContextPanel
          context={context}
          active={false}
          concluded
          onJumpToSentence={jump}
        />
      </section>
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
