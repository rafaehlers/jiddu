"use client";

import { useMemo } from "react";
import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { formatAppDateTime } from "@/lib/date-time";
import { JidduDataGrid } from "./jiddu-data-grid";

export type AccountCreditActivityGridRow = {
  activity: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
  id: string;
  kind: string;
  providerUsage: string[];
};

export function AccountCreditActivityGrid({
  rows,
}: {
  rows: AccountCreditActivityGridRow[];
}) {
  const columnDefs = useMemo<ColDef<AccountCreditActivityGridRow>[]>(
    () => [
      {
        field: "createdAt",
        headerName: "When",
        minWidth: 184,
        sort: "desc",
        valueFormatter: formatDate,
      },
      {
        field: "activity",
        headerName: "Activity",
        minWidth: 180,
        flex: 1,
      },
      {
        field: "amount",
        headerName: "Change",
        minWidth: 112,
        cellClass: "jiddu-grid-number-cell",
        cellRenderer: ChangeCell,
      },
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
        field: "balanceAfter",
        headerName: "Balance",
        minWidth: 112,
        cellClass: "jiddu-grid-number-cell",
        filter: "agNumberColumnFilter",
      },
    ],
    [],
  );

  return (
    <JidduDataGrid
      ariaLabel="Credit activity"
      columnDefs={columnDefs}
      csvFileName="jiddu-credit-activity.csv"
      emptyMessage="No credit activity yet."
      getRowId={({ data }) => data.id}
      rowData={rows}
    />
  );
}

function formatDate({
  value,
}: ValueFormatterParams<AccountCreditActivityGridRow, string>): string {
  if (!value) return "—";
  return formatAppDateTime(new Date(value));
}

function ChangeCell({
  data,
}: ICellRendererParams<AccountCreditActivityGridRow, number>) {
  if (!data) return null;
  const cls =
    data.amount > 0
      ? "text-emerald-600"
      : data.amount < 0
        ? "text-[var(--severity-high)]"
        : "text-muted";
  const label =
    data.kind === "included_usage"
      ? "Included"
      : `${data.amount > 0 ? "+" : ""}${data.amount}`;

  return <span className={`font-medium tabular-nums ${cls}`}>{label}</span>;
}
