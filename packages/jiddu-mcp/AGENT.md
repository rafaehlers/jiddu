# Jiddu tools — agent guide

Machine-oriented reference for the five Jiddu tools (`detect_fallacies`, `fact_check`, `assess_neutrality`, `explain`, `detect_slop`), exposed via the `jiddu-mcp` MCP server and the REST API at `https://jiddu.app/api/v1/*`.

Jiddu helps you read text critically. Reach for it whenever you are about to **trust, quote, cite, or repeat** a piece of text — an argument, a news excerpt, a source, a paper.

## Shared contract

- **Input:** every tool takes `text` (40–2000 characters). `lang` (`en` | `pt` | `es`, default `en`) sets the language of the human-readable explanations; the structural fields (verdicts, labels, roles, names) are always stable English enums. `explain` also takes `level`.
- **Auth (REST):** send `X-Jiddu-Key: <key>`. Via MCP the key is configured in the server env — never pass it as a tool argument.
- **Synchronous:** one request → one JSON response. No streaming, no IDs, nothing persisted.
- **Errors:** `400` bad input, `401` missing/invalid key, `422` text too short (<40) or no analyzable content, `429` rate limited (body has `retry_after_seconds`), `502/503` upstream model issue.

## When to use which

| Goal | Tool |
| --- | --- |
| "Is this argument reasoned, or does it rely on rhetorical tricks?" | `detect_fallacies` |
| "Are the factual statements here actually true?" | `fact_check` |
| "Is this written even-handedly, or is it slanted?" | `assess_neutrality` |
| "What does this dense paragraph actually mean?" | `explain` |
| "Does this prose read templated / machine-assembled?" | `detect_slop` |

`detect_fallacies`, `assess_neutrality`, `explain`, and `detect_slop` are fast and cheap. `fact_check` is **slower and metered** — it runs a live web search per claim — so call it deliberately, on text you actually need verified.

---

## `detect_fallacies`

Returns every logical fallacy found, with the offending excerpt and why it's fallacious.

**Response**
```json
{
  "fallacies": [
    { "name": "Ad hominem", "excerpt": "...", "explanation": "..." }
  ],
  "fallacy_count": 2,
  "verdict": "fallacies_found"
}
```
`verdict` is `fallacies_found` or `clean`. `name` is a stable English fallacy label (e.g. `Straw man`, `False dichotomy`, `Appeal to authority`, `Appeal to popularity (ad populum)`).

**Example** — input `"Everyone agrees this is the best plan, so anyone who disagrees must be a fool who hates progress."` →
```json
{
  "fallacies": [
    { "name": "Appeal to popularity (ad populum)", "excerpt": "Everyone agrees this is the best plan", "explanation": "Treats widespread agreement as proof of truth." },
    { "name": "Ad hominem", "excerpt": "anyone who disagrees must be a fool who hates progress", "explanation": "Attacks opponents' character instead of their reasons." }
  ],
  "fallacy_count": 2,
  "verdict": "fallacies_found"
}
```

---

## `fact_check`

Extracts the verifiable claims from the text and checks each against live web search.

**Response**
```json
{
  "claims": [
    { "claim": "...", "verdict": "true", "explanation": "...", "confidence": "high" }
  ],
  "overall_verdict": "reliable",
  "truncated": false
}
```
- Per-claim `verdict`: `true` | `false` | `misleading` | `unverifiable`. `confidence`: `high` | `medium` | `low`.
- `overall_verdict`: `reliable` (claims check out) | `questionable` (some unverifiable/misleading, or no checkable claims) | `unreliable` (contains false claims).
- `truncated: true` means the text had more claims than the per-request cap; only the first N were checked.

**Example** — input `"The Eiffel Tower is in Paris and was completed in 1889."` → three claims, each `verdict: "true"`, `overall_verdict: "reliable"`.

Note: a claim with real-world nuance (e.g. "water boils at 100°C" without stating pressure) may come back `misleading`/`unverifiable` rather than `true`. Read the per-claim `explanation`.

---

## `assess_neutrality`

Scores how neutral the text is and surfaces specific bias signals. Deliberately does **not** classify political direction (left/right).

**Response**
```json
{
  "score": 0.24,
  "label": "highly_biased",
  "signals": [
    { "type": "loaded_language", "excerpt": "...", "explanation": "..." }
  ],
  "summary": "..."
}
```
- `score`: 0–1, where 1 = perfectly neutral.
- `label`: `neutral` (≥0.75) | `mostly_neutral` (0.5–0.75) | `biased` (0.25–0.5) | `highly_biased` (<0.25).
- `signals[].type`: `loaded_language` | `one_sided` | `omission` | `framing`.

**Example** — a news excerpt calling protesters "freedom-loving" and the state a "so-called government" → `score 0.24`, `label "highly_biased"`, signals of `loaded_language` and `framing`.

---

## `detect_slop`

Flags AI-slop writing patterns — stock phrasing, manufactured drama, templated structures, hollow claims — with the offending excerpt per finding and an overall slop score. **Detects patterns, never authorship**: it will not claim a text was or wasn't written by AI (humans write slop too), and a named pattern with a quote is evidence you can check.

**Response**
```json
{
  "patterns": [
    { "name": "Buzzword salad", "excerpt": "...", "explanation": "..." }
  ],
  "pattern_count": 3,
  "score": 62,
  "label": "heavily_templated",
  "summary": "..."
}
```
- `score`: 0–100, higher = more patterned filler. `label`: `reads_human` (<16) | `light_seasoning` (16–35) | `patterned` (36–60) | `heavily_templated` (61–80) | `assembly_line` (≥81).
- `name` is a stable English pattern label (e.g. `Buzzword salad`, `Binary contrast`, `Weasel attribution`, `Fake-profound kicker`, `Colon reveal`).

**Example** — input `"This isn't just an update. It's a paradigm shift. Experts agree the results are truly game-changing."` → three patterns (`Binary contrast`, `Buzzword salad`, `Weasel attribution`), `score` in the heavily-templated band.

Use before publishing your own draft, or when deciding how much to trust polished-sounding prose. Findings explain what a cleaner version would do (state the point, name the source, give the number) but never rewrite the text.

---

## `explain`

Explains a passage paragraph by paragraph at a chosen audience level, tagging each paragraph's role in the argument.

**Input** adds `level`: `eli5` | `high_school` | `undergrad` (default) | `expert`.

**Response**
```json
{
  "overview": "...",
  "level": "high_school",
  "paragraphs": [
    { "role": "result", "explanation": "..." }
  ]
}
```
`role`: `background` | `objective` | `method` | `result` | `interpretation` | `limitation` | `conclusion`. Best on structured academic/technical prose; the `level` controls vocabulary and depth only.

---

## Chaining

The tools compose well for a "should I trust this?" workflow:

1. **`fact_check`** the passage — are the facts right?
2. **`assess_neutrality`** the same passage — even if the facts check out, is the framing slanted?
3. **`detect_fallacies`** if it's an argument — does the reasoning hold up independent of the facts?

A source can be factually `reliable` yet `highly_biased`, or `clean` of fallacies yet built on `false` claims — running more than one tool gives a fuller picture than any single verdict. Use `explain` first when the text is too dense to evaluate at all.

## Limits

- Text length: 40–2000 characters per call. For longer documents, chunk and call per chunk, or use the Jiddu web app.
- Languages: English, Portuguese, Spanish.
- Rate limits are per-key; on `429`, back off for `retry_after_seconds`.
- Outputs are automated and can be wrong — they are signals to prompt verification, not final authority. Always surface the `explanation`/`summary`, not just the verdict.
