# Jiddu API — eval report

Fixed test sets run against the public REST API. Each tool has 15–16 inputs with expected results in `evals/<tool>/expected.json`. Regenerate with `JIDDU_API_KEY=<key> npx tsx evals/run-evals.ts`.

Last run: 2026-06-27

## Accuracy by tool

| Tool | Passed | Total | Accuracy |
| --- | --- | --- | --- |
| Fallacy detection | 14 | 16 | 87.5% |
| Fact-check | 14 | 15 | 93.3% |
| Neutrality | 15 | 16 | 93.8% |
| Explain (role tagging) | 14 | 16 | 87.5% |

### What each grader checks

- **Fallacy detection** — the `verdict` matches (fallacies_found / clean) and every expected fallacy name appears in the response.
- **Fact-check** — `overall_verdict` matches (reliable / unreliable). Claims are verified live via Perplexity Sonar.
- **Neutrality** — the `label` matches exactly (neutral / mostly_neutral / biased / highly_biased).
- **Explain** — at least one returned paragraph carries the expected section `role`.

## Fallacy detection — per item

| ID | Result | Detail |
| --- | --- | --- |
| f01 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [ad hominem] |
| f02 | ❌ | verdict fallacies_found (want fallacies_found); matched 0/1 [straw] |
| f03 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [authority] |
| f04 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [emotion] |
| f05 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [dichotomy] |
| f06 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [slippery] |
| f07 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [popularity] |
| f08 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [circular] |
| f09 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [tradition] |
| f10 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [nature] |
| f11 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [loaded question] |
| f12 | ❌ | verdict fallacies_found (want fallacies_found); matched 0/1 [red herring] |
| f13 | ✅ | verdict fallacies_found (want fallacies_found); matched 1/1 [anecdot] |
| f14 | ✅ | verdict clean (want clean); matched 0/0 [—] |
| f15 | ✅ | verdict clean (want clean); matched 0/0 [—] |
| f16 | ✅ | verdict clean (want clean); matched 0/0 [—] |

## Fact-check — per item

| ID | Result | Detail |
| --- | --- | --- |
| c01 | ❌ | overall questionable (want reliable); 1 claims |
| c02 | ✅ | overall reliable (want reliable); 2 claims |
| c03 | ✅ | overall reliable (want reliable); 1 claims |
| c04 | ✅ | overall reliable (want reliable); 1 claims |
| c05 | ✅ | overall reliable (want reliable); 2 claims |
| c06 | ✅ | overall reliable (want reliable); 3 claims |
| c07 | ✅ | overall reliable (want reliable); 1 claims |
| c08 | ✅ | overall unreliable (want unreliable); 1 claims |
| c09 | ✅ | overall unreliable (want unreliable); 1 claims |
| c10 | ✅ | overall unreliable (want unreliable); 1 claims |
| c11 | ✅ | overall unreliable (want unreliable); 2 claims |
| c12 | ✅ | overall unreliable (want unreliable); 2 claims |
| c13 | ✅ | overall unreliable (want unreliable); 2 claims |
| c14 | ✅ | overall unreliable (want unreliable); 1 claims |
| c15 | ✅ | overall unreliable (want unreliable); 1 claims |

## Neutrality — per item

| ID | Result | Detail |
| --- | --- | --- |
| n01 | ✅ | label neutral (want neutral); direction ok; score 0.94 |
| n02 | ✅ | label neutral (want neutral); direction ok; score 0.95 |
| n03 | ✅ | label highly_biased (want highly_biased); direction ok; score 0.03 |
| n04 | ✅ | label highly_biased (want highly_biased); direction ok; score 0.23 |
| n05 | ✅ | label neutral (want neutral); direction ok; score 0.95 |
| n06 | ❌ | label highly_biased (want biased); direction ok; score 0.25 |
| n07 | ✅ | label neutral (want neutral); direction ok; score 0.9 |
| n08 | ✅ | label highly_biased (want highly_biased); direction ok; score 0.23 |
| n09 | ✅ | label neutral (want neutral); direction ok; score 0.94 |
| n10 | ✅ | label highly_biased (want highly_biased); direction ok; score 0.23 |
| n11 | ✅ | label neutral (want neutral); direction ok; score 0.94 |
| n12 | ✅ | label neutral (want neutral); direction ok; score 0.95 |
| n13 | ✅ | label highly_biased (want highly_biased); direction ok; score 0.04 |
| n14 | ✅ | label neutral (want neutral); direction ok; score 0.9 |
| n15 | ✅ | label neutral (want neutral); direction ok; score 0.92 |
| n16 | ✅ | label highly_biased (want highly_biased); direction ok; score 0.03 |

## Explain (role tagging) — per item

| ID | Result | Detail |
| --- | --- | --- |
| e01 | ✅ | roles [background] (want one of [background]) |
| e02 | ✅ | roles [objective] (want one of [objective]) |
| e03 | ✅ | roles [method] (want one of [method]) |
| e04 | ✅ | roles [result] (want one of [result]) |
| e05 | ❌ | roles [conclusion] (want one of [interpretation]) |
| e06 | ✅ | roles [limitation] (want one of [limitation]) |
| e07 | ✅ | roles [conclusion] (want one of [conclusion]) |
| e08 | ✅ | roles [background] (want one of [background]) |
| e09 | ✅ | roles [objective] (want one of [objective]) |
| e10 | ✅ | roles [method] (want one of [method]) |
| e11 | ✅ | roles [result] (want one of [result]) |
| e12 | ❌ | roles [conclusion] (want one of [interpretation]) |
| e13 | ✅ | roles [limitation] (want one of [limitation]) |
| e14 | ✅ | roles [conclusion] (want one of [conclusion]) |
| e15 | ✅ | roles [background] (want one of [background]) |
| e16 | ✅ | roles [method] (want one of [method]) |
