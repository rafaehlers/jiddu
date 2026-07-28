import {
  AdminPage,
  AdminPanel,
  AdminSection,
} from "@/components/admin/admin-page";
import { configuredAdminEmails } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  createPlatformAccessAction,
  deletePlatformAccessAction,
  updatePlatformAccessAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Platform access · Jiddu",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  created?: string;
  updated?: string;
  deleted?: string;
  error?: string;
}>;

export default async function PlatformAccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = await searchParams;
  const grants = await prisma.platformAccessGrant.findMany({
    orderBy: { email: "asc" },
  });
  const adminEmails = configuredAdminEmails();
  const status = query.created
    ? "Access granted."
    : query.updated
      ? "Email updated."
      : query.deleted
        ? "Access removed."
        : query.error === "duplicate"
          ? "That email already has platform access."
          : query.error
            ? "Enter a valid email address."
            : null;

  return (
    <AdminPage
      title="Platform access"
      description="These verified WorkOS accounts use Jiddu's server-managed model providers without spending personal Jiddu Credits."
    >

        {status && (
          <p className="mb-5 rounded-md border border-rule bg-paper px-4 py-3 text-sm">
            {status}
          </p>
        )}

        <AdminPanel>
          <h2 className="font-serif text-xl mb-2">Grant access</h2>
          <form
            action={createPlatformAccessAction}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="person@example.com"
              aria-label="Email address"
              className="min-w-0 flex-1 rounded-md border border-rule bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity"
            >
              Add
            </button>
          </form>
        </AdminPanel>

        <AdminSection title="Managed allowlist">
          {grants.length === 0 ? (
            <p className="text-sm text-muted rounded-lg border border-rule p-5">
              No additional accounts have platform access.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {grants.map((grant) => (
                <div
                  key={grant.id}
                  className="rounded-lg border border-rule p-4 flex flex-col gap-3"
                >
                  <form
                    action={updatePlatformAccessAction}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <input type="hidden" name="id" value={grant.id} />
                    <input
                      type="email"
                      name="email"
                      required
                      defaultValue={grant.email}
                      aria-label={`Email for ${grant.email}`}
                      className="min-w-0 flex-1 rounded-md border border-rule bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-rule px-4 py-2 text-sm hover:border-foreground/50 transition-colors"
                    >
                      Save
                    </button>
                  </form>
                  <div className="flex items-center justify-between gap-3 text-xs text-muted">
                    <span>
                      Added {grant.createdAt.toLocaleDateString("en-US")}
                    </span>
                    <form action={deletePlatformAccessAction}>
                      <input type="hidden" name="id" value={grant.id} />
                      <button
                        type="submit"
                        className="text-[var(--severity-high)] hover:underline"
                      >
                        Remove
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminSection>

        <AdminPanel>
          <h2 className="font-serif text-xl mb-2">Administrator accounts</h2>
          <p className="text-sm text-muted mb-3">
            Verified accounts configured through <code>ADMIN_EMAILS</code>{" "}
            always receive platform access and cannot be removed here, so the
            admin cannot accidentally lock itself out.
          </p>
          <ul className="text-sm flex flex-col gap-1">
            {adminEmails.map((email) => (
              <li key={email}>{email}</li>
            ))}
          </ul>
        </AdminPanel>
    </AdminPage>
  );
}
