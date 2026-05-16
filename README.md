# Jiddu

> *truth is a pathless land* — J. Krishnamurti

Jiddu is a fallacy detector. Drop a URL, paste text, or upload a PDF/TXT, and Jiddu reads it like a critical-thinking reviewer — highlighting passages that contain logical fallacies and explaining each one in Word-style comments in the right margin. At the end, it gives the whole piece a fallacy score from 0 to 100.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma 7 + SQLite (via `@prisma/adapter-better-sqlite3`)
- LLM-agnostic: Anthropic Claude or OpenAI GPT, selectable per request
- PDF parsing: `pdfjs-dist` (legacy build, Node)
- Article extraction: `@mozilla/readability` + `jsdom`

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set ANTHROPIC_API_KEY and/or OPENAI_API_KEY
npx prisma migrate dev
npm run dev
```

Open http://localhost:3000.

## Environment

| Variable             | Purpose                                                 |
|----------------------|---------------------------------------------------------|
| `DATABASE_URL`       | SQLite path (default `file:./dev.db`)                   |
| `LLM_PROVIDER`       | Default provider when the client doesn't pass one       |
| `ANTHROPIC_API_KEY`  | Required if using Claude                                |
| `OPENAI_API_KEY`     | Required if using OpenAI                                |

## Architecture

```
src/
├── app/
│   ├── page.tsx                  Landing + upload form
│   ├── a/[id]/page.tsx           Dual-pane viewer
│   └── api/
│       ├── analyze/route.ts      POST: ingest → analyze → persist → return id
│       └── analysis/[id]/route.ts GET: load a saved analysis
├── components/
│   ├── upload-form.tsx           URL / paste / file tabs + provider picker
│   └── analysis-view.tsx         Left: marked-up text. Right: anchored comments.
└── lib/
    ├── db.ts                     Prisma client
    ├── fallacies.ts              28-fallacy taxonomy (id, EN/PT names, category)
    ├── schema.ts                 Zod schemas for sentences, findings, result
    ├── prompt.ts                 System prompt + per-request user prompt
    ├── sentences.ts              PT-aware sentence segmenter with offsets
    ├── ingest/
    │   ├── url.ts                Fetch + Readability
    │   ├── pdf.ts                pdfjs-dist text extraction
    │   └── text.ts               Pasted or .txt
    └── llm/
        ├── types.ts              Provider interface
        ├── jsonSchema.ts         Shared JSON Schema (tool input / structured output)
        ├── anthropic.ts          Claude via tool_use
        ├── openai.ts             GPT via structured outputs
        └── index.ts              getProvider()
```

## API

### `POST /api/analyze`

JSON:

```json
{ "type": "url",  "url": "https://…", "provider": "anthropic" }
{ "type": "text", "text": "…",        "provider": "openai"    }
```

…or multipart with `file=<PDF or TXT>` and optional `provider`.

Returns `{ "id": "…" }`. Visit `/a/<id>` to view.

### `GET /api/analysis/[id]`

Returns the full persisted analysis (text, sentences, findings, score).

## Fallacy score

| Range  | Meaning              |
|--------|----------------------|
| 0–15   | Clean reasoning      |
| 16–35  | Minor issues         |
| 36–60  | Several fallacies    |
| 61–80  | Highly fallacious    |
| 81–100 | Propaganda-level     |
