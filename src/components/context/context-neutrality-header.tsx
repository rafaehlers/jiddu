"use client";

import { ChevronDown, Scale } from "lucide-react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { LiveNeutralityList } from "@/components/live/neutrality-list";
import { NEUTRALITY_VERDICT_META } from "@/components/neutrality-visuals";
import { useI18n } from "@/lib/i18n/provider";
import type { LiveNeutralityVerdict } from "@/lib/live/use-live-analysis";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import { cn } from "@/lib/utils";
import type { ContextCopy } from "./context-copy";

type Props = {
  verdict: LiveNeutralityVerdict | null;
  findings: NeutralityFinding[];
  final: boolean;
  copy: ContextCopy;
};

type PanelPosition = Pick<
  CSSProperties,
  "top" | "left" | "width" | "maxHeight"
>;

const PANEL_MAX_WIDTH = 480;
const PANEL_VIEWPORT_GAP = 8;
const PANEL_TRIGGER_GAP = 8;

export function ContextNeutralityHeader({
  verdict,
  findings,
  final,
  copy,
}: Props) {
  const { t } = useI18n();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<Element | null>(null);
  const [panelPosition, setPanelPosition] = useState<PanelPosition>({
    top: PANEL_VIEWPORT_GAP,
    left: PANEL_VIEWPORT_GAP,
    width: PANEL_MAX_WIDTH,
    maxHeight: "65vh",
  });
  const verdictMeta = verdict ? NEUTRALITY_VERDICT_META[verdict.verdict] : null;
  const VerdictIcon = verdictMeta?.icon ?? Scale;
  const stageLabel = final ? copy.finalAssessment : copy.currentAssessment;
  const verdictLabel = verdictMeta
    ? (t[verdictMeta.labelKey] as string)
    : copy.awaitingAssessment;

  useLayoutEffect(() => {
    if (!open) return;

    const positionPanel = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = Math.max(
        0,
        Math.min(PANEL_MAX_WIDTH, viewportWidth - PANEL_VIEWPORT_GAP * 2),
      );
      const left = Math.min(
        Math.max(PANEL_VIEWPORT_GAP, triggerRect.right - width),
        viewportWidth - width - PANEL_VIEWPORT_GAP,
      );
      const roomBelow =
        viewportHeight -
        triggerRect.bottom -
        PANEL_TRIGGER_GAP -
        PANEL_VIEWPORT_GAP;
      const roomAbove =
        triggerRect.top - PANEL_TRIGGER_GAP - PANEL_VIEWPORT_GAP;
      const placeAbove = roomBelow < 240 && roomAbove > roomBelow;
      const availableHeight = Math.max(96, placeAbove ? roomAbove : roomBelow);
      const panelHeight = Math.min(
        panelRef.current?.scrollHeight ?? availableHeight,
        availableHeight,
      );
      const top = placeAbove
        ? Math.max(
            PANEL_VIEWPORT_GAP,
            triggerRect.top - PANEL_TRIGGER_GAP - panelHeight,
          )
        : triggerRect.bottom + PANEL_TRIGGER_GAP;

      setPanelPosition({ top, left, width, maxHeight: availableHeight });
    };

    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          if (!open) {
            setPortalRoot(event.currentTarget.closest(".context-orbs-theme"));
          }
          setOpen((current) => !current);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md border bg-paper px-2.5 py-1.5 text-left text-xs outline-none transition-colors hover:border-accent",
          verdictMeta?.cls ?? "border-rule",
        )}
      >
        <VerdictIcon aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden uppercase tracking-wider text-muted 2xl:inline">
          {stageLabel}
        </span>
        <span className="font-medium">{verdictLabel}</span>
        {verdict ? (
          <span className="tabular-nums opacity-70">
            {Math.round(verdict.confidence * 100)}%
          </span>
        ) : null}
        {findings.length > 0 ? (
          <span className="rounded-full bg-background/70 px-1.5 py-0.5 text-[9px] tabular-nums">
            {findings.length}
          </span>
        ) : null}
        <ChevronDown
          aria-hidden="true"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && portalRoot
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label={`${copy.neutrality}: ${stageLabel}`}
              style={panelPosition}
              className="fixed z-50 overflow-x-hidden overflow-y-auto rounded-lg border border-rule bg-background p-3 shadow-xl"
            >
              <div className="mb-3 flex min-w-0 items-center justify-between gap-3 border-b border-rule pb-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {copy.neutrality}
                  </p>
                  <h2 className="break-words font-serif text-lg">
                    {stageLabel}
                  </h2>
                </div>
                <span className="shrink-0 text-right text-[10px] text-muted">
                  {findings.length} {copy.neutralityFindings}
                </span>
              </div>
              <LiveNeutralityList
                findings={findings}
                verdict={verdict}
                verdictLabel={stageLabel}
              />
              {final ? (
                <p className="mt-3 border-t border-rule pt-2 text-[10px] leading-relaxed text-muted">
                  {copy.finalAssessmentHint}
                </p>
              ) : null}
            </div>,
            portalRoot,
          )
        : null}
    </div>
  );
}
