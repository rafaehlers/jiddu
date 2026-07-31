# What Does an AI Analysis Actually Cost?

### How I turned OpenRouter usage into a credit ledger for Jiddu without pretending every token is worth the same

<!--
Suggested essay metadata:
slug: what-does-an-ai-analysis-actually-cost
date: 2026-07-28
summary: How Jiddu measures the real cost of multi-model AI analyses, converts OpenRouter usage into credits, reserves funds before execution, and keeps an auditable ledger.
readingTime: 10 min read
keywords:
  - AI pricing
  - OpenRouter
  - usage-based billing
  - token accounting
  - SaaS credits
  - LLM infrastructure
-->

When Jiddu was open to anyone, an innocent **Analyze** button had a direct line to my OpenRouter balance. A short fallacy scan might make one inexpensive model call. A deep adversarial review of a paper could call several models, use reasoning tokens, consult an independent critic, and retry a stage that returned invalid data.

Calling both of those actions “one analysis” would hide nearly everything that determines their cost.

I decided to account for that shared spend through Jiddu Credits, eventually allowing users to buy credit packs instead of exposing the platform account to unlimited usage. That required a billing system that could answer a less obvious question: how many credits should one analysis consume when its true cost is known only after it finishes?

The system I built has three layers:

1. OpenRouter reports the real cost of every completed model call.
2. Jiddu converts the total into an integer number of credits.
3. A rate card protects the account before execution and fills the gaps when usage data is missing.

The distinction between those layers matters. The rate card is an estimate. OpenRouter’s reported cost is the source of truth whenever it is available. The ledger keeps enough detail to explain the result later.

## Tokens describe the work; cost prices it

The first version of a credit system is tempting to write as a token formula:

```text
credits = input tokens × input rate + output tokens × output rate
```

That works only if the application controls one model with one stable price. Jiddu does not.

Different models charge different amounts for input and output. Some expose separate prices for cached input or reasoning tokens. The provider selected behind a model route may matter. Tokenizers also differ, so identical text does not necessarily produce the same token count across models. A paper review can mix cheaper and more expensive models inside the same job.

Rebuilding that pricing logic inside Jiddu would create a second, stale copy of a catalog that changes outside the application. It would also make historical charges hard to defend when a provider updates a price.

[OpenRouter returns usage accounting](https://openrouter.ai/docs/cookbook/administration/usage-accounting) with each response. Alongside prompt and completion token counts, the response can contain:

```json
{
  "usage": {
    "prompt_tokens": 10000,
    "completion_tokens": 2000,
    "total_tokens": 12000,
    "cost": 0.0165,
    "prompt_tokens_details": {
      "cached_tokens": 0
    },
    "completion_tokens_details": {
      "reasoning_tokens": 400
    },
    "cost_details": {
      "upstream_inference_cost": 0.015
    }
  }
}
```

The important field for settlement is `usage.cost`: the amount charged to the OpenRouter account for that generation. OpenRouter has already applied the selected model’s current prices to its input, output, cached, and reasoning usage.

Jiddu still records the token counts. They are valuable for audits, debugging, cost analysis, and future product decisions. They simply do not need to be repriced a second time.

## The conversion formula

Jiddu uses two environment variables:

```dotenv
JIDDU_CREDIT_MARGIN_MULTIPLIER=1.5
JIDDU_CREDIT_USD_VALUE=0.01
```

The settlement is:

```text
provider cost = sum of usage.cost for every call in the operation

billable cost = provider cost × margin multiplier

credits = ceil(billable cost ÷ dollar value per credit)
```

With the current defaults:

```text
credits = ceil(OpenRouter cost × 1.5 ÷ 0.01)
```

One Jiddu Credit therefore represents one cent of internal billable value. It does not mean that one cent was paid to OpenRouter, and it is separate from the retail price of a credit pack.

The multiplier creates room for expenses beyond inference: payment fees, taxes, failed requests, infrastructure, customer support, and price movement. It is configurable because those economics should not be buried in application code.

## A complete example

Suppose one model call returns:

```text
prompt tokens:      10,000
completion tokens:   2,000
OpenRouter cost:   $0.0165
```

Jiddu calculates:

```text
$0.0165 × 1.5 = $0.02475

$0.02475 ÷ $0.01 = 2.475 credits

ceil(2.475) = 3 credits
```

The ledger records three credits, plus the original token counts, provider cost, billed cost, model, generation identifier, and conversion settings.

The stored cost uses integer millionths of a dollar rather than a floating-point value:

```text
$0.0165 = 16,500 micros
```

That avoids accumulating binary floating-point errors in financial records. The displayed dollar value can always be reconstructed by dividing the stored integer by one million.

## One feature can make several calls

The user sees a feature. The provider sees generations.

A long document is split into chunks so it can fit within a model’s context window. Each chunk can produce a separate call. Fact-checking adds one or more verification searches. An adversarial paper review coordinates several specialist stages and may use a different model for an independent critique.

Jiddu collects the cost from every call in the operation and rounds only once:

```text
call 1: $0.012
call 2: $0.035
call 3: $0.004
----------------
total:  $0.051
```

The credit charge becomes:

```text
$0.051 × 1.5 = $0.0765

$0.0765 ÷ $0.01 = 7.65

ceil(7.65) = 8 credits
```

Rounding each call separately would overcharge any operation made of many small calls. Aggregating first keeps the calculation tied to the cost of the whole action the user requested.

## A 1.5 multiplier is not a 50% margin

This trips people up because markup and gross margin use different denominators.

If the provider cost is one dollar:

```text
provider cost: $1.00
multiplier:       1.5
billable value: $1.50
gross profit:   $0.50
```

The markup on cost is 50 percent:

```text
$0.50 ÷ $1.00 = 50%
```

The gross margin on revenue is 33.3 percent:

```text
$0.50 ÷ $1.50 = 33.3%
```

A true 50 percent gross margin would require a multiplier of 2.0 before payment fees, taxes, infrastructure, and other expenses.

At the current settings, 1,000 credits carry ten dollars of internal billable value and cover approximately $6.67 of provider cost:

```text
$10.00 ÷ 1.5 = $6.67
```

This is one reason I kept the multiplier configurable. A number that looks generous in a formula may be much thinner after the rest of the business reaches it.

## Integer credits create a minimum charge

Credits are integers. Any positive metered cost consumes at least one:

```text
provider cost: $0.001
billable cost: $0.0015
raw credits:   0.15
final charge:  1 credit
```

That makes the effective markup on very small calls much higher than 1.5. The rounding effect falls as the operation gets larger.

I accept that trade-off for now because fractional credits would complicate the interface, ledger, and future credit packs. It also means I should not describe the system as a perfectly proportional pass-through. It is proportional at normal analysis sizes, with a one-credit floor.

If real usage shows a large volume of sub-cent operations, there are cleaner options than hiding the distortion: make the credit unit smaller, aggregate charges over a time period, or store fractional internal units while showing rounded balances to the user.

## Reserve first, settle after

The exact cost is available only when the provider responds. Jiddu still needs to know that a user can afford an operation before starting an expensive review.

This is where the rate card has its first job. Before execution, Jiddu estimates the maximum likely charge from the feature, model chain, number of chunks, and possible fallback calls. It reserves that many credits on the account.

A reservation does not debit the balance. It reduces the amount available to other concurrent operations:

```text
balance:   100 credits
reserved:   20 credits
available:  80 credits
```

After the operation finishes, Jiddu settles against actual usage.

If a regular analysis reserved 12 credits and the real charge is seven, Jiddu debits seven and releases the remaining five. If the real charge is 14, it debits 14. The reservation is a solvency check, not a billing ceiling.

Live sessions are the exception. They require at least 20 available credits to start, but those credits are neither reserved nor charged. Jiddu keeps a zero-value billing ticket, then settles the transcription duration and all analysis windows together when the session ends.

That second case can leave the account negative. Future reservations are blocked until the balance is topped up. Allowing an overrun is more accurate than silently discarding provider cost because the estimate was wrong.

Pending reservations expire after two hours. This prevents a browser tab, network failure, or abandoned job from locking credits forever.

## The rate card is also a fallback

OpenRouter normally returns `usage.cost`. “Normally” is not enough for a billing system.

A response may contain token counts but omit cost. A call can fail after the provider has performed work. An integration can return incomplete usage metadata. Jiddu needs a deterministic result in those cases.

The current rate card assigns a fixed estimate to each known model:

| Model | Fallback credits per call |
| --- | ---: |
| MiniMax M3 | 1 |
| GPT-5.4 mini | 2 |
| Perplexity Sonar Reasoning Pro | 2 |
| GPT-5.5 | 10 |
| Claude Opus 4.8 | 18 |
| GPT Live Transcribe | 20 per session |
| Unknown model | 20 |

These numbers are versioned. A ledger row can therefore say which rate card was used even after the current table changes.

The fallback is applied only to calls that cannot be matched to reported cost. Consider an operation with two calls:

```text
GPT-5.4 mini
reported cost: $0.012
converted charge: ceil($0.012 × 1.5 ÷ $0.01) = 2 credits

MiniMax M3
reported cost: missing
fallback charge: 1 credit

total: 3 credits
```

An explicit `cost: 0` is different from a missing cost. Zero means OpenRouter reported that the generation was free, so Jiddu charges no fallback credit for it. Missing means the price is unknown, so the rate card applies.

The table also provides the reservation estimate before execution. It is not meant to replace actual provider accounting once the operation completes.

## Retries and failed stages still have a cost

A model can return syntactically valid text that fails Jiddu’s schema validation. A request can be interrupted after the provider has already generated tokens. A fallback model can then complete the same stage.

From a product perspective, the user experienced one action. From a cost perspective, both attempts may have consumed paid inference.

Jiddu records and charges an attempt when provider usage is available, even if its output could not be used. The successful retry is recorded separately. This keeps the ledger aligned with the account that actually paid the upstream bill.

It also gives me evidence to improve the product. If one model causes frequent paid retries, the problem is visible in its completion rate, usage records, and cost per successful analysis. Hiding those calls inside a flat feature price would conceal an engineering problem behind the customer’s bill.

## What the ledger remembers

A balance alone can tell a user that credits disappeared. It cannot explain why.

Each usage transaction stores:

- the feature and resulting resource;
- the credit debit and balance after settlement;
- the reservation estimate and any overrun;
- prompt, completion, total, reasoning, and cached tokens;
- provider cost and billable cost in micros;
- the margin multiplier and dollar value per credit;
- model and generation identifiers for each call;
- whether the call completed;
- any fallback models and fallback credits;
- the version of the rate card.

This makes a charge reproducible. Given the recorded provider cost and conversion settings, I can calculate the debit again months later. Given the per-call data, I can see whether the expense came from a long prompt, heavy reasoning, an expensive critic, or a retry.

The ledger also separates manual grants from usage debits. When an administrator adds 500 credits, that is one transaction. When an analysis consumes eight, that is another. Adjusting the balance directly without recording both events would make reconciliation impossible.

## Live transcription uses duration instead of tokens

Jiddu’s live mode sends audio from the browser directly to OpenAI’s Realtime API using `gpt-live-transcribe`. That traffic does not pass through OpenRouter, so there is no OpenRouter `usage.cost` to settle.

OpenAI lists `gpt-live-transcribe` at [$0.017 per minute](https://developers.openai.com/api/docs/pricing). Jiddu therefore measures the active audio duration, caps it at 60 minutes, and combines that cost with the real OpenRouter cost of every completed Live analysis window:

```text
transcription cost = billable duration × $0.017 per minute

provider cost = transcription cost + sum of Live analysis usage.cost

credits = ceil(provider cost × margin multiplier ÷ value per credit)
```

The account must have at least 20 available credits before Jiddu issues the ephemeral Realtime credential. That is an entry check, not a reservation or charge. When the session finishes, its owner-scoped, idempotent billing ticket settles the combined provider cost once, avoiding a separate upward rounding for every analysis window. The ledger stores audio duration, transcription cost, analysis cost, token totals, conversion settings, and the linked analysis resource.

## Retail packs and Stripe

Jiddu Credits remain an internal accounting unit during settlement, while users can buy one-time packs through Stripe Checkout.

The sale price and settlement value remain separate concepts. A pack can include a volume discount, a promotion, tax, or a payment fee without changing how much provider usage one credit covers inside the ledger.

That separation also prevents the pricing page from rewriting historical usage. The usage transaction records the multiplier, credit value, provider cost, and rate-card version that applied when it happened. The purchase transaction separately records the Stripe Checkout Session, Price, package, currency, amount, and credits granted.

Jiddu never grants a balance from the browser redirect alone. It retrieves the completed Checkout Session from Stripe, verifies the signed webhook, user, Price, currency and amount, then writes the purchase and balance increase in one database transaction. The Checkout Session ID is unique in the ledger, so a retried webhook cannot grant the same pack twice.
