import Link from "next/link";
import { AdminPage } from "@/components/admin/admin-page";
import { loadSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin · Credit billing guide · Jiddu",
  robots: { index: false, follow: false },
};

const example = {
  promptTokens: 10_000,
  completionTokens: 2_000,
  providerCost: 0.0165,
};

export default async function CreditBillingGuidePage() {
  const settings = await loadSettings();
  const margin = settings["credits.marginMultiplier"];
  const usdPerCredit = settings["credits.usdPerCredit"];
  const billed = example.providerCost * margin;
  const rawCredits = billed / usdPerCredit;
  const credits = Math.ceil(rawCredits);

  return (
    <AdminPage
      title="Credit billing guide"
      description="The source of truth for reservation, provider-cost settlement, rounding, fallback pricing and negative balances."
      breadcrumbs={[{ label: "Credits", href: "/admin/credits" }]}
      actions={
        <>
          <Link
            href="/admin/settings"
            className="rounded-md border border-rule px-3 py-1.5"
          >
            Settings
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

        <GuideSection title="1. The current formula">
          <p>For each operation, Jiddu calculates:</p>
          <CodeBlock>
            {`provider cost = sum of usage.cost from OpenRouter calls
billable cost = provider cost × margin multiplier
credits = ceil(billable cost ÷ USD value per credit)`}
          </CodeBlock>
          <p>With the values currently active in the admin:</p>
          <CodeBlock>
            {`credits = ceil(OpenRouter cost × ${margin}
               ÷ $${usdPerCredit})`}
          </CodeBlock>
          <p>
            Rounding is always upward because Jiddu Credits are integers. A
            non-zero metered provider cost therefore charges at least one
            credit.
          </p>
        </GuideSection>

        <GuideSection title="2. Worked example">
          <CodeBlock>
            {`prompt_tokens:     ${example.promptTokens.toLocaleString("en-US")}
completion_tokens:  ${example.completionTokens.toLocaleString("en-US")}
usage.cost:         $${example.providerCost}`}
          </CodeBlock>
          <CodeBlock>
            {`$${example.providerCost} × ${margin} = $${billed.toFixed(6)}
$${billed.toFixed(6)} ÷ $${usdPerCredit} = ${rawCredits.toFixed(3)} credits
ceil(${rawCredits.toFixed(3)}) = ${credits} credits`}
          </CodeBlock>
          <p>
            The user pays <strong>{credits} Jiddu Credits</strong> under the
            current configuration.
          </p>
        </GuideSection>

        <GuideSection title="3. What token usage means">
          <p>Every settled OpenRouter operation records separately:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>prompt tokens;</li>
            <li>completion tokens;</li>
            <li>reasoning tokens;</li>
            <li>cached tokens;</li>
            <li>total tokens;</li>
            <li>provider cost reported by OpenRouter; and</li>
            <li>billable cost after the configured multiplier.</li>
          </ul>
          <p>
            Jiddu does not manually reconstruct price from token counts when
            OpenRouter returns <code>usage.cost</code>. That value already
            reflects the model, different input and output prices, reasoning
            and cached tokens, the selected upstream, and provider-specific
            pricing. Ten thousand GPT-5.5 tokens are therefore not treated like
            ten thousand MiniMax M3 tokens.
          </p>
        </GuideSection>

        <GuideSection title="4. Reservation before work starts">
          <p>
            Before a paid operation begins, the rate card estimates its maximum
            likely cost and reserves that many credits. The reservation is not
            yet a charge: it prevents the same available balance from funding
            several concurrent operations.
          </p>
          <p>
            If the user does not have enough available credits for the complete
            estimate, Jiddu rejects the operation before calling the provider.
            Accounts with included platform access follow their own access rule
            and do not consume a personal Jiddu balance.
          </p>
        </GuideSection>

        <GuideSection title="5. Settlement and overruns">
          <p>
            When the operation finishes, Jiddu releases the reservation and
            debits the amount calculated from real provider usage. The
            reservation is an estimate, not a billing ceiling: retries,
            reasoning tokens or a more expensive upstream can make the final
            debit larger.
          </p>
          <p>
            A final overrun may leave the account negative. That completed work
            remains correctly charged, and the negative balance blocks every
            new reservation until credits are granted or purchased.
          </p>
        </GuideSection>

        <GuideSection title="6. Rate-card fallback">
          <p>
            The model rate card is used only for completed calls for which
            OpenRouter did not return usable cost data. Calls with real
            <code> usage.cost</code> use the formula above; matching prevents
            the same call from being charged once by real cost and again by the
            fallback.
          </p>
          <p>
            GPT Live Transcribe is currently the exception: OpenAI creates the
            Realtime session directly, so Jiddu applies the fixed per-session
            credit charge configured in Settings.
          </p>
        </GuideSection>

        <div className="flex flex-wrap gap-4 border-t border-rule pt-5 text-sm">
          <Link href="/admin/settings">Edit credit economics →</Link>
          <Link href="/admin/credits/packages">Manage packages →</Link>
        </div>
    </AdminPage>
  );
}

function GuideSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-serif text-2xl">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-6 text-foreground/90">
        {children}
      </div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border border-rule bg-paper p-4 text-xs leading-5">
      <code>{children}</code>
    </pre>
  );
}
