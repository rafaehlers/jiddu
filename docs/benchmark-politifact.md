# PolitiFact × Jiddu benchmark

**Run date:** 2026-05-31
**Pipeline:** Jiddu fact-check verifier — Perplexity Sonar Reasoning Pro via OpenRouter, English prompt, `force: true` (cache bypassed)
**Source:** [LIAR2 dataset](https://github.com/chengxuphd/liar2) (Apache-2.0, ~23k human-labeled PolitiFact claims, 2008-2023)
**Sample:** 200 claims, stratified 50-per-bucket across PolitiFact's four polar labels (`true`, `mostly_true`, `false`, `pants_on_fire`), filtered to 2020-onward so Perplexity Sonar's web search can still reach contemporary primary sources
**Cost:** ~$5-6 of OpenRouter credit (200 Sonar Reasoning Pro calls)

## TL;DR

> **On 200 claims drawn from PolitiFact's polar buckets, Jiddu's verdict matched the PolitiFact-human verdict in 67.5% of cases. Strict polar disagreement — Jiddu calling a claim the *opposite* polarity from the human — happened in only 4.5% of cases (9/200). The remaining 28% of cases were Jiddu returning `mixed` or `unverified` instead of a polar verdict, a pattern strongly concentrated on PolitiFact's `mostly_true` bucket (where 58% of human-rated `mostly_true` claims received `mixed` from Jiddu — arguably a coherent mapping, since "mostly true" and "claim is partly correct, partly not" overlap by definition).**

Restricting to PolitiFact's three least-ambiguous buckets (`true`, `false`, `pants_on_fire`), Jiddu agrees with the human verdict on **122 / 150 = 81.3%** of cases. The middle-ground `mostly_true` bucket is where Jiddu's higher-resolution `mixed` output replaces a polar verdict in over half the cases.

This is the first quality measurement for Jiddu against a third-party human gold standard. It will be re-run when the verifier prompt, model choice or pipeline changes materially.

## Setup

### What was measured

For each claim we sampled, we called the same `verifyClaim()` function used in production at `/api/factcheck/[id]/verify`. Inputs:
- `statement` — the claim text from LIAR2, as-is, without the surrounding PolitiFact article context
- `type` — a best-effort heuristic based on the statement text (numeric / date / quote / causal / categorical)
- `lang` — `en`
- `force: true` — bypasses Jiddu's verdict cache so every call hits Perplexity fresh

Output captured per claim:
- The verdict (`supported` / `contradicted` / `mixed` / `unverified`)
- The confidence (0-1)
- The rationale text
- The number of cited sources returned by Sonar
- The wall-clock duration

The harness ran with concurrency 6 (matching production). Total wall-clock: 6m 2s.

### How agreement was scored

PolitiFact uses a 6-level Truth-O-Meter (`pants_on_fire` / `false` / `mostly_false` / `half_true` / `mostly_true` / `true`); Jiddu uses 4 (`supported` / `contradicted` / `mixed` / `unverified`). We benchmarked only on the four polar buckets and applied this mapping:

| PolitiFact label | Expected Jiddu verdict |
|---|---|
| `true` | `supported` |
| `mostly_true` | `supported` |
| `false` | `contradicted` |
| `pants_on_fire` | `contradicted` |

A claim is **agreed** if Jiddu returned the expected polar verdict. It is **disagreed** if Jiddu returned the *opposite* polar verdict — the worst-case outcome. The remaining cases — `mixed` and `unverified` — are tallied separately, since they're closer to "we are not making a polar claim here" than to either agreement or disagreement.

Middle-ground PolitiFact labels (`mostly_false`, `half_true`) were excluded from sampling. They are the noise zone documented in [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909) — adding them would dilute the signal we're after.

## Results

### Headline numbers

| Outcome | Count | Share |
|---|---:|---:|
| Agreed (polar match) | 135 | **67.5%** |
| Disagreed (polar opposite) | 9 | **4.5%** |
| Returned `mixed` | 45 | 22.5% |
| Returned `unverified` | 11 | 5.5% |
| Errored | 0 | 0% |
| **Total** | **200** | 100% |

### Confusion matrix

Rows are PolitiFact labels, columns are Jiddu verdicts. Cells are claim counts (each row sums to 50).

| | supported | contradicted | mixed | unverified |
|---|---:|---:|---:|---:|
| **true** | **32** | 2 | 11 | 5 |
| **mostly_true** | 13 | 5 | **29** | 3 |
| **false** | 2 | **43** | 4 | 1 |
| **pants_on_fire** | 0 | **47** | 1 | 2 |

The diagonal — PolitiFact's polar claims that received the expected polar verdict — sums to 122. The single largest off-diagonal block is `mostly_true → mixed` with 29 cases (see "The `mixed` pattern" below).

### Per claim type

The harness assigned each claim a heuristic type. Smaller samples in some buckets:

| Type | Sample | Agreed | Rate |
|---|---:|---:|---:|
| `date` | 14 | 13 | **92.9%** |
| `numeric` | 10 | 7 | 70.0% |
| `quote` | 44 | 29 | 65.9% |
| `categorical` | 130 | 85 | 65.4% |
| `causal` | 2 | 1 | 50.0% |

`date`-typed claims (specific events with verifiable timestamps) are where Sonar shines. `categorical` — the catch-all for unstructured assertions — sits at the average. `causal` had too few samples to read into.

## The `mixed` pattern

The single most striking signal is the `mostly_true → mixed` overlap: **29 of 50 PolitiFact-`mostly_true` claims received `mixed` from Jiddu**.

This is *not* the same failure mode as a confidence-gradation 5-class scheme degrading at the boundary (per the Sahitaj 2025 finding). It's a structural overlap between two semantically adjacent categories:

- PolitiFact's `mostly_true` is defined as "the statement is accurate but needs clarification or additional information" — i.e. partly true with caveats.
- Jiddu's `mixed` is defined as "claim is partly supported and partly contradicted by evidence."

Both describe the same epistemic state. The difference is rhetorical: PolitiFact starts at "true" and walks down, Jiddu sits in the middle and reaches both ways. **If `mostly_true → mixed` is counted as a sensible mapping rather than a miss**, the effective sensible-output rate is `(135 + 29) / 200 = 82.0%`.

Concretely, from the run:
- *"The (Erie Co., N.Y.) health commissioner makes more than the governor, the vice president…"* — `mostly_true` per PolitiFact, `mixed` per Jiddu. Jiddu's rationale: "Health Commissioner's salary plus overtime exceeded base salaries of NY Gov…" — true in some comparisons, false in others.
- *"The Virginia Employment Commission is sixth in the nation for getting benefits to eligible people quickly"* — `mostly_true` per PolitiFact, `mixed` per Jiddu. Jiddu's rationale: ranked sixth in some periods, lower in others.

These are claims where every reader benefits from seeing the qualification, not a verdict in either direction.

## The 9 strict disagreements

The 9 cases where Jiddu's polar verdict was the opposite of PolitiFact's polar verdict are the most important set in this run. They split into four causes:

### (a) Time-sensitivity — Sonar evaluated current evidence against a historical claim (4 cases)

When a claim was made years ago about a topic where the situation has since reversed, Sonar tends to find evidence reflecting today's reality, not the claim's original moment.

- *"If the vaccine came out tomorrow, how in the heck would we get it to people? There is no game plan."* — Biden, Aug 2020. PolitiFact called this `mostly_true` reflecting the underplanned distribution at that point. Sonar searched in 2026 and found extensive vaccine-distribution documentation, calling it `contradicted`.
- *"NYC could pay to house its homeless population in hotel rooms, but de Blasio has refused to do that"* — April 2020. PolitiFact `mostly_true` for that point in time; Sonar found that NYC subsequently did house homeless in hotels and called the claim `contradicted`.
- *"A 'default on our debt' would be unprecedented in American history"* — Jeffries, Jan 2023. PolitiFact `mostly_true` in modern context; Sonar found historical near-defaults (1979 mini-default, 1933 gold-standard exit) and called it `contradicted`.
- *"No state gets back less from Washington than New York state"* — Cuomo, Jan 2021. State rankings shift year-to-year; Sonar pulled a 2025 Rockefeller Institute report that ranks NY differently.

**Takeaway:** the pipeline doesn't know when a claim was made and applies *current* web search results. A future enhancement would be to thread the claim's date into the Sonar prompt — "as of <date>, was this true?". Worth flagging in the rationale even if we don't fully solve it.

### (b) Literal-quote-true vs. meta-claim-false (2 cases)

PolitiFact often rates a claim `false` when the literal words were spoken but the implication is misleading. Sonar verifies the quote was said, then defends it.

- *"Foxconn hasn't hit job targets on its Wisconsin factory because 'No. 1, you had a pandemic'"* — Trump, 2020. PolitiFact `false` because Foxconn was already missing targets pre-pandemic. Sonar `supported` because the quote was indeed said.
- *"An audio message lists five ways people can prevent the novel coronavirus"* — chain message, 2020. PolitiFact `false` because the specific viral audio was misleading. Sonar `supported` because a similar NPR segment exists.

**Takeaway:** Jiddu doesn't distinguish "the claim was made" from "the claim is true." A short prompt addition asking "is the implication of this claim true?" instead of "is the claim true?" would catch some of these.

### (c) Sonar nuance is correct, PolitiFact was lenient in context (2 cases)

These are cases where Sonar's careful reading is technically more defensible than PolitiFact's rating — though the rating may have been correct in the original article's narrower framing.

- *"Says it's illegal to hold an absentee-only election or mail ballots to every registered voter"* — Sonar correctly notes Colorado, Oregon, Washington and others do this lawfully. PolitiFact's `true` here may reflect the narrower legal context of a specific state.
- *"Congress has one job here: to count electoral votes that have in fact been cast by any state"* — Sonar notes the Electoral Count Act gives Congress more authority than pure counting. PolitiFact `true` for the basic role description.

**Takeaway:** these are not failures — they are points where the automated pipeline reads more carefully than the human did. Worth not over-correcting.

### (d) Model output / rationale mismatch (1 case)

- *"Sen. Marco Rubio 'helped write the law to raise prescription prices'"* — Sonar's rationale says Rubio co-sponsored a bill that *would* raise prices if enacted (consistent with PolitiFact `mostly_true`), but the verdict came out `contradicted`. This is a model-level inconsistency between the explanatory text and the final label.

**Takeaway:** rationale-verdict mismatches happen at low rates. A future enhancement: an automated sanity-check pass that flags claims where the rationale and the verdict are mutually inconsistent.

## Limitations

1. **Sample size.** 200 claims gives a ±5% confidence interval on the headline number. A 500-claim run would tighten this to ±3%, at ~$15 cost.
2. **PolitiFact is US-political.** The benchmark says nothing about Jiddu's accuracy on Brazilian politics, science claims, sports claims, or any non-US-political domain. We selected this dataset because it's the only structured large-scale fact-check corpus with a permissive license, not because it represents Jiddu's input distribution. A Lupa / Aos Fatos benchmark in PT-BR would require scraping their published HTML — separate work.
3. **PolitiFact has its own biases.** The methodology has been criticized for inconsistent application across the political spectrum, particularly by right-leaning sources. We are measuring alignment with one human team's editorial judgement, not with "truth."
4. **No claim context.** Jiddu was given the bare claim text. PolitiFact's human fact-checkers had the original article, the speaker's full statement, and the historical context. This handicaps Jiddu compared to the human reference — which is also the realistic production condition.
5. **Self-reported quality.** This is run by the developer of the pipeline being measured. Reproducibility (below) is the mitigation.
6. **Test-time leakage risk.** Some PolitiFact claims in LIAR2 may be indexed by Perplexity's web search — Sonar could in principle find the original PolitiFact article and parrot the verdict. We did not filter for this; doing so would require manually inspecting source URLs. The confusion matrix doesn't show pathological accuracy that would suggest this is happening (43-47 / 50 on the polar buckets), so the bias is probably small.

## Reproduction

```bash
# From an authorized local checkout:
npm install
cp .env.example .env   # add your OPENROUTER_API_KEY
npx prisma migrate dev
npx tsx scripts/benchmark-politifact.mts            # full 200-claim run, ~6 min, ~$6
npx tsx scripts/benchmark-politifact.mts --sample=20  # smoke run, ~1 min, ~$0.60
```

The seed is fixed (`SHUFFLE_SEED = 0x6a696464`) so the same 200 claims are sampled across reruns. Per-claim results land in `scripts/data/bench-<timestamp>.json`. Re-run after any prompt change in `src/lib/verify-claim-prompt.ts` to detect regressions.

## See also

- [Claimify (arxiv 2502.10855)](https://arxiv.org/abs/2502.10855) — the paper that inspired Jiddu's claim extraction stage
- [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb et al., Forum AI / Stanford 2025) — methodology for source quality tiers and neutrality
- [Sahitaj et al. 2025 (arxiv 2502.08909)](https://arxiv.org/abs/2502.08909) — the paper showing 3-class beats 5-class for LLM fact-check labels
- [Lenz Research — LLM disagreement](https://lenz.io/research/llm-disagreement) — why panel disagreement isn't a bug
