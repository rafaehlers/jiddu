import { cookies } from "next/headers";
import {
  AdminPage,
  AdminPanel,
  AdminSection,
  AdminTableShell,
} from "@/components/admin/admin-page";
import { prisma } from "@/lib/db";
import {
  assignApiKeyOwnerAction,
  createApiKeyAction,
  revokeApiKeyAction,
} from "./actions";
import { NEW_KEY_COOKIE } from "./cookie";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · API keys · Jiddu",
  robots: { index: false, follow: false },
};

export default async function AdminApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{
    created?: string;
    revoked?: string;
    assigned?: string;
    error?: string;
  }>;
}) {
  const jar = await cookies();
  const { created, revoked, assigned, error } = await searchParams;
  const newSecret = created ? jar.get(NEW_KEY_COOKIE)?.value : undefined;

  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <AdminPage
      title="API keys"
      description={
        <>
          Keys for the public REST API (<code>POST /api/v1/*</code>), sent by
          clients in the <code>X-Jiddu-Key</code> header.
        </>
      }
    >

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
        {assigned && (
          <div className="mb-4 text-sm text-muted bg-paper border border-rule rounded-md p-3">
            API key owner updated.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md border border-[var(--severity-high)]/40 p-3 text-sm text-[var(--severity-high)]">
            {error === "owner_unverified"
              ? "That WorkOS account has not verified its email."
              : "No WorkOS account was found for that email."}
          </div>
        )}

        {/* Create form */}
        <AdminPanel>
          <form action={createApiKeyAction} className="flex flex-col gap-3">
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
          <label className="flex flex-col gap-1 text-sm">
            <span>WorkOS owner email</span>
            <input
              type="email"
              name="ownerEmail"
              required
              placeholder="alice@example.com"
              className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
            />
            <span className="text-xs text-muted">
              Usage follows this account&apos;s included access, connected
              included platform access or Jiddu credit balance.
            </span>
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
              className="px-4 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
            >
              Generate key
            </button>
          </div>
          </form>
        </AdminPanel>

        {/* Existing keys */}
        <AdminSection title="Existing keys">
          <AdminTableShell>
          <table className="w-full text-sm">
            <thead className="bg-paper">
              <tr className="text-left text-muted">
                <th className="px-3 py-2 font-medium">Label</th>
                <th className="px-3 py-2 font-medium">Prefix</th>
                <th className="px-3 py-2 font-medium">WorkOS owner</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Last used</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted">
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
                  <td className="px-3 py-2 min-w-56">
                    <form
                      action={assignApiKeyOwnerAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="id" value={k.id} />
                      <input
                        type="email"
                        name="ownerEmail"
                        required
                        defaultValue={k.ownerEmail ?? ""}
                        placeholder="Assign owner"
                        aria-label={`WorkOS owner for ${k.label}`}
                        className="min-w-0 w-44 rounded border border-rule bg-background px-2 py-1 text-xs"
                      />
                      <button
                        type="submit"
                        className="text-xs text-muted hover:text-foreground"
                      >
                        Save
                      </button>
                    </form>
                    {!k.ownerWorkosUserId && (
                      <span className="mt-1 block text-xs text-[var(--severity-high)]">
                        Disabled until assigned
                      </span>
                    )}
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
          </AdminTableShell>
        </AdminSection>
    </AdminPage>
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
