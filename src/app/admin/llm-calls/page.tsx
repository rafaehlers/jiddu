import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { prisma } from "@/lib/db";
import { LLM_CALL_RETENTION_DAYS } from "@/lib/llm/llm-call-log";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · LLM calls · Jiddu",
  robots: { index: false, follow: false },
};

const WINDOWS = {
  "24h": { label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  "7d": { label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  "30d": { label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
} as const;
type WindowKey = keyof typeof WINDOWS;

type GroupRow = {
  operation: string;
  model: string;
  calls: number;
  errors: number;
  aborted: number;
  p50: number | null;
  p95: number | null;
  firstChunkP50: number | null;
  promptTokens: number;
  completionTokens: number;
  costMicros: number | null;
};

export default async function AdminLlmCallsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>;
}) {
  const { window } = await searchParams;
  const windowKey: WindowKey =
    window && window in WINDOWS ? (window as WindowKey) : "24h";
  const now = new Date();
  const since = new Date(now.getTime() - WINDOWS[windowKey].ms);

  const [groups, recentErrors] = await Promise.all([
    prisma.$queryRaw<GroupRow[]>`
      SELECT
        "operation",
        "model",
        COUNT(*)::int AS "calls",
        COUNT(*) FILTER (WHERE "status" = 'error')::int AS "errors",
        COUNT(*) FILTER (WHERE "status" = 'aborted')::int AS "aborted",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "durationMs")::float8 AS "p50",
        percentile_cont(0.95) WITHIN GROUP (ORDER BY "durationMs")::float8 AS "p95",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY "firstChunkMs")::float8 AS "firstChunkP50",
        COALESCE(SUM("promptTokens"), 0)::float8 AS "promptTokens",
        COALESCE(SUM("completionTokens"), 0)::float8 AS "completionTokens",
        SUM("costMicros")::float8 AS "costMicros"
      FROM "LlmCall"
      WHERE "createdAt" >= ${since}
      GROUP BY "operation", "model"
      ORDER BY "costMicros" DESC NULLS LAST, "calls" DESC
    `,
    prisma.llmCall.findMany({
      where: { createdAt: { gte: since }, status: { not: "ok" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        operation: true,
        model: true,
        status: true,
        httpStatus: true,
        errorCode: true,
        errorMessage: true,
        retryCount: true,
        durationMs: true,
      },
    }),
  ]);

  const totals = groups.reduce(
    (acc, row) => ({
      calls: acc.calls + row.calls,
      errors: acc.errors + row.errors,
      aborted: acc.aborted + row.aborted,
      tokens: acc.tokens + row.promptTokens + row.completionTokens,
      costMicros: acc.costMicros + (row.costMicros ?? 0),
    }),
    { calls: 0, errors: 0, aborted: 0, tokens: 0, costMicros: 0 },
  );

  return (
    <AdminPage
      title="LLM calls"
      description={`Every OpenRouter chat completion attempt, including SDK retries. Metadata only — no prompts or model output. Kept for ${LLM_CALL_RETENTION_DAYS} days.`}
      actions={
        <nav aria-label="Time window" className="flex gap-2 text-sm">
          {(Object.keys(WINDOWS) as WindowKey[]).map((key) => (
            <Link
              key={key}
              href={`/admin/llm-calls?window=${key}`}
              aria-current={key === windowKey ? "page" : undefined}
              className={`rounded-md border px-2.5 py-1 ${
                key === windowKey
                  ? "border-foreground font-medium"
                  : "border-rule text-muted hover:text-foreground"
              }`}
            >
              {key}
            </Link>
          ))}
        </nav>
      }
    >
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label={`Calls · ${windowKey}`} value={totals.calls.toLocaleString("en-US")} />
        <Card
          label="Error rate"
          value={totals.calls === 0 ? "—" : percent(totals.errors, totals.calls)}
          sub={totals.aborted > 0 ? `${totals.aborted} aborted` : undefined}
          accent={totals.errors > 0 ? "red" : undefined}
        />
        <Card label="Tokens" value={compact(totals.tokens)} />
        <Card label="OpenRouter cost" value={usd(totals.costMicros)} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wide text-muted">
          By operation and model
        </h2>
        {groups.length === 0 ? (
          <p className="text-sm text-muted">
            No LLM calls in the last {WINDOWS[windowKey].label}.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-rule bg-paper">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2 font-medium">Operation</th>
                  <th className="px-3 py-2 font-medium">Model</th>
                  <Th>Calls</Th>
                  <Th>Errors</Th>
                  <Th>p50</Th>
                  <Th>p95</Th>
                  <Th>1st chunk</Th>
                  <Th>Tokens in / out</Th>
                  <Th>Cost</Th>
                </tr>
              </thead>
              <tbody>
                {groups.map((row) => (
                  <tr
                    key={`${row.operation}:${row.model}`}
                    className="border-b border-rule last:border-0"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{row.operation}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.model}</td>
                    <Td>{row.calls.toLocaleString("en-US")}</Td>
                    <Td
                      className={row.errors > 0 ? "text-[var(--severity-high)]" : ""}
                    >
                      {row.errors > 0 ? `${row.errors} · ${percent(row.errors, row.calls)}` : "0"}
                    </Td>
                    <Td>{seconds(row.p50)}</Td>
                    <Td>{seconds(row.p95)}</Td>
                    <Td>{seconds(row.firstChunkP50)}</Td>
                    <Td>
                      {compact(row.promptTokens)} / {compact(row.completionTokens)}
                    </Td>
                    <Td>{row.costMicros === null ? "—" : usd(row.costMicros)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm uppercase tracking-wide text-muted">
          Recent failures
        </h2>
        {recentErrors.length === 0 ? (
          <p className="text-sm text-muted">No failed or aborted calls.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-rule rounded-lg border border-rule bg-paper">
            {recentErrors.map((call) => (
              <li key={call.id} className="flex flex-col gap-1 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-mono text-xs text-muted">
                    {call.createdAt.toISOString().replace("T", " ").slice(0, 19)}
                  </span>
                  <span className="font-mono text-xs">{call.operation}</span>
                  <span className="font-mono text-xs text-muted">{call.model}</span>
                  <span
                    className={`text-xs font-medium ${
                      call.status === "error" ? "text-[var(--severity-high)]" : "text-muted"
                    }`}
                  >
                    {call.status}
                    {call.httpStatus ? ` · HTTP ${call.httpStatus}` : ""}
                    {call.errorCode ? ` · ${call.errorCode}` : ""}
                    {call.retryCount > 0 ? ` · retry ${call.retryCount}` : ""}
                  </span>
                  <span className="text-xs text-muted">{seconds(call.durationMs)}</span>
                </div>
                {call.errorMessage && (
                  <p className="text-xs text-muted">{call.errorMessage}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminPage>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-right font-medium">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2 text-right font-mono tabular-nums text-xs ${className}`}>
      {children}
    </td>
  );
}

function Card({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "red";
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-rule bg-paper p-3">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p
        className={`font-mono text-2xl tabular-nums ${
          accent === "red" ? "text-[var(--severity-high)]" : ""
        }`}
      >
        {value}
      </p>
      {sub && <p className="truncate text-xs text-muted">{sub}</p>}
    </div>
  );
}

function seconds(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return "—";
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

function percent(part: number, whole: number): string {
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function compact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function usd(micros: number): string {
  const dollars = micros / 1_000_000;
  return dollars >= 1 ? `$${dollars.toFixed(2)}` : `$${dollars.toFixed(4)}`;
}
