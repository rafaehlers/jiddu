import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ADMIN_COOKIE_NAME, adminTokenIsValid } from "../auth";
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
  keys: { key: SettingKey; label: string; help: string }[];
};

// Hand-curated grouping so the form reads top-to-bottom in the order an
// operator would think about it (cost first, then UX caps).
const GROUPS: Group[] = [
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
  const jar = await cookies();
  if (!adminTokenIsValid(jar.get(ADMIN_COOKIE_NAME)?.value)) {
    redirect("/admin");
  }

  const { saved, reset } = await searchParams;
  const current = await loadSettings();

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-8 flex-1">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl">Settings</h1>
            <p className="text-sm text-muted mt-1">
              Override defaults at runtime. Changes apply within ~30 seconds
              (in-process cache TTL).
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            ← Back to admin
          </Link>
        </div>

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
            <fieldset key={g.title} className="flex flex-col gap-3">
              <legend className="flex flex-col gap-1">
                <span className="font-medium">{g.title}</span>
                <span className="text-xs text-muted">{g.description}</span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {g.keys.map(({ key, label, help }) => (
                  <label key={key} className="flex flex-col gap-1 text-sm">
                    <span className="font-medium">{label}</span>
                    <input
                      type="number"
                      name={key}
                      defaultValue={current[key]}
                      step="any"
                      min="0"
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
              className="px-4 py-2 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
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
      </main>
      <SiteFooter />
    </>
  );
}
