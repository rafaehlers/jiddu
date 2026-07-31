import Link from "next/link";
import {
  AdminPage,
  AdminPanel,
  AdminSection,
  AdminTableShell,
} from "@/components/admin/admin-page";
import { JidduCreditRateTable } from "@/components/jiddu-credit-rate-table";
import { prisma } from "@/lib/db";
import { loadSettings } from "@/lib/settings";
import { adjustCreditsAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Jiddu credits",
  robots: { index: false, follow: false },
};

const PROVIDER_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

export default async function AdminCreditsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const [accounts, transactions, settings] = await Promise.all([
    prisma.jidduCreditAccount.findMany({
      orderBy: [{ balance: "desc" }, { email: "asc" }],
    }),
    prisma.jidduCreditTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    loadSettings(),
  ]);
  const message = query.adjusted
    ? "Credit balance updated."
    : query.error === "user_not_found"
      ? "No WorkOS account was found for that email."
      : query.error === "insufficient_balance"
        ? "The adjustment would make the available balance negative."
        : query.error
          ? "Enter a valid non-zero whole-number adjustment."
          : null;
  const accountEmails = new Map(
    accounts.map((account) => [account.workosUserId, account.email]),
  );

  return (
    <AdminPage
      title="Jiddu credits"
      description="Grant or remove application credits independently of Jiddu's upstream OpenRouter balance."
      actions={
        <>
          <Link
            href="/admin/credits/guide"
            className="rounded-md border border-rule px-3 py-1.5"
          >
            Billing guide
          </Link>
          <Link
            href="/admin/credits/packages"
            className="rounded-md border border-rule px-3 py-1.5"
          >
            Packages
          </Link>
        </>
      }
    >

        {message && (
          <p className="rounded-md border border-rule bg-paper px-4 py-3 text-sm">
            {message}
          </p>
        )}

        <AdminPanel>
          <h2 className="mb-2 font-serif text-xl">Adjust a balance</h2>
          <p className="mb-4 text-sm text-muted">
            The email must already belong to a WorkOS account. Use a positive
            amount to grant credits and a negative amount to remove them.
          </p>
          <CreditAdjustmentForm />
        </AdminPanel>

        <AdminSection title="Accounts">
          {accounts.length === 0 ? (
            <p className="rounded-lg border border-rule p-5 text-sm text-muted">
              No Jiddu credit accounts yet.
            </p>
          ) : (
            <AdminTableShell>
              <table className="w-full min-w-[48rem] text-sm">
                <thead className="bg-paper text-left text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 text-right font-medium">Balance</th>
                    <th className="px-4 py-3 text-right font-medium">Reserved</th>
                    <th className="px-4 py-3 text-right font-medium">Available</th>
                    <th className="px-4 py-3 font-medium">Adjust</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.workosUserId} className="border-t border-rule">
                      <td className="px-4 py-3">
                        <span className="block font-medium">{account.email}</span>
                        <span className="block text-xs text-muted">
                          {account.workosUserId}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {account.balance}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {account.reserved}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {account.balance - account.reserved}
                      </td>
                      <td className="px-4 py-3">
                        <CreditAdjustmentForm email={account.email} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTableShell>
          )}
        </AdminSection>

        <AdminSection title="Rate card">
          <JidduCreditRateTable
            liveMinimumCredits={settings["credits.liveTranscription"]}
            liveUsdPerMinute={
              settings["credits.liveTranscriptionUsdPerMinute"]
            }
          />
        </AdminSection>

        <AdminSection title="Recent transactions">
          <AdminTableShell>
            <table className="w-full min-w-[64rem] text-sm">
              <thead className="bg-paper text-left text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 font-medium">Feature</th>
                  <th className="px-4 py-3 text-right font-medium">Change</th>
                  <th className="px-4 py-3 text-right font-medium">
                    Provider usage
                  </th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3 font-medium">Note</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted">
                      No credit transactions yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-t border-rule">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {transaction.createdAt.toLocaleString("en-US")}
                      </td>
                      <td className="px-4 py-3">
                        {accountEmails.get(transaction.workosUserId) ??
                          transaction.workosUserId}
                      </td>
                      <td className="px-4 py-3">{transaction.kind}</td>
                      <td className="px-4 py-3">
                        {transaction.feature?.replaceAll("_", " ") ?? "—"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium tabular-nums ${
                          transaction.amount > 0
                            ? "text-emerald-600"
                            : transaction.amount < 0
                              ? "text-[var(--severity-high)]"
                              : "text-muted"
                        }`}
                      >
                        {transaction.kind === "included_usage" ? (
                          "Included"
                        ) : (
                          <>
                            {transaction.amount > 0 ? "+" : ""}
                            {transaction.amount}
                          </>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-xs text-muted">
                        {transaction.providerCostMicros !== null ||
                        transaction.totalTokens !== null ? (
                          <>
                            {transaction.providerCostMicros !== null && (
                              <span className="block tabular-nums">
                                {PROVIDER_USD.format(
                                  transaction.providerCostMicros / 1_000_000,
                                )}
                              </span>
                            )}
                            {transaction.totalTokens !== null && (
                              <span className="block tabular-nums">
                                {transaction.totalTokens.toLocaleString(
                                  "en-US",
                                )}{" "}
                                tokens
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {transaction.balanceAfter}
                      </td>
                      <td className="max-w-64 px-4 py-3 text-muted">
                        {transaction.note ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </AdminTableShell>
        </AdminSection>
    </AdminPage>
  );
}

function CreditAdjustmentForm({
  email,
  compact = false,
}: {
  email?: string;
  compact?: boolean;
}) {
  return (
    <form
      action={adjustCreditsAction}
      className={`flex gap-2 ${compact ? "items-center" : "flex-col sm:flex-row"}`}
    >
      <input
        type="email"
        name="email"
        required
        readOnly={Boolean(email)}
        defaultValue={email}
        placeholder="person@example.com"
        aria-label="WorkOS account email"
        className={`${compact ? "sr-only" : "min-w-0 flex-1"} rounded-md border border-rule bg-background px-3 py-2 text-sm`}
      />
      <input
        type="number"
        name="amount"
        required
        step="1"
        min="-1000000"
        max="1000000"
        placeholder="+100"
        aria-label="Credit adjustment"
        className={`${compact ? "w-24" : "w-full sm:w-32"} rounded-md border border-rule bg-background px-3 py-2 text-sm`}
      />
      {!compact && (
        <input
          type="text"
          name="note"
          maxLength={500}
          placeholder="Reason (optional)"
          aria-label="Adjustment reason"
          className="min-w-0 flex-1 rounded-md border border-rule bg-background px-3 py-2 text-sm"
        />
      )}
      <button
        type="submit"
        className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
      >
        Apply
      </button>
    </form>
  );
}
