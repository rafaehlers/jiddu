"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ContextReplayEvent } from "@/lib/context-replay-schema";
import type { ContextCopy } from "./context-copy";

const SPEEDS = [0.5, 1, 1.5, 2] as const;

export function useContextReplayTimeline(durationMs: number) {
  const [playheadMs, setPlayheadMs] = useState(durationMs);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const previousDurationRef = useRef(durationMs);

  useEffect(() => {
    const previousDuration = previousDurationRef.current;
    previousDurationRef.current = durationMs;
    setPlayheadMs((current) =>
      current >= previousDuration ? durationMs : Math.min(current, durationMs),
    );
  }, [durationMs]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const delta = (now - previous) * speed;
      previous = now;
      setPlayheadMs((current) => {
        const next = Math.min(durationMs, current + delta);
        if (next >= durationMs) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [durationMs, playing, speed]);

  const toggle = useCallback(() => {
    setPlaying((current) => {
      if (!current && playheadMs >= durationMs) setPlayheadMs(0);
      return !current;
    });
  }, [durationMs, playheadMs]);
  const restart = useCallback(() => {
    setPlaying(false);
    setPlayheadMs(0);
  }, []);
  const showFinal = useCallback(() => {
    setPlaying(false);
    setPlayheadMs(durationMs);
  }, [durationMs]);
  const seek = useCallback(
    (value: number) => setPlayheadMs(Math.min(durationMs, Math.max(0, value))),
    [durationMs],
  );

  return {
    playheadMs,
    playing,
    speed,
    setSpeed,
    toggle,
    restart,
    showFinal,
    seek,
  };
}

export function ContextReplayTimeline({
  durationMs,
  exact,
  events,
  timeline,
  copy,
}: {
  durationMs: number;
  exact: boolean;
  events: ContextReplayEvent[];
  timeline: ReturnType<typeof useContextReplayTimeline>;
  copy: ContextCopy;
}) {
  return (
    <div className="relative z-40 border-y border-rule bg-background/95 px-3 py-2 backdrop-blur sm:px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={timeline.toggle}
          aria-label={timeline.playing ? copy.pauseReplay : copy.playReplay}
          title={timeline.playing ? copy.pauseReplay : copy.playReplay}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-white hover:bg-accent/90"
        >
          {timeline.playing ? (
            <Pause className="size-3.5" fill="currentColor" />
          ) : (
            <Play className="ml-0.5 size-3.5" fill="currentColor" />
          )}
        </button>
        <button
          type="button"
          onClick={timeline.restart}
          aria-label={copy.replayFromStart}
          title={copy.replayFromStart}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-rule bg-paper text-muted hover:text-foreground"
        >
          <RotateCcw className="size-3.5" />
        </button>
        <span className="w-20 shrink-0 text-center font-mono text-[11px] tabular-nums text-muted">
          {formatReplayTime(timeline.playheadMs)} / {formatReplayTime(durationMs)}
        </span>
        <div className="relative min-w-20 flex-1 pb-1">
          <input
            type="range"
            min={0}
            max={Math.max(1, durationMs)}
            step={100}
            value={Math.min(durationMs, timeline.playheadMs)}
            onChange={(event) => timeline.seek(Number(event.target.value))}
            aria-label={copy.timeline}
            className="relative z-10 h-4 w-full cursor-pointer accent-accent"
          />
          {events.map((event) => (
            <span
              key={event.id}
              aria-hidden
              className={`pointer-events-none absolute bottom-0 size-1 -translate-x-1/2 rounded-full ${eventTone(event.kind)}`}
              style={{
                left: `${Math.min(100, (event.elapsedMs / durationMs) * 100)}%`,
              }}
            />
          ))}
        </div>
        <label className="hidden items-center rounded-md border border-rule bg-paper px-1.5 py-1 text-[10px] text-muted sm:inline-flex">
          <span className="sr-only">{copy.replaySpeed}</span>
          <select
            value={timeline.speed}
            onChange={(event) => timeline.setSpeed(Number(event.target.value))}
            aria-label={copy.replaySpeed}
            className="bg-transparent text-foreground outline-none"
          >
            {SPEEDS.map((value) => (
              <option key={value} value={value}>
                {value}×
              </option>
            ))}
          </select>
        </label>
        <span
          title={exact ? copy.timelineExact : copy.timelineApproximateHint}
          className={`hidden rounded-full border px-2 py-1 text-[9px] font-medium uppercase tracking-wide md:inline-flex ${
            exact
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-amber-500/30 bg-amber-500/10 text-amber-500"
          }`}
        >
          {exact ? copy.timelineExact : copy.timelineApproximate}
        </span>
        <button
          type="button"
          onClick={timeline.showFinal}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-rule bg-paper px-2 py-1.5 text-[10px] font-medium text-muted hover:text-foreground"
        >
          <SkipForward className="size-3" />
          <span className="hidden lg:inline">{copy.finalState}</span>
        </button>
      </div>
    </div>
  );
}

function formatReplayTime(value: number): string {
  const seconds = Math.max(0, Math.floor(value / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

function eventTone(kind: ContextReplayEvent["kind"]): string {
  if (kind === "finding_detected") return "bg-rose-500";
  if (kind === "claim_detected" || kind === "claim_verified") {
    return "bg-blue-500";
  }
  if (kind.startsWith("neutrality")) return "bg-amber-500";
  return "bg-violet-500";
}
