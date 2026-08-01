"use client";

import Link from "next/link";
import { useMemo } from "react";
import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { toggleReviewedAction } from "@/app/admin/review-actions";
import { formatAppDateTime } from "@/lib/date-time";
import { JidduDataGrid } from "./jiddu-data-grid";

export type AdminAnalysisGridRow = {
  createdAt: string;
  id: string;
  kind:
    | "fallacy"
    | "factcheck"
    | "neutrality"
    | "explain"
    | "slop"
    | "review";
  language: string;
  model: string;
  owner: string;
  providerUsage: string[];
  reviewedAt: string | null;
  signal: string;
  source: string;
  sourceRef: string | null;
  status: string;
  title: string;
  viewerHref: string;
};

export function AdminAnalysesGrid({
  rows,
}: {
  rows: AdminAnalysisGridRow[];
}) {
  const columnDefs = useMemo<ColDef<AdminAnalysisGridRow>[]>(
    () => [
      {
        field: "createdAt",
        headerName: "When",
        minWidth: 168,
        sort: "desc",
        valueFormatter: formatDate,
      },
      {
        field: "kind",
        headerName: "Type",
        minWidth: 126,
        cellRenderer: TypeCell,
      },
      {
        field: "title",
        headerName: "Title",
        minWidth: 260,
        flex: 1.5,
        cellRenderer: TitleCell,
        tooltipField: "title",
      },
      { field: "source", headerName: "Source", minWidth: 112 },
      {
        field: "language",
        headerName: "Lang",
        minWidth: 88,
        maxWidth: 100,
      },
      { field: "model", headerName: "Model", minWidth: 150 },
      {
        field: "providerUsage",
        headerName: "Provider usage",
        minWidth: 180,
        valueGetter: ({ data }) =>
          data?.providerUsage.length
            ? data.providerUsage.join(" · ")
            : "—",
        tooltipValueGetter: ({ data }) =>
          data?.providerUsage.length
            ? data.providerUsage.join("\n")
            : "—",
      },
      {
        field: "signal",
        headerName: "Score / Claims",
        headerTooltip: "Score for fallacy, claim count for fact-check",
        minWidth: 150,
        cellClass: "jiddu-grid-number-cell",
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 118,
        cellRenderer: StatusCell,
      },
      {
        colId: "reviewed",
        headerName: "Rev.",
        headerTooltip:
          "Mark as human-reviewed and remove the warning banner on the viewer",
        minWidth: 82,
        maxWidth: 92,
        sortable: false,
        filter: false,
        cellRenderer: ReviewedCell,
      },
      {
        field: "owner",
        headerName: "User",
        minWidth: 220,
        flex: 1,
        tooltipField: "owner",
      },
    ],
    [],
  );

  return (
    <JidduDataGrid
      ariaLabel="Admin analyses"
      columnDefs={columnDefs}
      csvFileName="jiddu-analyses.csv"
      emptyMessage="No analyses yet."
      getRowId={({ data }) => `${data.kind}:${data.id}`}
      rowData={rows}
      rowHeight={56}
    />
  );
}

function formatDate({
  value,
}: ValueFormatterParams<AdminAnalysisGridRow, string>): string {
  if (!value) return "—";
  return formatDateValue(value);
}

function formatDateValue(value: string): string {
  return formatAppDateTime(new Date(value), "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TypeCell({
  value,
}: ICellRendererParams<AdminAnalysisGridRow, AdminAnalysisGridRow["kind"]>) {
  if (!value) return null;
  const cls = {
    fallacy: "bg-amber-500/15 text-amber-500",
    factcheck: "bg-blue-500/15 text-blue-500",
    neutrality: "bg-purple-500/15 text-purple-500",
    explain: "bg-teal-500/15 text-teal-500",
    slop: "bg-rose-500/15 text-rose-500",
    review: "bg-red-500/15 text-red-500",
  }[value];
  const label = {
    fallacy: "Fallacy",
    factcheck: "Fact-check",
    neutrality: "Neutrality",
    explain: "Explain",
    slop: "Slop",
    review: "Review",
  }[value];

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {label}
    </span>
  );
}

function TitleCell({
  data,
}: ICellRendererParams<AdminAnalysisGridRow, string>) {
  if (!data) return null;
  return (
    <div className="flex h-full w-full min-w-0 flex-col justify-center overflow-hidden">
      <Link
        href={data.viewerHref}
        className="block truncate font-medium hover:underline"
        title={data.title}
      >
        {data.title}
      </Link>
      {data.sourceRef && (
        <span
          className="block truncate text-xs text-muted"
          title={data.sourceRef}
        >
          {data.sourceRef}
        </span>
      )}
    </div>
  );
}

function StatusCell({
  value,
}: ICellRendererParams<AdminAnalysisGridRow, string>) {
  const cls =
    value === "failed"
      ? "bg-[color-mix(in_oklab,var(--severity-high)_15%,transparent)] text-[var(--severity-high)]"
      : value === "complete"
        ? "bg-paper text-foreground"
        : "bg-paper text-muted";

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {value}
    </span>
  );
}

function ReviewedCell({
  data,
}: ICellRendererParams<AdminAnalysisGridRow>) {
  if (!data) return null;
  return (
    <form action={toggleReviewedAction} className="flex h-full items-center">
      <input type="hidden" name="kind" value={data.kind} />
      <input type="hidden" name="id" value={data.id} />
      <button
        type="submit"
        title={
          data.reviewedAt
            ? `Reviewed ${formatDateValue(data.reviewedAt)} — click to unmark`
            : "Mark as reviewed (removes warning banner)"
        }
        className={`inline-flex size-7 items-center justify-center rounded-full border text-xs transition-colors ${
          data.reviewedAt
            ? "border-emerald-500/40 text-emerald-500 hover:border-emerald-500"
            : "border-rule text-muted hover:text-foreground"
        }`}
      >
        {data.reviewedAt ? "✓" : "○"}
      </button>
    </form>
  );
}
