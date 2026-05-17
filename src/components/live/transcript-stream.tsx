"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  transcript: string;
  /** Pulse the cursor while audio is being captured. */
  active?: boolean;
  className?: string;
};

export function TranscriptStream({ transcript, active, className }: Props) {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
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

  return (
    <div
      ref={scrollRef}
      className={
        "h-[50vh] overflow-y-auto rounded-md border border-rule bg-paper p-4 text-base leading-relaxed whitespace-pre-wrap " +
        (className ?? "")
      }
    >
      {transcript ? (
        <>
          {transcript}
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
}
