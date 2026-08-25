"use client";

import { Check, Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  REPORT_TITLE_MAX_LENGTH,
  type ReportTitleKind,
} from "@/lib/report-title";
import { cn } from "@/lib/utils";

type Props = {
  canEdit: boolean;
  className?: string;
  fallback: string;
  id: string;
  kind: ReportTitleKind;
  title: string | null;
};

export function ReportTitle({
  canEdit,
  className,
  fallback,
  id,
  kind,
  title: initialTitle,
}: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const resolvedTitle = initialTitle?.trim() || fallback;
  const [title, setTitle] = useState(resolvedTitle);
  const [draft, setDraft] = useState(resolvedTitle);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  function startEditing() {
    setDraft(title);
    setError(false);
    setEditing(true);
  }

  function cancelEditing() {
    if (saving) return;
    setDraft(title);
    setError(false);
    setEditing(false);
  }

  async function saveTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextTitle = draft.trim();
    if (!nextTitle || saving) return;

    setSaving(true);
    setError(false);
    try {
      const response = await fetch(
        `/api/reports/${kind}/${encodeURIComponent(id)}/title`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { title?: unknown }
        | null;
      if (!response.ok || typeof payload?.title !== "string") {
        throw new Error("Title update failed");
      }
      setTitle(payload.title);
      setDraft(payload.title);
      setEditing(false);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return <h1 className={className}>{title}</h1>;
  }

  if (!editing) {
    return (
      <h1 className={cn("min-w-0", className)}>
        <button
          type="button"
          onClick={startEditing}
          aria-label={`${title} — ${t.report_title_edit}`}
          title={t.report_title_edit}
          className="group flex max-w-full items-start gap-2 text-left hover:text-accent focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <span className="min-w-0 break-words">{title}</span>
          <Pencil className="mt-[0.28em] size-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70" />
        </button>
      </h1>
    );
  }

  return (
    <div className="min-w-0">
      <form className="flex min-w-0 items-start gap-1.5" onSubmit={saveTitle}>
        <input
          autoFocus
          aria-label={t.report_title_input}
          value={draft}
          maxLength={REPORT_TITLE_MAX_LENGTH}
          disabled={saving}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancelEditing();
          }}
          className={cn(
            "min-h-10 min-w-0 flex-1 rounded-md border border-accent bg-paper px-2 py-1 text-foreground outline-none ring-accent/20 focus:ring-2",
            className,
          )}
        />
        <button
          type="submit"
          aria-label={t.report_title_save}
          title={t.report_title_save}
          disabled={saving || !draft.trim()}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </button>
        <button
          type="button"
          aria-label={t.report_title_cancel}
          title={t.report_title_cancel}
          disabled={saving}
          onClick={cancelEditing}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-md text-muted hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="size-4" />
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {t.report_title_save_error}
        </p>
      ) : null}
    </div>
  );
}
