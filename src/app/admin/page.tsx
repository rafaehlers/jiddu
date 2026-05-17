import Link from "next/link";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "./auth";
import { loginAction, logoutAction } from "./actions";

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

async function AdminList() {
  const analyses = await prisma.analysis.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      source: true,
      sourceRef: true,
      language: true,
      provider: true,
      model: true,
      score: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-serif text-3xl">Analyses</h1>
          <p className="text-sm text-muted mt-1">
            {analyses.length} total · newest first
          </p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm px-3 py-1.5 rounded-md border border-rule text-muted hover:text-foreground transition-colors"
          >
            Log out
          </button>
        </form>
      </div>

      <div className="overflow-x-auto border border-rule rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-paper">
            <tr className="text-left text-muted">
              <th className="px-3 py-2 font-medium">When</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Lang</th>
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium text-right">Score</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {analyses.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted">
                  No analyses yet.
                </td>
              </tr>
            )}
            {analyses.map((a) => (
              <tr key={a.id} className="border-t border-rule hover:bg-paper/50">
                <td className="px-3 py-2 whitespace-nowrap text-muted">
                  {formatDate(a.createdAt)}
                </td>
                <td className="px-3 py-2 max-w-[28rem]">
                  <Link
                    href={`/a/${a.id}`}
                    className="font-medium hover:underline truncate block"
                    title={a.title ?? a.sourceRef ?? a.id}
                  >
                    {a.title ?? a.sourceRef ?? "(untitled)"}
                  </Link>
                  {a.sourceRef && a.title && (
                    <div className="text-xs text-muted truncate">{a.sourceRef}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-muted">{a.source}</td>
                <td className="px-3 py-2 text-muted uppercase">{a.language ?? "—"}</td>
                <td className="px-3 py-2 text-muted whitespace-nowrap">{a.model}</td>
                <td className="px-3 py-2 text-right tabular-nums">{a.score}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={a.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
