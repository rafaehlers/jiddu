import Link from "next/link";
import {
  AdminPage as AdminPageLayout,
} from "@/components/admin/admin-page";
import { AdminTableScrollShell } from "@/components/admin/admin-table-scroll-shell";
import { formatAppDateTime } from "@/lib/date-time";
import { prisma } from "@/lib/db";
import { toggleReviewedAction } from "./review-actions";
import { getOpenRouterCredits, isCreditsSnapshot } from "@/lib/openrouter-credits";
import { getWorkOSUserEmails } from "@/lib/workos-users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Jiddu", robots: { index: false, follow: false } };

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

async function AdminList() {
  // Pull all six row types in parallel, normalize to a common shape, then
  // merge by createdAt desc so the admin sees one unified table.
  const [analyses, factchecks, neutralities, explanations, slopChecks, paperReviews] = await Promise.all([
    prisma.analysis.findMany({
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
  const userEmails = await getWorkOSUserEmails(
    rows.map((row) => row.ownerWorkosUserId),
  );

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

      <AdminTableScrollShell>
        <table className="w-full min-w-[72rem] text-sm">
          <thead className="bg-paper">
            <tr className="text-left text-muted">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Lang</th>
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium text-right" title="Score for fallacy, claim count for fact-check">
                Score / Claims
              </th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium" title="Mark as human-reviewed (removes the warning banner on the viewer)">
                Rev.
              </th>
              <th className="px-3 py-2 font-medium">User</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted">
                  No analyses yet.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const viewerHref =
                r.kind === "fallacy"
                  ? `/a/${r.id}`
                  : r.kind === "factcheck"
                    ? `/f/${r.id}`
                    : r.kind === "neutrality"
                      ? `/n/${r.id}`
                      : r.kind === "slop"
                        ? `/s/${r.id}`
                        : r.kind === "review"
                          ? `/r/${r.id}`
                          : `/e/${r.id}`;
              return (
                <tr key={`${r.kind}:${r.id}`} className="border-t border-rule hover:bg-paper/50">
                  <td className="px-3 py-2 whitespace-nowrap text-muted">
                    {formatDate(r.createdAt)}
                  </td>
                  <td className="px-3 py-2">
                    <TypeBadge kind={r.kind} />
                  </td>
                  <td className="px-3 py-2 max-w-[28rem]">
                    <Link
                      href={viewerHref}
                      className="font-medium hover:underline truncate block"
                      title={r.title ?? r.sourceRef ?? r.id}
                    >
                      {r.title ?? r.sourceRef ?? "(untitled)"}
                    </Link>
                    {r.sourceRef && r.title && (
                      <div className="text-xs text-muted truncate">{r.sourceRef}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted">{r.source}</td>
                  <td className="px-3 py-2 text-muted uppercase">{r.language ?? "—"}</td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">{r.model}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.signal}</td>
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-3 py-2">
                    <form action={toggleReviewedAction}>
                      <input type="hidden" name="kind" value={r.kind} />
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        title={
                          r.reviewedAt
                            ? `Reviewed ${formatDate(r.reviewedAt)} — click to unmark`
                            : "Mark as reviewed (removes warning banner)"
                        }
                        className={`text-xs w-6 h-6 inline-flex items-center justify-center rounded-full border transition-colors ${
                          r.reviewedAt
                            ? "border-emerald-500/40 text-emerald-500 hover:border-emerald-500"
                            : "border-rule text-muted hover:text-foreground"
                        }`}
                      >
                        {r.reviewedAt ? "✓" : "○"}
                      </button>
                    </form>
                  </td>
                  <td
                    className="max-w-56 px-3 py-2 text-muted"
                    title={
                      r.ownerWorkosUserId
                        ? userEmails.get(r.ownerWorkosUserId) ??
                          r.ownerWorkosUserId
                        : "Legacy analysis without an owner"
                    }
                  >
                    <span className="block truncate">
                      {r.ownerWorkosUserId
                        ? userEmails.get(r.ownerWorkosUserId) ?? "Unavailable"
                        : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </AdminTableScrollShell>
    </AdminPageLayout>
  );
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

function TypeBadge({ kind }: { kind: AdminRow["kind"] }) {
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
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${cls}`}>
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
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

function formatDate(d: Date): string {
  return formatAppDateTime(d, "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
