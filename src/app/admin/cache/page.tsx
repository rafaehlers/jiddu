import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { formatAppDateTime } from "@/lib/date-time";
import { prisma } from "@/lib/db";
import { deleteCacheEntryAction, deleteExpiredCacheAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Cache · Jiddu",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

export default async function AdminCachePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(0, Number.parseInt(pageStr ?? "0", 10) || 0);

  const [rows, total, expiredCount] = await Promise.all([
    prisma.claimVerdict.findMany({
      orderBy: { cachedAt: "desc" },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    prisma.claimVerdict.count(),
    prisma.claimVerdict.count({ where: { expiresAt: { lt: new Date() } } }),
  ]);

  return (
    <AdminPage
      title="Claim verdict cache"
      description={`${total} total entries · ${expiredCount} expired · page ${page + 1}`}
      actions={
        expiredCount > 0 ? (
          <form action={deleteExpiredCacheAction}>
            <button
              type="submit"
              className="rounded-md border border-rule px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              Delete {expiredCount} expired
            </button>
          </form>
        ) : undefined
      }
    >

        <div className="overflow-x-auto border border-rule rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-paper">
              <tr className="text-left text-muted">
                <th className="px-3 py-2 font-medium">Cached</th>
                <th className="px-3 py-2 font-medium">Lang</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Verdict</th>
                <th className="px-3 py-2 font-medium text-right">Conf.</th>
                <th className="px-3 py-2 font-medium">Statement</th>
                <th className="px-3 py-2 font-medium">Expires</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted">
                    Cache is empty.
                  </td>
                </tr>
              )}
              {rows.map((r) => {
                const expired = r.expiresAt.getTime() < Date.now();
                return (
                  <tr
                    key={r.hash}
                    className={`border-t border-rule hover:bg-paper/50 ${
                      expired ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-muted">
                      {fmt(r.cachedAt)}
                    </td>
                    <td className="px-3 py-2 text-muted uppercase">{r.language}</td>
                    <td className="px-3 py-2 text-muted">{r.type}</td>
                    <td className="px-3 py-2">
                      <VerdictBadge v={r.verdict} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {Math.round(r.confidence * 100)}%
                    </td>
                    <td className="px-3 py-2 max-w-[28rem]">
                      <div className="truncate" title={r.statement}>
                        {r.statement}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-muted text-xs">
                      {expired ? <span className="text-[var(--severity-high)]">expired</span> : fmt(r.expiresAt)}
                    </td>
                    <td className="px-3 py-2">
                      <form action={deleteCacheEntryAction}>
                        <input type="hidden" name="hash" value={r.hash} />
                        <button
                          type="submit"
                          className="text-xs text-muted hover:text-[var(--severity-high)] transition-colors"
                        >
                          delete
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4 text-sm">
            {page > 0 ? (
              <Link
                href={`/admin/cache?page=${page - 1}`}
                className="text-muted hover:text-foreground transition-colors"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            {(page + 1) * PAGE_SIZE < total ? (
              <Link
                href={`/admin/cache?page=${page + 1}`}
                className="text-muted hover:text-foreground transition-colors"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </div>
        )}
    </AdminPage>
  );
}

function VerdictBadge({ v }: { v: string }) {
  const cls =
    v === "supported"
      ? "bg-emerald-500/15 text-emerald-500"
      : v === "contradicted"
        ? "bg-red-500/15 text-red-500"
        : v === "mixed"
          ? "bg-amber-500/15 text-amber-500"
          : "bg-paper text-muted";
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${cls}`}>
      {v}
    </span>
  );
}

function fmt(d: Date): string {
  return formatAppDateTime(d, "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
