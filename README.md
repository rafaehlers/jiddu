# Jiddu

> *truth is a pathless land* — [J. Krishnamurti](https://en.wikipedia.org/wiki/Jiddu_Krishnamurti)

Jiddu is two tools in one for reading any text critically:

1. **Fallacy detector** — drop a URL, paste text, or upload a PDF/TXT and Jiddu highlights every passage that contains a logical fallacy, explains each in a Word-style margin comment, and assigns the whole piece a fallacy score from 0 to 100.
2. **Fact-check** — pull every verifiable claim (numbers, dates, quotes, causal and categorical assertions) out of the same text, then optionally run each through a web-search model (Perplexity Sonar) to get a verdict (`supported` / `contradicted` / `mixed` / `unverified`) with sources.

Live: **https://jiddu.app**

---

## Features

### Fallacy detector
- **Dual-pane viewer** — text on the left with each fallacious passage highlighted in its own color; explanations stack as anchored comments on the right.
- **Streaming analysis** — comments appear progressively while the LLM is still writing.
- **Multi-chunk parallel analysis** — texts up to ~200k chars are split at sentence boundaries and analyzed in parallel with bounded concurrency.
- **28 fallacies catalog** — covering relevance, ambiguity, presumption, emotional appeals, causal reasoning and evidence. Each has its own distinct color (golden-angle palette).
- **Fallacy guide page** at `/fallacies` and a per-fallacy modal opened from any comment.
- **Live mode** at `/live` — real-time fallacy detection on streamed audio (speech-to-text + analysis).
- **Demo analyses** in 3 languages (`/a/demo-en`, `/a/demo-pt`, `/a/demo-es`) loaded from the database — no LLM call needed to see the UX.

### Fact-check (Phase 1+2+3a)
- **Claim extraction** at `/factcheck` — Claimify-inspired 4-stage pipeline (selection → disambiguation → decomposition → decontextualization). Opinions, hypotheticals and rhetorical questions get dropped.
- **Per-claim verdict** at `/f/[id]` — opt-in "Verify claims" button. Each claim goes through Perplexity Sonar Reasoning Pro with web search, returns `supported` / `contradicted` / `mixed` / `unverified` + confidence + citation list.
- **Verdict cache** — claims are hashed (lang-prefixed sha256 of normalized statement) and persisted in a `ClaimVerdict` table. TTL by type: `numeric` 30 days, `quote/causal` 90 days, `date/categorical` 365 days. Re-verification is free for cached claims.
- **Per-claim refresh** — a per-card refresh button bypasses the cache when the user disagrees with a stored verdict.
- **Mode toggle on the home composer** — `Detector de Falácias` vs `Checar Fatos`, switches between the two pipelines while sharing input forms.

### Cross-cutting
- **Multi-model via OpenRouter** — GPT-5.4 mini (default) with MiniMax M2.7 as automatic fallback (client-side retry that re-tries only if no events were emitted yet). Sonar Reasoning Pro is used only for verification, never exposed in the model picker.
- **Trilingual UI** (EN, PT-BR, ES) — selector in the header, browser-language detection on first visit, persisted in localStorage. The LLM is also instructed to write in the chosen language.
- **SSRF-protected URL ingestion** — every fetch hop is DNS-resolved and rejected if it lands on RFC1918, loopback, link-local, CGNAT, multicast, or reserved IPv4/IPv6 ranges (covers the cloud metadata `169.254.169.254`). Body size capped at 5 MB.
- **Rate limiting** — in-memory token bucket per IP: 30 extractions/hour, 10 verifications/hour, with bursts. Returns 429 with `Retry-After`.
- **Dark mode default**, with a toggle that persists in localStorage.
- **Dynamic OG image** for shareable analysis links (`/a/[id]/opengraph-image`) + static OG for the site root.
- **Admin** at `/admin` (password-gated cookie) — list every analysis, view the verdict cache at `/admin/cache`, manually invalidate entries.
- **Google Analytics** (GA4 gtag.js) wired in the root layout.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** + **Tailwind 4**
- **Prisma 7** with `@prisma/adapter-better-sqlite3` — SQLite file persisted in a Docker volume
- **Streaming**: server-side `ReadableStream` emitting SSE; `partial-json` for incremental finding extraction
- **PDF parsing**: `pdfjs-dist`
- **Article extraction**: `@mozilla/readability` + `jsdom`

## Local development

```bash
git clone git@github.com:rafaehlers/jiddu.git
cd jiddu
npm install
cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY (one key powers analysis + fact-check).
# Optional: ADMIN_PASSWORD if you want the /admin area.
npx prisma migrate dev
node scripts/seed-demo.mjs   # populates demo analyses
npm run dev
```

Open <http://localhost:3000>. Try `/a/demo-en`, `/a/demo-pt`, `/a/demo-es` to see the viewer without spending a token.

## Environment

| Variable               | Purpose                                                              |
|------------------------|----------------------------------------------------------------------|
| `DATABASE_URL`         | SQLite path. Local dev: `file:./dev.db`. Docker: `file:/app/data/jiddu.db` |
| `OPENROUTER_API_KEY`   | Required — unified gateway used for every model. Get one at https://openrouter.ai/keys |
| `OPENROUTER_REFERER`   | Optional. Identifies the deployment in OpenRouter's analytics. Defaults to `https://jiddu.app` |

## Architecture

```
src/
├── app/
│   ├── page.tsx                       Home (hero + upload form + demo button)
│   ├── fallacies/page.tsx             Catalog reference, grouped by category
│   ├── factcheck/page.tsx             Fact-check composer
│   ├── a/[id]/
│   │   ├── page.tsx                   Analysis viewer (SSR)
│   │   └── opengraph-image.tsx        Dynamic OG image per analysis
│   ├── f/[id]/page.tsx                Fact-check viewer (SSR + client refresh)
│   ├── admin/
│   │   ├── page.tsx                   Admin login + analyses table
│   │   └── cache/page.tsx             Verdict cache viewer + invalidator
│   └── api/
│       ├── analyze/route.ts           POST: fallacy SSE stream
│       ├── analysis/[id]/route.ts     GET: load a saved analysis
│       ├── factcheck/route.ts         POST: claim extraction SSE stream
│       ├── factcheck/[id]/verify/route.ts            POST: bulk verdict SSE
│       └── factcheck/[id]/claim/[claimId]/verify/route.ts  POST: per-claim refresh (JSON)
├── components/
│   ├── jiddu-composer.tsx             Home body: form ↔ loading panel ↔ navigate
│   ├── factcheck-composer.tsx        Fact-check sibling of jiddu-composer
│   ├── factcheck-view.tsx            Two-column viewer with verdicts + sources
│   ├── upload-form.tsx                URL / paste / file tabs + mode toggle
│   ├── analysis-view.tsx              Dual-pane viewer with anchored comments
│   ├── fallacy-modal.tsx              In-page guide modal for one fallacy
│   ├── fallacies-guide.tsx            Full catalog page body
│   ├── share-link-bar.tsx             Copy-to-clipboard URL + toast
│   ├── scroll-indicator.tsx           Floating ↓/↑ button
│   ├── theme-toggle.tsx               Light / dark
│   ├── lang-selector.tsx              EN / PT / ES
│   └── site-header.tsx + site-footer.tsx
└── lib/
    ├── db.ts                          Prisma client (better-sqlite3 adapter)
    ├── fallacies.ts                   28-fallacy catalog + golden-angle color palette
    ├── schema.ts                      Zod schemas for sentences, findings, result
    ├── prompt.ts                      Localized system + user prompts
    ├── sentences.ts                   PT-aware sentence segmenter (abbreviations)
    ├── chunker.ts                     Sentence-aware chunking (~12k chars per chunk)
    ├── sse.ts                         Client-side SSE parser
    ├── i18n/                          Provider + EN/PT/ES messages
    ├── ingest/                        URL, PDF, TXT
    └── llm/
        ├── types.ts                   Provider interface
        ├── jsonSchema.ts              Shared JSON Schema fed to the model as a tool
        ├── claimsJsonSchema.ts        JSON Schema for the fact-check claim extractor
        ├── stream.ts                  StreamEvent + ClaimStreamEvent union types
        ├── openrouter.ts              Provider: OpenRouter via OpenAI SDK, function-calling streaming, partial-json
        ├── verifyClaim.ts             Single-claim Sonar verifier (cache-first, force=true skips)
        ├── fallback.ts                withModelFallback() — client-side retry across model chain
        └── index.ts                   getProvider() + MODEL_CATALOG
    ├── claims-prompt.ts               Claimify-style 4-stage system + user prompts
    ├── claims-schema.ts               Zod schemas for Claim and ClaimType
    ├── verify-claim-prompt.ts         Sonar fact-check prompt (PT/EN/ES + source hints)
    ├── verdict-schema.ts              Zod schemas for Verdict + confidence floor
    ├── rate-limit.ts                  In-memory token bucket per IP
    └── factcheck/cache.ts             Hash + getCached/putCached with per-type TTL
```

## API

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

…or multipart with `file=<PDF or TXT>` + `lang`. The optional `model` field accepts `gpt-5.4-mini` or `minimax-m2.7` and is prepended to the default fallback chain — usually you can omit it.

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

`verdict ∈ { supported | contradicted | mixed | unverified }`. Confidence below 0.5 forces `unverified`. Sources come from Perplexity's annotation channel.

### `POST /api/factcheck/[id]/claim/[claimId]/verify`

Per-claim refresh — bypasses cache, calls Sonar fresh, replaces just that claim's verdict in the persisted JSON. Returns the new `Verdict` as plain JSON (no SSE).

### Live mode (beta) — `/live`

A separate page at `/live` listens to live audio (microphone or browser-tab capture) via the OpenAI Realtime API (`gpt-realtime-whisper`) and surfaces fallacies as the speaker talks. Two endpoints back it:

- `POST /api/live/token` — mints a short-lived ephemeral client secret so the browser can open a WebRTC connection directly to OpenAI. Requires `OPENAI_API_KEY`.
- `POST /api/live/analyze` — SSE stream that ingests the cumulative transcript in sliding windows (~500 char delta or every 30s) and emits `finding` events. Send `{ finalize: true }` on Stop to compute the final score and commit the session.

Notes:
- Tab capture requires Chrome or Edge — Safari/Firefox don't expose tab audio via `getDisplayMedia`. The Microphone source works everywhere.
- Audio is streamed Browser → OpenAI directly via WebRTC; the Jiddu server only mints tokens and persists the transcript + findings.
- Hard cap of 60 minutes per session to keep cost predictable (`gpt-realtime-whisper` is $0.017/min ≈ $1/hour, plus the analysis LLM cost).
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

## Production deploy

The app ships in a multi-stage Docker image (Next standalone output + Prisma CLI in a side directory for migrations). Production runs on Hostinger VPS behind Nginx Proxy Manager.

### Stack on the VPS

| Item             | Location                                                |
|------------------|---------------------------------------------------------|
| App files        | `/opt/jiddu/`                                            |
| Production env   | `/opt/jiddu/.env` (chmod 600)                            |
| Deploy script    | `/opt/deploy-jiddu.sh` (git pull → build → up)           |
| Container        | `jiddu-app` (joined to `proxy-network`)                  |
| Volume           | `jiddu_jiddu_data` mounted at `/app/data`                |
| Proxy            | NPM proxy host → `http://jiddu-app:3000`                 |
| SSL              | Let's Encrypt via NPM                                    |
| SSE              | Custom nginx block in NPM advanced config — disables `proxy_buffering` on `/api/analyze` so findings stream in real time |

### CI/CD

```
git push origin main  →  GitHub Actions  →  SSH into VPS  →  /opt/deploy-jiddu.sh
```

`.github/workflows/deploy.yml` SSHes into the VPS using the `VPS_SSH_KEY` secret and runs the deploy script. The entrypoint (`docker-entrypoint.sh`) runs `prisma migrate deploy` and re-seeds the 3 demos (idempotent via `INSERT OR REPLACE`) on every container start.

### First-time setup

See the inline comments in `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`, and the deploy notes in the project memory.

## License

Private. Personal project.
