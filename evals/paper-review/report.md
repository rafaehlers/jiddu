# Adversarial paper-review specialist benchmark

Run through 2026-07-31 against 30 synthetic, page-tagged manuscript excerpts:
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
| GPT-5.6 Luna (low reasoning) | 30 / 30 | 100.0% | 50 | 1.67 |
| GPT-5.6 Luna Pro (medium reasoning) | 30 / 30 | 100.0% | 46 | 1.53 |

All four models detected every injected defect. GPT-5.6 Luna Pro returned 8%
fewer findings than standard Luna and slightly longer explanations on average
(477 vs 455 body characters), which is consistent with modestly lower
fragmentation rather than lower recall on this set. The older GPT-5.5 run
remains the most consolidated result (34 findings, 1.13 per case).

This is a targeted prompt regression benchmark, not evidence that the models
are equally capable on complete real papers. The cases are intentionally
unambiguous and do not measure cross-paper novelty research, visual reasoning,
long-context retention, source validation, final synthesis, or the independent
critic. Harder blinded full-paper cases are still needed to measure the
incremental value of Deep mode without a ceiling effect.

Artifacts:

- [`results-gpt-5.4-mini.json`](./results-gpt-5.4-mini.json)
- [`results-gpt-5.5.json`](./results-gpt-5.5.json)
- [`results-gpt-5.6-luna.json`](./results-gpt-5.6-luna.json)
- [`results-gpt-5.6-luna-pro.json`](./results-gpt-5.6-luna-pro.json)
- [`summary.json`](./summary.json)
