"use client";

import { useMemo } from "react";
import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { deleteCacheEntryAction } from "@/app/admin/cache/actions";
import { formatAppDateTime } from "@/lib/date-time";
import { JidduDataGrid } from "./jiddu-data-grid";

export type AdminCacheGridRow = {
  cachedAt: string;
  confidence: number;
  expired: boolean;
  expiresAt: string;
  hash: string;
  language: string;
  statement: string;
  type: string;
  verdict: string;
};

export function AdminCacheGrid({ rows }: { rows: AdminCacheGridRow[] }) {
  const columnDefs = useMemo<ColDef<AdminCacheGridRow>[]>(
    () => [
      {
        field: "cachedAt",
        headerName: "Cached",
        minWidth: 168,
        sort: "desc",
        valueFormatter: formatDate,
      },
      {
        field: "language",
        headerName: "Lang",
        minWidth: 86,
        maxWidth: 100,
      },
      { field: "type", headerName: "Type", minWidth: 120 },
      {
        field: "verdict",
        headerName: "Verdict",
        minWidth: 138,
        cellRenderer: VerdictCell,
      },
      {
        field: "confidence",
        headerName: "Conf.",
        minWidth: 102,
        filter: "agNumberColumnFilter",
        valueFormatter: ({ value }) => `${Math.round(value * 100)}%`,
        cellClass: "jiddu-grid-number-cell",
      },
      {
        field: "statement",
        headerName: "Statement",
        minWidth: 320,
        flex: 1,
        tooltipField: "statement",
      },
      {
        field: "expiresAt",
        headerName: "Expires",
        minWidth: 168,
        valueFormatter: formatExpiry,
        cellClassRules: {
          "text-[var(--severity-high)]": ({ data }) =>
            Boolean(data?.expired),
        },
      },
      {
        colId: "delete",
        headerName: "",
        minWidth: 88,
        maxWidth: 96,
        sortable: false,
        filter: false,
        cellRenderer: DeleteCell,
      },
    ],
    [],
  );

  return (
    <JidduDataGrid
      ariaLabel="Claim verdict cache"
      columnDefs={columnDefs}
      csvFileName="jiddu-claim-cache.csv"
      emptyMessage="Cache is empty."
      getRowId={({ data }) => data.hash}
      pagination={false}
      rowData={rows}
    />
  );
}

function formatDate({
  value,
}: ValueFormatterParams<AdminCacheGridRow, string>): string {
  if (!value) return "—";
  return formatAppDateTime(new Date(value), "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatExpiry(
  params: ValueFormatterParams<AdminCacheGridRow, string>,
): string {
  return params.data?.expired ? "expired" : formatDate(params);
}

function VerdictCell({
  value,
}: ICellRendererParams<AdminCacheGridRow, string>) {
  const cls =
    value === "supported"
      ? "bg-emerald-500/15 text-emerald-500"
      : value === "contradicted"
        ? "bg-red-500/15 text-red-500"
        : value === "mixed"
          ? "bg-amber-500/15 text-amber-500"
          : "bg-paper text-muted";

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {value}
    </span>
  );
}

function DeleteCell({ data }: ICellRendererParams<AdminCacheGridRow>) {
  if (!data) return null;
  return (
    <form action={deleteCacheEntryAction} className="flex h-full items-center">
      <input type="hidden" name="hash" value={data.hash} />
      <button
        type="submit"
        className="text-xs text-muted transition-colors hover:text-[var(--severity-high)]"
      >
        Delete
      </button>
    </form>
  );
}
