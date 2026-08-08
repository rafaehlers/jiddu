# Perplexity fact-check model A/B

**Run date:** 2026-08-08

**Sample:** 24 deterministic LIAR2/PolitiFact claims, six per polar label

**Pipeline:** Production `verifyClaim()`, English, cache reads and writes disabled

**Models:** `perplexity/sonar` and `perplexity/sonar-reasoning-pro`

## Result

| Metric | Sonar | Sonar Reasoning Pro |
|---|---:|---:|
| Polar agreement | **16/24 (66.7%)** | 14/24 (58.3%) |
| Strict polar disagreement | **0/24** | 1/24 (4.2%) |
| `mixed` | 7/24 (29.2%) | 7/24 (29.2%) |
| `unverified` | **1/24 (4.2%)** | 2/24 (8.3%) |
| Mean latency | **3.56 s** | 18.26 s |
| Median latency | **3.19 s** | 14.43 s |
| p95 latency | **7.06 s** | 56.03 s |
| OpenRouter provider cost | **US$0.1493** | US$0.2533 |
| Mean cited sources | 9.1 | **10.3** |
| Calls without sources | 0 | 0 |

Sonar was 5.12× faster on mean latency and cost 41.1% less. Reasoning Pro
returned 1.2 additional sources per claim on average, but did not improve the
quality metrics in this small run.

The two models returned the same verdict for 19 of 24 claims (79.2%). Both
matched the expected label on 13. Sonar alone matched on three disagreements;
Reasoning Pro alone matched on one; neither matched on seven.

## Decision

The result supports keeping `perplexity/sonar` as the first-pass, bulk and
API/MCP default. The measured latency difference is material for the live
Context experience, while the small sample showed no accuracy benefit from
using Reasoning Pro by default.

Use `perplexity/sonar` by default for explicit rechecks as well. Keep
`perplexity/sonar-reasoning-pro` available in Admin Settings as an opt-in
second opinion. This 24-claim run is a directional product benchmark, not
sufficient evidence that Sonar is universally more accurate. Re-run the same
harness with 200 claims before making a stronger quality claim or removing the
Reasoning Pro option.

## Reproduction

```bash
OPENROUTER_API_KEY=... npm run eval:factcheck-models
```

The raw result from this run is stored locally in the gitignored file
`scripts/data/bench-2026-08-08T06-53-35.json`.
