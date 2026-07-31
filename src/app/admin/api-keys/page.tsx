import { cookies } from "next/headers";
import {
  AdminPage,
  AdminPanel,
  AdminSection,
} from "@/components/admin/admin-page";
import {
  AdminApiKeysGrid,
  type AdminApiKeyGridRow,
} from "@/components/data-grid/admin-api-keys-grid";
import { prisma } from "@/lib/db";
import { createApiKeyAction } from "./actions";
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
  const gridRows = keys.map<AdminApiKeyGridRow>((key) => ({
    createdAt: key.createdAt.toISOString(),
    id: key.id,
    label: key.label,
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    ownerEmail: key.ownerEmail ?? "",
    ownerWorkosUserId: key.ownerWorkosUserId,
    prefix: key.prefix,
    revokedAt: key.revokedAt?.toISOString() ?? null,
    status: key.revokedAt ? "revoked" : "active",
  }));

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
          <AdminApiKeysGrid rows={gridRows} />
        </AdminSection>
    </AdminPage>
  );
}
