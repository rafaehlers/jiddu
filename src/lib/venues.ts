export type VenueKind = "conference" | "journal" | "preprint" | "generic";

export type PaperType =
  | "research"
  | "position"
  | "survey"
  | "dataset"
  | "theory"
  | "use-inspired"
  | "concept"
  | "negative-results";

export type VenueCriterion = {
  key: string;
  label: string;
  guidance: string;
};

export type VenueOfficialSource = {
  label: string;
  url: string;
};

export type VenueProfile = {
  id: string;
  name: string;
  acronym?: string;
  kind: VenueKind;
  edition: number;
  track: string;
  criteria: VenueCriterion[];
  requirements: string[];
  officialSources: VenueOfficialSource[];
  verified: boolean;
  verifiedAt: string;
};

export type ResolvedVenueProfile = VenueProfile & {
  selectedYear: number;
  selectedTrack: string;
  paperType: PaperType;
  targetLabel: string;
  profileVerified: boolean;
  verificationNote: string;
};

export type VenueSearchResult = {
  id: string;
  name: string;
  acronym?: string;
  kind: VenueKind;
  source: "curated" | "dblp";
  profileId?: string;
  edition?: number;
  defaultTrack?: string;
  catalogUrl?: string;
  verifiedProfile: boolean;
};

const GENERAL_CRITERIA: VenueCriterion[] = [
  {
    key: "soundness",
    label: "Soundness",
    guidance:
      "The central claims must follow from correct theory, appropriate methods, and evidence that actually tests them.",
  },
  {
    key: "originality",
    label: "Originality",
    guidance:
      "The paper must distinguish its precise contribution from the closest published prior work.",
  },
  {
    key: "significance",
    label: "Significance",
    guidance:
      "The contribution must matter beyond a narrow implementation detail and plausibly advance research or practice.",
  },
  {
    key: "clarity",
    label: "Clarity",
    guidance:
      "The manuscript must define its constructs, scope, methods, and limitations precisely enough to evaluate.",
  },
  {
    key: "reproducibility",
    label: "Reproducibility",
    guidance:
      "The paper must report enough methodological and experimental detail for an expert to verify or reproduce the result.",
  },
];

export const CURATED_VENUE_PROFILES: VenueProfile[] = [
  {
    id: "neurips-2026-main",
    name: "Conference on Neural Information Processing Systems",
    acronym: "NeurIPS",
    kind: "conference",
    edition: 2026,
    track: "Main track",
    criteria: [
      {
        key: "quality",
        label: "Quality",
        guidance:
          "Assess technical soundness, support for claims, appropriateness of methods, and whether the work is complete.",
      },
      {
        key: "clarity",
        label: "Clarity",
        guidance:
          "Assess organization, writing, and whether an expert reader has enough information to reproduce the results.",
      },
      {
        key: "significance",
        label: "Significance",
        guidance:
          "Assess demonstrable advancement, likely community use or impact, and the importance of the task or insight.",
      },
      {
        key: "originality",
        label: "Originality",
        guidance:
          "Assess new insights, problem framings, metrics, methods, or well-motivated combinations of existing techniques.",
      },
    ],
    requirements: [
      "Interpret the criteria according to the declared NeurIPS contribution type.",
      "Do not require state-of-the-art performance when the contribution is otherwise original and significant.",
      "Check that claims are supported and limitations are handled honestly.",
    ],
    officialSources: [
      {
        label: "NeurIPS 2026 Reviewer Guidelines",
        url: "https://neurips.cc/Conferences/2026/ReviewerGuidelines",
      },
    ],
    verified: true,
    verifiedAt: "2026-07-26",
  },
  {
    id: "icml-2026-main",
    name: "International Conference on Machine Learning",
    acronym: "ICML",
    kind: "conference",
    edition: 2026,
    track: "Main track",
    criteria: [
      {
        key: "soundness",
        label: "Soundness",
        guidance:
          "Determine whether hypotheses, proofs, experiments, and empirical conclusions substantiate the claimed contributions.",
      },
      {
        key: "presentation",
        label: "Presentation",
        guidance:
          "Assess whether the work is clearly, precisely, and sufficiently presented for expert evaluation.",
      },
      {
        key: "significance",
        label: "Significance",
        guidance:
          "Assess whether the contribution meaningfully advances machine-learning research or practice.",
      },
      {
        key: "originality",
        label: "Originality",
        guidance:
          "Assess the contribution against relevant prior work and distinguish consequential omissions from easily fixed citations.",
      },
    ],
    requirements: [
      "Substantiate every strength and weakness.",
      "Focus severity on issues critical to the central contribution.",
      "Consider research-ethics concerns when relevant.",
    ],
    officialSources: [
      {
        label: "ICML 2026 Reviewer Instructions",
        url: "https://icml.cc/Conferences/2026/ReviewerInstructions",
      },
      {
        label: "ICML 2026 Call for Papers",
        url: "https://icml.cc/Conferences/2026/CallForPapers",
      },
    ],
    verified: true,
    verifiedAt: "2026-07-26",
  },
  {
    id: "iclr-2026-main",
    name: "International Conference on Learning Representations",
    acronym: "ICLR",
    kind: "conference",
    edition: 2026,
    track: "Main track",
    criteria: [
      ...GENERAL_CRITERIA,
      {
        key: "ethics",
        label: "Ethics",
        guidance:
          "Identify potential Code of Ethics concerns and whether significant LLM use is disclosed where required.",
      },
    ],
    requirements: [
      "Summarize the claimed contribution before judging it.",
      "Give a comprehensive, evidence-backed account of strong and weak points.",
      "Do not penalize authors for omitting works available only as non-peer-reviewed arXiv preprints.",
    ],
    officialSources: [
      {
        label: "ICLR 2026 Reviewer Guide",
        url: "https://iclr.cc/Conferences/2026/ReviewerGuide",
      },
    ],
    verified: true,
    verifiedAt: "2026-07-26",
  },
  {
    id: "aaai-2026-main",
    name: "AAAI Conference on Artificial Intelligence",
    acronym: "AAAI",
    kind: "conference",
    edition: 2026,
    track: "Main Technical Track",
    criteria: [
      {
        key: "significance",
        label: "Significance",
        guidance:
          "Assess whether the contribution is substantive enough to warrant publication and matters to the AI community.",
      },
      {
        key: "novelty",
        label: "Novelty",
        guidance:
          "Assess the novelty of the problem, method, experiment, analysis, or integrative/critical contribution.",
      },
      {
        key: "soundness",
        label: "Theoretical or empirical soundness",
        guidance:
          "Assess whether the paper's theoretical and/or empirical claims are adequately supported.",
      },
      {
        key: "relevance",
        label: "Relevance",
        guidance:
          "Assess relevance to the AAAI community, including value beyond a single narrow sub-area.",
      },
      {
        key: "clarity",
        label: "Clarity",
        guidance: "Assess clarity and precision of exposition.",
      },
      {
        key: "responsibility",
        label: "Responsible and reproducible research",
        guidance:
          "Consider responsible research practices, sensitive data, bias, and concrete steps supporting reproducibility.",
      },
    ],
    requirements: [
      "Critical material must be self-contained in the main paper because supplementary material is optional for reviewers.",
      "A reproducibility checklist is expected.",
      "Special tracks use different rubrics and must not be evaluated as the main track.",
    ],
    officialSources: [
      {
        label: "AAAI-26 Main Technical Track Call",
        url: "https://aaai.org/conference/aaai/aaai-26/main-technical-track-call/",
      },
    ],
    verified: true,
    verifiedAt: "2026-07-26",
  },
  {
    id: "ijcai-2026-main",
    name: "International Joint Conference on Artificial Intelligence",
    acronym: "IJCAI-ECAI",
    kind: "conference",
    edition: 2026,
    track: "Main track",
    criteria: [
      {
        key: "novelty",
        label: "Novelty and originality",
        guidance: "Assess the novelty and originality of the paper's ideas.",
      },
      {
        key: "correctness",
        label: "Correctness",
        guidance:
          "Assess whether theory, methods, experiments, and conclusions are correct.",
      },
      {
        key: "clarity",
        label: "Clarity",
        guidance: "Assess clarity of reasoning and exposition.",
      },
      {
        key: "significance",
        label: "Significance and potential impact",
        guidance:
          "Assess the significance of the results and their potential impact on AI research or practice.",
      },
      {
        key: "presentation",
        label: "Presentation quality",
        guidance: "Assess the overall quality and precision of presentation.",
      },
    ],
    requirements: [
      "The submission must be autonomous and self-contained.",
      "Main-track papers are limited to seven body pages plus two reference pages.",
      "Flag glaring ethical violations involving data, privacy, consent, bias, safety, or societal harm.",
    ],
    officialSources: [
      {
        label: "IJCAI-ECAI 2026 Main Track Call",
        url: "https://2026.ijcai.org/ijcai-ecai-2026-call-for-papers-main-track/",
      },
    ],
    verified: true,
    verifiedAt: "2026-07-26",
  },
  {
    id: "cvpr-2026-main",
    name: "IEEE/CVF Conference on Computer Vision and Pattern Recognition",
    acronym: "CVPR",
    kind: "conference",
    edition: 2026,
    track: "Main track",
    criteria: [
      {
        key: "soundness",
        label: "Technical soundness",
        guidance:
          "Accepted work must be technically sound and make a meaningful contribution to computer vision.",
      },
      {
        key: "novelty",
        label: "Novelty",
        guidance:
          "Novelty objections must cite specific prior work and explain the precise overlap.",
      },
      {
        key: "impact",
        label: "Significance and potential impact",
        guidance:
          "Balance novelty, significance, and potential impact; state-of-the-art accuracy is not required by itself.",
      },
      {
        key: "reproducibility",
        label: "Reproducibility",
        guidance:
          "Assess whether the paper reports enough detail and handles code, data, and experimental evidence responsibly.",
      },
      {
        key: "ethics",
        label: "Data and research ethics",
        guidance:
          "Consider attribution, personal data and human subjects, societal impacts, and candid limitations.",
      },
    ],
    requirements: [
      "Minor, easily corrected flaws should not determine rejection.",
      "The submission is limited to eight content pages plus references.",
      "The paper should be self-contained and external links must not expand submission content.",
    ],
    officialSources: [
      {
        label: "CVPR 2026 Reviewer Guidelines",
        url: "https://cvpr.thecvf.com/Conferences/2026/ReviewerGuidelines",
      },
      {
        label: "CVPR 2026 Author Guidelines",
        url: "https://cvpr.thecvf.com/Conferences/2026/AuthorGuidelines",
      },
    ],
    verified: true,
    verifiedAt: "2026-07-26",
  },
];

export function curatedVenueSearch(query: string): VenueSearchResult[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return CURATED_VENUE_PROFILES.filter((profile) =>
    [profile.name, profile.acronym, profile.track]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalized)),
  ).map((profile) => ({
    id: `profile:${profile.id}`,
    name: profile.name,
    acronym: profile.acronym,
    kind: profile.kind,
    source: "curated",
    profileId: profile.id,
    edition: profile.edition,
    defaultTrack: profile.track,
    catalogUrl: profile.officialSources[0]?.url,
    verifiedProfile: true,
  }));
}

export function resolveVenueProfile(input: {
  profileId?: string;
  venueName?: string;
  year?: string;
  track?: string;
  paperType?: string;
}): ResolvedVenueProfile {
  const selectedYear = normalizeYear(input.year);
  const paperType = normalizePaperType(input.paperType);
  const curated = CURATED_VENUE_PROFILES.find(
    (profile) => profile.id === input.profileId,
  );

  if (!curated) {
    const name = input.venueName?.trim() || "General pre-submission review";
    const selectedTrack = input.track?.trim() || "Unspecified track";
    return {
      id: "generic",
      name,
      kind: name === "arXiv" ? "preprint" : "generic",
      edition: selectedYear,
      track: selectedTrack,
      selectedYear,
      selectedTrack,
      paperType,
      criteria: GENERAL_CRITERIA,
      requirements: [
        "Apply a general scholarly pre-submission standard.",
        "Do not claim that venue-specific rules were verified.",
      ],
      officialSources: [],
      verified: false,
      verifiedAt: "2026-07-26",
      profileVerified: false,
      verificationNote:
        "No versioned official venue rubric is available; a general scholarly standard was applied.",
      targetLabel: buildTargetLabel(name, selectedYear, selectedTrack, paperType),
    };
  }

  const selectedTrack = input.track?.trim() || curated.track;
  const profileVerified =
    selectedYear === curated.edition &&
    selectedTrack.toLowerCase() === curated.track.toLowerCase();

  return {
    ...curated,
    selectedYear,
    selectedTrack,
    paperType,
    profileVerified,
    verificationNote: profileVerified
      ? `Official ${curated.edition} ${curated.track} criteria were applied.`
      : `The closest available official profile is ${curated.edition} ${curated.track}; the selected edition or track was not independently verified.`,
    targetLabel: buildTargetLabel(
      curated.acronym ?? curated.name,
      selectedYear,
      selectedTrack,
      paperType,
    ),
  };
}

export function venueProfileForPrompt(profile: ResolvedVenueProfile): string {
  const criteria = profile.criteria
    .map(
      (criterion) =>
        `- ${criterion.label}: ${criterion.guidance}`,
    )
    .join("\n");
  const requirements = profile.requirements
    .map((requirement) => `- ${requirement}`)
    .join("\n");
  const sources =
    profile.officialSources.length > 0
      ? profile.officialSources
          .map((source) => `- ${source.label}: ${source.url}`)
          .join("\n")
      : "- No official venue sources available.";

  return `Target: ${profile.targetLabel}
Profile status: ${profile.profileVerified ? "VERIFIED" : "UNVERIFIED"}
Profile note: ${profile.verificationNote}

Evaluation criteria:
${criteria}

Venue-specific requirements:
${requirements}

Official sources:
${sources}`;
}

export function parseStoredVenueProfile(
  value: string | null | undefined,
): ResolvedVenueProfile | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<ResolvedVenueProfile>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.targetLabel !== "string" ||
      typeof parsed.profileVerified !== "boolean" ||
      !Array.isArray(parsed.criteria) ||
      !Array.isArray(parsed.officialSources)
    ) {
      return null;
    }
    return parsed as ResolvedVenueProfile;
  } catch {
    return null;
  }
}

function normalizeYear(value?: string): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return parsed >= 2000 && parsed <= 2100 ? parsed : 2026;
}

function normalizePaperType(value?: string): PaperType {
  const allowed: PaperType[] = [
    "research",
    "position",
    "survey",
    "dataset",
    "theory",
    "use-inspired",
    "concept",
    "negative-results",
  ];
  return allowed.includes(value as PaperType)
    ? (value as PaperType)
    : "research";
}

function buildTargetLabel(
  name: string,
  year: number,
  track: string,
  paperType: PaperType,
): string {
  return `${name} ${year} — ${track} · ${paperType.replaceAll("-", " ")} paper`;
}
