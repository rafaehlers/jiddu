"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/lib/i18n/provider";
import { splitSentences } from "@/lib/sentences";

type Props = {
  transcript: string;
  /** Pulse the cursor while audio is being captured. */
  active?: boolean;
  className?: string;
  variant?: "live" | "report" | "workspace" | "feed";
};

export type TranscriptStreamHandle = {
  focusSentence: (sentenceId: string) => void;
};

export const TranscriptStream = forwardRef<TranscriptStreamHandle, Props>(
  function TranscriptStream(
    { transcript, active, className, variant = "live" },
    ref,
  ) {
    const { t } = useI18n();
    const scrollRef = useRef<HTMLDivElement>(null);
    const highlightTimeoutRef = useRef<number | null>(null);
    const [highlightedSentenceId, setHighlightedSentenceId] = useState<
      string | null
    >(null);
    const sentences = useMemo(() => splitSentences(transcript), [transcript]);
    // Auto-scroll to the bottom whenever transcript grows, unless the user
    // has scrolled away (within ~80px of the bottom = "following").
    const followingRef = useRef(true);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const handleScroll = () => {
        const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
        followingRef.current = dist < 80;
      };
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => el.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (followingRef.current) {
        el.scrollTop = el.scrollHeight;
      }
    }, [transcript]);

    useEffect(
      () => () => {
        if (highlightTimeoutRef.current !== null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
      },
      [],
    );

    useImperativeHandle(ref, () => ({
      focusSentence(sentenceId: string) {
        const root = scrollRef.current;
        const target = root?.querySelector<HTMLElement>(
          `[data-sentence-id="${CSS.escape(sentenceId)}"]`,
        );
        if (!target) return;
        followingRef.current = false;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedSentenceId(sentenceId);
        if (highlightTimeoutRef.current !== null) {
          window.clearTimeout(highlightTimeoutRef.current);
        }
        highlightTimeoutRef.current = window.setTimeout(
          () => setHighlightedSentenceId(null),
          2600,
        );
      },
    }));

    return (
      <div
        ref={scrollRef}
        className={
          (variant === "report"
            ? "text-base leading-relaxed whitespace-pre-wrap text-foreground/90 "
            : variant === "feed"
              ? "h-full overflow-y-auto px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap "
              : variant === "workspace"
                ? "h-full overflow-y-auto rounded-lg border border-rule bg-paper/70 px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap "
                : "h-[25vh] overflow-y-auto rounded-md border border-rule bg-paper p-4 text-base leading-relaxed whitespace-pre-wrap ") +
          (className ?? "")
        }
      >
        {transcript ? (
          <>
            {renderTranscript(transcript, sentences, highlightedSentenceId)}
            {active && (
              <span
                aria-hidden
                className="inline-block w-[3px] h-[1.1em] align-text-bottom bg-accent ml-0.5 animate-pulse"
              />
            )}
          </>
        ) : (
          <p className="text-muted italic">
            {active ? t.live_transcript_listening : t.live_transcript_idle}
          </p>
        )}
      </div>
    );
  },
);

function renderTranscript(
  transcript: string,
  sentences: ReturnType<typeof splitSentences>,
  highlightedSentenceId: string | null,
) {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const sentence of sentences) {
    if (sentence.start > cursor) {
      parts.push(transcript.slice(cursor, sentence.start));
    }
    parts.push(
      <span
        key={sentence.id}
        data-sentence-id={sentence.id}
        className={
          highlightedSentenceId === sentence.id
            ? "rounded-sm bg-accent/20 ring-2 ring-accent ring-offset-2 ring-offset-paper transition-colors"
            : "transition-colors"
        }
      >
        {transcript.slice(sentence.start, sentence.end)}
      </span>,
    );
    cursor = sentence.end;
  }
  if (cursor < transcript.length) parts.push(transcript.slice(cursor));
  return parts;
}
