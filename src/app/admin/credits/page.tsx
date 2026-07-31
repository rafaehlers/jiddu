import Link from "next/link";
import {
  AdminPage,
  AdminPanel,
  AdminSection,
} from "@/components/admin/admin-page";
import {
  AdminCreditAccountsGrid,
  AdminCreditTransactionsGrid,
  type AdminCreditAccountGridRow,
  type AdminCreditTransactionGridRow,
} from "@/components/data-grid/admin-credits-grids";
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
  const accountRows = accounts.map<AdminCreditAccountGridRow>((account) => ({
    available: account.balance - account.reserved,
    balance: account.balance,
    email: account.email,
    reserved: account.reserved,
    workosUserId: account.workosUserId,
  }));
  const transactionRows =
    transactions.map<AdminCreditTransactionGridRow>((transaction) => {
      const providerUsage = [
        transaction.providerCostMicros !== null
          ? PROVIDER_USD.format(
              transaction.providerCostMicros / 1_000_000,
            )
          : null,
        transaction.totalTokens !== null
          ? `${transaction.totalTokens.toLocaleString("en-US")} tokens`
          : null,
      ].filter((value): value is string => value !== null);

      return {
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        createdAt: transaction.createdAt.toISOString(),
        feature: transaction.feature?.replaceAll("_", " ") ?? "—",
        id: transaction.id,
        kind: transaction.kind,
        note: transaction.note ?? "—",
        providerUsage,
        user:
          accountEmails.get(transaction.workosUserId) ??
          transaction.workosUserId,
      };
    });

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
          <AdminCreditAccountsGrid rows={accountRows} />
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
          <AdminCreditTransactionsGrid rows={transactionRows} />
        </AdminSection>
    </AdminPage>
  );
}

function CreditAdjustmentForm() {
  return (
    <form
      action={adjustCreditsAction}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="person@example.com"
        aria-label="WorkOS account email"
        className="min-w-0 flex-1 rounded-md border border-rule bg-background px-3 py-2 text-sm"
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
        className="w-full rounded-md border border-rule bg-background px-3 py-2 text-sm sm:w-32"
      />
      <input
        type="text"
        name="note"
        maxLength={500}
        placeholder="Reason (optional)"
        aria-label="Adjustment reason"
        className="min-w-0 flex-1 rounded-md border border-rule bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
      >
        Apply
      </button>
    </form>
  );
}
