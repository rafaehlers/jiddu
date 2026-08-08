# Fact-check model A/B benchmark

This paid benchmark sends the same fixed, stratified PolitiFact sample through
the production `verifyClaim()` pipeline using both configured Perplexity model
families:

- `perplexity/sonar`
- `perplexity/sonar-reasoning-pro`

The default A/B run uses 24 claims: six each from the LIAR2 `true`,
`mostly_true`, `false`, and `pants_on_fire` buckets. The deterministic sampling
seed ensures both models receive the exact same statements and that later runs
remain comparable.

## Run

```bash
OPENROUTER_API_KEY=... npm run eval:factcheck-models
```

For a larger sample:

```bash
OPENROUTER_API_KEY=... npx tsx scripts/benchmark-politifact.mts \
  --sample=200 \
  --models=perplexity/sonar,perplexity/sonar-reasoning-pro
```

The harness bypasses cache reads and disables cache writes, so it does not
need or modify a Jiddu database. Downloaded LIAR2 data and timestamped JSON
results are written under the gitignored `scripts/data/` directory.

## Measurements

Each model is evaluated on:

- polar agreement with the human PolitiFact label;
- strict polar disagreement, `mixed`, and `unverified` rates;
- mean, median, and p95 response latency;
- provider-reported OpenRouter cost and token use;
- mean number of cited sources and zero-source responses;
- mean confidence and per-claim-type agreement.

The pairwise section additionally reports how often both models return the
same verdict and which model alone matches the expected label on disagreements.

## Decision rule

Keep Sonar as the default when it materially reduces latency and cost without
causing a meaningful increase in strict polar disagreement or zero-source
results. Keep Reasoning Pro as an admin-selectable override only when a larger
benchmark shows enough pairwise wins to justify the extra latency and cost.

Do not interpret a related news result as proof. Both models must continue to
return cited evidence and the Jiddu verdict schema; human review remains the
final authority.

The latest recorded 24-claim run is documented in
[`evals/fact-check/model-ab-report.md`](../evals/fact-check/model-ab-report.md).
