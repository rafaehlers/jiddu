import assert from "node:assert/strict";
import test from "node:test";
import { buildClaimsUserPrompt } from "./claims-prompt";
import {
  buildLiveAnalysisSetupPrompt,
  liveAnalysisNeedsDiarization,
  liveSpeakerAttribution,
  normalizeLiveAnalysisConfig,
  type LiveAnalysisConfig,
} from "./live-analysis-config";
import {
  applyLiveAnalysisConfig,
  createLiveContextForAnalysis,
} from "./live-analysis-context";
import { mergeLiveContext } from "./live-context-schema";
import type { Sentence } from "./schema";

const speech: LiveAnalysisConfig = {
  mode: "speech",
  participants: [
    {
      entityId: "participant_primary_speaker",
      name: "João Silva",
      role: "primary_speaker",
      placeholder: false,
    },
  ],
};

const sentences: Sentence[] = [
  { id: "s1", start: 0, end: 20, text: "Eu fui prefeito em 2019." },
];

test("single-speaker analysis skips diarization and exposes structural attribution", () => {
  assert.equal(liveAnalysisNeedsDiarization(speech), false);
  assert.deepEqual(liveSpeakerAttribution(speech), {
    speakerId: "participant_primary_speaker",
    speakerName: "João Silva",
    speakerRole: "primary_speaker",
  });
  assert.equal(
    liveAnalysisNeedsDiarization({ mode: "interview", participants: [] }),
    true,
  );
});

test("a speech without a supplied name gets a localized graph participant", () => {
  const normalized = normalizeLiveAnalysisConfig(
    { mode: "speech", participants: [] },
    "pt",
  );
  assert.equal(normalized.participants[0].name, "Discursante");
  assert.equal(normalized.participants[0].placeholder, true);

  const context = createLiveContextForAnalysis(normalized, "pt");
  assert.equal(context.entities[0].id, "participant_primary_speaker");
  assert.equal(context.entities[0].name, "Discursante");
  assert.equal(context.entities[0].sentenceIds.length, 0);
});

test("the configured speaker remains the first graph card across context windows", () => {
  const initial = createLiveContextForAnalysis(speech, "pt");
  const merged = mergeLiveContext(initial, {
    language: "pt",
    tags: [],
    topics: [{ label: "Economia", sentenceIds: ["s1"], confidence: 0.9 }],
    terms: [],
    entities: [
      {
        name: "Prefeitura de São Paulo",
        kind: "institution",
        description: "Instituição mencionada.",
        aliases: [],
        sentenceIds: ["s1"],
        confidence: 0.95,
        importance: 0.8,
      },
    ],
    relations: [],
    segment: {
      title: "Gestão municipal",
      summary: "O discurso menciona gestão municipal.",
      sentenceIds: ["s1"],
    },
    summary: "João Silva fala sobre gestão municipal.",
  });
  assert.equal(merged.entities[0].id, "participant_primary_speaker");
  assert.equal(merged.analysisConfig.mode, "speech");
});

test("changing the format replaces configured participants without removing detected entities", () => {
  const initial = createLiveContextForAnalysis(speech, "pt");
  const withDetected = {
    ...initial,
    entities: [
      ...initial.entities,
      {
        id: "entity1",
        name: "Brasil",
        kind: "country" as const,
        description: "País mencionado.",
        aliases: [],
        sentenceIds: ["s1"],
        confidence: 0.98,
        importance: 0.8,
      },
    ],
  };
  const panel = applyLiveAnalysisConfig(
    withDetected,
    {
      mode: "panel",
      participants: [
        {
          entityId: "participant_panelist_1",
          name: "Maria",
          role: "panelist",
          placeholder: false,
        },
      ],
    },
    "pt",
  );
  assert.deepEqual(
    panel.entities.map((entity) => entity.id),
    ["participant_panelist_1", "entity1"],
  );
});

test("speech prompts resolve first person to the configured name", () => {
  const setup = buildLiveAnalysisSetupPrompt(speech);
  const claims = buildClaimsUserPrompt(
    sentences,
    "pt",
    undefined,
    undefined,
    undefined,
    speech,
  );
  assert.match(setup, /single-speaker speech/i);
  assert.match(setup, /João Silva/);
  assert.match(setup, /Resolve first-person pronouns/);
  assert.match(setup, /do not turn P into/);
  assert.match(setup, /non-quote factual claims/i);
  assert.match(claims, /listener_supplied_analysis_setup/);
  assert.match(claims, /Do not call this person merely "the speaker"/);
});
