import assert from "node:assert/strict";
import test from "node:test";
import {
  buildExplanationLevelGuidance,
  CONTROLLED_CLARITY_GUIDANCE,
  EXPLANATION_LEVEL_PROFILES,
  formatSentenceRange,
} from "./explain-level-guidance";
import { EXPLAIN_LEVELS } from "./explain-schema";
import { buildExplainSystemPrompt } from "./explain-prompt";
import { buildPaperEvidenceSystemPrompt } from "./paper-evidence-prompt";
import { buildPaperMapSystemPrompt } from "./paper-map-prompt";

test("defines a complete and valid profile for every public audience level", () => {
  assert.deepEqual(Object.keys(EXPLANATION_LEVEL_PROFILES), [...EXPLAIN_LEVELS]);

  for (const level of EXPLAIN_LEVELS) {
    const profile = EXPLANATION_LEVEL_PROFILES[level];
    const [minimumWords, targetWords] = profile.sentenceWordTarget;
    const [minimumOverview, maximumOverview] = profile.overviewSentences;
    const [minimumFinding, maximumFinding] = profile.findingSentences;

    assert.ok(profile.audience.length > 0, `${level}: audience`);
    assert.ok(profile.assumedKnowledge.length > 0, `${level}: assumed knowledge`);
    assert.ok(profile.reasoningDepth.length > 0, `${level}: reasoning depth`);
    assert.ok(profile.terminology.length > 0, `${level}: terminology`);
    assert.ok(profile.avoid.length > 0, `${level}: avoid guidance`);
    assert.ok(minimumWords <= targetWords, `${level}: word target order`);
    assert.ok(targetWords <= profile.sentenceWordCeiling, `${level}: word ceiling`);
    assert.ok(minimumOverview <= maximumOverview, `${level}: overview range`);
    assert.ok(minimumFinding <= maximumFinding, `${level}: finding range`);
  }
});

test("makes high-school prose observably simpler than undergraduate prose", () => {
  const highSchool = EXPLANATION_LEVEL_PROFILES.high_school;
  const undergrad = EXPLANATION_LEVEL_PROFILES.undergrad;

  assert.ok(highSchool.sentenceWordTarget[0] < undergrad.sentenceWordTarget[0]);
  assert.ok(highSchool.sentenceWordTarget[1] < undergrad.sentenceWordTarget[1]);
  assert.ok(highSchool.sentenceWordCeiling < undergrad.sentenceWordCeiling);
  assert.match(highSchool.terminology, /define each field-specific term/i);
  assert.match(undergrad.terminology, /retain precise standard terminology/i);
  assert.match(highSchool.assumedKnowledge, /do not assume familiarity/i);
  assert.match(undergrad.assumedKnowledge, /research methods/i);
});

test("keeps child concrete and expert concise without collapsing either level", () => {
  const child = EXPLANATION_LEVEL_PROFILES.eli5;
  const highSchool = EXPLANATION_LEVEL_PROFILES.high_school;
  const undergrad = EXPLANATION_LEVEL_PROFILES.undergrad;
  const expert = EXPLANATION_LEVEL_PROFILES.expert;

  assert.ok(child.sentenceWordTarget[1] < highSchool.sentenceWordTarget[1]);
  assert.ok(child.sentenceWordCeiling < highSchool.sentenceWordCeiling);
  assert.match(child.terminology, /everyday words/i);
  assert.match(child.avoid, /baby talk/i);

  assert.ok(expert.findingSentences[1] < undergrad.findingSentences[1]);
  assert.ok(expert.sentenceWordTarget[1] < undergrad.sentenceWordTarget[1]);
  assert.ok(expert.sentenceWordCeiling < undergrad.sentenceWordCeiling);
  assert.match(expert.reasoningDepth, /novel or decisive/i);
  assert.match(expert.avoid, /outside the supplied text/i);
});

test("renders measurable guidance without losing fidelity safeguards", () => {
  const highSchool = buildExplanationLevelGuidance("high_school");
  const undergrad = buildExplanationLevelGuidance("undergrad");

  assert.match(highSchool, /12 to 20 words per sentence/);
  assert.match(highSchool, /Do not exceed 25 words/);
  assert.match(undergrad, /16 to 25 words per sentence/);
  assert.match(undergrad, /Do not exceed 30 words/);
  assert.match(CONTROLLED_CLARITY_GUIDANCE, /Preserve every fact, number/);
  assert.match(CONTROLLED_CLARITY_GUIDANCE, /one consistent term/);
});

test("injects every audience profile into every explanation surface", () => {
  const renderedProfiles = new Set<string>();

  for (const level of EXPLAIN_LEVELS) {
    const guidance = buildExplanationLevelGuidance(level);
    renderedProfiles.add(guidance);

    for (const prompt of [
      buildExplainSystemPrompt("pt", level),
      buildPaperMapSystemPrompt("pt", level),
      buildPaperEvidenceSystemPrompt("pt", level),
    ]) {
      assert.match(prompt, /AUDIENCE LEVEL:/);
      assert.ok(prompt.includes(guidance), `${level}: shared profile missing`);
      assert.ok(
        prompt.includes(CONTROLLED_CLARITY_GUIDANCE),
        `${level}: clarity guidance missing`,
      );
    }
  }

  assert.equal(renderedProfiles.size, EXPLAIN_LEVELS.length);
});

test("formats sentence ranges for prompt instructions", () => {
  assert.equal(formatSentenceRange([3, 5]), "3 to 5 sentences");
  assert.equal(formatSentenceRange([2, 2]), "2 sentences");
});
