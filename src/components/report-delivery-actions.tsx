"use client";

import { useEffect, useRef, useState } from "react";
import { Check, LoaderCircle, Mail } from "lucide-react";
import { ExportPdfButton } from "@/components/export-pdf-button";
import { useI18n } from "@/lib/i18n/provider";
import type { ReportKind } from "@/lib/report-email";

type Status = "idle" | "sending" | "sent" | "error";

export function ReportDeliveryActions({
  canEmail,
  children,
  id,
  kind,
  printHref,
}: {
  canEmail: boolean;
  children?: React.ReactNode;
  id: string;
  kind: ReportKind;
  printHref: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {children}
      <ExportPdfButton href={printHref} />
      {canEmail ? <EmailReportButton id={id} kind={kind} /> : null}
    </div>
  );
}

function EmailReportButton({ id, kind }: { id: string; kind: ReportKind }) {
  const { t, lang } = useI18n();
  const [status, setStatus] = useState<Status>("idle");
  const resetTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    },
    [],
  );

  const label =
    status === "sending"
      ? t.email_report_sending
      : status === "sent"
        ? t.email_report_sent
        : status === "error"
          ? t.email_report_failed
          : t.email_report;

  async function send() {
    if (status === "sending") return;
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
    setStatus("sending");
    try {
      const response = await fetch("/api/reports/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, kind, lang }),
      });
      if (!response.ok) throw new Error(`Email failed (${response.status})`);
      setStatus("sent");
      resetTimer.current = window.setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("error");
      resetTimer.current = window.setTimeout(() => setStatus("idle"), 4500);
    }
  }

  return (
    <button
      type="button"
      onClick={send}
      disabled={status === "sending"}
      title={label}
      aria-label={label}
      className="inline-flex items-center gap-2 rounded-md border border-rule px-3 py-1.5 text-sm text-muted transition-colors hover:border-foreground hover:text-foreground disabled:cursor-wait disabled:opacity-70"
    >
      {status === "sending" ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : status === "sent" ? (
        <Check aria-hidden="true" className="size-4 text-[var(--severity-low)]" />
      ) : (
        <Mail aria-hidden="true" className="size-4 sm:hidden" />
      )}
      <span className={status === "idle" ? "hidden sm:inline" : undefined}>
        {label}
      </span>
    </button>
  );
}
