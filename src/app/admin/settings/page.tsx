import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { CreditPricingSimulator } from "@/components/admin/credit-pricing-simulator";
import { DEFAULT_SETTINGS, loadSettings, type SettingKey } from "@/lib/settings";
import { resetSettingsAction, saveSettingsAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Settings · Jiddu",
  robots: { index: false, follow: false },
};

type Group = {
  title: string;
  description: string;
  keys: {
    key: SettingKey;
    label: string;
    help: string;
    min?: number;
    step?: number;
  }[];
};

// Hand-curated grouping so the form reads top-to-bottom in the order an
// operator would think about it (cost first, then UX caps).
const GROUPS: Group[] = [
  {
    title: "Jiddu credit economics",
    description:
      "Runtime values used for real-cost settlement and the fixed Live transcription charge. Environment variables supply only the installation defaults shown below.",
    keys: [
      {
        key: "credits.marginMultiplier",
        label: "Provider-cost multiplier",
        help:
          "Multiplies the provider cost before conversion. For example, 1.5 adds a 50% operating margin before rounding",
        min: 0.01,
        step: 0.01,
      },
      {
        key: "credits.usdPerCredit",
        label: "USD represented by one credit",
        help:
          "Defines the accounting value of a Jiddu Credit. Lower values charge more credits for the same provider cost",
        min: 0.000001,
        step: 0.001,
      },
      {
        key: "credits.liveTranscription",
        label: "Live transcription session charge",
        help:
          "Fixed whole-credit charge reserved and debited when a GPT Live Transcribe session starts",
        min: 1,
        step: 1,
      },
    ],
  },
  {
    title: "Rate limits — Fallacy detector",
    description:
      "Token bucket per IP for POST /api/analyze. Capacity is the burst (max requests at once); rate is the sustained throughput per hour.",
    keys: [
      { key: "rate.analyze.capacity", label: "Burst capacity", help: "Max requests at once" },
      { key: "rate.analyze.perHour", label: "Per hour", help: "Sustained rate" },
    ],
  },
  {
    title: "Rate limits — Fact-check extraction",
    description: "POST /api/factcheck. Each call costs roughly $0.01.",
    keys: [
      { key: "rate.factcheck.capacity", label: "Burst capacity", help: "Max requests at once" },
      { key: "rate.factcheck.perHour", label: "Per hour", help: "Sustained rate" },
    ],
  },
  {
    title: "Rate limits — Bulk verdict pass",
    description:
      "POST /api/factcheck/[id]/verify. Each call costs ~$0.005-0.01 per claim × N claims.",
    keys: [
      { key: "rate.verify.capacity", label: "Burst capacity", help: "Max requests at once" },
      { key: "rate.verify.perHour", label: "Per hour", help: "Sustained rate" },
    ],
  },
  {
    title: "Rate limits — Per-claim refresh",
    description:
      "POST /api/factcheck/[id]/claim/[claimId]/verify. Single claim, bypasses cache.",
    keys: [
      { key: "rate.singleVerify.capacity", label: "Burst capacity", help: "Max requests at once" },
      { key: "rate.singleVerify.perHour", label: "Per hour", help: "Sustained rate" },
    ],
  },
  {
    title: "Rate limits — Adversarial paper review",
    description:
      "POST /api/review. Expensive: complete PDF parsing, four long-context model passes and published-literature web search.",
    keys: [
      { key: "rate.review.capacity", label: "Burst capacity", help: "Max reviews started at once" },
      { key: "rate.review.perHour", label: "Per hour", help: "Sustained review rate" },
    ],
  },
  {
    title: "Rate limits — API/MCP adversarial review",
    description:
      "Public asynchronous review jobs started through /api/v1/adversarial-reviews or MCP. Applied per REST API key or WorkOS MCP user.",
    keys: [
      {
        key: "rate.apiReview.capacity",
        label: "Burst capacity",
        help: "Max review jobs started at once per authenticated identity",
      },
      {
        key: "rate.apiReview.perHour",
        label: "Per hour",
        help: "Sustained review jobs per authenticated identity",
      },
    ],
  },
  {
    title: "Fact-check cost caps",
    description:
      "Hard ceilings independent of rate. The refresh cap is per-claim, persisted on the FactCheck row, and counts every verify call (bulk or single) against the same counter.",
    keys: [
      {
        key: "factcheck.maxClaims",
        label: "Max claims per extraction",
        help: "Extractions stop after this many claims",
      },
      {
        key: "factcheck.maxRefreshPerClaim",
        label: "Max verify attempts per claim",
        help: "After this many calls, the refresh button is hidden",
      },
    ],
  },
];

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; reset?: string }>;
}) {
  const { saved, reset } = await searchParams;
  const current = await loadSettings();

  return (
    <AdminPage
      title="Settings"
      description="Override defaults at runtime. Changes apply within about 30 seconds (in-process cache TTL)."
    >

        {saved && (
          <div className="mb-4 text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 rounded-md p-3">
            Settings saved.
          </div>
        )}
        {reset && (
          <div className="mb-4 text-sm text-muted bg-paper border border-rule rounded-md p-3">
            All overrides cleared — defaults restored.
          </div>
        )}

        <form action={saveSettingsAction} className="flex flex-col gap-8">
          {GROUPS.map((g) => (
            <fieldset
              key={g.title}
              className="flex flex-col gap-4 rounded-lg border border-rule bg-paper p-5"
            >
              <legend className="flex flex-col gap-1">
                <span className="font-medium">{g.title}</span>
                <span className="text-xs text-muted">{g.description}</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {g.keys.map(({ key, label, help, min = 0, step = "any" }) => (
                  <label key={key} className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">{label}</span>
                    <input
                      type="number"
                      name={key}
                      defaultValue={current[key]}
                      step={step}
                      min={min}
                      className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
                    />
                    <span className="text-xs text-muted">
                      {help} · default {DEFAULT_SETTINGS[key]}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-accent text-white font-medium hover:opacity-90 transition-opacity"
            >
              Save changes
            </button>
            <button
              type="submit"
              formAction={resetSettingsAction}
              className="text-sm text-muted hover:text-[var(--severity-high)] transition-colors"
            >
              Reset all to defaults
            </button>
          </div>
        </form>

        <div className="mt-10">
          <CreditPricingSimulator
            initialMarginMultiplier={current["credits.marginMultiplier"]}
            initialUsdPerCredit={current["credits.usdPerCredit"]}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/admin/credits/guide">Read the internal billing guide →</Link>
          <Link href="/admin/credits/packages">Manage credit packages →</Link>
        </div>
    </AdminPage>
  );
}
