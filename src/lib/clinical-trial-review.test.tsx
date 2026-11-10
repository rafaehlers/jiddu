import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ClinicalTrialCheck } from "../components/clinical-trial-check";
import { CLINICAL_TRIAL_COPY } from "./clinical-trial-copy";
import {
  CLINICAL_TRIAL_CHECKS,
  ClinicalTrialCheckSchema,
  type ClinicalTrialCheck as Assessment,
} from "./clinical-trial-schema";
import { withClinicalTrialReport } from "./clinical-trial-review";
import { SpecsStageResultSchema, type QualityAudit, type SpecsStageResult } from "./paper-review-audit-schema";
import { PaperReviewResultSchema, type PaperReviewResult } from "./paper-review-schema";
import { paperReviewToMarkdown } from "./paper-review-markdown";
import { getBlogPost } from "./blog";
import { MESSAGES } from "./i18n/messages";

// Synthetic evidence only: the same outcome/population/time point is 25/100
// in the abstract and 20/100 in Table 2. No patient data or provider calls.
function assessment(concern = true): Assessment {
  return {
    studyDesign: "randomized",
    rationale: "Participants were prospectively allocated to two interventions at random.",
    locations: ["p. 2, Methods"],
    checks: CLINICAL_TRIAL_CHECKS.map((key) => ({
      key,
      status: concern && key === "abstract_results" ? "demonstrable_error" : "no_issue_found",
      details: concern && key === "abstract_results"
        ? "The abstract reports 25/100 events; Table 2 reports 20/100 for the same outcome, population and time point."
        : "The supplied methods and results provide no evidenced concern for this item.",
      locations: ["p. 1, Abstract", "p. 4, Table 2"],
      findingIds: concern && key === "abstract_results" ? ["E1"] : [],
    })),
  };
}

function stage(concern = true): SpecsStageResult {
  return SpecsStageResultSchema.parse({
    criterion: "evaluations",
    summary: "Synthetic trial assessment.",
    clinicalTrialCheck: assessment(concern),
    computationChecks: [],
    findings: concern ? [{
      id: "E1", criterion: "evaluations", title: "Inconsistent event count",
      body: assessment().checks[0].details,
      locations: ["p. 1, Abstract", "p. 4, Table 2"],
      severity: "MODERATE", confidence: 0.95, retainInFinal: true, claimIds: [],
    }] : [],
  });
}

function review(): PaperReviewResult {
  return {
    paper: "Synthetic clinical trial", author: "Example Research Group",
    venueTarget: "General scholarly standard", reviewDate: "2026-11-10",
    stageFindings: { story: "Scope.", presentation: "Reporting.", evaluations: "Methods.", correctness: "Consistency.", significance: "Contribution." },
    summary: "A synthetic example for review rendering.", strengths: [],
    weaknesses: [{
      id: "W1", severity: "MODERATE", title: "Inconsistent event count",
      body: assessment().checks[0].details,
      locations: ["p. 1, Abstract", "p. 4, Table 2"], sourceFindingIds: ["E1"],
    }],
    questions: [], overallAssessment: "The event count needs clarification.",
    publicationPath: ["Resolve the conflicting event counts."],
    recommendation: "Minor revision", sources: [],
  };
}

const quality: QualityAudit = {
  summary: "Synthetic quality assessment.", flags: [],
  findingDecisions: [{ findingId: "E1", decision: "retain", reason: "The passages conflict." }],
};

test("clinical concerns require a complete, nonduplicated checklist and localized evidence", () => {
  const duplicate = assessment();
  duplicate.checks[1].key = duplicate.checks[0].key;
  assert.equal(ClinicalTrialCheckSchema.safeParse(duplicate).success, false);
  const incomplete = assessment();
  incomplete.checks.pop();
  assert.equal(ClinicalTrialCheckSchema.safeParse(incomplete).success, false);
  const unlocated = assessment();
  unlocated.checks[0].locations = [];
  assert.equal(ClinicalTrialCheckSchema.safeParse(unlocated).success, false);
  const unsupported = assessment();
  unsupported.checks[0].findingIds = [];
  assert.equal(ClinicalTrialCheckSchema.safeParse(unsupported).success, false);
});

test("clinical concerns cannot cite absent, unretained or non-evaluation specialist findings", () => {
  const missing = stage();
  missing.findings = [];
  assert.equal(SpecsStageResultSchema.safeParse(missing).success, false);
  const unretained = stage();
  unretained.findings[0].retainInFinal = false;
  assert.equal(SpecsStageResultSchema.safeParse(unretained).success, false);
  const wrongStage = stage();
  wrongStage.criterion = "correctness";
  assert.equal(SpecsStageResultSchema.safeParse(wrongStage).success, false);
  const falseReassurance = assessment(false);
  falseReassurance.checks[0].findingIds = ["E1"];
  assert.equal(ClinicalTrialCheckSchema.safeParse(falseReassurance).success, false);
});

test("retained clinical findings survive synthesis, parsing and Markdown export", () => {
  const result = PaperReviewResultSchema.parse(withClinicalTrialReport(review(), [stage()], "en", quality));
  assert.equal(result.clinicalTrial?.assessment.checks[0].status, "demonstrable_error");
  const markdown = paperReviewToMarkdown(result);
  assert.ok(markdown.includes("Clinical trial methodological check"));
  assert.ok(markdown.includes("Abstract and results — Demonstrable error"));
  assert.ok(markdown.includes("Related weaknesses: W1"));
  assert.ok(markdown.includes("p. 4, Table 2"));
});

test("dismissed or lost findings become unassessable instead of persisting as accusations", () => {
  for (const language of ["en", "pt", "es"] as const) {
    const original = stage();
    for (const dismissed of [false, true]) {
      const finalReview = review();
      if (!dismissed) finalReview.weaknesses = [];
      const audit: QualityAudit = { ...quality, findingDecisions: [{
        findingId: "E1", decision: dismissed ? "dismiss" : "retain", reason: "Synthetic audit reason.",
      }] };
      const result = withClinicalTrialReport(finalReview, [original], language, audit);
      const item = result.clinicalTrial!.assessment.checks[0];
      assert.equal(item.status, "not_assessable");
      assert.equal(item.details, CLINICAL_TRIAL_COPY[language].unretained);
      assert.deepEqual(item.findingIds, []);
      assert.equal(original.clinicalTrialCheck!.checks[0].status, "demonstrable_error");
    }
  }
});

test("a clean control retains no concerns and does not become certification", () => {
  const cleanReview = { ...review(), weaknesses: [] };
  const result = withClinicalTrialReport(cleanReview, [stage(false)], "en", quality);
  assert.ok(result.clinicalTrial?.assessment.checks.every((item) => item.status === "no_issue_found"));
  const markdown = paperReviewToMarkdown(result);
  assert.ok(markdown.includes("No issue identified does not establish validity"));
  assert.ok(!markdown.includes("Demonstrable error"));
});

test("non-trial and legacy reports remain readable without a clinical section", () => {
  const legacy = PaperReviewResultSchema.parse(review());
  const nonTrial = SpecsStageResultSchema.parse({
    criterion: "evaluations", summary: "Observational cohort; no intervention assigned.",
    findings: [], computationChecks: [], clinicalTrialCheck: null,
  });
  const result = withClinicalTrialReport(legacy, [nonTrial], "pt", quality);
  assert.equal(result.clinicalTrial, undefined);
  assert.deepEqual(result, legacy);
  assert.ok(!paperReviewToMarkdown(result).includes("Clinical trial methodological check"));
  const oldStage = { criterion: "evaluations", summary: "Legacy assessment.", findings: [] };
  assert.equal(SpecsStageResultSchema.safeParse(oldStage).success, true);
});

test("the report and print checklist render localized labels, evidence and final weakness links", () => {
  for (const language of ["en", "pt", "es"] as const) {
    const result = withClinicalTrialReport(review(), [stage()], language, quality);
    const copy = CLINICAL_TRIAL_COPY[language];
    for (const print of [false, true]) {
      const html = renderToStaticMarkup(<ClinicalTrialCheck report={result.clinicalTrial!} weaknesses={result.weaknesses} print={print} />);
      assert.ok(html.includes(copy.title));
      assert.ok(html.includes(copy.statuses.demonstrable_error));
      assert.ok(html.includes('href="#weakness-W1"'));
      assert.ok(html.includes("p. 4, Table 2"));
      assert.equal((html.match(/<li[ >]/g) ?? []).length, 9);
    }
    assert.ok(paperReviewToMarkdown(result).includes(copy.title));
  }
});

test("the existing blog post and methodology document clinical checks in all three locales", () => {
  const post = getBlogPost("what-is-adversarial-review")!;
  assert.equal(post.updatedAt, "2026-11-10");
  for (const language of ["en", "pt", "es"] as const) {
    const article = post.translations[language];
    assert.ok(article.body.includes("https://doi.org/10.64898/2026.10.25.26366455"));
    assert.ok(article.faq!.length >= 5);
    assert.ok(article.cta?.description);
    const howItWorks = JSON.stringify(MESSAGES[language].how_it_works_sections);
    assert.ok(howItWorks.includes("https://doi.org/10.64898/2026.10.25.26366455"));
  }
});
