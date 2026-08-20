"use client";

import { Check, Loader2, Pencil, X } from "lucide-react";
import { type FormEvent, useState } from "react";

type Props = {
  sessionId: string;
  title: string;
  labels: {
    edit: string;
    input: string;
    save: string;
    cancel: string;
    error: string;
  };
};

export function ContextSessionTitleEditor({
  sessionId,
  title: initialTitle,
  labels,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [draft, setDraft] = useState(initialTitle);
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
        `/api/context/sessions/${encodeURIComponent(sessionId)}/title`,
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
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <h1 className="min-w-0 flex-1 font-serif text-lg font-semibold sm:text-xl">
        <button
          type="button"
          onClick={startEditing}
          aria-label={labels.edit}
          title={labels.edit}
          className="group flex max-w-full items-center gap-1.5 text-left hover:text-accent focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <span className="truncate">{title}</span>
          <Pencil className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-70 group-focus-visible:opacity-70" />
        </button>
      </h1>
    );
  }

  return (
    <div className="min-w-0 flex-1">
      <form className="flex min-w-0 items-center gap-1" onSubmit={saveTitle}>
        <input
          autoFocus
          aria-label={labels.input}
          value={draft}
          maxLength={160}
          disabled={saving}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") cancelEditing();
          }}
          className="h-8 min-w-0 flex-1 rounded-md border border-accent bg-paper px-2 font-serif text-base font-semibold text-foreground outline-none ring-accent/20 focus:ring-2 sm:text-lg"
        />
        <button
          type="submit"
          aria-label={labels.save}
          title={labels.save}
          disabled={saving || !draft.trim()}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-accent hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
        </button>
        <button
          type="button"
          aria-label={labels.cancel}
          title={labels.cancel}
          disabled={saving}
          onClick={cancelEditing}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-foreground/10 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="size-4" />
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-1 text-[10px] text-red-500">
          {labels.error}
        </p>
      ) : null}
    </div>
  );
}
