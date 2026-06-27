import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { prisma } from "@/lib/db";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "../auth";
import { createApiKeyAction, revokeApiKeyAction, NEW_KEY_COOKIE } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · API keys · Jiddu",
  robots: { index: false, follow: false },
};

export default async function AdminApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; revoked?: string }>;
}) {
  const jar = await cookies();
  if (!adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  const { created, revoked } = await searchParams;
  const newSecret = created ? jar.get(NEW_KEY_COOKIE)?.value : undefined;

  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl">API keys</h1>
            <p className="text-sm text-muted mt-1">
              Keys for the public REST API (POST /api/v1/*). Sent by clients in
              the <code>X-Jiddu-Key</code> header.
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back to admin
          </Link>
        </div>

        {newSecret && (
          <div className="mb-6 text-sm bg-emerald-500/10 border border-emerald-500/30 rounded-md p-4 flex flex-col gap-2">
            <span className="font-medium text-emerald-500">
              New key created — copy it now, it won&apos;t be shown again.
            </span>
            <code className="block bg-background border border-rule rounded px-3 py-2 font-mono text-xs break-all select-all">
              {newSecret}
            </code>
          </div>
        )}
        {revoked && (
          <div className="mb-4 text-sm text-muted bg-paper border border-rule rounded-md p-3">
            Key revoked.
          </div>
        )}

        {/* Create form */}
        <form
          action={createApiKeyAction}
          className="flex flex-col gap-3 border border-rule rounded-lg p-4 mb-8"
        >
          <span className="font-medium text-sm">Create a key</span>
          <label className="flex flex-col gap-1 text-sm">
            <span>Label</span>
            <input
              type="text"
              name="label"
              required
              placeholder="e.g. research-agent, alice@example.com"
              className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
            />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span>Burst override (optional)</span>
              <input
                type="number"
                name="rateCapacity"
                min="1"
                placeholder="default from settings"
                className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Per-hour override (optional)</span>
              <input
                type="number"
                name="ratePerHour"
                min="0"
                placeholder="default from settings"
                className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
              />
            </label>
          </div>
          <div>
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              Generate key
            </button>
          </div>
        </form>

        {/* Existing keys */}
        <div className="overflow-x-auto border border-rule rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-paper">
              <tr className="text-left text-muted">
                <th className="px-3 py-2 font-medium">Label</th>
                <th className="px-3 py-2 font-medium">Prefix</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Last used</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    No keys yet.
                  </td>
                </tr>
              )}
              {keys.map((k) => (
                <tr key={k.id} className="border-t border-rule hover:bg-paper/50">
                  <td className="px-3 py-2 font-medium">{k.label}</td>
                  <td className="px-3 py-2 font-mono text-xs text-muted">
                    {k.prefix}…
                  </td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">
                    {formatDate(k.createdAt)}
                  </td>
                  <td className="px-3 py-2 text-muted whitespace-nowrap">
                    {k.lastUsedAt ? formatDate(k.lastUsedAt) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {k.revokedAt ? (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-[color-mix(in_oklab,var(--severity-high)_15%,transparent)] text-[var(--severity-high)]">
                        revoked
                      </span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500">
                        active
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {!k.revokedAt && (
                      <form action={revokeApiKeyAction}>
                        <input type="hidden" name="id" value={k.id} />
                        <button
                          type="submit"
                          className="text-xs text-muted hover:text-[var(--severity-high)] transition-colors"
                        >
                          Revoke
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />
    </>
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
