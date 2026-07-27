# Adversarial paper-review specialist benchmark

Run on 2026-07-27 against 30 synthetic, page-tagged manuscript excerpts:
six injected flaws for each SPECS criterion (Story, Presentation, Evaluations,
Correctness and Significance). Each case is sent only to its assigned
specialist. A case passes when at least one returned finding contains one of
the case's expected diagnostic terms.

The runner uses strict model routing: fallback is disabled and every stored
row records the actual model returned by the provider.

| Requested and actual model | Passed | Accuracy | Findings returned | Mean findings/case |
| --- | ---: | ---: | ---: | ---: |
| GPT-5.4 mini | 30 / 30 | 100.0% | 49 | 1.63 |
| GPT-5.5 (high reasoning) | 30 / 30 | 100.0% | 34 | 1.13 |

Both models detected all injected defects. GPT-5.5 reached the same ceiling
with 30.6% fewer findings and longer, more consolidated explanations on
average (516 vs 414 body characters), which is consistent with lower
fragmentation rather than lower recall on this set.

This is a targeted prompt regression benchmark, not evidence that the models
are equally capable on complete real papers. The cases are intentionally
unambiguous and do not measure cross-paper novelty research, visual reasoning,
long-context retention, source validation, final synthesis, or the independent
critic. Harder blinded full-paper cases are still needed to measure the
incremental value of Deep mode without a ceiling effect.

Artifacts:

- [`results-gpt-5.4-mini.json`](./results-gpt-5.4-mini.json)
- [`results-gpt-5.5.json`](./results-gpt-5.5.json)
- [`summary.json`](./summary.json)
