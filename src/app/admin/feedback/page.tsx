import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "../auth";
import { resolveFeedbackAction, deleteFeedbackAction } from "./actions";
import type { Verdict } from "@/lib/verdict-schema";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Feedback · Jiddu",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

type Filter = "open" | "resolved" | "ignored" | "all";

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const jar = await cookies();
  if (!adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  const { filter: filterRaw, page: pageStr } = await searchParams;
  const filter: Filter =
    filterRaw === "resolved" || filterRaw === "ignored" || filterRaw === "all"
      ? filterRaw
      : "open";
  const page = Math.max(0, Number.parseInt(pageStr ?? "0", 10) || 0);
  const where = filter === "all" ? {} : { status: filter };

  const [rows, total, openCount] = await Promise.all([
    prisma.verdictFeedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    prisma.verdictFeedback.count({ where }),
    prisma.verdictFeedback.count({ where: { status: "open" } }),
  ]);

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl">Feedback</h1>
            <p className="text-sm text-muted mt-1">
              User-reported "wrong verdict" flags. {openCount} open ·{" "}
              {total} on this filter
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back to admin
          </Link>
        </div>

        <div className="flex items-center gap-2 mb-4 text-sm">
          {(["open", "resolved", "ignored", "all"] as const).map((f) => (
            <Link
              key={f}
              href={f === "open" ? "/admin/feedback" : `/admin/feedback?filter=${f}`}
              className={`px-3 py-1.5 rounded-md border transition-colors capitalize ${
                filter === f
                  ? "border-foreground bg-foreground text-background"
                  : "border-rule text-muted hover:text-foreground"
              }`}
            >
              {f}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {rows.length === 0 && (
            <div className="text-sm text-muted bg-paper border border-rule rounded-lg p-6 text-center">
              No feedback in this filter.
            </div>
          )}
          {rows.map((r) => {
            let verdict: Verdict | null = null;
            try {
              verdict = JSON.parse(r.verdictSnapshot);
            } catch {
              // ignore
            }
            return (
              <article
                key={r.id}
                className="bg-paper border border-rule rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-muted">
                  <span>{fmt(r.createdAt)}</span>
                  <span className="font-mono">{r.ip ?? "no-ip"}</span>
                  <StatusPill status={r.status} />
                  <Link
                    href={`/f/${r.factCheckId}#claim-${r.claimId}`}
                    target="_blank"
                    className="text-muted hover:text-foreground transition-colors ml-auto"
                  >
                    Open in viewer ↗
                  </Link>
                </div>

                <div className="text-sm font-medium">{r.statement}</div>

                {verdict && (
                  <div className="text-xs text-muted leading-snug">
                    <strong className="capitalize text-foreground">
                      {verdict.verdict}
                    </strong>{" "}
                    ({Math.round(verdict.confidence * 100)}%) —{" "}
                    {verdict.rationale}
                  </div>
                )}

                {r.userReason && (
                  <div className="text-sm bg-background border border-rule rounded-md p-3">
                    <p className="text-xs text-muted mb-1">User reason</p>
                    <p>{r.userReason}</p>
                  </div>
                )}

                {r.status === "open" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <form action={resolveFeedbackAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="resolved" />
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
                      >
                        Mark resolved
                      </button>
                    </form>
                    <form action={resolveFeedbackAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value="ignored" />
                      <button
                        type="submit"
                        className="text-xs px-3 py-1.5 rounded-md border border-rule text-muted hover:text-foreground transition-colors"
                      >
                        Ignore
                      </button>
                    </form>
                    <form action={deleteFeedbackAction} className="ml-auto">
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs text-muted hover:text-[var(--severity-high)] transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-xs text-muted pt-1">
                    {r.resolvedAt && <span>Resolved {fmt(r.resolvedAt)}</span>}
                    {r.resolutionNote && <span>· {r.resolutionNote}</span>}
                    <form action={deleteFeedbackAction} className="ml-auto">
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="hover:text-[var(--severity-high)] transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 text-sm">
            {page > 0 ? (
              <Link
                href={`/admin/feedback?filter=${filter}&page=${page - 1}`}
                className="text-muted hover:text-foreground transition-colors"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {(page + 1) * PAGE_SIZE < total ? (
              <Link
                href={`/admin/feedback?filter=${filter}&page=${page + 1}`}
                className="text-muted hover:text-foreground transition-colors"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls =
    status === "open"
      ? "bg-[color-mix(in_oklab,var(--severity-high)_15%,transparent)] text-[var(--severity-high)]"
      : status === "resolved"
        ? "bg-emerald-500/15 text-emerald-500"
        : "bg-paper text-muted";
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

function fmt(d: Date): string {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
