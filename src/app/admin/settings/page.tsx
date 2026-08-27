import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { CreditPricingSimulator } from "@/components/admin/credit-pricing-simulator";
import { AnalysisModelRoutingFields } from "@/components/admin/analysis-model-routing-fields";
import { getInvitationAdminStats } from "@/lib/invitations";
import {
  DEFAULT_SETTINGS,
  DEFAULT_STRING_SETTINGS,
  LIVE_TRANSCRIPTION_DELAY_OPTIONS,
  PAPER_REVIEW_MODEL_OPTIONS,
  PERPLEXITY_SEARCH_MODEL_OPTIONS,
  loadSettings,
  loadStringSettings,
  type SettingKey,
} from "@/lib/settings";
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
      "Runtime values used for real-cost settlement, including duration-based Live transcription. Environment variables supply only the installation defaults shown below.",
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
        step: 0.000001,
      },
      {
        key: "credits.liveTranscription",
        label: "Minimum credits to start Live",
        help:
          "Required available balance at session start. This amount is not reserved or automatically debited",
        min: 1,
        step: 1,
      },
      {
        key: "credits.liveTranscriptionUsdPerMinute",
        label: "OpenAI Live cost per minute",
        help:
          "Provider rate used to settle GPT Live Transcribe by actual session duration",
        min: 0.000001,
        step: 0.000001,
      },
      {
        key: "credits.liveDiarizationUsdPerMinute",
        label: "OpenAI diarization cost per minute",
        help:
          "Provider rate used when a user opts into post-session speaker identification",
        min: 0.000001,
        step: 0.000001,
      },
    ],
  },
  {
    title: "Invitations",
    description:
      "Platform-wide invitation capacity, the allowance for each verified account and the bonus promised to each invited person. Set the global limit to zero to pause new invitations.",
    keys: [
      {
        key: "invites.globalLimit",
        label: "Global invitation limit",
        help: "Maximum successfully queued or sent invitations across Jiddu",
        min: 0,
        step: 1,
      },
      {
        key: "invites.perUserLimit",
        label: "Invitations per user",
        help: "Maximum invitations each verified WorkOS account may send",
        min: 0,
        step: 1,
      },
      {
        key: "invites.acceptanceCredits",
        label: "Credits on acceptance",
        help: "Jiddu Credits granted once to the invited account",
        min: 0,
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
    title: "Rate limits — Live transcription sessions",
    description:
      "Controls how often each signed-in WorkOS user can start Jiddu Live. When the bucket is empty, the user sees a specific message with the remaining wait time.",
    keys: [
      {
        key: "rate.liveToken.capacity",
        label: "Immediate Live starts",
        help: "Sessions a user can start in a short burst before waiting for refill",
        min: 1,
        step: 1,
      },
      {
        key: "rate.liveToken.perHour",
        label: "New Live starts per hour",
        help: "Refill rate for that user’s start allowance",
        min: 1,
        step: 1,
      },
    ],
  },
  {
    title: "Rate limits — Live analysis windows",
    description:
      "POST /api/live/analyze. Applied per signed-in WorkOS user; only one provider-backed analysis window may run concurrently per user.",
    keys: [
      {
        key: "rate.liveAnalyze.capacity",
        label: "Burst capacity",
        help: "Max analysis-window requests in a short burst per user",
      },
      {
        key: "rate.liveAnalyze.perHour",
        label: "Per hour",
        help: "Sustained Live analysis windows per user",
      },
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

const MODEL_LABELS: Record<
  (typeof PAPER_REVIEW_MODEL_OPTIONS)[number],
  string
> = {
  "gpt-5.6-luna-pro": "GPT-5.6 Luna Pro",
  "claude-opus-4.8": "Claude Opus 4.8",
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "gemma-4-31b-it": "Gemma 4 31B",
};

const DELAY_LABELS: Record<
  (typeof LIVE_TRANSCRIPTION_DELAY_OPTIONS)[number],
  string
> = {
  minimal: "Minimal — fastest",
  low: "Low",
  medium: "Medium — balanced",
  high: "High",
  xhigh: "Extra high — most context",
};

const PERPLEXITY_MODEL_LABELS: Record<
  (typeof PERPLEXITY_SEARCH_MODEL_OPTIONS)[number],
  string
> = {
  "perplexity/sonar": "Sonar — fast",
  "perplexity/sonar-reasoning-pro": "Sonar Reasoning Pro — deep",
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; reset?: string }>;
}) {
  const { error, saved, reset } = await searchParams;
  const [current, currentStrings, invitationStats] = await Promise.all([
    loadSettings(),
    loadStringSettings(),
    getInvitationAdminStats(),
  ]);

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
        {error && (
          <div className="mb-4 rounded-md border border-[var(--severity-high)]/40 p-3 text-sm text-[var(--severity-high)]">
            {error === "invalid_analysis_routing"
              ? "Choose two different supported models and a provider option that belongs to each model."
              : error === "incomplete_invites"
              ? "Set both the per-user limit and acceptance credits above zero before enabling invitations."
              : "Invitation settings must be whole numbers greater than or equal to zero."}
          </div>
        )}

        <form action={saveSettingsAction} className="flex flex-col gap-8">
          <fieldset className="flex flex-col gap-4 rounded-lg border border-rule bg-paper p-5">
            <legend className="flex flex-col gap-1">
              <span className="font-medium">Default analysis routing</span>
              <span className="text-xs text-muted">
                One operator-controlled model chain for the public analysis
                features. The chosen models are intentionally hidden from the
                public form.
              </span>
            </legend>
            <AnalysisModelRoutingFields
              primaryModel={currentStrings["analysis.primaryModel"]}
              primaryProvider={currentStrings["analysis.primaryProvider"]}
              fallbackModel={currentStrings["analysis.fallbackModel"]}
              fallbackProvider={currentStrings["analysis.fallbackProvider"]}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-lg border border-rule bg-paper p-5">
            <legend className="flex flex-col gap-1">
              <span className="font-medium">Paper review and Live routing</span>
              <span className="text-xs text-muted">
                Runtime routing for Deep reviews and the Live transcription
                quality/latency trade-off. Environment variables remain the
                installation defaults.
              </span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Deep reasoning model</span>
                <select
                  name="paperReview.deepModel"
                  defaultValue={currentStrings["paperReview.deepModel"]}
                  className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
                >
                  {PAPER_REVIEW_MODEL_OPTIONS.map((model) => (
                    <option key={model} value={model}>
                      {MODEL_LABELS[model]} ({model})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted">
                  Handles research, evaluation, synthesis and self-critique in
                  Deep mode · default{" "}
                  {DEFAULT_STRING_SETTINGS["paperReview.deepModel"]}
                </span>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Independent critic model</span>
                <select
                  name="paperReview.criticModel"
                  defaultValue={currentStrings["paperReview.criticModel"]}
                  className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
                >
                  {PAPER_REVIEW_MODEL_OPTIONS.map((model) => (
                    <option key={model} value={model}>
                      {MODEL_LABELS[model]} ({model})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted">
                  Audits the draft using an independent model family · default{" "}
                  {DEFAULT_STRING_SETTINGS["paperReview.criticModel"]}
                </span>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">
                  Live transcription delay
                </span>
                <select
                  name="live.transcriptionDelay"
                  defaultValue={currentStrings["live.transcriptionDelay"]}
                  className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
                >
                  {LIVE_TRANSCRIPTION_DELAY_OPTIONS.map((delay) => (
                    <option key={delay} value={delay}>
                      {DELAY_LABELS[delay]} ({delay})
                    </option>
                  ))}
                </select>
                <span className="text-xs text-muted">
                  Higher values give the transcriber more context before
                  emitting text; fallacy analysis begins after transcription ·
                  default {DEFAULT_STRING_SETTINGS["live.transcriptionDelay"]}
                </span>
              </label>
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-4 rounded-lg border border-rule bg-paper p-5">
            <legend className="flex flex-col gap-1">
              <span className="font-medium">Perplexity search routing</span>
              <span className="text-xs text-muted">
                Models used for web-backed fact verification and Context
                enrichment through OpenRouter. A model change creates a
                separate fact-check cache namespace.
              </span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SearchModelField
                name="factcheck.fastModel"
                label="Fast fact-check model"
                help="First verification, bulk fact-checks and API/MCP requests"
                current={currentStrings["factcheck.fastModel"]}
              />
              <SearchModelField
                name="factcheck.deepModel"
                label="Fact-check recheck model"
                help="Explicit ‘verify again’ requests; defaults to Sonar, with Reasoning Pro available as an operator override"
                current={currentStrings["factcheck.deepModel"]}
              />
              <SearchModelField
                name="context.newsModel"
                label="Context news model"
                help="Recent coverage attached asynchronously to Context entities and relations"
                current={currentStrings["context.newsModel"]}
              />
              <SearchModelField
                name="live.relatedLinksModel"
                label="Related-links model"
                help="Public sources suggested for completed Live sessions"
                current={currentStrings["live.relatedLinksModel"]}
              />
            </div>
          </fieldset>

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
                {g.keys.some(
                  ({ key }) => key === "rate.liveToken.capacity",
                ) && (
                  <div className="rounded-md border border-accent/25 bg-accent/5 p-3 text-xs sm:col-span-2">
                    <p className="font-medium text-foreground">
                      Current Live start behavior
                    </p>
                    <p className="mt-1 text-foreground/85">
                      Up to {Math.max(1, Math.floor(current["rate.liveToken.capacity"]))}{" "}
                      sessions can start immediately per user. One allowance
                      refills about every{" "}
                      {formatRateInterval(current["rate.liveToken.perHour"])}.
                    </p>
                    <p className="mt-1 text-muted">
                      Recommended baseline: 5 immediate starts and 30 new
                      starts per hour.
                    </p>
                  </div>
                )}
                {g.keys.some(
                  ({ key }) => key === "invites.globalLimit",
                ) && (
                  <div className="rounded-md border border-accent/25 bg-accent/5 p-3 text-xs sm:col-span-2">
                    <p className="font-medium text-foreground">
                      Current invitation usage
                    </p>
                    <p className="mt-1 text-foreground/85">
                      {invitationStats.total} of{" "}
                      {Math.floor(current["invites.globalLimit"])} global
                      invitations used · {invitationStats.accepted} accepted ·{" "}
                      {invitationStats.failed} failed deliveries
                    </p>
                    <p className="mt-1 text-muted">
                      {current["invites.globalLimit"] > 0
                        ? `${Math.max(0, Math.floor(current["invites.globalLimit"]) - invitationStats.total)} global invitations remain.`
                        : "New invitations are currently disabled."}
                    </p>
                  </div>
                )}
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

function SearchModelField({
  name,
  label,
  help,
  current,
}: {
  name:
    | "factcheck.fastModel"
    | "factcheck.deepModel"
    | "context.newsModel"
    | "live.relatedLinksModel";
  label: string;
  help: string;
  current: (typeof PERPLEXITY_SEARCH_MODEL_OPTIONS)[number];
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <select
        name={name}
        defaultValue={current}
        className="bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
      >
        {PERPLEXITY_SEARCH_MODEL_OPTIONS.map((model) => (
          <option key={model} value={model}>
            {PERPLEXITY_MODEL_LABELS[model]} ({model})
          </option>
        ))}
      </select>
      <dl className="mt-1 space-y-1 rounded-md border border-rule bg-background/50 p-2.5 text-xs text-muted">
        <div>
          <dt className="inline font-medium text-foreground">Sonar:</dt>{" "}
          <dd className="inline">
            web search with citations optimized for lower latency and cost.
          </dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">
            Sonar Reasoning Pro:
          </dt>{" "}
          <dd className="inline">
            deeper reasoning for complex checks, with higher latency and cost.
          </dd>
        </div>
      </dl>
      <span className="text-xs text-muted">
        {help} · default {DEFAULT_STRING_SETTINGS[name]}
      </span>
    </label>
  );
}

function formatRateInterval(perHour: number): string {
  const seconds = Math.ceil(3600 / Math.max(1, perHour));
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
