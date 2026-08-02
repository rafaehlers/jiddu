import Link from "next/link";
import { createAccountApiKeyAction } from "@/app/account/api-keys/actions";
import { CopyCode } from "@/components/copy-code";
import { RevokeAccountApiKeyForm } from "@/components/revoke-account-api-key-form";
import { formatAppDateTime } from "@/lib/date-time";

export type AccountApiKeyRow = {
  id: string;
  label: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const ERROR_MESSAGES: Record<string, string> = {
  active_limit:
    "You can have up to five active API keys. Revoke one before creating another.",
  email_unverified: "Verify your account email before creating an API key.",
  invalid_label: "Use a label between 1 and 80 characters.",
  rate_limit: "Too many keys were created recently. Try again in one hour.",
};

export function AccountApiKeys({
  keys,
  newSecret,
  created,
  revoked,
  error,
}: {
  keys: AccountApiKeyRow[];
  newSecret?: string;
  created: boolean;
  revoked: boolean;
  error?: string;
}) {
  const activeCount = keys.filter((key) => key.revokedAt === null).length;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-serif text-2xl mb-2">REST API keys</h2>
        <p className="max-w-2xl text-sm text-muted">
          Use these keys with the public REST API. Requests follow this
          account&apos;s included access or Jiddu Credit balance. Never share a
          key or embed it in a public website.
        </p>
      </div>

      {newSecret ? (
        <div
          role="status"
          className="rounded-md border border-emerald-600/40 bg-emerald-600/10 p-4"
        >
          <p className="mb-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            New key created. Copy it now — it won&apos;t be shown again.
          </p>
          <div className="flex items-stretch gap-2">
            <code className="min-w-0 flex-1 overflow-x-auto rounded border border-rule bg-background px-3 py-2 text-xs select-all">
              {newSecret}
            </code>
            <CopyCode value={newSecret} />
          </div>
        </div>
      ) : created ? (
        <div className="rounded-md border border-rule bg-paper p-3 text-sm text-muted">
          The key was created, but its one-time display has expired. Revoke it
          and create a new one if you did not copy it.
        </div>
      ) : null}

      {revoked && (
        <div
          role="status"
          className="rounded-md border border-rule bg-paper p-3 text-sm text-muted"
        >
          API key revoked.
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-md border border-[var(--severity-high)]/40 p-3 text-sm text-[var(--severity-high)]"
        >
          {ERROR_MESSAGES[error] ?? "The API key request could not be completed."}
        </div>
      )}

      <div className="rounded-lg border border-rule bg-paper p-5 sm:p-6">
        <form action={createAccountApiKeyAction} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-medium">Create a key</span>
            <span className="text-xs text-muted">
              {activeCount} of 5 active keys
            </span>
          </div>
          <label className="flex max-w-xl flex-col gap-1 text-sm">
            <span>Label</span>
            <input
              type="text"
              name="label"
              required
              minLength={1}
              maxLength={80}
              placeholder="e.g. Chrome extension or research agent"
              autoComplete="off"
              className="rounded-md border border-rule bg-background px-3 py-2 outline-none focus:border-accent"
            />
            <span className="text-xs text-muted">
              Choose a name that identifies where this key will be used.
            </span>
          </label>
          <div>
            <button
              type="submit"
              disabled={activeCount >= 5}
              className="rounded-md bg-accent px-4 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate API key
            </button>
          </div>
        </form>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-serif text-xl">Your keys</h3>
          <Link href="/api-access" className="text-sm">
            API instructions
          </Link>
        </div>
        {keys.length === 0 ? (
          <div className="rounded-lg border border-dashed border-rule p-6 text-sm text-muted">
            You have not created any API keys yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-rule bg-paper">
            {keys.map((key, index) => (
              <div
                key={key.id}
                className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                  index > 0 ? "border-t border-rule" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium break-words">{key.label}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${
                        key.revokedAt
                          ? "border-rule text-muted"
                          : "border-emerald-600/40 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {key.revokedAt ? "Revoked" : "Active"}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted">
                    {key.prefix}••••••••
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Created {formatDate(key.createdAt)}
                    {key.lastUsedAt
                      ? ` · Last used ${formatDate(key.lastUsedAt)}`
                      : " · Never used"}
                  </p>
                </div>
                {!key.revokedAt && (
                  <RevokeAccountApiKeyForm id={key.id} label={key.label} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function formatDate(value: string): string {
  return formatAppDateTime(new Date(value), "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
