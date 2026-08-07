"use client";

import { Cog, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ContextCopy } from "./context-copy";
import {
  CONTEXT_ANALYSIS_INTERVALS,
  CONTEXT_FACT_SOURCE_LIMITS,
  DEFAULT_CONTEXT_SETTINGS,
  readContextSettings,
  type ContextSettings,
} from "./context-settings-state";

const STORAGE_KEY = "jiddu_context_settings_v1";

export type ContextSettingsControl = {
  settings: ContextSettings;
  update: <Key extends keyof ContextSettings>(
    key: Key,
    value: ContextSettings[Key],
  ) => void;
  reset: () => void;
};

export function useContextSettings(): ContextSettingsControl {
  const [settings, setSettings] = useState<ContextSettings>(
    DEFAULT_CONTEXT_SETTINGS,
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setSettings(
          readContextSettings(window.localStorage.getItem(STORAGE_KEY)),
        );
      } catch {
        setSettings({ ...DEFAULT_CONTEXT_SETTINGS });
      } finally {
        setLoaded(true);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Preferences remain active for the current page session.
    }
  }, [loaded, settings]);

  const update = useCallback(
    <Key extends keyof ContextSettings>(
      key: Key,
      value: ContextSettings[Key],
    ) => setSettings((current) => ({ ...current, [key]: value })),
    [],
  );
  const reset = useCallback(
    () => setSettings({ ...DEFAULT_CONTEXT_SETTINGS }),
    [],
  );

  return { settings, update, reset };
}

export function ContextSettingsButton({
  control,
  copy,
  showCaptureSettings,
  captureSettingsLocked = false,
}: {
  control: ContextSettingsControl;
  copy: ContextCopy;
  showCaptureSettings: boolean;
  captureSettingsLocked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={copy.settings}
        title={copy.settings}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-rule bg-paper text-muted transition-colors hover:border-accent hover:text-foreground"
      >
        <Cog className="size-4" />
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false);
        }}
        aria-labelledby="context-settings-title"
        aria-describedby="context-settings-description"
        className="m-auto border-0 bg-transparent p-0 text-foreground outline-none backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex max-h-[85vh] w-[min(92vw,34rem)] flex-col overflow-hidden rounded-xl border border-rule bg-background shadow-2xl">
          <header className="flex items-start gap-3 border-b border-rule px-5 py-4">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Cog className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="context-settings-title"
                className="font-serif text-xl font-semibold"
              >
                {copy.settings}
              </h2>
              <p
                id="context-settings-description"
                className="mt-0.5 text-xs leading-relaxed text-muted"
              >
                {copy.settingsDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={copy.closeSettings}
              className="rounded-md p-1.5 text-muted hover:bg-paper hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="min-h-0 space-y-6 overflow-y-auto px-5 py-5">
            <SettingsSection title={copy.factSettings}>
              <SettingsRow
                label={copy.factSourceLimit}
                hint={copy.factSourceLimitHint}
              >
                <select
                  value={control.settings.factSourceLimit}
                  onChange={(event) =>
                    control.update(
                      "factSourceLimit",
                      Number(event.target.value),
                    )
                  }
                  className="rounded-md border border-rule bg-paper px-2 py-1.5 text-xs outline-none focus:border-accent"
                >
                  {CONTEXT_FACT_SOURCE_LIMITS.map((limit) => (
                    <option key={limit} value={limit}>
                      {limit}
                    </option>
                  ))}
                </select>
              </SettingsRow>
              <ToggleRow
                label={copy.factSourcesExpanded}
                hint={copy.factSourcesExpandedHint}
                checked={control.settings.expandFactSources}
                onChange={(value) => control.update("expandFactSources", value)}
              />
            </SettingsSection>

            <SettingsSection title={copy.graphSettings}>
              <ToggleRow
                label={copy.showMiniMap}
                hint={copy.showMiniMapHint}
                checked={control.settings.showMiniMap}
                onChange={(value) => control.update("showMiniMap", value)}
              />
              <ToggleRow
                label={copy.animateRelations}
                hint={copy.animateRelationsHint}
                checked={control.settings.animateRelations}
                onChange={(value) => control.update("animateRelations", value)}
              />
            </SettingsSection>

            {showCaptureSettings ? (
              <SettingsSection title={copy.captureSettings}>
                <SettingsRow
                  label={copy.interval}
                  hint={copy.analysisIntervalHint}
                >
                  <select
                    value={control.settings.analysisIntervalMs}
                    disabled={captureSettingsLocked}
                    onChange={(event) =>
                      control.update(
                        "analysisIntervalMs",
                        Number(event.target.value),
                      )
                    }
                    className="rounded-md border border-rule bg-paper px-2 py-1.5 text-xs outline-none focus:border-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {CONTEXT_ANALYSIS_INTERVALS.map((interval) => (
                      <option key={interval} value={interval}>
                        {interval === 60_000 ? "1 min" : `${interval / 1_000}s`}
                      </option>
                    ))}
                  </select>
                </SettingsRow>
                <ToggleRow
                  label={copy.automaticNews}
                  hint={copy.automaticNewsHint}
                  checked={control.settings.automaticNews}
                  onChange={(value) => control.update("automaticNews", value)}
                />
                <ToggleRow
                  label={copy.showActivityLog}
                  hint={copy.showActivityLogHint}
                  checked={control.settings.showActivityLog}
                  onChange={(value) => control.update("showActivityLog", value)}
                />
              </SettingsSection>
            ) : null}
          </div>

          <footer className="flex items-center justify-between border-t border-rule bg-paper/40 px-5 py-3">
            <button
              type="button"
              onClick={control.reset}
              className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              {copy.resetSettings}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              {copy.closeSettings}
            </button>
          </footer>
        </div>
      </dialog>
    </>
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        {title}
      </h3>
      <div className="divide-y divide-rule overflow-hidden rounded-lg border border-rule bg-paper/40">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 px-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <SettingsRow label={label} hint={hint}>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-rule"}`}
      >
        <span
          className={`absolute top-1/2 size-4 -translate-y-1/2 rounded-full shadow-sm transition-all ${checked ? "right-0.5 bg-background" : "left-0.5 bg-foreground"}`}
        />
      </button>
    </SettingsRow>
  );
}
