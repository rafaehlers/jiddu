import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "./auth";
import { loginAction, logoutAction } from "./actions";
import { getOpenRouterCredits, isCreditsSnapshot } from "@/lib/openrouter-credits";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Jiddu", robots: { index: false, follow: false } };

type SearchParams = Promise<{ error?: string }>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { error } = await searchParams;
  const jar = await cookies();
  const authed = adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value);

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 flex-1">
        {authed ? <AdminList /> : <LoginForm error={error} />}
      </main>
      <SiteFooter />
    </>
  );
}

function LoginForm({ error }: { error?: string }) {
  const message =
    error === "wrong"
      ? "Wrong password."
      : error === "not_configured"
        ? "ADMIN_PASSWORD is not set on the server."
        : null;
  return (
    <div className="max-w-sm mx-auto mt-12">
      <h1 className="font-serif text-3xl mb-2">Admin</h1>
      <p className="text-sm text-muted mb-6">Enter the admin password to view all analyses.</p>
      <form action={loginAction} className="flex flex-col gap-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
        />
        {message && (
          <p className="text-sm text-[var(--severity-high)]">{message}</p>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

type AdminRow = {
  kind: "fallacy" | "factcheck";
  id: string;
  title: string | null;
  source: string;
  sourceRef: string | null;
  language: string | null;
  model: string;
  status: string;
  signal: string; // right-aligned number column: score for fallacy, claim count for factcheck
  createdAt: Date;
};

async function AdminList() {
  // Pull both row types in parallel, normalize to a common shape, then
  // merge by createdAt desc so the admin sees one unified table.
  const [analyses, factchecks] = await Promise.all([
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
        createdAt: true,
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
        createdAt: true,
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
      createdAt: a.createdAt,
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
        createdAt: f.createdAt,
      };
    }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-serif text-3xl">Analyses</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="text-sm px-3 py-1.5 rounded-md border border-rule text-muted hover:text-foreground transition-colors"
          >
            Settings →
          </Link>
          <Link
            href="/admin/cache"
            className="text-sm px-3 py-1.5 rounded-md border border-rule text-muted hover:text-foreground transition-colors"
          >
            Cache →
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm px-3 py-1.5 rounded-md border border-rule text-muted hover:text-foreground transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </div>

      {/* Compact dashboard row — credits + analysis counts side by side. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <CreditsStat credits={credits} />
        <Stat label="Total" value={rows.length} />
        <Stat label="Fallacies" value={analyses.length} accent="amber" />
        <Stat label="Fact-checks" value={factchecks.length} accent="blue" />
      </div>

      <div className="overflow-x-auto border border-rule rounded-lg">
        <table className="w-full text-sm">
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
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-muted">
                  No analyses yet.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const viewerHref = r.kind === "fallacy" ? `/a/${r.id}` : `/f/${r.id}`;
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
  accent?: "amber" | "blue" | "red";
  hint?: string;
}) {
  const accentCls =
    accent === "amber"
      ? "text-amber-500"
      : accent === "blue"
        ? "text-blue-500"
        : accent === "red"
          ? "text-[var(--severity-high)]"
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
      title={`Updated ${credits.fetchedAt.toLocaleString("en-US", {
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

function TypeBadge({ kind }: { kind: "fallacy" | "factcheck" }) {
  const cls =
    kind === "fallacy"
      ? "bg-amber-500/15 text-amber-500"
      : "bg-blue-500/15 text-blue-500";
  const label = kind === "fallacy" ? "Fallacy" : "Fact-check";
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
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
