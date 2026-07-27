import type { SpecsCriterion } from "../../src/lib/paper-review-audit-schema";

export type PaperReviewEvalCase = {
  id: string;
  criterion: SpecsCriterion;
  title: string;
  manuscript: string;
  expectedTerms: string[];
};

const CASES: Record<
  SpecsCriterion,
  Array<Omit<PaperReviewEvalCase, "id" | "criterion">>
> = {
  story: [
    {
      title: "Undefined central construct",
      manuscript:
        "<<< MANUSCRIPT PAGE 1 >>> We introduce alignment density as the central construct and claim it explains reliability. The term is used throughout but never defined or operationalized.",
      expectedTerms: ["construct", "define", "operational"],
    },
    {
      title: "Scope changes mid-paper",
      manuscript:
        "<<< MANUSCRIPT PAGE 1 >>> Our claim covers all clinical language models. <<< MANUSCRIPT PAGE 4 >>> We evaluate one English summarizer and conclude that all clinical AI systems are safe.",
      expectedTerms: ["scope", "general", "system"],
    },
    {
      title: "Motivation does not imply contribution",
      manuscript:
        "<<< MANUSCRIPT PAGE 1 >>> Data centers use energy, therefore a new tokenization algorithm is necessary. No argument connects tokenization to energy consumption.",
      expectedTerms: ["motivation", "connect", "argument"],
    },
    {
      title: "Non-autonomous submission",
      manuscript:
        "<<< MANUSCRIPT PAGE 2 >>> The proof of our central theorem and full method specification appear only in our companion paper; we omit both here.",
      expectedTerms: ["autonomous", "companion", "self-contained"],
    },
    {
      title: "Hypothesis added after results",
      manuscript:
        "<<< MANUSCRIPT PAGE 3 >>> After observing Table 2, we define the paper's hypothesis to match the winning condition.",
      expectedTerms: ["hypothesis", "post hoc", "result"],
    },
    {
      title: "Contribution contradicts limitation",
      manuscript:
        "<<< MANUSCRIPT PAGE 1 >>> The method requires no labels. <<< MANUSCRIPT PAGE 6 >>> A limitation is that every deployment requires 5,000 expert labels.",
      expectedTerms: ["contradict", "label", "qualifier"],
    },
  ],
  presentation: [
    {
      title: "Missing architecture",
      manuscript:
        "<<< MANUSCRIPT PAGE 3 >>> Our novel multi-stage architecture is the main contribution, but no diagram, algorithm, component list, or interface specification is provided.",
      expectedTerms: ["architecture", "diagram", "specification"],
    },
    {
      title: "Unreadable table",
      manuscript:
        "<<< MANUSCRIPT PAGE 5 >>> Table 2 contains the principal results, but columns have no units, abbreviations are undefined, and boldface is not explained.",
      expectedTerms: ["table", "unit", "abbreviation"],
    },
    {
      title: "Figure contradicts caption",
      manuscript:
        "<<< MANUSCRIPT PAGE 4 >>> Figure 1 rises from 20 to 40, while its caption says performance decreases from 40 to 20.",
      expectedTerms: ["figure", "caption", "contradict"],
    },
    {
      title: "Irreproducible method prose",
      manuscript:
        "<<< MANUSCRIPT PAGE 3 >>> We clean the data appropriately and tune the model carefully. No rules, parameters, versions, or pseudocode are given.",
      expectedTerms: ["reproduc", "parameter", "method"],
    },
    {
      title: "Terminology collision",
      manuscript:
        "<<< MANUSCRIPT PAGE 2 >>> Accuracy means exact-match rate. <<< MANUSCRIPT PAGE 5 >>> Accuracy means the average human preference score.",
      expectedTerms: ["termin", "accuracy", "definition"],
    },
    {
      title: "Results only in prose",
      manuscript:
        "<<< MANUSCRIPT PAGE 6 >>> We report dozens of model-by-dataset comparisons only in a dense paragraph, without a table, uncertainty, or sample counts.",
      expectedTerms: ["table", "uncertainty", "result"],
    },
  ],
  evaluations: [
    {
      title: "No competitive baseline",
      manuscript:
        "<<< MANUSCRIPT PAGE 5 >>> We compare the proposed model only with a random classifier, although the task has established competitive baselines.",
      expectedTerms: ["baseline", "competitive", "comparison"],
    },
    {
      title: "Train-test leakage",
      manuscript:
        "<<< MANUSCRIPT PAGE 4 >>> We tune prompts on the test answers and report accuracy on the same test set.",
      expectedTerms: ["leak", "test", "tune"],
    },
    {
      title: "No ablation",
      manuscript:
        "<<< MANUSCRIPT PAGE 5 >>> The gain is attributed to three new modules, but only the full system is evaluated.",
      expectedTerms: ["ablation", "module", "attribut"],
    },
    {
      title: "No uncertainty",
      manuscript:
        "<<< MANUSCRIPT PAGE 6 >>> Results are averages over five seeds, but no variance, confidence interval, per-seed result, or statistical test is reported.",
      expectedTerms: ["uncertainty", "variance", "seed"],
    },
    {
      title: "Metric misses the claim",
      manuscript:
        "<<< MANUSCRIPT PAGE 1 >>> We claim reduced hallucination. <<< MANUSCRIPT PAGE 6 >>> The only metric is response length.",
      expectedTerms: ["metric", "hallucination", "valid"],
    },
    {
      title: "Single-domain overgeneralization",
      manuscript:
        "<<< MANUSCRIPT PAGE 5 >>> One English news dataset is evaluated; the conclusion claims universal robustness across languages and domains.",
      expectedTerms: ["general", "domain", "language"],
    },
  ],
  correctness: [
    {
      title: "Incorrect percentage",
      manuscript:
        "<<< MANUSCRIPT PAGE 5 >>> The system answers 80 of 100 items correctly, which we report as 72% accuracy.",
      expectedTerms: ["80", "percent", "calcul"],
    },
    {
      title: "Causation from correlation",
      manuscript:
        "<<< MANUSCRIPT PAGE 6 >>> Latency and user satisfaction correlate at r=.31 in an observational log, proving that latency causes satisfaction.",
      expectedTerms: ["caus", "correl", "observ"],
    },
    {
      title: "Denominator changes",
      manuscript:
        "<<< MANUSCRIPT PAGE 5 >>> Table 2 compares 40 successes out of 50 with 60 successes out of 100 and calls the latter rate higher.",
      expectedTerms: ["denominator", "rate", "80"],
    },
    {
      title: "Conclusion reverses result",
      manuscript:
        "<<< MANUSCRIPT PAGE 5 >>> Error increases from 10% to 18%. <<< MANUSCRIPT PAGE 7 >>> We conclude that the method reduces error.",
      expectedTerms: ["contradict", "increase", "conclusion"],
    },
    {
      title: "Necessary treated as sufficient",
      manuscript:
        "<<< MANUSCRIPT PAGE 2 >>> Encryption is necessary for this guarantee. We therefore state that adding encryption alone is sufficient to guarantee privacy.",
      expectedTerms: ["necessary", "sufficient", "logic"],
    },
    {
      title: "Unsupported theorem step",
      manuscript:
        "<<< MANUSCRIPT PAGE 4 >>> The proof moves from bounded expectation to an almost-sure guarantee without an assumption or theorem justifying the step.",
      expectedTerms: ["proof", "assumption", "guarantee"],
    },
  ],
  significance: [
    {
      title: "Novelty by renaming",
      manuscript:
        "<<< MANUSCRIPT PAGE 1 >>> We rename standard retrieval-augmented generation as contextual memory injection; the procedure is otherwise unchanged.",
      expectedTerms: ["novel", "rename", "prior"],
    },
    {
      title: "No closest-work comparison",
      manuscript:
        "<<< MANUSCRIPT PAGE 2 >>> Related work lists broad surveys but never identifies or compares the closest method.",
      expectedTerms: ["closest", "prior", "compare"],
    },
    {
      title: "Trivial improvement",
      manuscript:
        "<<< MANUSCRIPT PAGE 6 >>> Accuracy rises from 91.20% to 91.21% with triple the compute; no uncertainty or practical consequence is discussed.",
      expectedTerms: ["significance", "trivial", "compute"],
    },
    {
      title: "Combination novelty unsupported",
      manuscript:
        "<<< MANUSCRIPT PAGE 1 >>> The sole novelty claim is combining two standard components; no argument establishes a non-obvious interaction.",
      expectedTerms: ["combination", "non-obvious", "novel"],
    },
    {
      title: "Venue fit unsubstantiated",
      manuscript:
        "<<< MANUSCRIPT PAGE 1 >>> This systems venue should accept the paper because AI is popular; no systems research question or artifact is presented.",
      expectedTerms: ["venue", "fit", "criterion"],
    },
    {
      title: "Impact claim lacks pathway",
      manuscript:
        "<<< MANUSCRIPT PAGE 7 >>> We claim the toy simulation will transform hospital practice, without clinical data, deployment analysis, or a transfer argument.",
      expectedTerms: ["impact", "clinical", "pathway"],
    },
  ],
};

export const PAPER_REVIEW_EVAL_CASES: PaperReviewEvalCase[] = (
  Object.entries(CASES) as Array<
    [SpecsCriterion, Array<Omit<PaperReviewEvalCase, "id" | "criterion">>]
  >
).flatMap(([criterion, cases]) =>
  cases.map((fixture, index) => ({
    ...fixture,
    id: `${
      {
        story: "S",
        presentation: "P",
        evaluations: "E",
        correctness: "C",
        significance: "G",
      }[criterion]
    }${String(index + 1).padStart(2, "0")}`,
    criterion,
  })),
);
