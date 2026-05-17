"use client";

import { useSyncExternalStore } from "react";
import { Mic, MonitorSpeaker } from "lucide-react";
import type { LiveSource } from "@/lib/live/use-live-session";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  value: LiveSource;
  onChange: (v: LiveSource) => void;
  disabled?: boolean;
};

// Tab capture (getDisplayMedia with audio) is Chromium-only at the time of
// writing. Use useSyncExternalStore for an SSR-safe one-shot capability read.
const subscribeNoop = () => () => {};
const getTabSupported = () =>
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getDisplayMedia === "function";
const getTabSupportedServer = () => false;

export function SourcePicker({ value, onChange, disabled }: Props) {
  const { t } = useI18n();
  const tabSupported = useSyncExternalStore(
    subscribeNoop,
    getTabSupported,
    getTabSupportedServer,
  );

  return (
    <div className="inline-flex rounded-md border border-rule overflow-hidden">
      <button
        type="button"
        onClick={() => onChange("mic")}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
          value === "mic"
            ? "bg-foreground text-background"
            : "bg-paper hover:bg-rule/50"
        }`}
      >
        <Mic className="size-4" />
        {t.live_source_mic}
      </button>
      <button
        type="button"
        onClick={() => onChange("tab")}
        disabled={disabled || !tabSupported}
        title={
          !tabSupported
            ? t.live_source_tab_unsupported
            : t.live_source_tab_tooltip
        }
        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors disabled:opacity-50 border-l border-rule ${
          value === "tab"
            ? "bg-foreground text-background"
            : "bg-paper hover:bg-rule/50"
        }`}
      >
        <MonitorSpeaker className="size-4" />
        {t.live_source_tab}
        {!tabSupported && (
          <span className="text-xs text-muted">
            ({t.live_source_tab_chrome_only})
          </span>
        )}
      </button>
    </div>
  );
}
