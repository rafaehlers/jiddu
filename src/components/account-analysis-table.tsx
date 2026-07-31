import Link from "next/link";
import { formatAppDateTime } from "@/lib/date-time";
import type {
  UserAnalysisKind,
  UserAnalysisRow,
} from "@/lib/user-analysis-history";

export function AccountAnalysisTable({
  rows,
}: {
  rows: UserAnalysisRow[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-serif text-2xl mb-2">Analyses</h2>
        <p className="text-sm text-muted">
          Analyses started while signed in to this account appear here.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="bg-paper">
            <tr className="text-left text-muted">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted">
                  No analyses yet.{" "}
                  <Link href="/" className="whitespace-nowrap">
                    Run your first analysis →
                  </Link>
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={`${row.kind}:${row.id}`}
                className="border-t border-rule hover:bg-paper/50"
              >
                <td className="px-3 py-2 whitespace-nowrap text-muted">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-3 py-2">
                  <TypeBadge kind={row.kind} />
                </td>
                <td className="px-3 py-2 max-w-[24rem]">
                  <Link
                    href={viewerHref(row)}
                    className="block truncate font-medium hover:underline"
                    title={row.title ?? row.sourceRef ?? row.id}
                  >
                    {row.title ?? row.sourceRef ?? "(untitled)"}
                  </Link>
                  {row.sourceRef && row.title && (
                    <div className="truncate text-xs text-muted">
                      {row.sourceRef}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-muted">{row.source}</td>
                <td className="px-3 py-2 whitespace-nowrap text-muted">
                  {row.model}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function viewerHref(row: UserAnalysisRow): string {
  const prefix = {
    fallacy: "a",
    factcheck: "f",
    neutrality: "n",
    explain: "e",
    slop: "s",
    review: "r",
  }[row.kind];
  return `/${prefix}/${row.id}`;
}

function TypeBadge({ kind }: { kind: UserAnalysisKind }) {
  const cls = {
    fallacy: "bg-amber-500/15 text-amber-500",
    factcheck: "bg-blue-500/15 text-blue-500",
    neutrality: "bg-purple-500/15 text-purple-500",
    explain: "bg-teal-500/15 text-teal-500",
    slop: "bg-rose-500/15 text-rose-500",
    review: "bg-red-500/15 text-red-500",
  }[kind];
  const label = {
    fallacy: "Fallacy",
    factcheck: "Fact-check",
    neutrality: "Neutrality",
    explain: "Explain",
    slop: "Slop",
    review: "Review",
  }[kind];

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "failed"
      ? "bg-[color-mix(in_oklab,var(--severity-high)_15%,transparent)] text-[var(--severity-high)]"
      : status === "complete"
        ? "bg-paper text-foreground"
        : "bg-paper text-muted";

  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {status}
    </span>
  );
}

function formatDate(date: Date): string {
  return formatAppDateTime(date, "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
