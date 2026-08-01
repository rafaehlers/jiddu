"use client";

import Link from "next/link";
import { useMemo } from "react";
import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { formatAppDateTime } from "@/lib/date-time";
import type { UserAnalysisKind } from "@/lib/user-analysis-history";
import { JidduDataGrid } from "./jiddu-data-grid";

export type AccountAnalysisGridRow = {
  createdAt: string;
  id: string;
  kind: UserAnalysisKind;
  model: string;
  source: string;
  sourceRef: string | null;
  status: string;
  title: string;
  viewerHref: string;
};

export function AccountAnalysesGrid({
  rows,
}: {
  rows: AccountAnalysisGridRow[];
}) {
  const columnDefs = useMemo<ColDef<AccountAnalysisGridRow>[]>(
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
        minWidth: 250,
        flex: 1.5,
        cellRenderer: TitleCell,
        tooltipField: "title",
      },
      { field: "source", headerName: "Source", minWidth: 112 },
      { field: "model", headerName: "Model", minWidth: 150 },
      {
        field: "status",
        headerName: "Status",
        minWidth: 118,
        cellRenderer: StatusCell,
      },
    ],
    [],
  );

  return (
    <JidduDataGrid
      ariaLabel="Account analyses"
      columnDefs={columnDefs}
      csvFileName="jiddu-my-analyses.csv"
      emptyMessage="No analyses yet."
      getRowId={({ data }) => `${data.kind}:${data.id}`}
      rowData={rows}
      rowHeight={56}
    />
  );
}

function formatDate({
  value,
}: ValueFormatterParams<AccountAnalysisGridRow, string>): string {
  if (!value) return "—";
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
}: ICellRendererParams<AccountAnalysisGridRow, UserAnalysisKind>) {
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
}: ICellRendererParams<AccountAnalysisGridRow, string>) {
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
}: ICellRendererParams<AccountAnalysisGridRow, string>) {
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
