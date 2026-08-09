export type VenueKind = "conference" | "journal" | "preprint" | "generic";

export type PaperType =
  | "research"
  | "position"
  | "survey"
  | "dataset"
  | "theory"
  | "use-inspired"
  | "concept"
  | "negative-results"
  | "systematic-review"
  | "meta-analysis";

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
  aliases?: string[];
  defaultPaperType?: PaperType;
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
  defaultPaperType?: PaperType;
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

const MEDICAL_REPORTING_REQUIREMENTS = [
  "Apply the reporting standard that matches the study design: CONSORT for randomized trials, STROBE for observational studies, PRISMA for systematic reviews and meta-analyses, STARD for diagnostic studies, TRIPOD for prediction models, CARE for case reports, SQUIRE for quality-improvement studies, and CHEERS for economic evaluations.",
  "Check ethics approval, informed consent, prospective trial registration, protocol availability, and data-sharing disclosures whenever applicable.",
  "Distinguish statistical significance from clinical importance and require effect estimates, uncertainty, limitations, and harms to be reported proportionately.",
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
  {
    id: "jama-2026-original-investigation",
    name: "Journal of the American Medical Association",
    acronym: "JAMA",
    aliases: ["Journal of the AMA", "JAMA Journal"],
    kind: "journal",
    edition: 2026,
    track: "Original Investigation",
    criteria: [
      {
        key: "originality-timeliness",
        label: "Originality and timeliness",
        guidance:
          "Assess whether the material is original, current, and clearly differentiated from the closest published medical evidence.",
      },
      {
        key: "methods",
        label: "Appropriate study methods",
        guidance:
          "Assess whether the design, population, interventions or exposures, outcomes, and analyses appropriately answer the stated clinical or health question.",
      },
      {
        key: "data-validity",
        label: "Data validity and integrity",
        guidance:
          "Assess whether the data are credible, sufficiently reported, and analyzed in a way that supports independent evaluation of the findings.",
      },
      {
        key: "supported-conclusions",
        label: "Reasonable, supported conclusions",
        guidance:
          "Require conclusions and implications to follow from the reported results without causal, clinical, or policy overstatement.",
      },
      {
        key: "importance-interest",
        label: "Importance and general medical interest",
        guidance:
          "Assess whether the question and findings are important and relevant to JAMA's broad clinical, research, and health-policy readership.",
      },
      {
        key: "clarity",
        label: "Clear reporting",
        guidance:
          "Assess whether the writing, structured abstract, Key Points, tables, figures, and limitations communicate the study accurately and efficiently.",
      },
    ],
    requirements: [
      "For an Original Investigation, check the current JAMA limits and required elements, including a structured abstract, Key Points, a Data Sharing Statement, and no more than five tables and/or figures.",
      "For reports containing original data, identify whether responsibility for data integrity and the accuracy of the analysis is stated.",
      ...MEDICAL_REPORTING_REQUIREMENTS,
    ],
    officialSources: [
      {
        label: "JAMA Instructions for Authors",
        url: "https://jamanetwork.com/journals/jama/pages/instructions-for-authors",
      },
      {
        label: "JAMA For Authors",
        url: "https://jamanetwork.com/journals/jama/pages/for-authors",
      },
    ],
    verified: true,
    verifiedAt: "2026-08-08",
  },
  {
    id: "nejm-2026-original-article",
    name: "The New England Journal of Medicine",
    acronym: "NEJM",
    aliases: ["New England Journal of Medicine", "N Engl J Med"],
    kind: "journal",
    edition: 2026,
    track: "Original Article",
    criteria: [
      {
        key: "originality",
        label: "Originality",
        guidance:
          "Assess whether the study provides genuinely new evidence and differentiates its contribution from the closest published clinical research.",
      },
      {
        key: "clinical-impact",
        label: "Clinical importance",
        guidance:
          "Assess whether the findings could improve patient care or clinical practice, or materially advance understanding of human disease biology.",
      },
      {
        key: "scientific-integrity",
        label: "Scientific integrity",
        guidance:
          "Assess whether design, conduct, outcomes, and analyses are rigorous enough to support the central claims and withstand specialist scrutiny.",
      },
      {
        key: "statistical-rigor",
        label: "Statistical rigor",
        guidance:
          "Check effect estimates and confidence intervals, multiplicity control, missing-data handling, prespecification, sensitivity analyses, and the distinction between statistical and clinical significance.",
      },
      {
        key: "reporting",
        label: "Complete and accessible reporting",
        guidance:
          "Assess whether the abstract, methods, results, safety findings, limitations, and conclusions are complete, internally consistent, and understandable to a broad medical audience.",
      },
    ],
    requirements: [
      "For an Original Article, check the current NEJM limits and required elements, including a structured abstract, no more than five tables and figures, and the reference limit.",
      "A protocol and statistical analysis plan should accompany original research and contain enough detail to allow replication of the analysis in a similar data set.",
      "For clinical trials, check prospective registration, alignment with the protocol and statistical analysis plan, CONSORT flow reporting, and complete efficacy and safety results.",
      ...MEDICAL_REPORTING_REQUIREMENTS,
    ],
    officialSources: [
      {
        label: "NEJM Article Types",
        url: "https://www.nejm.org/author-center/article-types",
      },
      {
        label: "NEJM New Manuscripts and Statistical Reporting Guidelines",
        url: "https://www.nejm.org/author-center/new-manuscripts",
      },
      {
        label: "NEJM Editorial Policies",
        url: "https://www.nejm.org/about-nejm/editorial-policies",
      },
    ],
    verified: true,
    verifiedAt: "2026-08-08",
  },
  {
    id: "lancet-2026-article",
    name: "The Lancet",
    aliases: ["Lancet", "The Lancet Journal"],
    kind: "journal",
    edition: 2026,
    track: "Article",
    criteria: [
      {
        key: "medical-advance",
        label: "Advance to medical science or practice",
        guidance:
          "Assess whether the contribution materially advances or illuminates medical science, clinical practice, or public health.",
      },
      {
        key: "importance",
        label: "Importance and likely influence",
        guidance:
          "Assess whether the research question is consequential and whether the findings could change clinical practice, policy, or thinking about a disease or health problem.",
      },
      {
        key: "validity",
        label: "Methodological validity",
        guidance:
          "Assess whether the design, execution, analysis, and interpretation provide trustworthy evidence for every central claim.",
      },
      {
        key: "research-context",
        label: "Research in context",
        guidance:
          "Assess whether the paper identifies the evidence before the study, explains its added value, and states the implications of all available evidence without overstating novelty.",
      },
      {
        key: "general-readership",
        label: "Relevance and clarity for a general medical readership",
        guidance:
          "Assess whether the work has broad international relevance and is written clearly enough for clinicians and researchers outside the immediate specialty.",
      },
    ],
    requirements: [
      "Primary research Articles should include a Research in context panel covering evidence before the study, added value, and implications of all available evidence.",
      "For randomized controlled trials, check the protocol, registration, CONSORT reporting, prespecified outcomes, and a balanced account of benefits and harms.",
      "Check originality, authorship and contribution statements, competing interests, funding, and the required data-sharing statement.",
      ...MEDICAL_REPORTING_REQUIREMENTS,
    ],
    officialSources: [
      {
        label: "The Lancet Guide for Authors",
        url: "https://www.sciencedirect.com/journal/the-lancet/publish/guide-for-authors",
      },
      {
        label: "The Lancet Information for Authors",
        url: "https://www.lancet.com/pb/assets/raw/Lancet/authors/lancet-information-for-authors.pdf",
      },
    ],
    verified: true,
    verifiedAt: "2026-08-08",
  },
  {
    id: "bmj-2026-research",
    name: "The BMJ",
    acronym: "BMJ",
    aliases: ["British Medical Journal"],
    kind: "journal",
    edition: 2026,
    track: "Research",
    criteria: [
      {
        key: "decision-value",
        label: "Value for medical decision-making",
        guidance:
          "Assess whether the study can improve decisions in clinical medicine, public health, health policy, medical education, or biomedical research.",
      },
      {
        key: "importance-novelty",
        label: "Important, new, and relevant question",
        guidance:
          "Assess whether the research question is important, meaningfully new, and relevant to The BMJ's international general readership, regardless of whether results are positive or negative.",
      },
      {
        key: "robust-design",
        label: "Appropriate and robust design",
        guidance:
          "Assess whether study design, conduct, analysis, and sensitivity checks are appropriate and robust for the question and data.",
      },
      {
        key: "transparent-reporting",
        label: "Complete and transparent reporting",
        guidance:
          "Assess whether the manuscript reports methods, results, limitations, competing interests, funding, data sharing, and patient involvement completely and candidly.",
      },
      {
        key: "interpretation",
        label: "Balanced interpretation",
        guidance:
          "Assess whether the discussion states principal findings, strengths and weaknesses, relation to other studies, implications, and unanswered questions without overclaiming.",
      },
    ],
    requirements: [
      "Original research should follow IMRaD structure and include a complete structured abstract and a structured discussion.",
      "Check that the title identifies the study design and that the applicable reporting checklist is followed and submitted.",
      "Check data-sharing, competing-interest, funding, contributor, guarantor, and patient and public involvement statements where applicable.",
      ...MEDICAL_REPORTING_REQUIREMENTS,
    ],
    officialSources: [
      {
        label: "The BMJ Article Types and Preparation",
        url: "https://www.bmj.com/about-bmj/resources-authors/article-types",
      },
      {
        label: "ICMJE Recommendations",
        url: "https://www.icmje.org/recommendations/",
      },
    ],
    verified: true,
    verifiedAt: "2026-08-08",
  },
  {
    id: "nature-medicine-2026-primary-research",
    name: "Nature Medicine",
    aliases: ["Nat Med", "Nature Med"],
    kind: "journal",
    edition: 2026,
    track: "Primary research",
    criteria: [
      {
        key: "originality",
        label: "Originality",
        guidance:
          "Assess whether the work offers a genuinely original advance in translational or clinical research.",
      },
      {
        key: "timeliness",
        label: "Timeliness",
        guidance:
          "Assess whether the question and evidence address a current and consequential opportunity in medicine or human health.",
      },
      {
        key: "human-health-impact",
        label: "Impact on human health",
        guidance:
          "Assess whether the study plausibly improves human health by addressing an unmet clinical need, rather than merely demonstrating a narrow technical result.",
      },
      {
        key: "field-advance",
        label: "Advance in understanding",
        guidance:
          "Assess the degree to which the work advances understanding of the field and offers conclusions with wide relevance to the journal's readership.",
      },
      {
        key: "evidence-soundness",
        label: "Sound conclusions supported by evidence",
        guidance:
          "Assess whether appropriate data, controls, analyses, validation, and uncertainty support every central conclusion.",
      },
      {
        key: "transparency",
        label: "Research transparency",
        guidance:
          "Assess registration, protocol and analysis-plan fidelity, reporting checklists, ethics, competing interests, and availability of data and code.",
      },
    ],
    requirements: [
      "Clinical trials must be prospectively registered and submitted with the latest signed protocol and statistical analysis plan; deviations from prespecified analyses must be justified.",
      "Include Data Availability and, when custom code is used, Code Availability statements; supporting data and code must be available for editorial and peer review when requested.",
      "For medical AI studies, apply the current AI-specific clinical reporting guidance identified by Nature Medicine in addition to the underlying study-design guideline.",
      ...MEDICAL_REPORTING_REQUIREMENTS,
    ],
    officialSources: [
      {
        label: "Nature Medicine Aims and Scope",
        url: "https://www.nature.com/nm/submission-guidelines/about/aims",
      },
      {
        label: "Nature Medicine Editorial Process and Peer Review",
        url: "https://www.nature.com/nm/submission-guidelines/editorial-process",
      },
      {
        label: "Nature Medicine Clinical Research Policies",
        url: "https://www.nature.com/nm/editorial-policies/clinicalresearch",
      },
    ],
    verified: true,
    verifiedAt: "2026-08-08",
  },
  {
    id: "jama-network-open-2026-original-investigation",
    name: "JAMA Network Open",
    aliases: ["JAMA Open", "JNO"],
    kind: "journal",
    edition: 2026,
    track: "Original Investigation",
    criteria: [
      {
        key: "scope",
        label: "Fit with medical and health scope",
        guidance:
          "Assess whether the work reports original research relevant to clinical care, health-care innovation, health policy, or global health.",
      },
      {
        key: "originality-timeliness",
        label: "Originality and timeliness",
        guidance:
          "Assess whether the material is original, current, and differentiated from the closest published evidence.",
      },
      {
        key: "methods",
        label: "Appropriate methods and valid data",
        guidance:
          "Assess whether the design, sampling, measurements, outcomes, and analyses appropriately answer the question and produce valid evidence.",
      },
      {
        key: "supported-conclusions",
        label: "Supported conclusions",
        guidance:
          "Require conclusions and clinical, policy, or global-health implications to be proportional to the results and limitations.",
      },
      {
        key: "relevance",
        label: "Broad relevance",
        guidance:
          "Assess whether the work matters to clinicians, investigators, or policy makers across health disciplines and countries.",
      },
      {
        key: "transparency",
        label: "Transparent and reproducible reporting",
        guidance:
          "Assess study-type reporting, protocol and analysis-plan availability, data sharing, conflicts, funding, and reproducibility.",
      },
    ],
    requirements: [
      "For an Original Investigation, check the current limits and required elements, including a structured abstract, Key Points, a Data Sharing Statement, an identified Study Type, and no more than five tables and/or figures.",
      "JAMA Network Open does not consider non-research articles, case reports, animal preclinical studies, reviews, or unsolicited opinion for this article type.",
      "Randomized and nonrandomized clinical trials require a study protocol and statistical analysis plan.",
      ...MEDICAL_REPORTING_REQUIREMENTS,
    ],
    officialSources: [
      {
        label: "JAMA Network Open Instructions for Authors",
        url: "https://jamanetwork.com/journals/jamanetworkopen/pages/instructions-for-authors",
      },
      {
        label: "JAMA Network Open For Authors",
        url: "https://jamanetwork.com/journals/jamanetworkopen/pages/for-authors",
      },
    ],
    verified: true,
    verifiedAt: "2026-08-08",
  },
  {
    id: "cochrane-2026-review",
    name: "Cochrane Database of Systematic Reviews",
    acronym: "CDSR",
    aliases: [
      "Cochrane",
      "Cochrane Library",
      "Cochrane Review",
      "Cochrane Systematic Review",
    ],
    defaultPaperType: "systematic-review",
    kind: "journal",
    edition: 2026,
    track: "Cochrane Review",
    criteria: [
      {
        key: "question-priority",
        label: "Important and non-duplicative review question",
        guidance:
          "Assess whether the review addresses a clearly defined, decision-relevant uncertainty and makes a unique contribution rather than duplicating an existing or active Cochrane review.",
      },
      {
        key: "protocol-fidelity",
        label: "Prospective protocol and methodological fidelity",
        guidance:
          "Assess whether objectives, PICO, eligibility criteria, outcomes, and synthesis methods follow the published protocol, with every material deviation clearly identified and justified.",
      },
      {
        key: "search-selection",
        label: "Comprehensive and current evidence identification",
        guidance:
          "Assess whether searches cover appropriate databases and other sources, are reproducible and sufficiently current, and use transparent duplicate screening and defensible inclusion decisions.",
      },
      {
        key: "risk-of-bias",
        label: "Risk-of-bias assessment",
        guidance:
          "Assess whether the appropriate Cochrane risk-of-bias tool was applied independently and consistently, with judgments supported by study-level evidence.",
      },
      {
        key: "synthesis",
        label: "Appropriate synthesis and meta-analysis",
        guidance:
          "Assess whether effect measures, models, unit-of-analysis decisions, heterogeneity assessment, missing-data handling, subgroup and sensitivity analyses, and any meta-analysis match the protocol and the structure of the evidence. Do not require meta-analysis when pooling would be inappropriate.",
      },
      {
        key: "certainty",
        label: "Certainty of evidence and Summary of Findings",
        guidance:
          "Assess whether GRADE judgments address risk of bias, inconsistency, indirectness, imprecision, and publication bias, and whether Summary of Findings tables present benefits and harms for prioritized outcomes accurately.",
      },
      {
        key: "reporting-conclusions",
        label: "Transparent reporting and evidence-bounded conclusions",
        guidance:
          "Assess PRISMA flow consistency, abstract and plain-language summary accuracy, and whether conclusions remain consistent across the review and are based only on the available evidence and its certainty.",
      },
    ],
    requirements: [
      "A standard new Cochrane Review begins with an accepted research proposal and a peer-reviewed published protocol; completed reviews are considered directly only in exceptional circumstances under Cochrane's stated conditions.",
      "Follow the current Cochrane Handbook, mandatory MECIR conduct standards, the Cochrane Review template in RevMan, and PRISMA 2020 reporting guidance.",
      "At submission, the search date should be less than 12 months old and dates and study counts must remain consistent across the abstract, methods, PRISMA flow diagram, results, and study tables.",
      "From July 2026, reviews and updates should remain within the stated 12,000-word maximum, excluding references and supplementary material.",
      "For each main outcome, report the number of studies and participants, direction and magnitude of effect, confidence interval when meta-analysis is used, harms, and the GRADE certainty assessment.",
      "If meta-analysis is not appropriate, explain why and use a prespecified, transparent synthesis method rather than forcing statistical pooling.",
    ],
    officialSources: [
      {
        label: "Cochrane Library",
        url: "https://www.cochranelibrary.com/",
      },
      {
        label: "Cochrane Handbook for Systematic Reviews of Interventions",
        url: "https://training.cochrane.org/handbook/current",
      },
      {
        label: "Cochrane Methods Peer Review Checklist for Reviews",
        url: "https://www.cochrane.org/authors/submit-your-manuscript/methods-peer-review-checklist-review",
      },
      {
        label: "How to Write a Cochrane Review or Update",
        url: "https://www.cochrane.org/authors/how-write-cochrane-review-or-update",
      },
      {
        label: "Publishing with Cochrane",
        url: "https://www.cochrane.org/authors/publish-with-us",
      },
    ],
    verified: true,
    verifiedAt: "2026-08-08",
  },
];

export function curatedVenueSearch(query: string): VenueSearchResult[] {
  const normalized = normalizeVenueSearchTerm(query);
  if (!normalized) return [];
  return CURATED_VENUE_PROFILES.filter((profile) =>
    [profile.name, profile.acronym, profile.track, ...(profile.aliases ?? [])]
      .filter(Boolean)
      .some((value) => normalizeVenueSearchTerm(value!).includes(normalized)),
  ).map((profile) => ({
    id: `profile:${profile.id}`,
    name: profile.name,
    acronym: profile.acronym,
    kind: profile.kind,
    source: "curated",
    profileId: profile.id,
    edition: profile.edition,
    defaultTrack: profile.track,
    defaultPaperType: profile.defaultPaperType ?? "research",
    catalogUrl: profile.officialSources[0]?.url,
    verifiedProfile: profile.verified,
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
  const curated = CURATED_VENUE_PROFILES.find(
    (profile) => profile.id === input.profileId,
  );
  const paperType = normalizePaperType(
    input.paperType ?? curated?.defaultPaperType,
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
      ? curated.kind === "journal"
        ? `Official ${curated.name} guidance for ${curated.track}, verified ${curated.verifiedAt}, was applied.`
        : `Official ${curated.edition} ${curated.track} criteria were applied.`
      : curated.kind === "journal"
        ? `The closest available official profile is the ${curated.track} guidance verified ${curated.verifiedAt}; the selected guideline version or article type was not independently verified.`
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

function normalizeVenueSearchTerm(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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
    "systematic-review",
    "meta-analysis",
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
  const paperTypeLabel =
    paperType === "systematic-review"
      ? "systematic review"
      : paperType === "meta-analysis"
        ? "meta-analysis"
        : `${paperType.replaceAll("-", " ")} paper`;
  return `${name} ${year} — ${track} · ${paperTypeLabel}`;
}
