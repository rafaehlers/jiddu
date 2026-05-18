import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "../auth";
import type { Verdict } from "@/lib/verdict-schema";
import type { Claim } from "@/lib/claims-schema";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Metrics · Jiddu",
  robots: { index: false, follow: false },
};

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function AdminMetricsPage() {
  const jar = await cookies();
  if (!adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  const now = new Date();
  const since24h = new Date(now.getTime() - DAY_MS);
  const since7d = new Date(now.getTime() - 7 * DAY_MS);
  const since30d = new Date(now.getTime() - 30 * DAY_MS);

  // Pull everything we need in parallel. Cheap on SQLite.
  const [
    analysesTotal,
    analyses24h,
    analyses7d,
    analyses30d,
    factchecksTotal,
    factchecks24h,
    factchecks7d,
    factchecks30d,
    cacheTotal,
    cacheExpired,
    feedbackOpen,
    feedbackResolved,
    feedbackIgnored,
    allFactchecks,
  ] = await Promise.all([
    prisma.analysis.count(),
    prisma.analysis.count({ where: { createdAt: { gte: since24h } } }),
    prisma.analysis.count({ where: { createdAt: { gte: since7d } } }),
    prisma.analysis.count({ where: { createdAt: { gte: since30d } } }),
    prisma.factCheck.count(),
    prisma.factCheck.count({ where: { createdAt: { gte: since24h } } }),
    prisma.factCheck.count({ where: { createdAt: { gte: since7d } } }),
    prisma.factCheck.count({ where: { createdAt: { gte: since30d } } }),
    prisma.claimVerdict.count(),
    prisma.claimVerdict.count({ where: { expiresAt: { lt: now } } }),
    prisma.verdictFeedback.count({ where: { status: "open" } }),
    prisma.verdictFeedback.count({ where: { status: "resolved" } }),
    prisma.verdictFeedback.count({ where: { status: "ignored" } }),
    // Pull all FactCheck rows (lean projection) for the aggregates below.
    // For a real load this would warrant a materialized table; for now,
    // SQLite + a few KB per row is fine.
    prisma.factCheck.findMany({
      select: {
        claims: true,
        verdicts: true,
        verifyStartedAt: true,
        verifyFinishedAt: true,
        verifyStatus: true,
      },
    }),
  ]);

  // Aggregate across all factchecks: claim count, verdict count, verdict
  // distribution, average verify duration.
  let totalClaims = 0;
  let totalVerdicts = 0;
  const verdictCounts: Record<string, number> = {
    supported: 0,
    contradicted: 0,
    mixed: 0,
    unverified: 0,
  };
  const typeCounts: Record<string, number> = {
    numeric: 0,
    date: 0,
    quote: 0,
    causal: 0,
    categorical: 0,
  };
  const verifyDurations: number[] = [];
  let verifyCompleteCount = 0;

  for (const fc of allFactchecks) {
    try {
      const claims = JSON.parse(fc.claims) as Claim[];
      totalClaims += claims.length;
      for (const c of claims) {
        if (c.type && typeCounts[c.type] !== undefined) typeCounts[c.type]++;
      }
    } catch {
      // ignore
    }
    try {
      const verdicts = JSON.parse(fc.verdicts) as Verdict[];
      totalVerdicts += verdicts.length;
      for (const v of verdicts) {
        if (v.verdict && verdictCounts[v.verdict] !== undefined) {
          verdictCounts[v.verdict]++;
        }
      }
    } catch {
      // ignore
    }
    if (
      fc.verifyStatus === "complete" &&
      fc.verifyStartedAt &&
      fc.verifyFinishedAt
    ) {
      verifyCompleteCount++;
      verifyDurations.push(
        fc.verifyFinishedAt.getTime() - fc.verifyStartedAt.getTime(),
      );
    }
  }

  verifyDurations.sort((a, b) => a - b);
  const p50 = percentile(verifyDurations, 0.5);
  const p95 = percentile(verifyDurations, 0.95);
  const verdictTotal = Object.values(verdictCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 flex-1 flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl">Metrics</h1>
            <p className="text-sm text-muted mt-1">
              Aggregate stats over the whole DB. Recomputed on each page load.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back to admin
          </Link>
        </div>

        {/* Volume — over time */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm text-muted uppercase tracking-wide">Volume</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card label="Fallacy · 24h" value={analyses24h} sub={`${analyses7d} / 7d`} />
            <Card label="Fallacy · 30d" value={analyses30d} sub={`${analysesTotal} all-time`} />
            <Card label="Fact-check · 24h" value={factchecks24h} sub={`${factchecks7d} / 7d`} accent="blue" />
            <Card label="Fact-check · 30d" value={factchecks30d} sub={`${factchecksTotal} all-time`} accent="blue" />
          </div>
        </section>

        {/* Fact-check internals */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm text-muted uppercase tracking-wide">
            Fact-check pipeline
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card label="Total claims" value={totalClaims} />
            <Card
              label="Avg claims / extraction"
              value={
                factchecksTotal === 0
                  ? "—"
                  : (totalClaims / factchecksTotal).toFixed(1)
              }
            />
            <Card label="Total verifications" value={totalVerdicts} />
            <Card
              label="Avg verify duration"
              value={verifyCompleteCount === 0 ? "—" : `${(p50 / 1000).toFixed(1)}s`}
              sub={verifyCompleteCount === 0 ? "" : `p95 ${(p95 / 1000).toFixed(1)}s`}
            />
          </div>
        </section>

        {/* Verdict distribution */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm text-muted uppercase tracking-wide">
            Verdict distribution
          </h2>
          <div className="bg-paper border border-rule rounded-lg p-4 flex flex-col gap-3">
            {verdictTotal === 0 ? (
              <p className="text-sm text-muted">No verdicts yet.</p>
            ) : (
              (
                ["supported", "contradicted", "mixed", "unverified"] as const
              ).map((v) => {
                const n = verdictCounts[v];
                const pct = (n / verdictTotal) * 100;
                const cls =
                  v === "supported"
                    ? "bg-emerald-500"
                    : v === "contradicted"
                      ? "bg-red-500"
                      : v === "mixed"
                        ? "bg-amber-500"
                        : "bg-rule";
                return (
                  <div key={v} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize">{v}</span>
                      <span className="text-muted font-mono tabular-nums">
                        {n} · {pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={`h-full ${cls}`}
                        style={{ width: `${pct.toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {verdictCounts.unverified > 0 && verdictTotal > 0 && (
            <p className="text-xs text-muted">
              Unverified rate:{" "}
              <strong>
                {((verdictCounts.unverified / verdictTotal) * 100).toFixed(1)}%
              </strong>{" "}
              — Roadmap target: under 20%. High values usually mean Sonar's
              retrieval is underperforming for the kind of claims you're
              submitting.
            </p>
          )}
        </section>

        {/* Claim type distribution */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm text-muted uppercase tracking-wide">
            Claim types extracted
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(
              ["numeric", "date", "quote", "causal", "categorical"] as const
            ).map((tp) => (
              <Card key={tp} label={tp} value={typeCounts[tp]} />
            ))}
          </div>
        </section>

        {/* Cache + feedback */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm text-muted uppercase tracking-wide">
            Cache and feedback
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card
              label="Cache entries"
              value={cacheTotal}
              sub={
                cacheExpired > 0
                  ? `${cacheExpired} expired`
                  : "all fresh"
              }
            />
            <Card
              label="Feedback open"
              value={feedbackOpen}
              accent={feedbackOpen > 0 ? "red" : undefined}
            />
            <Card label="Feedback resolved" value={feedbackResolved} />
            <Card label="Feedback ignored" value={feedbackIgnored} />
          </div>
        </section>

        <p className="text-xs text-muted">
          Note: precise cache-hit rate requires persisting hit/miss events
          (not done yet). The roadmap recommends adding that when load
          warrants — for now, the ratio of cache entries to total
          verifications is a rough proxy.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}

function Card({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "red";
}) {
  const accentCls =
    accent === "blue"
      ? "text-blue-500"
      : accent === "red"
        ? "text-[var(--severity-high)]"
        : "";
  return (
    <div className="bg-paper border border-rule rounded-lg p-3 flex flex-col gap-0.5">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-mono tabular-nums ${accentCls}`}>{value}</p>
      {sub && <p className="text-xs text-muted truncate">{sub}</p>}
    </div>
  );
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}
