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
  see_demo_hint: string;
  bench_badge_label: string;
  bench_badge_link: string;
  pipelines_heading: string;
  pipelines_subheading: string;
  pipeline_fallacy_desc: string;
  pipeline_factcheck_desc: string;
  pipeline_neutrality_desc: string;
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
  nav_source: string;

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
  how_it_works_sections: Array<{ title: string; paragraphs: string[] }>;
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
  live_session_saved: string;
  live_view_analysis: string;
  live_start_new: string;
};

const en: Messages = {
  tagline: "truth is a pathless land",

  hero_title: "Read anything with a critical mind.",
  hero_subtitle:
    "Upload a PDF, paste text, or drop a URL. Jiddu highlights the passages that contain logical fallacies and explains each one in a comment — just like a reviewer in Word — and gives the whole piece a fallacy score from 0 to 100.",
  home_hero_subtitle:
    "Drop a PDF, paste text, or add a URL — then pick a lens: fallacies, fact-checking, neutrality, explanation, AI-slop detection, or a full adversarial paper review.",
  privacy: "Privacy:",
  privacy_body:
    "your content — including selected PDF page images when visual inspection is needed — is sent to the chosen model via OpenRouter and stored locally under a shareable id.",
  see_demo: "See a demo",
  see_demo_hint: "Want a quick look without running an analysis?",
  bench_badge_label:
    "Pipeline validated · 67.5% match with PolitiFact in a 200-claim benchmark",
  bench_badge_link: "view report",
  pipelines_heading: "Six lenses for critical reading",
  pipelines_subheading:
    "Pick a mode in the form above, or open a sample analysis to see what each one looks like.",
  pipeline_fallacy_desc:
    "Highlights every passage that contains a logical fallacy and explains each one in a Word-style margin comment. Outputs a fallacy score from 0 to 100.",
  pipeline_factcheck_desc:
    "Pulls every verifiable claim — numbers, dates, quotes, causal and categorical assertions — and optionally checks each against the live web via Perplexity Sonar with cited sources.",
  pipeline_neutrality_desc:
    "Surfaces the framing, attribution and source-selection patterns that make a text partisan even when nothing is factually false. Deliberately does NOT classify left/right.",
  quality_card_heading: "Quality, measured against humans",
  quality_card_body:
    "We benchmarked the fact-check pipeline against 200 PolitiFact-labeled claims. Jiddu's verdict matched the human verdict on 81.3% of the unambiguous true / false / pants-on-fire claims, with strict polar disagreement in only 4.5% of cases.",
  quality_card_link: "Full methodology and confusion matrix",

  footer_quote: "“The moment you follow someone, you cease to follow truth.”",
  footer_balance: (amount) => `${amount} left in API credits`,

  tab_url: "URL",
  tab_paste: "Paste text",
  tab_file: "PDF / TXT",
  tab_live: "Live",
  tab_factcheck: "Fact-check",
  url_placeholder: "https://example.com/article",
  paste_placeholder: "Paste the text you want to analyze…",
  file_drop_hint: "Drop a PDF or TXT, or click to choose",
  file_size_hint: "Up to ~200k characters",
  model: "Model",
  model_anthropic: "Claude (Anthropic)",
  model_openai: "GPT (OpenAI)",
  analyze: "Analyze",
  starting: "Starting…",
  form_hint: "Comments appear as the analysis runs. Don't close the page.",

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
    "Upload a paper or paste its text, pick a level, and Jiddu explains every paragraph in the margin — decoding the jargon and showing how each part fits the argument.",
  explain_cta: "Explain",
  explain_failed: "Explanation failed",
  loader_explain: [
    "Reading the paper",
    "Mapping its structure",
    "Explaining each paragraph",
    "Translating the jargon",
    "Connecting the argument",
  ],
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
  explanations_count_one: "explanation",
  explanations_count_many: "explanations",
  explain_empty: "No explanations were produced for this document.",
  explain_footer: (model) =>
    `Explained by ${model} via Jiddu. Automated explanations can misread a paper — always check against the source.`,
  pipeline_explain_desc:
    "Upload a paper and get a plain-language explanation of every paragraph, at the level you choose — from child to expert.",

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
      title: "Authentication",
      paragraphs: [
        "Send your API key in the `X-Jiddu-Key` header. Keys are issued by the operator — see “Getting a key” below.",
        "```\ncurl -X POST https://jiddu.app/api/v1/detect-fallacies \\\n  -H \"content-type: application/json\" \\\n  -H \"X-Jiddu-Key: YOUR_KEY\" \\\n  -d '{\"text\": \"Everyone agrees this is best, so critics must be fools.\"}'\n```",
      ],
    },
    {
      title: "MCP server",
      paragraphs: [
        "For agents, connect to the hosted Jiddu MCP server by URL — nothing to install or clone. It exposes the five text tools plus `start_adversarial_review` and `get_adversarial_review`, and bridges to your MCP client (e.g. Claude Desktop) via the public `mcp-remote` helper:",
        "```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\", \"--header\", \"X-Jiddu-Key:your-key-here\"]\n    }\n  }\n}\n```",
        "Machine-oriented docs — when to use each tool, response shapes, and how to chain them — live in [AGENT.md](https://github.com/rafaehlers/jiddu/blob/main/packages/jiddu-mcp/AGENT.md).",
      ],
    },
    {
      title: "Limits & reliability",
      paragraphs: [
        "Text tools are capped at 2000 characters per request. Review jobs accept one public or uploaded PDF up to 25 MB and reject papers above 300,000 extracted characters rather than truncating them. Rate limits are per key; exceeding them returns HTTP 429 with a `retry_after_seconds` field. Outputs are automated and can be wrong — treat them as signals to prompt verification, not as final authority.",
        "Quality is measured against fixed test sets published in the repo: [evals/report.md](https://github.com/rafaehlers/jiddu/blob/main/evals/report.md).",
      ],
    },
    {
      title: "Getting a key",
      paragraphs: [
        "Keys are issued manually for now. Open an issue on [GitHub](https://github.com/rafaehlers/jiddu) to request one.",
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
  legal_last_updated: "Last updated: 2026-07-27",
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
        "Neutrality scores and the paragraph-by-paragraph explanations are likewise automated interpretations, not statements of fact — the explanations describe what a text says and how it is structured, never whether its claims are correct. Audience level changes only the prose; section-role tags are best-effort guesses.",
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
        "Each completed analysis or paper review receives an unlisted share URL and is stored on a server in Brazil. Anyone with the URL can view the final result, but these pages are not enumerated in the public sitemap. There are no user accounts; private intermediate review stages are not exposed in the public viewer.",
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
        "Paper review has a separate [30-case synthetic SPECS benchmark](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md). GPT-5.4 mini and GPT-5.5 detected all 30 injected defects; GPT-5.5 returned 30.6% fewer, more consolidated findings. The set reached a ceiling and does not establish accuracy on complete real-world papers.",
      ],
    },
    {
      title: "7. Contact",
      paragraphs: [
        "Operator: Rafael de Menezes Ehlers. For takedown requests, corrections, or other concerns, open an issue on [GitHub](https://github.com/rafaehlers/jiddu).",
      ],
    },
  ],

  how_it_works_title: "How Jiddu works",
  how_it_works_subtitle:
    "Technical walkthrough of every pipeline. Nothing is hidden — the source code is open under AGPL-3.0 at github.com/rafaehlers/jiddu, so anything described below can be cross-checked against the actual implementation.",
  how_it_works_sections: [
    {
      title: "1. The big picture",
      paragraphs: [
        "Jiddu runs six independent analyses: a fallacy detector, a fact-check pipeline (extraction + Sonar-based verdict), a neutrality assessment, a paragraph-by-paragraph paper explainer, an AI-slop detector, and an adversarial review of one autonomous paper with a published-literature check. They are separate routes in the app (`/`, `/factcheck`, `/neutrality`, `/explain`, `/slop`, `/review`) and separate database tables. None of them is required by the others.",
        "The five text pipelines stream structured tool-call output from an LLM via [OpenRouter](https://openrouter.ai); their JSON Schemas are controlled by Jiddu and [partial-json](https://github.com/promplate/partial-json) lets findings appear while the model is still writing. Paper review also uses SSE, but to report nine coarse stages; each stage completes and validates a full structured artifact before the next begins.",
        "All output is in the user's UI language. The same prompt is used regardless of which model the user picks — the language difference comes from a single `OUTPUT LANGUAGE:` line in the system prompt.",
      ],
    },
    {
      title: "2. Input: ingestion and segmentation",
      paragraphs: [
        "**URL.** The fetch uses browser-like request headers so simple bot filters are less likely to reject it. Every redirect is DNS-resolved and blocked if it reaches a private, loopback, link-local, carrier-grade NAT, multicast or reserved IPv4/IPv6 range. Response size is capped at 5 MB, then [@mozilla/readability](https://github.com/mozilla/readability) extracts the article body.",
        "**PDF.** Parsed locally with [LiteParse](https://github.com/run-llama/liteparse) as the primary parser and [pdfjs-dist](https://mozilla.github.io/pdf.js/) as fallback. The five text pipelines use LiteParse's fast mode; adversarial review uses academic mode to preserve page-scoped Markdown, spatial reading order, selective OCR, complexity signals and screenshots. The raw PDF is not uploaded as a file, but review sends selected rendered page images through OpenRouter when visual inspection is relevant.",
        "**Paste.** Used as-is, only whitespace-normalized.",
        "**Segmentation.** The extracted text is split into sentences with an abbreviation-aware splitter (`src/lib/sentences.ts`) — it recognizes Portuguese abbreviations (`sr.`, `dr.`, `prof.`), keeps initialisms like `U.S.` intact, and doesn't break in the middle of numbers like `3,4%`. Sentences are grouped into chunks of ~12k characters (`src/lib/chunker.ts`) so long documents fit the model context window without losing sentence boundaries.",
      ],
    },
    {
      title: "3. Models and fallback",
      paragraphs: [
        "Two model families are exposed in the picker: [🇺🇸 GPT-5.4 mini](https://openrouter.ai/openai/gpt-5.4-mini) (default) and [🇨🇳 MiniMax M3](https://openrouter.ai/minimax/minimax-m3). Offering both lets users compare borderline interpretations and avoids making every analysis depend on one provider.",
        "If the user-picked model fails *before emitting any event* (rate-limit from upstream, 5xx, etc.), the request falls through to the other model automatically — client-side retry, no UI flicker. Once the model has emitted at least one finding/claim, we don't retry: we accept the partial output and let the partial-parse layer salvage it.",
        "Sonar Reasoning Pro is used exclusively for fact-check verdicts (because it has built-in web search). It is never exposed in the model picker.",
      ],
    },
    {
      title: "4. Fallacy detector",
      paragraphs: [
        "Catalog of 46 fallacies covering relevance, ambiguity, presumption, emotional appeals, causal reasoning and evidence. Each fallacy has a stable id and a distinct color (golden-angle hue distribution) used to highlight passages. The full list is at [/fallacies](/fallacies).",
        "The system prompt instructs the model to be rigorous and conservative — flag only when there is a clear, defensible fallacy. Two specific rules tighten this: a **disambiguation** clause (don't flag a sentence with multiple plausible readings unless context resolves it) and a **standalone-explanation** clause (each explanation must name the implied premise and conclusion so a reader doesn't need to re-read the source). Both clauses are distilled from the Claimify paper (Microsoft Research 2025).",
        "Each finding has a binary severity (`low` / `high`). The overall fallacy score (0-100) is a weighted average across chunks, weighted by character count. The score range labels (`clean reasoning` / `minor issues` / `several fallacies` / `highly fallacious` / `propagandistic`) are spelled out in the prompt itself so the model has the same calibration the UI uses.",
        "**Model routing and why.** The selected GPT-5.4 mini or MiniMax M3 performs the complete classification in one structured pass per chunk. This task uses an economical model because the reasoning space is tightly constrained by a fixed 46-item catalog, exact source sentences and a JSON Schema; there is no web search or second-model critic. The alternative model remains available so users can compare borderline interpretations from a different model family.",
        "Chunks run with bounded concurrency and stream findings as soon as they validate. A failed chunk does not erase successful ones; the final score is computed deterministically from the surviving chunk scores, weighted by character count. That resilience also means a result can be partial, so the score is a reading aid rather than a probability that the document is 'fallacious.'",
        "The repository includes regression evals for expected detections and false-positive traps, but Jiddu has not yet published a human-labeled accuracy benchmark for this pipeline. A missing flag is not proof of sound reasoning, and a highlighted passage still requires the reader to judge whether the named fallacy actually applies.",
      ],
    },
    {
      title: "5. Slop detector",
      paragraphs: [
        "Same architecture as the fallacy detector — same ingestion, chunking, streaming, model fallback and char-weighted 0-100 score — with a different catalog and prompt, persisted to its own table (results at `/s/:id`, same margin-comment viewer, print view and demos at `/s/demo-en|pt|es`).",
        "The catalog covers 18 AI-slop writing patterns in five families: stock wording, manufactured drama, templated structure, hollow substance, and format tics. The full list with definitions and examples is at [/slop-patterns](/slop-patterns). The pattern selection is based on Peter Yang's MIT-licensed [no-ai-slop](https://github.com/petergyang/no-ai-slop) editing skill; the catalog wording, trilingual content and detection prompt are Jiddu's own.",
        "The prompt detects **patterns, not authorship** — it is forbidden from claiming a text was or wasn't written by AI (humans write slop too). Every finding quotes the exact span, names the pattern, and says in a few words what a cleaner version would do (state the point, name the source, give the number) without rewriting anything. Score bands: 0-15 reads human, 16-35 light seasoning, 36-60 patterned, 61-80 heavily templated, 81-100 assembly-line prose.",
        "**Model routing and why.** As in fallacy detection, the selected GPT-5.4 mini or MiniMax M3 handles every chunk against a closed catalog and structured schema. No detector model, watermark classifier or authorship model is involved: the LLM is acting as a constrained style critic. The economical models are sufficient for this surface-pattern task, while the second family gives users a useful comparison on prose that sits near a category boundary.",
        "Chunk failures are isolated and successful findings continue to stream. Jiddu combines the completed chunk scores by character count and takes the summary from the highest-scoring completed chunk; it never infers authorship from that aggregate. Long documents can therefore produce a useful partial result, but the number is only a density indicator for the catalogued patterns.",
        "The versioned eval set checks representative positives, clean prose and the no-authorship guardrail, but it is not a population-level benchmark of human versus machine writing. Deliberately so: the feature answers 'which stock patterns are present?', not 'who or what wrote this?'",
      ],
    },
    {
      title: "6. Fact-check — claim extraction",
      paragraphs: [
        "Modelled on [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). The prompt asks the model to walk every sentence through four stages: **selection** (keep only sentences with a verifiable claim — opinions, value judgements, rhetorical questions get dropped), **disambiguation** (drop sentences with multiple plausible readings when context doesn't resolve them), **decomposition** (split multi-fact sentences into separate claims without chasing infinite atomicity), and **decontextualization** (every emitted claim must stand alone — resolve pronouns, add the year for a number that depends on it, attribute a quote to its source).",
        "Each emitted claim is typed: `numeric`, `date`, `quote`, `causal`, or `categorical`. The type informs how the verifier later searches for evidence.",
        "Hard cap of 50 claims per extraction (operator-configurable). The cap exists because each claim later costs Sonar credits to verify; an uncapped extraction on a 30-page PDF could rack up serious money before the user notices.",
        "**Model routing and why.** The selected GPT-5.4 mini or MiniMax M3 performs extraction only; it is not asked whether a claim is true. Claimify-style selection rules and a strict schema make this a bounded information-extraction task, so the economical picker models are used here and the expensive search model is reserved for claims the user actually chooses to verify.",
        "Extraction streams claim cards while chunks run in parallel. Each claim retains the exact source sentence plus a self-contained statement, which lets the reader audit decontextualization before spending on verification. If one chunk fails, claims from completed chunks remain available; the interface must therefore not be read as proof that every checkable statement was found.",
      ],
    },
    {
      title: "7. Fact-check — per-claim verdict",
      paragraphs: [
        "Verdict is opt-in. Extraction alone is cheap (one LLM call). Verification is on demand: the user clicks **Verify claims** in the viewer and each claim is sent to [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro), one call per claim, with bounded concurrency (6 parallel by default).",
        "Sonar returns a JSON payload with the verdict (`supported` / `contradicted` / `mixed` / `unverified`), a confidence between 0 and 1, a rationale, and a list of cited sources collected from Sonar's `annotations` channel. If confidence is below 0.5, the verdict is forced to `unverified` — better to surface 'not enough evidence' than to ship a confident wrong call.",
        "Every cited source is classified into one of six tiers (per Goldfarb et al. 2025): `primary` (official data agencies, court rulings, peer-reviewed papers), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. A separate boolean flag marks `state-controlled` outlets (RT, CGTN, Xinhua, etc. — but not BBC/NPR/Deutsche Welle, which are state-FUNDED but editorially independent).",
        "Verdict language is intentionally cautious about named people: never 'X is lying' or 'this is false' — always 'evidence does not support' / 'evidence contradicts the figure' / 'we could not find evidence that supports'. This is a hard rule in the system prompt.",
        "**Model routing and why.** Perplexity Sonar Reasoning Pro is fixed for verification because this stage needs current web retrieval and source annotations, not just stronger closed-book prose generation. GPT-5.4 mini and MiniMax M3 never manufacture verdict citations; they stop after extraction. Keeping extraction and verification in different calls also makes cost, cache behavior and failures visible per claim.",
        "Claims are verified independently, so one timeout or weak evidence set does not invalidate the others. Jiddu normalizes Sonar's structured response, applies the confidence floor, preserves the cited URLs and stores the model id used. Source tiers describe the kind of source, not an automatic truth score: a primary source can still be outdated or misread.",
        "How accurate is this in practice? We benchmarked the pipeline against [PolitiFact's human-labeled corpus](/benchmark). On 200 claims drawn from PolitiFact's four polar buckets (true / mostly-true / false / pants-on-fire, 2020-onward), Jiddu's verdict matched the human polar verdict in 67.5% of cases overall and 81.3% on the unambiguous true / false / pants-on-fire buckets. Strict polar disagreement — Jiddu calling a claim the opposite of the human — happened in only 4.5% of cases (9 of 200). The remaining ~28% were Jiddu returning `mixed` or `unverified` instead of a polar verdict, concentrated on PolitiFact's `mostly_true` bucket (where 58% became `mixed` — a structural overlap, not a miss, since both labels describe partial truth). Full methodology, confusion matrix and disagreement analysis at the link.",
      ],
    },
    {
      title: "8. Fact-check — verdict cache",
      paragraphs: [
        "Each verified claim is hashed and stored. The hash is `sha256(lang + ':' + normalize(statement))` where `normalize` lowercases, strips combining-mark accents, collapses whitespace and removes trailing punctuation. That means rewordings of the same claim collide, but cross-language doesn't.",
        "TTLs are per claim type. `numeric` 30 days (IBGE and friends revise series), `date` and `categorical` 365 days (historical facts and definitions are stable), `quote` and `causal` 90 days (re-examinable but unlikely to flip). A best-effort sweep deletes expired rows on the cache-miss path, rate-limited to once every 30 minutes so the hot path stays cheap.",
        "The user can bypass the cache with a per-claim **refresh** button (forces a fresh Sonar call). That counts against an operator-configurable refresh quota — default is 2 refreshes per claim. After that, the button hides and the API returns 429.",
      ],
    },
    {
      title: "9. Neutrality",
      paragraphs: [
        "Distinct from fallacy detection: a text can be fallacy-free and factually accurate while still using loaded framing, asymmetric attribution or one-sided sourcing. Neutrality surfaces those patterns.",
        "Eight issue types are flagged at the sentence level: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. The model also classifies the document into one of seven text types (informational / opinion / political speech / advocacy / analysis / marketing / social_media) which informs how strict the audit is.",
        "The document-level verdict is one of `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. Jiddu **deliberately does not classify partisan direction** (left/right, pro-X/anti-Y). The Forum AI paper that inspired the methodology requires a bipartisan expert panel for that step; without one, partisan labels are unreliable and harmful. We surface specific patterns the reader can audit instead.",
        "**Model routing and why.** The selected GPT-5.4 mini or MiniMax M3 performs text-type classification, sentence-level issue detection and the chunk verdict in the same structured call. This pipeline does not browse the web and does not decide whether the underlying claims are true; using the economical picker model keeps framing analysis fast, while the alternative family supports side-by-side sensitivity checks.",
        "For long texts, chunks are analyzed in parallel. The final document verdict is then selected deterministically as the most severe completed chunk verdict (`manipulation` above `explicitly_partisan`, above `partisan_lean`, above `neutral`); confidence and rationale come from the strongest chunk at that level, and document type is the mode across chunks. This intentionally favors recall, so one strongly framed passage can govern the headline verdict.",
        "The eval suite exercises the eight signals and examples designed not to be flagged, but there is no published human-panel benchmark for neutrality yet. The verdict is therefore a navigation aid into auditable passages, not an objective measurement of political balance.",
      ],
    },
    {
      title: "10. Storage, privacy and review status",
      paragraphs: [
        "There are no user accounts. Completed results use unlisted share URLs: anyone with the URL can view the final result, but those pages are not enumerated in the public sitemap. Paper-review ledgers, research and draft judgements are internal intermediate artifacts and are not exposed in the public result.",
        "Submitted content goes through OpenRouter to the upstream serving the chosen model. Paper review includes selected rendered page images, not only extracted text. Its literature stage searches public scholarly sources using technical claims while prompts prohibit queries by paper title, author name or other manuscripts by the same authors. Venue autocomplete sends only the typed venue query to DBLP. We log the request IP for rate-limiting and abuse signalling and do not sell it.",
        "Results are automated and unreviewed by default. A result explicitly marked as reviewed has been spot-checked by the operator; that status is an additional human check, not a guarantee that every finding is correct.",
      ],
    },
    {
      title: "11. Cost and abuse controls",
      paragraphs: [
        "Every cost-incurring route has an in-memory token-bucket rate limit per IP. Defaults include 30 fallacy analyses / hour, 30 fact-check extractions / hour, 10 bulk verifications / hour, 20 per-claim refreshes / hour and a deliberately conservative 4 paper reviews / hour with burst capacity 2. The operator can tune these values at runtime; exhausted buckets return 429 with `Retry-After`.",
        "Fact-check extraction caps at 50 claims per document and per-claim refresh at 2 calls. Paper review accepts exactly one PDF, refuses to silently truncate past 300,000 extracted characters, limits visual inspection to selected pages and splits the costly work into auditable stages. These controls prevent accidental unbounded fan-out and bills.",
      ],
    },
    {
      title: "12. Feedback loop",
      paragraphs: [
        "Every fact-check claim card has a **🚩 Report wrong verdict** button. Clicking it captures an optional reason and snapshots the current statement and verdict, so the operator can review what the user saw even if the claim is later re-verified.",
        "Submitted flags enter a private moderation queue with status `open`. The operator can mark each as `resolved` (concur with the user, plan to fix) or `ignored` (the verdict was correct, or the flag was spam), or delete it.",
        "Reports do not automatically change a verdict. The operator reviews each entry manually, so report volume alone cannot overturn the evidence shown to readers.",
      ],
    },
    {
      title: "13. Live mode (beta)",
      paragraphs: [
        "A separate pipeline at [/live](/live): the page captures audio from the user's microphone or, on Chromium browsers, from a browser tab via `getDisplayMedia`. The audio is streamed *directly from the browser to OpenAI's Realtime API* over WebRTC — it never passes through the Jiddu server. The transcription model is `gpt-realtime-whisper`, and the language is honored from the i18n header selector (EN / PT / ES).",
        "How the wiring works: when the user presses **Start**, the browser calls `POST /api/live/token` to mint a short-lived ephemeral client secret (the Jiddu server holds the actual `OPENAI_API_KEY`; the browser never sees it). The browser then opens the WebRTC peer-connection to OpenAI using that secret and starts receiving transcript deltas. Every ~500 new characters (or every 30 seconds, whichever comes first), a separate SSE call to `POST /api/live/analyze` ships the cumulative transcript and runs the same fallacy prompt used everywhere else — this analysis step is a different call from the OpenAI transcription above, routed via OpenRouter with the same GPT-5.4 mini / MiniMax M3 picker as the text-analysis pipelines. Findings stream back into the UI in near-real-time. On **Stop**, a final `finalize: true` call commits the session as a normal `/a/<id>` analysis, indistinguishable downstream from a pasted-text analysis.",
        "Cost is bounded by a hard 60-minute session cap (≈ \\$1 of Realtime + LLM analysis cost per session). The raw audio is never stored — only the transcript and the detected findings are persisted. The page is intentionally not linked from the nav while in beta — reach it by typing `/live` in the URL bar. Tab-audio capture works in Chrome / Edge only because Safari and Firefox don't expose tab audio through `getDisplayMedia`; the microphone source works everywhere.",
      ],
    },
    {
      title: "14. Explain — paper explainer",
      paragraphs: [
        "The Explain pipeline (`/explain`, results at `/e/:id`) takes an academic paper or technical document and produces a paragraph-by-paragraph plain-language explanation. Each paragraph gets a role tag (Background / Objective / Method / Result / Interpretation / Limitation / Conclusion) and an explanation written at the chosen audience level. A whole-document overview is generated first.",
        "Audience levels: **Child** (ELI5, everyday analogies, no jargon), **High school** (clear language, a few technical terms explained), **Undergraduate** (standard academic register, assumes field familiarity), **Expert** (concise, peer-level, full terminology retained). The level controls prose complexity only — it does not filter or validate content.",
        "Role tagging is algorithmic. The model reads each paragraph in context and assigns the role that best describes its function in the argument. Interdisciplinary papers or documents with non-standard structure may receive incorrect tags.",
        "Unlike the general-text pipelines, Explain is optimised for structured academic papers. Results on blog posts, legal filings, or unstructured prose will be lower quality.",
        "**Model routing and why.** The selected GPT-5.4 mini or MiniMax M3 writes the overview, role tags and paragraph explanations in one schema-constrained pass per chunk. Explanation favors the economical picker models because the task is transformation of supplied text rather than literature research or independent validation; no web search, citation check or second-model critic is run.",
        "Chunks execute with bounded concurrency and explanations stream into the margin as they arrive. Each chunk can propose an overview, but Jiddu deterministically keeps the earliest non-empty overview because the first chunk normally contains the abstract and introduction. A failed chunk leaves the other paragraph explanations intact, so gaps remain possible on long or unusually formatted papers.",
        "The current evals check role coverage, audience calibration and schema reliability, not factual faithfulness against expert annotations. Explain can simplify a caveat away or confidently misread a method; it should make the source easier to enter, never substitute for reading it.",
      ],
    },
    {
      title: "15. Adversarial paper review",
      paragraphs: [
        "The review pipeline (`/review`, results at `/r/:id`) accepts exactly one final PDF as an autonomous manuscript, plus target venue, edition, track, paper type and optional review date. It does not combine supplements or multiple files. The public result includes the gatekeeping recommendation, summary, strengths, localized weaknesses, questions, reproducibility checklist, references and the exact venue standard applied; Markdown and print/PDF exports use the same stored final review.",
        "Methodologically, Jiddu adapts the **SPECS** review dimensions — Story, Presentation, Evaluations, Correctness and Significance — and the staged synthesis/self-critique pattern described in [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu is an independent implementation with its own claim/evidence ledger, venue calibration, parser, output contract and safeguards; it does not reproduce the AAAI-26 system.",
        "After the page-tagged ledger and literature research, five independent specialists audit **Story, Presentation, Evaluations, Correctness and Significance**. Evaluation and Correctness can propose whitelisted arithmetic checks that Jiddu recalculates without executing manuscript code. Synthesis and adversarial self-critique are followed by source-metadata validation, an independent-model quality audit and a deterministic retention gate for every retained MAJOR/MODERATE finding.",
        "The form offers **Standard** and **Deep** depth. Standard uses the selected economical model plus a different catalog critic. Deep uses stronger high-reasoning models for evaluation, correctness, significance and synthesis, with Claude Opus 4.8 as the independent critic by default; it takes longer and costs more.",
        "**Model routing and why.** In Standard mode, the model selected in the form — GPT-5.4 mini by default or MiniMax M3 — runs the ledger, literature research, all five SPECS specialists, synthesis and self-critique. The quality audit is deliberately assigned to the other catalog model so the draft is not approved only by the model that wrote it.",
        "In Deep mode, the selected model still handles the ledger, Story and Presentation; GPT-5.5 with high reasoning handles literature research, Evaluations, Correctness, Significance, synthesis, self-critique and any repair pass; Claude Opus 4.8 audits the resulting review independently. This concentrates the expensive reasoning on numerical validity, experimental design, novelty and cross-stage synthesis, while using a different model family for the final challenge to reduce correlated blind spots.",
        "On Jiddu's [30-case synthetic SPECS benchmark](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md), GPT-5.4 mini and GPT-5.5 both detected every injected defect, but GPT-5.5 produced 30.6% fewer, more consolidated findings. The benchmark reached a ceiling and does not prove superiority on complete papers; Deep is an additional scrutiny tier, not a guarantee of correctness. Operators can override both Deep model IDs through `PAPER_REVIEW_DEEP_MODEL` and `PAPER_REVIEW_CRITIC_MODEL`.",
        "Venue autocomplete combines account-free [DBLP](https://dblp.org) discovery with versioned, verified 2026 profiles for NeurIPS, ICML, ICLR, AAAI, IJCAI and CVPR. A verified profile injects its official criteria and requirements into both synthesis and self-critique and is persisted with source URLs. A DBLP-only or unmatched venue uses a clearly labeled general scholarly rubric; edition, track or paper-type mismatches are marked unverified rather than guessed.",
        "Every substantive weakness must carry a manuscript page or section and a `MAJOR`, `MODERATE` or `MINOR` severity. The review is still automated: it can miss problems, invent comparisons or misapply a criterion, and it is not an official peer review or acceptance prediction.",
      ],
    },
    {
      title: "16. Public API & MCP (for agents)",
      paragraphs: [
        "Beyond the web app, the five text pipelines are exposed as a public REST API for agents and scripts: `POST /api/v1/detect-fallacies`, `/fact-check`, `/assess-neutrality`, `/explain`, `/detect-slop`. These are synchronous — one JSON request in (`{ text }`, 40–2000 chars, plus optional `lang` and, for explain, `level`), one JSON response out. They drive the same generators to completion over a single chunk and never persist a row.",
        "Requests authenticate with an `X-Jiddu-Key` header. Keys are issued by the operator, stored only as a sha256 hash, shown once and rate-limited per key separately from the web app's per-IP limits. Fact-check via the API both extracts and verifies each claim, capped by a per-request claim limit so one call can't fan out unboundedly to the paid Sonar verifier.",
        "Adversarial review is exposed as a persisted asynchronous job: `POST /api/v1/adversarial-reviews` accepts one uploaded PDF or a public `pdf_url` and returns `202`; `GET /api/v1/adversarial-reviews/{id}` reports the current stage and eventually returns the structured review. This keeps the multi-minute, nine-stage workflow out of the synchronous text contract.",
        "The hosted MCP server at `POST /api/mcp` exposes the five text tools plus `start_adversarial_review` and `get_adversarial_review`. Any MCP client can connect by URL through `mcp-remote`; the same tools also ship in the standalone `jiddu-mcp` package. Setup snippets and machine-oriented docs are at [/api-access](/api-access).",
        "Quality is tracked by a fixed eval suite (15–16 cases per tool) committed in the repo and scored against expected results; the published report lives at [evals/report.md](https://github.com/rafaehlers/jiddu/blob/main/evals/report.md).",
      ],
    },
    {
      title: "17. Open source and methodology",
      paragraphs: [
        "Source code is at [github.com/rafaehlers/jiddu](https://github.com/rafaehlers/jiddu) under the [AGPL-3.0-or-later license](https://www.gnu.org/licenses/agpl-3.0.txt). AGPL closes the 'SaaS loophole' that GPL leaves open: anyone running a modified version as a network service must publish the modified source.",
        "[Claimify](https://arxiv.org/abs/2502.10855) informs claim extraction, and [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) informs verdict assessment, source tiers and neutrality. [no-ai-slop](https://github.com/petergyang/no-ai-slop) supplies the starting taxonomy for writing-pattern detection.",
        "Adversarial paper review adapts the SPECS dimensions and staged synthesis/self-critique described in [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu adds its own ledger, LiteParse extraction, DBLP discovery, venue profiles, source validation and retention gate. It is not affiliated with those groups, DBLP or the venues.",
        "Published evaluation currently consists of the [200-claim PolitiFact benchmark](/benchmark) and a [30-case synthetic SPECS benchmark](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md). Both have documented limits and neither guarantees correctness on a new text or paper.",
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
  nav_source: "Source code",

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
    "Listen in real time and surface logical fallacies as the speaker talks.",
  live_source_mic: "Microphone",
  live_source_tab: "Browser tab",
  live_source_tab_chrome_only: "Chrome only",
  live_source_tab_tooltip: "Capture audio from a browser tab",
  live_source_tab_unsupported: "Tab capture requires Chrome or Edge",
  live_language_follows_header: "Language follows the selector in the header.",
  live_start: "Start",
  live_stop: "Stop & finalize",
  live_findings: "Findings",
  live_running_score: "Running score",
  live_privacy_note:
    "Audio is streamed directly from your browser to OpenAI’s Realtime API via WebRTC. The raw audio is not stored — only the transcript and findings are persisted, and they become available at a shareable URL once you stop the session.",
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
  live_session_saved: "Session saved.",
  live_view_analysis: "View full analysis",
  live_start_new: "Start new recording",
};

const pt: Messages = {
  tagline: "truth is a pathless land",

  hero_title: "Leia qualquer coisa com senso crítico.",
  hero_subtitle:
    "Envie um PDF, cole um texto ou solte uma URL. O Jiddu destaca os trechos com falácias lógicas e explica cada um em um comentário — como um revisor no Word — e dá uma nota de 0 a 100 para o texto inteiro.",
  home_hero_subtitle:
    "Solte um PDF, cole um texto ou adicione uma URL — e escolha a lente: falácias, checagem de fatos, imparcialidade, explicação, detecção de slop ou revisão adversarial completa de um paper.",
  privacy: "Privacidade:",
  privacy_body:
    "seu conteúdo — incluindo imagens de páginas selecionadas do PDF quando a inspeção visual é necessária — é enviado ao modelo escolhido via OpenRouter e armazenado localmente sob um id compartilhável.",
  see_demo: "Ver demonstração",
  see_demo_hint: "Quer uma amostra rápida sem rodar uma análise?",
  bench_badge_label:
    "Pipeline validado · 67,5% de concordância com PolitiFact em benchmark de 200 claims",
  bench_badge_link: "ver relatório",
  pipelines_heading: "Seis lentes para leitura crítica",
  pipelines_subheading:
    "Escolha um modo no formulário acima, ou abra uma análise de exemplo para ver como cada um fica.",
  pipeline_fallacy_desc:
    "Destaca cada trecho que contém uma falácia lógica e explica cada uma em um comentário na margem (estilo Word). Dá uma nota de falácia de 0 a 100.",
  pipeline_factcheck_desc:
    "Extrai cada afirmação verificável — números, datas, citações, alegações causais e categóricas — e opcionalmente checa cada uma na web ao vivo via Perplexity Sonar com fontes citadas.",
  pipeline_neutrality_desc:
    "Sinaliza padrões de enquadramento, atribuição e seleção de fontes que tornam um texto partidário mesmo quando não há nenhuma falsidade factual. Deliberadamente NÃO classifica esquerda/direita.",
  quality_card_heading: "Qualidade medida contra humanos",
  quality_card_body:
    "Medimos o pipeline de fact-check contra 200 afirmações rotuladas humanamente pelo PolitiFact. O veredito do Jiddu coincidiu com o veredito humano em 81,3% das afirmações inequívocas (true / false / pants-on-fire), com discordância estrita em apenas 4,5% dos casos.",
  quality_card_link: "Metodologia completa e matriz de confusão",

  footer_quote:
    "“No momento em que você segue alguém, deixa de seguir a verdade.”",
  footer_balance: (amount) => `${amount} restantes em créditos de API`,

  tab_url: "URL",
  tab_paste: "Colar texto",
  tab_file: "PDF / TXT",
  tab_live: "Ao vivo",
  tab_factcheck: "Checar fatos",
  url_placeholder: "https://exemplo.com/artigo",
  paste_placeholder: "Cole o texto que você quer analisar…",
  file_drop_hint: "Solte um PDF ou TXT, ou clique para escolher",
  file_size_hint: "Até ~200 mil caracteres",
  model: "Modelo",
  model_anthropic: "Claude (Anthropic)",
  model_openai: "GPT (OpenAI)",
  analyze: "Analisar",
  starting: "Iniciando…",
  form_hint: "Os comentários aparecem à medida que a análise roda. Não feche a página.",

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
    "Suba um paper ou cole o texto, escolha um nível, e o Jiddu explica cada parágrafo na margem — traduzindo o jargão e mostrando como cada parte se encaixa no argumento.",
  explain_cta: "Explicar",
  explain_failed: "Falha na explicação",
  loader_explain: [
    "Lendo o paper",
    "Mapeando a estrutura",
    "Explicando cada parágrafo",
    "Traduzindo o jargão",
    "Conectando o argumento",
  ],
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
  explanations_count_one: "explicação",
  explanations_count_many: "explicações",
  explain_empty: "Nenhuma explicação foi gerada para este documento.",
  explain_footer: (model) =>
    `Explicado por ${model} via Jiddu. Explicações automáticas podem interpretar mal um paper — sempre confira no original.`,
  pipeline_explain_desc:
    "Suba um paper e receba uma explicação em linguagem simples de cada parágrafo, no nível que você escolher — de criança a especialista.",

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
      title: "Autenticação",
      paragraphs: [
        "Envie sua chave de API no cabeçalho `X-Jiddu-Key`. As chaves são emitidas pelo operador — veja “Obter uma chave” abaixo.",
        "```\ncurl -X POST https://jiddu.app/api/v1/detect-fallacies \\\n  -H \"content-type: application/json\" \\\n  -H \"X-Jiddu-Key: SUA_CHAVE\" \\\n  -d '{\"text\": \"Todo mundo concorda que isso é o melhor, então quem critica é tolo.\"}'\n```",
      ],
    },
    {
      title: "Servidor MCP",
      paragraphs: [
        "Para agentes, conecte-se ao servidor MCP hospedado do Jiddu por URL — nada para instalar ou clonar. Ele expõe as cinco ferramentas de texto mais `start_adversarial_review` e `get_adversarial_review`, e faz a ponte com seu cliente MCP (ex.: Claude Desktop) via o utilitário público `mcp-remote`:",
        "```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\", \"--header\", \"X-Jiddu-Key:sua-chave-aqui\"]\n    }\n  }\n}\n```",
        "A documentação orientada a máquina — quando usar cada ferramenta, formatos de resposta e como encadeá-las — está em [AGENT.md](https://github.com/rafaehlers/jiddu/blob/main/packages/jiddu-mcp/AGENT.md).",
      ],
    },
    {
      title: "Limites & confiabilidade",
      paragraphs: [
        "As ferramentas de texto aceitam até 2000 caracteres por requisição. Jobs de revisão recebem um PDF público ou enviado de até 25 MB e recusam papers acima de 300 mil caracteres extraídos em vez de truncá-los. Os limites de taxa são por chave; ao excedê-los, a resposta é HTTP 429 com `retry_after_seconds`. As saídas são automatizadas e podem errar — trate-as como sinais para verificação, não como autoridade final.",
        "A qualidade é medida contra conjuntos de teste fixos publicados no repositório: [evals/report.md](https://github.com/rafaehlers/jiddu/blob/main/evals/report.md).",
      ],
    },
    {
      title: "Obter uma chave",
      paragraphs: [
        "As chaves são emitidas manualmente por enquanto. Abra uma issue no [GitHub](https://github.com/rafaehlers/jiddu) para solicitar uma.",
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
  legal_last_updated: "Atualizado em: 2026-07-27",
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
        "As pontuações de imparcialidade e as explicações parágrafo a parágrafo também são interpretações automatizadas, não afirmações de fato — as explicações descrevem o que um texto diz e como ele está estruturado, nunca se as suas afirmações estão corretas. O nível de audiência muda apenas o texto; as tags de papel das seções são apenas suposições de melhor esforço.",
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
        "Cada análise ou revisão de paper concluída recebe uma URL compartilhável não listada e fica armazenada em um servidor no Brasil. Quem tem a URL pode ver o resultado final, mas essas páginas não são enumeradas no sitemap público. Não há contas de usuário; as etapas intermediárias privadas da revisão não aparecem no viewer público.",
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
        "A revisão de papers tem um [benchmark sintético SPECS separado, com 30 casos](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md). GPT-5.4 mini e GPT-5.5 detectaram os 30 defeitos inseridos; GPT-5.5 produziu 30,6% menos achados, mais consolidados. O conjunto atingiu o teto e não estabelece acurácia em papers reais completos.",
      ],
    },
    {
      title: "7. Contato",
      paragraphs: [
        "Operador: Rafael de Menezes Ehlers. Para solicitações de remoção, correções ou outras dúvidas, abra uma issue no [GitHub](https://github.com/rafaehlers/jiddu).",
      ],
    },
  ],

  how_it_works_title: "Como o Jiddu funciona",
  how_it_works_subtitle:
    "Walkthrough técnico de cada pipeline. Nada é escondido — o código-fonte é aberto sob AGPL-3.0 em github.com/rafaehlers/jiddu, então qualquer coisa descrita abaixo pode ser conferida contra a implementação real.",
  how_it_works_sections: [
    {
      title: "1. Visão geral",
      paragraphs: [
        "O Jiddu roda seis análises independentes: um detector de falácias, um pipeline de checagem de fatos (extração + veredito via Sonar), uma avaliação de imparcialidade, um explicador de papers parágrafo a parágrafo, um detector de slop de IA e uma revisão adversarial de um único paper autônomo com verificação de literatura publicada. São rotas separadas no app (`/`, `/factcheck`, `/neutrality`, `/explain`, `/slop`, `/review`) e tabelas separadas no banco. Nenhuma depende das outras.",
        "Os cinco pipelines de texto transmitem output estruturado de tool call de um LLM via [OpenRouter](https://openrouter.ai); os JSON Schemas são controlados pelo Jiddu e o [partial-json](https://github.com/promplate/partial-json) permite que os achados apareçam enquanto o modelo ainda escreve. A revisão de paper também usa SSE, mas para informar nove etapas amplas; cada etapa completa e valida um artefato estruturado antes da próxima.",
        "Todo o output é no idioma da UI escolhido pelo usuário. O mesmo prompt vai independente do modelo selecionado — a diferença de idioma vem de uma única linha `OUTPUT LANGUAGE:` no system prompt.",
      ],
    },
    {
      title: "2. Entrada: ingestão e segmentação",
      paragraphs: [
        "**URL.** O fetch usa headers parecidos com os de um navegador para reduzir rejeições por filtros simples de bot. Cada redirect tem o DNS resolvido e é bloqueado se alcançar uma faixa privada, loopback, link-local, CGNAT, multicast ou reservada de IPv4/IPv6. O tamanho da resposta é limitado a 5 MB, e o [@mozilla/readability](https://github.com/mozilla/readability) extrai o corpo do artigo.",
        "**PDF.** Parseado localmente com [LiteParse](https://github.com/run-llama/liteparse) como parser principal e [pdfjs-dist](https://mozilla.github.io/pdf.js/) como fallback. Os cinco pipelines de texto usam o modo rápido do LiteParse; a revisão adversarial usa o modo acadêmico para preservar Markdown por página, ordem espacial de leitura, OCR seletivo, sinais de complexidade e screenshots. O PDF bruto não é enviado como arquivo, mas a revisão repassa pelo OpenRouter imagens renderizadas de páginas selecionadas quando a inspeção visual é relevante.",
        "**Paste.** Usado como está, apenas com whitespace normalizado.",
        "**Segmentação.** O texto extraído é dividido em sentenças por um divisor que reconhece abreviações (`src/lib/sentences.ts`) — identifica abreviações em português (`sr.`, `dr.`, `prof.`), mantém siglas como `U.S.` inteiras e não quebra no meio de números como `3,4%`. As sentenças são agrupadas em chunks de ~12k caracteres (`src/lib/chunker.ts`) para que documentos longos caibam no contexto do modelo sem perder fronteiras de sentença.",
      ],
    },
    {
      title: "3. Modelos e fallback",
      paragraphs: [
        "Duas famílias de modelos aparecem no seletor: [🇺🇸 GPT-5.4 mini](https://openrouter.ai/openai/gpt-5.4-mini) (padrão) e [🇨🇳 MiniMax M3](https://openrouter.ai/minimax/minimax-m3). Ter ambas permite comparar interpretações limítrofes e evita que toda análise dependa de um único provedor.",
        "Se o modelo escolhido falhar *antes de emitir qualquer evento* (rate-limit do upstream, 5xx etc.), a requisição cai automaticamente pro outro — retry client-side, sem flicker na UI. Quando o modelo já emitiu pelo menos um achado, a gente não retry: aceita o parcial e a camada de partial-parse salva o que dá.",
        "Sonar Reasoning Pro é usado exclusivamente pros vereditos de fact-check (porque tem busca web embutida). Nunca aparece no seletor de modelo.",
      ],
    },
    {
      title: "4. Detector de falácias",
      paragraphs: [
        "Catálogo de 46 falácias cobrindo relevância, ambiguidade, presunção, apelos emocionais, raciocínio causal e evidência. Cada falácia tem id estável e uma cor distinta (distribuição por golden angle) usada pra destacar passagens. Lista completa em [/fallacies](/fallacies).",
        "O system prompt instrui o modelo a ser rigoroso e conservador — só marcar quando há uma falácia clara e defensável. Duas cláusulas específicas apertam isso: **disambiguation** (não marcar sentença com múltiplas leituras plausíveis a menos que o contexto resolva) e **standalone-explanation** (cada explicação deve nomear a premissa implícita e a conclusão, pra leitor entender sem voltar à fonte). Ambas inspiradas no paper Claimify (Microsoft Research 2025).",
        "Cada achado tem severidade binária (`baixa` / `alta`). A nota geral (0-100) é uma média ponderada por chunks, ponderada por contagem de caracteres. As faixas (`raciocínio limpo` / `questões menores` / `várias falácias` / `altamente falacioso` / `propagandístico`) estão escritas no próprio prompt pra o modelo ter a mesma calibração que a UI mostra.",
        "**Roteamento do modelo e por quê.** O GPT-5.4 mini ou MiniMax M3 escolhido executa a classificação completa em uma passagem estruturada por chunk. A tarefa usa um modelo econômico porque o espaço de raciocínio é limitado por um catálogo fixo de 46 itens, pelas sentenças exatas da fonte e por um JSON Schema; não há busca na web nem um segundo modelo crítico. O modelo alternativo continua disponível para comparar interpretações limítrofes de outra família.",
        "Os chunks rodam com concorrência limitada e transmitem achados assim que são validados. A falha de um chunk não apaga os demais; a nota final é calculada deterministicamente com as notas dos chunks concluídos, ponderadas por caracteres. Essa resiliência também significa que o resultado pode ser parcial, portanto a nota é um auxílio de leitura, não a probabilidade de o documento ser 'falacioso'.",
        "O repositório inclui evals de regressão para detecções esperadas e armadilhas de falso positivo, mas o Jiddu ainda não publicou um benchmark de acurácia com rótulos humanos para este pipeline. A ausência de uma marcação não prova raciocínio sólido, e uma passagem destacada ainda exige que o leitor julgue se a falácia nomeada realmente se aplica.",
      ],
    },
    {
      title: "5. Detector de slop",
      paragraphs: [
        "Mesma arquitetura do detector de falácias — mesma ingestão, chunking, streaming, fallback de modelo e nota 0-100 ponderada por caracteres — com catálogo e prompt diferentes, persistido em tabela própria (resultados em `/s/:id`, mesmo viewer de comentários na margem, versão de impressão e demos em `/s/demo-en|pt|es`).",
        "O catálogo cobre 18 padrões de escrita de slop de IA em cinco famílias: vocabulário de estoque, drama fabricado, estrutura de fôrma, substância oca e cacoetes de formato. A lista completa com definições e exemplos está em [/slop-patterns](/slop-patterns). A seleção de padrões é baseada na skill de edição [no-ai-slop](https://github.com/petergyang/no-ai-slop) de Peter Yang (licença MIT); a redação do catálogo, o conteúdo trilíngue e o prompt de detecção são do próprio Jiddu.",
        "O prompt detecta **padrões, não autoria** — ele é proibido de afirmar que um texto foi ou não escrito por IA (humanos também escrevem slop). Cada achado cita o trecho exato, nomeia o padrão e diz em poucas palavras o que uma versão mais limpa faria (afirmar o ponto, nomear a fonte, dar o número) sem reescrever nada. Faixas de nota: 0-15 soa humano, 16-35 tempero leve, 36-60 padronizado, 61-80 muito padronizado, 81-100 prosa de linha de montagem.",
        "**Roteamento do modelo e por quê.** Como na detecção de falácias, o GPT-5.4 mini ou MiniMax M3 escolhido processa cada chunk contra catálogo fechado e schema estruturado. Não há detector especializado, classificador de watermark nem modelo de autoria: o LLM atua como crítico de estilo restrito. Os modelos econômicos bastam para essa tarefa de padrões de superfície, enquanto a segunda família permite comparar textos próximos da fronteira entre categorias.",
        "Falhas de chunks são isoladas e os achados válidos continuam aparecendo. O Jiddu combina as notas dos chunks concluídos por contagem de caracteres e usa o resumo do chunk concluído com maior nota; ele nunca infere autoria desse agregado. Documentos longos podem, portanto, gerar um parcial útil, mas o número é apenas um indicador de densidade dos padrões catalogados.",
        "O conjunto versionado de evals cobre positivos representativos, prosa limpa e a salvaguarda contra inferência de autoria, mas não é um benchmark populacional de escrita humana contra escrita de máquina. De propósito: a função responde 'quais padrões prontos aparecem?', não 'quem ou o que escreveu isto?'.",
      ],
    },
    {
      title: "6. Checagem de fatos — extração de afirmações",
      paragraphs: [
        "Modelado a partir do [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). O prompt pede ao modelo pra passar cada sentença por quatro estágios: **selection** (manter só sentenças com afirmação verificável — opinião, juízo de valor e pergunta retórica saem), **disambiguation** (descartar sentenças com múltiplas leituras plausíveis quando o contexto não resolve), **decomposition** (quebrar sentenças com múltiplos fatos em afirmações separadas, sem perseguir atomicidade infinita) e **decontextualization** (cada afirmação emitida deve ficar de pé sozinha — resolver pronomes, adicionar o ano de um número que depende dele, atribuir uma citação à fonte).",
        "Cada afirmação tem um tipo: `numeric`, `date`, `quote`, `causal`, ou `categorical`. O tipo informa como o verificador procura evidência depois.",
        "Limite duro de 50 afirmações por extração (configurável pelo operador). Existe porque cada afirmação depois custa créditos Sonar pra verificar; uma extração sem cap num PDF de 30 páginas poderia gastar bastante dinheiro antes do usuário perceber.",
        "**Roteamento do modelo e por quê.** O GPT-5.4 mini ou MiniMax M3 escolhido faz apenas a extração; não decide se a afirmação é verdadeira. As regras inspiradas no Claimify e o schema estrito tornam esta uma tarefa delimitada de extração de informação, por isso os modelos econômicos do seletor são usados aqui e o modelo caro com busca fica reservado às afirmações que o usuário realmente manda verificar.",
        "A extração transmite cards de afirmação enquanto os chunks rodam em paralelo. Cada afirmação mantém a sentença exata da fonte e uma formulação autônoma, permitindo auditar a descontextualização antes de gastar na verificação. Se um chunk falhar, as afirmações dos chunks concluídos permanecem; a interface não deve, portanto, ser lida como prova de que toda alegação verificável foi encontrada.",
      ],
    },
    {
      title: "7. Checagem de fatos — veredito por afirmação",
      paragraphs: [
        "Veredito é opt-in. A extração sozinha é barata (uma chamada LLM). A verificação é sob demanda: o usuário clica em **Verificar afirmações** no viewer e cada afirmação é enviada pro [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro), uma chamada por afirmação, com concorrência limitada (6 paralelas por padrão).",
        "O Sonar retorna um JSON com o veredito (`sustentado` / `contradito` / `misto` / `não verificado`), uma confiança entre 0 e 1, uma justificativa, e uma lista de fontes citadas tiradas do canal `annotations` do Sonar. Se a confiança ficar abaixo de 0.5, o veredito é forçado pra `não verificado` — melhor sinalizar 'evidência insuficiente' do que entregar uma resposta confiantemente errada.",
        "Toda fonte citada é classificada em um de seis tiers (segundo Goldfarb et al. 2025): `primary` (órgãos oficiais de dados, decisões judiciais, papers peer-reviewed), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. Uma flag boolean separada marca veículos `state-controlled` (RT, CGTN, Xinhua etc. — mas não BBC/NPR/Deutsche Welle, que são state-FUNDED mas editorialmente independentes).",
        "A linguagem do veredito é intencionalmente cuidadosa com pessoas nomeadas: nunca 'X está mentindo' ou 'isso é falso' — sempre 'a evidência não sustenta' / 'a evidência contradiz o número' / 'não encontramos evidência que sustente'. É regra dura no system prompt.",
        "**Roteamento do modelo e por quê.** O Perplexity Sonar Reasoning Pro é fixo na verificação porque esta etapa precisa de recuperação web atual e anotações de fontes, não apenas geração de texto em livro fechado. GPT-5.4 mini e MiniMax M3 nunca fabricam citações de veredito; eles param na extração. Separar extração e verificação também torna visíveis o custo, o comportamento do cache e as falhas de cada afirmação.",
        "As afirmações são verificadas independentemente, então um timeout ou conjunto fraco de evidências não invalida as demais. O Jiddu normaliza a resposta estruturada do Sonar, aplica o piso de confiança, preserva as URLs citadas e armazena o id do modelo usado. Os tiers descrevem o tipo de fonte, não uma nota automática de verdade: até uma fonte primária pode estar desatualizada ou ser mal interpretada.",
        "Qual a accuracy disso na prática? A gente rodou um [benchmark contra o corpus humano do PolitiFact](/benchmark). Em 200 afirmações puxadas das quatro categorias polares do PolitiFact (true / mostly-true / false / pants-on-fire, de 2020 pra cá), o veredito do Jiddu coincidiu com o veredito humano polar em 67.5% dos casos no total e 81.3% nas categorias menos ambíguas (true / false / pants-on-fire). Discordância estrita — Jiddu dizer o oposto polar do humano — aconteceu em só 4.5% dos casos (9 de 200). Os ~28% restantes foram Jiddu devolvendo `mixed` ou `unverified` no lugar de um veredito polar, concentrados no bucket `mostly_true` do PolitiFact (58% viraram `mixed` — sobreposição estrutural, não erro, já que ambos os rótulos descrevem verdade parcial). Metodologia, matriz de confusão e análise das discordâncias no link.",
      ],
    },
    {
      title: "8. Checagem de fatos — cache de vereditos",
      paragraphs: [
        "Cada afirmação verificada é hashada e armazenada. O hash é `sha256(lang + ':' + normalize(statement))` onde `normalize` faz lowercase, tira acentos combinantes, colapsa espaços e remove pontuação final. Isso significa que reformulações da mesma afirmação colidem, mas idiomas diferentes não.",
        "TTLs por tipo de afirmação. `numeric` 30 dias (IBGE e companhia revisam séries), `date` e `categorical` 365 dias (fatos históricos e definições são estáveis), `quote` e `causal` 90 dias (re-examináveis mas pouco prováveis de mudar). Uma varredura best-effort apaga linhas expiradas no caminho de cache-miss, limitada a uma vez a cada 30 minutos pra o hot path ficar barato.",
        "O usuário pode burlar o cache com um botão **refresh** por afirmação (força uma chamada Sonar fresca). Conta contra uma cota configurável pelo operador — o padrão é 2 refreshes por afirmação. Depois disso, o botão some e a API retorna 429.",
      ],
    },
    {
      title: "9. Imparcialidade",
      paragraphs: [
        "Diferente da detecção de falácia: um texto pode ser livre de falácia e factualmente correto e ainda assim usar enquadramento carregado, atribuição assimétrica ou seleção unilateral de fontes. A análise de imparcialidade sinaliza esses padrões.",
        "Oito tipos de issue são sinalizados no nível da sentença: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. O modelo também classifica o documento num de sete tipos de texto (informativo / opinião / discurso político / advocacy / análise / marketing / redes sociais) — isso informa quão estrito o audit é.",
        "O veredito a nível de documento é um de `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. O Jiddu **deliberadamente não classifica direção partidária** (esquerda/direita, pró-X/anti-Y). O paper da Forum AI que inspirou a metodologia exige um painel bipartisan de especialistas pra essa etapa; sem ele, rótulos partidários são pouco confiáveis e perigosos. Sinalizamos padrões específicos que o leitor pode auditar, em vez disso.",
        "**Roteamento do modelo e por quê.** O GPT-5.4 mini ou MiniMax M3 escolhido faz a classificação do tipo de texto, a detecção de issues por sentença e o veredito do chunk na mesma chamada estruturada. Este pipeline não navega na web nem decide se as afirmações são verdadeiras; usar o modelo econômico do seletor mantém a análise de enquadramento rápida, enquanto a família alternativa permite comparar a sensibilidade.",
        "Em textos longos, os chunks são analisados em paralelo. O veredito final é então escolhido deterministicamente como o mais severo entre os chunks concluídos (`manipulation` acima de `explicitly_partisan`, acima de `partisan_lean`, acima de `neutral`); confiança e justificativa vêm do chunk mais forte nesse nível, e o tipo do documento é a moda entre os chunks. Isso favorece recall de propósito, então uma passagem fortemente enquadrada pode determinar o veredito principal.",
        "Os evals exercitam os oito sinais e exemplos que não deveriam ser marcados, mas ainda não há benchmark publicado com painel humano para imparcialidade. O veredito é, portanto, um auxílio de navegação para passagens auditáveis, não uma medida objetiva de equilíbrio político.",
      ],
    },
    {
      title: "10. Privacidade e status de revisão",
      paragraphs: [
        "Não há contas de usuário. Resultados concluídos usam URLs não listadas: qualquer pessoa com a URL pode ver o resultado final, mas essas páginas não são enumeradas no sitemap público. Ledgers, pesquisa e juízos preliminares da revisão de papers são artefatos intermediários internos e não aparecem no resultado público.",
        "O conteúdo submetido passa pelo OpenRouter para o upstream do modelo escolhido. Na revisão de paper, isso inclui imagens renderizadas de páginas selecionadas, não só o texto extraído. A etapa de literatura pesquisa fontes acadêmicas públicas por afirmações técnicas, enquanto os prompts proíbem consultas pelo título, nome dos autores ou outros manuscritos dos mesmos autores. O autocomplete envia apenas a consulta da venue ao DBLP. Registramos o IP para rate-limit e sinais de abuso e não o vendemos.",
        "Os resultados são automatizados e não revisados por padrão. Um resultado explicitamente marcado como revisado foi conferido pontualmente pelo operador; esse status representa uma verificação humana adicional, não uma garantia de que todos os achados estejam corretos.",
      ],
    },
    {
      title: "11. Controle de custo e abuso",
      paragraphs: [
        "Toda rota que gera custo tem rate limit token bucket in-memory por IP. Os padrões incluem 30 análises de falácia / hora, 30 extrações de fact-check / hora, 10 verificações em massa / hora, 20 refreshes individuais / hora e, deliberadamente conservador, 4 revisões de paper / hora com burst 2. O operador pode ajustar esses valores em runtime; buckets esgotados retornam 429 com `Retry-After`.",
        "A extração de fact-check tem cap de 50 afirmações por documento e o refresh, 2 chamadas por afirmação. A revisão aceita exatamente um PDF, recusa truncamento silencioso acima de 300.000 caracteres extraídos, limita a inspeção visual a páginas selecionadas e divide o trabalho caro em etapas auditáveis. Esses controles evitam fan-out e custos acidentalmente ilimitados.",
      ],
    },
    {
      title: "12. Loop de feedback",
      paragraphs: [
        "Todo card de afirmação tem um botão **🚩 Reportar veredito errado**. O clique captura um motivo opcional e guarda o statement e o veredito atuais, para que o operador possa revisar o que o usuário viu mesmo se a afirmação for verificada novamente depois.",
        "Flags enviadas entram numa fila privada de moderação com status `open`. O operador marca cada uma como `resolved` (concorda com o usuário, planeja consertar) ou `ignored` (o veredito tava certo, ou a flag era spam), ou deleta.",
        "Os relatos não alteram automaticamente um veredito. O operador revisa cada entrada manualmente, então o volume de relatos, sozinho, não substitui as evidências mostradas ao leitor.",
      ],
    },
    {
      title: "13. Modo Live (beta)",
      paragraphs: [
        "Pipeline separado em [/live](/live): a página captura áudio do microfone do usuário ou, em browsers Chromium, de uma aba do navegador via `getDisplayMedia`. O áudio é transmitido *direto do browser pra Realtime API da OpenAI* via WebRTC — nunca passa pelo servidor do Jiddu. O modelo de transcrição é `gpt-realtime-whisper`, e o idioma respeita o seletor do header (EN / PT / ES).",
        "Como o cabeamento funciona: quando o usuário clica em **Iniciar**, o browser chama `POST /api/live/token` pra cunhar um client secret efêmero de curta duração (o servidor do Jiddu guarda a `OPENAI_API_KEY` real; o browser nunca vê). O browser então abre a peer-connection WebRTC pra OpenAI usando esse secret e começa a receber deltas de transcrição. A cada ~500 caracteres novos (ou a cada 30 segundos, o que vier primeiro), uma chamada SSE separada pra `POST /api/live/analyze` envia o transcript cumulativo e roda o mesmo prompt de falácia usado em qualquer lugar — essa etapa de análise é uma chamada diferente da transcrição via OpenAI acima, roteada via OpenRouter com o mesmo seletor GPT-5.4 mini / MiniMax M3 dos pipelines de texto. Os achados aparecem na UI quase em tempo real. No **Parar**, uma última chamada com `finalize: true` commita a sessão como uma análise `/a/<id>` normal, indistinguível downstream de uma análise feita via paste.",
        "Custo é limitado por um cap duro de 60 minutos por sessão (≈ \\$1 de Realtime + custo de análise LLM). O áudio bruto nunca é armazenado — só a transcrição e os achados detectados persistem. A página é deliberadamente fora do nav enquanto está em beta — chega-se digitando `/live` na barra. Captura de áudio de aba funciona só em Chrome / Edge porque Safari e Firefox não expõem áudio de aba via `getDisplayMedia`; o microfone funciona em qualquer lugar.",
      ],
    },
    {
      title: "14. Explain — explicador de artigos",
      paragraphs: [
        "O pipeline Explain (`/explain`, resultados em `/e/:id`) recebe um artigo acadêmico ou documento técnico e produz uma explicação parágrafo a parágrafo em linguagem simples. Cada parágrafo recebe uma tag de papel (Background / Objetivo / Método / Resultado / Interpretação / Limitação / Conclusão) e uma explicação escrita no nível de audiência escolhido. Uma visão geral do documento é gerada primeiro.",
        "Níveis de audiência: **Criança** (ELI5, analogias do cotidiano, sem jargão), **Ensino médio** (linguagem clara, poucos termos técnicos explicados), **Graduação** (registro acadêmico padrão, pressupõe familiaridade com a área), **Expert** (conciso, nível de pares, terminologia completa mantida). O nível controla apenas a complexidade do texto — não filtra nem valida o conteúdo.",
        "A tag de papel é algorítmica. O modelo lê cada parágrafo em contexto e atribui o papel que melhor descreve sua função no argumento. Artigos interdisciplinares ou documentos com estrutura não padrão podem receber tags incorretas.",
        "Ao contrário dos pipelines de texto geral, o Explain é otimizado para artigos acadêmicos estruturados. Resultados em posts de blog, petições jurídicas ou textos não estruturados serão de menor qualidade.",
        "**Roteamento do modelo e por quê.** O GPT-5.4 mini ou MiniMax M3 escolhido escreve a visão geral, as tags de papel e as explicações dos parágrafos em uma passagem por chunk limitada pelo schema. A explicação usa os modelos econômicos do seletor porque transforma o texto fornecido, em vez de pesquisar literatura ou validar o conteúdo de forma independente; não há busca web, checagem de citações nem segundo modelo crítico.",
        "Os chunks rodam com concorrência limitada e as explicações aparecem na margem à medida que chegam. Cada chunk pode propor uma visão geral, mas o Jiddu mantém deterministicamente a primeira não vazia porque o primeiro chunk normalmente contém resumo e introdução. A falha de um chunk preserva as explicações dos demais, então podem existir lacunas em papers longos ou com formatação incomum.",
        "Os evals atuais verificam cobertura de papéis, calibração da audiência e confiabilidade do schema, não fidelidade factual contra anotações de especialistas. O Explain pode simplificar demais uma ressalva ou interpretar um método com confiança indevida; deve facilitar a entrada no texto-fonte, nunca substituí-lo.",
      ],
    },
    {
      title: "15. Revisão adversarial de paper",
      paragraphs: [
        "O pipeline de revisão (`/review`, resultados em `/r/:id`) aceita exatamente um PDF final como manuscrito autônomo, mais venue-alvo, edição, track, tipo de paper e data opcional. Ele não combina suplementos nem múltiplos arquivos. O resultado público inclui recomendação de gatekeeping, resumo, pontos fortes, fraquezas localizadas, perguntas, checklist de reprodutibilidade, referências e o padrão exato da venue; os exports Markdown e print/PDF usam a mesma revisão final armazenada.",
        "Metodologicamente, o Jiddu adapta as dimensões de revisão **SPECS** — Story, Presentation, Evaluations, Correctness e Significance — e o padrão de síntese e autocrítica em estágios descrito em [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). O Jiddu é uma implementação independente, com ledger próprio de claims e evidências, calibração por venue, parser, contrato de saída e salvaguardas; ele não reproduz o sistema da AAAI-26.",
        "Depois do ledger paginado e da pesquisa de literatura, cinco especialistas independentes auditam **Story, Presentation, Evaluations, Correctness e Significance**. Evaluations e Correctness podem propor cálculos aritméticos permitidos que o Jiddu refaz sem executar código do manuscrito. Síntese e autocrítica são seguidas por validação das fontes, auditoria de qualidade com outro modelo e um gate determinístico que preserva todo achado MAJOR/MODERATE retido.",
        "O formulário oferece profundidade **Padrão** e **Profunda**. A Padrão usa o modelo econômico selecionado e outro modelo do catálogo como crítico. A Profunda usa modelos de raciocínio mais fortes em avaliação, correção, significância e síntese, com Claude Opus 4.8 como crítico independente por padrão; leva mais tempo e custa mais.",
        "**Roteamento dos modelos e por quê.** No modo Padrão, o modelo escolhido no formulário — GPT-5.4 mini por padrão ou MiniMax M3 — executa o ledger, a pesquisa de literatura, os cinco especialistas SPECS, a síntese e a autocrítica. A auditoria de qualidade é entregue deliberadamente ao outro modelo do catálogo, para que o rascunho não seja aprovado apenas pelo modelo que o escreveu.",
        "No modo Profundo, o modelo selecionado continua responsável pelo ledger, Story e Presentation; o GPT-5.5 com raciocínio high executa pesquisa de literatura, Evaluations, Correctness, Significance, síntese, autocrítica e eventual reparo; o Claude Opus 4.8 audita a revisão resultante de forma independente. Assim, o raciocínio caro fica concentrado em validade numérica, desenho experimental, novidade e síntese entre etapas, enquanto uma família diferente de modelos faz o desafio final para reduzir pontos cegos correlacionados.",
        "No [benchmark sintético SPECS de 30 casos do Jiddu](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md), GPT-5.4 mini e GPT-5.5 detectaram todas as falhas inseridas, mas o GPT-5.5 produziu 30,6% menos achados, mais consolidados. O benchmark atingiu o teto e não prova superioridade em papers completos; Profunda é uma camada adicional de escrutínio, não garantia de correção. O operador pode trocar os dois modelos do modo Profundo por `PAPER_REVIEW_DEEP_MODEL` e `PAPER_REVIEW_CRITIC_MODEL`.",
        "O autocomplete combina descoberta gratuita e sem conta pelo [DBLP](https://dblp.org) com perfis 2026 verificados e versionados de NeurIPS, ICML, ICLR, AAAI, IJCAI e CVPR. Um perfil verificado injeta critérios e exigências oficiais na síntese e na autocrítica e fica persistido com URLs-fonte. Uma venue só do DBLP ou sem correspondência usa rubrica acadêmica geral claramente identificada; incompatibilidades de edição, track ou tipo são marcadas como não verificadas, nunca adivinhadas.",
        "Toda fraqueza substantiva precisa trazer página ou seção do manuscrito e severidade `MAJOR`, `MODERATE` ou `MINOR`. A revisão continua automatizada: pode perder problemas, inventar comparações ou aplicar mal um critério, e não é revisão oficial por pares nem previsão de aceitação.",
      ],
    },
    {
      title: "16. API pública & MCP (para agentes)",
      paragraphs: [
        "Além do app web, os cinco pipelines de texto são expostos como uma API REST pública para agentes e scripts: `POST /api/v1/detect-fallacies`, `/fact-check`, `/assess-neutrality`, `/explain`, `/detect-slop`. Eles são síncronos — uma requisição JSON entra (`{ text }`, 40–2000 caracteres, mais `lang` opcional e, no explain, `level`) e uma resposta JSON sai. Os geradores rodam até o fim sobre um único chunk e não persistem uma linha.",
        "As requisições se autenticam com o cabeçalho `X-Jiddu-Key`. As chaves são emitidas pelo operador, guardadas apenas como hash sha256, mostradas uma vez e limitadas por chave separadamente dos limites por IP do app web. O fact-check via API extrai e verifica cada afirmação, com um teto de afirmações por requisição pra que uma chamada não dispare verificações ilimitadas no Sonar pago.",
        "A revisão adversarial é exposta como job assíncrono persistido: `POST /api/v1/adversarial-reviews` recebe um PDF enviado ou uma `pdf_url` pública e devolve `202`; `GET /api/v1/adversarial-reviews/{id}` informa a etapa atual e, no fim, entrega a revisão estruturada. Assim o fluxo de nove etapas e vários minutos não é forçado no contrato síncrono de texto.",
        "O servidor MCP hospedado em `POST /api/mcp` expõe as cinco ferramentas de texto mais `start_adversarial_review` e `get_adversarial_review`. Qualquer cliente MCP conecta via `mcp-remote`; as mesmas ferramentas também vêm no pacote standalone `jiddu-mcp`. Snippets e docs orientadas a máquina em [/api-access](/api-access).",
        "A qualidade é acompanhada por um conjunto fixo de evals (15–16 casos por ferramenta) versionado no repositório e comparado com resultados esperados; o relatório publicado está em [evals/report.md](https://github.com/rafaehlers/jiddu/blob/main/evals/report.md).",
      ],
    },
    {
      title: "17. Open source e metodologia",
      paragraphs: [
        "Código fonte em [github.com/rafaehlers/jiddu](https://github.com/rafaehlers/jiddu) sob licença [AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.txt). A AGPL fecha o 'SaaS loophole' que a GPL deixa aberto: quem rodar uma versão modificada como serviço de rede tem que publicar o código modificado.",
        "O [Claimify](https://arxiv.org/abs/2502.10855) orienta a extração de afirmações, e [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) orienta a avaliação dos vereditos, os tiers de fontes e a imparcialidade. O [no-ai-slop](https://github.com/petergyang/no-ai-slop) fornece a taxonomia inicial da detecção de padrões de escrita.",
        "A revisão adversarial de papers adapta as dimensões SPECS e a síntese e autocrítica por etapas descritas em [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). O Jiddu adiciona ledger, extração por LiteParse, descoberta via DBLP, perfis de venue, validação de fontes e gate de retenção próprios. Não tem afiliação com esses grupos, com o DBLP nem com as venues.",
        "A avaliação publicada hoje inclui o [benchmark PolitiFact com 200 afirmações](/benchmark) e um [benchmark sintético SPECS com 30 casos](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md). Ambos documentam suas limitações e nenhum garante correção em um novo texto ou paper.",
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
  nav_source: "Código-fonte",

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
    "Escute em tempo real e veja as falácias aparecerem conforme a pessoa fala.",
  live_source_mic: "Microfone",
  live_source_tab: "Aba do navegador",
  live_source_tab_chrome_only: "Só no Chrome",
  live_source_tab_tooltip: "Capturar áudio de uma aba do navegador",
  live_source_tab_unsupported: "Captura de aba requer Chrome ou Edge",
  live_language_follows_header: "O idioma segue o seletor no cabeçalho.",
  live_start: "Iniciar",
  live_stop: "Parar e finalizar",
  live_findings: "Falácias",
  live_running_score: "Nota parcial",
  live_privacy_note:
    "O áudio é transmitido direto do seu navegador para a API Realtime da OpenAI via WebRTC. O áudio bruto não é armazenado — apenas a transcrição e as falácias detectadas ficam salvas, e estarão disponíveis em uma URL compartilhável quando você parar a sessão.",
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
  live_session_saved: "Sessão salva.",
  live_view_analysis: "Ver análise completa",
  live_start_new: "Nova gravação",
};

const es: Messages = {
  tagline: "truth is a pathless land",

  hero_title: "Lee cualquier cosa con espíritu crítico.",
  hero_subtitle:
    "Sube un PDF, pega un texto o suelta una URL. Jiddu resalta los pasajes con falacias lógicas y explica cada uno en un comentario — como un revisor en Word — y le da al texto entero una puntuación de falacia de 0 a 100.",
  home_hero_subtitle:
    "Suelta un PDF, pega un texto o añade una URL — y elige la lente: falacias, verificación de hechos, neutralidad, explicación, detección de slop o revisión adversarial completa de un paper.",
  privacy: "Privacidad:",
  privacy_body:
    "tu contenido — incluidas imágenes de páginas seleccionadas del PDF cuando se necesita inspección visual — se envía al modelo elegido vía OpenRouter y se almacena localmente bajo un id compartible.",
  see_demo: "Ver demostración",
  see_demo_hint: "¿Quieres un vistazo rápido sin ejecutar un análisis?",
  bench_badge_label:
    "Pipeline validado · 67,5% de concordancia con PolitiFact en benchmark de 200 claims",
  bench_badge_link: "ver informe",
  pipelines_heading: "Seis lentes para lectura crítica",
  pipelines_subheading:
    "Elige un modo en el formulario de arriba, o abre un análisis de muestra para ver cómo se ve cada uno.",
  pipeline_fallacy_desc:
    "Resalta cada pasaje que contiene una falacia lógica y explica cada una en un comentario al margen (estilo Word). Da una puntuación de falacias de 0 a 100.",
  pipeline_factcheck_desc:
    "Extrae cada afirmación verificable — números, fechas, citas, aseveraciones causales y categóricas — y opcionalmente revisa cada una en la web en vivo vía Perplexity Sonar con fuentes citadas.",
  pipeline_neutrality_desc:
    "Expone patrones de encuadre, atribución y selección de fuentes que vuelven un texto partidario aun cuando nada es factualmente falso. Deliberadamente NO clasifica izquierda/derecha.",
  quality_card_heading: "Calidad medida contra humanos",
  quality_card_body:
    "Medimos el pipeline de fact-check contra 200 afirmaciones etiquetadas humanamente por PolitiFact. El veredicto de Jiddu coincidió con el veredicto humano en 81,3% de las afirmaciones inequívocas (true / false / pants-on-fire), con desacuerdo estricto en apenas 4,5% de los casos.",
  quality_card_link: "Metodología completa y matriz de confusión",

  footer_quote:
    "“En el momento en que sigues a alguien, dejas de seguir la verdad.”",
  footer_balance: (amount) => `${amount} restantes en créditos de API`,

  tab_url: "URL",
  tab_paste: "Pegar texto",
  tab_file: "PDF / TXT",
  tab_live: "En vivo",
  tab_factcheck: "Verificar",
  url_placeholder: "https://ejemplo.com/articulo",
  paste_placeholder: "Pega el texto que quieres analizar…",
  file_drop_hint: "Suelta un PDF o TXT, o haz clic para elegir",
  file_size_hint: "Hasta ~200 mil caracteres",
  model: "Modelo",
  model_anthropic: "Claude (Anthropic)",
  model_openai: "GPT (OpenAI)",
  analyze: "Analizar",
  starting: "Iniciando…",
  form_hint: "Los comentarios aparecen mientras corre el análisis. No cierres la página.",

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
    "Sube un paper o pega el texto, elige un nivel, y Jiddu explica cada párrafo en el margen — descifrando la jerga y mostrando cómo cada parte encaja en el argumento.",
  explain_cta: "Explicar",
  explain_failed: "Falló la explicación",
  loader_explain: [
    "Leyendo el paper",
    "Mapeando su estructura",
    "Explicando cada párrafo",
    "Traduciendo la jerga",
    "Conectando el argumento",
  ],
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
  explanations_count_one: "explicación",
  explanations_count_many: "explicaciones",
  explain_empty: "No se generaron explicaciones para este documento.",
  explain_footer: (model) =>
    `Explicado por ${model} vía Jiddu. Las explicaciones automáticas pueden malinterpretar un paper — verifica siempre con el original.`,
  pipeline_explain_desc:
    "Sube un paper y obtén una explicación en lenguaje claro de cada párrafo, al nivel que elijas — de niño a experto.",

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
      title: "Autenticación",
      paragraphs: [
        "Envía tu clave de API en el encabezado `X-Jiddu-Key`. Las claves las emite el operador — consulta “Obtener una clave” más abajo.",
        "```\ncurl -X POST https://jiddu.app/api/v1/detect-fallacies \\\n  -H \"content-type: application/json\" \\\n  -H \"X-Jiddu-Key: TU_CLAVE\" \\\n  -d '{\"text\": \"Todos están de acuerdo en que esto es lo mejor, así que quien critica es un tonto.\"}'\n```",
      ],
    },
    {
      title: "Servidor MCP",
      paragraphs: [
        "Para agentes, conéctate al servidor MCP alojado de Jiddu por URL — nada que instalar ni clonar. Expone las cinco herramientas de texto más `start_adversarial_review` y `get_adversarial_review`, y hace de puente con tu cliente MCP (p. ej. Claude Desktop) mediante el utilitario público `mcp-remote`:",
        "```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\", \"--header\", \"X-Jiddu-Key:tu-clave-aquí\"]\n    }\n  }\n}\n```",
        "La documentación orientada a máquinas — cuándo usar cada herramienta, formatos de respuesta y cómo encadenarlas — está en [AGENT.md](https://github.com/rafaehlers/jiddu/blob/main/packages/jiddu-mcp/AGENT.md).",
      ],
    },
    {
      title: "Límites y fiabilidad",
      paragraphs: [
        "Las herramientas de texto aceptan hasta 2000 caracteres por solicitud. Los jobs de revisión reciben un PDF público o subido de hasta 25 MB y rechazan papers por encima de 300.000 caracteres extraídos en lugar de truncarlos. Los límites de tasa son por clave; al excederlos, la respuesta es HTTP 429 con `retry_after_seconds`. Las salidas son automatizadas y pueden equivocarse — trátalas como señales para verificar, no como autoridad final.",
        "La calidad se mide contra conjuntos de prueba fijos publicados en el repositorio: [evals/report.md](https://github.com/rafaehlers/jiddu/blob/main/evals/report.md).",
      ],
    },
    {
      title: "Obtener una clave",
      paragraphs: [
        "Las claves se emiten manualmente por ahora. Abre un issue en [GitHub](https://github.com/rafaehlers/jiddu) para solicitar una.",
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
  legal_last_updated: "Actualizado: 2026-07-27",
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
        "Las puntuaciones de imparcialidad y las explicaciones párrafo por párrafo también son interpretaciones automatizadas, no afirmaciones de hecho — las explicaciones describen qué dice un texto y cómo está estructurado, nunca si sus afirmaciones son correctas. El nivel de audiencia cambia solo la prosa; las etiquetas de rol de las secciones son solo conjeturas de mejor esfuerzo.",
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
        "Cada análisis o revisión de paper completado recibe una URL compartible no listada y se almacena en un servidor en Brasil. Quien tenga la URL puede ver el resultado final, pero esas páginas no se enumeran en el sitemap público. No hay cuentas de usuario; las etapas intermedias privadas de la revisión no aparecen en el visor público.",
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
        "La revisión de papers tiene un [benchmark sintético SPECS separado de 30 casos](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md). GPT-5.4 mini y GPT-5.5 detectaron los 30 defectos insertados; GPT-5.5 produjo 30,6% menos hallazgos, más consolidados. El conjunto alcanzó un techo y no establece precisión en papers reales completos.",
      ],
    },
    {
      title: "7. Contacto",
      paragraphs: [
        "Operador: Rafael de Menezes Ehlers. Para solicitudes de remoción, correcciones u otras consultas, abre un issue en [GitHub](https://github.com/rafaehlers/jiddu).",
      ],
    },
  ],

  how_it_works_title: "Cómo funciona Jiddu",
  how_it_works_subtitle:
    "Walkthrough técnico de cada pipeline. Nada se esconde — el código fuente es abierto bajo AGPL-3.0 en github.com/rafaehlers/jiddu, así que cualquier cosa descrita abajo puede ser contrastada con la implementación real.",
  how_it_works_sections: [
    {
      title: "1. Visión general",
      paragraphs: [
        "Jiddu corre seis análisis independientes: un detector de falacias, un pipeline de verificación de hechos (extracción + veredicto vía Sonar), una evaluación de imparcialidad, un explicador de papers párrafo a párrafo, un detector de slop de IA y una revisión adversarial de un único paper autónomo con verificación de literatura publicada. Son rutas separadas en la app (`/`, `/factcheck`, `/neutrality`, `/explain`, `/slop`, `/review`) y tablas separadas en la base. Ninguno depende de los otros.",
        "Los cinco pipelines de texto transmiten output estructurado de tool call de un LLM vía [OpenRouter](https://openrouter.ai); Jiddu controla los JSON Schemas y [partial-json](https://github.com/promplate/partial-json) permite que los hallazgos aparezcan mientras el modelo todavía escribe. La revisión de papers también usa SSE, pero para informar nueve etapas amplias; cada etapa completa y valida un artefacto estructurado antes de la siguiente.",
        "Todo el output va en el idioma de la UI elegido por el usuario. El mismo prompt se usa sin importar qué modelo elija el usuario — la diferencia de idioma viene de una única línea `OUTPUT LANGUAGE:` en el system prompt.",
      ],
    },
    {
      title: "2. Entrada: ingestión y segmentación",
      paragraphs: [
        "**URL.** El fetch usa headers similares a los de un navegador para reducir rechazos de filtros simples de bots. Cada redirect resuelve el DNS y se bloquea si alcanza un rango privado, loopback, link-local, CGNAT, multicast o reservado de IPv4/IPv6. El tamaño de la respuesta se limita a 5 MB y [@mozilla/readability](https://github.com/mozilla/readability) extrae el cuerpo del artículo.",
        "**PDF.** Parseado localmente con [LiteParse](https://github.com/run-llama/liteparse) como parser principal y [pdfjs-dist](https://mozilla.github.io/pdf.js/) como fallback. Los cinco pipelines de texto usan el modo rápido de LiteParse; la revisión adversarial usa el modo académico para preservar Markdown por página, orden espacial de lectura, OCR selectivo, señales de complejidad y screenshots. El PDF bruto no se sube como archivo, pero la revisión envía por OpenRouter imágenes renderizadas de páginas seleccionadas cuando la inspección visual es relevante.",
        "**Paste.** Usado tal cual, solo con espacios en blanco normalizados.",
        "**Segmentación.** El texto extraído se divide en oraciones con un separador que reconoce abreviaturas (`src/lib/sentences.ts`) — identifica abreviaturas en portugués (`sr.`, `dr.`, `prof.`), mantiene siglas como `U.S.` intactas y no rompe en medio de números como `3,4%`. Las oraciones se agrupan en chunks de ~12k caracteres (`src/lib/chunker.ts`) para que documentos largos quepan en la ventana de contexto del modelo sin perder los límites entre oraciones.",
      ],
    },
    {
      title: "3. Modelos y fallback",
      paragraphs: [
        "Dos familias de modelos aparecen en el selector: [🇺🇸 GPT-5.4 mini](https://openrouter.ai/openai/gpt-5.4-mini) (por defecto) y [🇨🇳 MiniMax M3](https://openrouter.ai/minimax/minimax-m3). Tener ambas permite comparar interpretaciones limítrofes y evita que todo análisis dependa de un solo proveedor.",
        "Si el modelo elegido falla *antes de emitir cualquier evento* (rate-limit del upstream, 5xx, etc.), la petición cae automáticamente al otro modelo — retry client-side, sin parpadeo en la UI. Una vez que el modelo ya emitió al menos un hallazgo/afirmación, no reintentamos: aceptamos la salida parcial y la capa de partial-parse rescata lo que pueda.",
        "Sonar Reasoning Pro se usa exclusivamente para los veredictos de fact-check (porque tiene búsqueda web incorporada). Nunca aparece en el selector de modelo.",
      ],
    },
    {
      title: "4. Detector de falacias",
      paragraphs: [
        "Catálogo de 46 falacias cubriendo relevancia, ambigüedad, presunción, apelaciones emocionales, razonamiento causal y evidencia. Cada falacia tiene un id estable y un color distinto (distribución por golden angle) usado para resaltar pasajes. La lista completa está en [/fallacies](/fallacies).",
        "El system prompt instruye al modelo a ser riguroso y conservador — marcar solo cuando hay una falacia clara y defendible. Dos cláusulas específicas aprietan esto: una cláusula de **disambiguation** (no marcar una oración con múltiples lecturas plausibles a menos que el contexto la resuelva) y una cláusula de **standalone-explanation** (cada explicación debe nombrar la premisa implícita y la conclusión para que el lector no tenga que volver a la fuente). Ambas destiladas del paper Claimify (Microsoft Research 2025).",
        "Cada hallazgo tiene severidad binaria (`baja` / `alta`). La puntuación general de falacia (0-100) es un promedio ponderado entre chunks, ponderado por la cuenta de caracteres. Las etiquetas por rango (`razonamiento limpio` / `problemas menores` / `varias falacias` / `muy falaz` / `propagandístico`) están escritas en el propio prompt para que el modelo tenga la misma calibración que muestra la UI.",
        "**Enrutamiento del modelo y por qué.** El GPT-5.4 mini o MiniMax M3 elegido realiza la clasificación completa en una pasada estructurada por chunk. La tarea usa un modelo económico porque el espacio de razonamiento está limitado por un catálogo fijo de 46 elementos, las oraciones exactas de la fuente y un JSON Schema; no hay búsqueda web ni un segundo modelo crítico. El modelo alternativo sigue disponible para comparar interpretaciones limítrofes de otra familia.",
        "Los chunks se ejecutan con concurrencia limitada y transmiten hallazgos en cuanto se validan. El fallo de un chunk no borra los demás; la puntuación final se calcula de forma determinista con los chunks completados, ponderados por caracteres. Esa resiliencia también significa que el resultado puede ser parcial, por lo que la puntuación es una ayuda de lectura y no la probabilidad de que el documento sea 'falaz'.",
        "El repositorio incluye evals de regresión para detecciones esperadas y trampas de falso positivo, pero Jiddu aún no ha publicado un benchmark de precisión con etiquetas humanas para este pipeline. Una ausencia no prueba razonamiento sólido, y un pasaje resaltado todavía exige que el lector juzgue si la falacia nombrada realmente aplica.",
      ],
    },
    {
      title: "5. Detector de slop",
      paragraphs: [
        "Misma arquitectura que el detector de falacias — misma ingestión, chunking, streaming, fallback de modelo y puntuación 0-100 ponderada por caracteres — con catálogo y prompt distintos, persistido en su propia tabla (resultados en `/s/:id`, mismo visor de comentarios al margen, vista de impresión y demos en `/s/demo-en|pt|es`).",
        "El catálogo cubre 18 patrones de escritura de slop de IA en cinco familias: vocabulario de catálogo, drama fabricado, estructura de plantilla, sustancia hueca y tics de formato. La lista completa con definiciones y ejemplos está en [/slop-patterns](/slop-patterns). La selección de patrones se basa en la skill de edición [no-ai-slop](https://github.com/petergyang/no-ai-slop) de Peter Yang (licencia MIT); la redacción del catálogo, el contenido trilingüe y el prompt de detección son propios de Jiddu.",
        "El prompt detecta **patrones, no autoría** — tiene prohibido afirmar que un texto fue o no escrito por IA (los humanos también escriben slop). Cada hallazgo cita el fragmento exacto, nombra el patrón y dice en pocas palabras qué haría una versión más limpia (afirmar el punto, nombrar la fuente, dar el número) sin reescribir nada. Bandas de puntuación: 0-15 suena humano, 16-35 condimento ligero, 36-60 con plantillas, 61-80 dominado por plantillas, 81-100 prosa de línea de montaje.",
        "**Enrutamiento del modelo y por qué.** Como en la detección de falacias, el GPT-5.4 mini o MiniMax M3 elegido procesa cada chunk contra un catálogo cerrado y un schema estructurado. No intervienen detector especializado, clasificador de marcas de agua ni modelo de autoría: el LLM actúa como crítico de estilo restringido. Los modelos económicos bastan para esta tarea de patrones superficiales, mientras la segunda familia permite comparar prosa cercana a una frontera de categoría.",
        "Los fallos de chunks quedan aislados y los hallazgos válidos siguen transmitiéndose. Jiddu combina las puntuaciones de los chunks completados por cantidad de caracteres y toma el resumen del chunk completado con mayor puntuación; nunca infiere autoría de ese agregado. Los documentos largos pueden producir un parcial útil, pero el número es solo un indicador de densidad de los patrones catalogados.",
        "El conjunto versionado de evals comprueba positivos representativos, prosa limpia y la salvaguarda de no inferir autoría, pero no es un benchmark poblacional de escritura humana frente a máquina. Deliberadamente: la función responde '¿qué patrones prefabricados aparecen?', no '¿quién o qué escribió esto?'.",
      ],
    },
    {
      title: "6. Fact-check — extracción de afirmaciones",
      paragraphs: [
        "Modelado en [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). El prompt pide al modelo pasar cada oración por cuatro etapas: **selection** (mantener solo oraciones con una afirmación verificable — opiniones, juicios de valor, preguntas retóricas se descartan), **disambiguation** (descartar oraciones con múltiples lecturas plausibles cuando el contexto no resuelve), **decomposition** (partir oraciones con múltiples hechos en afirmaciones separadas sin perseguir atomicidad infinita) y **decontextualization** (cada afirmación emitida debe sostenerse sola — resolver pronombres, agregar el año a un número que dependa de él, atribuir una cita a su fuente).",
        "Cada afirmación emitida tiene un tipo: `numeric`, `date`, `quote`, `causal` o `categorical`. El tipo informa cómo el verificador busca evidencia después.",
        "Tope duro de 50 afirmaciones por extracción (configurable por el operador). El tope existe porque cada afirmación después cuesta créditos de Sonar para verificar; una extracción sin tope sobre un PDF de 30 páginas podría acumular dinero serio antes de que el usuario lo note.",
        "**Enrutamiento del modelo y por qué.** El GPT-5.4 mini o MiniMax M3 elegido hace solo la extracción; no decide si una afirmación es verdadera. Las reglas inspiradas en Claimify y el schema estricto convierten esto en una tarea acotada de extracción de información, por eso aquí se usan los modelos económicos del selector y el modelo costoso con búsqueda se reserva para las afirmaciones que el usuario realmente manda verificar.",
        "La extracción transmite tarjetas de afirmaciones mientras los chunks corren en paralelo. Cada afirmación conserva la oración exacta de la fuente y una formulación autónoma, lo que permite auditar la descontextualización antes de gastar en verificación. Si falla un chunk, las afirmaciones de los chunks completados permanecen; la interfaz no debe leerse como prueba de que se encontró toda afirmación verificable.",
      ],
    },
    {
      title: "7. Fact-check — veredicto por afirmación",
      paragraphs: [
        "El veredicto es opt-in. La extracción sola es barata (una llamada al LLM). La verificación es bajo demanda: el usuario hace clic en **Verificar afirmaciones** en el viewer y cada afirmación se manda a [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro), una llamada por afirmación, con concurrencia limitada (6 en paralelo por defecto).",
        "Sonar devuelve un JSON con el veredicto (`respaldado` / `contradicho` / `mixto` / `no verificado`), una confianza entre 0 y 1, una justificación y una lista de fuentes citadas tomadas del canal `annotations` de Sonar. Si la confianza queda por debajo de 0.5, el veredicto se fuerza a `no verificado` — mejor exhibir 'evidencia insuficiente' que entregar una respuesta confiadamente equivocada.",
        "Cada fuente citada se clasifica en uno de seis tiers (según Goldfarb et al. 2025): `primary` (agencias oficiales de datos, decisiones judiciales, papers peer-reviewed), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. Una flag booleana aparte marca medios `state-controlled` (RT, CGTN, Xinhua, etc. — pero no BBC/NPR/Deutsche Welle, que son state-FUNDED pero editorialmente independientes).",
        "El lenguaje del veredicto es intencionalmente cauto con personas nombradas: nunca 'X miente' o 'esto es falso' — siempre 'la evidencia no respalda' / 'la evidencia contradice el número' / 'no encontramos evidencia que respalde'. Es una regla dura en el system prompt.",
        "**Enrutamiento del modelo y por qué.** Perplexity Sonar Reasoning Pro queda fijo para la verificación porque esta etapa necesita recuperación web actual y anotaciones de fuentes, no solo mejor generación de texto sin acceso externo. GPT-5.4 mini y MiniMax M3 nunca fabrican citas de veredicto; terminan después de la extracción. Separar extracción y verificación también hace visibles el costo, el comportamiento del caché y los fallos por afirmación.",
        "Las afirmaciones se verifican de forma independiente, por lo que un timeout o un conjunto débil de evidencia no invalida las demás. Jiddu normaliza la respuesta estructurada de Sonar, aplica el piso de confianza, conserva las URLs citadas y almacena el id del modelo utilizado. Los tiers describen el tipo de fuente, no una puntuación automática de verdad: incluso una fuente primaria puede estar desactualizada o ser malinterpretada.",
        "¿Qué tan preciso es esto en la práctica? Corrimos un [benchmark contra el corpus humano de PolitiFact](/benchmark). En 200 afirmaciones tomadas de las cuatro categorías polares de PolitiFact (true / mostly-true / false / pants-on-fire, desde 2020), el veredicto de Jiddu coincidió con el veredicto humano polar en 67.5% de los casos en total y 81.3% en las categorías menos ambiguas (true / false / pants-on-fire). Desacuerdo estricto — Jiddu diciendo lo opuesto polar del humano — ocurrió solo en 4.5% de los casos (9 de 200). El ~28% restante fue Jiddu devolviendo `mixed` o `unverified` en lugar de un veredicto polar, concentrado en el bucket `mostly_true` de PolitiFact (58% se volvieron `mixed` — solapamiento estructural, no error, ya que ambas etiquetas describen verdad parcial). Metodología, matriz de confusión y análisis de desacuerdos en el enlace.",
      ],
    },
    {
      title: "8. Fact-check — caché de veredictos",
      paragraphs: [
        "Cada afirmación verificada se hashea y se almacena. El hash es `sha256(lang + ':' + normalize(statement))` donde `normalize` pasa a minúsculas, quita marcas combinantes de acento, colapsa espacios y elimina puntuación final. Eso significa que reformulaciones de la misma afirmación colisionan, pero idiomas distintos no.",
        "Los TTL son por tipo de afirmación. `numeric` 30 días (IBGE y compañía revisan series), `date` y `categorical` 365 días (hechos históricos y definiciones son estables), `quote` y `causal` 90 días (re-examinables pero poco probables de cambiar). Un barrido best-effort borra filas expiradas en el camino de cache-miss, limitado a una vez cada 30 minutos para que el hot path siga barato.",
        "El usuario puede saltarse el caché con un botón de **refresh** por afirmación (fuerza una llamada Sonar fresca). Cuenta contra una cuota configurable por el operador — por defecto 2 refreshes por afirmación. Después de eso, el botón se oculta y la API devuelve 429.",
      ],
    },
    {
      title: "9. Imparcialidad",
      paragraphs: [
        "Distinto de la detección de falacias: un texto puede estar libre de falacias y ser fácticamente correcto y aun así usar encuadre cargado, atribución asimétrica o selección unilateral de fuentes. La evaluación de imparcialidad expone esos patrones.",
        "Ocho tipos de issue se marcan a nivel de oración: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. El modelo también clasifica el documento en uno de siete tipos de texto (informativo / opinión / discurso político / advocacy / análisis / marketing / redes sociales) — eso informa qué tan estricta es la auditoría.",
        "El veredicto a nivel documento es uno de `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. Jiddu **deliberadamente no clasifica dirección partidaria** (izquierda/derecha, pro-X/anti-Y). El paper de Forum AI que inspiró la metodología requiere un panel bipartidista de expertos para esa etapa; sin ese panel, las etiquetas partidarias son poco confiables y dañinas. En su lugar exhibimos patrones específicos que el lector puede auditar.",
        "**Enrutamiento del modelo y por qué.** El GPT-5.4 mini o MiniMax M3 elegido realiza la clasificación del tipo de texto, la detección de issues por oración y el veredicto del chunk en la misma llamada estructurada. Este pipeline no navega por la web ni decide si las afirmaciones subyacentes son verdaderas; usar el modelo económico del selector mantiene rápido el análisis de encuadre, mientras la familia alternativa permite comparar sensibilidad.",
        "En textos largos, los chunks se analizan en paralelo. El veredicto final se elige después de forma determinista como el más severo entre los chunks completados (`manipulation` por encima de `explicitly_partisan`, por encima de `partisan_lean`, por encima de `neutral`); confianza y justificación provienen del chunk más fuerte en ese nivel, y el tipo de documento es la moda entre chunks. Esto favorece el recall deliberadamente, así que un pasaje con encuadre fuerte puede gobernar el veredicto principal.",
        "Los evals ejercitan las ocho señales y ejemplos que no deberían marcarse, pero todavía no hay un benchmark publicado con panel humano para imparcialidad. El veredicto es, por tanto, una ayuda de navegación hacia pasajes auditables, no una medida objetiva de equilibrio político.",
      ],
    },
    {
      title: "10. Privacidad y estado de revisión",
      paragraphs: [
        "No hay cuentas de usuario. Los resultados completados usan URLs no listadas: cualquiera que tenga la URL puede ver el resultado final, pero esas páginas no se enumeran en el sitemap público. Los ledgers, la investigación y los juicios preliminares de la revisión de papers son artefactos intermedios internos y no se muestran en el resultado público.",
        "El contenido enviado pasa por OpenRouter al upstream del modelo elegido. En revisión de papers incluye imágenes renderizadas de páginas seleccionadas, no solo texto extraído. La etapa de literatura busca fuentes académicas públicas por afirmaciones técnicas, mientras los prompts prohíben consultas por título, autor u otros manuscritos de los mismos autores. El autocompletado envía solo la consulta del venue a DBLP. Registramos el IP para rate-limit y señales de abuso y no lo vendemos.",
        "Los resultados son automatizados y no revisados por defecto. Un resultado marcado explícitamente como revisado fue inspeccionado puntualmente por el operador; ese estado es una comprobación humana adicional, no una garantía de que todos los hallazgos sean correctos.",
      ],
    },
    {
      title: "11. Costo y controles de abuso",
      paragraphs: [
        "Cada ruta con costo tiene rate limit token bucket in-memory por IP. Los valores por defecto incluyen 30 análisis de falacias / hora, 30 extracciones de fact-check / hora, 10 verificaciones masivas / hora, 20 refreshes individuales / hora y, deliberadamente conservador, 4 revisiones de paper / hora con burst 2. El operador puede ajustar estos valores en runtime; los buckets agotados devuelven 429 con `Retry-After`.",
        "La extracción de fact-check tiene tope de 50 afirmaciones por documento y el refresh, 2 llamadas por afirmación. La revisión acepta exactamente un PDF, rechaza truncar silenciosamente por encima de 300.000 caracteres extraídos, limita la inspección visual a páginas seleccionadas y divide el trabajo costoso en etapas auditables. Estos controles evitan fan-out y costos accidentalmente ilimitados.",
      ],
    },
    {
      title: "12. Loop de feedback",
      paragraphs: [
        "Cada card de afirmación de fact-check tiene un botón **🚩 Reportar veredicto incorrecto**. Al pulsarlo se guarda una razón opcional junto con el statement y el veredicto actuales, para que el operador pueda revisar lo que vio el usuario aunque la afirmación se verifique de nuevo después.",
        "Las flags enviadas entran en una cola privada de moderación con estado `open`. El operador puede marcar cada una como `resolved` (concuerda con el usuario, planea arreglar) o `ignored` (el veredicto estaba bien, o el flag era spam), o eliminarla.",
        "Los reportes no cambian automáticamente un veredicto. El operador revisa cada entrada manualmente, por lo que el volumen de reportes por sí solo no sustituye la evidencia mostrada al lector.",
      ],
    },
    {
      title: "13. Modo Live (beta)",
      paragraphs: [
        "Pipeline separado en [/live](/live): la página captura audio del micrófono del usuario o, en navegadores Chromium, de una pestaña del navegador vía `getDisplayMedia`. El audio se transmite *directamente del navegador a la Realtime API de OpenAI* por WebRTC — nunca pasa por el servidor de Jiddu. El modelo de transcripción es `gpt-realtime-whisper`, y el idioma respeta el selector del header (EN / PT / ES).",
        "Cómo funciona el cableado: cuando el usuario hace clic en **Iniciar**, el navegador llama a `POST /api/live/token` para acuñar un client secret efímero de corta vida (el servidor de Jiddu guarda la `OPENAI_API_KEY` real; el navegador nunca la ve). El navegador abre entonces la peer-connection WebRTC con OpenAI usando ese secret y empieza a recibir deltas de transcripción. Cada ~500 caracteres nuevos (o cada 30 segundos, lo que ocurra primero), una llamada SSE separada a `POST /api/live/analyze` envía el transcript acumulado y corre el mismo prompt de falacia usado en cualquier lugar — este paso de análisis es una llamada distinta a la transcripción vía OpenAI de arriba, enrutada vía OpenRouter con el mismo selector GPT-5.4 mini / MiniMax M3 de los pipelines de texto. Los hallazgos aparecen en la UI casi en tiempo real. Al **Detener**, una última llamada con `finalize: true` commitea la sesión como un análisis `/a/<id>` normal, indistinguible aguas abajo de uno hecho vía paste.",
        "El costo está acotado por un cap duro de 60 minutos por sesión (≈ \\$1 de Realtime + costo del análisis LLM). El audio bruto nunca se almacena — solo la transcripción y los hallazgos detectados persisten. La página deliberadamente no está enlazada desde el nav mientras está en beta — se llega tecleando `/live` en la barra. La captura de audio de pestaña funciona solo en Chrome / Edge porque Safari y Firefox no exponen audio de pestaña vía `getDisplayMedia`; el micrófono funciona en todos lados.",
      ],
    },
    {
      title: "14. Explain — explicador de artículos",
      paragraphs: [
        "El pipeline Explain (`/explain`, resultados en `/e/:id`) recibe un artículo académico o documento técnico y produce una explicación párrafo a párrafo en lenguaje sencillo. Cada párrafo recibe una etiqueta de rol (Background / Objetivo / Método / Resultado / Interpretación / Limitación / Conclusión) y una explicación escrita en el nivel de audiencia elegido. Primero se genera un resumen general del documento.",
        "Niveles de audiencia: **Niño** (ELI5, analogías cotidianas, sin jerga), **Secundaria** (lenguaje claro, pocos términos técnicos explicados), **Universitario** (registro académico estándar, asume familiaridad con el campo), **Experto** (conciso, nivel de pares, terminología completa conservada). El nivel controla solo la complejidad del texto — no filtra ni valida el contenido.",
        "La etiqueta de rol es algorítmica. El modelo lee cada párrafo en contexto y asigna el rol que mejor describe su función en el argumento. Los artículos interdisciplinarios o los documentos con estructura no estándar pueden recibir etiquetas incorrectas.",
        "A diferencia de los pipelines de texto general, Explain está optimizado para artículos académicos estructurados. Los resultados en posts de blog, escritos legales o textos no estructurados serán de menor calidad.",
        "**Enrutamiento del modelo y por qué.** El GPT-5.4 mini o MiniMax M3 elegido escribe el resumen general, las etiquetas de rol y las explicaciones de párrafos en una pasada por chunk restringida por el schema. Explain usa los modelos económicos del selector porque transforma el texto suministrado en vez de investigar literatura o validar contenido de forma independiente; no se ejecutan búsqueda web, comprobación de citas ni segundo modelo crítico.",
        "Los chunks se ejecutan con concurrencia limitada y las explicaciones aparecen en el margen conforme llegan. Cada chunk puede proponer un resumen, pero Jiddu conserva de forma determinista el primero no vacío porque el primer chunk normalmente contiene abstract e introducción. Si un chunk falla, las explicaciones de los demás permanecen, por lo que puede haber huecos en papers largos o con formato inusual.",
        "Los evals actuales comprueban cobertura de roles, calibración de audiencia y fiabilidad del schema, no fidelidad factual contra anotaciones de expertos. Explain puede simplificar demasiado una salvedad o interpretar mal un método con exceso de confianza; debe facilitar la entrada al texto fuente, nunca sustituir su lectura.",
      ],
    },
    {
      title: "15. Revisión adversarial de papers",
      paragraphs: [
        "El pipeline de revisión (`/review`, resultados en `/r/:id`) acepta exactamente un PDF final como manuscrito autónomo, más venue objetivo, edición, track, tipo de paper y fecha opcional. No combina suplementos ni varios archivos. El resultado público incluye recomendación de gatekeeping, resumen, fortalezas, debilidades localizadas, preguntas, checklist de reproducibilidad, referencias y el estándar exacto del venue; los exports Markdown y print/PDF usan la misma revisión final almacenada.",
        "Metodológicamente, Jiddu adapta las dimensiones de revisión **SPECS** — Story, Presentation, Evaluations, Correctness y Significance — y el patrón de síntesis y autocrítica por etapas descrito en [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu es una implementación independiente, con su propio ledger de afirmaciones y evidencias, calibración por venue, parser, contrato de salida y salvaguardas; no reproduce el sistema de AAAI-26.",
        "Después del ledger paginado y la investigación de literatura, cinco especialistas independientes auditan **Story, Presentation, Evaluations, Correctness y Significance**. Evaluations y Correctness pueden proponer cálculos aritméticos permitidos que Jiddu recalcula sin ejecutar código del manuscrito. Síntesis y autocrítica son seguidas por validación de fuentes, auditoría de calidad con otro modelo y un gate determinista que preserva todo hallazgo MAJOR/MODERATE retenido.",
        "El formulario ofrece profundidad **Estándar** y **Profunda**. Estándar usa el modelo económico seleccionado y otro modelo del catálogo como crítico. Profunda usa modelos de razonamiento más fuertes en evaluación, corrección, significancia y síntesis, con Claude Opus 4.8 como crítico independiente por defecto; tarda más y cuesta más.",
        "**Enrutamiento de modelos y por qué.** En modo Estándar, el modelo elegido en el formulario — GPT-5.4 mini por defecto o MiniMax M3 — ejecuta el ledger, la investigación de literatura, los cinco especialistas SPECS, la síntesis y la autocrítica. La auditoría de calidad se asigna deliberadamente al otro modelo del catálogo, para que el borrador no sea aprobado solo por el modelo que lo escribió.",
        "En modo Profundo, el modelo seleccionado conserva ledger, Story y Presentation; GPT-5.5 con razonamiento high ejecuta investigación de literatura, Evaluations, Correctness, Significance, síntesis, autocrítica y cualquier reparación; Claude Opus 4.8 audita de forma independiente la revisión resultante. Esto concentra el razonamiento costoso en validez numérica, diseño experimental, novedad y síntesis entre etapas, mientras una familia diferente de modelos realiza el desafío final para reducir puntos ciegos correlacionados.",
        "En el [benchmark sintético SPECS de 30 casos de Jiddu](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md), GPT-5.4 mini y GPT-5.5 detectaron todos los defectos inyectados, pero GPT-5.5 produjo un 30,6% menos de hallazgos, más consolidados. El benchmark alcanzó un techo y no demuestra superioridad en papers completos; Profunda es una capa adicional de escrutinio, no una garantía de corrección. El operador puede sustituir ambos modelos de Profunda mediante `PAPER_REVIEW_DEEP_MODEL` y `PAPER_REVIEW_CRITIC_MODEL`.",
        "El autocompletado combina descubrimiento gratuito y sin cuenta mediante [DBLP](https://dblp.org) con perfiles 2026 verificados y versionados de NeurIPS, ICML, ICLR, AAAI, IJCAI y CVPR. Un perfil verificado inyecta criterios y requisitos oficiales en la síntesis y la autocrítica y se persiste con URLs fuente. Un venue solo de DBLP o sin coincidencia usa una rúbrica académica general claramente identificada; incompatibilidades de edición, track o tipo se marcan como no verificadas, nunca se adivinan.",
        "Cada debilidad sustantiva debe incluir página o sección del manuscrito y severidad `MAJOR`, `MODERATE` o `MINOR`. La revisión sigue siendo automatizada: puede omitir problemas, inventar comparaciones o aplicar mal un criterio, y no es revisión oficial por pares ni predicción de aceptación.",
      ],
    },
    {
      title: "16. API pública & MCP (para agentes)",
      paragraphs: [
        "Además del app web, los cinco pipelines de texto se exponen como una API REST pública para agentes y scripts: `POST /api/v1/detect-fallacies`, `/fact-check`, `/assess-neutrality`, `/explain`, `/detect-slop`. Son síncronos — entra una solicitud JSON (`{ text }`, 40–2000 caracteres, más `lang` opcional y, en explain, `level`) y sale una respuesta JSON. Ejecutan los generadores hasta el final sobre un único chunk y no persisten filas.",
        "Las solicitudes se autentican con el encabezado `X-Jiddu-Key`. Las claves las emite el operador, se guardan solo como hash sha256, se muestran una vez y tienen límites por clave separados de los límites por IP del app web. El fact-check vía API extrae y verifica cada afirmación, con un tope de afirmaciones por solicitud para que una llamada no dispare verificaciones ilimitadas en el Sonar pago.",
        "La revisión adversarial se expone como job asíncrono persistido: `POST /api/v1/adversarial-reviews` recibe un PDF subido o una `pdf_url` pública y devuelve `202`; `GET /api/v1/adversarial-reviews/{id}` informa la etapa actual y finalmente entrega la revisión estructurada. Así el flujo de nueve etapas y varios minutos queda fuera del contrato síncrono de texto.",
        "El servidor MCP alojado en `POST /api/mcp` expone las cinco herramientas de texto más `start_adversarial_review` y `get_adversarial_review`. Cualquier cliente MCP se conecta mediante `mcp-remote`; las mismas herramientas también vienen en el paquete standalone `jiddu-mcp`. Snippets y docs orientadas a máquinas en [/api-access](/api-access).",
        "La calidad se monitorea con un conjunto fijo de evals (15–16 casos por herramienta) versionado en el repositorio y comparado con resultados esperados; el informe publicado está en [evals/report.md](https://github.com/rafaehlers/jiddu/blob/main/evals/report.md).",
      ],
    },
    {
      title: "17. Open source y metodología",
      paragraphs: [
        "El código fuente está en [github.com/rafaehlers/jiddu](https://github.com/rafaehlers/jiddu) bajo licencia [AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.txt). AGPL cierra el 'SaaS loophole' que GPL deja abierto: cualquiera que corra una versión modificada como servicio de red debe publicar el código fuente modificado.",
        "[Claimify](https://arxiv.org/abs/2502.10855) orienta la extracción de afirmaciones, y [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) orienta la evaluación de veredictos, los tiers de fuentes y la imparcialidad. [no-ai-slop](https://github.com/petergyang/no-ai-slop) aporta la taxonomía inicial para detectar patrones de escritura.",
        "La revisión adversarial de papers adapta las dimensiones SPECS y la síntesis y autocrítica por etapas descritas en [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu añade ledger, extracción con LiteParse, descubrimiento vía DBLP, perfiles de venue, validación de fuentes y gate de retención propios. No está afiliado a esos grupos, DBLP ni los venues.",
        "La evaluación publicada actualmente incluye el [benchmark PolitiFact de 200 afirmaciones](/benchmark) y un [benchmark sintético SPECS de 30 casos](https://github.com/rafaehlers/jiddu/blob/main/evals/paper-review/report.md). Ambos documentan sus límites y ninguno garantiza corrección en un texto o paper nuevo.",
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
  nav_source: "Código fuente",

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
    "Escucha en tiempo real y observa las falacias aparecer mientras la persona habla.",
  live_source_mic: "Micrófono",
  live_source_tab: "Pestaña del navegador",
  live_source_tab_chrome_only: "Solo Chrome",
  live_source_tab_tooltip: "Capturar audio de una pestaña del navegador",
  live_source_tab_unsupported: "La captura de pestaña requiere Chrome o Edge",
  live_language_follows_header: "El idioma sigue el selector del encabezado.",
  live_start: "Iniciar",
  live_stop: "Detener y finalizar",
  live_findings: "Falacias",
  live_running_score: "Puntuación parcial",
  live_privacy_note:
    "El audio se transmite directamente desde tu navegador a la API Realtime de OpenAI vía WebRTC. El audio en bruto no se almacena — solo se guardan la transcripción y las falacias detectadas, y estarán disponibles en una URL compartible cuando detengas la sesión.",
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
  live_session_saved: "Sesión guardada.",
  live_view_analysis: "Ver análisis completo",
  live_start_new: "Nueva grabación",
};

export const MESSAGES: Record<Lang, Messages> = { en, pt, es };

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  pt: "Português",
  es: "Español",
};
