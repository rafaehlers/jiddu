import { AdminPage as AdminPageLayout } from "@/components/admin/admin-page";
import {
  AdminAnalysesGrid,
  type AdminAnalysisGridRow,
} from "@/components/data-grid/admin-analyses-grid";
import { formatAppDateTime } from "@/lib/date-time";
import { prisma } from "@/lib/db";
import { getOpenRouterCredits, isCreditsSnapshot } from "@/lib/openrouter-credits";
import { getWorkOSUserEmails } from "@/lib/workos-users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Jiddu", robots: { index: false, follow: false } };

const PROVIDER_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

export default async function AdminPage() {
  return <AdminList />;
}

type AdminRow = {
  kind:
    | "fallacy"
    | "factcheck"
    | "neutrality"
    | "explain"
    | "slop"
    | "review";
  id: string;
  title: string | null;
  source: string;
  sourceRef: string | null;
  language: string | null;
  model: string;
  status: string;
  signal: string; // right-aligned number column: score for fallacy, claim count for factcheck
  ownerWorkosUserId: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
};

const nonDemoWhere = {
  NOT: { model: { startsWith: "demo" } },
} as const;

async function AdminList() {
  // Pull all six row types in parallel, normalize to a common shape, then
  // merge by createdAt desc so the admin sees one unified table.
  const [analyses, factchecks, neutralities, explanations, slopChecks, paperReviews] = await Promise.all([
    prisma.analysis.findMany({
      where: nonDemoWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        sourceRef: true,
        language: true,
        model: true,
        score: true,
        status: true,
        ownerWorkosUserId: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
    prisma.factCheck.findMany({
      where: nonDemoWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        sourceRef: true,
        language: true,
        model: true,
        claims: true,
        status: true,
        ownerWorkosUserId: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
    prisma.neutrality.findMany({
      where: nonDemoWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        sourceRef: true,
        language: true,
        model: true,
        findings: true,
        verdict: true,
        status: true,
        ownerWorkosUserId: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
    prisma.explanation.findMany({
      where: nonDemoWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        sourceRef: true,
        language: true,
        model: true,
        findings: true,
        level: true,
        status: true,
        ownerWorkosUserId: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
    prisma.slopCheck.findMany({
      where: nonDemoWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        sourceRef: true,
        language: true,
        model: true,
        score: true,
        status: true,
        ownerWorkosUserId: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
    prisma.paperReview.findMany({
      where: nonDemoWhere,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        source: true,
        sourceRef: true,
        language: true,
        model: true,
        status: true,
        review: true,
        ownerWorkosUserId: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
  ]);

  const credits = await getOpenRouterCredits();

  const rows: AdminRow[] = [
    ...analyses.map<AdminRow>((a) => ({
      kind: "fallacy",
      id: a.id,
      title: a.title,
      source: a.source,
      sourceRef: a.sourceRef,
      language: a.language,
      model: a.model,
      status: a.status,
      signal: String(a.score ?? 0),
      ownerWorkosUserId: a.ownerWorkosUserId,
      createdAt: a.createdAt,
      reviewedAt: a.reviewedAt,
    })),
    ...factchecks.map<AdminRow>((f) => {
      let claimCount = 0;
      try {
        const parsed = JSON.parse(f.claims);
        if (Array.isArray(parsed)) claimCount = parsed.length;
      } catch {
        // ignore
      }
      return {
        kind: "factcheck" as const,
        id: f.id,
        title: f.title,
        source: f.source,
        sourceRef: f.sourceRef,
        language: f.language,
        model: f.model,
        status: f.status,
        signal: String(claimCount),
        ownerWorkosUserId: f.ownerWorkosUserId,
        createdAt: f.createdAt,
        reviewedAt: f.reviewedAt,
      };
    }),
    ...neutralities.map<AdminRow>((n) => {
      let findingsCount = 0;
      try {
        const parsed = JSON.parse(n.findings);
        if (Array.isArray(parsed)) findingsCount = parsed.length;
      } catch {
        // ignore
      }
      return {
        kind: "neutrality" as const,
        id: n.id,
        title: n.title,
        source: n.source,
        sourceRef: n.sourceRef,
        language: n.language,
        model: n.model,
        status: n.status,
        // Show the verdict on the signal column for neutrality rows; it's
        // more meaningful than a raw issue count.
        signal: `${findingsCount} · ${n.verdict.replace(/_/g, " ")}`,
        ownerWorkosUserId: n.ownerWorkosUserId,
        createdAt: n.createdAt,
        reviewedAt: n.reviewedAt,
      };
    }),
    ...explanations.map<AdminRow>((e) => {
      let findingsCount = 0;
      try {
        const parsed = JSON.parse(e.findings);
        if (Array.isArray(parsed)) findingsCount = parsed.length;
      } catch {
        // ignore
      }
      return {
        kind: "explain" as const,
        id: e.id,
        title: e.title,
        source: e.source,
        sourceRef: e.sourceRef,
        language: e.language,
        model: e.model,
        status: e.status,
        // Paragraph count + the reading level chosen for the explanation.
        signal: `${findingsCount} · ${e.level}`,
        ownerWorkosUserId: e.ownerWorkosUserId,
        createdAt: e.createdAt,
        reviewedAt: e.reviewedAt,
      };
    }),
    ...slopChecks.map<AdminRow>((s) => ({
      kind: "slop",
      id: s.id,
      title: s.title,
      source: s.source,
      sourceRef: s.sourceRef,
      language: s.language,
      model: s.model,
      status: s.status,
      signal: String(s.score ?? 0),
      ownerWorkosUserId: s.ownerWorkosUserId,
      createdAt: s.createdAt,
      reviewedAt: s.reviewedAt,
    })),
    ...paperReviews.map<AdminRow>((review) => {
      let signal = "—";
      try {
        const parsed = JSON.parse(review.review ?? "null") as {
          recommendation?: string;
          weaknesses?: unknown[];
        } | null;
        if (parsed) {
          signal = `${parsed.weaknesses?.length ?? 0} · ${parsed.recommendation ?? "pending"}`;
        }
      } catch {
        // ignore malformed/incomplete review JSON
      }
      return {
        kind: "review",
        id: review.id,
        title: review.title,
        source: review.source,
        sourceRef: review.sourceRef,
        language: review.language,
        model: review.model,
        status: review.status,
        signal,
        ownerWorkosUserId: review.ownerWorkosUserId,
        createdAt: review.createdAt,
        reviewedAt: review.reviewedAt,
      };
    }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const [userEmails, usageTransactions] = await Promise.all([
    getWorkOSUserEmails(rows.map((row) => row.ownerWorkosUserId)),
    prisma.jidduCreditTransaction.findMany({
      where: {
        resourceId: { in: rows.map((row) => row.id) },
        OR: [
          { providerCostMicros: { not: null } },
          { totalTokens: { not: null } },
        ],
      },
      select: {
        providerCostMicros: true,
        resourceId: true,
        totalTokens: true,
      },
    }),
  ]);
  const usageByResource = new Map<
    string,
    { providerCostMicros: number | null; totalTokens: number | null }
  >();
  for (const transaction of usageTransactions) {
    if (!transaction.resourceId) continue;
    const current = usageByResource.get(transaction.resourceId) ?? {
      providerCostMicros: null,
      totalTokens: null,
    };
    if (transaction.providerCostMicros !== null) {
      current.providerCostMicros =
        (current.providerCostMicros ?? 0) + transaction.providerCostMicros;
    }
    if (transaction.totalTokens !== null) {
      current.totalTokens =
        (current.totalTokens ?? 0) + transaction.totalTokens;
    }
    usageByResource.set(transaction.resourceId, current);
  }
  const gridRows = rows.map<AdminAnalysisGridRow>((row) => ({
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    kind: row.kind,
    language: row.language?.toUpperCase() ?? "—",
    model: row.model,
    owner: row.ownerWorkosUserId
      ? userEmails.get(row.ownerWorkosUserId) ?? "Unavailable"
      : "—",
    providerUsage: formatProviderUsage(usageByResource.get(row.id)),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    signal: row.signal,
    source: row.source,
    sourceRef: row.title ? row.sourceRef : null,
    status: row.status,
    title: row.title ?? row.sourceRef ?? "(untitled)",
    viewerHref: viewerHref(row.kind, row.id),
  }));

  return (
    <AdminPageLayout
      title="Analyses"
      description="Review every analysis, its owner, status and human-review state."
    >
      {/* Compact dashboard row — credits + counts per analysis kind. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <CreditsStat credits={credits} />
        <Stat label="Total" value={rows.length} />
        <Stat label="Fallacies" value={analyses.length} accent="amber" />
        <Stat label="Fact-checks" value={factchecks.length} accent="blue" />
        <Stat
          label="Neutrality"
          value={neutralities.length}
          accent="purple"
        />
        <Stat label="Explain" value={explanations.length} accent="teal" />
        <Stat label="Slop" value={slopChecks.length} accent="rose" />
        <Stat label="Reviews" value={paperReviews.length} accent="red" />
      </div>

      <AdminAnalysesGrid rows={gridRows} />
    </AdminPageLayout>
  );
}

function formatProviderUsage(
  usage:
    | { providerCostMicros: number | null; totalTokens: number | null }
    | undefined,
): string[] {
  if (!usage) return [];
  return [
    usage.providerCostMicros !== null
      ? PROVIDER_USD.format(usage.providerCostMicros / 1_000_000)
      : null,
    usage.totalTokens !== null
      ? `${usage.totalTokens.toLocaleString("en-US")} tokens`
      : null,
  ].filter((value): value is string => value !== null);
}

function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string | number;
  accent?: "amber" | "blue" | "red" | "purple" | "teal" | "rose";
  hint?: string;
}) {
  const accentCls =
    accent === "amber"
      ? "text-amber-500"
      : accent === "blue"
        ? "text-blue-500"
        : accent === "red"
          ? "text-[var(--severity-high)]"
          : accent === "purple"
            ? "text-purple-500"
            : accent === "teal"
              ? "text-teal-500"
              : accent === "rose"
                ? "text-rose-500"
                : "";
  return (
    <div className="bg-paper border border-rule rounded-lg p-3 flex flex-col gap-0.5">
      <p className="text-xs text-muted uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-mono tabular-nums ${accentCls}`}>{value}</p>
      {hint && <p className="text-xs text-muted truncate">{hint}</p>}
    </div>
  );
}

function CreditsStat({
  credits,
}: {
  credits: Awaited<ReturnType<typeof getOpenRouterCredits>>;
}) {
  if (!isCreditsSnapshot(credits)) {
    return (
      <a
        href="https://openrouter.ai/credits"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-paper border border-rule rounded-lg p-3 flex flex-col gap-0.5 hover:border-foreground transition-colors"
      >
        <p className="text-xs text-muted uppercase tracking-wide">Balance</p>
        <p className="text-2xl font-mono tabular-nums text-muted">—</p>
        <p className="text-xs text-muted truncate" title={credits.error}>
          {credits.error}
        </p>
      </a>
    );
  }
  const low = credits.remaining < Math.max(2, credits.totalCredits * 0.1);
  return (
    <a
      href="https://openrouter.ai/credits"
      target="_blank"
      rel="noopener noreferrer"
      title={`Updated ${formatAppDateTime(credits.fetchedAt, "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`}
      className={`border rounded-lg p-3 flex flex-col gap-0.5 transition-colors ${
        low
          ? "bg-[color-mix(in_oklab,var(--severity-high)_8%,transparent)] border-[var(--severity-high)]/40 hover:border-[var(--severity-high)]"
          : "bg-paper border-rule hover:border-foreground"
      }`}
    >
      <p className="text-xs text-muted uppercase tracking-wide">Balance</p>
      <p
        className={`text-2xl font-mono tabular-nums ${
          low ? "text-[var(--severity-high)]" : ""
        }`}
      >
        ${credits.remaining.toFixed(2)}
      </p>
      <p className="text-xs text-muted truncate">
        ${credits.totalUsage.toFixed(2)} / ${credits.totalCredits.toFixed(2)} used
      </p>
    </a>
  );
}

function viewerHref(kind: AdminRow["kind"], id: string): string {
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
