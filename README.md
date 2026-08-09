# Jiddu

> *truth is a pathless land* — [J. Krishnamurti](https://en.wikipedia.org/wiki/Jiddu_Krishnamurti)

**Critical reading for text and research papers.**

Jiddu keeps the source and the analysis side by side. Drop a URL, paste text, upload a document, or review a complete paper; every finding stays anchored to the passage or page that supports it.

Choose the lens that fits the reading: logical fallacies, factual claims, neutrality, plain-language explanation, writing patterns, or an adversarial pre-submission review. Results stream into an inspectable viewer, save to a shareable link, and export to PDF; paper reviews also export structured Markdown.

[Open Jiddu](https://jiddu.app) · [Try the paper-review demo](https://jiddu.app/r/demo-en) · [How it works](https://jiddu.app/how-it-works) · [API & MCP](https://jiddu.app/api-access)

---

## What Jiddu does

### Fallacy detector
- **Dual-pane viewer** — text on the left with each fallacious passage highlighted in its own color; explanations stack as anchored comments on the right.
- **Streaming analysis** — comments appear progressively while the LLM is still writing.
- **Multi-chunk parallel analysis** — texts up to ~200k chars are split at sentence boundaries and analyzed in parallel with bounded concurrency.
- **46 fallacies catalog** — covering relevance, ambiguity, presumption, emotional appeals, causal reasoning and evidence. Each has its own distinct color (golden-angle palette).
- **Fallacy guide page** at `/fallacies` and a per-fallacy modal opened from any comment.
- **Live mode** at `/live` — real-time fallacy detection on streamed audio (speech-to-text + analysis).
- **Demo analyses** in 3 languages (`/a/demo-en`, `/a/demo-pt`, `/a/demo-es`) loaded from the database — no LLM call needed to see the UX.

### Fact-check
- **Claim extraction** at `/factcheck` — Claimify-inspired 4-stage pipeline (selection → disambiguation → decomposition → decontextualization). Opinions, hypotheticals and rhetorical questions get dropped.
- **Per-claim verdict** at `/f/[id]` — opt-in "Verify claims" button. Each claim goes through Perplexity Sonar with web search, returning `supported` / `contradicted` / `mixed` / `unverified` + confidence + citations. Reasoning Pro remains an admin-selectable override.
- **Source-quality tier per citation** — every cited source is classified into one of six tiers (primary / scholarly / think tank / journalistic / commercial / informal) with a separate state-controlled flag, and rendered as coloured pills in the viewer.
- **Verdict cache** — claims are hashed (lang-prefixed sha256 of normalized statement) and persisted in a `ClaimVerdict` table. TTL by type: `numeric` 30 days, `quote/causal` 90 days, `date/categorical` 365 days. Re-verification is free for cached claims; expired rows are swept on the cache-miss path.
- **Per-claim refresh** — a per-card refresh button bypasses the cache when the user disagrees with a stored verdict. Capped by an admin-configurable per-claim refresh quota (default 2).
- **Demo analyses** in 3 languages (`/f/demo-en`, `/f/demo-pt`, `/f/demo-es`).

### Neutrality
- **Document-level verdict** at `/n/[id]` — `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`, with a per-document text-type label (informational, opinion, political speech, advocacy, analysis, marketing, social_media) and a confidence score.
- **8 issue types** flagged at the sentence level: loaded language, asymmetric attribution, false equivalence, selective omission, source asymmetry, both-sidesing, steering, genetic framing.
- **No partisan direction**: the system intentionally does NOT classify left/right or pro-X/anti-Y. Surfaces specific patterns the reader can audit instead.
- **Demo analyses** in 3 languages (`/n/demo-en`, `/n/demo-pt`, `/n/demo-es`).

### Slop detector
- **AI-slop pattern detection** at `/slop`, results at `/s/[id]` — same dual-pane reading idiom as the fallacy detector (colored sentence highlights + anchored margin cards + 0-100 score), driven by a separate catalog and prompt.
- **18-pattern catalog** across five categories (wording, manufactured drama, templated structure, hollow substance, format tics): buzzword salad, filler phrases, throat-clearing, faux-insight setups, colon reveals, rhetorical setups, fake-profound kickers, binary contrast, negative listing, dramatic fragmentation, robotic rhythm, importance puffery, weasel attribution, superficial analysis, vague abstraction, synonym cycling, summary-recap endings, em-dash overuse.
- **Patterns, not authorship** — the prompt forbids claims about whether AI wrote the text; every finding quotes the exact span so the reader can check the evidence. Findings say what a cleaner version would do, but never rewrite.
- **Demo analyses** in 3 languages (`/s/demo-en`, `/s/demo-pt`, `/s/demo-es`).
- **Based on [no-ai-slop](https://github.com/petergyang/no-ai-slop)** — the pattern selection follows Peter Yang's MIT-licensed editing skill; the catalog wording, trilingual content and detection prompt are Jiddu's own.

### Explain
- **Paragraph-by-paragraph viewer** at `/e/[id]` — the paper on the left with every paragraph tinted by the role it plays; one explanation card per paragraph on the right, **anchored beside the paragraph it explains** (absolute-positioned with collision avoidance, same as the fallacy detector's margin comments) so clicking a paragraph never scrolls you across a long document.
- **Audience level** — a pill selector on the composer picks who the explanations are written for: `Child` (ELI5, everyday analogies, no jargon), `High school`, `Undergraduate` (default), or `Expert` (concise, critical, no basic definitions). The level only changes the prose, not the pipeline.
- **Section-aware hybrid segmentation** — the paper's own headings (`1`, `1.1`, `2.1`, `Introduction`, `Methods`…) are detected and rendered as section dividers on the left, while the explanation stays one card per paragraph. Papers with no headings fall back to plain paragraphs (blank-line aware, with a sentence-grouping fallback for prose with no paragraph breaks). The prompt enforces one explanation per paragraph so a long paper never condenses into a handful of section summaries.
- **7 section roles** — each paragraph is tagged `background` / `objective` / `method` / `result` / `interpretation` / `limitation` / `conclusion`, each with its own color, so the paper's skeleton is visible at a glance. A legend sits above the text.
- **Whole-document overview** — a 2–4 sentence plain-language abstract at the chosen level, shown above the paper.
- **Parallel chunking** — long papers are split at block boundaries and explained in parallel with bounded concurrency, like the other pipelines.
- **Demo explanations** in 3 languages (`/e/demo-en`, `/e/demo-pt`, `/e/demo-es`).

### Adversarial paper review
- **Complete-paper workflow** at `/review`, results at `/r/[id]` — accepts exactly one PDF plus target venue, edition, track, paper type and optional review date.
- **Methodological inspiration** — Jiddu adapts the SPECS review dimensions (Story, Presentation, Evaluations, Correctness and Significance) and the staged synthesis/self-critique pattern described in [*AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot*](https://arxiv.org/abs/2604.13940). It is an independent implementation with its own claim/evidence ledger, venue calibration, parser, output contract and safeguards—not a reproduction of the AAAI-26 system.
- **Layout-aware local parsing** via LiteParse — page-scoped Markdown, spatial reading order, selective OCR and screenshots for visually relevant pages; `pdfjs-dist` remains the fallback.
- **Auditable venue calibration** — verified, versioned 2026 profiles for NeurIPS, ICML, ICLR, AAAI, IJCAI and CVPR inject their official criteria into both synthesis and adversarial self-critique. DBLP powers account-free venue autocomplete; unmatched venues are clearly marked as using a general scholarly rubric.
- **Persisted venue standard** — every review stores the exact criteria, requirements, verification status and official-source URLs applied at review time, and exposes them in the viewer and Markdown/PDF export.
- **Independent SPECS passes** — Story, Presentation, Evaluations, Correctness and Significance are reviewed separately before synthesis, so one broad pass cannot silently skip an entire criterion.
- **Safe quantitative verification** — Evaluation and Correctness specialists can propose whitelisted arithmetic checks (rates, means, percentage changes, precision/recall/F1). Jiddu recalculates them deterministically and never executes code from the manuscript.
- **Source + quality audit** — cited URLs are SSRF-checked, fetched with bounded redirects/bytes, compared with observed title metadata and classified as published work, preprint, documentation or unknown. An independent critic then audits support, severity, recommendation, citation reliability and bias.
- **Retention gate** — every retained MAJOR/MODERATE specialist finding must be represented in a final weakness or explicitly dismissed by the critic; a repair pass and deterministic fallback prevent synthesis loss.
- **Standard and Deep modes** — Standard uses the selected economical model throughout and another catalog model as critic. Deep routes evaluation, correctness, significance, synthesis and repair to GPT-5.6 Luna Pro and uses Claude Opus 4.8 as the independent critic. Both internal model ids can be changed through environment variables.
- **Localized evidence** — every substantive weakness carries manuscript page/section references and a `MAJOR` / `MODERATE` / `MINOR` severity.
- **Markdown + PDF export** — deterministic Markdown follows the required `AI Paper Review` format and the print route supports browser “Save as PDF”.
- **Curated synthetic demos** in 3 languages (`/r/demo-en`, `/r/demo-pt`, `/r/demo-es`) exercise the full results viewer without uploading a paper or spending API credits.

### Across the product
- **One reading interface** — the first five modes accept URL, pasted text, PDF or TXT; adversarial review accepts one complete PDF so the manuscript can be assessed as a self-contained submission.
- **Model choice and fallback** — GPT-5.6 Luna with high reasoning is the default, DeepSeek V4 Flash 0731 is available for comparison, and requests fall back only when the first model fails before emitting output. Deep review uses GPT-5.6 Luna Pro with xhigh reasoning, while evidence-backed fact-check verdicts use Sonar by default.
- **Inspectable output** — findings quote the source and stay anchored to the relevant sentence, paragraph or paper page. Automated results are marked as unreviewed unless they receive an operator spot-check.
- **Share and export** — every completed analysis gets an unlisted share URL and a print-ready PDF view. Adversarial reviews also export deterministic Markdown.
- **English, Portuguese and Spanish** — the interface and model output follow the selected language.
- **Safer ingestion** — URL fetches reject private, loopback, link-local and reserved network ranges; redirects and response sizes are bounded.
- **Live mode (beta)** — `/live` transcribes microphone or browser-tab audio through OpenAI Realtime and streams fallacy findings while the speaker talks.

## Methodology and evaluation

Jiddu adapts published methods where they fit, then implements its own prompts, schemas, orchestration and safeguards:

- [**Claimify**](https://arxiv.org/abs/2502.10855) (Metropolitansky & Larson, Microsoft Research, 2025) informs the four-stage claim-extraction process: selection, disambiguation, decomposition and decontextualization.
- [**Distilling Expert Judgment at Scale**](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam & Wilde, Forum AI / Stanford, 2025) informs fact-check verdict assessment, the six-tier source taxonomy and the neutrality framework.
- [**AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot**](https://arxiv.org/abs/2604.13940) informs the SPECS dimensions and the staged synthesis and self-critique used in adversarial paper review. Jiddu is an independent implementation, not a reproduction of the AAAI-26 system.
- [**no-ai-slop**](https://github.com/petergyang/no-ai-slop) by Peter Yang supplies the starting taxonomy for the slop detector. Jiddu provides its own catalog text, translations and detection prompt.

The fact-check pipeline has been measured against 200 human-labeled claims from [PolitiFact](https://www.politifact.com)'s polar buckets, sourced through the [LIAR2 dataset](https://github.com/chengxuphd/liar2). Jiddu matched the human verdict in **67.5%** of cases overall and **81.3%** on the unambiguous true / false / pants-on-fire buckets; strict polar disagreement was **4.5%**. See the [full methodology, confusion matrix and disagreement analysis](./docs/benchmark-politifact.md).

Paper review has a separate [30-case synthetic SPECS benchmark](./evals/paper-review/report.md). GPT-5.4 mini, GPT-5.5, GPT-5.6 Luna and GPT-5.6 Luna Pro all detected the 30 injected defects. Luna Pro returned 8% fewer findings than standard Luna, but the set reached a ceiling and does not establish accuracy on complete real-world papers.

Jiddu is not affiliated with the authors, institutions, datasets or venues cited above.

---

## Technical stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** + **Tailwind 4**
- **Prisma 7** with `@prisma/adapter-pg` — PostgreSQL 16 in a private Docker service with persistent storage
- **Streaming**: server-side `ReadableStream` emitting SSE; `partial-json` for incremental finding extraction
- **PDF parsing**: `@llamaindex/liteparse` (layout/OCR/screenshots) with `pdfjs-dist` fallback
- **Article extraction**: `@mozilla/readability` + `jsdom`
- **Accounts and billing access**: WorkOS AuthKit sessions; allowlisted users
  receive included platform access and everyone else spends an independent
  Jiddu credit balance across web, REST and hosted MCP analyses; one-time
  credit packs use signed Stripe Checkout fulfillment

## Local development

```bash
# From an authorized local checkout:
npm install
cp .env.example .env
# Set POSTGRES_PASSWORD, OPENROUTER_API_KEY and the WorkOS variables below.
docker compose up -d jiddu-db
npx prisma migrate dev
npm run dev
```

Open <http://localhost:3000>. Try `/a/demo-en`, `/e/demo-en`, or `/r/demo-en`
(and the `-pt` / `-es` variants) to see the viewers without spending a token.

## Environment

| Variable               | Purpose                                                              |
|------------------------|----------------------------------------------------------------------|
| `DATABASE_URL`         | PostgreSQL connection URL. Local dev connects through the loopback-only Compose port. |
| `POSTGRES_PASSWORD`    | Password for the private `jiddu-db` service; use URL-safe characters. |
| `NEXT_PUBLIC_APP_URL`  | Canonical origin used for OAuth callbacks (`http://localhost:3000` locally) |
| `STRIPE_SECRET_KEY`    | Server-only Stripe secret key for Checkout and payment verification |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for the `/api/stripe/webhook` endpoint in the same Stripe mode |
| `STRIPE_PRICE_STARTER` | Stripe one-time Price ID for the Starter credit package |
| `STRIPE_PRICE_PLUS`    | Stripe one-time Price ID for the Plus credit package |
| `STRIPE_PRICE_PRO`     | Stripe one-time Price ID for the Pro credit package |
| `STRIPE_PRICE_STUDIO`  | Stripe one-time Price ID for the Studio credit package |
| `WORKOS_API_KEY`       | WorkOS AuthKit server key |
| `WORKOS_CLIENT_ID`     | WorkOS AuthKit client id |
| `WORKOS_COOKIE_PASSWORD` | 32+ character secret used by AuthKit to encrypt its session cookie |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | WorkOS callback URI, normally `<origin>/callback` |
| `WORKOS_AUTHKIT_DOMAIN` | AuthKit issuer origin used to validate MCP OAuth tokens |
| `MCP_RESOURCE_URL`     | Exact hosted MCP audience registered as a WorkOS Resource Indicator |
| `OPENROUTER_API_KEY`   | Deployment key for `platform` mode, public REST API, evals and operator balance |
| `ADMIN_EMAILS`         | Comma-separated verified WorkOS emails allowed into `/admin`; these accounts also receive platform-funded analysis access |
| `OPENROUTER_REFERER`   | Optional. Identifies the deployment in OpenRouter's analytics. Defaults to `https://jiddu.app` |
| `JIDDU_CREDIT_USD_VALUE` | Installation default for the dollar value represented by one Jiddu credit. Defaults to `0.01`; the admin can override it at runtime. |
| `JIDDU_CREDIT_MARGIN_MULTIPLIER` | Installation default for the multiplier applied to OpenRouter's reported cost. Defaults to `1.5`; the admin can override it at runtime. |
| `JIDDU_LIVE_MINIMUM_CREDITS` | Minimum available balance required to start GPT Live Transcribe. It is checked but not reserved or charged. Defaults to `20`; the admin can override it at runtime. The former `JIDDU_LIVE_TRANSCRIPTION_CREDITS` name remains supported for compatibility. |
| `OPENAI_LIVE_TRANSCRIPTION_USD_PER_MINUTE` | Installation default for GPT Live Transcribe provider cost per audio minute. Defaults to `0.017`; the admin can override it at runtime. |
| `OPENAI_LIVE_DIARIZATION_USD_PER_MINUTE` | Installation default for post-session OpenAI speaker diarization per audio minute. Defaults to `0.006`; the admin can override it at runtime. |
| `PAPER_REVIEW_DEEP_MODEL` | Optional internal model id for Deep specialist/synthesis stages. Defaults to `gpt-5.6-luna-pro`. |
| `PAPER_REVIEW_CRITIC_MODEL` | Optional independent Deep critic model id. Defaults to `claude-opus-4.8`. |
| `JIDDU_FACTCHECK_FAST_MODEL` | Installation default for first-pass, bulk and API/MCP fact verification. Defaults to `perplexity/sonar`; the admin can override it at runtime. |
| `JIDDU_FACTCHECK_DEEP_MODEL` | Installation default for explicit fact rechecks. Defaults to `perplexity/sonar`; the admin can select Reasoning Pro at runtime. |
| `JIDDU_CONTEXT_NEWS_MODEL` | Installation default for Context news enrichment. Defaults to `perplexity/sonar`; the admin can override it at runtime. |
| `JIDDU_RELATED_LINKS_MODEL` | Installation default for Live related-source discovery. Defaults to `perplexity/sonar`; the admin can override it at runtime. |
| `OPENAI_LIVE_TRANSCRIBE_DELAY` | GPT Live Transcribe latency/accuracy profile: `minimal`, `low`, `medium`, `high`, or `xhigh`. Defaults to `medium`. |

To compare the fast and deep Perplexity fact-check routes against the exact
same 24 human-labeled claims, run `OPENROUTER_API_KEY=... npm run
eval:factcheck-models`. See [the A/B benchmark guide](docs/benchmark-factcheck-models.md).

For AuthKit, register `<origin>/callback` as a redirect URI, `<origin>/login`
as the sign-in endpoint and `<origin>/` as the logout URI in WorkOS. Register
each web origin under the application's Sessions → CORS settings so the
WorkOS profile and security widgets can run inside `/account`. `/signup`
opens AuthKit's hosted registration flow; `/account` uses WorkOS widgets for
verified email changes and password or MFA management. Users with Jiddu
credits can run web, account-owned REST and hosted MCP analyses through
`OPENROUTER_API_KEY`; this ledger is independent
of the deployment's OpenRouter dollar balance. Each route reserves its
maximum rate-card cost before execution, settles only completed model calls,
and releases the unused reservation. Completed OpenRouter calls are settled
from the provider's returned prompt/completion tokens and real cost plus a
configurable margin; the rate card is a reservation estimate and fallback when
usage accounting is unavailable. Balance, transactions, token/cost usage and
the versioned rate card appear in `/account`; administrators can grant or remove credits at
`/admin/credits`. Users can buy one-time packs at `/pricing`; signed Stripe
webhooks and the authenticated return page share the same idempotent
fulfillment path. Verified
accounts granted access through `/admin/platform-access` instead receive
included use of `OPENROUTER_API_KEY`; administrator emails configured in
`ADMIN_EMAILS` always receive that access. Jiddu credits cover the web app,
REST API and hosted MCP. Verified users generate and revoke their own REST keys
from the API keys tab in `/account`; each key remains bound to its owner account.

## Architecture

```
src/
├── app/
│   ├── page.tsx                       Home (hero + upload form + demo button)
│   ├── fallacies/page.tsx             Catalog reference, grouped by category
│   ├── factcheck/page.tsx             Fact-check composer
│   ├── neutrality/page.tsx            Neutrality composer
│   ├── explain/page.tsx               Explain composer (paper explainer)
│   ├── slop/page.tsx                  AI-slop composer
│   ├── review/page.tsx                Adversarial paper-review composer
│   ├── account/page.tsx               WorkOS account + OpenRouter connection
│   ├── callback/route.ts              WorkOS AuthKit callback
│   ├── signup/route.ts                WorkOS AuthKit hosted registration
│   ├── legal/page.tsx                 Terms + disclaimer + methodology citations
│   ├── a/[id]/
│   │   ├── page.tsx                   Analysis viewer (SSR)
│   │   ├── print/page.tsx             Print-optimized "Save as PDF" view
│   │   └── opengraph-image.tsx        Dynamic OG image per analysis
│   ├── f/[id]/
│   │   ├── page.tsx                   Fact-check viewer (SSR + client refresh)
│   │   └── print/page.tsx             Print-optimized view
│   ├── n/[id]/
│   │   ├── page.tsx                   Neutrality viewer (SSR)
│   │   └── print/page.tsx             Print-optimized view
│   ├── e/[id]/
│   │   ├── page.tsx                   Explain viewer (SSR)
│   │   └── print/page.tsx             Print-optimized view
│   ├── s/[id]/
│   │   ├── page.tsx                   Slop-pattern viewer (SSR)
│   │   └── print/page.tsx             Print-optimized view
│   ├── r/[id]/
│   │   ├── page.tsx                   Adversarial review viewer (SSR)
│   │   └── print/page.tsx             Review PDF/print view
│   └── api/
│       ├── analyze/route.ts                            POST: fallacy SSE stream
│       ├── analysis/[id]/route.ts                      GET: load a saved analysis
│       ├── factcheck/route.ts                          POST: claim extraction SSE stream
│       ├── factcheck/[id]/verify/route.ts              POST: bulk verdict SSE
│       ├── factcheck/[id]/claim/[claimId]/verify/route.ts    POST: per-claim refresh (JSON)
│       ├── factcheck/[id]/claim/[claimId]/feedback/route.ts  POST: "wrong verdict" flag
│       ├── neutrality/route.ts                         POST: neutrality SSE stream
│       ├── explain/route.ts                            POST: explain SSE stream (paragraph + level)
│       ├── slop/route.ts                               POST: slop-pattern SSE stream
│       ├── stripe/checkout/route.ts                    POST: authenticated Stripe Checkout Session
│       ├── stripe/webhook/route.ts                     POST: signed, idempotent credit fulfillment
│       └── review/
│           ├── route.ts                                POST: nine-stage paper-review SSE stream
│           ├── venues/route.ts                         GET: curated + DBLP venue autocomplete
│           └── [id]/markdown/route.ts                  GET: deterministic Markdown export
├── components/
│   ├── jiddu-composer.tsx             Home body: form ↔ loading panel ↔ navigate
│   ├── factcheck-composer.tsx         Fact-check sibling of jiddu-composer
│   ├── neutrality-composer.tsx        Neutrality sibling of jiddu-composer
│   ├── explain-composer.tsx           Explain sibling of jiddu-composer
│   ├── paper-review-view.tsx          Structured adversarial review viewer
│   ├── venue-standard-card.tsx        Persisted venue rubric + official sources
│   ├── analysis-view.tsx              Dual-pane fallacy viewer with anchored comments
│   ├── factcheck-view.tsx             Two-column fact-check viewer with verdicts + sources
│   ├── neutrality-view.tsx            Two-column neutrality viewer with issue findings
│   ├── explain-view.tsx               Two-column explain viewer (role-colored paragraphs + cards)
│   ├── *-print-view.tsx               Six print-optimized companions
│   ├── unreviewed-banner.tsx          Yellow "not yet human-reviewed" banner
│   ├── legal-body.tsx                 /legal page renderer with markdown-link support
│   ├── upload-form.tsx                Shared inputs + 6-way mode toggle + review venue fields
│   ├── share-link-bar.tsx             Copy-to-clipboard URL + inline rightSlot (export PDF)
│   ├── export-pdf-button.tsx          Small pill that opens the /print companion
│   ├── fallacy-modal.tsx              In-page guide modal for one fallacy
│   ├── fallacies-guide.tsx            Full catalog page body
│   ├── scroll-indicator.tsx           Floating ↓/↑ button
│   ├── theme-toggle.tsx               Light / dark
│   ├── lang-selector.tsx              EN / PT / ES
│   └── site-header.tsx + site-footer.tsx
└── lib/
    ├── db.ts                          Prisma client (better-sqlite3 adapter)
    ├── fallacies.ts                   46-fallacy catalog + golden-angle color palette
    ├── schema.ts                      Zod schemas for sentences, findings, result
    ├── prompt.ts                      Localized fallacy prompts
    ├── claims-schema.ts               Zod schemas for Claim and ClaimType
    ├── claims-prompt.ts               Claimify-style 4-stage prompt
    ├── verdict-schema.ts              Zod schemas for Verdict + source tiers + confidence floor
    ├── verify-claim-prompt.ts         Sonar fact-check prompt (PT/EN/ES + source-tier hints)
    ├── neutrality-schema.ts           Zod schemas for 8 issue types + text-type + verdict
    ├── neutrality-prompt.ts           Neutrality prompt with the 8 patterns
    ├── explain-schema.ts              Zod schemas for 4 levels + 7 section roles + explanation
    ├── explain-prompt.ts              Explain prompt, calibrated per audience level
    ├── paper-review-schema.ts         Ledger/research/review schemas
    ├── paper-review-prompt.ts         Venue-calibrated adversarial review prompts
    ├── paper-review-markdown.ts       Deterministic review export
    ├── venues.ts                      Versioned venue profiles + DBLP result types
    ├── sentences.ts                   PT-aware sentence segmenter (numbers, initialisms)
    ├── paragraphs.ts                  Section/paragraph segmenter (heading-aware, sentence fallback)
    ├── chunker.ts                     Sentence-aware chunking (~12k chars per chunk)
    ├── sse.ts                         Client-side SSE parser
    ├── rate-limit.ts                  In-memory token bucket per IP
    ├── settings.ts                    Admin-tunable runtime settings (cached 30s)
    ├── openrouter-credits.ts          Wrapper around OpenRouter /credits (5-min cache)
    ├── i18n/                          Provider + EN/PT/ES messages
    ├── ingest/                        URL (SSRF-protected, browser-headers), PDF, TXT
    ├── factcheck/cache.ts             Verdict hash + getCached/putCached with per-type TTL
    └── llm/
        ├── types.ts                   Provider interface
        ├── jsonSchema.ts              JSON Schema for fallacy tool
        ├── claimsJsonSchema.ts        JSON Schema for fact-check claim extractor
        ├── neutralityJsonSchema.ts    JSON Schema for neutrality tool
        ├── explainJsonSchema.ts       JSON Schema for explain tool
        ├── stream.ts                  StreamEvent + ClaimStreamEvent + NeutralityStreamEvent + ExplainStreamEvent unions
        ├── openrouter.ts              Provider: OpenRouter via OpenAI SDK
        ├── verifyClaim.ts             Single-claim Sonar verifier (cache-first, force=true skips)
        ├── fallback.ts                withModelFallback() — client-side retry across model chain
        └── index.ts                   getProvider() + MODEL_CATALOG (🇺🇸 GPT, 🇨🇳 DeepSeek)
```

## Public API & MCP

Five text pipelines are exposed as a documented, **synchronous** REST API
(request → JSON, no SSE). Adversarial paper review uses a persisted,
**asynchronous** job API. Both surfaces are also available through MCP. Docs:
[`/api-access`](https://jiddu.app/api-access).

```
POST /api/v1/detect-fallacies
POST /api/v1/fact-check
POST /api/v1/assess-neutrality
POST /api/v1/explain
POST /api/v1/detect-slop
POST /api/v1/adversarial-reviews
GET  /api/v1/adversarial-reviews/{id}
```

Body is `{ "text": "…" }` (40–2000 chars; up to 10000 for `fact-check`) plus optional `lang` (`en`/`pt`/`es`) and, for explain, `level`. Authenticate with an account-generated `X-Jiddu-Key`. Verified users create and revoke keys in `/account?tab=api`; every key is assigned to that WorkOS account, stored only as a hash, shown once and rate-limited independently. Requests use that account's included access or Jiddu credits. Credit-funded calls reserve the maximum route estimate, then settle from OpenRouter's returned token counts and real cost plus the configured margin; the rate card is used only when provider accounting is unavailable. Successful and failed analysis runs are persisted under the key owner's account and appear in both account and admin analysis history. `fact-check` extracts and verifies each claim via Sonar, capped by `api.maxClaims`; uncached verification calls are charged individually.

- **Adversarial review API:** start a job with one multipart `file`, or JSON `{ "pdf_url": "https://…", "depth": "standard" }`. `depth` is `standard` or `deep`. The `202` response includes the id and status URL. Poll `GET /api/v1/adversarial-reviews/{id}` until `status` is `complete` or `failed`. Complete jobs include the structured review, public audit summary, source-verification metadata, and viewer/Markdown/print URLs.
- **MCP server (remote, recommended):** the hosted endpoint at `https://jiddu.app/api/mcp` exposes five synchronous text tools plus `start_adversarial_review` and `get_adversarial_review`. Compatible MCP clients discover [WorkOS AuthKit MCP](https://workos.com/docs/authkit/mcp) automatically, open Jiddu sign-in and receive a resource-scoped bearer token. Tool calls use included platform access for allowlisted users and reserve, settle and debit Jiddu Credits for everyone else, so no REST API key is required.
- **MCP server (local):** the same tools also ship as a standalone package, [`packages/jiddu-mcp`](./packages/jiddu-mcp), for offline/dev use — run from source (`node dist/index.js`), not published to npm. Machine-oriented docs: [`packages/jiddu-mcp/AGENT.md`](./packages/jiddu-mcp/AGENT.md).
- **Evals:** fixed test sets in [`evals/`](./evals), plus a 30-case balanced synthetic SPECS benchmark under [`evals/paper-review`](./evals/paper-review). GPT-5.4 mini, GPT-5.5, GPT-5.6 Luna and GPT-5.6 Luna Pro all detected 30/30 injected defects; Luna Pro returned 8% fewer findings than standard Luna. See the [benchmark report](./evals/paper-review/report.md). Run deterministic tests with `npm test`; the paid specialist benchmark is opt-in via `OPENROUTER_API_KEY=<key> npm run eval:paper-review`.
- **Paid smoke test:** `DATABASE_URL=postgresql://... npm run smoke:openrouter-postgres` exercises every OpenRouter-backed mode, persists and rereads each result in a disposable PostgreSQL database, reports latency/token/cost data, and removes its temporary rows. Use `SMOKE_ONLY=economical`, `paper-review-standard`, or `paper-review-deep` to narrow the run; `SMOKE_OPENROUTER_PROVIDER=OpenAI` can pin the Luna upstream while diagnosing provider-specific failures.

## API (internal SSE endpoints)

These are the streaming endpoints the web app itself uses.

### `POST /api/analyze`

Streams `text/event-stream`. Events:

| Event        | Payload                                                                                           |
|--------------|---------------------------------------------------------------------------------------------------|
| `meta`       | `{ id, title, source, sourceRef, sentences, provider, model, chunkCount }`                       |
| `chunkStart` | `{ index, sentenceIds }`                                                                         |
| `finding`    | `{ sentenceIds, fallacy, severity, quote, explanation }` — one per detected fallacy              |
| `chunkDone`  | `{ index }`                                                                                       |
| `chunkError` | `{ index, message }` — non-fatal; other chunks continue                                          |
| `done`       | `{ id, score, summary }` — final aggregated state                                                |
| `error`      | `{ error }` — analysis aborted                                                                   |

Request bodies:

```json
{ "type": "url",  "url": "https://…",  "lang": "pt" }
{ "type": "text", "text": "…",         "lang": "en" }
```

…or multipart with `file=<PDF or TXT>` + `lang`. The optional `model` field accepts `gpt-5.6-luna` or `deepseek-v4-flash-0731` and is prepended to the default fallback chain — usually you can omit it.

### `GET /api/analysis/[id]`

Returns the persisted analysis as JSON.

### `POST /api/factcheck`

Same input shape as `/api/analyze`, different output. Streams `text/event-stream` with events:

| Event        | Payload                                                                                |
|--------------|----------------------------------------------------------------------------------------|
| `meta`       | `{ id, title, source, sourceRef, sentences, provider, model, chunkCount }`             |
| `chunkStart` | `{ index, sentenceIds }`                                                               |
| `claim`      | `{ id, sentenceIds, statement, type, rationale }` — one per extracted claim            |
| `chunkDone`  | `{ index }`                                                                            |
| `chunkError` | `{ index, message }`                                                                   |
| `done`       | `{ id, claimCount, truncated }`                                                        |
| `error`      | `{ error }`                                                                            |

Claim `type` is one of `numeric`, `date`, `quote`, `causal`, `categorical`. Capped at 50 claims per call.

### `POST /api/factcheck/[id]/verify`

Triggers verdict pass for an extraction. Streams `text/event-stream`:

| Event       | Payload                                                                          |
|-------------|----------------------------------------------------------------------------------|
| `meta`      | `{ id, model, claimCount, language }`                                            |
| `verdict`   | `{ claimId, verdict, confidence, rationale, sources[], model, cached }`          |
| `claimError`| `{ claimId, message }`                                                           |
| `done`      | `{ id, verdictCount, errorCount, cacheHits, cacheMisses }`                       |
| `error`     | `{ error }`                                                                      |

`verdict ∈ { supported | contradicted | mixed | unverified }`. Confidence below 0.5 forces `unverified`. Sources come from Perplexity's annotation channel; each source carries a `tier` (primary / scholarly / think_tank / journalistic / commercial_content / informal) and a `stateControlled` boolean.

### `POST /api/factcheck/[id]/claim/[claimId]/verify`

Per-claim refresh — bypasses cache, calls Sonar fresh, replaces just that claim's verdict in the persisted JSON. Returns the new `Verdict` as plain JSON (no SSE). Counts against the admin-configurable per-claim refresh quota.

### `POST /api/factcheck/[id]/claim/[claimId]/feedback`

User-side "this verdict is wrong" flag. Body: `{ reason?: string }` (capped at 1000 chars). Snapshots the current statement and verdict so the operator can review the report even if the verdict changes later. Reports enter a private moderation queue with status `open`.

### `POST /api/neutrality`

Same input shape as `/api/analyze` and `/api/factcheck`. Streams `text/event-stream`:

| Event        | Payload                                                                              |
|--------------|--------------------------------------------------------------------------------------|
| `meta`       | `{ id, title, source, sourceRef, sentences, provider, model, chunkCount }`           |
| `chunkStart` | `{ index, sentenceIds }`                                                             |
| `finding`    | `{ sentenceIds, issue, severity, quote, explanation }` — one per neutrality pattern  |
| `chunkDone`  | `{ index }`                                                                          |
| `chunkError` | `{ index, message }`                                                                 |
| `done`       | `{ id, verdict, confidence, rationale, textType, findingsCount }`                    |
| `error`      | `{ error }`                                                                          |

`issue` is one of `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. The document-level `verdict ∈ { neutral | partisan_lean | explicitly_partisan | manipulation }` aggregates the worst per-chunk verdict.

### `POST /api/explain`

Same input shape as `/api/analyze`, plus a `level` field (`eli5` | `high_school` | `undergrad` | `expert`, default `undergrad`). Streams `text/event-stream`:

| Event        | Payload                                                                        |
|--------------|--------------------------------------------------------------------------------|
| `meta`       | `{ id, title, source, sourceRef, level, blocks, provider, model, chunkCount }` |
| `chunkStart` | `{ index, blockIds }`                                                          |
| `finding`    | `{ blockIds, role, explanation }` — one per explained paragraph                |
| `chunkDone`  | `{ index }`                                                                    |
| `chunkError` | `{ index, message }`                                                           |
| `done`       | `{ id, overview, findingsCount }`                                              |
| `error`      | `{ error }`                                                                    |

`role` is one of `background`, `objective`, `method`, `result`, `interpretation`, `limitation`, `conclusion`. Unlike the other pipelines the unit is the **paragraph** — a `block` with the same `{id,start,end,text}` shape as a sentence — and the model returns one explanation per substantive paragraph plus a whole-document `overview` written at the chosen `level`.

### `POST /api/slop`

Same URL/text/file inputs and SSE event pattern as `/api/analyze`. Each `finding` is `{ sentenceIds, pattern, severity, quote, explanation }`; `done` is `{ id, score, summary }`. The result persists at `/s/[id]`. The endpoint detects observable writing patterns only and must not be interpreted as an authorship classifier.

### `POST /api/review` (web-app internal)

Accepts `multipart/form-data` with exactly one `file` PDF. Optional fields: `lang`, `model`, `reviewDepth` (`standard` or `deep`), `venueProfileId`, `venue`, `venueYear`, `venueTrack`, `paperType`, `reviewDate`. The PDF is parsed in LiteParse academic mode, rejected rather than truncated above 300,000 extracted characters, and up to six visually relevant pages are rendered for inspection.

This long-running route streams:

| Event       | Payload                                                                                                                |
|-------------|------------------------------------------------------------------------------------------------------------------------|
| `meta`      | `{ id, title, sourceRef, parser, pageCount, visualPageCount, model, venueTarget, venueProfileVerified, chunkCount: 9 }` |
| `stage`     | `{ index, total: 9, name }`: `ledger`, `research`, `specs`, `verification`, `synthesis`, `self_critique`, `source_validation`, `quality_audit`, or `finalize` |
| `chunkDone` | `{ index }`                                                                                                            |
| `done`      | `{ id, recommendation, weaknessCount }`                                                                                |
| `error`     | `{ error }`                                                                                                            |

The persisted final result is shown at `/r/[id]`; `GET /api/review/[id]/markdown` exports the same stored review as deterministic Markdown. `GET /api/review/venues?q=…` merges curated profiles with account-free DBLP venue discovery. These routes support the browser. Automation should use the stable asynchronous `/api/v1/adversarial-reviews` contract above.

### Live mode (beta) — `/live`

A separate page at `/live` listens to live audio (microphone or browser-tab capture) via the OpenAI Realtime API (`gpt-live-transcribe`) and surfaces fallacies as the speaker talks. The transcription session uses the balanced `medium` delay profile by default and passes English, Portuguese and Spanish together as language hints so the interface locale does not constrain multilingual speech. The Live API routes include:

- `POST /api/live/token` — mints a short-lived ephemeral client secret so the browser can open a WebRTC connection directly to OpenAI for **transcription** (`gpt-live-transcribe`). Requires `OPENAI_API_KEY`. This call never touches OpenRouter.
- `POST /api/live/analyze` — a separate, later call: SSE stream that ingests the cumulative transcript in sliding windows (eagerly after ~800 new characters, or every 30s once at least ~120 characters are available) and emits `finding` events. Each window receives the preceding four sentences as context. **This is the analysis step**, running the same fallacy prompt routed via OpenRouter (same GPT-5.6 Luna / DeepSeek V4 Flash 0731 picker as the other pipelines) — a different model and provider from the OpenAI transcription above. Send `{ finalize: true }` on Stop to process the remaining text, compute the final score and commit the session.
- `POST /api/live/diarize` — opt-in post-session speaker labeling. Before upload, the UI confirms the additional cost and shows a duration-based Jiddu Credit estimate. The route accepts the browser-local recording (maximum 25 MB), forwards it transiently to OpenAI's `gpt-4o-transcribe-diarize`, returns timestamped speaker segments and does not persist the audio. Usage is settled separately by actual audio duration.
- `PUT /api/live/diarize` — explicitly saves a reviewed speaker-labeled transcript and edited speaker names to the authenticated owner's existing Live session. The saved transcript appears in account analysis history; no audio is included.

Notes:
- Tab capture requires Chrome or Edge — Safari/Firefox don't expose tab audio via `getDisplayMedia`. The Microphone source works everywhere.
- During capture, audio is streamed Browser → OpenAI directly via WebRTC. The browser keeps a temporary, downloadable recording. Only after a separate cost confirmation and speaker-identification request does that recording pass through the Jiddu server to OpenAI's file transcription API; neither the route nor Jiddu storage retains it. The user may then explicitly save only the labeled text and edited speaker names to account history.
- The local recorder targets 48 kbps so a 60-minute session normally remains below OpenAI's 25 MB file-transcription limit. Browsers may choose a different bitrate, so the UI and server both enforce the size ceiling.
- Hard cap of 60 minutes per session to keep cost predictable (`gpt-live-transcribe` is $0.017/min ≈ $1/hour, plus the analysis LLM cost).
- The page is intentionally not linked from the nav while in beta — access it by URL.

## Fallacy score

| Range  | Label              |
|--------|--------------------|
| 0–15   | Clean reasoning    |
| 16–35  | Minor issues       |
| 36–60  | Several fallacies  |
| 61–80  | Highly fallacious  |
| 81–100 | Propagandistic     |

Each individual finding has a binary severity (`low` / `high`). The 0–100 score is computed as a weighted average across chunks.

## Deployment

Jiddu ships with a multi-stage [`Dockerfile`](./Dockerfile) and [`docker-compose.yml`](./docker-compose.yml). Configure the production environment and start the app plus its private PostgreSQL service with Docker Compose. PostgreSQL is bound only to the host loopback interface and is not exposed publicly.

The container entrypoint applies Prisma migrations before accepting traffic. If a reverse proxy sits in front of Jiddu, disable response buffering for the SSE analysis routes so findings reach the browser as they are generated.

Production does not deploy automatically from GitHub. After committing all
intended changes, publish with:

```bash
npm run deploy
```

The script pushes `main`, updates and rebuilds the `jiddu-vps` container, then
verifies the deployed commit SHA, container state and public health check. A
plain `git push` alone is not a production deployment.

## Proprietary software

Copyright © 2026 Rafael M. Ehlers. All rights reserved.

Jiddu is proprietary software. The source code is not licensed for copying, redistribution, modification, or self-hosting without prior written permission.
