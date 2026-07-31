"use client";

import { useMemo } from "react";
import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import { adjustCreditsAction } from "@/app/admin/credits/actions";
import { formatAppDateTime } from "@/lib/date-time";
import { JidduDataGrid } from "./jiddu-data-grid";

export type AdminCreditAccountGridRow = {
  available: number;
  balance: number;
  email: string;
  reserved: number;
  workosUserId: string;
};

export type AdminCreditTransactionGridRow = {
  amount: number;
  balanceAfter: number;
  createdAt: string;
  feature: string;
  id: string;
  kind: string;
  note: string;
  providerUsage: string[];
  user: string;
};

export function AdminCreditAccountsGrid({
  rows,
}: {
  rows: AdminCreditAccountGridRow[];
}) {
  const columnDefs = useMemo<ColDef<AdminCreditAccountGridRow>[]>(
    () => [
      {
        field: "email",
        headerName: "User",
        minWidth: 260,
        flex: 1,
        cellRenderer: AccountCell,
        tooltipField: "email",
      },
      {
        field: "balance",
        headerName: "Balance",
        minWidth: 112,
        filter: "agNumberColumnFilter",
        cellClass: "jiddu-grid-number-cell",
      },
      {
        field: "reserved",
        headerName: "Reserved",
        minWidth: 112,
        filter: "agNumberColumnFilter",
        cellClass: "jiddu-grid-number-cell",
      },
      {
        field: "available",
        headerName: "Available",
        minWidth: 112,
        filter: "agNumberColumnFilter",
        cellClass: "jiddu-grid-number-cell jiddu-grid-strong-cell",
      },
      {
        colId: "adjust",
        headerName: "Adjust",
        minWidth: 224,
        sortable: false,
        filter: false,
        cellRenderer: AdjustmentCell,
      },
    ],
    [],
  );

  return (
    <JidduDataGrid
      ariaLabel="Jiddu credit accounts"
      columnDefs={columnDefs}
      csvFileName="jiddu-credit-accounts.csv"
      emptyMessage="No Jiddu credit accounts yet."
      getRowId={({ data }) => data.workosUserId}
      rowData={rows}
      rowHeight={62}
    />
  );
}

export function AdminCreditTransactionsGrid({
  rows,
}: {
  rows: AdminCreditTransactionGridRow[];
}) {
  const columnDefs = useMemo<ColDef<AdminCreditTransactionGridRow>[]>(
    () => [
      {
        field: "createdAt",
        headerName: "When",
        minWidth: 184,
        sort: "desc",
        valueFormatter: formatTransactionDate,
      },
      { field: "user", headerName: "User", minWidth: 230, flex: 1 },
      { field: "kind", headerName: "Kind", minWidth: 130 },
      { field: "feature", headerName: "Feature", minWidth: 160 },
      {
        field: "amount",
        headerName: "Change",
        minWidth: 112,
        filter: "agNumberColumnFilter",
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
        filter: "agNumberColumnFilter",
        cellClass: "jiddu-grid-number-cell",
      },
      {
        field: "note",
        headerName: "Note",
        minWidth: 220,
        flex: 1,
        tooltipField: "note",
      },
    ],
    [],
  );

  return (
    <JidduDataGrid
      ariaLabel="Recent Jiddu credit transactions"
      columnDefs={columnDefs}
      csvFileName="jiddu-credit-transactions.csv"
      emptyMessage="No credit transactions yet."
      getRowId={({ data }) => data.id}
      rowData={rows}
      rowHeight={52}
    />
  );
}

function AccountCell({
  data,
}: ICellRendererParams<AdminCreditAccountGridRow, string>) {
  if (!data) return null;
  return (
    <div className="flex h-full min-w-0 flex-col justify-center">
      <span className="block truncate font-medium">{data.email}</span>
      <span className="block truncate text-xs text-muted">
        {data.workosUserId}
      </span>
    </div>
  );
}

function AdjustmentCell({
  data,
}: ICellRendererParams<AdminCreditAccountGridRow>) {
  if (!data) return null;
  return (
    <form
      action={adjustCreditsAction}
      className="flex h-full items-center gap-2"
    >
      <input type="hidden" name="email" value={data.email} />
      <input
        type="number"
        name="amount"
        required
        step="1"
        min="-1000000"
        max="1000000"
        placeholder="+100"
        aria-label={`Credit adjustment for ${data.email}`}
        className="w-24 rounded-md border border-rule bg-background px-2 py-1.5 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90"
      >
        Apply
      </button>
    </form>
  );
}

function formatTransactionDate({
  value,
}: ValueFormatterParams<AdminCreditTransactionGridRow, string>): string {
  if (!value) return "—";
  return formatAppDateTime(new Date(value));
}

function ChangeCell({
  data,
}: ICellRendererParams<AdminCreditTransactionGridRow, number>) {
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
