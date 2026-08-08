import type { Metadata } from "next";
import { withAuth } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AccountApiKeys,
  type AccountApiKeyRow,
} from "@/components/account-api-keys";
import { AccountAnalysisTable } from "@/components/account-analysis-table";
import { AccountIdentity } from "@/components/account-identity";
import { AccountInvites } from "@/components/account-invites";
import { AccountReviewJobs } from "@/components/account-review-jobs";
import { AccountSupportForm } from "@/components/account-support-form";
import { CopyCode } from "@/components/copy-code";
import {
  AccountCreditActivityGrid,
  type AccountCreditActivityGridRow,
} from "@/components/data-grid/account-credit-activity-grid";
import { JidduCreditRateTable } from "@/components/jiddu-credit-rate-table";
import { PageTitle } from "@/components/page-title";
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
import { getInvitationAccountOverview } from "@/lib/invitations";
import { prisma } from "@/lib/db";
import { loadSettings } from "@/lib/settings";
import { fulfillStripeCheckoutSession } from "@/lib/stripe-billing";
import {
  listPaperReviewJobs,
  mapPaperReviewJobStatus,
} from "@/lib/api/paper-review";
import { ACCOUNT_NEW_KEY_COOKIE } from "./api-keys/cookie";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Account · Jiddu",
  robots: { index: false, follow: false },
};

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
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
        <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-12">
          <PageTitle className="mb-4">Account</PageTitle>
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
        : query.tab === "api"
          ? "api"
          : query.tab === "invites"
            ? "invites"
            : query.tab === "support"
              ? "support"
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
          select: {
            id: true,
            createdAt: true,
            feature: true,
            note: true,
            kind: true,
            amount: true,
            totalTokens: true,
            metadata: true,
            balanceAfter: true,
          },
        })
      : [];
  const creditSettings =
    activeTab === "credits" ? await loadSettings() : null;
  const invitationSettings =
    activeTab === "invites" ? await loadSettings() : null;
  const invitationOverview = invitationSettings
    ? await getInvitationAccountOverview({
        globalLimit: invitationSettings["invites.globalLimit"],
        perUserLimit: invitationSettings["invites.perUserLimit"],
        rewardCredits: invitationSettings["invites.acceptanceCredits"],
        workosUserId: user.id,
      })
    : null;
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
  const apiKeys =
    activeTab === "api"
      ? await prisma.apiKey.findMany({
          where: { ownerWorkosUserId: user.id },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            label: true,
            prefix: true,
            createdAt: true,
            lastUsedAt: true,
            revokedAt: true,
          },
        })
      : [];
  const apiKeyRows = apiKeys.map<AccountApiKeyRow>((key) => ({
    id: key.id,
    label: key.label,
    prefix: key.prefix,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
    revokedAt: key.revokedAt?.toISOString() ?? null,
  }));
  const newApiKeySecret =
    activeTab === "api" && query.created
      ? (await cookies()).get(ACCOUNT_NEW_KEY_COOKIE)?.value
      : undefined;
  const reviewJobs = (await listPaperReviewJobs(user.id, 5)).map((row) =>
    mapPaperReviewJobStatus(row),
  );
  const creditActivityRows =
    creditTransactions.map<AccountCreditActivityGridRow>((transaction) => ({
      activity:
        transaction.feature === "live_transcription" &&
        transaction.note === "Live transcription and analysis usage"
          ? "live session"
          : transaction.feature === "live_diarization"
            ? "live speaker identification"
            : transaction.feature
              ? transaction.feature.replaceAll("_", " ")
              : transaction.note || transaction.kind,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      createdAt: transaction.createdAt.toISOString(),
      id: transaction.id,
      kind: transaction.kind,
      providerUsage: formatProviderUsage(
        transaction.totalTokens,
        transaction.metadata,
      ),
    }));

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-sm text-muted mb-2">Signed in as {user.email}</p>
            <PageTitle>Your account</PageTitle>
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
            <AccountTab href="/account?tab=api" active={activeTab === "api"}>
              API keys
            </AccountTab>
            <AccountTab
              href="/account?tab=invites"
              active={activeTab === "invites"}
            >
              Invites
            </AccountTab>
            <AccountTab
              href="/account?tab=support"
              active={activeTab === "support"}
            >
              Support
            </AccountTab>
          </nav>

          <AccountReviewJobs initialJobs={reviewJobs} />

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
          ) : activeTab === "api" ? (
            <AccountApiKeys
              keys={apiKeyRows}
              newSecret={newApiKeySecret}
              created={query.created === "1"}
              revoked={query.revoked === "1"}
              error={typeof query.error === "string" ? query.error : undefined}
            />
          ) : activeTab === "support" ? (
            <AccountSupportForm email={user.email} />
          ) : activeTab === "invites" && invitationOverview ? (
            <AccountInvites overview={invitationOverview} />
          ) : (
            <section className="flex flex-col gap-4">
              {query.inviteAccepted === "1" && (
                <div
                  role="status"
                  className="rounded-md border border-emerald-600/40 bg-emerald-600/10 px-4 py-3 text-sm"
                >
                  Invitation accepted. Your Jiddu Credits have been added.
                </div>
              )}
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
              <AccountCreditActivityGrid rows={creditActivityRows} />
              <div className="mt-4">
                <h2 className="font-serif text-2xl mb-3">
                  Credit reservation estimates
                </h2>
                <JidduCreditRateTable
                  liveMinimumCredits={
                    creditSettings?.["credits.liveTranscription"]
                  }
                  liveUsdPerMinute={
                    creditSettings?.[
                      "credits.liveTranscriptionUsdPerMinute"
                    ]
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

function formatProviderUsage(
  totalTokens: number | null,
  metadata: string,
): string[] {
  const liveUsage = readLiveUsage(metadata);
  if (totalTokens === null && liveUsage === null) {
    return [];
  }
  const lines: string[] = [];
  if (liveUsage !== null) {
    lines.push(formatUsageDuration(liveUsage.durationMs));
    if (liveUsage.analysisWindows > 0) {
      lines.push(
        `${liveUsage.analysisWindows} analysis ${
          liveUsage.analysisWindows === 1 ? "window" : "windows"
        }`,
      );
    }
  }
  if (totalTokens !== null && totalTokens > 0) {
    lines.push(`${totalTokens.toLocaleString("en-US")} tokens`);
  }
  return lines;
}

function readLiveUsage(
  metadata: string,
): { durationMs: number; analysisWindows: number } | null {
  try {
    const parsed = JSON.parse(metadata) as {
      durationMs?: unknown;
      analysisWindows?: unknown;
    };
    if (
      typeof parsed.durationMs !== "number" ||
      !Number.isFinite(parsed.durationMs) ||
      parsed.durationMs < 0
    ) {
      return null;
    }
    return {
      durationMs: parsed.durationMs,
      analysisWindows:
        typeof parsed.analysisWindows === "number" &&
        Number.isFinite(parsed.analysisWindows) &&
        parsed.analysisWindows > 0
          ? Math.floor(parsed.analysisWindows)
          : 0,
    };
  } catch {
    return null;
  }
}

function formatUsageDuration(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s audio`;
}
