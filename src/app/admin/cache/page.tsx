import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import {
  AdminCacheGrid,
  type AdminCacheGridRow,
} from "@/components/data-grid/admin-cache-grid";
import { prisma } from "@/lib/db";
import { deleteExpiredCacheAction } from "./actions";

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
  const now = Date.now();
  const gridRows = rows.map<AdminCacheGridRow>((row) => ({
    cachedAt: row.cachedAt.toISOString(),
    confidence: row.confidence,
    expired: row.expiresAt.getTime() < now,
    expiresAt: row.expiresAt.toISOString(),
    hash: row.hash,
    language: row.language.toUpperCase(),
    statement: row.statement,
    type: row.type,
    verdict: row.verdict,
  }));

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

        <AdminCacheGrid rows={gridRows} />

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
