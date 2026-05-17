# Jiddu

> *truth is a pathless land* — [J. Krishnamurti](https://en.wikipedia.org/wiki/Jiddu_Krishnamurti)

Jiddu is a fallacy detector for any text. Drop a URL, paste text, or upload a PDF/TXT and Jiddu highlights every passage that contains a logical fallacy, explains each one in a Word-style margin comment, and assigns the whole piece a fallacy score from 0 to 100.

Live: **https://jiddu.app**

---

## Features

- **Dual-pane viewer** — text on the left with each fallacious passage highlighted in its own color; explanations stack as anchored comments on the right.
- **Streaming analysis** — comments appear progressively while the LLM is still writing.
- **Multi-chunk parallel analysis** — texts up to ~200k chars are split at sentence boundaries and analyzed in parallel with bounded concurrency.
- **Multi-model via OpenRouter** — Claude Opus 4.7, Claude Sonnet 4.6, GPT-5.4, GPT-5.4 mini, Gemini 2.5 Pro, DeepSeek V4 Pro, Qwen3.6 Plus, Kimi K2.6 (Moonshot), GLM-5 (Zhipu) and MiniMax M2.7 all behind one API. Pick the model per request from the dropdown.
- **28 fallacies catalog** — covering relevance, ambiguity, presumption, emotional appeals, causal reasoning and evidence. Each has its own distinct color (golden-angle palette).
- **Fallacy guide page** at `/fallacies` and a per-fallacy modal opened from any comment.
- **Trilingual UI** (EN, PT-BR, ES) — selector in the header, browser-language detection on first visit, persisted in localStorage. The LLM is also instructed to write the analysis in the chosen language.
- **Dark mode default**, with a toggle that persists in localStorage.
- **Dynamic OG image** for shareable links (`/a/[id]/opengraph-image`).
- **One-click share** with copy-to-clipboard URL bar + toast confirmation.
- **Scroll indicator** that flips between ↓ "to bottom" and ↑ "to top" depending on viewport position.
- **Demo analyses** in 3 languages (`/a/demo-en`, `/a/demo-pt`, `/a/demo-es`) loaded from the database — no LLM call needed to see the UX.

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
# Edit .env and set ANTHROPIC_API_KEY (or OPENAI_API_KEY).
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
│   ├── a/[id]/
│   │   ├── page.tsx                   Analysis viewer (SSR)
│   │   └── opengraph-image.tsx        Dynamic OG image per analysis
│   └── api/
│       ├── analyze/route.ts           POST: ingest → split → SSE stream of findings
│       └── analysis/[id]/route.ts     GET: load a saved analysis
├── components/
│   ├── jiddu-composer.tsx             Home body: form ↔ loading panel ↔ navigate
│   ├── upload-form.tsx                URL / paste / file tabs + provider picker
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
        ├── stream.ts                  StreamEvent union type
        ├── openrouter.ts              Single provider — OpenRouter via OpenAI SDK, function-calling streaming, partial-json
        └── index.ts                   getProvider() + MODEL_CATALOG
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
{ "type": "url",  "url": "https://…",  "model": "claude-opus-4.7", "lang": "pt" }
{ "type": "text", "text": "…",         "model": "gpt-5.4",         "lang": "en" }
```

…or multipart with `file=<PDF or TXT>` + `model` + `lang`. Valid `model` values: `claude-opus-4.7`, `claude-sonnet-4.6`, `gpt-5.4`, `gpt-5.4-mini`, `gemini-2.5-pro`, `deepseek-v4-pro`, `qwen3.6-plus`, `kimi-k2.6`, `glm-5`, `minimax-m2.7`.

### `GET /api/analysis/[id]`

Returns the persisted analysis as JSON.

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
