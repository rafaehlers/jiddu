import Link from "next/link";
import {
  AccountAnalysesGrid,
  type AccountAnalysisGridRow,
} from "@/components/data-grid/account-analyses-grid";
import type {
  UserAnalysisKind,
  UserAnalysisRow,
} from "@/lib/user-analysis-history";

export function AccountAnalysisTable({
  rows,
}: {
  rows: UserAnalysisRow[];
}) {
  const gridRows = rows.map<AccountAnalysisGridRow>((row) => ({
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    kind: row.kind,
    model: row.model,
    source: row.source,
    sourceRef: row.title ? row.sourceRef : null,
    status: row.status,
    title: row.title ?? row.sourceRef ?? "(untitled)",
    viewerHref: viewerHref(row.kind, row.id),
  }));

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="mb-2 font-serif text-2xl">Analyses</h2>
        <p className="text-sm text-muted">
          Analyses run in the web app, with your API keys, or through MCP appear here.
        </p>
      </div>

      {gridRows.length === 0 ? (
        <p className="rounded-lg border border-rule p-5 text-sm text-muted">
          No analyses yet.{" "}
          <Link href="/" className="whitespace-nowrap">
            Run your first analysis →
          </Link>
        </p>
      ) : (
        <AccountAnalysesGrid rows={gridRows} />
      )}
    </section>
  );
}

function viewerHref(kind: UserAnalysisKind, id: string): string {
  const prefix = {
    fallacy: "a",
    factcheck: "f",
    neutrality: "n",
    explain: "e",
    slop: "s",
    review: "r",
  }[kind];
  return `/${prefix}/${id}`;
}
