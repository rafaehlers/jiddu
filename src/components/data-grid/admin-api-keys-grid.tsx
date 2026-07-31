"use client";

import { useMemo } from "react";
import type {
  ColDef,
  ICellRendererParams,
  ValueFormatterParams,
} from "ag-grid-community";
import {
  assignApiKeyOwnerAction,
  revokeApiKeyAction,
} from "@/app/admin/api-keys/actions";
import { formatAppDateTime } from "@/lib/date-time";
import { JidduDataGrid } from "./jiddu-data-grid";

export type AdminApiKeyGridRow = {
  createdAt: string;
  id: string;
  label: string;
  lastUsedAt: string | null;
  ownerEmail: string;
  ownerWorkosUserId: string | null;
  prefix: string;
  revokedAt: string | null;
  status: "active" | "revoked";
};

export function AdminApiKeysGrid({ rows }: { rows: AdminApiKeyGridRow[] }) {
  const columnDefs = useMemo<ColDef<AdminApiKeyGridRow>[]>(
    () => [
      {
        field: "label",
        headerName: "Label",
        minWidth: 180,
        flex: 1,
        cellClass: "jiddu-grid-strong-cell",
      },
      {
        field: "prefix",
        headerName: "Prefix",
        minWidth: 126,
        cellRenderer: PrefixCell,
      },
      {
        field: "ownerEmail",
        headerName: "WorkOS owner",
        minWidth: 290,
        flex: 1.2,
        cellRenderer: OwnerCell,
      },
      {
        field: "createdAt",
        headerName: "Created",
        minWidth: 168,
        sort: "desc",
        valueFormatter: formatDate,
      },
      {
        field: "lastUsedAt",
        headerName: "Last used",
        minWidth: 168,
        valueFormatter: formatOptionalDate,
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 118,
        cellRenderer: StatusCell,
      },
      {
        colId: "revoke",
        headerName: "",
        minWidth: 96,
        maxWidth: 104,
        sortable: false,
        filter: false,
        cellRenderer: RevokeCell,
      },
    ],
    [],
  );

  return (
    <JidduDataGrid
      ariaLabel="API keys"
      columnDefs={columnDefs}
      csvFileName="jiddu-api-keys.csv"
      emptyMessage="No keys yet."
      getRowId={({ data }) => data.id}
      rowData={rows}
      rowHeight={68}
    />
  );
}

function formatDate({
  value,
}: ValueFormatterParams<AdminApiKeyGridRow, string>): string {
  if (!value) return "—";
  return formatAppDateTime(new Date(value), "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatOptionalDate({
  value,
}: ValueFormatterParams<AdminApiKeyGridRow, string | null>): string {
  if (!value) return "—";
  return formatAppDateTime(new Date(value), "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PrefixCell({
  value,
}: ICellRendererParams<AdminApiKeyGridRow, string>) {
  return <code className="font-mono text-xs text-muted">{value}…</code>;
}

function OwnerCell({ data }: ICellRendererParams<AdminApiKeyGridRow>) {
  if (!data) return null;
  return (
    <div className="flex h-full flex-col justify-center">
      <form
        action={assignApiKeyOwnerAction}
        className="flex items-center gap-2"
      >
        <input type="hidden" name="id" value={data.id} />
        <input
          type="email"
          name="ownerEmail"
          required
          defaultValue={data.ownerEmail}
          placeholder="Assign owner"
          aria-label={`WorkOS owner for ${data.label}`}
          className="min-w-0 flex-1 rounded border border-rule bg-background px-2 py-1 text-xs"
        />
        <button
          type="submit"
          className="text-xs text-muted hover:text-foreground"
        >
          Save
        </button>
      </form>
      {!data.ownerWorkosUserId && (
        <span className="mt-1 block text-xs text-[var(--severity-high)]">
          Disabled until assigned
        </span>
      )}
    </div>
  );
}

function StatusCell({
  value,
}: ICellRendererParams<AdminApiKeyGridRow, AdminApiKeyGridRow["status"]>) {
  const cls =
    value === "revoked"
      ? "bg-[color-mix(in_oklab,var(--severity-high)_15%,transparent)] text-[var(--severity-high)]"
      : "bg-emerald-500/15 text-emerald-500";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {value}
    </span>
  );
}

function RevokeCell({ data }: ICellRendererParams<AdminApiKeyGridRow>) {
  if (!data || data.revokedAt) return null;
  return (
    <form action={revokeApiKeyAction} className="flex h-full items-center">
      <input type="hidden" name="id" value={data.id} />
      <button
        type="submit"
        className="text-xs text-muted transition-colors hover:text-[var(--severity-high)]"
      >
        Revoke
      </button>
    </form>
  );
}
