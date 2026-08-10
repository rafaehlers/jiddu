"use client";

import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  formatDiarizationTimestamp,
  groupDiarizedSegments,
  type SavedDiarization,
} from "@/lib/live/diarization";
import { findDiarizedTurnAtTime } from "@/lib/live/diarized-transcript-navigation";

type Props = {
  diarization: SavedDiarization;
};

export type SavedDiarizedTranscriptHandle = {
  focusTime: (seconds: number) => void;
};

export const SavedDiarizedTranscript = forwardRef<
  SavedDiarizedTranscriptHandle,
  Props
>(function SavedDiarizedTranscript({ diarization }, ref) {
    const { t } = useI18n();
    const highlightTimeoutRef = useRef<number | null>(null);
    const turnRefs = useRef(new Map<string, HTMLElement>());
    const [highlightedTurnKey, setHighlightedTurnKey] = useState<string | null>(
      null,
    );
    const turns = useMemo(
      () => groupDiarizedSegments(diarization.result.segments),
      [diarization.result.segments],
    );

    useEffect(
      () => () => {
        if (highlightTimeoutRef.current !== null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
      },
      [],
    );

    useImperativeHandle(ref, () => ({
      focusTime(seconds: number) {
        const turn = findDiarizedTurnAtTime(turns, seconds);
        if (!turn) return;
        const turnKey = diarizedTurnKey(turn.id, turn.start);
        turnRefs.current.get(turnKey)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        setHighlightedTurnKey(turnKey);
        if (highlightTimeoutRef.current !== null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(
          () => setHighlightedTurnKey(null),
          2_600,
        );
      },
    }));

    return (
      <div className="space-y-3">
        {turns.map((turn) => {
          const turnKey = diarizedTurnKey(turn.id, turn.start);
          return (
            <article
              key={turnKey}
              ref={(node) => {
                if (node) turnRefs.current.set(turnKey, node);
                else turnRefs.current.delete(turnKey);
              }}
              data-diarized-turn={turnKey}
              className={`rounded-lg border bg-background/70 px-3 py-3 transition-colors ${
                highlightedTurnKey === turnKey
                  ? "border-accent bg-accent/20 ring-2 ring-inset ring-accent"
                  : "border-rule"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                {formatDiarizationTimestamp(turn.start)} ·{" "}
                {diarization.speakerNames[turn.speaker] ||
                  `${t.live_speaker} ${turn.speaker}`}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {turn.text}
              </p>
            </article>
          );
        })}
      </div>
    );
  });

function diarizedTurnKey(id: string, start: number) {
  return `${id}-${start}`;
}

export function SavedDiarizedTranscriptPage({
  diarization,
  title,
}: {
  diarization: SavedDiarization;
  title: string;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/account?tab=analyses"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
      >
        <ArrowLeft className="size-4" />
        {t.live_diarization_history_back}
      </Link>
      <header className="mb-6">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
          <Users className="size-4" />
          {t.live_diarized_transcript}
        </p>
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">
          {title}
        </h1>
      </header>
      <section className="rounded-xl border border-rule bg-paper p-4 sm:p-5">
        <SavedDiarizedTranscript diarization={diarization} />
      </section>
    </div>
  );
}
