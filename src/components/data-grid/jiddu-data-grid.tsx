"use client";

import { Download, Search } from "lucide-react";
import {
  ClientSideRowModelModule,
  CellStyleModule,
  ColumnApiModule,
  ColumnAutoSizeModule,
  CsvExportModule,
  DateFilterModule,
  NumberFilterModule,
  PaginationModule,
  QuickFilterModule,
  RenderApiModule,
  ScrollApiModule,
  TextFilterModule,
  themeQuartz,
  TooltipModule,
  type ColDef,
  type GetRowIdFunc,
  type GridApi,
  type GridReadyEvent,
} from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import { useCallback, useMemo, useRef, useState } from "react";

const GRID_MODULES = [
  ClientSideRowModelModule,
  CellStyleModule,
  ColumnApiModule,
  ColumnAutoSizeModule,
  CsvExportModule,
  DateFilterModule,
  NumberFilterModule,
  PaginationModule,
  QuickFilterModule,
  RenderApiModule,
  ScrollApiModule,
  TextFilterModule,
  TooltipModule,
];

const JIDDU_GRID_THEME = themeQuartz.withParams({
  accentColor: "var(--accent-hi)",
  autoHeightMinBodyHeight: 120,
  backgroundColor: "var(--background)",
  borderColor: "var(--rule)",
  browserColorScheme: "inherit",
  cellHorizontalPadding: 12,
  fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
  fontSize: 14,
  foregroundColor: "var(--foreground)",
  headerBackgroundColor: "var(--paper)",
  headerFontWeight: 500,
  headerTextColor: "var(--muted)",
  oddRowBackgroundColor: "var(--background)",
  rowBorder: "1px solid var(--rule)",
  rowHoverColor:
    "color-mix(in oklab, var(--paper) 72%, var(--background))",
  selectedRowBackgroundColor:
    "color-mix(in oklab, var(--accent-hi) 12%, var(--background))",
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

export type JidduDataGridProps<TData> = {
  ariaLabel: string;
  columnDefs: ColDef<TData>[];
  csvFileName: string;
  emptyMessage: string;
  getRowId?: GetRowIdFunc<TData>;
  pageSize?: number;
  pagination?: boolean;
  quickFilterPlaceholder?: string;
  rowData: TData[];
  rowHeight?: number;
};

export function JidduDataGrid<TData>({
  ariaLabel,
  columnDefs,
  csvFileName,
  emptyMessage,
  getRowId,
  pageSize = 25,
  pagination = true,
  quickFilterPlaceholder = "Search this table…",
  rowData,
  rowHeight = 48,
}: JidduDataGridProps<TData>) {
  const [quickFilter, setQuickFilter] = useState("");
  const apiRef = useRef<GridApi<TData> | null>(null);

  const defaultColDef = useMemo<ColDef<TData>>(
    () => ({
      filter: true,
      minWidth: 100,
      resizable: true,
      sortable: true,
    }),
    [],
  );

  const handleGridReady = useCallback(
    (event: GridReadyEvent<TData>) => {
      apiRef.current = event.api;
      event.api.setGridAriaProperty("label", ariaLabel);
    },
    [ariaLabel],
  );

  const visibleRows = Math.min(
    rowData.length || 1,
    pagination ? pageSize : rowData.length || 1,
  );
  const gridHeight = Math.min(
    680,
    Math.max(
      180,
      43 + visibleRows * rowHeight + (pagination && rowData.length > pageSize ? 49 : 0),
    ),
  );

  return (
    <AgGridProvider modules={GRID_MODULES}>
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-w-56 flex-1 items-center gap-2 rounded-md border border-rule bg-background px-3 py-2 text-sm focus-within:border-accent">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <span className="sr-only">{quickFilterPlaceholder}</span>
            <input
              type="search"
              value={quickFilter}
              onChange={(event) => setQuickFilter(event.target.value)}
              placeholder={quickFilterPlaceholder}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              apiRef.current?.exportDataAsCsv({ fileName: csvFileName })
            }
            className="inline-flex items-center gap-2 rounded-md border border-rule px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            <Download aria-hidden="true" className="size-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-rule">
          <div
            className="jiddu-data-grid"
            style={{ height: gridHeight }}
          >
            <AgGridReact<TData>
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              animateRows={false}
              alwaysShowHorizontalScroll
              enableCellTextSelection
              ensureDomOrder
              getRowId={getRowId}
              headerHeight={42}
              noRowsOverlayComponent={() => (
                <span className="text-sm text-muted">{emptyMessage}</span>
              )}
              onGridReady={handleGridReady}
              pagination={pagination && rowData.length > pageSize}
              paginationPageSize={pageSize}
              paginationPageSizeSelector={[10, 25, 50, 100]}
              quickFilterText={quickFilter}
              rowData={rowData}
              rowHeight={rowHeight}
              theme={JIDDU_GRID_THEME}
            />
          </div>
        </div>
      </div>
    </AgGridProvider>
  );
}
