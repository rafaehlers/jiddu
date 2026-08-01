import type { Lang } from "../fallacies";

export type Messages = {
  tagline: string;

  // Home
  hero_title: string;
  hero_subtitle: string;
  // Generic subtitle for the unified home — mode-neutral, since the four
  // lenses are picked via the cards rather than separate pages.
  home_hero_subtitle: string;
  privacy: string;
  privacy_body: string;
  see_demo: string;
  see_demo_for: (feature: string) => string;
  see_demo_hint: string;
  bench_badge_label: string;
  bench_badge_link: string;
  pipelines_heading: string;
  pipelines_subheading: string;
  pipeline_fallacy_desc: string;
  pipeline_factcheck_desc: string;
  pipeline_neutrality_desc: string;
  pipeline_live_desc: string;
  quality_card_heading: string;
  quality_card_body: string;
  quality_card_link: string;

  // Footer
  footer_quote: string;
  footer_balance: (amount: string) => string;

  // Form
  tab_url: string;
  tab_paste: string;
  tab_file: string;
  tab_live: string;
  tab_factcheck: string;
  url_placeholder: string;
  paste_placeholder: string;
  file_drop_hint: string;
  file_size_hint: string;
  model: string;
  model_anthropic: string;
  model_openai: string;
  analyze: string;
  starting: string;
  form_hint: string;
  auth_required_title: string;
  auth_required_hint: string;
  auth_sign_in: string;
  auth_create_account: string;
  credits_required_title: string;
  credits_required_hint: string;
  credits_open_account: string;

  // Loading
  loading_starting: string;
  loading_reading: string;
  loading_analyzing: (done: number, total: number) => string;
  loading_finalizing: string;
  loading_hint: string;
  sections: string;
  fallacies_found_so_far: (count: number) => string;
  loader_url: string[];
  loader_paste: string[];
  loader_file: string[];
  loader_image: string[];
  loader_analysis: string[];
  loader_factcheck: string[];

  // Fact-check
  factcheck_hero_title: string;
  factcheck_hero_subtitle: string;
  extract_claims: string;
  factcheck_failed: string;
  claims_found_one: string;
  claims_found_many: string;

  // Mode toggle on the home composer
  mode_detector: string;
  mode_factcheck: string;
  mode_live: string;

  // Fact-check viewer
  fc_untitled: string;
  fc_claims_one_extracted: string;
  fc_claims_many_extracted: string;
  fc_claims_header: string;
  fc_extracting: string;
  fc_no_claims: string;
  fc_verify_panel_title: string;
  fc_verify_panel_desc: string;
  fc_verify_button: string;
  fc_reverify_button: string;
  fc_verify_label: string;
  fc_show_sources: (n: number) => string;
  fc_hide_sources: (n: number) => string;
  fc_checking: string;
  fc_report_wrong: string;
  fc_report_prompt: string;
  fc_report_thanks: string;
  fc_footer: (model: string) => string;
  fc_status_complete: string;
  fc_status_running: string;
  fc_status_failed: string;
  fc_status_pending: string;

  // Claim type labels
  ct_numeric: string;
  ct_date: string;
  ct_quote: string;
  ct_causal: string;
  ct_categorical: string;

  // Verdict labels
  vd_supported: string;
  vd_contradicted: string;
  vd_mixed: string;
  vd_unverified: string;

  // Source quality tiers (Goldfarb et al. 2025)
  st_primary: string;
  st_scholarly: string;
  st_think_tank: string;
  st_journalistic: string;
  st_commercial_content: string;
  st_informal: string;
  st_state_controlled: string;

  // Neutrality dimension
  mode_neutrality: string;
  tab_neutrality: string;
  neutrality_hero_title: string;
  neutrality_hero_subtitle: string;
  assess_neutrality: string;
  neutrality_failed: string;
  loader_neutrality: string[];
  findings_found_one: string;
  findings_found_many: string;
  neutrality_no_issues: string;
  neutrality_confidence: string;
  neutrality_footer: (model: string) => string;

  // Neutrality verdict labels
  nv_neutral: string;
  nv_partisan_lean: string;
  nv_explicitly_partisan: string;
  nv_manipulation: string;

  // Issue type labels
  ni_loaded_language: string;
  ni_asymmetric_attribution: string;
  ni_false_equivalence: string;
  ni_selective_omission: string;
  ni_source_asymmetry: string;
  ni_both_sidesing: string;
  ni_steering: string;
  ni_genetic_framing: string;

  // Text-type labels
  tt_informational: string;
  tt_opinion: string;
  tt_political_speech: string;
  tt_advocacy: string;
  tt_analysis: string;
  tt_marketing: string;
  tt_social_media: string;

  // Explain dimension (paper explainer)
  mode_explain: string;
  explain_hero_title: string;
  explain_hero_subtitle: string;
  explain_cta: string;
  explain_failed: string;
  loader_explain: string[];
  loader_explain_map: string;
  explain_level: string;
  level_eli5: string;
  level_high_school: string;
  level_undergrad: string;
  level_expert: string;
  role_background: string;
  role_objective: string;
  role_method: string;
  role_result: string;
  role_interpretation: string;
  role_limitation: string;
  role_conclusion: string;
  explain_overview_label: string;
  explain_map_label: string;
  explain_map_paper_type: string;
  explain_map_contribution_type: string;
  explain_map_question: string;
  explain_map_contribution: string;
  explain_map_approach: string;
  explain_map_answer: string;
  explain_map_evidence: string;
  explain_map_limitation: string;
  explain_map_open_evidence: string;
  explain_jump_to: string;
  explanations_count_one: string;
  explanations_count_many: string;
  explain_empty: string;
  explain_footer: (model: string) => string;
  pipeline_explain_desc: string;

  // Slop detector
  mode_slop: string;
  pipeline_slop_desc: string;
  check_slop: string;
  slop_failed: string;
  loader_slop: string[];
  slop_found_one: string;
  slop_found_many: string;
  no_slop: string;
  slop_finding_count: (count: number, total: number) => string;
  slop_score_clean: string;
  slop_score_light: string;
  slop_score_several: string;
  slop_score_heavy: string;
  slop_score_assembly: string;
  a11y_show_slop: string;
  finding_about_this_pattern: string;
  slop_guide_title: string;
  slop_guide_subtitle: string;

  // Adversarial paper review (6th lens)
  mode_review: string;
  pipeline_review_desc: string;
  review_cta: string;
  review_failed: string;
  loader_review: string[];
  review_venue: string;
  review_venue_placeholder: string;
  review_venue_help: string;
  review_venue_searching: string;
  review_venue_verified: string;
  review_venue_catalog_only: string;
  review_venue_year: string;
  review_depth: string;
  review_depth_standard: string;
  review_depth_deep: string;
  review_depth_help: string;
  review_track: string;
  review_track_placeholder: string;
  review_paper_type: string;
  review_type_research: string;
  review_type_position: string;
  review_type_survey: string;
  review_type_dataset: string;
  review_type_theory: string;
  review_type_use_inspired: string;
  review_type_concept: string;
  review_type_negative_results: string;
  review_date: string;
  review_pdf_hint: string;
  review_file_size_hint: string;
  review_form_hint: string;

  // 404 page
  not_found_label: string;
  not_found_title: string;
  not_found_subtitle: string;
  not_found_cta: string;

  // Errors
  analysis_failed: string;
  try_again: string;
  ingest_blocked_title: string;
  ingest_blocked_hint: string;
  ingest_not_found_title: string;
  ingest_not_found_hint: string;
  ingest_rate_limited_title: string;
  ingest_rate_limited_hint: string;
  ingest_timeout_title: string;
  ingest_timeout_hint: string;
  ingest_unreachable_title: string;
  ingest_unreachable_hint: string;
  ingest_extraction_failed_title: string;
  ingest_extraction_failed_hint: string;
  ingest_invalid_url_title: string;
  ingest_too_short_title: string;
  switch_to_paste: string;

  // Accessibility — labels for the keyboard-operable in-text highlights
  a11y_show_fallacy: string;
  a11y_show_claim: string;
  a11y_show_signal: string;
  a11y_show_explanation: string;

  // Viewer chrome
  new_analysis: string;
  share: string;
  copied: string;
  no_fallacies: string;
  pending: string;
  finding_count: (count: number, total: number) => string;
  read_more: string;

  // Score labels
  score_label: string;
  score_clean: string;
  score_minor: string;
  score_several: string;
  score_high: string;
  score_propagandistic: string;

  // Severity
  severity_low: string;
  severity_high: string;

  // Fallacies guide
  guide_title: string;
  guide_subtitle: string;
  guide_example: string;
  guide_back: string;
  // Courtesy credit at the foot of the guide — the fallacy *selection* was
  // informed by The Fallacy Guide; all text here is Jiddu's own.
  guide_credit_prefix: string;
  guide_credit_suffix: string;

  // Header nav
  nav_fallacies: string;
  nav_slop_patterns: string;
  nav_benchmark: string;
  nav_pricing: string;

  // Theme
  theme_to_dark: string;
  theme_to_light: string;

  // Share + scroll
  share_link_label: string;
  share_link_hint: string;
  link_copied: string;
  scroll_to_bottom: string;
  scroll_to_top: string;

  // Modal
  close: string;
  open_in_guide: string;
  category: string;

  // Mobile-specific
  mobile_hint_title: string;
  mobile_hint_body: string;
  mobile_hint_dismiss: string;
  finding_from_text: string;
  finding_about_this_fallacy: string;

  // Legal / terms page
  legal_title: string;
  legal_subtitle: string;
  legal_last_updated: string;
  legal_sections: Array<{ title: string; paragraphs: string[] }>;
  nav_legal: string;

  // How-it-works page — technical walkthrough of every pipeline
  how_it_works_title: string;
  how_it_works_subtitle: string;
  how_it_works_sections: Array<{
    title: string;
    paragraphs: string[];
    creditTable?: {
      intro: string;
      headers: {
        feature: string;
        unit: string;
        estimate: string;
      };
      rows: Array<{
        feature: string;
        unit: string;
        estimate: string;
      }>;
      note: string;
    };
  }>;
  nav_how_it_works: string;

  // API access page — public REST API + MCP server docs
  api_access_title: string;
  api_access_subtitle: string;
  api_access_sections: Array<{ title: string; paragraphs: string[] }>;
  nav_api: string;

  // Export / print
  export_pdf: string;

  // Print view labels — shared across the three print companions
  // (/a/*/print, /f/*/print, /n/*/print).
  print_type_fallacy: string;
  print_type_factcheck: string;
  print_type_neutrality: string;
  print_meta_source: string;
  print_meta_type: string;
  print_meta_text_type: string;
  print_meta_generated: string;
  print_meta_reviewed: string;
  print_meta_model: string;
  print_meta_url: string;
  print_section_source_text: string;
  print_section_findings: string;
  print_section_claims: string;
  print_section_score: string;
  print_no_claims: string;
  print_no_findings: string;
  print_footer_fallacy: string;
  print_footer_factcheck: string;
  print_footer_neutrality: string;
  print_type_explain: string;
  print_meta_level: string;
  print_section_explanations: string;
  print_no_explanations: string;
  print_footer_explain: string;
  print_type_slop: string;
  print_footer_slop: string;
  print_generated_at: (when: string) => string;

  // Live mode (beta)
  live_subtitle: string;
  live_source_mic: string;
  live_source_tab: string;
  live_source_tab_chrome_only: string;
  live_source_tab_tooltip: string;
  live_source_tab_unsupported: string;
  live_language_follows_header: string;
  live_lenses_title: string;
  live_lenses_hint: string;
  live_lens_fallacy: string;
  live_lens_factcheck: string;
  live_lens_neutrality: string;
  live_all: string;
  live_no_results_yet: string;
  live_interval_title: string;
  live_interval_hint: string;
  live_start: string;
  live_stop: string;
  live_findings: string;
  live_running_score: string;
  live_privacy_note: string;
  live_status_connecting: string;
  live_status_live: string;
  live_status_analyzing: string;
  live_status_stopped: string;
  live_status_finalizing: string;
  live_status_error: string;
  live_transcript_listening: string;
  live_transcript_idle: string;
  live_no_findings_yet: string;
  live_no_claims_yet: string;
  live_no_neutrality_yet: string;
  live_claim_detected: string;
  live_partial_verdict: string;
  live_confidence: string;
  live_session_saved: string;
  live_view_analysis: string;
  live_view_factcheck: string;
  live_view_neutrality: string;
  live_start_new: string;
};

const en: Messages = {
  tagline: "truth is a pathless land",

  hero_title: "Read anything with a critical mind.",
  hero_subtitle:
    "Upload a PDF or screenshot, paste text or an image, or drop a URL. Jiddu highlights the passages that contain logical fallacies and explains each one in a comment — just like a reviewer in Word — and gives the whole piece a fallacy score from 0 to 100.",
  home_hero_subtitle:
    "Drop a PDF or screenshot, paste text or an image, or add a URL — then pick a lens. Or use Live to monitor fallacies, check-worthy claims and neutrality as someone speaks.",
  privacy: "Privacy:",
  privacy_body:
    "your content — including pasted screenshots and selected PDF page images when visual inspection is needed — is sent to the chosen model via OpenRouter. Jiddu does not retain screenshot files; their extracted text is stored locally under a shareable id.",
  see_demo: "See a demo",
  see_demo_for: (feature) => {
    const normalized = feature.toLocaleLowerCase("en-US");
    const article = /^[aeiou]/i.test(normalized) ? "an" : "a";
    return `See ${article} ${normalized} demo`;
  },
  see_demo_hint: "Want a quick look without running an analysis?",
  bench_badge_label:
    "Pipeline validated · 67.5% match with PolitiFact in a 200-claim benchmark",
  bench_badge_link: "view report",
  pipelines_heading: "Seven ways to read critically",
  pipelines_subheading:
    "Pick a mode in the form above, or open a sample analysis to see what each one looks like.",
  pipeline_fallacy_desc:
    "Highlights every passage that contains a logical fallacy and explains each one in a Word-style margin comment. Outputs a fallacy score from 0 to 100.",
  pipeline_factcheck_desc:
    "Pulls every verifiable claim — numbers, dates, quotes, causal and categorical assertions — and optionally checks each against the live web via Perplexity Sonar with cited sources.",
  pipeline_neutrality_desc:
    "Surfaces the framing, attribution and source-selection patterns that make a text partisan even when nothing is factually false. Deliberately does NOT classify left/right.",
  pipeline_live_desc:
    "Listens in real time and monitors fallacies, check-worthy claims and neutrality signals together as the speaker talks.",
  quality_card_heading: "Quality, measured against humans",
  quality_card_body:
    "We benchmarked the fact-check pipeline against 200 PolitiFact-labeled claims. Jiddu's verdict matched the human verdict on 81.3% of the unambiguous true / false / pants-on-fire claims, with strict polar disagreement in only 4.5% of cases.",
  quality_card_link: "Full methodology and confusion matrix",

  footer_quote: "“The moment you follow someone, you cease to follow truth.”",
  footer_balance: (amount) => `${amount} left in API credits`,

  tab_url: "URL",
  tab_paste: "Paste text",
  tab_file: "PDF / TXT / Image",
  tab_live: "Live",
  tab_factcheck: "Fact-check",
  url_placeholder: "https://example.com/article",
  paste_placeholder: "Paste the text you want to analyze…",
  file_drop_hint: "Drop a PDF, TXT, or image — or paste a screenshot",
  file_size_hint: "⌘V / Ctrl+V · images up to 10 MB · text up to ~200k characters",
  model: "Model",
  model_anthropic: "Claude (Anthropic)",
  model_openai: "GPT (OpenAI)",
  analyze: "Analyze",
  starting: "Starting…",
  form_hint: "Comments appear as the analysis runs. Don't close the page.",
  auth_required_title: "Sign in required",
  auth_required_hint:
    "Create a Jiddu account or sign in to continue. Signed-in accounts use Jiddu Credits or included platform access.",
  auth_sign_in: "Sign in",
  auth_create_account: "Create account",
  credits_required_title: "Jiddu credits required",
  credits_required_hint:
    "This analysis needs more Jiddu Credits. Open your account to check the balance and credit activity.",
  credits_open_account: "View account",

  loading_starting: "Starting analysis",
  loading_reading: "Reading the source",
  loading_analyzing: (done, total) =>
    `Analyzing — ${done} of ${total} sections done`,
  loading_finalizing: "Finalizing",
  loading_hint: "This usually takes 10–30 seconds. Don't close the page.",
  sections: "sections",
  fallacies_found_so_far: (count) =>
    `${count} ${count === 1 ? "fallacy" : "fallacies"} found so far`,
  loader_url: [
    "Fetching the page",
    "Following redirects",
    "Stripping ads and navigation",
    "Pulling the article body",
    "Detecting language",
    "Splitting into sentences",
  ],
  loader_paste: [
    "Reading your text",
    "Normalizing whitespace",
    "Detecting language",
    "Splitting into sentences",
  ],
  loader_file: [
    "Reading the file",
    "Extracting text content",
    "Cleaning page breaks",
    "Detecting language",
    "Splitting into sentences",
  ],
  loader_image: [
    "Reading the screenshot",
    "Transcribing visible text",
    "Preserving paragraphs and speakers",
    "Preparing the extracted text",
  ],
  loader_analysis: [
    "Looking for biased framing",
    "Cross-checking claims",
    "Comparing against the fallacy catalog",
    "Examining rhetorical patterns",
    "Drafting the comments",
    "Weighing severity",
  ],
  loader_factcheck: [
    "Reading the text",
    "Skipping opinion and rhetoric",
    "Separating verifiable facts",
    "Pulling out numbers and dates",
    "Decontextualizing each claim",
    "Writing the rationale",
  ],

  factcheck_hero_title: "Pull every verifiable claim out of any text.",
  factcheck_hero_subtitle:
    "Drop a URL, paste text, or upload a PDF. Jiddu extracts the numbers, dates, quotes and factual assertions worth checking — so you know exactly what to verify.",
  extract_claims: "Extract claims",
  factcheck_failed: "Claim extraction failed",
  claims_found_one: "verifiable claim found so far",
  claims_found_many: "verifiable claims found so far",

  mode_detector: "Fallacy detector",
  mode_factcheck: "Fact-check",
  mode_live: "Live",

  fc_untitled: "Untitled",
  fc_claims_one_extracted: "claim extracted",
  fc_claims_many_extracted: "claims extracted",
  fc_claims_header: "Claims",
  fc_extracting: "Extracting claims…",
  fc_no_claims: "No verifiable claims were extracted from this text.",
  fc_verify_panel_title: "Verify these claims",
  fc_verify_panel_desc:
    "Jiddu will run each claim through a web-search model and return an evidence-backed verdict with sources. Automated verifications can be wrong — always read the sources.",
  fc_verify_button: "Verify claims",
  fc_reverify_button: "Re-verify",
  fc_verify_label: "Verify",
  fc_show_sources: (n) => `Show sources (${n})`,
  fc_hide_sources: (n) => `Hide sources (${n})`,
  fc_checking: "checking",
  fc_report_wrong: "Report this verdict as wrong",
  fc_report_prompt: "Why is this verdict wrong? (optional)",
  fc_report_thanks: "Thanks — we'll review it.",
  fc_footer: (model) =>
    `Claims extracted by ${model} via OpenRouter. Verdicts (when present) come from an automated web-search model and may be wrong. Jiddu does not assert that any claim is true or false — read the sources and judge for yourself.`,
  fc_status_complete: "Complete",
  fc_status_running: "Running",
  fc_status_failed: "Failed",
  fc_status_pending: "Pending",

  ct_numeric: "Numeric",
  ct_date: "Date",
  ct_quote: "Quote",
  ct_causal: "Causal",
  ct_categorical: "Categorical",

  vd_supported: "Supported",
  vd_contradicted: "Contradicted",
  vd_mixed: "Mixed",
  vd_unverified: "Unverified",

  st_primary: "Primary",
  st_scholarly: "Scholarly",
  st_think_tank: "Think tank",
  st_journalistic: "Journalistic",
  st_commercial_content: "Commercial",
  st_informal: "Informal",
  st_state_controlled: "State-controlled",

  mode_neutrality: "Neutrality",
  tab_neutrality: "Neutrality",
  neutrality_hero_title: "Spot framing, attribution and source-selection patterns.",
  neutrality_hero_subtitle:
    "Drop a URL, paste text, or upload a PDF. Jiddu flags loaded language, asymmetric attribution, false equivalence and other framing patterns — without trying to label a partisan direction.",
  assess_neutrality: "Assess neutrality",
  neutrality_failed: "Neutrality assessment failed",
  loader_neutrality: [
    "Reading the text",
    "Spotting word-choice patterns",
    "Checking attribution symmetry",
    "Looking for selective omission",
    "Auditing source mix",
    "Drafting the verdict",
  ],
  findings_found_one: "issue found",
  findings_found_many: "issues found",
  neutrality_no_issues: "No neutrality issues flagged.",
  neutrality_confidence: "confidence",
  neutrality_footer: (model) =>
    `Assessed by ${model} via OpenRouter. Neutrality is a property of the framing — Jiddu does not classify partisan direction. Read the flagged passages and judge for yourself.`,

  nv_neutral: "Neutral",
  nv_partisan_lean: "Partisan lean",
  nv_explicitly_partisan: "Explicitly partisan",
  nv_manipulation: "Manipulation",

  ni_loaded_language: "Loaded language",
  ni_asymmetric_attribution: "Asymmetric attribution",
  ni_false_equivalence: "False equivalence",
  ni_selective_omission: "Selective omission",
  ni_source_asymmetry: "Source asymmetry",
  ni_both_sidesing: "Both-sidesing",
  ni_steering: "Steering",
  ni_genetic_framing: "Genetic framing",

  tt_informational: "Informational",
  tt_opinion: "Opinion",
  tt_political_speech: "Political speech",
  tt_advocacy: "Advocacy",
  tt_analysis: "Analysis",
  tt_marketing: "Marketing",
  tt_social_media: "Social media",

  // Explain dimension (paper explainer)
  mode_explain: "Paper Explainer",
  explain_hero_title: "Understand any paper, paragraph by paragraph.",
  explain_hero_subtitle:
    "Upload a paper or paste its text, pick a level, and Jiddu maps its question, approach and evidence before explaining every paragraph in the margin.",
  explain_cta: "Explain",
  explain_failed: "Explanation failed",
  loader_explain: [
    "Reading the paper",
    "Mapping its structure",
    "Explaining each paragraph",
    "Translating the jargon",
    "Connecting the argument",
  ],
  loader_explain_map: "Building the paper map",
  explain_level: "Explanation level",
  level_eli5: "Child",
  level_high_school: "High school",
  level_undergrad: "Undergraduate",
  level_expert: "Expert",
  role_background: "Background",
  role_objective: "Objective",
  role_method: "Method",
  role_result: "Results",
  role_interpretation: "Interpretation",
  role_limitation: "Limitations",
  role_conclusion: "Conclusion",
  explain_overview_label: "In plain words",
  explain_map_label: "Paper map",
  explain_map_paper_type: "Paper type",
  explain_map_contribution_type: "Contribution",
  explain_map_question: "Central question",
  explain_map_contribution: "What it contributes",
  explain_map_approach: "How it investigates",
  explain_map_answer: "Main answer",
  explain_map_evidence: "Evidence and data",
  explain_map_limitation: "Stated caveat",
  explain_map_open_evidence: "Open the supporting paragraph",
  explain_jump_to: "Jump to",
  explanations_count_one: "explanation",
  explanations_count_many: "explanations",
  explain_empty: "No explanations were produced for this document.",
  explain_footer: (model) =>
    `Explained by ${model} via Jiddu. Automated explanations can misread a paper — always check against the source.`,
  pipeline_explain_desc:
    "Get a map of the paper's question, approach and evidence, plus a plain-language explanation of every paragraph — from child to expert.",

  mode_slop: "Slop detector",
  pipeline_slop_desc:
    "Flags the stock phrases, manufactured drama and templated structures that make prose read machine-assembled. Names each pattern with a quote to check — never guesses authorship.",
  check_slop: "Check for slop",
  slop_failed: "Slop check failed",
  loader_slop: [
    "Sniffing for stock phrases",
    "Checking the drama for manufacture",
    "Measuring template density",
    "Weighing what survives deletion",
    "Drafting the comments",
  ],
  slop_found_one: "pattern flagged so far",
  slop_found_many: "patterns flagged so far",
  no_slop: "No slop patterns detected — this text reads human.",
  slop_finding_count: (count, total) =>
    `${count} ${count === 1 ? "pattern" : "patterns"} across ${total} sentences`,
  slop_score_clean: "reads human",
  slop_score_light: "light seasoning",
  slop_score_several: "patterned",
  slop_score_heavy: "heavily templated",
  slop_score_assembly: "assembly-line prose",
  a11y_show_slop: "Show slop comment",
  finding_about_this_pattern: "About this pattern",
  slop_guide_title: "Slop pattern guide",
  slop_guide_subtitle:
    "A short reference for the AI-slop writing patterns Jiddu can flag. Patterns, not authorship — humans write slop too.",

  mode_review: "Adversarial review",
  pipeline_review_desc:
    "Treats one paper as an autonomous submission, audits its claims and experiments, checks published prior work, and returns a gatekeeping review with localized weaknesses.",
  review_cta: "Review paper",
  review_failed: "Adversarial review failed",
  loader_review: [
    "Parsing the complete paper",
    "Building the private claim ledger",
    "Checking published prior work",
    "Running five independent SPECS reviews",
    "Recalculating reported results",
    "Synthesizing the specialist findings",
    "Running the adversarial self-critique",
    "Validating external sources",
    "Running the independent quality audit",
    "Finalizing the review",
  ],
  review_venue: "Target venue (optional)",
  review_venue_placeholder: "Search NeurIPS, ICML, ICLR, AAAI…",
  review_venue_help: "Verified profiles apply official, edition-specific criteria. Other DBLP venues use a general scholarly standard.",
  review_venue_searching: "Searching DBLP…",
  review_venue_verified: "Verified rubric",
  review_venue_catalog_only: "Catalog match · general rubric",
  review_venue_year: "Edition",
  review_depth: "Review depth",
  review_depth_standard: "Standard",
  review_depth_deep: "Deep",
  review_depth_help:
    "Deep uses stronger reasoning models for evaluations, correctness, synthesis, and an independent critic. It takes longer and costs more.",
  review_track: "Track",
  review_track_placeholder: "Main track",
  review_paper_type: "Paper type",
  review_type_research: "Research paper",
  review_type_position: "Position paper",
  review_type_survey: "Survey",
  review_type_dataset: "Dataset / benchmark",
  review_type_theory: "Theory",
  review_type_use_inspired: "Use-inspired",
  review_type_concept: "Concept & feasibility",
  review_type_negative_results: "Negative results",
  review_date: "Review date (optional)",
  review_pdf_hint: "Drop exactly one final PDF, or click to choose",
  review_file_size_hint: "PDF only · read in full · up to ~300k characters",
  review_form_hint:
    "A complete review can take several minutes. Keep this page open.",

  nav_legal: "Terms",
  nav_how_it_works: "How it works",
  nav_api: "API",
  api_access_title: "Jiddu API & MCP",
  api_access_subtitle:
    "Five synchronous text-analysis tools plus asynchronous adversarial PDF review for code and agents.",
  api_access_sections: [
    {
      title: "Endpoints",
      paragraphs: [
        "Jiddu exposes its five analysis pipelines as a public REST API. Every endpoint takes a JSON body with a `text` field (40–2000 characters) plus an optional `lang` (`en` / `pt` / `es`), and returns structured JSON.",
        "```\nPOST /api/v1/detect-fallacies\nPOST /api/v1/fact-check\nPOST /api/v1/assess-neutrality\nPOST /api/v1/explain\nPOST /api/v1/detect-slop\n```",
        "`detect-fallacies`, `assess-neutrality`, `explain` and `detect-slop` are fast. `fact-check` extracts each claim and verifies it against live web search, so it is slower and metered.",
      ],
    },
    {
      title: "Adversarial paper review",
      paragraphs: [
        "Adversarial review uses a persisted asynchronous job contract. Start with multipart `POST /api/v1/adversarial-reviews` and one `file`, or JSON with a public `pdf_url`. Choose `depth=standard` for the economical pipeline or `depth=deep` for stronger reasoning and critic models. The `202` response returns an id, a status URL and `retry_after_seconds`; poll `GET /api/v1/adversarial-reviews/{id}` until `status` is `complete` or `failed`.",
        "```\ncurl -X POST https://jiddu.app/api/v1/adversarial-reviews \\\n  -H \"X-Jiddu-Key: YOUR_KEY\" \\\n  -F \"file=@paper.pdf\" \\\n  -F \"lang=en\" \\\n  -F \"depth=deep\" \\\n  -F \"venue_profile_id=neurips-2026-main\"\n\ncurl -H \"X-Jiddu-Key: YOUR_KEY\" \\\n  https://jiddu.app/api/v1/adversarial-reviews/JOB_ID\n```",
        "A completed job returns the structured review, a public methodology audit and source-verification metadata, plus links to its viewer, deterministic Markdown, and print/PDF view. Optional fields are `lang`, `depth`, `venue_profile_id`, `venue`, `venue_year`, `venue_track`, `paper_type`, and `review_date`. PDFs are capped at 25 MB and 300,000 extracted characters.",
      ],
    },
    {
      title: "REST API authentication",
      paragraphs: [
        "The REST API is separate from MCP OAuth. Send its API key in the `X-Jiddu-Key` header. Every key is assigned to one verified WorkOS account and follows that account's funding: included platform access or Jiddu Credits. Keys without an owner are disabled. See “Getting a REST API key” below.",
        "```\ncurl -X POST https://jiddu.app/api/v1/detect-fallacies \\\n  -H \"content-type: application/json\" \\\n  -H \"X-Jiddu-Key: YOUR_KEY\" \\\n  -d '{\"text\": \"Everyone agrees this is best, so critics must be fools.\"}'\n```",
      ],
    },
    {
      title: "MCP server",
      paragraphs: [
        "For agents, connect directly to `https://jiddu.app/api/mcp`. The server exposes the five text tools plus `start_adversarial_review` and `get_adversarial_review`. Compatible MCP clients discover WorkOS AuthKit, open Jiddu sign-in and receive a resource-scoped OAuth token automatically. Accounts on the platform allowlist receive included access; every other tool call reserves and spends Jiddu Credits from the signed-in account.",
        "Clients that still require a local stdio bridge can use `mcp-remote` without a custom authentication header; it handles the OAuth redirect:\n```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\"]\n    }\n  }\n}\n```",
        "Machine-oriented setup guidance, response contracts and chaining examples are included on this page.",
      ],
    },
    {
      title: "Limits & reliability",
      paragraphs: [
        "Text tools are capped at 2000 characters per request. Review jobs accept one public or uploaded PDF up to 25 MB and reject papers above 300,000 extracted characters rather than truncating them. REST rate limits are per API key; hosted MCP limits are per WorkOS user. Exceeding them returns HTTP 429 with a `retry_after_seconds` field. Outputs are automated and can be wrong — treat them as signals to prompt verification, not as final authority.",
        "Quality is measured against fixed internal test sets and the benchmark summaries published on this site.",
      ],
    },
    {
      title: "Getting a REST API key",
      paragraphs: [
        "Keys are issued manually for now and assigned to your verified WorkOS account. Contact the operator through the channel listed on the Terms page to request one. The secret is shown once and stored only as a sha256 hash.",
      ],
    },
  ],
  export_pdf: "Export PDF",

  print_type_fallacy: "Fallacy analysis",
  print_type_factcheck: "Fact-check",
  print_type_neutrality: "Neutrality assessment",
  print_meta_source: "Source",
  print_meta_type: "Type",
  print_meta_text_type: "Text type",
  print_meta_generated: "Generated",
  print_meta_reviewed: "Human-reviewed",
  print_meta_model: "Model",
  print_meta_url: "Report URL",
  print_section_source_text: "Source text",
  print_section_findings: "Findings",
  print_section_claims: "Claims",
  print_section_score: "Score",
  print_no_claims: "No verifiable claims extracted.",
  print_no_findings: "No issues flagged.",
  print_footer_fallacy:
    "This is an automated report. The labels may be wrong — always read the source text and judge for yourself. See https://jiddu.app/legal for the full terms.",
  print_footer_factcheck:
    "This is an automated report. The verdicts may be wrong — always read the cited sources and judge for yourself. See https://jiddu.app/legal for the full terms.",
  print_footer_neutrality:
    "This is an automated report. Neutrality is a property of framing; the labels may be wrong — read the source text and the flagged passages. Jiddu does not classify partisan direction. See https://jiddu.app/legal for the full terms.",
  print_type_explain: "Paper explanation",
  print_meta_level: "Level",
  print_section_explanations: "Explanations",
  print_no_explanations: "No explanations were produced.",
  print_footer_explain:
    "This is an automated explanation. It can misread or oversimplify the paper — always read the source text and the cited work yourself. See https://jiddu.app/legal for the full terms.",
  print_type_slop: "Slop check",
  print_footer_slop:
    "This is an automated report. It flags writing patterns, never authorship — humans write slop too, and the labels may be wrong. Read the quoted passages and judge for yourself. See https://jiddu.app/legal for the full terms.",
  print_generated_at: (when) => `Generated ${when} · jiddu.app`,
  legal_title: "Terms, privacy and disclaimers",
  legal_subtitle:
    "Read this before using Jiddu, especially before sharing an analysis publicly.",
  legal_last_updated: "Last updated: 2026-07-28",
  legal_sections: [
    {
      title: "1. What Jiddu does",
      paragraphs: [
        "Jiddu provides six automated workflows for critical reading: fallacy detection, fact-checking, neutrality assessment, paper explanation, writing-pattern detection and adversarial paper review. The web app, public API and MCP use the same underlying pipelines; paper review runs as an asynchronous job because it has multiple stages.",
        "Jiddu has no human editorial team. Software produces every analysis. A result marked as reviewed received an operator spot-check, but the report itself remains automated. Use it to support critical reading, not replace it.",
      ],
    },
    {
      title: "2. Automated output can be wrong",
      paragraphs: [
        "The verdicts (\"supported\", \"contradicted\", \"mixed\", \"unverified\") and the fallacy labels are best-effort automated judgements. They can be wrong — sometimes confidently wrong.",
        "Jiddu does not assert that any statement, person, or document is true, false, lying, or deceitful. The labels are signals to prompt your own verification. Always read the cited sources and form your own conclusion.",
        "Neutrality scores, Paper Maps and paragraph-by-paragraph explanations are likewise automated interpretations, not statements of fact — the explainer describes what a text says and how it is structured, never whether its claims are correct. Audience level changes only the prose; document classifications, map statements and section-role tags are best-effort readings.",
        "Paper-review findings, novelty comparisons, severity labels, venue fit and the final recommendation are also automated judgements. They are not an official peer review, an acceptance prediction, or a substitute for a qualified human reviewer.",
      ],
    },
    {
      title: "3. Use at your own risk",
      paragraphs: [
        "You are responsible for how you use the analysis and what you share or publish. If you republish a Jiddu result, you adopt that content as your own — Jiddu's authors are not responsible for downstream uses.",
        "Do not submit confidential, proprietary, embargoed or personal data. Submitted content — including selected rendered PDF page images when visual inspection is needed — is forwarded through OpenRouter to the selected upstream model provider and stored under a shareable id.",
        "Use paper review only on manuscripts you own or are authorized to process. Do not upload a manuscript entrusted to you under confidential peer review unless the authors and the venue explicitly permit third-party model processing.",
      ],
    },
    {
      title: "4. Persons and public figures",
      paragraphs: [
        "Analyses about named persons (politicians, journalists, executives) are produced by software searching public web sources. The language Jiddu uses is intentionally cautious (\"evidence does not support\", \"we could not find\") — never adopt a stronger framing than the tool emits.",
        "If you believe a verdict is unfair or unsupported, use the \"report wrong verdict\" button on the relevant claim. The operator reviews submitted reports; abusive or repetitive reports may be discarded.",
      ],
    },
    {
      title: "5. Privacy",
      paragraphs: [
        "Each completed analysis or paper review receives an unlisted share URL and is stored on a server in Brazil. Anyone with the URL can view the final result, but these pages are not enumerated in the public sitemap. Signed-in users can see analyses associated with their account, but the share URL itself remains accessible to anyone who has it; private intermediate review stages are not exposed in the public viewer.",
        "Authentication is provided by WorkOS AuthKit. Jiddu receives the account identity needed to maintain the session, authorize MCP clients and associate operator-issued REST keys, credit balances and usage with the correct account. REST secrets are shown once and stored only as hashes. Model-provider credentials are managed by Jiddu and are never exposed to browser JavaScript, REST clients or MCP clients.",
        "Venue autocomplete sends only the venue query — not the manuscript — to the public [DBLP](https://dblp.org) venue search. The literature-research stage searches public scholarly sources using technical claims from the manuscript; prompts prohibit searching by paper title, author name or other manuscripts by the same authors.",
        "We log the request IP for rate-limiting and abuse detection. We do not sell or share that information.",
        "Page traffic is measured via Google Analytics (gtag.js).",
      ],
    },
    {
      title: "6. Methodology",
      paragraphs: [
        "Our claim extraction and verification pipeline is inspired by [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025) for the extraction stage, and by the evaluation framework described in [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) for the verdict assessment, source-quality tiers and neutrality dimension. Our choice of 4 verdict classes (supported / contradicted / mixed / unverified) rather than the 5- or 6-class schemes used by some fact-checking outlets is informed by [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909), who found that 3-class labeling outperforms 5-class for LLM-based fact-checking — the additional categories in the middle introduce ambiguity without improving accuracy.",
        "Adversarial paper review adapts the SPECS dimensions and staged synthesis/self-critique pattern described in [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu is an independent implementation with its own page-tagged claim/evidence ledger, literature research, arithmetic checks, venue calibration, source validation and finding-retention gate; it does not reproduce the AAAI-26 system.",
        "The slop detector's starting taxonomy comes from Peter Yang's MIT-licensed [no-ai-slop](https://github.com/petergyang/no-ai-slop) editing skill. Jiddu provides its own catalog wording, translations and detection prompt, and flags observable patterns rather than authorship.",
        "Jiddu is not affiliated with those research groups, DBLP, or any venue whose criteria it summarizes. References and official venue pages are cited so users can audit the methodology and the standard applied.",
        "The fact-check pipeline has been benchmarked against the [PolitiFact](https://www.politifact.com) human-labeled corpus (via the [LIAR2 dataset](https://github.com/chengxuphd/liar2), Apache-2.0). On 200 claims from PolitiFact's polar buckets, Jiddu's verdict matched the human verdict in 67.5% of cases overall and 81.3% on the unambiguous true / false / pants-on-fire buckets, with strict polar disagreement in only 4.5%. Full methodology, confusion matrix and disagreement analysis at [docs/benchmark-politifact.md](/benchmark).",
        "Paper review has a separate 30-case synthetic SPECS benchmark. GPT-5.4 mini, GPT-5.5, GPT-5.6 Luna and GPT-5.6 Luna Pro detected all 30 injected defects. Luna Pro returned 8% fewer findings than standard Luna, but the set reached a ceiling and does not establish accuracy on complete real-world papers.",
      ],
    },
    {
      title: "7. Contact",
      paragraphs: [
        "Operator: Rafael de Menezes Ehlers. For takedown requests, corrections, or other concerns, use the contact form at [rafaelmehlers.com.br](https://rafaelmehlers.com.br).",
      ],
    },
  ],

  how_it_works_title: "How Jiddu works",
  how_it_works_subtitle:
    "A clear overview of each analysis, the models behind it, and how Jiddu handles quality, privacy, credits and limitations.",
  how_it_works_sections: [
    {
      title: "1. The big picture",
      paragraphs: [
        "Jiddu offers six independent ways to examine a text or paper: fallacy detection, fact-checking, neutrality assessment, paragraph-by-paragraph explanation, AI-slop pattern detection and adversarial paper review. Live mode adds real-time transcription with selectable fallacy, fact-check claim and neutrality lenses.",
        "Analyses return structured, source-linked findings as they become available. Output follows the language selected in the interface, and each feature can be used independently.",
      ],
    },
    {
      title: "2. Input: ingestion and segmentation",
      paragraphs: [
        "**URL.** Jiddu securely fetches public pages, blocks private or reserved network destinations and uses [Mozilla Readability](https://github.com/mozilla/readability) to isolate the article body.",
        "**PDF.** Parsed locally with [LiteParse](https://github.com/run-llama/liteparse), with a secondary parser available when needed. Academic review preserves page references and can inspect selected rendered pages when visual evidence matters.",
        "**Image.** PNG, JPEG and WebP screenshots up to 10 MB can be pasted, dropped or selected. The chosen vision model transcribes the visible text before the selected analysis runs. Jiddu does not retain the image file.",
        "**Paste.** Used as-is, only whitespace-normalized.",
        "**Segmentation.** Long inputs are divided on sentence-aware boundaries so they fit model context windows without cutting ordinary abbreviations, initials or numbers apart.",
      ],
    },
    {
      title: "3. Models and fallback",
      paragraphs: [
        "Two model families are exposed in the picker: [🇺🇸 GPT-5.6 Luna](https://openrouter.ai/openai/gpt-5.6-luna) (default) and [🇨🇳 MiniMax M3](https://openrouter.ai/minimax/minimax-m3). Offering both lets users compare borderline interpretations and avoids making every analysis depend on one provider.",
        "Jiddu can fall back to the other model family when the selected provider is unavailable. Work already returned is preserved rather than discarded, so a visibly partial result should be treated as partial.",
        "Sonar Reasoning Pro is used exclusively for fact-check verdicts (because it has built-in web search). It is never exposed in the model picker.",
      ],
    },
    {
      title: "4. Fallacy detector",
      paragraphs: [
        "Catalog of 46 fallacies covering relevance, ambiguity, presumption, emotional appeals, causal reasoning and evidence. Each fallacy has a stable id and a distinct color (golden-angle hue distribution) used to highlight passages. The full list is at [/fallacies](/fallacies).",
        "The analysis is deliberately conservative: a finding must quote the relevant passage, identify the pattern and explain the reasoning gap in context. Ambiguous wording should not be flagged unless the surrounding text resolves it.",
        "Each finding receives a severity and contributes to a 0–100 document score. The score is a navigation aid, not the probability that a document is fallacious.",
        "**Models and why.** GPT-5.6 Luna or MiniMax M3 compares the text against a closed catalog. This bounded task does not require web search, while two model families let users compare borderline interpretations.",
        "Jiddu tests representative detections and false-positive traps, but has not yet published a human-labeled accuracy benchmark for this feature. Every highlighted passage still requires human judgment.",
      ],
    },
    {
      title: "5. Slop detector",
      paragraphs: [
        "The slop detector uses a dedicated catalog and returns highlighted passages, short explanations and a 0–100 density score.",
        "The catalog covers 18 AI-slop writing patterns in five families: stock wording, manufactured drama, templated structure, hollow substance, and format tics. The full list with definitions and examples is at [/slop-patterns](/slop-patterns). The pattern selection is based on Peter Yang's MIT-licensed [no-ai-slop](https://github.com/petergyang/no-ai-slop) editing skill; the catalog wording, trilingual content and detection prompt are Jiddu's own.",
        "It detects **patterns, not authorship**: humans can write formulaic prose too. Every finding quotes the exact span, names the pattern and suggests what clearer writing would do without rewriting the source.",
        "**Models and why.** GPT-5.6 Luna or MiniMax M3 acts as a constrained style critic against the closed catalog. No watermark or authorship classifier is involved.",
        "The eval set covers representative positives, clean prose and the no-authorship guardrail. This feature answers “which stock patterns are present?”, not “who or what wrote this?”",
      ],
    },
    {
      title: "6. Fact-check — claim extraction",
      paragraphs: [
        "Modelled on [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). The prompt asks the model to walk every sentence through four stages: **selection** (keep only sentences with a verifiable claim — opinions, value judgements, rhetorical questions get dropped), **disambiguation** (drop sentences with multiple plausible readings when context doesn't resolve them), **decomposition** (split multi-fact sentences into separate claims without chasing infinite atomicity), and **decontextualization** (every emitted claim must stand alone — resolve pronouns, add the year for a number that depends on it, attribute a quote to its source).",
        "Each emitted claim is typed: `numeric`, `date`, `quote`, `causal`, or `categorical`. The type informs how the verifier later searches for evidence.",
        "The selected GPT-5.6 Luna or MiniMax M3 performs extraction only; truth assessment is reserved for the separate verification step. Usage safeguards limit how much work a single document can fan out.",
        "Each claim retains its source sentence and a self-contained statement so the reader can audit what will be checked. Extraction can still miss eligible claims.",
      ],
    },
    {
      title: "7. Fact-check — per-claim verdict",
      paragraphs: [
        "Verification is opt-in. When the user chooses **Verify claims**, each claim is independently researched with [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro).",
        "The result is `supported`, `contradicted`, `mixed` or `unverified`, accompanied by confidence, rationale and cited sources. Low-confidence evidence is handled conservatively rather than forced into a polar verdict.",
        "Every cited source is classified into one of six tiers (per Goldfarb et al. 2025): `primary` (official data agencies, court rulings, peer-reviewed papers), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. A separate boolean flag marks `state-controlled` outlets (RT, CGTN, Xinhua, etc. — but not BBC/NPR/Deutsche Welle, which are state-FUNDED but editorially independent).",
        "Verdict language is intentionally cautious about named people and describes what the available evidence supports rather than accusing someone of dishonesty.",
        "**Model and why.** Sonar Reasoning Pro is used because verification needs current web retrieval and source annotations. Source tiers describe the kind of source, not an automatic truth score.",
        "How accurate is this in practice? We benchmarked the pipeline against [PolitiFact's human-labeled corpus](/benchmark). On 200 claims drawn from PolitiFact's four polar buckets (true / mostly-true / false / pants-on-fire, 2020-onward), Jiddu's verdict matched the human polar verdict in 67.5% of cases overall and 81.3% on the unambiguous true / false / pants-on-fire buckets. Strict polar disagreement — Jiddu calling a claim the opposite of the human — happened in only 4.5% of cases (9 of 200). The remaining ~28% were Jiddu returning `mixed` or `unverified` instead of a polar verdict, concentrated on PolitiFact's `mostly_true` bucket (where 58% became `mixed` — a structural overlap, not a miss, since both labels describe partial truth). Full methodology, confusion matrix and disagreement analysis at the link.",
      ],
    },
    {
      title: "8. Fact-check — verdict cache",
      paragraphs: [
        "Recent verdicts may be reused for equivalent claims to reduce latency and unnecessary search cost. Cache lifetimes vary by claim type so changeable facts expire sooner than stable historical facts.",
        "Users can request a fresh check from the claim card. Refresh and usage safeguards prevent repeated searches from creating unbounded cost.",
      ],
    },
    {
      title: "9. Neutrality",
      paragraphs: [
        "Distinct from fallacy detection: a text can be fallacy-free and factually accurate while still using loaded framing, asymmetric attribution or one-sided sourcing. Neutrality surfaces those patterns.",
        "Eight issue types are flagged at the sentence level: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. The model also classifies the document into one of seven text types (informational / opinion / political speech / advocacy / analysis / marketing / social_media) which informs how strict the audit is.",
        "The document-level verdict is one of `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. Jiddu **deliberately does not classify partisan direction** (left/right, pro-X/anti-Y). The Forum AI paper that inspired the methodology requires a bipartisan expert panel for that step; without one, partisan labels are unreliable and harmful. We surface specific patterns the reader can audit instead.",
        "**Models and why.** GPT-5.6 Luna or MiniMax M3 classifies framing and sentence-level issues without browsing the web or deciding whether the underlying claims are true.",
        "There is no published human-panel benchmark for neutrality yet. The verdict is a navigation aid into auditable passages, not an objective measurement of political balance.",
      ],
    },
    {
      title: "10. Storage, privacy and review status",
      paragraphs: [
        "WorkOS AuthKit provides user accounts and sessions. Completed results remain available through unlisted share URLs, and signed-in users can also see their associated analyses in the account area. Anyone with a share URL can still view its final result. Paper-review ledgers, research and draft judgements are internal intermediate artifacts and are not exposed in the public result.",
        "Jiddu Credits are an application balance for web, account-owned REST and hosted MCP analyses that use Jiddu's server-managed provider credentials. Verified accounts on the operator-managed platform allowlist receive included access instead.",
        "Submitted content goes through OpenRouter to the upstream serving the chosen model. Pasted screenshots are sent for transcription, but Jiddu does not retain the image file; its extracted text is stored with the analysis. Paper review includes selected rendered page images, not only extracted text. Its literature stage searches public scholarly sources using technical claims while prompts prohibit queries by paper title, author name or other manuscripts by the same authors. Venue autocomplete sends only the typed venue query to DBLP. We log the request IP for rate-limiting and abuse signalling and do not sell it.",
        "Results are automated and unreviewed by default. A result explicitly marked as reviewed has been spot-checked by the operator; that status is an additional human check, not a guarantee that every finding is correct.",
      ],
    },
    {
      title: "11. Credits, billing and abuse controls",
      paragraphs: [
        "Jiddu Credits pay for analyses across the web app, account-owned REST API keys and hosted MCP. Before most work begins, Jiddu temporarily reserves the estimate shown below so concurrent jobs cannot spend the same balance. Live instead checks that the account has the required minimum balance without holding or charging it. Metered usage settles against the work actually completed, and any unused reservation is returned to the account. Some verified accounts have included platform access and do not consume their personal credit balance.",
        "A reservation is an estimate, not always the final debit. Long documents can contain multiple chunks, fact-check verification is charged per eligible claim, and Live analysis is charged per selected lens and completed analysis window. Live transcription is billed from actual audio duration at OpenAI's configured per-minute rate. Provider retries, reasoning usage or an unusually expensive completion can leave the account negative; new analyses then stay blocked until credits are added.",
        "Paid credit packs are sold as one-time purchases through Stripe Checkout. Credits are granted only after Jiddu verifies the completed payment with Stripe; the credit ledger and transaction history remain the source of truth for purchases and usage.",
        "Per-account and per-request safeguards limit abusive or accidentally unbounded use. Limits vary by feature and may evolve as model capacity and provider pricing change.",
      ],
      creditTable: {
        intro:
          "The table shows the maximum initial reservation under the current default routing. It helps users check whether they have enough credits before starting; the final debit for metered calls is based on the work actually completed.",
        headers: {
          feature: "Feature",
          unit: "Billing unit",
          estimate: "Estimated credit requirement",
        },
        rows: [
          {
            feature: "Fallacy detector",
            unit: "Per completed text chunk",
            estimate: "Up to 2 credits reserved",
          },
          {
            feature: "Fact-check — extraction",
            unit: "Per completed text chunk",
            estimate: "Up to 2 credits reserved",
          },
          {
            feature: "Fact-check — verification",
            unit: "Per eligible claim search",
            estimate:
              "Up to 2 credits for each uncached claim; cached results use no credits",
          },
          {
            feature: "Neutrality",
            unit: "Per completed text chunk",
            estimate: "Up to 2 credits reserved",
          },
          {
            feature: "Paper explainer",
            unit: "Per completed text chunk",
            estimate: "Up to 2 credits reserved",
          },
          {
            feature: "Slop detector",
            unit: "Per completed text chunk",
            estimate: "Up to 2 credits reserved",
          },
          {
            feature: "Adversarial review — Standard",
            unit: "Per review run",
            estimate: "Up to 21 credits reserved",
          },
          {
            feature: "Adversarial review — Deep",
            unit: "Per review run",
            estimate: "Up to 94 credits reserved",
          },
          {
            feature: "Live transcription",
            unit: "Per audio duration",
            estimate:
              "{liveCredits} available credits required to start; final debit based on actual duration",
          },
          {
            feature: "Live analysis",
            unit: "Per completed analysis window",
            estimate: "Up to 3 credits reserved with all three lenses",
          },
        ],
        note:
          "Rate card {rateVersion}. Unused reservations are released. Estimates can change as routing and provider prices evolve; completed usage is always visible in the account credit ledger.",
      },
    },
    {
      title: "12. Feedback loop",
      paragraphs: [
        "Every fact-check claim card includes **🚩 Report wrong verdict**. The report records the verdict the user saw and an optional explanation for private review.",
        "Reports do not automatically change a verdict or outweigh the cited evidence. They inform manual review and future quality improvements.",
      ],
    },
    {
      title: "13. Live mode (beta)",
      paragraphs: [
        "At [/live](/live), Jiddu transcribes a microphone or, on Chromium browsers, a browser tab with `gpt-live-transcribe`. Audio travels directly from the browser to OpenAI over an encrypted Realtime connection; Jiddu receives the transcript needed for analysis, not the raw audio.",
        "GPT-5.6 Luna or MiniMax M3 periodically analyzes the growing transcript through the selected Live lenses: logical fallacies, check-worthy claim extraction and neutrality assessment. The user chooses a 10, 20, 30 or 60-second interval; longer intervals give each analysis more context. Results stream into an All feed and dedicated panels, with a badge identifying each type.",
        "After finalization, each selected lens receives a shareable full viewer. Detected claims can also be verified against web sources directly inside Live, with evidence-backed verdicts and sources, or from the full fact-check viewer.",
        "Sessions are capped at 60 minutes, use Jiddu Credits or included access, and store only the transcript and selected analysis results. Tab audio is supported in Chrome and Edge; microphone capture works in other compatible browsers.",
      ],
    },
    {
      title: "14. Explain — paper explainer",
      paragraphs: [
        "Explain takes an academic paper or technical document and produces a Paper Map plus a paragraph-by-paragraph plain-language explanation. The map identifies the paper type, contribution type, central question, contribution, approach, main answer, evidence and any limitation explicitly stated by the authors. Each map statement links back to supporting paragraphs. Each paragraph also gets a role tag (Background / Objective / Method / Result / Interpretation / Limitation / Conclusion) and an explanation written at the chosen audience level.",
        "Audience levels: **Child** (ELI5, everyday analogies, no jargon), **High school** (clear language, a few technical terms explained), **Undergraduate** (standard academic register, assumes field familiarity), **Expert** (concise, peer-level, full terminology retained). The level controls prose complexity only — it does not filter or validate content.",
        "Role tagging and the Paper Map are algorithmic. Paragraphs are explained in chunks, then a bounded final synthesis samples all semantic roles and uses every chunk summary to build the document-level map. Interdisciplinary papers or documents with non-standard structure may receive incorrect tags or map entries.",
        "Unlike the general-text pipelines, Explain is optimised for structured academic papers. Results on blog posts, legal filings, or unstructured prose will be lower quality.",
        "**Models and why.** GPT-5.6 Luna or MiniMax M3 transforms the supplied text rather than researching literature or independently validating it. Explain does not perform web search or citation verification.",
        "The current evals check role coverage, audience calibration and schema reliability, not factual faithfulness against expert annotations. Explain can simplify a caveat away or confidently misread a method; it should make the source easier to enter, never substitute for reading it.",
      ],
    },
    {
      title: "15. Adversarial paper review",
      paragraphs: [
        "Adversarial review accepts one final PDF plus target venue, edition, track, paper type and optional review date. The result includes a recommendation, summary, strengths, localized weaknesses, questions, reproducibility checklist, references and the venue standard applied.",
        "Methodologically, Jiddu adapts the **SPECS** review dimensions — Story, Presentation, Evaluations, Correctness and Significance — and the staged synthesis/self-critique pattern described in [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu is an independent implementation with its own claim/evidence ledger, venue calibration, parser, output contract and safeguards; it does not reproduce the AAAI-26 system.",
        "The review examines **Story, Presentation, Evaluations, Correctness and Significance**, checks published literature and challenges its own synthesis before returning retained findings. It does not execute manuscript code.",
        "**Models and why.** Standard uses the selected GPT-5.6 Luna or MiniMax M3 with a separate model family for quality critique. Deep adds GPT-5.6 Luna Pro reasoning and an independent Claude Opus 4.8 audit for greater scrutiny; it takes longer and costs more.",
        "On Jiddu's 30-case synthetic SPECS benchmark, GPT-5.4 mini, GPT-5.5, GPT-5.6 Luna and GPT-5.6 Luna Pro detected every injected defect. Luna Pro produced 8% fewer findings than standard Luna, but the benchmark reached a ceiling and does not prove superiority on complete papers.",
        "Venue discovery uses [DBLP](https://dblp.org) and verified profiles for selected conferences. Verified profiles apply cited official criteria; unmatched venues use a clearly labeled general scholarly rubric rather than guessed requirements.",
        "Every substantive weakness must carry a manuscript page or section and a `MAJOR`, `MODERATE` or `MINOR` severity. The review is still automated: it can miss problems, invent comparisons or misapply a criterion, and it is not an official peer review or acceptance prediction.",
      ],
    },
    {
      title: "16. Public API & MCP (for agents)",
      paragraphs: [
        "The text analyses are available through a public REST API, while adversarial review runs as an asynchronous job suitable for longer agent workflows. Requests are tied to a verified Jiddu account and use included access or Jiddu Credits.",
        "The hosted MCP server exposes the text tools plus adversarial review. Compatible clients use [WorkOS AuthKit MCP](https://workos.com/docs/authkit/mcp) for OAuth sign-in and resource-scoped access.",
        "Endpoints, payloads, authentication instructions and setup snippets are documented at [/api-access](/api-access).",
      ],
    },
    {
      title: "17. Methodology and evaluation",
      paragraphs: [
        "[Claimify](https://arxiv.org/abs/2502.10855) informs claim extraction, and [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) informs verdict assessment, source tiers and neutrality. [no-ai-slop](https://github.com/petergyang/no-ai-slop) supplies the starting taxonomy for writing-pattern detection.",
        "Adversarial paper review adapts the SPECS dimensions and staged synthesis/self-critique described in [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu adds its own ledger, LiteParse extraction, DBLP discovery, venue profiles, source validation and retention gate. It is not affiliated with those groups, DBLP or the venues.",
        "Published evaluation currently consists of the [200-claim PolitiFact benchmark](/benchmark) and a 30-case synthetic SPECS benchmark. Both have documented limits and neither guarantees correctness on a new text or paper.",
        "The full disclaimer about what Jiddu does and doesn't claim is at [/legal](/legal).",
      ],
    },
  ],

  not_found_label: "Error 404",
  not_found_title: "This path leads nowhere.",
  not_found_subtitle:
    "Truth is a pathless land — but this is just a broken link. The page you were looking for isn't here.",
  not_found_cta: "Back to solid ground",

  analysis_failed: "Analysis failed",
  try_again: "Try again",
  ingest_blocked_title: "The site refused our request",
  ingest_blocked_hint:
    "Many news outlets block automated readers or hide content behind paywalls. Open the article in your browser, copy the body, and paste it here.",
  ingest_not_found_title: "Page not found",
  ingest_not_found_hint:
    "The URL returned 404. Double-check the link, or paste the text directly.",
  ingest_rate_limited_title: "The site asked us to slow down",
  ingest_rate_limited_hint:
    "We got a rate-limit response (429). Wait a minute and try again, or paste the text directly.",
  ingest_timeout_title: "The site took too long to respond",
  ingest_timeout_hint:
    "We gave up after 15 seconds. Try again, or paste the text directly.",
  ingest_unreachable_title: "We couldn't reach that URL",
  ingest_unreachable_hint:
    "DNS or network error. Check the address, or paste the text directly.",
  ingest_extraction_failed_title: "We couldn't extract the article",
  ingest_extraction_failed_hint:
    "The page loaded but we couldn't find a readable body. Paste the text directly.",
  ingest_invalid_url_title: "Invalid URL",
  ingest_too_short_title: "Text is too short",
  switch_to_paste: "Paste text instead",

  a11y_show_fallacy: "Show fallacy comment",
  a11y_show_claim: "Show claim verification",
  a11y_show_signal: "Show bias signal detail",
  a11y_show_explanation: "Show paragraph explanation",

  new_analysis: "New analysis",
  share: "Share",
  copied: "Copied",
  no_fallacies: "No fallacies detected.",
  pending: "pending",
  finding_count: (count, total) =>
    `${count} ${count === 1 ? "finding" : "findings"} across ${total} sentences`,
  read_more: "Learn more",

  score_label: "Score",
  score_clean: "clean reasoning",
  score_minor: "minor issues",
  score_several: "several fallacies",
  score_high: "highly fallacious",
  score_propagandistic: "propagandistic",

  severity_low: "low",
  severity_high: "high",

  guide_title: "Fallacy guide",
  guide_subtitle:
    "A short reference for the logical and rhetorical fallacies Jiddu can detect.",
  guide_example: "Example",
  guide_back: "Back to home",
  guide_credit_prefix: "Fallacy selection informed by",
  guide_credit_suffix: "— all descriptions and examples are Jiddu's own.",

  nav_fallacies: "Fallacy guide",
  nav_slop_patterns: "Slop patterns",
  nav_benchmark: "Benchmark",
  nav_pricing: "Pricing",

  theme_to_dark: "Switch to dark mode",
  theme_to_light: "Switch to light mode",

  share_link_label: "Share this analysis",
  share_link_hint: "Click to copy the link",
  link_copied: "Link copied",
  scroll_to_bottom: "Scroll to bottom",
  scroll_to_top: "Back to top",

  close: "Close",
  open_in_guide: "Open in full guide",
  category: "Category",
  mobile_hint_title: "Reading tip",
  mobile_hint_body:
    "Tap any highlighted passage to read the explanation of the fallacy in a pop-up.",
  mobile_hint_dismiss: "Got it",
  finding_from_text: "From the text",
  finding_about_this_fallacy: "About this fallacy",

  live_subtitle:
    "Listen in real time and surface fallacies, check-worthy claims and neutrality signals as the speaker talks.",
  live_source_mic: "Microphone",
  live_source_tab: "Browser tab",
  live_source_tab_chrome_only: "Chrome only",
  live_source_tab_tooltip: "Capture audio from a browser tab",
  live_source_tab_unsupported: "Tab capture requires Chrome or Edge",
  live_language_follows_header: "Language follows the selector in the header.",
  live_lenses_title: "Live lenses",
  live_lenses_hint: "Choose what Jiddu should monitor during this session.",
  live_lens_fallacy: "Fallacies",
  live_lens_factcheck: "Fact-check claims",
  live_lens_neutrality: "Neutrality",
  live_all: "All",
  live_no_results_yet:
    "No results detected yet. They will appear here as the speaker talks.",
  live_interval_title: "Analysis interval",
  live_interval_hint:
    "Longer intervals give Jiddu more context for each analysis.",
  live_start: "Start",
  live_stop: "Stop & finalize",
  live_findings: "Findings",
  live_running_score: "Running score",
  live_privacy_note:
    "Audio is streamed directly from your browser to OpenAI’s Realtime API via WebRTC. The raw audio is not stored — only the transcript and selected analysis results are persisted, and they become available at shareable URLs once you stop the session.",
  live_status_connecting: "Connecting…",
  live_status_live: "Live",
  live_status_analyzing: "Analyzing",
  live_status_stopped: "Stopped",
  live_status_finalizing: "Finalizing…",
  live_status_error: "Error",
  live_transcript_listening: "Listening… speak into your microphone.",
  live_transcript_idle: "Press Start to begin transcribing.",
  live_no_findings_yet:
    "No fallacies detected yet. They will appear here as the speaker talks.",
  live_no_claims_yet:
    "No check-worthy claims detected yet. They will appear here as the speaker talks.",
  live_no_neutrality_yet:
    "No neutrality signals detected yet. The running assessment will appear here.",
  live_claim_detected: "Detected live · verify after finalizing",
  live_partial_verdict: "Running assessment",
  live_confidence: "Confidence",
  live_session_saved: "Session saved.",
  live_view_analysis: "View fallacy analysis",
  live_view_factcheck: "View and verify claims",
  live_view_neutrality: "View neutrality assessment",
  live_start_new: "Start new recording",
};

const pt: Messages = {
  tagline: "truth is a pathless land",

  hero_title: "Leia qualquer coisa com senso crítico.",
  hero_subtitle:
    "Envie um PDF ou screenshot, cole texto ou uma imagem, ou solte uma URL. O Jiddu destaca os trechos com falácias lógicas e explica cada um em um comentário — como um revisor no Word — e dá uma nota de 0 a 100 para o texto inteiro.",
  home_hero_subtitle:
    "Solte um PDF ou screenshot, cole texto ou uma imagem, ou adicione uma URL — e escolha uma lente. Ou use o Live para monitorar falácias, afirmações verificáveis e sinais de imparcialidade enquanto alguém fala.",
  privacy: "Privacidade:",
  privacy_body:
    "seu conteúdo — incluindo screenshots colados e imagens de páginas selecionadas do PDF quando necessário — é enviado ao modelo escolhido via OpenRouter. O Jiddu não retém o arquivo do screenshot; o texto extraído é armazenado localmente sob um id compartilhável.",
  see_demo: "Ver demonstração",
  see_demo_for: (feature) =>
    `Ver uma demonstração de ${feature.toLocaleLowerCase("pt-BR")}`,
  see_demo_hint: "Quer uma amostra rápida sem rodar uma análise?",
  bench_badge_label:
    "Pipeline validado · 67,5% de concordância com PolitiFact em benchmark de 200 claims",
  bench_badge_link: "ver relatório",
  pipelines_heading: "Sete formas de fazer uma leitura crítica",
  pipelines_subheading:
    "Escolha um modo no formulário acima, ou abra uma análise de exemplo para ver como cada um fica.",
  pipeline_fallacy_desc:
    "Destaca cada trecho que contém uma falácia lógica e explica cada uma em um comentário na margem (estilo Word). Dá uma nota de falácia de 0 a 100.",
  pipeline_factcheck_desc:
    "Extrai cada afirmação verificável — números, datas, citações, alegações causais e categóricas — e opcionalmente checa cada uma na web ao vivo via Perplexity Sonar com fontes citadas.",
  pipeline_neutrality_desc:
    "Sinaliza padrões de enquadramento, atribuição e seleção de fontes que tornam um texto partidário mesmo quando não há nenhuma falsidade factual. Deliberadamente NÃO classifica esquerda/direita.",
  pipeline_live_desc:
    "Escuta em tempo real e monitora falácias, afirmações verificáveis e sinais de imparcialidade enquanto alguém fala.",
  quality_card_heading: "Qualidade medida contra humanos",
  quality_card_body:
    "Medimos o pipeline de fact-check contra 200 afirmações rotuladas humanamente pelo PolitiFact. O veredito do Jiddu coincidiu com o veredito humano em 81,3% das afirmações inequívocas (true / false / pants-on-fire), com discordância estrita em apenas 4,5% dos casos.",
  quality_card_link: "Metodologia completa e matriz de confusão",

  footer_quote:
    "“No momento em que você segue alguém, deixa de seguir a verdade.”",
  footer_balance: (amount) => `${amount} restantes em créditos de API`,

  tab_url: "URL",
  tab_paste: "Colar texto",
  tab_file: "PDF / TXT / Imagem",
  tab_live: "Ao vivo",
  tab_factcheck: "Checar fatos",
  url_placeholder: "https://exemplo.com/artigo",
  paste_placeholder: "Cole o texto que você quer analisar…",
  file_drop_hint: "Solte PDF, TXT ou imagem — ou cole um screenshot",
  file_size_hint: "⌘V / Ctrl+V · imagens até 10 MB · texto até ~200 mil caracteres",
  model: "Modelo",
  model_anthropic: "Claude (Anthropic)",
  model_openai: "GPT (OpenAI)",
  analyze: "Analisar",
  starting: "Iniciando…",
  form_hint: "Os comentários aparecem à medida que a análise roda. Não feche a página.",
  auth_required_title: "É necessário entrar",
  auth_required_hint:
    "Crie uma conta no Jiddu ou entre para continuar. Contas conectadas usam créditos Jiddu ou o acesso incluído à plataforma.",
  auth_sign_in: "Entrar",
  auth_create_account: "Criar conta",
  credits_required_title: "Créditos Jiddu necessários",
  credits_required_hint:
    "Esta análise precisa de mais créditos Jiddu. Abra sua conta para conferir o saldo e o histórico de créditos.",
  credits_open_account: "Ver conta",

  loading_starting: "Iniciando análise",
  loading_reading: "Lendo o texto",
  loading_analyzing: (done, total) =>
    `Analisando — ${done} de ${total} trechos concluídos`,
  loading_finalizing: "Finalizando",
  loading_hint: "Isso normalmente leva 10–30 segundos. Não feche a página.",
  sections: "trechos",
  fallacies_found_so_far: (count) =>
    `${count} ${count === 1 ? "falácia encontrada" : "falácias encontradas"} até agora`,
  loader_url: [
    "Buscando a página",
    "Seguindo redirecionamentos",
    "Removendo anúncios e navegação",
    "Extraindo o corpo do artigo",
    "Detectando o idioma",
    "Dividindo em sentenças",
  ],
  loader_paste: [
    "Lendo seu texto",
    "Normalizando espaçamento",
    "Detectando o idioma",
    "Dividindo em sentenças",
  ],
  loader_file: [
    "Lendo o arquivo",
    "Extraindo conteúdo de texto",
    "Limpando quebras de página",
    "Detectando o idioma",
    "Dividindo em sentenças",
  ],
  loader_image: [
    "Lendo o screenshot",
    "Transcrevendo o texto visível",
    "Preservando parágrafos e autores",
    "Preparando o texto extraído",
  ],
  loader_analysis: [
    "Procurando enquadramento tendencioso",
    "Verificando as afirmações",
    "Comparando com o catálogo de falácias",
    "Examinando padrões retóricos",
    "Redigindo os comentários",
    "Avaliando a severidade",
  ],
  loader_factcheck: [
    "Lendo o texto",
    "Descartando opinião e retórica",
    "Separando fatos verificáveis",
    "Extraindo números e datas",
    "Decontextualizando cada afirmação",
    "Redigindo a justificativa",
  ],

  factcheck_hero_title: "Extraia todas as afirmações verificáveis de qualquer texto.",
  factcheck_hero_subtitle:
    "Solte uma URL, cole texto ou envie um PDF. O Jiddu separa os números, datas, citações e afirmações factuais que valem a pena conferir — pra você saber exatamente o que verificar.",
  extract_claims: "Extrair afirmações",
  factcheck_failed: "Falha na extração de afirmações",
  claims_found_one: "afirmação verificável encontrada até agora",
  claims_found_many: "afirmações verificáveis encontradas até agora",

  mode_detector: "Detector de Falácias",
  mode_factcheck: "Checar Fatos",
  mode_live: "Live",

  fc_untitled: "Sem título",
  fc_claims_one_extracted: "afirmação extraída",
  fc_claims_many_extracted: "afirmações extraídas",
  fc_claims_header: "Afirmações",
  fc_extracting: "Extraindo afirmações…",
  fc_no_claims: "Nenhuma afirmação verificável foi extraída deste texto.",
  fc_verify_panel_title: "Verificar estas afirmações",
  fc_verify_panel_desc:
    "O Jiddu vai passar cada afirmação por um modelo com busca na web e retornar um veredito com fontes. Verificações automatizadas podem errar — sempre confira as fontes.",
  fc_verify_button: "Verificar afirmações",
  fc_reverify_button: "Reverificar",
  fc_verify_label: "Verificação",
  fc_show_sources: (n) => `Mostrar fontes (${n})`,
  fc_hide_sources: (n) => `Esconder fontes (${n})`,
  fc_checking: "checando",
  fc_report_wrong: "Reportar veredito errado",
  fc_report_prompt: "Por que o veredito está errado? (opcional)",
  fc_report_thanks: "Valeu — vamos revisar.",
  fc_footer: (model) =>
    `Afirmações extraídas por ${model} via OpenRouter. Os vereditos (quando presentes) vêm de um modelo com busca na web e podem estar errados. O Jiddu não afirma que qualquer alegação é verdadeira ou falsa — leia as fontes e julgue por conta própria.`,
  fc_status_complete: "Concluído",
  fc_status_running: "Em andamento",
  fc_status_failed: "Falhou",
  fc_status_pending: "Pendente",

  ct_numeric: "Numérica",
  ct_date: "Data",
  ct_quote: "Citação",
  ct_causal: "Causal",
  ct_categorical: "Categórica",

  vd_supported: "Sustentado",
  vd_contradicted: "Contradito",
  vd_mixed: "Misto",
  vd_unverified: "Não verificado",

  st_primary: "Fonte primária",
  st_scholarly: "Acadêmico",
  st_think_tank: "Think tank",
  st_journalistic: "Jornalismo",
  st_commercial_content: "Comercial",
  st_informal: "Informal",
  st_state_controlled: "Controlado pelo Estado",

  mode_neutrality: "Imparcialidade",
  tab_neutrality: "Imparcialidade",
  neutrality_hero_title: "Identifique padrões de enquadramento, atribuição e seleção de fontes.",
  neutrality_hero_subtitle:
    "Solte uma URL, cole texto ou envie um PDF. O Jiddu sinaliza palavras carregadas, atribuição assimétrica, falsa equivalência e outros padrões de enquadramento — sem tentar rotular direção partidária.",
  assess_neutrality: "Avaliar imparcialidade",
  neutrality_failed: "Falha na análise de imparcialidade",
  loader_neutrality: [
    "Lendo o texto",
    "Observando escolhas de palavras",
    "Verificando simetria de atribuição",
    "Procurando omissão seletiva",
    "Auditando o mix de fontes",
    "Redigindo o veredito",
  ],
  findings_found_one: "padrão encontrado",
  findings_found_many: "padrões encontrados",
  neutrality_no_issues: "Nenhum padrão de imparcialidade sinalizado.",
  neutrality_confidence: "confiança",
  neutrality_footer: (model) =>
    `Avaliado por ${model} via OpenRouter. Imparcialidade é uma propriedade do enquadramento — o Jiddu não classifica direção partidária. Leia os trechos sinalizados e julgue por conta própria.`,

  nv_neutral: "Neutro",
  nv_partisan_lean: "Inclinação partidária",
  nv_explicitly_partisan: "Explicitamente partidário",
  nv_manipulation: "Manipulação",

  ni_loaded_language: "Linguagem carregada",
  ni_asymmetric_attribution: "Atribuição assimétrica",
  ni_false_equivalence: "Falsa equivalência",
  ni_selective_omission: "Omissão seletiva",
  ni_source_asymmetry: "Assimetria de fontes",
  ni_both_sidesing: "Falso debate",
  ni_steering: "Indução",
  ni_genetic_framing: "Ataque à origem",

  tt_informational: "Informativo",
  tt_opinion: "Opinião",
  tt_political_speech: "Discurso político",
  tt_advocacy: "Advocacy",
  tt_analysis: "Análise",
  tt_marketing: "Marketing",
  tt_social_media: "Redes sociais",

  // Explain dimension (paper explainer)
  mode_explain: "Explicador de Papers",
  explain_hero_title: "Entenda qualquer paper, parágrafo por parágrafo.",
  explain_hero_subtitle:
    "Suba um paper ou cole o texto, escolha um nível, e o Jiddu mapeia pergunta, abordagem e evidências antes de explicar cada parágrafo na margem.",
  explain_cta: "Explicar",
  explain_failed: "Falha na explicação",
  loader_explain: [
    "Lendo o paper",
    "Mapeando a estrutura",
    "Explicando cada parágrafo",
    "Traduzindo o jargão",
    "Conectando o argumento",
  ],
  loader_explain_map: "Montando o mapa do paper",
  explain_level: "Nível de explicação",
  level_eli5: "Criança",
  level_high_school: "Ensino médio",
  level_undergrad: "Graduação",
  level_expert: "Especialista",
  role_background: "Contexto",
  role_objective: "Objetivo",
  role_method: "Método",
  role_result: "Resultados",
  role_interpretation: "Interpretação",
  role_limitation: "Limitações",
  role_conclusion: "Conclusão",
  explain_overview_label: "Em poucas palavras",
  explain_map_label: "Mapa do paper",
  explain_map_paper_type: "Tipo de paper",
  explain_map_contribution_type: "Contribuição",
  explain_map_question: "Pergunta central",
  explain_map_contribution: "O que ele contribui",
  explain_map_approach: "Como investiga",
  explain_map_answer: "Resposta principal",
  explain_map_evidence: "Evidências e dados",
  explain_map_limitation: "Ressalva declarada",
  explain_map_open_evidence: "Abrir o parágrafo que sustenta este item",
  explain_jump_to: "Ir para",
  explanations_count_one: "explicação",
  explanations_count_many: "explicações",
  explain_empty: "Nenhuma explicação foi gerada para este documento.",
  explain_footer: (model) =>
    `Explicado por ${model} via Jiddu. Explicações automáticas podem interpretar mal um paper — sempre confira no original.`,
  pipeline_explain_desc:
    "Receba um mapa da pergunta, abordagem e evidências do paper, além da explicação de cada parágrafo — de criança a especialista.",

  mode_slop: "Detector de Slop",
  pipeline_slop_desc:
    "Sinaliza as frases prontas, o drama fabricado e as estruturas de fôrma que fazem um texto parecer montado por máquina. Nomeia cada padrão com citação verificável — nunca chuta autoria.",
  check_slop: "Detectar slop",
  slop_failed: "Falha na detecção de slop",
  loader_slop: [
    "Farejando frases prontas",
    "Conferindo se o drama é fabricado",
    "Medindo a densidade de fôrma",
    "Pesando o que sobrevive à exclusão",
    "Redigindo os comentários",
  ],
  slop_found_one: "padrão sinalizado até agora",
  slop_found_many: "padrões sinalizados até agora",
  no_slop: "Nenhum padrão de slop detectado — este texto soa humano.",
  slop_finding_count: (count, total) =>
    `${count} ${count === 1 ? "padrão" : "padrões"} em ${total} sentenças`,
  slop_score_clean: "soa humano",
  slop_score_light: "tempero leve",
  slop_score_several: "padronizado",
  slop_score_heavy: "muito padronizado",
  slop_score_assembly: "prosa de linha de montagem",
  a11y_show_slop: "Mostrar comentário de slop",
  finding_about_this_pattern: "Sobre este padrão",
  slop_guide_title: "Guia de padrões de slop",
  slop_guide_subtitle:
    "Uma referência curta para os padrões de escrita de slop de IA que o Jiddu sinaliza. Padrões, não autoria — humanos também escrevem slop.",

  mode_review: "Revisão adversarial",
  pipeline_review_desc:
    "Trata um paper como submissão autônoma, audita claims e experimentos, verifica literatura publicada e entrega uma review de gatekeeping com críticas localizadas.",
  review_cta: "Revisar paper",
  review_failed: "Falha na revisão adversarial",
  loader_review: [
    "Interpretando o paper completo",
    "Construindo o ledger privado de claims",
    "Verificando a literatura publicada",
    "Executando cinco revisões SPECS independentes",
    "Recalculando os resultados reportados",
    "Sintetizando os achados especializados",
    "Executando a autocrítica adversarial",
    "Validando as fontes externas",
    "Executando a auditoria de qualidade independente",
    "Finalizando a review",
  ],
  review_venue: "Venue-alvo (opcional)",
  review_venue_placeholder: "Busque NeurIPS, ICML, ICLR, AAAI…",
  review_venue_help: "Perfis verificados aplicam critérios oficiais da edição. Outros venues do DBLP usam um padrão acadêmico geral.",
  review_venue_searching: "Buscando no DBLP…",
  review_venue_verified: "Rubrica verificada",
  review_venue_catalog_only: "Resultado do catálogo · rubrica geral",
  review_venue_year: "Edição",
  review_depth: "Profundidade da revisão",
  review_depth_standard: "Padrão",
  review_depth_deep: "Profunda",
  review_depth_help:
    "A revisão profunda usa modelos de raciocínio mais fortes em avaliações, correção, síntese e numa crítica independente. Leva mais tempo e custa mais.",
  review_track: "Track",
  review_track_placeholder: "Main track",
  review_paper_type: "Tipo de paper",
  review_type_research: "Paper de pesquisa",
  review_type_position: "Position paper",
  review_type_survey: "Survey",
  review_type_dataset: "Dataset / benchmark",
  review_type_theory: "Teoria",
  review_type_use_inspired: "Orientado à aplicação",
  review_type_concept: "Conceito e viabilidade",
  review_type_negative_results: "Resultados negativos",
  review_date: "Data da revisão (opcional)",
  review_pdf_hint: "Solte exatamente um PDF final, ou clique para escolher",
  review_file_size_hint: "Somente PDF · leitura integral · até ~300 mil caracteres",
  review_form_hint:
    "Uma revisão completa pode levar alguns minutos. Mantenha esta página aberta.",

  nav_legal: "Termos",
  nav_how_it_works: "Como funciona",
  nav_api: "API",
  api_access_title: "API & MCP do Jiddu",
  api_access_subtitle:
    "Cinco ferramentas síncronas de texto mais revisão adversarial assíncrona de PDF para código e agentes.",
  api_access_sections: [
    {
      title: "Endpoints",
      paragraphs: [
        "O Jiddu expõe seus cinco pipelines de análise como uma REST API pública. Todo endpoint recebe um corpo JSON com um campo `text` (40–2000 caracteres) e um `lang` opcional (`en` / `pt` / `es`), e retorna JSON estruturado.",
        "```\nPOST /api/v1/detect-fallacies\nPOST /api/v1/fact-check\nPOST /api/v1/assess-neutrality\nPOST /api/v1/explain\nPOST /api/v1/detect-slop\n```",
        "`detect-fallacies`, `assess-neutrality`, `explain` e `detect-slop` são rápidos. O `fact-check` extrai cada afirmação e a verifica com busca na web ao vivo, então é mais lento e medido.",
      ],
    },
    {
      title: "Revisão adversarial de paper",
      paragraphs: [
        "A revisão adversarial usa um contrato de jobs assíncronos persistidos. Inicie com `POST /api/v1/adversarial-reviews` multipart e um `file`, ou JSON com uma `pdf_url` pública. Escolha `depth=standard` para o pipeline econômico ou `depth=deep` para modelos mais fortes de raciocínio e crítica. A resposta `202` traz id, URL de status e `retry_after_seconds`; consulte `GET /api/v1/adversarial-reviews/{id}` até `status` ser `complete` ou `failed`.",
        "```\ncurl -X POST https://jiddu.app/api/v1/adversarial-reviews \\\n  -H \"X-Jiddu-Key: SUA_CHAVE\" \\\n  -F \"file=@paper.pdf\" \\\n  -F \"lang=pt\" \\\n  -F \"depth=deep\" \\\n  -F \"venue_profile_id=neurips-2026-main\"\n\ncurl -H \"X-Jiddu-Key: SUA_CHAVE\" \\\n  https://jiddu.app/api/v1/adversarial-reviews/JOB_ID\n```",
        "Um job concluído retorna a revisão estruturada, auditoria pública da metodologia e metadados de verificação das fontes, além de links para viewer, Markdown determinístico e impressão/PDF. Campos opcionais: `lang`, `depth`, `venue_profile_id`, `venue`, `venue_year`, `venue_track`, `paper_type` e `review_date`. PDFs têm limite de 25 MB e 300 mil caracteres extraídos.",
      ],
    },
    {
      title: "Autenticação da REST API",
      paragraphs: [
        "A REST API é separada do OAuth do MCP. Envie a chave no cabeçalho `X-Jiddu-Key`. Cada chave é atribuída a uma conta WorkOS verificada e segue o financiamento dessa conta: acesso incluído da plataforma ou créditos Jiddu. Chaves sem proprietário ficam desativadas. Veja “Obter uma chave da REST API” abaixo.",
        "```\ncurl -X POST https://jiddu.app/api/v1/detect-fallacies \\\n  -H \"content-type: application/json\" \\\n  -H \"X-Jiddu-Key: SUA_CHAVE\" \\\n  -d '{\"text\": \"Todo mundo concorda que isso é o melhor, então quem critica é tolo.\"}'\n```",
      ],
    },
    {
      title: "Servidor MCP",
      paragraphs: [
        "Para agentes, conecte-se diretamente a `https://jiddu.app/api/mcp`. O servidor expõe as cinco ferramentas de texto mais `start_adversarial_review` e `get_adversarial_review`. Clientes MCP compatíveis descobrem o WorkOS AuthKit, abrem o login do Jiddu e recebem automaticamente um token OAuth restrito ao recurso. Contas na allowlist da plataforma recebem acesso incluído; cada chamada das demais contas reserva e gasta créditos Jiddu.",
        "Clientes que ainda exigem uma ponte stdio local podem usar `mcp-remote` sem cabeçalho de autenticação personalizado; ele conduz o redirecionamento OAuth:\n```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\"]\n    }\n  }\n}\n```",
        "As orientações de configuração para agentes, os contratos de resposta e os exemplos de encadeamento estão incluídos nesta página.",
      ],
    },
    {
      title: "Limites & confiabilidade",
      paragraphs: [
        "As ferramentas de texto aceitam até 2000 caracteres por requisição. Jobs de revisão recebem um PDF público ou enviado de até 25 MB e recusam papers acima de 300 mil caracteres extraídos em vez de truncá-los. Os limites da REST são por chave de API; os do MCP hospedado são por usuário WorkOS. Ao excedê-los, a resposta é HTTP 429 com `retry_after_seconds`. As saídas são automatizadas e podem errar — trate-as como sinais para verificação, não como autoridade final.",
        "A qualidade é medida contra conjuntos de teste internos fixos e os resumos de benchmark publicados neste site.",
      ],
    },
    {
      title: "Obter uma chave da REST API",
      paragraphs: [
        "As chaves são emitidas manualmente por enquanto e atribuídas à sua conta WorkOS verificada. Entre em contato com o operador pelo canal indicado na página de Termos para solicitar uma. O segredo é mostrado uma vez e guardado apenas como hash sha256.",
      ],
    },
  ],
  export_pdf: "Exportar PDF",

  print_type_fallacy: "Análise de falácia",
  print_type_factcheck: "Checagem de fatos",
  print_type_neutrality: "Avaliação de imparcialidade",
  print_meta_source: "Fonte",
  print_meta_type: "Tipo",
  print_meta_text_type: "Tipo de texto",
  print_meta_generated: "Gerado em",
  print_meta_reviewed: "Revisado por humano",
  print_meta_model: "Modelo",
  print_meta_url: "URL do relatório",
  print_section_source_text: "Texto de origem",
  print_section_findings: "Achados",
  print_section_claims: "Afirmações",
  print_section_score: "Nota",
  print_no_claims: "Nenhuma afirmação verificável extraída.",
  print_no_findings: "Nenhum padrão sinalizado.",
  print_footer_fallacy:
    "Este é um relatório automatizado. Os rótulos podem estar errados — sempre leia o texto original e julgue por conta própria. Termos completos em https://jiddu.app/legal.",
  print_footer_factcheck:
    "Este é um relatório automatizado. Os vereditos podem estar errados — sempre leia as fontes citadas e julgue por conta própria. Termos completos em https://jiddu.app/legal.",
  print_footer_neutrality:
    "Este é um relatório automatizado. Imparcialidade é uma propriedade do enquadramento; os rótulos podem estar errados — leia o texto original e os trechos sinalizados. O Jiddu não classifica direção partidária. Termos completos em https://jiddu.app/legal.",
  print_type_explain: "Explicação de paper",
  print_meta_level: "Nível",
  print_section_explanations: "Explicações",
  print_no_explanations: "Nenhuma explicação foi gerada.",
  print_footer_explain:
    "Esta é uma explicação automatizada. Ela pode interpretar mal ou simplificar demais o paper — sempre leia o texto original e os trabalhos citados. Termos completos em https://jiddu.app/legal.",
  print_type_slop: "Detecção de slop",
  print_footer_slop:
    "Este é um relatório automatizado. Ele sinaliza padrões de escrita, nunca autoria — humanos também escrevem slop, e os rótulos podem estar errados. Leia os trechos citados e julgue por conta própria. Termos completos em https://jiddu.app/legal.",
  print_generated_at: (when) => `Gerado em ${when} · jiddu.app`,

  legal_title: "Termos, privacidade e isenções",
  legal_subtitle:
    "Leia antes de usar o Jiddu, especialmente antes de compartilhar uma análise publicamente.",
  legal_last_updated: "Atualizado em: 2026-07-28",
  legal_sections: [
    {
      title: "1. O que o Jiddu faz",
      paragraphs: [
        "O Jiddu oferece seis fluxos automatizados de leitura crítica: detecção de falácias, checagem de fatos, avaliação de imparcialidade, explicação de papers, detecção de padrões de escrita e revisão adversarial de papers. O app web, a API pública e o MCP usam os mesmos pipelines; a revisão de paper roda como job assíncrono porque possui várias etapas.",
        "O Jiddu não tem uma equipe editorial humana. Todo resultado é produzido por software. Uma marca de revisão significa que o operador fez uma conferência pontual, mas o relatório continua automatizado. Use-o como apoio à leitura crítica, não como substituto.",
      ],
    },
    {
      title: "2. Resultados automatizados podem errar",
      paragraphs: [
        'Os vereditos ("sustentado", "contradito", "misto", "não verificado") e os rótulos de falácia são juízos automatizados de melhor esforço. Podem estar errados — às vezes com alta confiança.',
        "O Jiddu não afirma que qualquer declaração, pessoa ou documento seja verdadeiro, falso, mentiroso ou enganoso. Os rótulos são sinais para acionar a sua própria verificação. Sempre leia as fontes citadas e tire sua própria conclusão.",
        "As pontuações de imparcialidade, os Mapas do Paper e as explicações parágrafo a parágrafo também são interpretações automatizadas, não afirmações de fato — o explicador descreve o que um texto diz e como ele se estrutura, nunca se suas afirmações estão corretas. O nível de audiência muda apenas a prosa; classificações, itens do mapa e tags de papel são aproximações algorítmicas.",
        "Os achados da revisão de paper, comparações de novidade, severidades, aderência à venue e recomendação final também são juízos automatizados. Não são uma revisão oficial por pares, previsão de aceitação ou substituto para um revisor humano qualificado.",
      ],
    },
    {
      title: "3. Uso por sua conta e risco",
      paragraphs: [
        "Você é responsável por como usa a análise e pelo que compartilha ou publica. Se você republicar um resultado do Jiddu, você adota aquele conteúdo como seu — os autores do Jiddu não são responsáveis por usos posteriores.",
        "Não envie dados confidenciais, proprietários, sob embargo ou pessoais. O conteúdo enviado — inclusive imagens renderizadas de páginas selecionadas do PDF quando a inspeção visual é necessária — passa pelo OpenRouter para o provedor upstream do modelo escolhido e é armazenado sob um id compartilhável.",
        "Use a revisão de paper apenas em manuscritos seus ou que você esteja autorizado a processar. Não envie um manuscrito recebido sob revisão por pares confidencial, a menos que os autores e a venue permitam explicitamente o processamento por modelos de terceiros.",
      ],
    },
    {
      title: "4. Pessoas e figuras públicas",
      paragraphs: [
        "Análises sobre pessoas nomeadas (políticos, jornalistas, executivos) são produzidas por software que pesquisa fontes públicas na web. A linguagem que o Jiddu usa é intencionalmente cuidadosa (\"a evidência não sustenta\", \"não encontramos\") — não adote uma formulação mais forte do que a ferramenta emite.",
        "Se você acha que um veredito é injusto ou sem suporte, use o botão \"reportar veredito errado\" na afirmação correspondente. O operador revisa os relatos enviados; relatos abusivos ou repetitivos podem ser descartados.",
      ],
    },
    {
      title: "5. Privacidade",
      paragraphs: [
        "Cada análise ou revisão de paper concluída recebe uma URL compartilhável não listada e fica armazenada em um servidor no Brasil. Quem tem a URL pode ver o resultado final, mas essas páginas não são enumeradas no sitemap público. Usuários logados veem as análises associadas à conta, porém a URL compartilhável continua acessível a quem a possuir; as etapas intermediárias privadas da revisão não aparecem no viewer público.",
        "A autenticação é fornecida pelo WorkOS AuthKit. O Jiddu recebe a identidade necessária para manter a sessão, autorizar clientes MCP e associar chaves REST, saldos e uso à conta correta. Segredos REST são mostrados uma vez e armazenados apenas como hash. As credenciais dos provedores de modelo são administradas pelo Jiddu e nunca são expostas ao JavaScript da página, clientes REST ou clientes MCP.",
        "O autocomplete de venue envia apenas a consulta da venue — nunca o manuscrito — à busca pública de venues do [DBLP](https://dblp.org). A etapa de pesquisa de literatura consulta fontes acadêmicas públicas usando afirmações técnicas do manuscrito; os prompts proíbem buscas pelo título do paper, nome dos autores ou outros manuscritos dos mesmos autores.",
        "Registramos o IP da requisição para limites de taxa e detecção de abuso. Não vendemos nem compartilhamos essa informação.",
        "O tráfego das páginas é medido via Google Analytics (gtag.js).",
      ],
    },
    {
      title: "6. Metodologia",
      paragraphs: [
        "O pipeline de extração e verificação de afirmações é inspirado em [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025) para a etapa de extração, e no framework de avaliação descrito em [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) para a avaliação de veredito, os tiers de qualidade de fonte e a dimensão de imparcialidade. Nossa escolha de 4 classes de veredito (sustentado / contradito / misto / não verificado) em vez dos esquemas de 5 ou 6 classes usados por alguns outlets de fact-check é baseada em [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909), que mostraram empiricamente que rotulagem 3-classes supera 5-classes para fact-check com LLMs — as categorias adicionais no meio criam ambiguidade sem ganho de acurácia.",
        "A revisão adversarial adapta as dimensões SPECS e o padrão de síntese e autocrítica por etapas descrito em [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). O Jiddu é uma implementação independente, com ledger paginado de afirmações e evidências, pesquisa de literatura, verificações aritméticas, calibração por venue, validação de fontes e gate de retenção de achados próprios; não reproduz o sistema da AAAI-26.",
        "A taxonomia inicial do detector de slop vem da skill de edição [no-ai-slop](https://github.com/petergyang/no-ai-slop), de Peter Yang, licenciada sob MIT. O Jiddu fornece a redação do catálogo, as traduções e o prompt de detecção e sinaliza padrões observáveis, não autoria.",
        "O Jiddu não tem afiliação com esses grupos de pesquisa, com o DBLP ou com qualquer venue cujos critérios resume. As referências e páginas oficiais são citadas para que o usuário possa auditar a metodologia e o padrão aplicado.",
        "O pipeline de fact-check foi medido contra o corpus humano do [PolitiFact](https://www.politifact.com) (via o [dataset LIAR2](https://github.com/chengxuphd/liar2), Apache-2.0). Em 200 afirmações tiradas dos quatro buckets polares do PolitiFact, o veredito do Jiddu coincidiu com o veredito humano em 67,5% dos casos no total e em 81,3% nas categorias menos ambíguas (true / false / pants-on-fire), com discordância estrita em apenas 4,5%. Metodologia completa, matriz de confusão e análise das discordâncias em [docs/benchmark-politifact.md](/benchmark).",
        "A revisão de papers tem um benchmark sintético SPECS separado, com 30 casos. GPT-5.4 mini, GPT-5.5, GPT-5.6 Luna e GPT-5.6 Luna Pro detectaram os 30 defeitos inseridos. Luna Pro produziu 8% menos achados que Luna padrão, mas o conjunto atingiu o teto e não estabelece acurácia em papers reais completos.",
      ],
    },
    {
      title: "7. Contato",
      paragraphs: [
        "Operador: Rafael de Menezes Ehlers. Para solicitações de remoção, correções ou outras dúvidas, use o formulário de contato em [rafaelmehlers.com.br](https://rafaelmehlers.com.br).",
      ],
    },
  ],

  how_it_works_title: "Como o Jiddu funciona",
  how_it_works_subtitle:
    "Uma visão clara de cada análise, dos modelos usados e de como o Jiddu trata qualidade, privacidade, créditos e limitações.",
  how_it_works_sections: [
    {
      title: "1. Visão geral",
      paragraphs: [
        "O Jiddu oferece seis formas independentes de examinar um texto ou paper: detecção de falácias, checagem de fatos, avaliação de imparcialidade, explicação parágrafo a parágrafo, detecção de padrões de slop e revisão adversarial. O modo Live acrescenta transcrição em tempo real com lentes selecionáveis de falácias, afirmações para fact-check e neutralidade.",
        "As análises retornam achados estruturados e ligados à fonte conforme ficam disponíveis. O resultado segue o idioma selecionado na interface, e cada função pode ser usada de forma independente.",
      ],
    },
    {
      title: "2. Entrada: ingestão e segmentação",
      paragraphs: [
        "**URL.** O Jiddu busca páginas públicas com segurança, bloqueia destinos de rede privados ou reservados e usa o [Mozilla Readability](https://github.com/mozilla/readability) para isolar o corpo do artigo.",
        "**PDF.** Processado localmente com [LiteParse](https://github.com/run-llama/liteparse), com um parser secundário disponível quando necessário. A revisão acadêmica preserva referências de página e pode inspecionar páginas renderizadas selecionadas quando a evidência visual importa.",
        "**Imagem.** Screenshots PNG, JPEG e WebP de até 10 MB podem ser colados, arrastados ou selecionados. O modelo visual escolhido transcreve o texto visível antes da análise selecionada. O Jiddu não retém o arquivo da imagem.",
        "**Paste.** Usado como está, apenas com whitespace normalizado.",
        "**Segmentação.** Entradas longas são divididas em limites conscientes de sentenças para caber no contexto dos modelos sem cortar abreviações, siglas ou números comuns.",
      ],
    },
    {
      title: "3. Modelos e fallback",
      paragraphs: [
        "Duas famílias de modelos aparecem no seletor: [🇺🇸 GPT-5.6 Luna](https://openrouter.ai/openai/gpt-5.6-luna) (padrão) e [🇨🇳 MiniMax M3](https://openrouter.ai/minimax/minimax-m3). Ter ambas permite comparar interpretações limítrofes e evita que toda análise dependa de um único provedor.",
        "O Jiddu pode recorrer à outra família de modelos quando o provedor selecionado está indisponível. O trabalho já retornado é preservado, portanto um resultado visivelmente parcial deve ser tratado como parcial.",
        "Sonar Reasoning Pro é usado exclusivamente pros vereditos de fact-check (porque tem busca web embutida). Nunca aparece no seletor de modelo.",
      ],
    },
    {
      title: "4. Detector de falácias",
      paragraphs: [
        "Catálogo de 46 falácias cobrindo relevância, ambiguidade, presunção, apelos emocionais, raciocínio causal e evidência. Cada falácia tem id estável e uma cor distinta (distribuição por golden angle) usada pra destacar passagens. Lista completa em [/fallacies](/fallacies).",
        "A análise é deliberadamente conservadora: um achado precisa citar a passagem relevante, identificar o padrão e explicar a falha de raciocínio em contexto. Uma formulação ambígua não deve ser marcada sem que o contexto a resolva.",
        "Cada achado recebe severidade e contribui para uma nota de 0 a 100. A nota é um auxílio de navegação, não a probabilidade de um documento ser falacioso.",
        "**Modelos e por quê.** GPT-5.6 Luna ou MiniMax M3 compara o texto com um catálogo fechado. Essa tarefa delimitada não exige busca web, e as duas famílias permitem comparar interpretações limítrofes.",
        "O Jiddu testa detecções representativas e armadilhas de falso positivo, mas ainda não publicou benchmark com rótulos humanos para esta função. Toda passagem destacada continua exigindo julgamento humano.",
      ],
    },
    {
      title: "5. Detector de slop",
      paragraphs: [
        "O detector de slop usa um catálogo próprio e retorna passagens destacadas, explicações curtas e uma nota de densidade de 0 a 100.",
        "O catálogo cobre 18 padrões de escrita de slop de IA em cinco famílias: vocabulário de estoque, drama fabricado, estrutura de fôrma, substância oca e cacoetes de formato. A lista completa com definições e exemplos está em [/slop-patterns](/slop-patterns). A seleção de padrões é baseada na skill de edição [no-ai-slop](https://github.com/petergyang/no-ai-slop) de Peter Yang (licença MIT); a redação do catálogo, o conteúdo trilíngue e o prompt de detecção são do próprio Jiddu.",
        "Ele detecta **padrões, não autoria**: humanos também podem escrever prosa formulaica. Cada achado cita o trecho, nomeia o padrão e indica o que uma redação mais clara faria sem reescrever a fonte.",
        "**Modelos e por quê.** GPT-5.6 Luna ou MiniMax M3 atua como crítico de estilo restrito ao catálogo. Não há classificador de watermark nem de autoria.",
        "O conjunto de evals cobre positivos representativos, prosa limpa e a salvaguarda contra inferir autoria. A função responde “quais padrões prontos aparecem?”, não “quem ou o que escreveu isto?”.",
      ],
    },
    {
      title: "6. Checagem de fatos — extração de afirmações",
      paragraphs: [
        "Modelado a partir do [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). O prompt pede ao modelo pra passar cada sentença por quatro estágios: **selection** (manter só sentenças com afirmação verificável — opinião, juízo de valor e pergunta retórica saem), **disambiguation** (descartar sentenças com múltiplas leituras plausíveis quando o contexto não resolve), **decomposition** (quebrar sentenças com múltiplos fatos em afirmações separadas, sem perseguir atomicidade infinita) e **decontextualization** (cada afirmação emitida deve ficar de pé sozinha — resolver pronomes, adicionar o ano de um número que depende dele, atribuir uma citação à fonte).",
        "Cada afirmação tem um tipo: `numeric`, `date`, `quote`, `causal`, ou `categorical`. O tipo informa como o verificador procura evidência depois.",
        "O GPT-5.6 Luna ou MiniMax M3 escolhido faz apenas a extração; a avaliação de verdade fica reservada à etapa separada de verificação. Salvaguardas de uso limitam quanto trabalho um documento pode gerar.",
        "Cada afirmação mantém a sentença-fonte e uma formulação autônoma para que o leitor audite o que será checado. A extração ainda pode deixar afirmações elegíveis de fora.",
      ],
    },
    {
      title: "7. Checagem de fatos — veredito por afirmação",
      paragraphs: [
        "A verificação é opcional. Quando o usuário escolhe **Verificar afirmações**, cada uma é pesquisada de forma independente pelo [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro).",
        "O resultado é `sustentado`, `contradito`, `misto` ou `não verificado`, acompanhado de confiança, justificativa e fontes citadas. Evidências de baixa confiança são tratadas de forma conservadora, sem forçar um veredito polar.",
        "Toda fonte citada é classificada em um de seis tiers (segundo Goldfarb et al. 2025): `primary` (órgãos oficiais de dados, decisões judiciais, papers peer-reviewed), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. Uma flag boolean separada marca veículos `state-controlled` (RT, CGTN, Xinhua etc. — mas não BBC/NPR/Deutsche Welle, que são state-FUNDED mas editorialmente independentes).",
        "A linguagem é deliberadamente cuidadosa com pessoas nomeadas e descreve o que a evidência disponível sustenta, em vez de acusar alguém de desonestidade.",
        "**Modelo e por quê.** Sonar Reasoning Pro é usado porque a verificação exige busca web atual e fontes citadas. Os tiers descrevem o tipo de fonte, não uma nota automática de verdade.",
        "Qual a accuracy disso na prática? A gente rodou um [benchmark contra o corpus humano do PolitiFact](/benchmark). Em 200 afirmações puxadas das quatro categorias polares do PolitiFact (true / mostly-true / false / pants-on-fire, de 2020 pra cá), o veredito do Jiddu coincidiu com o veredito humano polar em 67.5% dos casos no total e 81.3% nas categorias menos ambíguas (true / false / pants-on-fire). Discordância estrita — Jiddu dizer o oposto polar do humano — aconteceu em só 4.5% dos casos (9 de 200). Os ~28% restantes foram Jiddu devolvendo `mixed` ou `unverified` no lugar de um veredito polar, concentrados no bucket `mostly_true` do PolitiFact (58% viraram `mixed` — sobreposição estrutural, não erro, já que ambos os rótulos descrevem verdade parcial). Metodologia, matriz de confusão e análise das discordâncias no link.",
      ],
    },
    {
      title: "8. Checagem de fatos — cache de vereditos",
      paragraphs: [
        "Vereditos recentes podem ser reutilizados para afirmações equivalentes, reduzindo latência e buscas desnecessárias. O prazo varia conforme o tipo de afirmação, para que fatos mutáveis expirem antes de fatos históricos estáveis.",
        "O usuário pode solicitar uma checagem nova pelo card da afirmação. Salvaguardas de atualização e uso evitam custo ilimitado com buscas repetidas.",
      ],
    },
    {
      title: "9. Imparcialidade",
      paragraphs: [
        "Diferente da detecção de falácia: um texto pode ser livre de falácia e factualmente correto e ainda assim usar enquadramento carregado, atribuição assimétrica ou seleção unilateral de fontes. A análise de imparcialidade sinaliza esses padrões.",
        "Oito tipos de issue são sinalizados no nível da sentença: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. O modelo também classifica o documento num de sete tipos de texto (informativo / opinião / discurso político / advocacy / análise / marketing / redes sociais) — isso informa quão estrito o audit é.",
        "O veredito a nível de documento é um de `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. O Jiddu **deliberadamente não classifica direção partidária** (esquerda/direita, pró-X/anti-Y). O paper da Forum AI que inspirou a metodologia exige um painel bipartisan de especialistas pra essa etapa; sem ele, rótulos partidários são pouco confiáveis e perigosos. Sinalizamos padrões específicos que o leitor pode auditar, em vez disso.",
        "**Modelos e por quê.** GPT-5.6 Luna ou MiniMax M3 classifica enquadramento e issues por sentença sem navegar na web nem decidir se as afirmações subjacentes são verdadeiras.",
        "Ainda não há benchmark publicado com painel humano para imparcialidade. O veredito é um auxílio de navegação para passagens auditáveis, não uma medida objetiva de equilíbrio político.",
      ],
    },
    {
      title: "10. Privacidade e status de revisão",
      paragraphs: [
        "O WorkOS AuthKit fornece contas e sessões. Resultados concluídos continuam disponíveis por URLs não listadas, e usuários logados também veem suas análises associadas na área da conta. Qualquer pessoa com a URL compartilhável ainda consegue ver o resultado final. Ledgers, pesquisa e juízos preliminares da revisão de papers são artefatos intermediários internos e não aparecem no resultado público.",
        "Créditos Jiddu são um saldo para análises web, REST vinculadas à conta e MCP hospedadas que usam as credenciais de provedores administradas pelo Jiddu. Contas verificadas na allowlist administrada pelo operador recebem acesso incluído.",
        "O conteúdo submetido passa pelo OpenRouter para o upstream do modelo escolhido. Screenshots colados são enviados para transcrição, mas o Jiddu não retém o arquivo da imagem; o texto extraído é armazenado com a análise. Na revisão de paper, o conteúdo enviado inclui imagens renderizadas de páginas selecionadas, não só o texto extraído. A etapa de literatura pesquisa fontes acadêmicas públicas por afirmações técnicas, enquanto os prompts proíbem consultas pelo título, nome dos autores ou outros manuscritos dos mesmos autores. O autocomplete envia apenas a consulta da venue ao DBLP. Registramos o IP para rate-limit e sinais de abuso e não o vendemos.",
        "Os resultados são automatizados e não revisados por padrão. Um resultado explicitamente marcado como revisado foi conferido pontualmente pelo operador; esse status representa uma verificação humana adicional, não uma garantia de que todos os achados estejam corretos.",
      ],
    },
    {
      title: "11. Créditos, cobrança e controles de abuso",
      paragraphs: [
        "Os Créditos Jiddu pagam análises no app web, em chaves REST vinculadas à conta e no MCP hospedado. Antes da maioria dos trabalhos, o Jiddu reserva temporariamente a estimativa abaixo para impedir que jobs simultâneos gastem o mesmo saldo. No Live, apenas verifica o saldo mínimo exigido, sem bloquear nem cobrar esse valor. O uso medido é liquidado pelo trabalho realmente concluído, e toda reserva não utilizada retorna à conta. Algumas contas verificadas possuem acesso incluído à plataforma e não consomem o saldo pessoal.",
        "A reserva é uma estimativa, não necessariamente o débito final. Documentos longos podem gerar vários chunks, a verificação de fact-check é cobrada por afirmação elegível e a análise Live por lente selecionada e janela concluída. A transcrição Live é cobrada pela duração real do áudio, usando a tarifa por minuto configurada da OpenAI. Retentativas do provedor, tokens de raciocínio ou uma resposta excepcionalmente cara podem deixar o saldo negativo; novas análises ficam bloqueadas até a adição de créditos.",
        "Pacotes pagos são vendidos como compras únicas pelo Stripe Checkout. Os créditos só são concedidos depois que o Jiddu confirma com o Stripe que o pagamento foi concluído; o ledger e o histórico de transações continuam sendo a fonte de verdade para compras e consumo.",
        "Salvaguardas por conta e por requisição limitam uso abusivo ou acidentalmente ilimitado. Os limites variam por função e podem evoluir conforme a capacidade dos modelos e os preços dos provedores.",
      ],
      creditTable: {
        intro:
          "A tabela mostra a reserva inicial máxima com o roteamento padrão atual. Ela permite verificar se há créditos suficientes antes de começar; o débito final das chamadas medidas considera o trabalho realmente concluído.",
        headers: {
          feature: "Funcionalidade",
          unit: "Unidade de cobrança",
          estimate: "Estimativa de créditos necessária",
        },
        rows: [
          {
            feature: "Detector de falácias",
            unit: "Por chunk de texto concluído",
            estimate: "Reserva de até 2 créditos",
          },
          {
            feature: "Fact-check — extração",
            unit: "Por chunk de texto concluído",
            estimate: "Reserva de até 2 créditos",
          },
          {
            feature: "Fact-check — verificação",
            unit: "Por busca de afirmação elegível",
            estimate:
              "Até 2 créditos por afirmação sem cache; resultados em cache não consomem créditos",
          },
          {
            feature: "Neutralidade",
            unit: "Por chunk de texto concluído",
            estimate: "Reserva de até 2 créditos",
          },
          {
            feature: "Explicador de papers",
            unit: "Por chunk de texto concluído",
            estimate: "Reserva de até 2 créditos",
          },
          {
            feature: "Detector de slop",
            unit: "Por chunk de texto concluído",
            estimate: "Reserva de até 2 créditos",
          },
          {
            feature: "Revisão adversarial — Standard",
            unit: "Por revisão",
            estimate: "Reserva de até 21 créditos",
          },
          {
            feature: "Revisão adversarial — Deep",
            unit: "Por revisão",
            estimate: "Reserva de até 94 créditos",
          },
          {
            feature: "Transcrição Live",
            unit: "Por duração do áudio",
            estimate:
              "{liveCredits} créditos disponíveis para iniciar; débito final pela duração real",
          },
          {
            feature: "Análise Live",
            unit: "Por janela de análise concluída",
            estimate: "Reserva de até 3 créditos com as três lentes",
          },
        ],
        note:
          "Tabela {rateVersion}. Reservas não utilizadas são liberadas. As estimativas podem mudar com o roteamento e os preços dos provedores; o consumo concluído permanece visível no ledger de créditos da conta.",
      },
    },
    {
      title: "12. Loop de feedback",
      paragraphs: [
        "Todo card de afirmação inclui **🚩 Reportar veredito errado**. O relato registra o veredito visto pelo usuário e uma explicação opcional para revisão privada.",
        "Os relatos não alteram automaticamente um veredito nem superam as fontes citadas. Eles informam a revisão manual e melhorias futuras de qualidade.",
      ],
    },
    {
      title: "13. Modo Live (beta)",
      paragraphs: [
        "Em [/live](/live), o Jiddu transcreve um microfone ou, em navegadores Chromium, uma aba com `gpt-live-transcribe`. O áudio segue diretamente do navegador para a OpenAI por uma conexão Realtime criptografada; o Jiddu recebe a transcrição necessária para a análise, não o áudio bruto.",
        "GPT-5.6 Luna ou MiniMax M3 analisa periodicamente a transcrição crescente pelas lentes Live selecionadas: falácias lógicas, extração de afirmações verificáveis e neutralidade. O usuário escolhe um intervalo de 10, 20, 30 ou 60 segundos; intervalos maiores dão mais contexto a cada análise. Os resultados aparecem em um feed Todos e em painéis dedicados, com um badge identificando cada tipo.",
        "Depois da finalização, cada lente selecionada recebe um viewer completo compartilhável. As afirmações detectadas também podem ser verificadas contra fontes da web diretamente no Live, com vereditos e fontes, ou no viewer completo de fact-check.",
        "As sessões são limitadas a 60 minutos, usam Créditos Jiddu ou acesso incluído e armazenam apenas a transcrição e os resultados selecionados. Áudio de aba funciona em Chrome e Edge; microfone funciona em outros navegadores compatíveis.",
      ],
    },
    {
      title: "14. Explain — explicador de artigos",
      paragraphs: [
        "Explain recebe um artigo acadêmico ou documento técnico e produz um Mapa do Paper junto da explicação parágrafo a parágrafo em linguagem simples. O mapa identifica tipo de paper, tipo de contribuição, pergunta central, contribuição, abordagem, resposta principal, evidências e qualquer limitação declarada pelos autores. Cada item aponta para os parágrafos que o sustentam. Cada parágrafo também recebe uma tag de papel (Contexto / Objetivo / Método / Resultado / Interpretação / Limitação / Conclusão) e uma explicação no nível escolhido.",
        "Níveis de audiência: **Criança** (ELI5, analogias do cotidiano, sem jargão), **Ensino médio** (linguagem clara, poucos termos técnicos explicados), **Graduação** (registro acadêmico padrão, pressupõe familiaridade com a área), **Expert** (conciso, nível de pares, terminologia completa mantida). O nível controla apenas a complexidade do texto — não filtra nem valida o conteúdo.",
        "As tags de papel e o Mapa do Paper são algorítmicos. Os parágrafos são explicados em chunks; depois, uma síntese final limitada amostra todos os papéis semânticos e usa o resumo de cada chunk para montar o mapa global. Artigos interdisciplinares ou documentos com estrutura não padrão podem receber tags ou itens de mapa incorretos.",
        "Ao contrário dos pipelines de texto geral, o Explain é otimizado para artigos acadêmicos estruturados. Resultados em posts de blog, petições jurídicas ou textos não estruturados serão de menor qualidade.",
        "**Modelos e por quê.** GPT-5.6 Luna ou MiniMax M3 transforma o texto fornecido em vez de pesquisar literatura ou validá-lo de forma independente. Explain não faz busca web nem checagem de citações.",
        "Os evals atuais verificam cobertura de papéis, calibração da audiência e confiabilidade do schema, não fidelidade factual contra anotações de especialistas. O Explain pode simplificar demais uma ressalva ou interpretar um método com confiança indevida; deve facilitar a entrada no texto-fonte, nunca substituí-lo.",
      ],
    },
    {
      title: "15. Revisão adversarial de paper",
      paragraphs: [
        "A revisão adversarial aceita um PDF final, venue-alvo, edição, track, tipo de paper e data opcional. O resultado inclui recomendação, resumo, pontos fortes, fraquezas localizadas, perguntas, checklist de reprodutibilidade, referências e o padrão da venue aplicado.",
        "Metodologicamente, o Jiddu adapta as dimensões de revisão **SPECS** — Story, Presentation, Evaluations, Correctness e Significance — e o padrão de síntese e autocrítica em estágios descrito em [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). O Jiddu é uma implementação independente, com ledger próprio de claims e evidências, calibração por venue, parser, contrato de saída e salvaguardas; ele não reproduz o sistema da AAAI-26.",
        "A revisão examina **Story, Presentation, Evaluations, Correctness e Significance**, consulta literatura publicada e desafia a própria síntese antes de devolver os achados retidos. Ela não executa código do manuscrito.",
        "**Modelos e por quê.** O modo Padrão usa GPT-5.6 Luna ou MiniMax M3 com outra família de modelos na crítica de qualidade. O modo Profundo acrescenta raciocínio GPT-5.6 Luna Pro e auditoria independente por Claude Opus 4.8; leva mais tempo e custa mais.",
        "No benchmark sintético SPECS de 30 casos, GPT-5.4 mini, GPT-5.5, GPT-5.6 Luna e GPT-5.6 Luna Pro detectaram todas as falhas inseridas. Luna Pro produziu 8% menos achados que Luna padrão, mas o benchmark atingiu o teto e não prova superioridade em papers completos.",
        "A descoberta de venues usa [DBLP](https://dblp.org) e perfis verificados de conferências selecionadas. Perfis verificados aplicam critérios oficiais citados; venues sem perfil usam uma rubrica acadêmica geral claramente identificada.",
        "Toda fraqueza substantiva precisa trazer página ou seção do manuscrito e severidade `MAJOR`, `MODERATE` ou `MINOR`. A revisão continua automatizada: pode perder problemas, inventar comparações ou aplicar mal um critério, e não é revisão oficial por pares nem previsão de aceitação.",
      ],
    },
    {
      title: "16. API pública & MCP (para agentes)",
      paragraphs: [
        "As análises de texto estão disponíveis por uma API REST pública, enquanto a revisão adversarial roda como job assíncrono adequado a fluxos mais longos de agentes. As solicitações ficam ligadas a uma conta Jiddu verificada e usam acesso incluído ou Créditos Jiddu.",
        "O servidor MCP hospedado expõe as ferramentas de texto e a revisão adversarial. Clientes compatíveis usam o [WorkOS AuthKit MCP](https://workos.com/docs/authkit/mcp) para login OAuth e acesso restrito ao recurso.",
        "Endpoints, payloads, autenticação e snippets de configuração estão documentados em [/api-access](/api-access).",
      ],
    },
    {
      title: "17. Metodologia e avaliação",
      paragraphs: [
        "O [Claimify](https://arxiv.org/abs/2502.10855) orienta a extração de afirmações, e [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) orienta a avaliação dos vereditos, os tiers de fontes e a imparcialidade. O [no-ai-slop](https://github.com/petergyang/no-ai-slop) fornece a taxonomia inicial da detecção de padrões de escrita.",
        "A revisão adversarial de papers adapta as dimensões SPECS e a síntese e autocrítica por etapas descritas em [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). O Jiddu adiciona ledger, extração por LiteParse, descoberta via DBLP, perfis de venue, validação de fontes e gate de retenção próprios. Não tem afiliação com esses grupos, com o DBLP nem com as venues.",
        "A avaliação publicada hoje inclui o [benchmark PolitiFact com 200 afirmações](/benchmark) e um benchmark sintético SPECS com 30 casos. Ambos documentam suas limitações e nenhum garante correção em um novo texto ou paper.",
        "O disclaimer completo do que o Jiddu afirma e não afirma está em [/legal](/legal).",
      ],
    },
  ],

  not_found_label: "Erro 404",
  not_found_title: "Este caminho não leva a lugar nenhum.",
  not_found_subtitle:
    "A verdade é uma terra sem caminhos — mas isso aqui é só um link quebrado. A página que você procurava não está aqui.",
  not_found_cta: "Voltar ao chão firme",

  analysis_failed: "Falha na análise",
  try_again: "Tentar novamente",
  ingest_blocked_title: "O site bloqueou nossa solicitação",
  ingest_blocked_hint:
    "Vários veículos de notícia bloqueiam leitores automatizados ou exigem assinatura. Abra o artigo no seu navegador, copie o conteúdo e cole aqui.",
  ingest_not_found_title: "Página não encontrada",
  ingest_not_found_hint:
    "A URL retornou 404. Verifique o link, ou cole o texto diretamente.",
  ingest_rate_limited_title: "O site pediu para diminuir o ritmo",
  ingest_rate_limited_hint:
    "Recebemos um aviso de limite de requisições (429). Espere um minuto e tente de novo, ou cole o texto diretamente.",
  ingest_timeout_title: "O site demorou demais para responder",
  ingest_timeout_hint:
    "Desistimos depois de 15 segundos. Tente de novo, ou cole o texto diretamente.",
  ingest_unreachable_title: "Não conseguimos acessar a URL",
  ingest_unreachable_hint:
    "Erro de DNS ou de rede. Confira o endereço, ou cole o texto diretamente.",
  ingest_extraction_failed_title: "Não conseguimos extrair o artigo",
  ingest_extraction_failed_hint:
    "A página carregou mas não encontramos um corpo de texto legível. Cole o texto diretamente.",
  ingest_invalid_url_title: "URL inválida",
  ingest_too_short_title: "Texto curto demais",
  switch_to_paste: "Colar texto",

  a11y_show_fallacy: "Ver comentário da falácia",
  a11y_show_claim: "Ver verificação da alegação",
  a11y_show_signal: "Ver detalhe do sinal de viés",
  a11y_show_explanation: "Ver explicação do parágrafo",

  new_analysis: "Nova análise",
  share: "Compartilhar",
  copied: "Copiado",
  no_fallacies: "Nenhuma falácia detectada.",
  pending: "pendente",
  finding_count: (count, total) =>
    `${count} ${count === 1 ? "ocorrência" : "ocorrências"} em ${total} sentenças`,
  read_more: "Saber mais",

  score_label: "Nota",
  score_clean: "raciocínio limpo",
  score_minor: "questões menores",
  score_several: "várias falácias",
  score_high: "altamente falacioso",
  score_propagandistic: "propagandístico",

  severity_low: "baixa",
  severity_high: "alta",

  guide_title: "Guia de falácias",
  guide_subtitle:
    "Uma referência curta para as falácias lógicas e retóricas que o Jiddu detecta.",
  guide_example: "Exemplo",
  guide_back: "Voltar para o início",
  guide_credit_prefix: "Seleção de falácias informada por",
  guide_credit_suffix: "— todas as descrições e exemplos são do próprio Jiddu.",

  nav_fallacies: "Guia de Falácias",
  nav_slop_patterns: "Padrões de slop",
  nav_benchmark: "Benchmark",
  nav_pricing: "Preços",

  theme_to_dark: "Mudar para tema escuro",
  theme_to_light: "Mudar para tema claro",

  share_link_label: "Compartilhar esta análise",
  share_link_hint: "Clique para copiar o link",
  link_copied: "Link copiado",
  scroll_to_bottom: "Rolar até o final",
  scroll_to_top: "Voltar ao topo",

  close: "Fechar",
  open_in_guide: "Abrir no guia completo",
  category: "Categoria",
  mobile_hint_title: "Dica de leitura",
  mobile_hint_body:
    "Toque em qualquer trecho destacado para ler a explicação da falácia em um pop-up.",
  mobile_hint_dismiss: "Entendi",
  finding_from_text: "Do texto",
  finding_about_this_fallacy: "Sobre esta falácia",

  live_subtitle:
    "Escute em tempo real e acompanhe falácias, afirmações verificáveis e sinais de parcialidade conforme a pessoa fala.",
  live_source_mic: "Microfone",
  live_source_tab: "Aba do navegador",
  live_source_tab_chrome_only: "Só no Chrome",
  live_source_tab_tooltip: "Capturar áudio de uma aba do navegador",
  live_source_tab_unsupported: "Captura de aba requer Chrome ou Edge",
  live_language_follows_header: "O idioma segue o seletor no cabeçalho.",
  live_lenses_title: "Lentes ao vivo",
  live_lenses_hint: "Escolha o que o Jiddu deve acompanhar nesta sessão.",
  live_lens_fallacy: "Falácias",
  live_lens_factcheck: "Afirmações para checagem",
  live_lens_neutrality: "Neutralidade",
  live_all: "Todos",
  live_no_results_yet:
    "Nenhum resultado detectado ainda. Eles aparecerão aqui conforme a pessoa fala.",
  live_interval_title: "Intervalo das análises",
  live_interval_hint:
    "Quanto maior o intervalo, mais contexto o Jiddu terá para cada análise.",
  live_start: "Iniciar",
  live_stop: "Parar e finalizar",
  live_findings: "Falácias",
  live_running_score: "Nota parcial",
  live_privacy_note:
    "O áudio é transmitido direto do seu navegador para a API Realtime da OpenAI via WebRTC. O áudio bruto não é armazenado — apenas a transcrição e os resultados das análises selecionadas ficam salvos e disponíveis em URLs compartilháveis quando você parar a sessão.",
  live_status_connecting: "Conectando…",
  live_status_live: "Ao vivo",
  live_status_analyzing: "Analisando",
  live_status_stopped: "Parado",
  live_status_finalizing: "Finalizando…",
  live_status_error: "Erro",
  live_transcript_listening: "Ouvindo… fale no microfone.",
  live_transcript_idle: "Clique em Iniciar para começar a transcrever.",
  live_no_findings_yet:
    "Nenhuma falácia detectada ainda. Elas aparecerão aqui conforme a pessoa fala.",
  live_no_claims_yet:
    "Nenhuma afirmação verificável detectada ainda. Elas aparecerão aqui conforme a pessoa fala.",
  live_no_neutrality_yet:
    "Nenhum sinal de parcialidade detectado ainda. A avaliação parcial aparecerá aqui.",
  live_claim_detected: "Detectada ao vivo · verifique após finalizar",
  live_partial_verdict: "Avaliação parcial",
  live_confidence: "Confiança",
  live_session_saved: "Sessão salva.",
  live_view_analysis: "Ver análise de falácias",
  live_view_factcheck: "Ver e checar afirmações",
  live_view_neutrality: "Ver avaliação de neutralidade",
  live_start_new: "Nova gravação",
};

const es: Messages = {
  tagline: "truth is a pathless land",

  hero_title: "Lee cualquier cosa con espíritu crítico.",
  hero_subtitle:
    "Sube un PDF o screenshot, pega texto o una imagen, o suelta una URL. Jiddu resalta los pasajes con falacias lógicas y explica cada uno en un comentario — como un revisor en Word — y le da al texto entero una puntuación de falacia de 0 a 100.",
  home_hero_subtitle:
    "Suelta un PDF o screenshot, pega texto o una imagen, o añade una URL — y elige una lente. O usa Live para monitorear falacias, afirmaciones verificables y señales de neutralidad mientras alguien habla.",
  privacy: "Privacidad:",
  privacy_body:
    "tu contenido — incluidos screenshots pegados e imágenes de páginas seleccionadas del PDF cuando sea necesario — se envía al modelo elegido vía OpenRouter. Jiddu no conserva el archivo del screenshot; el texto extraído se almacena localmente bajo un id compartible.",
  see_demo: "Ver demostración",
  see_demo_for: (feature) =>
    `Ver una demostración de ${feature.toLocaleLowerCase("es")}`,
  see_demo_hint: "¿Quieres un vistazo rápido sin ejecutar un análisis?",
  bench_badge_label:
    "Pipeline validado · 67,5% de concordancia con PolitiFact en benchmark de 200 claims",
  bench_badge_link: "ver informe",
  pipelines_heading: "Siete formas de leer críticamente",
  pipelines_subheading:
    "Elige un modo en el formulario de arriba, o abre un análisis de muestra para ver cómo se ve cada uno.",
  pipeline_fallacy_desc:
    "Resalta cada pasaje que contiene una falacia lógica y explica cada una en un comentario al margen (estilo Word). Da una puntuación de falacias de 0 a 100.",
  pipeline_factcheck_desc:
    "Extrae cada afirmación verificable — números, fechas, citas, aseveraciones causales y categóricas — y opcionalmente revisa cada una en la web en vivo vía Perplexity Sonar con fuentes citadas.",
  pipeline_neutrality_desc:
    "Expone patrones de encuadre, atribución y selección de fuentes que vuelven un texto partidario aun cuando nada es factualmente falso. Deliberadamente NO clasifica izquierda/derecha.",
  pipeline_live_desc:
    "Escucha en tiempo real y monitorea falacias, afirmaciones verificables y señales de neutralidad mientras alguien habla.",
  quality_card_heading: "Calidad medida contra humanos",
  quality_card_body:
    "Medimos el pipeline de fact-check contra 200 afirmaciones etiquetadas humanamente por PolitiFact. El veredicto de Jiddu coincidió con el veredicto humano en 81,3% de las afirmaciones inequívocas (true / false / pants-on-fire), con desacuerdo estricto en apenas 4,5% de los casos.",
  quality_card_link: "Metodología completa y matriz de confusión",

  footer_quote:
    "“En el momento en que sigues a alguien, dejas de seguir la verdad.”",
  footer_balance: (amount) => `${amount} restantes en créditos de API`,

  tab_url: "URL",
  tab_paste: "Pegar texto",
  tab_file: "PDF / TXT / Imagen",
  tab_live: "En vivo",
  tab_factcheck: "Verificar",
  url_placeholder: "https://ejemplo.com/articulo",
  paste_placeholder: "Pega el texto que quieres analizar…",
  file_drop_hint: "Suelta PDF, TXT o imagen — o pega un screenshot",
  file_size_hint: "⌘V / Ctrl+V · imágenes hasta 10 MB · texto hasta ~200 mil caracteres",
  model: "Modelo",
  model_anthropic: "Claude (Anthropic)",
  model_openai: "GPT (OpenAI)",
  analyze: "Analizar",
  starting: "Iniciando…",
  form_hint: "Los comentarios aparecen mientras corre el análisis. No cierres la página.",
  auth_required_title: "Debes iniciar sesión",
  auth_required_hint:
    "Crea una cuenta de Jiddu o inicia sesión para continuar. Las cuentas conectadas usan créditos Jiddu o el acceso incluido a la plataforma.",
  auth_sign_in: "Ingresar",
  auth_create_account: "Crear cuenta",
  credits_required_title: "Se necesitan créditos Jiddu",
  credits_required_hint:
    "Este análisis necesita más créditos Jiddu. Abre tu cuenta para consultar el saldo y la actividad de créditos.",
  credits_open_account: "Ver cuenta",

  loading_starting: "Iniciando análisis",
  loading_reading: "Leyendo el texto",
  loading_analyzing: (done, total) =>
    `Analizando — ${done} de ${total} secciones listas`,
  loading_finalizing: "Finalizando",
  loading_hint: "Esto suele tomar 10–30 segundos. No cierres la página.",
  sections: "secciones",
  fallacies_found_so_far: (count) =>
    `${count} ${count === 1 ? "falacia encontrada" : "falacias encontradas"} hasta ahora`,
  loader_url: [
    "Obteniendo la página",
    "Siguiendo redirecciones",
    "Eliminando anuncios y navegación",
    "Extrayendo el cuerpo del artículo",
    "Detectando el idioma",
    "Dividiendo en oraciones",
  ],
  loader_paste: [
    "Leyendo tu texto",
    "Normalizando espacios",
    "Detectando el idioma",
    "Dividiendo en oraciones",
  ],
  loader_file: [
    "Leyendo el archivo",
    "Extrayendo el texto",
    "Limpiando saltos de página",
    "Detectando el idioma",
    "Dividiendo en oraciones",
  ],
  loader_image: [
    "Leyendo el screenshot",
    "Transcribiendo el texto visible",
    "Conservando párrafos y autores",
    "Preparando el texto extraído",
  ],
  loader_analysis: [
    "Buscando encuadres tendenciosos",
    "Verificando las afirmaciones",
    "Comparando con el catálogo de falacias",
    "Examinando patrones retóricos",
    "Redactando los comentarios",
    "Evaluando la severidad",
  ],
  loader_factcheck: [
    "Leyendo el texto",
    "Descartando opinión y retórica",
    "Separando hechos verificables",
    "Extrayendo números y fechas",
    "Descontextualizando cada afirmación",
    "Redactando la justificación",
  ],

  factcheck_hero_title: "Extrae cada afirmación verificable de cualquier texto.",
  factcheck_hero_subtitle:
    "Pega una URL, escribe el texto o sube un PDF. Jiddu separa los números, fechas, citas y afirmaciones factuales que vale la pena verificar — para que sepas exactamente qué chequear.",
  extract_claims: "Extraer afirmaciones",
  factcheck_failed: "Falló la extracción de afirmaciones",
  claims_found_one: "afirmación verificable encontrada hasta ahora",
  claims_found_many: "afirmaciones verificables encontradas hasta ahora",

  mode_detector: "Detector de Falacias",
  mode_factcheck: "Verificar Hechos",
  mode_live: "Live",

  fc_untitled: "Sin título",
  fc_claims_one_extracted: "afirmación extraída",
  fc_claims_many_extracted: "afirmaciones extraídas",
  fc_claims_header: "Afirmaciones",
  fc_extracting: "Extrayendo afirmaciones…",
  fc_no_claims: "No se extrajeron afirmaciones verificables de este texto.",
  fc_verify_panel_title: "Verificar estas afirmaciones",
  fc_verify_panel_desc:
    "Jiddu pasará cada afirmación por un modelo con búsqueda web y devolverá un veredicto con fuentes. Las verificaciones automatizadas pueden errar — siempre revisa las fuentes.",
  fc_verify_button: "Verificar afirmaciones",
  fc_reverify_button: "Reverificar",
  fc_verify_label: "Verificación",
  fc_show_sources: (n) => `Ver fuentes (${n})`,
  fc_hide_sources: (n) => `Ocultar fuentes (${n})`,
  fc_checking: "verificando",
  fc_report_wrong: "Reportar veredicto incorrecto",
  fc_report_prompt: "¿Por qué el veredicto es incorrecto? (opcional)",
  fc_report_thanks: "Gracias — revisaremos.",
  fc_footer: (model) =>
    `Afirmaciones extraídas por ${model} vía OpenRouter. Los veredictos (cuando están presentes) provienen de un modelo con búsqueda web y pueden estar equivocados. Jiddu no afirma que ninguna alegación sea verdadera o falsa — lee las fuentes y juzga por tu cuenta.`,
  fc_status_complete: "Completo",
  fc_status_running: "En curso",
  fc_status_failed: "Falló",
  fc_status_pending: "Pendiente",

  ct_numeric: "Numérica",
  ct_date: "Fecha",
  ct_quote: "Cita",
  ct_causal: "Causal",
  ct_categorical: "Categórica",

  vd_supported: "Respaldado",
  vd_contradicted: "Contradicho",
  vd_mixed: "Mixto",
  vd_unverified: "No verificado",

  st_primary: "Fuente primaria",
  st_scholarly: "Académico",
  st_think_tank: "Think tank",
  st_journalistic: "Periodismo",
  st_commercial_content: "Comercial",
  st_informal: "Informal",
  st_state_controlled: "Controlado por el Estado",

  mode_neutrality: "Imparcialidad",
  tab_neutrality: "Imparcialidad",
  neutrality_hero_title: "Identifica patrones de encuadre, atribución y selección de fuentes.",
  neutrality_hero_subtitle:
    "Pega una URL, escribe el texto o sube un PDF. Jiddu marca palabras cargadas, atribución asimétrica, falsa equivalencia y otros patrones de encuadre — sin intentar etiquetar dirección partidaria.",
  assess_neutrality: "Evaluar imparcialidad",
  neutrality_failed: "Falló el análisis de imparcialidad",
  loader_neutrality: [
    "Leyendo el texto",
    "Observando elecciones de palabras",
    "Verificando simetría de atribución",
    "Buscando omisión selectiva",
    "Auditando el mix de fuentes",
    "Redactando el veredicto",
  ],
  findings_found_one: "patrón encontrado",
  findings_found_many: "patrones encontrados",
  neutrality_no_issues: "No se señalaron problemas de imparcialidad.",
  neutrality_confidence: "confianza",
  neutrality_footer: (model) =>
    `Evaluado por ${model} vía OpenRouter. La imparcialidad es una propiedad del encuadre — Jiddu no clasifica dirección partidaria. Lee los pasajes señalados y juzga por tu cuenta.`,

  nv_neutral: "Neutro",
  nv_partisan_lean: "Inclinación partidaria",
  nv_explicitly_partisan: "Explícitamente partidario",
  nv_manipulation: "Manipulación",

  ni_loaded_language: "Lenguaje cargado",
  ni_asymmetric_attribution: "Atribución asimétrica",
  ni_false_equivalence: "Falsa equivalencia",
  ni_selective_omission: "Omisión selectiva",
  ni_source_asymmetry: "Asimetría de fuentes",
  ni_both_sidesing: "Falso debate",
  ni_steering: "Conducción",
  ni_genetic_framing: "Ataque al origen",

  tt_informational: "Informativo",
  tt_opinion: "Opinión",
  tt_political_speech: "Discurso político",
  tt_advocacy: "Advocacy",
  tt_analysis: "Análisis",
  tt_marketing: "Marketing",
  tt_social_media: "Redes sociales",

  // Explain dimension (paper explainer)
  mode_explain: "Explicador de Papers",
  explain_hero_title: "Entiende cualquier paper, párrafo por párrafo.",
  explain_hero_subtitle:
    "Sube un paper o pega el texto, elige un nivel, y Jiddu mapea su pregunta, enfoque y evidencia antes de explicar cada párrafo en el margen.",
  explain_cta: "Explicar",
  explain_failed: "Falló la explicación",
  loader_explain: [
    "Leyendo el paper",
    "Mapeando su estructura",
    "Explicando cada párrafo",
    "Traduciendo la jerga",
    "Conectando el argumento",
  ],
  loader_explain_map: "Construyendo el mapa del paper",
  explain_level: "Nivel de explicación",
  level_eli5: "Niño",
  level_high_school: "Secundaria",
  level_undergrad: "Grado",
  level_expert: "Experto",
  role_background: "Contexto",
  role_objective: "Objetivo",
  role_method: "Método",
  role_result: "Resultados",
  role_interpretation: "Interpretación",
  role_limitation: "Limitaciones",
  role_conclusion: "Conclusión",
  explain_overview_label: "En palabras simples",
  explain_map_label: "Mapa del paper",
  explain_map_paper_type: "Tipo de paper",
  explain_map_contribution_type: "Contribución",
  explain_map_question: "Pregunta central",
  explain_map_contribution: "Qué aporta",
  explain_map_approach: "Cómo investiga",
  explain_map_answer: "Respuesta principal",
  explain_map_evidence: "Evidencia y datos",
  explain_map_limitation: "Salvedad declarada",
  explain_map_open_evidence: "Abrir el párrafo que sustenta este punto",
  explain_jump_to: "Ir a",
  explanations_count_one: "explicación",
  explanations_count_many: "explicaciones",
  explain_empty: "No se generaron explicaciones para este documento.",
  explain_footer: (model) =>
    `Explicado por ${model} vía Jiddu. Las explicaciones automáticas pueden malinterpretar un paper — verifica siempre con el original.`,
  pipeline_explain_desc:
    "Obtén un mapa de la pregunta, el enfoque y la evidencia del paper, además de una explicación de cada párrafo — de niño a experto.",

  mode_slop: "Detector de slop",
  pipeline_slop_desc:
    "Señala las frases hechas, el drama fabricado y las estructuras de plantilla que hacen que un texto parezca ensamblado por máquina. Nombra cada patrón con una cita verificable — nunca adivina autoría.",
  check_slop: "Detectar slop",
  slop_failed: "Falló la detección de slop",
  loader_slop: [
    "Olfateando frases hechas",
    "Comprobando si el drama es fabricado",
    "Midiendo la densidad de plantilla",
    "Pesando lo que sobrevive al borrado",
    "Redactando los comentarios",
  ],
  slop_found_one: "patrón señalado hasta ahora",
  slop_found_many: "patrones señalados hasta ahora",
  no_slop: "No se detectaron patrones de slop — este texto suena humano.",
  slop_finding_count: (count, total) =>
    `${count} ${count === 1 ? "patrón" : "patrones"} en ${total} oraciones`,
  slop_score_clean: "suena humano",
  slop_score_light: "condimento ligero",
  slop_score_several: "con plantillas",
  slop_score_heavy: "dominado por plantillas",
  slop_score_assembly: "prosa de línea de montaje",
  a11y_show_slop: "Mostrar comentario de slop",
  finding_about_this_pattern: "Sobre este patrón",
  slop_guide_title: "Guía de patrones de slop",
  slop_guide_subtitle:
    "Una referencia breve para los patrones de escritura de slop de IA que Jiddu puede señalar. Patrones, no autoría — los humanos también escriben slop.",

  mode_review: "Revisión adversarial",
  pipeline_review_desc:
    "Trata un paper como envío autónomo, audita claims y experimentos, verifica literatura publicada y entrega una revisión de gatekeeping con críticas localizadas.",
  review_cta: "Revisar paper",
  review_failed: "Falló la revisión adversarial",
  loader_review: [
    "Interpretando el paper completo",
    "Construyendo el ledger privado de claims",
    "Verificando la literatura publicada",
    "Ejecutando cinco revisiones SPECS independientes",
    "Recalculando los resultados reportados",
    "Sintetizando los hallazgos especializados",
    "Ejecutando la autocrítica adversarial",
    "Validando las fuentes externas",
    "Ejecutando la auditoría de calidad independiente",
    "Finalizando la revisión",
  ],
  review_venue: "Venue objetivo (opcional)",
  review_venue_placeholder: "Busca NeurIPS, ICML, ICLR, AAAI…",
  review_venue_help: "Los perfiles verificados aplican criterios oficiales de la edición. Otros venues de DBLP usan un estándar académico general.",
  review_venue_searching: "Buscando en DBLP…",
  review_venue_verified: "Rúbrica verificada",
  review_venue_catalog_only: "Resultado del catálogo · rúbrica general",
  review_venue_year: "Edición",
  review_depth: "Profundidad de revisión",
  review_depth_standard: "Estándar",
  review_depth_deep: "Profunda",
  review_depth_help:
    "La revisión profunda usa modelos de razonamiento más fuertes para evaluaciones, corrección, síntesis y una crítica independiente. Tarda más y cuesta más.",
  review_track: "Track",
  review_track_placeholder: "Main track",
  review_paper_type: "Tipo de paper",
  review_type_research: "Paper de investigación",
  review_type_position: "Position paper",
  review_type_survey: "Survey",
  review_type_dataset: "Dataset / benchmark",
  review_type_theory: "Teoría",
  review_type_use_inspired: "Orientado a la aplicación",
  review_type_concept: "Concepto y viabilidad",
  review_type_negative_results: "Resultados negativos",
  review_date: "Fecha de revisión (opcional)",
  review_pdf_hint: "Suelta exactamente un PDF final, o haz clic para elegir",
  review_file_size_hint: "Solo PDF · lectura completa · hasta ~300 mil caracteres",
  review_form_hint:
    "Una revisión completa puede tardar varios minutos. Mantén esta página abierta.",

  nav_legal: "Términos",
  nav_how_it_works: "Cómo funciona",
  nav_api: "API",
  api_access_title: "API y MCP de Jiddu",
  api_access_subtitle:
    "Cinco herramientas síncronas de texto más revisión adversarial asíncrona de PDF para código y agentes.",
  api_access_sections: [
    {
      title: "Endpoints",
      paragraphs: [
        "Jiddu expone sus cinco pipelines de análisis como una REST API pública. Cada endpoint recibe un cuerpo JSON con un campo `text` (40–2000 caracteres) y un `lang` opcional (`en` / `pt` / `es`), y devuelve JSON estructurado.",
        "```\nPOST /api/v1/detect-fallacies\nPOST /api/v1/fact-check\nPOST /api/v1/assess-neutrality\nPOST /api/v1/explain\nPOST /api/v1/detect-slop\n```",
        "`detect-fallacies`, `assess-neutrality`, `explain` y `detect-slop` son rápidos. `fact-check` extrae cada afirmación y la verifica con búsqueda web en vivo, por lo que es más lento y medido.",
      ],
    },
    {
      title: "Revisión adversarial de papers",
      paragraphs: [
        "La revisión adversarial usa un contrato de jobs asíncronos persistidos. Inicia con `POST /api/v1/adversarial-reviews` multipart y un `file`, o JSON con una `pdf_url` pública. Elige `depth=standard` para el pipeline económico o `depth=deep` para modelos más fuertes de razonamiento y crítica. La respuesta `202` devuelve id, URL de estado y `retry_after_seconds`; consulta `GET /api/v1/adversarial-reviews/{id}` hasta que `status` sea `complete` o `failed`.",
        "```\ncurl -X POST https://jiddu.app/api/v1/adversarial-reviews \\\n  -H \"X-Jiddu-Key: TU_CLAVE\" \\\n  -F \"file=@paper.pdf\" \\\n  -F \"lang=es\" \\\n  -F \"depth=deep\" \\\n  -F \"venue_profile_id=neurips-2026-main\"\n\ncurl -H \"X-Jiddu-Key: TU_CLAVE\" \\\n  https://jiddu.app/api/v1/adversarial-reviews/JOB_ID\n```",
        "Un job completado devuelve la revisión estructurada, una auditoría pública de la metodología y metadatos de verificación de fuentes, además de enlaces al visor, Markdown determinista e impresión/PDF. Campos opcionales: `lang`, `depth`, `venue_profile_id`, `venue`, `venue_year`, `venue_track`, `paper_type` y `review_date`. Los PDF tienen un límite de 25 MB y 300.000 caracteres extraídos.",
      ],
    },
    {
      title: "Autenticación de la REST API",
      paragraphs: [
        "La REST API está separada del OAuth de MCP. Envía la clave en el encabezado `X-Jiddu-Key`. Cada clave se asigna a una cuenta WorkOS verificada y sigue la financiación de esa cuenta: acceso incluido de plataforma o créditos Jiddu. Las claves sin propietario quedan desactivadas. Consulta “Obtener una clave de la REST API” más abajo.",
        "```\ncurl -X POST https://jiddu.app/api/v1/detect-fallacies \\\n  -H \"content-type: application/json\" \\\n  -H \"X-Jiddu-Key: TU_CLAVE\" \\\n  -d '{\"text\": \"Todos están de acuerdo en que esto es lo mejor, así que quien critica es un tonto.\"}'\n```",
      ],
    },
    {
      title: "Servidor MCP",
      paragraphs: [
        "Para agentes, conéctate directamente a `https://jiddu.app/api/mcp`. El servidor expone las cinco herramientas de texto más `start_adversarial_review` y `get_adversarial_review`. Los clientes MCP compatibles descubren WorkOS AuthKit, abren el inicio de sesión de Jiddu y reciben automáticamente un token OAuth limitado al recurso. Las cuentas en la allowlist de la plataforma reciben acceso incluido; cada llamada de las demás cuentas reserva y gasta créditos Jiddu.",
        "Los clientes que aún necesitan un puente stdio local pueden usar `mcp-remote` sin un encabezado de autenticación personalizado; este gestiona la redirección OAuth:\n```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\"]\n    }\n  }\n}\n```",
        "Las orientaciones de configuración para agentes, los contratos de respuesta y los ejemplos de encadenamiento están incluidos en esta página.",
      ],
    },
    {
      title: "Límites y fiabilidad",
      paragraphs: [
        "Las herramientas de texto aceptan hasta 2000 caracteres por solicitud. Los jobs de revisión reciben un PDF público o subido de hasta 25 MB y rechazan papers por encima de 300.000 caracteres extraídos en lugar de truncarlos. Los límites de REST son por clave de API; los del MCP alojado son por usuario de WorkOS. Al excederlos, la respuesta es HTTP 429 con `retry_after_seconds`. Las salidas son automatizadas y pueden equivocarse — trátalas como señales para verificar, no como autoridad final.",
        "La calidad se mide contra conjuntos de prueba internos fijos y los resúmenes de benchmark publicados en este sitio.",
      ],
    },
    {
      title: "Obtener una clave de la REST API",
      paragraphs: [
        "Las claves se emiten manualmente por ahora y se asignan a tu cuenta WorkOS verificada. Contacta al operador mediante el canal indicado en la página de Términos para solicitar una. El secreto se muestra una vez y se guarda únicamente como hash sha256.",
      ],
    },
  ],
  export_pdf: "Exportar PDF",

  print_type_fallacy: "Análisis de falacias",
  print_type_factcheck: "Verificación de hechos",
  print_type_neutrality: "Evaluación de imparcialidad",
  print_meta_source: "Fuente",
  print_meta_type: "Tipo",
  print_meta_text_type: "Tipo de texto",
  print_meta_generated: "Generado",
  print_meta_reviewed: "Revisado por humano",
  print_meta_model: "Modelo",
  print_meta_url: "URL del informe",
  print_section_source_text: "Texto original",
  print_section_findings: "Hallazgos",
  print_section_claims: "Afirmaciones",
  print_section_score: "Puntuación",
  print_no_claims: "No se extrajeron afirmaciones verificables.",
  print_no_findings: "Ningún patrón señalado.",
  print_footer_fallacy:
    "Este es un informe automatizado. Las etiquetas pueden estar equivocadas — siempre lee el texto original y juzga por tu cuenta. Términos completos en https://jiddu.app/legal.",
  print_footer_factcheck:
    "Este es un informe automatizado. Los veredictos pueden estar equivocados — siempre lee las fuentes citadas y juzga por tu cuenta. Términos completos en https://jiddu.app/legal.",
  print_footer_neutrality:
    "Este es un informe automatizado. La imparcialidad es una propiedad del encuadre; las etiquetas pueden estar equivocadas — lee el texto original y los pasajes señalados. Jiddu no clasifica dirección partidaria. Términos completos en https://jiddu.app/legal.",
  print_type_explain: "Explicación de paper",
  print_meta_level: "Nivel",
  print_section_explanations: "Explicaciones",
  print_no_explanations: "No se generaron explicaciones.",
  print_footer_explain:
    "Esta es una explicación automatizada. Puede malinterpretar o simplificar en exceso el paper — lee siempre el texto original y los trabajos citados. Términos completos en https://jiddu.app/legal.",
  print_type_slop: "Detección de slop",
  print_footer_slop:
    "Este es un informe automatizado. Señala patrones de escritura, nunca autoría — los humanos también escriben slop, y las etiquetas pueden estar equivocadas. Lee los pasajes citados y juzga por tu cuenta. Términos completos en https://jiddu.app/legal.",
  print_generated_at: (when) => `Generado ${when} · jiddu.app`,

  legal_title: "Términos, privacidad y descargos",
  legal_subtitle:
    "Lee esto antes de usar Jiddu, especialmente antes de compartir un análisis públicamente.",
  legal_last_updated: "Actualizado: 2026-07-28",
  legal_sections: [
    {
      title: "1. Qué hace Jiddu",
      paragraphs: [
        "Jiddu ofrece seis flujos automatizados de lectura crítica: detección de falacias, verificación de hechos, evaluación de imparcialidad, explicación de papers, detección de patrones de escritura y revisión adversarial de papers. La app web, la API pública y MCP usan los mismos pipelines; la revisión de papers se ejecuta como job asíncrono porque tiene varias etapas.",
        "Jiddu no tiene un equipo editorial humano. Todo resultado es producido por software. Una marca de revisión significa que el operador hizo una inspección puntual, pero el informe sigue siendo automatizado. Úsalo como apoyo para la lectura crítica, no como sustituto.",
      ],
    },
    {
      title: "2. Los resultados automatizados pueden fallar",
      paragraphs: [
        'Los veredictos ("respaldado", "contradicho", "mixto", "no verificado") y las etiquetas de falacia son juicios automatizados de mejor esfuerzo. Pueden estar equivocados — a veces con alta confianza.',
        "Jiddu no afirma que ninguna declaración, persona o documento sea verdadero, falso, mentiroso o engañoso. Las etiquetas son señales para activar tu propia verificación. Siempre lee las fuentes citadas y forma tu propia conclusión.",
        "Las puntuaciones de imparcialidad, los Mapas del Paper y las explicaciones párrafo por párrafo también son interpretaciones automatizadas, no afirmaciones de hecho — el explicador describe qué dice un texto y cómo está estructurado, nunca si sus afirmaciones son correctas. El nivel de audiencia cambia solo la prosa; las clasificaciones, los puntos del mapa y las etiquetas de función son aproximaciones algorítmicas.",
        "Los hallazgos de la revisión de papers, las comparaciones de novedad, las severidades, el encaje con el venue y la recomendación final también son juicios automatizados. No son una revisión oficial por pares, una predicción de aceptación ni un sustituto de un revisor humano cualificado.",
      ],
    },
    {
      title: "3. Uso bajo tu propio riesgo",
      paragraphs: [
        "Eres responsable de cómo usas el análisis y de lo que compartes o publicas. Si republicas un resultado de Jiddu, adoptas ese contenido como tuyo — los autores de Jiddu no son responsables de los usos posteriores.",
        "No envíes datos confidenciales, propietarios, bajo embargo o personales. El contenido enviado — incluidas imágenes renderizadas de páginas seleccionadas del PDF cuando se necesita inspección visual — pasa por OpenRouter al proveedor upstream del modelo elegido y se almacena bajo un id compartible.",
        "Usa la revisión de papers solo con manuscritos propios o que estés autorizado a procesar. No subas un manuscrito recibido bajo revisión por pares confidencial salvo que los autores y el venue permitan explícitamente el procesamiento por modelos de terceros.",
      ],
    },
    {
      title: "4. Personas y figuras públicas",
      paragraphs: [
        "Los análisis sobre personas nombradas (políticos, periodistas, ejecutivos) son producidos por software que busca en fuentes públicas en la web. El lenguaje que usa Jiddu es intencionalmente cauto (\"la evidencia no respalda\", \"no encontramos\") — no adoptes una formulación más fuerte de la que emite la herramienta.",
        "Si crees que un veredicto es injusto o sin sustento, usa el botón \"reportar veredicto incorrecto\" en la afirmación correspondiente. El operador revisa los reportes enviados; los reportes abusivos o repetitivos pueden descartarse.",
      ],
    },
    {
      title: "5. Privacidad",
      paragraphs: [
        "Cada análisis o revisión de paper completado recibe una URL compartible no listada y se almacena en un servidor en Brasil. Quien tenga la URL puede ver el resultado final, pero esas páginas no se enumeran en el sitemap público. Los usuarios que iniciaron sesión ven los análisis asociados a su cuenta, pero la URL compartible sigue accesible para quien la tenga; las etapas intermedias privadas de la revisión no aparecen en el visor público.",
        "La autenticación la proporciona WorkOS AuthKit. Jiddu recibe la identidad necesaria para mantener la sesión, autorizar clientes MCP y asociar claves REST, saldos y uso con la cuenta correcta. Los secretos REST se muestran una vez y se almacenan solo como hashes. Las credenciales de los proveedores de modelos son administradas por Jiddu y nunca se exponen al JavaScript de la página, clientes REST o clientes MCP.",
        "El autocompletado de venue envía solo la consulta del venue — nunca el manuscrito — a la búsqueda pública de venues de [DBLP](https://dblp.org). La etapa de investigación de literatura consulta fuentes académicas públicas usando afirmaciones técnicas del manuscrito; los prompts prohíben buscar por el título del paper, el nombre de los autores u otros manuscritos de los mismos autores.",
        "Registramos el IP de la solicitud para límites de tasa y detección de abuso. No vendemos ni compartimos esa información.",
        "El tráfico de las páginas se mide vía Google Analytics (gtag.js).",
      ],
    },
    {
      title: "6. Metodología",
      paragraphs: [
        "Nuestro pipeline de extracción y verificación de afirmaciones se inspira en [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025) para la etapa de extracción, y en el framework de evaluación descrito en [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) para la evaluación de veredicto, los niveles de calidad de fuente y la dimensión de imparcialidad. Nuestra elección de 4 clases de veredicto (respaldado / contradicho / mixto / no verificado) en lugar de los esquemas de 5 o 6 clases usados por algunos outlets de fact-check se basa en [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909), que mostraron empíricamente que el etiquetado de 3 clases supera al de 5 clases para fact-check con LLMs — las categorías adicionales en el medio introducen ambigüedad sin mejorar la precisión.",
        "La revisión adversarial adapta las dimensiones SPECS y el patrón de síntesis y autocrítica por etapas descrito en [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu es una implementación independiente, con ledger paginado de afirmaciones y evidencias, investigación de literatura, comprobaciones aritméticas, calibración por venue, validación de fuentes y gate de retención de hallazgos propios; no reproduce el sistema de AAAI-26.",
        "La taxonomía inicial del detector de slop proviene de la skill de edición [no-ai-slop](https://github.com/petergyang/no-ai-slop), de Peter Yang, con licencia MIT. Jiddu aporta la redacción del catálogo, las traducciones y el prompt de detección, y señala patrones observables, no autoría.",
        "Jiddu no está afiliado a esos grupos de investigación, a DBLP ni a ningún venue cuyos criterios resume. Se citan las referencias y páginas oficiales para que el usuario pueda auditar la metodología y el estándar aplicado.",
        "El pipeline de fact-check se midió contra el corpus humano de [PolitiFact](https://www.politifact.com) (vía el [dataset LIAR2](https://github.com/chengxuphd/liar2), Apache-2.0). En 200 afirmaciones tomadas de los cuatro buckets polares de PolitiFact, el veredicto de Jiddu coincidió con el veredicto humano en 67,5% de los casos en total y en 81,3% en las categorías menos ambiguas (true / false / pants-on-fire), con desacuerdo estricto en apenas 4,5%. Metodología completa, matriz de confusión y análisis de desacuerdos en [docs/benchmark-politifact.md](/benchmark).",
        "La revisión de papers tiene un benchmark sintético SPECS separado de 30 casos. GPT-5.4 mini, GPT-5.5, GPT-5.6 Luna y GPT-5.6 Luna Pro detectaron los 30 defectos insertados. Luna Pro produjo un 8% menos de hallazgos que Luna estándar, pero el conjunto alcanzó un techo y no establece precisión en papers reales completos.",
      ],
    },
    {
      title: "7. Contacto",
      paragraphs: [
        "Operador: Rafael de Menezes Ehlers. Para solicitudes de remoción, correcciones u otras consultas, usa el formulario de contacto en [rafaelmehlers.com.br](https://rafaelmehlers.com.br).",
      ],
    },
  ],

  how_it_works_title: "Cómo funciona Jiddu",
  how_it_works_subtitle:
    "Una visión clara de cada análisis, los modelos utilizados y cómo Jiddu gestiona calidad, privacidad, créditos y limitaciones.",
  how_it_works_sections: [
    {
      title: "1. Visión general",
      paragraphs: [
        "Jiddu ofrece seis formas independientes de examinar un texto o paper: detección de falacias, fact-checking, evaluación de imparcialidad, explicación párrafo por párrafo, detección de patrones de slop y revisión adversarial. El modo Live añade transcripción en tiempo real con lentes seleccionables de falacias, afirmaciones para fact-check y neutralidad.",
        "Los análisis devuelven hallazgos estructurados y vinculados a la fuente a medida que están disponibles. El resultado sigue el idioma seleccionado en la interfaz y cada función puede utilizarse de forma independiente.",
      ],
    },
    {
      title: "2. Entrada: ingestión y segmentación",
      paragraphs: [
        "**URL.** Jiddu recupera páginas públicas de forma segura, bloquea destinos de red privados o reservados y utiliza [Mozilla Readability](https://github.com/mozilla/readability) para aislar el cuerpo del artículo.",
        "**PDF.** Procesado localmente con [LiteParse](https://github.com/run-llama/liteparse), con un parser secundario disponible cuando es necesario. La revisión académica conserva referencias de página y puede inspeccionar páginas renderizadas seleccionadas cuando la evidencia visual es relevante.",
        "**Imagen.** Los screenshots PNG, JPEG y WebP de hasta 10 MB pueden pegarse, soltarse o seleccionarse. El modelo visual elegido transcribe el texto visible antes del análisis seleccionado. Jiddu no conserva el archivo de imagen.",
        "**Paste.** Usado tal cual, solo con espacios en blanco normalizados.",
        "**Segmentación.** Las entradas largas se dividen respetando los límites de las frases para caber en el contexto de los modelos sin cortar abreviaturas, siglas o números comunes.",
      ],
    },
    {
      title: "3. Modelos y fallback",
      paragraphs: [
        "Dos familias de modelos aparecen en el selector: [🇺🇸 GPT-5.6 Luna](https://openrouter.ai/openai/gpt-5.6-luna) (por defecto) y [🇨🇳 MiniMax M3](https://openrouter.ai/minimax/minimax-m3). Tener ambas permite comparar interpretaciones limítrofes y evita que todo análisis dependa de un solo proveedor.",
        "Jiddu puede recurrir a la otra familia de modelos cuando el proveedor seleccionado no está disponible. El trabajo ya devuelto se conserva, por lo que un resultado visiblemente parcial debe tratarse como parcial.",
        "Sonar Reasoning Pro se usa exclusivamente para los veredictos de fact-check (porque tiene búsqueda web incorporada). Nunca aparece en el selector de modelo.",
      ],
    },
    {
      title: "4. Detector de falacias",
      paragraphs: [
        "Catálogo de 46 falacias cubriendo relevancia, ambigüedad, presunción, apelaciones emocionales, razonamiento causal y evidencia. Cada falacia tiene un id estable y un color distinto (distribución por golden angle) usado para resaltar pasajes. La lista completa está en [/fallacies](/fallacies).",
        "El análisis es deliberadamente conservador: un hallazgo debe citar el pasaje relevante, identificar el patrón y explicar el fallo de razonamiento en contexto. Una formulación ambigua no debe marcarse sin que el contexto la resuelva.",
        "Cada hallazgo recibe una severidad y contribuye a una puntuación de 0 a 100. La puntuación es una ayuda de navegación, no la probabilidad de que un documento sea falaz.",
        "**Modelos y por qué.** GPT-5.6 Luna o MiniMax M3 compara el texto con un catálogo cerrado. Esta tarea delimitada no requiere búsqueda web y las dos familias permiten comparar interpretaciones limítrofes.",
        "Jiddu prueba detecciones representativas y trampas de falsos positivos, pero aún no ha publicado un benchmark con etiquetas humanas para esta función. Todo pasaje destacado sigue requiriendo juicio humano.",
      ],
    },
    {
      title: "5. Detector de slop",
      paragraphs: [
        "El detector de slop utiliza un catálogo propio y devuelve pasajes destacados, explicaciones breves y una puntuación de densidad de 0 a 100.",
        "El catálogo cubre 18 patrones de escritura de slop de IA en cinco familias: vocabulario de catálogo, drama fabricado, estructura de plantilla, sustancia hueca y tics de formato. La lista completa con definiciones y ejemplos está en [/slop-patterns](/slop-patterns). La selección de patrones se basa en la skill de edición [no-ai-slop](https://github.com/petergyang/no-ai-slop) de Peter Yang (licencia MIT); la redacción del catálogo, el contenido trilingüe y el prompt de detección son propios de Jiddu.",
        "Detecta **patrones, no autoría**: los seres humanos también pueden escribir prosa formulaica. Cada hallazgo cita el fragmento, nombra el patrón e indica qué haría una redacción más clara sin reescribir la fuente.",
        "**Modelos y por qué.** GPT-5.6 Luna o MiniMax M3 actúa como crítico de estilo restringido al catálogo. No hay clasificador de marcas de agua ni de autoría.",
        "El conjunto de evaluaciones cubre positivos representativos, prosa limpia y la salvaguarda de no inferir autoría. La función responde «¿qué patrones prefabricados aparecen?», no «¿quién o qué escribió esto?».",
      ],
    },
    {
      title: "6. Fact-check — extracción de afirmaciones",
      paragraphs: [
        "Modelado en [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). El prompt pide al modelo pasar cada oración por cuatro etapas: **selection** (mantener solo oraciones con una afirmación verificable — opiniones, juicios de valor, preguntas retóricas se descartan), **disambiguation** (descartar oraciones con múltiples lecturas plausibles cuando el contexto no resuelve), **decomposition** (partir oraciones con múltiples hechos en afirmaciones separadas sin perseguir atomicidad infinita) y **decontextualization** (cada afirmación emitida debe sostenerse sola — resolver pronombres, agregar el año a un número que dependa de él, atribuir una cita a su fuente).",
        "Cada afirmación emitida tiene un tipo: `numeric`, `date`, `quote`, `causal` o `categorical`. El tipo informa cómo el verificador busca evidencia después.",
        "El GPT-5.6 Luna o MiniMax M3 elegido realiza solo la extracción; la evaluación de verdad queda reservada a la etapa separada de verificación. Las salvaguardas de uso limitan cuánto trabajo puede generar un documento.",
        "Cada afirmación conserva la frase fuente y una formulación autónoma para que el lector pueda auditar lo que se va a comprobar. La extracción todavía puede omitir afirmaciones elegibles.",
      ],
    },
    {
      title: "7. Fact-check — veredicto por afirmación",
      paragraphs: [
        "La verificación es opcional. Cuando el usuario elige **Verificar afirmaciones**, cada una es investigada de forma independiente por [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro).",
        "El resultado es `respaldado`, `contradicho`, `mixto` o `no verificado`, acompañado de confianza, justificación y fuentes citadas. La evidencia de baja confianza se trata de forma conservadora, sin forzar un veredicto polar.",
        "Cada fuente citada se clasifica en uno de seis tiers (según Goldfarb et al. 2025): `primary` (agencias oficiales de datos, decisiones judiciales, papers peer-reviewed), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. Una flag booleana aparte marca medios `state-controlled` (RT, CGTN, Xinhua, etc. — pero no BBC/NPR/Deutsche Welle, que son state-FUNDED pero editorialmente independientes).",
        "El lenguaje es deliberadamente cuidadoso con las personas nombradas y describe lo que respalda la evidencia disponible, en lugar de acusar a alguien de deshonestidad.",
        "**Modelo y por qué.** Sonar Reasoning Pro se utiliza porque la verificación requiere búsqueda web actual y fuentes citadas. Los tiers describen el tipo de fuente, no una puntuación automática de verdad.",
        "¿Qué tan preciso es esto en la práctica? Corrimos un [benchmark contra el corpus humano de PolitiFact](/benchmark). En 200 afirmaciones tomadas de las cuatro categorías polares de PolitiFact (true / mostly-true / false / pants-on-fire, desde 2020), el veredicto de Jiddu coincidió con el veredicto humano polar en 67.5% de los casos en total y 81.3% en las categorías menos ambiguas (true / false / pants-on-fire). Desacuerdo estricto — Jiddu diciendo lo opuesto polar del humano — ocurrió solo en 4.5% de los casos (9 de 200). El ~28% restante fue Jiddu devolviendo `mixed` o `unverified` en lugar de un veredicto polar, concentrado en el bucket `mostly_true` de PolitiFact (58% se volvieron `mixed` — solapamiento estructural, no error, ya que ambas etiquetas describen verdad parcial). Metodología, matriz de confusión y análisis de desacuerdos en el enlace.",
      ],
    },
    {
      title: "8. Fact-check — caché de veredictos",
      paragraphs: [
        "Los veredictos recientes pueden reutilizarse para afirmaciones equivalentes, reduciendo la latencia y las búsquedas innecesarias. La duración varía según el tipo de afirmación, de modo que los hechos cambiantes caducan antes que los hechos históricos estables.",
        "El usuario puede solicitar una nueva comprobación desde la tarjeta de la afirmación. Las salvaguardas de actualización y uso evitan un coste ilimitado por búsquedas repetidas.",
      ],
    },
    {
      title: "9. Imparcialidad",
      paragraphs: [
        "Distinto de la detección de falacias: un texto puede estar libre de falacias y ser fácticamente correcto y aun así usar encuadre cargado, atribución asimétrica o selección unilateral de fuentes. La evaluación de imparcialidad expone esos patrones.",
        "Ocho tipos de issue se marcan a nivel de oración: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. El modelo también clasifica el documento en uno de siete tipos de texto (informativo / opinión / discurso político / advocacy / análisis / marketing / redes sociales) — eso informa qué tan estricta es la auditoría.",
        "El veredicto a nivel documento es uno de `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. Jiddu **deliberadamente no clasifica dirección partidaria** (izquierda/derecha, pro-X/anti-Y). El paper de Forum AI que inspiró la metodología requiere un panel bipartidista de expertos para esa etapa; sin ese panel, las etiquetas partidarias son poco confiables y dañinas. En su lugar exhibimos patrones específicos que el lector puede auditar.",
        "**Modelos y por qué.** GPT-5.6 Luna o MiniMax M3 clasifica el encuadre y los issues por frase sin navegar por la web ni decidir si las afirmaciones subyacentes son verdaderas.",
        "Todavía no existe un benchmark publicado con panel humano para la imparcialidad. El veredicto es una ayuda de navegación hacia pasajes auditables, no una medida objetiva de equilibrio político.",
      ],
    },
    {
      title: "10. Privacidad y estado de revisión",
      paragraphs: [
        "WorkOS AuthKit proporciona cuentas y sesiones. Los resultados completados siguen disponibles mediante URLs no listadas, y los usuarios que iniciaron sesión también ven sus análisis asociados en el área de cuenta. Cualquiera que tenga la URL compartible todavía puede ver el resultado final. Los ledgers, la investigación y los juicios preliminares de la revisión de papers son artefactos intermedios internos y no se muestran en el resultado público.",
        "Los créditos Jiddu son un saldo para análisis web, REST asociados a la cuenta y MCP alojados que usan credenciales de proveedores administradas por Jiddu. Las cuentas verificadas en la allowlist administrada por el operador reciben acceso incluido.",
        "El contenido enviado pasa por OpenRouter al upstream del modelo elegido. Los screenshots pegados se envían para transcripción, pero Jiddu no conserva el archivo de imagen; el texto extraído se almacena con el análisis. En revisión de papers se incluyen imágenes renderizadas de páginas seleccionadas, no solo texto extraído. La etapa de literatura busca fuentes académicas públicas por afirmaciones técnicas, mientras los prompts prohíben consultas por título, autor u otros manuscritos de los mismos autores. El autocompletado envía solo la consulta del venue a DBLP. Registramos el IP para rate-limit y señales de abuso y no lo vendemos.",
        "Los resultados son automatizados y no revisados por defecto. Un resultado marcado explícitamente como revisado fue inspeccionado puntualmente por el operador; ese estado es una comprobación humana adicional, no una garantía de que todos los hallazgos sean correctos.",
      ],
    },
    {
      title: "11. Créditos, cobro y controles de abuso",
      paragraphs: [
        "Los Créditos Jiddu pagan análisis en la app web, claves REST vinculadas a la cuenta y MCP alojado. Antes de la mayoría de los trabajos, Jiddu reserva temporalmente la estimación mostrada abajo para impedir que jobs simultáneos gasten el mismo saldo. En Live solo comprueba el saldo mínimo requerido, sin bloquearlo ni cobrarlo. El uso medido se liquida según el trabajo realmente completado, y toda reserva no utilizada vuelve a la cuenta. Algunas cuentas verificadas tienen acceso incluido a la plataforma y no consumen su saldo personal.",
        "La reserva es una estimación, no siempre el débito final. Los documentos largos pueden generar varios chunks, la verificación de fact-check se cobra por afirmación elegible y el análisis Live por lente seleccionada y ventana completada. La transcripción Live se cobra por la duración real del audio según la tarifa por minuto configurada de OpenAI. Reintentos del proveedor, tokens de razonamiento o una respuesta excepcionalmente costosa pueden dejar el saldo negativo; nuevos análisis quedan bloqueados hasta agregar créditos.",
        "Los paquetes pagados se venden como compras únicas mediante Stripe Checkout. Los créditos solo se conceden después de que Jiddu verifica con Stripe que el pago se completó; el ledger y el historial de transacciones siguen siendo la fuente de verdad para compras y consumo.",
        "Las salvaguardas por cuenta y por solicitud limitan el uso abusivo o accidentalmente ilimitado. Los límites varían según la función y pueden evolucionar con la capacidad de los modelos y los precios de los proveedores.",
      ],
      creditTable: {
        intro:
          "La tabla muestra la reserva inicial máxima con el enrutamiento predeterminado actual. Permite comprobar si hay créditos suficientes antes de empezar; el débito final de las llamadas medidas considera el trabajo realmente completado.",
        headers: {
          feature: "Funcionalidad",
          unit: "Unidad de cobro",
          estimate: "Estimación de créditos necesaria",
        },
        rows: [
          {
            feature: "Detector de falacias",
            unit: "Por chunk de texto completado",
            estimate: "Reserva de hasta 2 créditos",
          },
          {
            feature: "Fact-check — extracción",
            unit: "Por chunk de texto completado",
            estimate: "Reserva de hasta 2 créditos",
          },
          {
            feature: "Fact-check — verificación",
            unit: "Por búsqueda de afirmación elegible",
            estimate:
              "Hasta 2 créditos por afirmación sin caché; los resultados en caché no consumen créditos",
          },
          {
            feature: "Neutralidad",
            unit: "Por chunk de texto completado",
            estimate: "Reserva de hasta 2 créditos",
          },
          {
            feature: "Explicador de papers",
            unit: "Por chunk de texto completado",
            estimate: "Reserva de hasta 2 créditos",
          },
          {
            feature: "Detector de slop",
            unit: "Por chunk de texto completado",
            estimate: "Reserva de hasta 2 créditos",
          },
          {
            feature: "Revisión adversarial — Standard",
            unit: "Por revisión",
            estimate: "Reserva de hasta 21 créditos",
          },
          {
            feature: "Revisión adversarial — Deep",
            unit: "Por revisión",
            estimate: "Reserva de hasta 94 créditos",
          },
          {
            feature: "Transcripción Live",
            unit: "Por duración del audio",
            estimate:
              "{liveCredits} créditos disponibles para comenzar; débito final por duración real",
          },
          {
            feature: "Análisis Live",
            unit: "Por ventana de análisis completada",
            estimate: "Reserva de hasta 3 créditos con las tres lentes",
          },
        ],
        note:
          "Tabla {rateVersion}. Las reservas no utilizadas se liberan. Las estimaciones pueden cambiar con el enrutamiento y los precios de los proveedores; el consumo completado siempre aparece en el ledger de créditos de la cuenta.",
      },
    },
    {
      title: "12. Loop de feedback",
      paragraphs: [
        "Cada tarjeta de afirmación incluye **🚩 Reportar veredicto incorrecto**. El informe registra el veredicto visto por el usuario y una explicación opcional para revisión privada.",
        "Los informes no cambian automáticamente un veredicto ni sustituyen las fuentes citadas. Sirven para orientar la revisión manual y futuras mejoras de calidad.",
      ],
    },
    {
      title: "13. Modo Live (beta)",
      paragraphs: [
        "En [/live](/live), Jiddu transcribe un micrófono o, en navegadores Chromium, una pestaña con `gpt-live-transcribe`. El audio viaja directamente desde el navegador a OpenAI mediante una conexión Realtime cifrada; Jiddu recibe la transcripción necesaria para el análisis, no el audio bruto.",
        "GPT-5.6 Luna o MiniMax M3 analiza periódicamente la transcripción creciente mediante las lentes Live seleccionadas: falacias lógicas, extracción de afirmaciones verificables y neutralidad. El usuario elige un intervalo de 10, 20, 30 o 60 segundos; los intervalos más largos aportan más contexto a cada análisis. Los resultados aparecen en un feed Todos y en paneles dedicados, con una insignia que identifica cada tipo.",
        "Al finalizar, cada lente seleccionada recibe un visor completo compartible. Las afirmaciones detectadas también pueden verificarse con fuentes web directamente en Live, con veredictos y fuentes, o desde el visor completo de fact-check.",
        "Las sesiones están limitadas a 60 minutos, utilizan Créditos Jiddu o acceso incluido y almacenan solo la transcripción y los resultados seleccionados. El audio de pestañas funciona en Chrome y Edge; el micrófono funciona en otros navegadores compatibles.",
      ],
    },
    {
      title: "14. Explain — explicador de artículos",
      paragraphs: [
        "Explain recibe un artículo académico o documento técnico y produce un Mapa del Paper junto con una explicación párrafo por párrafo en lenguaje sencillo. El mapa identifica tipo de paper, tipo de contribución, pregunta central, aporte, enfoque, respuesta principal, evidencia y cualquier limitación declarada por los autores. Cada punto enlaza con los párrafos que lo sustentan. Cada párrafo también recibe una etiqueta de función (Contexto / Objetivo / Método / Resultado / Interpretación / Limitación / Conclusión) y una explicación en el nivel elegido.",
        "Niveles de audiencia: **Niño** (ELI5, analogías cotidianas, sin jerga), **Secundaria** (lenguaje claro, pocos términos técnicos explicados), **Universitario** (registro académico estándar, asume familiaridad con el campo), **Experto** (conciso, nivel de pares, terminología completa conservada). El nivel controla solo la complejidad del texto — no filtra ni valida el contenido.",
        "Las etiquetas de función y el Mapa del Paper son algorítmicos. Los párrafos se explican en chunks; después, una síntesis final acotada toma muestras de todos los roles semánticos y usa el resumen de cada chunk para construir el mapa global. Los artículos interdisciplinarios o los documentos con estructura no estándar pueden recibir etiquetas o puntos de mapa incorrectos.",
        "A diferencia de los pipelines de texto general, Explain está optimizado para artículos académicos estructurados. Los resultados en posts de blog, escritos legales o textos no estructurados serán de menor calidad.",
        "**Modelos y por qué.** GPT-5.6 Luna o MiniMax M3 transforma el texto suministrado en lugar de investigar literatura o validarlo de forma independiente. Explain no realiza búsqueda web ni comprobación de citas.",
        "Las evaluaciones actuales comprueban la cobertura de funciones, la calibración de la audiencia y la fiabilidad de la estructura, no la fidelidad factual frente a anotaciones de expertos. Explain puede simplificar demasiado una salvedad o interpretar un método con una confianza indebida; debe facilitar la entrada al texto fuente, nunca sustituirlo.",
      ],
    },
    {
      title: "15. Revisión adversarial de papers",
      paragraphs: [
        "La revisión adversarial acepta un PDF final, venue objetivo, edición, track, tipo de paper y fecha opcional. El resultado incluye recomendación, resumen, fortalezas, debilidades localizadas, preguntas, checklist de reproducibilidad, referencias y el estándar del venue aplicado.",
        "Metodológicamente, Jiddu adapta las dimensiones de revisión **SPECS** — Story, Presentation, Evaluations, Correctness y Significance — y el patrón de síntesis y autocrítica por etapas descrito en [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu es una implementación independiente, con su propio ledger de afirmaciones y evidencias, calibración por venue, parser, contrato de salida y salvaguardas; no reproduce el sistema de AAAI-26.",
        "La revisión examina **Story, Presentation, Evaluations, Correctness y Significance**, consulta literatura publicada y desafía su propia síntesis antes de devolver los hallazgos retenidos. No ejecuta código del manuscrito.",
        "**Modelos y por qué.** El modo Estándar utiliza GPT-5.6 Luna o MiniMax M3 con otra familia de modelos en la crítica de calidad. El modo Profundo añade razonamiento GPT-5.6 Luna Pro y auditoría independiente por Claude Opus 4.8; tarda más y cuesta más.",
        "En el benchmark sintético SPECS de 30 casos, GPT-5.4 mini, GPT-5.5, GPT-5.6 Luna y GPT-5.6 Luna Pro detectaron todos los defectos insertados. Luna Pro produjo un 8 % menos de hallazgos que Luna estándar, pero el benchmark alcanzó un techo y no demuestra superioridad en papers completos.",
        "El descubrimiento de venues utiliza [DBLP](https://dblp.org) y perfiles verificados de conferencias seleccionadas. Los perfiles verificados aplican criterios oficiales citados; los venues sin perfil utilizan una rúbrica académica general claramente identificada.",
        "Cada debilidad sustantiva debe incluir página o sección del manuscrito y severidad `MAJOR`, `MODERATE` o `MINOR`. La revisión sigue siendo automatizada: puede omitir problemas, inventar comparaciones o aplicar mal un criterio, y no es revisión oficial por pares ni predicción de aceptación.",
      ],
    },
    {
      title: "16. API pública & MCP (para agentes)",
      paragraphs: [
        "Los análisis de texto están disponibles a través de una API REST pública, mientras que la revisión adversarial se ejecuta como un job asíncrono adecuado para flujos de agentes más largos. Las solicitudes están vinculadas a una cuenta Jiddu verificada y utilizan acceso incluido o Créditos Jiddu.",
        "El servidor MCP alojado expone las herramientas de texto y la revisión adversarial. Los clientes compatibles utilizan [WorkOS AuthKit MCP](https://workos.com/docs/authkit/mcp) para el inicio de sesión OAuth y el acceso restringido al recurso.",
        "Los endpoints, payloads, autenticación y snippets de configuración están documentados en [/api-access](/api-access).",
      ],
    },
    {
      title: "17. Metodología y evaluación",
      paragraphs: [
        "[Claimify](https://arxiv.org/abs/2502.10855) orienta la extracción de afirmaciones, y [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) orienta la evaluación de veredictos, los tiers de fuentes y la imparcialidad. [no-ai-slop](https://github.com/petergyang/no-ai-slop) aporta la taxonomía inicial para detectar patrones de escritura.",
        "La revisión adversarial de papers adapta las dimensiones SPECS y la síntesis y autocrítica por etapas descritas en [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu añade ledger, extracción con LiteParse, descubrimiento vía DBLP, perfiles de venue, validación de fuentes y gate de retención propios. No está afiliado a esos grupos, DBLP ni los venues.",
        "La evaluación publicada actualmente incluye el [benchmark PolitiFact de 200 afirmaciones](/benchmark) y un benchmark sintético SPECS de 30 casos. Ambos documentan sus límites y ninguno garantiza corrección en un texto o paper nuevo.",
        "El disclaimer completo de lo que Jiddu afirma y no afirma está en [/legal](/legal).",
      ],
    },
  ],

  not_found_label: "Error 404",
  not_found_title: "Este camino no lleva a ninguna parte.",
  not_found_subtitle:
    "La verdad es una tierra sin caminos — pero esto es solo un enlace roto. La página que buscabas no está aquí.",
  not_found_cta: "Volver a tierra firme",

  analysis_failed: "Falló el análisis",
  try_again: "Reintentar",
  ingest_blocked_title: "El sitio rechazó nuestra solicitud",
  ingest_blocked_hint:
    "Muchos medios bloquean lectores automatizados o esconden el contenido tras un muro de pago. Abre el artículo en tu navegador, copia el cuerpo y pégalo aquí.",
  ingest_not_found_title: "Página no encontrada",
  ingest_not_found_hint:
    "La URL devolvió 404. Verifica el enlace o pega el texto directamente.",
  ingest_rate_limited_title: "El sitio nos pidió bajar el ritmo",
  ingest_rate_limited_hint:
    "Recibimos una respuesta de límite de tasa (429). Espera un minuto y vuelve a intentar, o pega el texto directamente.",
  ingest_timeout_title: "El sitio tardó demasiado en responder",
  ingest_timeout_hint:
    "Desistimos tras 15 segundos. Intenta de nuevo o pega el texto directamente.",
  ingest_unreachable_title: "No pudimos acceder a esa URL",
  ingest_unreachable_hint:
    "Error de DNS o de red. Revisa la dirección o pega el texto directamente.",
  ingest_extraction_failed_title: "No pudimos extraer el artículo",
  ingest_extraction_failed_hint:
    "La página cargó pero no encontramos un cuerpo legible. Pega el texto directamente.",
  ingest_invalid_url_title: "URL inválida",
  ingest_too_short_title: "Texto demasiado corto",
  switch_to_paste: "Pegar texto",

  a11y_show_fallacy: "Ver comentario de la falacia",
  a11y_show_claim: "Ver verificación de la afirmación",
  a11y_show_signal: "Ver detalle de la señal de sesgo",
  a11y_show_explanation: "Ver explicación del párrafo",

  new_analysis: "Nuevo análisis",
  share: "Compartir",
  copied: "Copiado",
  no_fallacies: "No se detectaron falacias.",
  pending: "pendiente",
  finding_count: (count, total) =>
    `${count} ${count === 1 ? "hallazgo" : "hallazgos"} en ${total} oraciones`,
  read_more: "Saber más",

  score_label: "Puntuación",
  score_clean: "razonamiento limpio",
  score_minor: "problemas menores",
  score_several: "varias falacias",
  score_high: "muy falaz",
  score_propagandistic: "propagandístico",

  severity_low: "baja",
  severity_high: "alta",

  guide_title: "Guía de falacias",
  guide_subtitle:
    "Una referencia breve para las falacias lógicas y retóricas que Jiddu puede detectar.",
  guide_example: "Ejemplo",
  guide_back: "Volver al inicio",
  guide_credit_prefix: "Selección de falacias basada en",
  guide_credit_suffix: "— todas las descripciones y ejemplos son propios de Jiddu.",

  nav_fallacies: "Guía de falacias",
  nav_slop_patterns: "Patrones de slop",
  nav_benchmark: "Benchmark",
  nav_pricing: "Precios",

  theme_to_dark: "Cambiar a modo oscuro",
  theme_to_light: "Cambiar a modo claro",

  share_link_label: "Compartir este análisis",
  share_link_hint: "Haz clic para copiar el enlace",
  link_copied: "Enlace copiado",
  scroll_to_bottom: "Bajar al final",
  scroll_to_top: "Volver arriba",

  close: "Cerrar",
  open_in_guide: "Abrir en la guía completa",
  category: "Categoría",
  mobile_hint_title: "Consejo de lectura",
  mobile_hint_body:
    "Toca cualquier pasaje resaltado para leer la explicación de la falacia en un pop-up.",
  mobile_hint_dismiss: "Entendido",
  finding_from_text: "Del texto",
  finding_about_this_fallacy: "Sobre esta falacia",

  live_subtitle:
    "Escucha en tiempo real y sigue falacias, afirmaciones verificables y señales de parcialidad mientras la persona habla.",
  live_source_mic: "Micrófono",
  live_source_tab: "Pestaña del navegador",
  live_source_tab_chrome_only: "Solo Chrome",
  live_source_tab_tooltip: "Capturar audio de una pestaña del navegador",
  live_source_tab_unsupported: "La captura de pestaña requiere Chrome o Edge",
  live_language_follows_header: "El idioma sigue el selector del encabezado.",
  live_lenses_title: "Lentes en vivo",
  live_lenses_hint: "Elige qué debe monitorear Jiddu durante esta sesión.",
  live_lens_fallacy: "Falacias",
  live_lens_factcheck: "Afirmaciones para verificar",
  live_lens_neutrality: "Neutralidad",
  live_all: "Todos",
  live_no_results_yet:
    "Aún no se detectaron resultados. Aparecerán aquí mientras la persona habla.",
  live_interval_title: "Intervalo de análisis",
  live_interval_hint:
    "Cuanto mayor sea el intervalo, más contexto tendrá Jiddu para cada análisis.",
  live_start: "Iniciar",
  live_stop: "Detener y finalizar",
  live_findings: "Falacias",
  live_running_score: "Puntuación parcial",
  live_privacy_note:
    "El audio se transmite directamente desde tu navegador a la API Realtime de OpenAI vía WebRTC. El audio en bruto no se almacena — solo se guardan la transcripción y los resultados seleccionados, disponibles en URLs compartibles cuando detengas la sesión.",
  live_status_connecting: "Conectando…",
  live_status_live: "En vivo",
  live_status_analyzing: "Analizando",
  live_status_stopped: "Detenido",
  live_status_finalizing: "Finalizando…",
  live_status_error: "Error",
  live_transcript_listening: "Escuchando… habla por el micrófono.",
  live_transcript_idle: "Haz clic en Iniciar para empezar a transcribir.",
  live_no_findings_yet:
    "Aún no se detectaron falacias. Aparecerán aquí mientras la persona habla.",
  live_no_claims_yet:
    "Aún no se detectaron afirmaciones verificables. Aparecerán aquí mientras la persona habla.",
  live_no_neutrality_yet:
    "Aún no se detectaron señales de parcialidad. La evaluación parcial aparecerá aquí.",
  live_claim_detected: "Detectada en vivo · verifica después de finalizar",
  live_partial_verdict: "Evaluación parcial",
  live_confidence: "Confianza",
  live_session_saved: "Sesión guardada.",
  live_view_analysis: "Ver análisis de falacias",
  live_view_factcheck: "Ver y verificar afirmaciones",
  live_view_neutrality: "Ver evaluación de neutralidad",
  live_start_new: "Nueva grabación",
};

export const MESSAGES: Record<Lang, Messages> = { en, pt, es };

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};
