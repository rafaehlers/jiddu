import type { Metadata } from "next";
import { withAuth } from "@workos-inc/authkit-nextjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountAnalysisTable } from "@/components/account-analysis-table";
import { AccountIdentity } from "@/components/account-identity";
import { CopyCode } from "@/components/copy-code";
import { JidduCreditRateTable } from "@/components/jiddu-credit-rate-table";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { effectiveAnalysisAccessMode } from "@/lib/analysis-access";
import { isWorkOSConfigured, mcpResourceUrl } from "@/lib/auth-config";
import {
  getOpenRouterCredits,
  isCreditsSnapshot,
} from "@/lib/openrouter-credits";
import { listUserAnalyses } from "@/lib/user-analysis-history";
import { getJidduCreditSnapshot } from "@/lib/jiddu-credits";
import { prisma } from "@/lib/db";
import { loadSettings } from "@/lib/settings";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-billing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account · Jiddu",
  robots: { index: false, follow: false },
};

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const configured = isWorkOSConfigured();
  if (!configured) {
    return (
      <>
        <SiteHeader variant="guide" />
        <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-12">
          <h1 className="font-serif text-4xl mb-4">Account</h1>
          <p className="text-muted">
            Authentication is ready in the codebase but still needs the WorkOS
            and session secrets in this environment.
          </p>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { user } = await withAuth();
  if (!user) redirect("/login?returnTo=/account");
  const query = await searchParams;
  const activeTab =
    query.tab === "analyses"
      ? "analyses"
      : query.tab === "credits"
        ? "credits"
        : "profile";
  const checkoutSessionId =
    typeof query.session_id === "string" ? query.session_id : null;
  let checkoutFulfilled = false;
  let checkoutPending = false;
  if (
    activeTab === "credits" &&
    query.checkout === "success" &&
    checkoutSessionId
  ) {
    try {
      const result = await fulfillStripeCheckoutSession(
        checkoutSessionId,
        user.id,
      );
      checkoutFulfilled = Boolean(result.purchase);
      checkoutPending = !result.purchase;
    } catch (error) {
      console.error("Could not confirm Stripe Checkout return:", error);
      checkoutPending = true;
    }
  }
  const accessMode = await effectiveAnalysisAccessMode(user);
  const jidduCredits =
    activeTab === "profile"
      ? await getJidduCreditSnapshot(user.id)
      : { balance: 0, reserved: 0, available: 0 };
  const creditTransactions =
    activeTab === "credits"
      ? await prisma.jidduCreditTransaction.findMany({
          where: { workosUserId: user.id },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
      : [];
  const creditSettings =
    activeTab === "credits" ? await loadSettings() : null;
  const platformCredits =
    activeTab === "profile" && accessMode === "platform"
      ? await getOpenRouterCredits()
      : null;
  const platformCreditsRemaining =
    platformCredits && isCreditsSnapshot(platformCredits)
      ? platformCredits.remaining
      : null;
  const analysisRows =
    activeTab === "analyses" ? await listUserAnalyses(user.id) : [];

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-sm text-muted mb-2">Signed in as {user.email}</p>
            <h1 className="font-serif text-4xl sm:text-5xl">Your account</h1>
          </div>

          <nav
            aria-label="Account sections"
            className="flex gap-6 overflow-x-auto border-b border-rule"
          >
            <AccountTab href="/account" active={activeTab === "profile"}>
              Profile
            </AccountTab>
            <AccountTab
              href="/account?tab=analyses"
              active={activeTab === "analyses"}
            >
              Analyses
            </AccountTab>
            <AccountTab
              href="/account?tab=credits"
              active={activeTab === "credits"}
            >
              Credit activity
            </AccountTab>
          </nav>

          {activeTab === "profile" ? (
            <>
              <AccountIdentity />

              {accessMode === "platform" && (
                <section className="rounded-lg border border-rule bg-paper p-5 sm:p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-serif text-2xl">
                        Jiddu platform access
                      </h2>
                      <span className="rounded-md border border-rule px-4 py-2 text-sm text-muted whitespace-nowrap">
                        Included
                      </span>
                    </div>
                    <p className="text-sm text-foreground/85 max-w-xl">
                      Your verified WorkOS account has included access to
                      Jiddu&apos;s server-managed model providers. Analyses do
                      not consume your personal credit balance.
                    </p>
                    {platformCreditsRemaining !== null && (
                      <p className="mt-2 text-sm text-muted">
                        Shared API balance:{" "}
                        <span className="font-medium tabular-nums text-foreground">
                          {USD.format(platformCreditsRemaining)}
                        </span>
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section className="rounded-lg border border-rule bg-paper p-5 sm:p-6">
                <h2 className="font-serif text-2xl mb-2">MCP for agents</h2>
                <p className="text-sm text-foreground/85 mb-3">
                  {accessMode === "platform"
                    ? "Ready. Compatible MCP clients will open Jiddu sign-in automatically and use your Jiddu platform access."
                    : "Ready. Compatible MCP clients will open Jiddu sign-in automatically. Tool calls reserve and spend Jiddu Credits from this account."}
                </p>
                <div className="mb-3 flex items-stretch gap-2">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded border border-rule px-3 py-2 text-sm">
                    {mcpResourceUrl()}
                  </code>
                  <CopyCode value={mcpResourceUrl()} />
                </div>
                <Link href="/api-access" className="text-sm">
                  MCP setup instructions
                </Link>
              </section>

              <section className="rounded-lg border border-rule bg-paper p-5 sm:p-6">
                <h2 className="font-serif text-2xl mb-2">Jiddu credits</h2>
                <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
                  <div>
                    <p className="text-3xl font-medium tabular-nums">
                      {jidduCredits.available}
                    </p>
                    <p className="text-sm text-muted">available credits</p>
                  </div>
                  {jidduCredits.reserved > 0 && (
                    <div>
                      <p className="text-xl tabular-nums">
                        {jidduCredits.reserved}
                      </p>
                      <p className="text-sm text-muted">
                        temporarily reserved
                      </p>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-muted">
                  {accessMode === "platform"
                    ? "Your included platform access does not consume this personal balance."
                    : "Jiddu uses this balance for web, REST API and hosted MCP analyses made with its server-managed model credentials."}
                </p>
                <p className="mt-2 text-xs text-muted">
                  Need more credits?{" "}
                  <Link href="/pricing">Buy a one-time credit pack</Link>.
                </p>
              </section>

            </>
          ) : activeTab === "analyses" ? (
            <AccountAnalysisTable rows={analysisRows} />
          ) : (
            <section className="flex flex-col gap-4">
              {query.checkout === "success" && (
                <div
                  role="status"
                  className="rounded-md border border-emerald-600/40 bg-emerald-600/10 px-4 py-3 text-sm"
                >
                  {checkoutFulfilled
                    ? "Payment confirmed. Your Jiddu Credits have been added."
                    : checkoutPending
                      ? "Your payment is still being confirmed. Stripe will add the credits automatically as soon as it completes."
                      : "Payment received. Your credits are being confirmed by Stripe."}
                </div>
              )}
              <div>
                <h2 className="font-serif text-2xl mb-2">Credit activity</h2>
                <p className="text-sm text-muted">
                  Purchases, grants, adjustments and recorded usage for this
                  account.
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-rule">
                <table className="w-full min-w-[36rem] text-sm">
                  <thead className="bg-paper text-left text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">When</th>
                      <th className="px-4 py-3 font-medium">Activity</th>
                      <th className="px-4 py-3 text-right font-medium">
                        Change
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Tokens used
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-10 text-center text-muted"
                        >
                          No credit activity yet.
                        </td>
                      </tr>
                    ) : (
                      creditTransactions.map((transaction) => (
                        <tr
                          key={transaction.id}
                          className="border-t border-rule"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-muted">
                            {transaction.createdAt.toLocaleString("en-US")}
                          </td>
                          <td className="px-4 py-3">
                            {transaction.feature
                              ? transaction.feature.replaceAll("_", " ")
                              : transaction.note || transaction.kind}
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
                            {transaction.totalTokens !== null ? (
                              <span className="block tabular-nums">
                                {transaction.totalTokens.toLocaleString(
                                  "en-US",
                                )}{" "}
                                tokens
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {transaction.balanceAfter}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <h2 className="font-serif text-2xl mb-3">
                  Credit reservation estimates
                </h2>
                <JidduCreditRateTable
                  liveTranscriptionCredits={
                    creditSettings?.["credits.liveTranscription"]
                  }
                />
              </div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function AccountTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
        active
          ? "border-accent-hi text-accent-hi"
          : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}
