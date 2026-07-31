"use client";

import { Columns3, Download, Search } from "lucide-react";
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
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

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

type ColumnChoice = {
  id: string;
  label: string;
  visible: boolean;
};

function humanizeColumnId(columnId: string) {
  const words = columnId
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Column";
}

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
  const [columnChoices, setColumnChoices] = useState<ColumnChoice[]>([]);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const apiRef = useRef<GridApi<TData> | null>(null);
  const columnMenuRef = useRef<HTMLDivElement>(null);
  const columnMenuButtonRef = useRef<HTMLButtonElement>(null);
  const columnMenuId = useId();

  const defaultColDef = useMemo<ColDef<TData>>(
    () => ({
      filter: true,
      minWidth: 100,
      resizable: true,
      sortable: true,
    }),
    [],
  );

  const syncColumnChoices = useCallback((api: GridApi<TData> | null) => {
    if (!api) {
      return;
    }

    setColumnChoices(
      api
        .getAllGridColumns()
        .filter(
          (column) =>
            column.getColDef().suppressColumnsToolPanel !== true,
        )
        .map((column) => ({
          id: column.getColId(),
          label:
            api.getDisplayNameForColumn(column, "columnToolPanel").trim() ||
            humanizeColumnId(column.getColId()),
          visible: column.isVisible(),
        })),
    );
  }, []);

  const handleGridReady = useCallback(
    (event: GridReadyEvent<TData>) => {
      apiRef.current = event.api;
      event.api.setGridAriaProperty("label", ariaLabel);
      syncColumnChoices(event.api);
    },
    [ariaLabel, syncColumnChoices],
  );

  useEffect(() => {
    if (!columnMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !columnMenuRef.current?.contains(event.target)
      ) {
        setColumnMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setColumnMenuOpen(false);
        columnMenuButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [columnMenuOpen]);

  const visibleColumnCount = columnChoices.filter(
    (column) => column.visible,
  ).length;

  const setColumnVisible = useCallback(
    (columnId: string, visible: boolean) => {
      if (!visible && visibleColumnCount <= 1) {
        return;
      }

      setColumnChoices((current) =>
        current.map((column) =>
          column.id === columnId ? { ...column, visible } : column,
        ),
      );
      apiRef.current?.setColumnsVisible([columnId], visible);
    },
    [visibleColumnCount],
  );

  const showAllColumns = useCallback(() => {
    const columnIds = columnChoices.map((column) => column.id);
    setColumnChoices((current) =>
      current.map((column) => ({ ...column, visible: true })),
    );
    apiRef.current?.setColumnsVisible(columnIds, true);
  }, [columnChoices]);

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
          <div className="flex items-center gap-2">
            <div ref={columnMenuRef} className="relative">
              <button
                ref={columnMenuButtonRef}
                type="button"
                aria-controls={columnMenuId}
                aria-expanded={columnMenuOpen}
                aria-haspopup="dialog"
                disabled={columnChoices.length === 0}
                onClick={() => setColumnMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-md border border-rule px-3 py-2 text-sm text-muted transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Columns3 aria-hidden="true" className="size-4" />
                Columns
              </button>

              {columnMenuOpen ? (
                <div
                  id={columnMenuId}
                  role="dialog"
                  aria-label={`${ariaLabel} visible columns`}
                  className="absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border border-rule bg-background p-2 shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3 border-b border-rule px-2 pb-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted">
                      Visible columns
                    </span>
                    <button
                      type="button"
                      disabled={visibleColumnCount === columnChoices.length}
                      onClick={showAllColumns}
                      className="text-xs text-accent hover:underline disabled:cursor-default disabled:text-muted disabled:no-underline"
                    >
                      Show all
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {columnChoices.map((column) => {
                      const isLastVisible =
                        column.visible && visibleColumnCount === 1;

                      return (
                        <label
                          key={column.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-paper has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-55"
                        >
                          <input
                            type="checkbox"
                            checked={column.visible}
                            disabled={isLastVisible}
                            onChange={(event) =>
                              setColumnVisible(
                                column.id,
                                event.target.checked,
                              )
                            }
                            className="size-4 accent-accent"
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {column.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="border-t border-rule px-2 pt-2 text-xs text-muted">
                    At least one column must remain visible.
                  </p>
                </div>
              ) : null}
            </div>

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
              onColumnVisible={(event) => syncColumnChoices(event.api)}
              onFirstDataRendered={(event) => syncColumnChoices(event.api)}
              onGridReady={handleGridReady}
              onNewColumnsLoaded={(event) => syncColumnChoices(event.api)}
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
