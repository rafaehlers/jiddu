import type { Lang } from "../fallacies";

export type Messages = {
  tagline: string;

  // Home
  hero_title: string;
  hero_subtitle: string;
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

  // Header nav
  nav_fallacies: string;
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

  hero_title: "Read any text with a critical mind in the margin.",
  hero_subtitle:
    "Upload a PDF, paste text, or drop a URL. Jiddu highlights the passages that contain logical fallacies and explains each one in a comment — just like a reviewer in Word — and gives the whole piece a fallacy score from 0 to 100.",
  privacy: "Privacy:",
  privacy_body:
    "your text is sent to the selected model (OpenAI or MiniMax, routed via OpenRouter) for analysis and stored locally under a shareable id.",
  see_demo: "See a demo",
  see_demo_hint: "Want a quick look without running an analysis?",
  bench_badge_label:
    "Pipeline validated · 67.5% match with PolitiFact in a 200-claim benchmark",
  bench_badge_link: "view report",
  pipelines_heading: "Four lenses on the same text",
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
  mode_explain: "Explain",
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

  nav_legal: "Terms",
  nav_how_it_works: "How it works",
  nav_api: "API",
  api_access_title: "Jiddu API & MCP",
  api_access_subtitle:
    "Use Jiddu's four reading tools from your own code or agent — a documented REST API and an MCP server.",
  api_access_sections: [
    {
      title: "Endpoints",
      paragraphs: [
        "Jiddu exposes its four analysis pipelines as a public REST API. Every endpoint takes a JSON body with a `text` field (40–2000 characters) plus an optional `lang` (`en` / `pt` / `es`), and returns structured JSON.",
        "```\nPOST /api/v1/detect-fallacies\nPOST /api/v1/fact-check\nPOST /api/v1/assess-neutrality\nPOST /api/v1/explain\n```",
        "`detect-fallacies`, `assess-neutrality` and `explain` are fast. `fact-check` extracts each claim and verifies it against live web search, so it is slower and metered.",
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
        "For agents, connect to the hosted Jiddu MCP server by URL — nothing to install or clone. It exposes the same four tools and bridges to your MCP client (e.g. Claude Desktop) via the public `mcp-remote` helper:",
        "```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\", \"--header\", \"X-Jiddu-Key:your-key-here\"]\n    }\n  }\n}\n```",
        "Machine-oriented docs — when to use each tool, response shapes, and how to chain them — live in [AGENT.md](https://github.com/rafaehlers/jiddu/blob/main/packages/jiddu-mcp/AGENT.md).",
      ],
    },
    {
      title: "Limits & reliability",
      paragraphs: [
        "Text is capped at 2000 characters per request. Rate limits are per key; exceeding them returns HTTP 429 with a `retry_after_seconds` field. Outputs are automated and can be wrong — treat them as signals to prompt verification, not as final authority.",
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
  print_generated_at: (when) => `Generated ${when} · jiddu.app`,
  legal_title: "Terms and disclaimers",
  legal_subtitle:
    "Read this before using Jiddu, especially before sharing an analysis publicly.",
  legal_last_updated: "Last updated: 2026-05-18",
  legal_sections: [
    {
      title: "1. What Jiddu does",
      paragraphs: [
        "Jiddu is an automated tool. It uses large language models (currently routed through OpenRouter to OpenAI, Anthropic, MiniMax and Perplexity Sonar) to (a) flag passages that may contain logical fallacies and (b) extract verifiable factual claims from text and offer a verdict based on a web search.",
        "Jiddu does not employ human editors. Every output you see is produced by software. The tool is meant to assist critical reading — not to replace it.",
      ],
    },
    {
      title: "2. No claim of truth",
      paragraphs: [
        "The verdicts (\"supported\", \"contradicted\", \"mixed\", \"unverified\") and the fallacy labels are best-effort automated judgements. They can be wrong — sometimes confidently wrong.",
        "Jiddu does not assert that any statement, person, or document is true, false, lying, or deceitful. The labels are signals to prompt your own verification. Always read the cited sources and form your own conclusion.",
      ],
    },
    {
      title: "3. Use at your own risk",
      paragraphs: [
        "You are responsible for how you use the analysis and what you share or publish. If you republish a Jiddu result, you adopt that content as your own — Jiddu's authors are not responsible for downstream uses.",
        "Do not submit confidential, proprietary, or personal data. Submitted text is forwarded to the model providers above for processing and stored under a shareable id.",
      ],
    },
    {
      title: "4. Persons and public figures",
      paragraphs: [
        "Analyses about named persons (politicians, journalists, executives) are produced by software searching public web sources. The language Jiddu uses is intentionally cautious (\"evidence does not support\", \"we could not find\") — never adopt a stronger framing than the tool emits.",
        "If you believe a verdict is unfair or unsupported, use the \"report wrong verdict\" button on the relevant claim. Repeated unfair flags against the same person may be removed at the operator's discretion.",
      ],
    },
    {
      title: "5. Privacy",
      paragraphs: [
        "Each analysis is assigned a short id and stored on a server in Brazil. Anyone with the URL can view it. There are no user accounts.",
        "We log the request IP for rate-limiting and abuse detection. We do not sell or share that information.",
        "Page traffic is measured via Google Analytics (gtag.js).",
      ],
    },
    {
      title: "6. Methodology",
      paragraphs: [
        "Our claim extraction and verification pipeline is inspired by [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025) for the extraction stage, and by the evaluation framework described in [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) for the verdict assessment, source-quality tiers and neutrality dimension. Our choice of 4 verdict classes (supported / contradicted / mixed / unverified) rather than the 5- or 6-class schemes used by some fact-checking outlets is informed by [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909), who found that 3-class labeling outperforms 5-class for LLM-based fact-checking — the additional categories in the middle introduce ambiguity without improving accuracy.",
        "Jiddu is not affiliated with any of those research groups; we cite them because the methodology behind the tool is grounded in their work, and users should know that the design choices have an academic basis.",
        "The fact-check pipeline has been benchmarked against the [PolitiFact](https://www.politifact.com) human-labeled corpus (via the [LIAR2 dataset](https://github.com/chengxuphd/liar2), Apache-2.0). On 200 claims from PolitiFact's polar buckets, Jiddu's verdict matched the human verdict in 67.5% of cases overall and 81.3% on the unambiguous true / false / pants-on-fire buckets, with strict polar disagreement in only 4.5%. Full methodology, confusion matrix and disagreement analysis at [docs/benchmark-politifact.md](/benchmark).",
      ],
    },
    {
      title: "7. Explain feature",
      paragraphs: [
        "The Explain pipeline produces automated plain-language interpretations of academic papers and technical documents. It does not assess the truth, accuracy, or validity of the paper's claims — it only explains what each paragraph says and how it fits the argument.",
        "The audience level you choose (Child / High school / Undergraduate / Expert) adjusts prose complexity only. It does not filter, validate, or change the meaning of the underlying content.",
        "Paragraph role tags (Background, Objective, Method, Result, Interpretation, Limitation, Conclusion) are algorithmic predictions. They may be incorrect, especially for interdisciplinary papers or documents that don't follow a standard structure.",
        "Explanations work best on structured academic papers. Results on unstructured prose, blog posts, or non-academic documents may be lower quality.",
      ],
    },
    {
      title: "8. Contact",
      paragraphs: [
        "Operator: Rafael de Menezes Ehlers. For takedown requests, corrections, or other concerns, contact via LinkedIn (linked in the footer).",
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
        "Jiddu runs four independent analyses on the same input text: a fallacy detector, a fact-check pipeline (extraction + Sonar-based verdict), a neutrality assessment, and a paragraph-by-paragraph paper explainer. They are separate routes in the app (`/`, `/factcheck`, `/neutrality`, `/explain`) and separate database tables. None of them is required by the others.",
        "Each analysis is a streaming request to an LLM via [OpenRouter](https://openrouter.ai). The model is told to call a function (OpenAI-style tool use) whose JSON Schema we control. We parse the tool-call arguments incrementally with [partial-json](https://github.com/promplate/partial-json) so findings show up in the UI while the model is still writing.",
        "All output is in the user's UI language. The same prompt is used regardless of which model the user picks — the language difference comes from a single `OUTPUT LANGUAGE:` line in the system prompt.",
      ],
    },
    {
      title: "2. Input: ingestion and segmentation",
      paragraphs: [
        "**URL.** The fetch sends real-browser headers (current Chrome User-Agent, Accept-Language pt-BR, sec-ch-ua, sec-fetch-*) so naive bot-blockers don't reject it. Every redirect hop is DNS-resolved and rejected if the IP falls inside RFC1918, loopback, link-local, CGNAT, multicast or reserved IPv4/IPv6 ranges — that closes the SSRF door, including the AWS metadata IP (169.254.169.254) and the local NPM admin (port 81 on the VPS). Response body is capped at 5 MB. The HTML then passes through [@mozilla/readability](https://github.com/mozilla/readability) for article extraction.",
        "**PDF.** Parsed in-process with [pdfjs-dist](https://mozilla.github.io/pdf.js/) — never sent to a remote service. The model only ever sees plain text.",
        "**Paste.** Used as-is, only whitespace-normalized.",
        "The extracted text is then split into sentences with an abbreviation-aware splitter (`src/lib/sentences.ts`) — it recognizes Portuguese abbreviations (`sr.`, `dr.`, `prof.`), keeps initialisms like `U.S.` intact, and doesn't break in the middle of numbers like `3,4%`. Sentences are grouped into chunks of ~12k characters (`src/lib/chunker.ts`) so long documents fit the model context window without losing sentence boundaries.",
      ],
    },
    {
      title: "3. Models and fallback",
      paragraphs: [
        "Two models are exposed in the picker: [🇺🇸 GPT-5.4 mini](https://openrouter.ai/openai/gpt-5.4-mini) (default) and [🇨🇳 MiniMax M2.7](https://openrouter.ai/minimax/minimax-m2.7). They were picked from opposite geopolitical backgrounds so a user worried about training-data bias can run the same text through both and compare.",
        "If the user-picked model fails *before emitting any event* (rate-limit from upstream, 5xx, etc.), the request falls through to the other model automatically — client-side retry, no UI flicker. Once the model has emitted at least one finding/claim, we don't retry: we accept the partial output and let the partial-parse layer salvage it.",
        "Sonar Reasoning Pro is used exclusively for fact-check verdicts (because it has built-in web search). It is never exposed in the model picker.",
      ],
    },
    {
      title: "4. Fallacy detector",
      paragraphs: [
        "Catalog of 28 fallacies covering relevance, ambiguity, presumption, emotional appeals, causal reasoning and evidence. Each fallacy has a stable id and a distinct color (golden-angle hue distribution) used to highlight passages. The full list is at [/fallacies](/fallacies).",
        "The system prompt instructs the model to be rigorous and conservative — flag only when there is a clear, defensible fallacy. Two specific rules tighten this: a **disambiguation** clause (don't flag a sentence with multiple plausible readings unless context resolves it) and a **standalone-explanation** clause (each explanation must name the implied premise and conclusion so a reader doesn't need to re-read the source). Both clauses are distilled from the Claimify paper (Microsoft Research 2025).",
        "Each finding has a binary severity (`low` / `high`). The overall fallacy score (0-100) is a weighted average across chunks, weighted by character count. The score range labels (`clean reasoning` / `minor issues` / `several fallacies` / `highly fallacious` / `propagandistic`) are spelled out in the prompt itself so the model has the same calibration the UI uses.",
      ],
    },
    {
      title: "5. Fact-check — claim extraction",
      paragraphs: [
        "Modelled on [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). The prompt asks the model to walk every sentence through four stages: **selection** (keep only sentences with a verifiable claim — opinions, value judgements, rhetorical questions get dropped), **disambiguation** (drop sentences with multiple plausible readings when context doesn't resolve them), **decomposition** (split multi-fact sentences into separate claims without chasing infinite atomicity), and **decontextualization** (every emitted claim must stand alone — resolve pronouns, add the year for a number that depends on it, attribute a quote to its source).",
        "Each emitted claim is typed: `numeric`, `date`, `quote`, `causal`, or `categorical`. The type informs how the verifier later searches for evidence.",
        "Hard cap of 50 claims per extraction (admin-tunable). The cap exists because each claim later costs Sonar credits to verify; an uncapped extraction on a 30-page PDF could rack up serious money before the user notices.",
      ],
    },
    {
      title: "6. Fact-check — per-claim verdict",
      paragraphs: [
        "Verdict is opt-in. Extraction alone is cheap (one LLM call). Verification is on demand: the user clicks **Verify claims** in the viewer and each claim is sent to [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro), one call per claim, with bounded concurrency (6 parallel by default).",
        "Sonar returns a JSON payload with the verdict (`supported` / `contradicted` / `mixed` / `unverified`), a confidence between 0 and 1, a rationale, and a list of cited sources collected from Sonar's `annotations` channel. If confidence is below 0.5, the verdict is forced to `unverified` — better to surface 'not enough evidence' than to ship a confident wrong call.",
        "Every cited source is classified into one of six tiers (per Goldfarb et al. 2025): `primary` (official data agencies, court rulings, peer-reviewed papers), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. A separate boolean flag marks `state-controlled` outlets (RT, CGTN, Xinhua, etc. — but not BBC/NPR/Deutsche Welle, which are state-FUNDED but editorially independent).",
        "Verdict language is intentionally cautious about named people: never 'X is lying' or 'this is false' — always 'evidence does not support' / 'evidence contradicts the figure' / 'we could not find evidence that supports'. This is a hard rule in the system prompt.",
        "How accurate is this in practice? We benchmarked the pipeline against [PolitiFact's human-labeled corpus](/benchmark). On 200 claims drawn from PolitiFact's four polar buckets (true / mostly-true / false / pants-on-fire, 2020-onward), Jiddu's verdict matched the human polar verdict in 67.5% of cases overall and 81.3% on the unambiguous true / false / pants-on-fire buckets. Strict polar disagreement — Jiddu calling a claim the opposite of the human — happened in only 4.5% of cases (9 of 200). The remaining ~28% were Jiddu returning `mixed` or `unverified` instead of a polar verdict, concentrated on PolitiFact's `mostly_true` bucket (where 58% became `mixed` — a structural overlap, not a miss, since both labels describe partial truth). Full methodology, confusion matrix and disagreement analysis at the link.",
      ],
    },
    {
      title: "7. Fact-check — verdict cache",
      paragraphs: [
        "Each verified claim is hashed and stored. The hash is `sha256(lang + ':' + normalize(statement))` where `normalize` lowercases, strips combining-mark accents, collapses whitespace and removes trailing punctuation. That means rewordings of the same claim collide, but cross-language doesn't.",
        "TTLs are per claim type. `numeric` 30 days (IBGE and friends revise series), `date` and `categorical` 365 days (historical facts and definitions are stable), `quote` and `causal` 90 days (re-examinable but unlikely to flip). A best-effort sweep deletes expired rows on the cache-miss path, rate-limited to once every 30 minutes so the hot path stays cheap.",
        "The user can bypass the cache with a per-claim **refresh** button (forces a fresh Sonar call). That counts against an admin-tunable refresh quota — default is 2 refreshes per claim. After that, the button hides and the API returns 429.",
      ],
    },
    {
      title: "8. Neutrality",
      paragraphs: [
        "Distinct from fallacy detection: a text can be fallacy-free and factually accurate while still using loaded framing, asymmetric attribution or one-sided sourcing. Neutrality surfaces those patterns.",
        "Eight issue types are flagged at the sentence level: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. The model also classifies the document into one of seven text types (informational / opinion / political speech / advocacy / analysis / marketing / social_media) which informs how strict the audit is.",
        "The document-level verdict is one of `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. Jiddu **deliberately does not classify partisan direction** (left/right, pro-X/anti-Y). The Forum AI paper that inspired the methodology requires a bipartisan expert panel for that step; without one, partisan labels are unreliable and harmful. We surface specific patterns the reader can audit instead.",
      ],
    },
    {
      title: "9. Storage, privacy and reviewers",
      paragraphs: [
        "Persistence is a single SQLite file on a Hostinger VPS, mounted as a Docker volume. There are no user accounts. Each analysis gets a short id and lives under `/a/<id>`, `/f/<id>` or `/n/<id>`. Anyone with the URL can view.",
        "The submitted text is sent to OpenRouter, which routes it to whichever upstream serves the picked model. We don't relay it anywhere else. We log the request IP for rate-limiting and abuse signalling and we don't sell or share that.",
        "Each analysis has a `reviewedAt` timestamp. By default it's null, meaning the analysis is automated and has not been spot-checked by an operator. The admin (at `/admin`, password-gated) can mark individual analyses as reviewed.",
      ],
    },
    {
      title: "10. Cost and abuse controls",
      paragraphs: [
        "Every cost-incurring route has an in-memory token-bucket rate limit per IP. Defaults: 30 fallacy analyses / hour, 30 fact-check extractions / hour, 10 bulk verifications / hour, 20 per-claim refreshes / hour, 20 feedback flags / hour. All values are admin-tunable at runtime via `/admin/settings` — no redeploy needed. When a bucket empties, the API returns 429 with a `Retry-After` header.",
        "The fact-check extraction caps at 50 claims per document. The per-claim refresh caps at 2 calls per claim. Both are admin-configurable. These are the structural defences against a single user racking up an unexpected bill.",
      ],
    },
    {
      title: "11. Feedback loop",
      paragraphs: [
        "Every fact-check claim card has a **🚩 Report wrong verdict** button. Clicking it captures an optional free-text reason and POSTs to a feedback endpoint, which snapshots the current statement + verdict (so the admin sees what the user was looking at, even if the verdict later gets re-verified).",
        "Submitted flags land in an admin queue at `/admin/feedback` with status `open`. The operator can mark each as `resolved` (concur with the user, plan to fix) or `ignored` (the verdict was correct, or the flag was spam), or delete it. The admin home shows a red badge with the open count.",
        "There is currently no automatic action on the verdict when flags accumulate — every entry is reviewed manually. Future improvement: a 'disputed' badge in the public viewer when N flags pile up on the same claim.",
      ],
    },
    {
      title: "12. Live mode (beta)",
      paragraphs: [
        "A separate pipeline at [/live](/live): the page captures audio from the user's microphone or, on Chromium browsers, from a browser tab via `getDisplayMedia`. The audio is streamed *directly from the browser to OpenAI's Realtime API* over WebRTC — it never passes through the Jiddu server. The transcription model is `gpt-realtime-whisper`, and the language is honored from the i18n header selector (EN / PT / ES).",
        "How the wiring works: when the user presses **Start**, the browser calls `POST /api/live/token` to mint a short-lived ephemeral client secret (the Jiddu server holds the actual `OPENAI_API_KEY`; the browser never sees it). The browser then opens the WebRTC peer-connection to OpenAI using that secret and starts receiving transcript deltas. Every ~500 new characters (or every 30 seconds, whichever comes first), a separate SSE call to `POST /api/live/analyze` ships the cumulative transcript and runs the same fallacy prompt used everywhere else — findings stream back into the UI in near-real-time. On **Stop**, a final `finalize: true` call commits the session as a normal `/a/<id>` analysis, indistinguishable downstream from a pasted-text analysis.",
        "Cost is bounded by a hard 60-minute session cap (≈ \\$1 of Realtime + LLM analysis cost per session). The raw audio is never stored — only the transcript and the detected findings are persisted. The page is intentionally not linked from the nav while in beta — reach it by typing `/live` in the URL bar. Tab-audio capture works in Chrome / Edge only because Safari and Firefox don't expose tab audio through `getDisplayMedia`; the microphone source works everywhere.",
      ],
    },
    {
      title: "13. Explain — paper explainer",
      paragraphs: [
        "The Explain pipeline (`/explain`, results at `/e/:id`) takes an academic paper or technical document and produces a paragraph-by-paragraph plain-language explanation. Each paragraph gets a role tag (Background / Objective / Method / Result / Interpretation / Limitation / Conclusion) and an explanation written at the chosen audience level. A whole-document overview is generated first.",
        "Audience levels: **Child** (ELI5, everyday analogies, no jargon), **High school** (clear language, a few technical terms explained), **Undergraduate** (standard academic register, assumes field familiarity), **Expert** (concise, peer-level, full terminology retained). The level controls prose complexity only — it does not filter or validate content.",
        "Role tagging is algorithmic. The model reads each paragraph in context and assigns the role that best describes its function in the argument. Interdisciplinary papers or documents with non-standard structure may receive incorrect tags.",
        "Unlike the other three pipelines, Explain is optimised for structured academic papers. Results on blog posts, legal filings, or unstructured prose will be lower quality.",
      ],
    },
    {
      title: "14. Open source and methodology",
      paragraphs: [
        "Source code is at [github.com/rafaehlers/jiddu](https://github.com/rafaehlers/jiddu) under the [AGPL-3.0-or-later license](https://www.gnu.org/licenses/agpl-3.0.txt). AGPL closes the 'SaaS loophole' that GPL leaves open: anyone running a modified version as a network service must publish the modified source.",
        "Two papers ground the design: [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson — Microsoft Research, 2025) for the four-stage claim extraction; and [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) for the verdict assessment, the 6-tier source taxonomy and the neutrality framework. Jiddu is not affiliated with either group.",
        "The full disclaimer about what Jiddu does and doesn't claim is at [/legal](/legal).",
      ],
    },
  ],

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

  nav_fallacies: "Fallacy guide",
  nav_source: "Source",

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

  hero_title: "Leia qualquer texto com um revisor crítico na margem.",
  hero_subtitle:
    "Envie um PDF, cole um texto ou solte uma URL. O Jiddu destaca os trechos com falácias lógicas e explica cada um em um comentário — como um revisor no Word — e dá uma nota de 0 a 100 para o texto inteiro.",
  privacy: "Privacidade:",
  privacy_body:
    "seu texto é enviado ao modelo selecionado (OpenAI ou MiniMax, roteado via OpenRouter) para análise e armazenado localmente sob um id compartilhável.",
  see_demo: "Ver demonstração",
  see_demo_hint: "Quer uma amostra rápida sem rodar uma análise?",
  bench_badge_label:
    "Pipeline validado · 67,5% de concordância com PolitiFact em benchmark de 200 claims",
  bench_badge_link: "ver relatório",
  pipelines_heading: "Quatro lentes sobre o mesmo texto",
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
  mode_explain: "Explicar",
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

  nav_legal: "Termos",
  nav_how_it_works: "Como funciona",
  nav_api: "API",
  api_access_title: "API & MCP do Jiddu",
  api_access_subtitle:
    "Use as quatro ferramentas de leitura do Jiddu no seu próprio código ou agente — uma REST API documentada e um servidor MCP.",
  api_access_sections: [
    {
      title: "Endpoints",
      paragraphs: [
        "O Jiddu expõe seus quatro pipelines de análise como uma REST API pública. Todo endpoint recebe um corpo JSON com um campo `text` (40–2000 caracteres) e um `lang` opcional (`en` / `pt` / `es`), e retorna JSON estruturado.",
        "```\nPOST /api/v1/detect-fallacies\nPOST /api/v1/fact-check\nPOST /api/v1/assess-neutrality\nPOST /api/v1/explain\n```",
        "`detect-fallacies`, `assess-neutrality` e `explain` são rápidos. O `fact-check` extrai cada afirmação e a verifica com busca na web ao vivo, então é mais lento e medido.",
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
        "Para agentes, conecte-se ao servidor MCP hospedado do Jiddu por URL — nada para instalar ou clonar. Ele expõe as mesmas quatro ferramentas e faz a ponte com seu cliente MCP (ex.: Claude Desktop) via o utilitário público `mcp-remote`:",
        "```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\", \"--header\", \"X-Jiddu-Key:sua-chave-aqui\"]\n    }\n  }\n}\n```",
        "A documentação orientada a máquina — quando usar cada ferramenta, formatos de resposta e como encadeá-las — está em [AGENT.md](https://github.com/rafaehlers/jiddu/blob/main/packages/jiddu-mcp/AGENT.md).",
      ],
    },
    {
      title: "Limites & confiabilidade",
      paragraphs: [
        "O texto é limitado a 2000 caracteres por requisição. Os limites de taxa são por chave; ao excedê-los, a resposta é HTTP 429 com um campo `retry_after_seconds`. As saídas são automatizadas e podem errar — trate-as como sinais para verificação, não como autoridade final.",
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
  print_generated_at: (when) => `Gerado em ${when} · jiddu.app`,

  legal_title: "Termos e isenções",
  legal_subtitle:
    "Leia antes de usar o Jiddu, especialmente antes de compartilhar uma análise publicamente.",
  legal_last_updated: "Atualizado em: 2026-05-18",
  legal_sections: [
    {
      title: "1. O que o Jiddu faz",
      paragraphs: [
        "O Jiddu é uma ferramenta automatizada. Ele usa modelos de linguagem (atualmente roteados via OpenRouter para OpenAI, Anthropic, MiniMax e Perplexity Sonar) para (a) sinalizar passagens que podem conter falácias lógicas e (b) extrair afirmações factuais verificáveis de um texto e oferecer um veredito baseado em busca na web.",
        "O Jiddu não tem editores humanos. Todo resultado que você vê é produzido por software. A ferramenta serve como apoio à leitura crítica — não a substitui.",
      ],
    },
    {
      title: "2. Sem afirmação de verdade",
      paragraphs: [
        'Os vereditos ("sustentado", "contradito", "misto", "não verificado") e os rótulos de falácia são juízos automatizados de melhor esforço. Podem estar errados — às vezes com alta confiança.',
        "O Jiddu não afirma que qualquer declaração, pessoa ou documento seja verdadeiro, falso, mentiroso ou enganoso. Os rótulos são sinais para acionar a sua própria verificação. Sempre leia as fontes citadas e tire sua própria conclusão.",
      ],
    },
    {
      title: "3. Uso por sua conta e risco",
      paragraphs: [
        "Você é responsável por como usa a análise e pelo que compartilha ou publica. Se você republicar um resultado do Jiddu, você adota aquele conteúdo como seu — os autores do Jiddu não são responsáveis por usos posteriores.",
        "Não envie dados confidenciais, sigilosos ou pessoais. O texto enviado é repassado aos provedores de modelo listados acima para processamento e armazenado sob um id compartilhável.",
      ],
    },
    {
      title: "4. Pessoas e figuras públicas",
      paragraphs: [
        "Análises sobre pessoas nomeadas (políticos, jornalistas, executivos) são produzidas por software que pesquisa fontes públicas na web. A linguagem que o Jiddu usa é intencionalmente cuidadosa (\"a evidência não sustenta\", \"não encontramos\") — não adote uma formulação mais forte do que a ferramenta emite.",
        "Se você acha que um veredito é injusto ou sem suporte, use o botão \"reportar veredito errado\" na afirmação correspondente. Flags repetidas e injustas contra a mesma pessoa podem ser removidas a critério do operador.",
      ],
    },
    {
      title: "5. Privacidade",
      paragraphs: [
        "Cada análise recebe um id curto e fica armazenada em um servidor no Brasil. Quem tem a URL pode ver. Não há contas de usuário.",
        "Registramos o IP da requisição para limites de taxa e detecção de abuso. Não vendemos nem compartilhamos essa informação.",
        "O tráfego das páginas é medido via Google Analytics (gtag.js).",
      ],
    },
    {
      title: "6. Metodologia",
      paragraphs: [
        "O pipeline de extração e verificação de afirmações é inspirado em [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025) para a etapa de extração, e no framework de avaliação descrito em [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) para a avaliação de veredito, os tiers de qualidade de fonte e a dimensão de imparcialidade. Nossa escolha de 4 classes de veredito (sustentado / contradito / misto / não verificado) em vez dos esquemas de 5 ou 6 classes usados por alguns outlets de fact-check é baseada em [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909), que mostraram empiricamente que rotulagem 3-classes supera 5-classes para fact-check com LLMs — as categorias adicionais no meio criam ambiguidade sem ganho de acurácia.",
        "O Jiddu não tem afiliação com nenhum desses grupos de pesquisa; citamos as referências porque a metodologia da ferramenta é fundamentada no trabalho deles, e os usuários devem saber que as decisões de design têm base acadêmica.",
        "O pipeline de fact-check foi medido contra o corpus humano do [PolitiFact](https://www.politifact.com) (via o [dataset LIAR2](https://github.com/chengxuphd/liar2), Apache-2.0). Em 200 afirmações tiradas dos quatro buckets polares do PolitiFact, o veredito do Jiddu coincidiu com o veredito humano em 67,5% dos casos no total e em 81,3% nas categorias menos ambíguas (true / false / pants-on-fire), com discordância estrita em apenas 4,5%. Metodologia completa, matriz de confusão e análise das discordâncias em [docs/benchmark-politifact.md](/benchmark).",
      ],
    },
    {
      title: "7. Funcionalidade Explain",
      paragraphs: [
        "O pipeline Explain produz interpretações em linguagem simples de artigos acadêmicos e documentos técnicos de forma automatizada. Ele não avalia a veracidade, precisão ou validade das afirmações do documento — apenas explica o que cada parágrafo diz e como ele se encaixa no argumento.",
        "O nível de audiência escolhido (Criança / Ensino médio / Graduação / Expert) ajusta apenas a complexidade do texto. Ele não filtra, valida nem altera o significado do conteúdo original.",
        "As tags de papel do parágrafo (Background, Objetivo, Método, Resultado, Interpretação, Limitação, Conclusão) são previsões algorítmicas. Podem estar incorretas, especialmente em artigos interdisciplinares ou documentos que não seguem uma estrutura padrão.",
        "As explicações funcionam melhor em artigos acadêmicos estruturados. Resultados em textos não estruturados, posts de blog ou documentos não acadêmicos podem ser de menor qualidade.",
      ],
    },
    {
      title: "8. Contato",
      paragraphs: [
        "Operador: Rafael de Menezes Ehlers. Para solicitações de remoção, correções ou outras dúvidas, contate via LinkedIn (link no rodapé).",
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
        "O Jiddu roda quatro análises independentes sobre o mesmo texto: um detector de falácias, um pipeline de checagem de fatos (extração + veredito via Sonar), uma avaliação de imparcialidade e um explicador de papers parágrafo a parágrafo. São rotas separadas no app (`/`, `/factcheck`, `/neutrality`, `/explain`) e tabelas separadas no banco. Nenhuma depende das outras.",
        "Cada análise é uma requisição em streaming pra um LLM via [OpenRouter](https://openrouter.ai). O modelo é instruído a chamar uma função (tool use estilo OpenAI) cujo JSON Schema é nosso. A gente parseia os argumentos da chamada incrementalmente com [partial-json](https://github.com/promplate/partial-json), então os achados aparecem na UI enquanto o modelo ainda está escrevendo.",
        "Todo o output é no idioma da UI escolhido pelo usuário. O mesmo prompt vai independente do modelo selecionado — a diferença de idioma vem de uma única linha `OUTPUT LANGUAGE:` no system prompt.",
      ],
    },
    {
      title: "2. Entrada: ingestão e segmentação",
      paragraphs: [
        "**URL.** O fetch manda headers de browser real (User-Agent do Chrome atual, Accept-Language pt-BR, sec-ch-ua, sec-fetch-*) pra que bloqueadores simples de bot não rejeitem. Cada hop de redirect tem o DNS resolvido e é rejeitado se o IP cair em RFC1918, loopback, link-local, CGNAT, multicast ou faixas reservadas IPv4/IPv6 — isso fecha a porta de SSRF, incluindo o IP de metadados da AWS (169.254.169.254) e o admin do NPM local (porta 81 do VPS). Corpo da resposta limitado a 5 MB. O HTML passa por [@mozilla/readability](https://github.com/mozilla/readability) pra extração do artigo.",
        "**PDF.** Parseado in-process com [pdfjs-dist](https://mozilla.github.io/pdf.js/) — nunca enviado a serviço externo. O modelo só vê texto puro.",
        "**Paste.** Usado como está, apenas com whitespace normalizado.",
        "O texto extraído é segmentado por um divisor de sentenças que conhece abreviações (`src/lib/sentences.ts`) — reconhece abreviações em português (`sr.`, `dr.`, `prof.`), mantém siglas como `U.S.` inteiras, e não quebra no meio de números como `3,4%`. As sentenças são agrupadas em chunks de ~12k caracteres (`src/lib/chunker.ts`) pra documentos longos caberem no contexto do modelo sem perder fronteiras de sentença.",
      ],
    },
    {
      title: "3. Modelos e fallback",
      paragraphs: [
        "Dois modelos no seletor: [🇺🇸 GPT-5.4 mini](https://openrouter.ai/openai/gpt-5.4-mini) (padrão) e [🇨🇳 MiniMax M2.7](https://openrouter.ai/minimax/minimax-m2.7). Foram escolhidos por estarem em lados geopolíticos opostos — um usuário preocupado com viés do treinamento pode rodar o mesmo texto pelos dois e comparar.",
        "Se o modelo escolhido falhar *antes de emitir qualquer evento* (rate-limit do upstream, 5xx etc.), a requisição cai automaticamente pro outro — retry client-side, sem flicker na UI. Quando o modelo já emitiu pelo menos um achado, a gente não retry: aceita o parcial e a camada de partial-parse salva o que dá.",
        "Sonar Reasoning Pro é usado exclusivamente pros vereditos de fact-check (porque tem busca web embutida). Nunca aparece no seletor de modelo.",
      ],
    },
    {
      title: "4. Detector de falácias",
      paragraphs: [
        "Catálogo de 28 falácias cobrindo relevância, ambiguidade, presunção, apelos emocionais, raciocínio causal e evidência. Cada falácia tem id estável e uma cor distinta (distribuição por golden angle) usada pra destacar passagens. Lista completa em [/fallacies](/fallacies).",
        "O system prompt instrui o modelo a ser rigoroso e conservador — só marcar quando há uma falácia clara e defensável. Duas cláusulas específicas apertam isso: **disambiguation** (não marcar sentença com múltiplas leituras plausíveis a menos que o contexto resolva) e **standalone-explanation** (cada explicação deve nomear a premissa implícita e a conclusão, pra leitor entender sem voltar à fonte). Ambas inspiradas no paper Claimify (Microsoft Research 2025).",
        "Cada achado tem severidade binária (`baixa` / `alta`). A nota geral (0-100) é uma média ponderada por chunks, ponderada por contagem de caracteres. As faixas (`raciocínio limpo` / `questões menores` / `várias falácias` / `altamente falacioso` / `propagandístico`) estão escritas no próprio prompt pra o modelo ter a mesma calibração que a UI mostra.",
      ],
    },
    {
      title: "5. Checagem de fatos — extração de afirmações",
      paragraphs: [
        "Modelado a partir do [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). O prompt pede ao modelo pra passar cada sentença por quatro estágios: **selection** (manter só sentenças com afirmação verificável — opinião, juízo de valor e pergunta retórica saem), **disambiguation** (descartar sentenças com múltiplas leituras plausíveis quando o contexto não resolve), **decomposition** (quebrar sentenças com múltiplos fatos em afirmações separadas, sem perseguir atomicidade infinita) e **decontextualization** (cada afirmação emitida deve ficar de pé sozinha — resolver pronomes, adicionar o ano de um número que depende dele, atribuir uma citação à fonte).",
        "Cada afirmação tem um tipo: `numeric`, `date`, `quote`, `causal`, ou `categorical`. O tipo informa como o verificador procura evidência depois.",
        "Limite duro de 50 afirmações por extração (ajustável no admin). Existe porque cada afirmação depois custa créditos Sonar pra verificar; uma extração sem cap num PDF de 30 páginas poderia gastar bastante dinheiro antes do usuário perceber.",
      ],
    },
    {
      title: "6. Checagem de fatos — veredito por afirmação",
      paragraphs: [
        "Veredito é opt-in. A extração sozinha é barata (uma chamada LLM). A verificação é sob demanda: o usuário clica em **Verificar afirmações** no viewer e cada afirmação é enviada pro [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro), uma chamada por afirmação, com concorrência limitada (6 paralelas por padrão).",
        "O Sonar retorna um JSON com o veredito (`sustentado` / `contradito` / `misto` / `não verificado`), uma confiança entre 0 e 1, uma justificativa, e uma lista de fontes citadas tiradas do canal `annotations` do Sonar. Se a confiança ficar abaixo de 0.5, o veredito é forçado pra `não verificado` — melhor sinalizar 'evidência insuficiente' do que entregar uma resposta confiantemente errada.",
        "Toda fonte citada é classificada em um de seis tiers (segundo Goldfarb et al. 2025): `primary` (órgãos oficiais de dados, decisões judiciais, papers peer-reviewed), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. Uma flag boolean separada marca veículos `state-controlled` (RT, CGTN, Xinhua etc. — mas não BBC/NPR/Deutsche Welle, que são state-FUNDED mas editorialmente independentes).",
        "A linguagem do veredito é intencionalmente cuidadosa com pessoas nomeadas: nunca 'X está mentindo' ou 'isso é falso' — sempre 'a evidência não sustenta' / 'a evidência contradiz o número' / 'não encontramos evidência que sustente'. É regra dura no system prompt.",
        "Qual a accuracy disso na prática? A gente rodou um [benchmark contra o corpus humano do PolitiFact](/benchmark). Em 200 afirmações puxadas das quatro categorias polares do PolitiFact (true / mostly-true / false / pants-on-fire, de 2020 pra cá), o veredito do Jiddu coincidiu com o veredito humano polar em 67.5% dos casos no total e 81.3% nas categorias menos ambíguas (true / false / pants-on-fire). Discordância estrita — Jiddu dizer o oposto polar do humano — aconteceu em só 4.5% dos casos (9 de 200). Os ~28% restantes foram Jiddu devolvendo `mixed` ou `unverified` no lugar de um veredito polar, concentrados no bucket `mostly_true` do PolitiFact (58% viraram `mixed` — sobreposição estrutural, não erro, já que ambos os rótulos descrevem verdade parcial). Metodologia, matriz de confusão e análise das discordâncias no link.",
      ],
    },
    {
      title: "7. Checagem de fatos — cache de vereditos",
      paragraphs: [
        "Cada afirmação verificada é hashada e armazenada. O hash é `sha256(lang + ':' + normalize(statement))` onde `normalize` faz lowercase, tira acentos combinantes, colapsa espaços e remove pontuação final. Isso significa que reformulações da mesma afirmação colidem, mas idiomas diferentes não.",
        "TTLs por tipo de afirmação. `numeric` 30 dias (IBGE e companhia revisam séries), `date` e `categorical` 365 dias (fatos históricos e definições são estáveis), `quote` e `causal` 90 dias (re-examináveis mas pouco prováveis de mudar). Uma varredura best-effort apaga linhas expiradas no caminho de cache-miss, limitada a uma vez a cada 30 minutos pra o hot path ficar barato.",
        "O usuário pode burlar o cache com um botão **refresh** por afirmação (força uma chamada Sonar fresca). Conta contra um quota ajustável no admin — padrão é 2 refreshes por afirmação. Depois disso, o botão some e a API retorna 429.",
      ],
    },
    {
      title: "8. Imparcialidade",
      paragraphs: [
        "Diferente da detecção de falácia: um texto pode ser livre de falácia e factualmente correto e ainda assim usar enquadramento carregado, atribuição assimétrica ou seleção unilateral de fontes. A análise de imparcialidade sinaliza esses padrões.",
        "Oito tipos de issue são sinalizados no nível da sentença: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. O modelo também classifica o documento num de sete tipos de texto (informativo / opinião / discurso político / advocacy / análise / marketing / redes sociais) — isso informa quão estrito o audit é.",
        "O veredito a nível de documento é um de `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. O Jiddu **deliberadamente não classifica direção partidária** (esquerda/direita, pró-X/anti-Y). O paper da Forum AI que inspirou a metodologia exige um painel bipartisan de especialistas pra essa etapa; sem ele, rótulos partidários são pouco confiáveis e perigosos. Sinalizamos padrões específicos que o leitor pode auditar, em vez disso.",
      ],
    },
    {
      title: "9. Armazenamento, privacidade e revisão",
      paragraphs: [
        "A persistência é um único arquivo SQLite num VPS Hostinger, montado como volume Docker. Não há contas de usuário. Cada análise ganha um id curto e vive em `/a/<id>`, `/f/<id>` ou `/n/<id>`. Quem tem a URL vê.",
        "O texto submetido é enviado ao OpenRouter, que roteia pro upstream que serve o modelo escolhido. A gente não repassa pra mais ninguém. Registramos o IP da requisição pra rate-limit e detecção de abuso, e não vendemos nem compartilhamos isso.",
        "Cada análise tem um timestamp `reviewedAt`. Por padrão é nulo, significando que a análise é automatizada e não foi conferida por um operador. O admin (em `/admin`, protegido por senha) pode marcar análises individuais como revisadas.",
      ],
    },
    {
      title: "10. Controle de custo e abuso",
      paragraphs: [
        "Toda rota que gera custo tem um rate limit de token bucket in-memory por IP. Defaults: 30 análises de falácia / hora, 30 extrações de fact-check / hora, 10 verificações em massa / hora, 20 refreshes individuais / hora, 20 sinalizações de feedback / hora. Todos os valores são ajustáveis em runtime no `/admin/settings` — sem precisar redeployar. Quando o bucket esgota, a API retorna 429 com header `Retry-After`.",
        "A extração de fact-check tem cap de 50 afirmações por documento. O refresh por afirmação tem cap de 2 chamadas. Ambos ajustáveis no admin. São as defesas estruturais contra um único usuário gerar uma conta inesperada.",
      ],
    },
    {
      title: "11. Loop de feedback",
      paragraphs: [
        "Todo card de afirmação tem um botão **🚩 Reportar veredito errado**. O clique captura um motivo opcional em texto livre e faz POST pra um endpoint de feedback, que tira snapshot do statement + veredito atuais (assim o admin vê o que o usuário tava vendo, mesmo se o veredito for re-verificado depois).",
        "Flags enviadas caem numa fila em `/admin/feedback` com status `open`. O operador marca cada uma como `resolved` (concorda com o usuário, planeja consertar) ou `ignored` (o veredito tava certo, ou a flag era spam), ou deleta. A home do admin mostra um badge vermelho com a contagem aberta.",
        "Hoje não há ação automática no veredito quando flags se acumulam — toda entrada é revisada manualmente. Melhoria futura: um badge 'disputed' no viewer público quando N flags juntarem na mesma afirmação.",
      ],
    },
    {
      title: "12. Modo Live (beta)",
      paragraphs: [
        "Pipeline separado em [/live](/live): a página captura áudio do microfone do usuário ou, em browsers Chromium, de uma aba do navegador via `getDisplayMedia`. O áudio é transmitido *direto do browser pra Realtime API da OpenAI* via WebRTC — nunca passa pelo servidor do Jiddu. O modelo de transcrição é `gpt-realtime-whisper`, e o idioma respeita o seletor do header (EN / PT / ES).",
        "Como o cabeamento funciona: quando o usuário clica em **Iniciar**, o browser chama `POST /api/live/token` pra cunhar um client secret efêmero de curta duração (o servidor do Jiddu guarda a `OPENAI_API_KEY` real; o browser nunca vê). O browser então abre a peer-connection WebRTC pra OpenAI usando esse secret e começa a receber deltas de transcrição. A cada ~500 caracteres novos (ou a cada 30 segundos, o que vier primeiro), uma chamada SSE separada pra `POST /api/live/analyze` envia o transcript cumulativo e roda o mesmo prompt de falácia usado em qualquer lugar — os achados aparecem na UI quase em tempo real. No **Parar**, uma última chamada com `finalize: true` commita a sessão como uma análise `/a/<id>` normal, indistinguível downstream de uma análise feita via paste.",
        "Custo é limitado por um cap duro de 60 minutos por sessão (≈ \\$1 de Realtime + custo de análise LLM). O áudio bruto nunca é armazenado — só a transcrição e os achados detectados persistem. A página é deliberadamente fora do nav enquanto está em beta — chega-se digitando `/live` na barra. Captura de áudio de aba funciona só em Chrome / Edge porque Safari e Firefox não expõem áudio de aba via `getDisplayMedia`; o microfone funciona em qualquer lugar.",
      ],
    },
    {
      title: "13. Explain — explicador de artigos",
      paragraphs: [
        "O pipeline Explain (`/explain`, resultados em `/e/:id`) recebe um artigo acadêmico ou documento técnico e produz uma explicação parágrafo a parágrafo em linguagem simples. Cada parágrafo recebe uma tag de papel (Background / Objetivo / Método / Resultado / Interpretação / Limitação / Conclusão) e uma explicação escrita no nível de audiência escolhido. Uma visão geral do documento é gerada primeiro.",
        "Níveis de audiência: **Criança** (ELI5, analogias do cotidiano, sem jargão), **Ensino médio** (linguagem clara, poucos termos técnicos explicados), **Graduação** (registro acadêmico padrão, pressupõe familiaridade com a área), **Expert** (conciso, nível de pares, terminologia completa mantida). O nível controla apenas a complexidade do texto — não filtra nem valida o conteúdo.",
        "A tag de papel é algorítmica. O modelo lê cada parágrafo em contexto e atribui o papel que melhor descreve sua função no argumento. Artigos interdisciplinares ou documentos com estrutura não padrão podem receber tags incorretas.",
        "Ao contrário dos outros três pipelines, o Explain é otimizado para artigos acadêmicos estruturados. Resultados em posts de blog, petições jurídicas ou textos não estruturados serão de menor qualidade.",
      ],
    },
    {
      title: "14. Open source e metodologia",
      paragraphs: [
        "Código fonte em [github.com/rafaehlers/jiddu](https://github.com/rafaehlers/jiddu) sob licença [AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.txt). A AGPL fecha o 'SaaS loophole' que a GPL deixa aberto: quem rodar uma versão modificada como serviço de rede tem que publicar o código modificado.",
        "Dois papers fundamentam o design: [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson — Microsoft Research, 2025) pra extração em quatro estágios; e [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) pra a avaliação de veredito, a taxonomia de 6 tiers de fonte e o framework de imparcialidade. O Jiddu não tem afiliação com nenhum dos grupos.",
        "O disclaimer completo do que o Jiddu afirma e não afirma está em [/legal](/legal).",
      ],
    },
  ],

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

  nav_fallacies: "Guia de Falácias",
  nav_source: "Código",

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

  hero_title: "Lee cualquier texto con un crítico en el margen.",
  hero_subtitle:
    "Sube un PDF, pega un texto o suelta una URL. Jiddu resalta los pasajes con falacias lógicas y explica cada uno en un comentario — como un revisor en Word — y le da al texto entero una puntuación de falacia de 0 a 100.",
  privacy: "Privacidad:",
  privacy_body:
    "tu texto se envía al modelo seleccionado (OpenAI o MiniMax, enrutado vía OpenRouter) para análisis y se almacena localmente bajo un id compartible.",
  see_demo: "Ver demostración",
  see_demo_hint: "¿Quieres un vistazo rápido sin ejecutar un análisis?",
  bench_badge_label:
    "Pipeline validado · 67,5% de concordancia con PolitiFact en benchmark de 200 claims",
  bench_badge_link: "ver informe",
  pipelines_heading: "Cuatro lentes sobre el mismo texto",
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
  mode_explain: "Explicar",
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

  nav_legal: "Términos",
  nav_how_it_works: "Cómo funciona",
  nav_api: "API",
  api_access_title: "API y MCP de Jiddu",
  api_access_subtitle:
    "Usa las cuatro herramientas de lectura de Jiddu desde tu propio código o agente — una REST API documentada y un servidor MCP.",
  api_access_sections: [
    {
      title: "Endpoints",
      paragraphs: [
        "Jiddu expone sus cuatro pipelines de análisis como una REST API pública. Cada endpoint recibe un cuerpo JSON con un campo `text` (40–2000 caracteres) y un `lang` opcional (`en` / `pt` / `es`), y devuelve JSON estructurado.",
        "```\nPOST /api/v1/detect-fallacies\nPOST /api/v1/fact-check\nPOST /api/v1/assess-neutrality\nPOST /api/v1/explain\n```",
        "`detect-fallacies`, `assess-neutrality` y `explain` son rápidos. `fact-check` extrae cada afirmación y la verifica con búsqueda web en vivo, por lo que es más lento y medido.",
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
        "Para agentes, conéctate al servidor MCP alojado de Jiddu por URL — nada que instalar ni clonar. Expone las mismas cuatro herramientas y hace de puente con tu cliente MCP (p. ej. Claude Desktop) mediante el utilitario público `mcp-remote`:",
        "```\n{\n  \"mcpServers\": {\n    \"jiddu\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"mcp-remote\", \"https://jiddu.app/api/mcp\", \"--header\", \"X-Jiddu-Key:tu-clave-aquí\"]\n    }\n  }\n}\n```",
        "La documentación orientada a máquinas — cuándo usar cada herramienta, formatos de respuesta y cómo encadenarlas — está en [AGENT.md](https://github.com/rafaehlers/jiddu/blob/main/packages/jiddu-mcp/AGENT.md).",
      ],
    },
    {
      title: "Límites y fiabilidad",
      paragraphs: [
        "El texto está limitado a 2000 caracteres por solicitud. Los límites de tasa son por clave; al excederlos, la respuesta es HTTP 429 con un campo `retry_after_seconds`. Las salidas son automatizadas y pueden equivocarse — trátalas como señales para verificar, no como autoridad final.",
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
  print_generated_at: (when) => `Generado ${when} · jiddu.app`,

  legal_title: "Términos y descargos",
  legal_subtitle:
    "Lee esto antes de usar Jiddu, especialmente antes de compartir un análisis públicamente.",
  legal_last_updated: "Actualizado: 2026-05-18",
  legal_sections: [
    {
      title: "1. Qué hace Jiddu",
      paragraphs: [
        "Jiddu es una herramienta automatizada. Usa modelos de lenguaje (actualmente enrutados vía OpenRouter a OpenAI, Anthropic, MiniMax y Perplexity Sonar) para (a) señalar pasajes que pueden contener falacias lógicas y (b) extraer afirmaciones factuales verificables de un texto y ofrecer un veredicto basado en búsqueda web.",
        "Jiddu no tiene editores humanos. Todo resultado que ves es producido por software. La herramienta es un apoyo a la lectura crítica — no la reemplaza.",
      ],
    },
    {
      title: "2. Sin afirmación de verdad",
      paragraphs: [
        'Los veredictos ("respaldado", "contradicho", "mixto", "no verificado") y las etiquetas de falacia son juicios automatizados de mejor esfuerzo. Pueden estar equivocados — a veces con alta confianza.',
        "Jiddu no afirma que ninguna declaración, persona o documento sea verdadero, falso, mentiroso o engañoso. Las etiquetas son señales para activar tu propia verificación. Siempre lee las fuentes citadas y forma tu propia conclusión.",
      ],
    },
    {
      title: "3. Uso bajo tu propio riesgo",
      paragraphs: [
        "Eres responsable de cómo usas el análisis y de lo que compartes o publicas. Si republicas un resultado de Jiddu, adoptas ese contenido como tuyo — los autores de Jiddu no son responsables de los usos posteriores.",
        "No envíes datos confidenciales, propietarios o personales. El texto enviado se reenvía a los proveedores de modelos mencionados arriba para procesamiento y se almacena bajo un id compartible.",
      ],
    },
    {
      title: "4. Personas y figuras públicas",
      paragraphs: [
        "Los análisis sobre personas nombradas (políticos, periodistas, ejecutivos) son producidos por software que busca en fuentes públicas en la web. El lenguaje que usa Jiddu es intencionalmente cauto (\"la evidencia no respalda\", \"no encontramos\") — no adoptes una formulación más fuerte de la que emite la herramienta.",
        "Si crees que un veredicto es injusto o sin sustento, usa el botón \"reportar veredicto incorrecto\" en la afirmación correspondiente. Flags repetidas e injustas contra la misma persona pueden ser eliminadas a criterio del operador.",
      ],
    },
    {
      title: "5. Privacidad",
      paragraphs: [
        "Cada análisis recibe un id corto y se almacena en un servidor en Brasil. Quien tenga la URL puede verlo. No hay cuentas de usuario.",
        "Registramos el IP de la solicitud para límites de tasa y detección de abuso. No vendemos ni compartimos esa información.",
        "El tráfico de las páginas se mide vía Google Analytics (gtag.js).",
      ],
    },
    {
      title: "6. Metodología",
      paragraphs: [
        "Nuestro pipeline de extracción y verificación de afirmaciones se inspira en [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025) para la etapa de extracción, y en el framework de evaluación descrito en [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) para la evaluación de veredicto, los niveles de calidad de fuente y la dimensión de imparcialidad. Nuestra elección de 4 clases de veredicto (respaldado / contradicho / mixto / no verificado) en lugar de los esquemas de 5 o 6 clases usados por algunos outlets de fact-check se basa en [Sahitaj et al. 2025](https://arxiv.org/abs/2502.08909), que mostraron empíricamente que el etiquetado de 3 clases supera al de 5 clases para fact-check con LLMs — las categorías adicionales en el medio introducen ambigüedad sin mejorar la precisión.",
        "Jiddu no está afiliado a ninguno de estos grupos de investigación; los citamos porque la metodología detrás de la herramienta se basa en su trabajo, y los usuarios deben saber que las decisiones de diseño tienen base académica.",
        "El pipeline de fact-check se midió contra el corpus humano de [PolitiFact](https://www.politifact.com) (vía el [dataset LIAR2](https://github.com/chengxuphd/liar2), Apache-2.0). En 200 afirmaciones tomadas de los cuatro buckets polares de PolitiFact, el veredicto de Jiddu coincidió con el veredicto humano en 67,5% de los casos en total y en 81,3% en las categorías menos ambiguas (true / false / pants-on-fire), con desacuerdo estricto en apenas 4,5%. Metodología completa, matriz de confusión y análisis de desacuerdos en [docs/benchmark-politifact.md](/benchmark).",
      ],
    },
    {
      title: "7. Funcionalidad Explain",
      paragraphs: [
        "El pipeline Explain produce interpretaciones automatizadas en lenguaje sencillo de artículos académicos y documentos técnicos. No evalúa la veracidad, precisión o validez de las afirmaciones del documento — solo explica qué dice cada párrafo y cómo encaja en el argumento.",
        "El nivel de audiencia elegido (Niño / Secundaria / Universitario / Experto) ajusta únicamente la complejidad del texto. No filtra, valida ni cambia el significado del contenido original.",
        "Las etiquetas de rol del párrafo (Background, Objetivo, Método, Resultado, Interpretación, Limitación, Conclusión) son predicciones algorítmicas. Pueden ser incorrectas, especialmente en artículos interdisciplinarios o documentos que no siguen una estructura estándar.",
        "Las explicaciones funcionan mejor en artículos académicos estructurados. Los resultados en textos no estructurados, posts de blog o documentos no académicos pueden ser de menor calidad.",
      ],
    },
    {
      title: "8. Contacto",
      paragraphs: [
        "Operador: Rafael de Menezes Ehlers. Para solicitudes de remoción, correcciones u otras consultas, contacto vía LinkedIn (enlace en el pie de página).",
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
        "Jiddu corre cuatro análisis independientes sobre el mismo texto: un detector de falacias, un pipeline de verificación de hechos (extracción + veredicto vía Sonar), una evaluación de imparcialidad y un explicador de papers párrafo a párrafo. Son rutas separadas en la app (`/`, `/factcheck`, `/neutrality`, `/explain`) y tablas separadas en la base. Ninguno depende de los otros.",
        "Cada análisis es una petición en streaming a un LLM vía [OpenRouter](https://openrouter.ai). Se instruye al modelo a llamar una función (tool use estilo OpenAI) cuyo JSON Schema controlamos nosotros. Parseamos los argumentos de la tool-call incrementalmente con [partial-json](https://github.com/promplate/partial-json), así los hallazgos aparecen en la UI mientras el modelo todavía está escribiendo.",
        "Todo el output va en el idioma de la UI elegido por el usuario. El mismo prompt se usa sin importar qué modelo elija el usuario — la diferencia de idioma viene de una única línea `OUTPUT LANGUAGE:` en el system prompt.",
      ],
    },
    {
      title: "2. Entrada: ingestión y segmentación",
      paragraphs: [
        "**URL.** El fetch envía headers de navegador real (User-Agent de Chrome actual, Accept-Language pt-BR, sec-ch-ua, sec-fetch-*) para que bloqueadores ingenuos de bots no rechacen. Cada salto de redirect tiene el DNS resuelto y se rechaza si el IP cae en RFC1918, loopback, link-local, CGNAT, multicast o rangos reservados IPv4/IPv6 — eso cierra la puerta de SSRF, incluyendo el IP de metadatos de AWS (169.254.169.254) y el admin local del NPM (puerto 81 del VPS). El cuerpo de la respuesta está limitado a 5 MB. El HTML pasa por [@mozilla/readability](https://github.com/mozilla/readability) para extraer el artículo.",
        "**PDF.** Parseado en proceso con [pdfjs-dist](https://mozilla.github.io/pdf.js/) — nunca se manda a un servicio remoto. El modelo solo ve texto plano.",
        "**Paste.** Usado tal cual, solo con espacios en blanco normalizados.",
        "El texto extraído se segmenta en oraciones con un divisor consciente de abreviaturas (`src/lib/sentences.ts`) — reconoce abreviaturas en portugués (`sr.`, `dr.`, `prof.`), mantiene siglas como `U.S.` intactas y no rompe en medio de números como `3,4%`. Las oraciones se agrupan en chunks de ~12k caracteres (`src/lib/chunker.ts`) para que documentos largos quepan en la ventana de contexto del modelo sin perder fronteras de oración.",
      ],
    },
    {
      title: "3. Modelos y fallback",
      paragraphs: [
        "Dos modelos en el selector: [🇺🇸 GPT-5.4 mini](https://openrouter.ai/openai/gpt-5.4-mini) (por defecto) y [🇨🇳 MiniMax M2.7](https://openrouter.ai/minimax/minimax-m2.7). Fueron elegidos por estar en lados geopolíticos opuestos — un usuario preocupado por sesgo en los datos de entrenamiento puede pasar el mismo texto por los dos y comparar.",
        "Si el modelo elegido falla *antes de emitir cualquier evento* (rate-limit del upstream, 5xx, etc.), la petición cae automáticamente al otro modelo — retry client-side, sin parpadeo en la UI. Una vez que el modelo ya emitió al menos un hallazgo/afirmación, no reintentamos: aceptamos la salida parcial y la capa de partial-parse rescata lo que pueda.",
        "Sonar Reasoning Pro se usa exclusivamente para los veredictos de fact-check (porque tiene búsqueda web incorporada). Nunca aparece en el selector de modelo.",
      ],
    },
    {
      title: "4. Detector de falacias",
      paragraphs: [
        "Catálogo de 28 falacias cubriendo relevancia, ambigüedad, presunción, apelaciones emocionales, razonamiento causal y evidencia. Cada falacia tiene un id estable y un color distinto (distribución por golden angle) usado para resaltar pasajes. La lista completa está en [/fallacies](/fallacies).",
        "El system prompt instruye al modelo a ser riguroso y conservador — marcar solo cuando hay una falacia clara y defendible. Dos cláusulas específicas aprietan esto: una cláusula de **disambiguation** (no marcar una oración con múltiples lecturas plausibles a menos que el contexto la resuelva) y una cláusula de **standalone-explanation** (cada explicación debe nombrar la premisa implícita y la conclusión para que el lector no tenga que volver a la fuente). Ambas destiladas del paper Claimify (Microsoft Research 2025).",
        "Cada hallazgo tiene severidad binaria (`baja` / `alta`). La puntuación general de falacia (0-100) es un promedio ponderado entre chunks, ponderado por la cuenta de caracteres. Las etiquetas por rango (`razonamiento limpio` / `problemas menores` / `varias falacias` / `muy falaz` / `propagandístico`) están escritas en el propio prompt para que el modelo tenga la misma calibración que muestra la UI.",
      ],
    },
    {
      title: "5. Fact-check — extracción de afirmaciones",
      paragraphs: [
        "Modelado en [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson, MSR 2025). El prompt pide al modelo pasar cada oración por cuatro etapas: **selection** (mantener solo oraciones con una afirmación verificable — opiniones, juicios de valor, preguntas retóricas se descartan), **disambiguation** (descartar oraciones con múltiples lecturas plausibles cuando el contexto no resuelve), **decomposition** (partir oraciones con múltiples hechos en afirmaciones separadas sin perseguir atomicidad infinita) y **decontextualization** (cada afirmación emitida debe sostenerse sola — resolver pronombres, agregar el año a un número que dependa de él, atribuir una cita a su fuente).",
        "Cada afirmación emitida tiene un tipo: `numeric`, `date`, `quote`, `causal` o `categorical`. El tipo informa cómo el verificador busca evidencia después.",
        "Tope duro de 50 afirmaciones por extracción (ajustable en el admin). El tope existe porque cada afirmación después cuesta créditos de Sonar para verificar; una extracción sin tope sobre un PDF de 30 páginas podría acumular dinero serio antes de que el usuario lo note.",
      ],
    },
    {
      title: "6. Fact-check — veredicto por afirmación",
      paragraphs: [
        "El veredicto es opt-in. La extracción sola es barata (una llamada al LLM). La verificación es bajo demanda: el usuario hace clic en **Verificar afirmaciones** en el viewer y cada afirmación se manda a [Perplexity Sonar Reasoning Pro](https://openrouter.ai/perplexity/sonar-reasoning-pro), una llamada por afirmación, con concurrencia limitada (6 en paralelo por defecto).",
        "Sonar devuelve un JSON con el veredicto (`respaldado` / `contradicho` / `mixto` / `no verificado`), una confianza entre 0 y 1, una justificación y una lista de fuentes citadas tomadas del canal `annotations` de Sonar. Si la confianza queda por debajo de 0.5, el veredicto se fuerza a `no verificado` — mejor exhibir 'evidencia insuficiente' que entregar una respuesta confiadamente equivocada.",
        "Cada fuente citada se clasifica en uno de seis tiers (según Goldfarb et al. 2025): `primary` (agencias oficiales de datos, decisiones judiciales, papers peer-reviewed), `scholarly`, `think_tank`, `journalistic`, `commercial_content`, `informal`. Una flag booleana aparte marca medios `state-controlled` (RT, CGTN, Xinhua, etc. — pero no BBC/NPR/Deutsche Welle, que son state-FUNDED pero editorialmente independientes).",
        "El lenguaje del veredicto es intencionalmente cauto con personas nombradas: nunca 'X miente' o 'esto es falso' — siempre 'la evidencia no respalda' / 'la evidencia contradice el número' / 'no encontramos evidencia que respalde'. Es una regla dura en el system prompt.",
        "¿Qué tan preciso es esto en la práctica? Corrimos un [benchmark contra el corpus humano de PolitiFact](/benchmark). En 200 afirmaciones tomadas de las cuatro categorías polares de PolitiFact (true / mostly-true / false / pants-on-fire, desde 2020), el veredicto de Jiddu coincidió con el veredicto humano polar en 67.5% de los casos en total y 81.3% en las categorías menos ambiguas (true / false / pants-on-fire). Desacuerdo estricto — Jiddu diciendo lo opuesto polar del humano — ocurrió solo en 4.5% de los casos (9 de 200). El ~28% restante fue Jiddu devolviendo `mixed` o `unverified` en lugar de un veredicto polar, concentrado en el bucket `mostly_true` de PolitiFact (58% se volvieron `mixed` — solapamiento estructural, no error, ya que ambas etiquetas describen verdad parcial). Metodología, matriz de confusión y análisis de desacuerdos en el enlace.",
      ],
    },
    {
      title: "7. Fact-check — caché de veredictos",
      paragraphs: [
        "Cada afirmación verificada se hashea y se almacena. El hash es `sha256(lang + ':' + normalize(statement))` donde `normalize` pasa a minúsculas, quita marcas combinantes de acento, colapsa espacios y elimina puntuación final. Eso significa que reformulaciones de la misma afirmación colisionan, pero idiomas distintos no.",
        "Los TTL son por tipo de afirmación. `numeric` 30 días (IBGE y compañía revisan series), `date` y `categorical` 365 días (hechos históricos y definiciones son estables), `quote` y `causal` 90 días (re-examinables pero poco probables de cambiar). Un barrido best-effort borra filas expiradas en el camino de cache-miss, limitado a una vez cada 30 minutos para que el hot path siga barato.",
        "El usuario puede saltarse el caché con un botón de **refresh** por afirmación (fuerza una llamada Sonar fresca). Cuenta contra una cuota de refresh ajustable en el admin — por defecto 2 refreshes por afirmación. Después de eso, el botón se oculta y la API devuelve 429.",
      ],
    },
    {
      title: "8. Imparcialidad",
      paragraphs: [
        "Distinto de la detección de falacias: un texto puede estar libre de falacias y ser fácticamente correcto y aun así usar encuadre cargado, atribución asimétrica o selección unilateral de fuentes. La evaluación de imparcialidad expone esos patrones.",
        "Ocho tipos de issue se marcan a nivel de oración: `loaded_language`, `asymmetric_attribution`, `false_equivalence`, `selective_omission`, `source_asymmetry`, `both_sidesing`, `steering`, `genetic_framing`. El modelo también clasifica el documento en uno de siete tipos de texto (informativo / opinión / discurso político / advocacy / análisis / marketing / redes sociales) — eso informa qué tan estricta es la auditoría.",
        "El veredicto a nivel documento es uno de `neutral` / `partisan_lean` / `explicitly_partisan` / `manipulation`. Jiddu **deliberadamente no clasifica dirección partidaria** (izquierda/derecha, pro-X/anti-Y). El paper de Forum AI que inspiró la metodología requiere un panel bipartidista de expertos para esa etapa; sin ese panel, las etiquetas partidarias son poco confiables y dañinas. En su lugar exhibimos patrones específicos que el lector puede auditar.",
      ],
    },
    {
      title: "9. Almacenamiento, privacidad y revisión",
      paragraphs: [
        "La persistencia es un único archivo SQLite en un VPS de Hostinger, montado como volumen Docker. No hay cuentas de usuario. Cada análisis recibe un id corto y vive bajo `/a/<id>`, `/f/<id>` o `/n/<id>`. Cualquiera con la URL puede verlo.",
        "El texto enviado va a OpenRouter, que lo enruta al upstream que sirve el modelo elegido. No lo retransmitimos a ningún otro lugar. Registramos el IP de la petición para rate-limit y señales de abuso, y no lo vendemos ni compartimos.",
        "Cada análisis tiene un timestamp `reviewedAt`. Por defecto es null, lo que significa que el análisis es automatizado y no fue revisado por un operador. El admin (en `/admin`, protegido por contraseña) puede marcar análisis individuales como revisados.",
      ],
    },
    {
      title: "10. Costo y controles de abuso",
      paragraphs: [
        "Cada ruta que incurre en costo tiene un rate limit de token bucket in-memory por IP. Defaults: 30 análisis de falacias / hora, 30 extracciones de fact-check / hora, 10 verificaciones masivas / hora, 20 refreshes individuales / hora, 20 flags de feedback / hora. Todos los valores son ajustables en runtime vía `/admin/settings` — sin redeploy. Cuando el bucket se vacía, la API devuelve 429 con header `Retry-After`.",
        "La extracción de fact-check tiene tope de 50 afirmaciones por documento. El refresh por afirmación tiene tope de 2 llamadas por afirmación. Ambos configurables desde el admin. Son las defensas estructurales contra un único usuario acumulando una cuenta inesperada.",
      ],
    },
    {
      title: "11. Loop de feedback",
      paragraphs: [
        "Cada card de afirmación de fact-check tiene un botón **🚩 Reportar veredicto incorrecto**. Clicarlo captura una razón opcional en texto libre y hace POST a un endpoint de feedback, que toma snapshot del statement + veredicto actuales (así el admin ve lo que el usuario estaba viendo, aunque el veredicto se re-verifique después).",
        "Las flags enviadas caen en una cola de admin en `/admin/feedback` con estado `open`. El operador puede marcar cada una como `resolved` (concuerda con el usuario, planea arreglar) o `ignored` (el veredicto estaba bien, o el flag era spam), o eliminarla. La home del admin muestra un badge rojo con el conteo abierto.",
        "Por ahora no hay acción automática sobre el veredicto cuando las flags se acumulan — cada entrada se revisa manualmente. Mejora futura: un badge 'disputed' en el viewer público cuando se acumulen N flags sobre la misma afirmación.",
      ],
    },
    {
      title: "12. Modo Live (beta)",
      paragraphs: [
        "Pipeline separado en [/live](/live): la página captura audio del micrófono del usuario o, en navegadores Chromium, de una pestaña del navegador vía `getDisplayMedia`. El audio se transmite *directamente del navegador a la Realtime API de OpenAI* por WebRTC — nunca pasa por el servidor de Jiddu. El modelo de transcripción es `gpt-realtime-whisper`, y el idioma respeta el selector del header (EN / PT / ES).",
        "Cómo funciona el cableado: cuando el usuario hace clic en **Iniciar**, el navegador llama a `POST /api/live/token` para acuñar un client secret efímero de corta vida (el servidor de Jiddu guarda la `OPENAI_API_KEY` real; el navegador nunca la ve). El navegador abre entonces la peer-connection WebRTC con OpenAI usando ese secret y empieza a recibir deltas de transcripción. Cada ~500 caracteres nuevos (o cada 30 segundos, lo que ocurra primero), una llamada SSE separada a `POST /api/live/analyze` envía el transcript acumulado y corre el mismo prompt de falacia usado en cualquier lugar — los hallazgos aparecen en la UI casi en tiempo real. Al **Detener**, una última llamada con `finalize: true` commitea la sesión como un análisis `/a/<id>` normal, indistinguible aguas abajo de uno hecho vía paste.",
        "El costo está acotado por un cap duro de 60 minutos por sesión (≈ \\$1 de Realtime + costo del análisis LLM). El audio bruto nunca se almacena — solo la transcripción y los hallazgos detectados persisten. La página deliberadamente no está enlazada desde el nav mientras está en beta — se llega tecleando `/live` en la barra. La captura de audio de pestaña funciona solo en Chrome / Edge porque Safari y Firefox no exponen audio de pestaña vía `getDisplayMedia`; el micrófono funciona en todos lados.",
      ],
    },
    {
      title: "13. Explain — explicador de artículos",
      paragraphs: [
        "El pipeline Explain (`/explain`, resultados en `/e/:id`) recibe un artículo académico o documento técnico y produce una explicación párrafo a párrafo en lenguaje sencillo. Cada párrafo recibe una etiqueta de rol (Background / Objetivo / Método / Resultado / Interpretación / Limitación / Conclusión) y una explicación escrita en el nivel de audiencia elegido. Primero se genera un resumen general del documento.",
        "Niveles de audiencia: **Niño** (ELI5, analogías cotidianas, sin jerga), **Secundaria** (lenguaje claro, pocos términos técnicos explicados), **Universitario** (registro académico estándar, asume familiaridad con el campo), **Experto** (conciso, nivel de pares, terminología completa conservada). El nivel controla solo la complejidad del texto — no filtra ni valida el contenido.",
        "La etiqueta de rol es algorítmica. El modelo lee cada párrafo en contexto y asigna el rol que mejor describe su función en el argumento. Los artículos interdisciplinarios o los documentos con estructura no estándar pueden recibir etiquetas incorrectas.",
        "A diferencia de los otros tres pipelines, Explain está optimizado para artículos académicos estructurados. Los resultados en posts de blog, escritos legales o textos no estructurados serán de menor calidad.",
      ],
    },
    {
      title: "14. Open source y metodología",
      paragraphs: [
        "El código fuente está en [github.com/rafaehlers/jiddu](https://github.com/rafaehlers/jiddu) bajo licencia [AGPL-3.0-or-later](https://www.gnu.org/licenses/agpl-3.0.txt). AGPL cierra el 'SaaS loophole' que GPL deja abierto: cualquiera que corra una versión modificada como servicio de red debe publicar el código fuente modificado.",
        "Dos papers fundamentan el diseño: [Claimify](http://arxiv.org/pdf/2502.10855) (Metropolitansky & Larson — Microsoft Research, 2025) para la extracción de afirmaciones en cuatro etapas; y [Distilling Expert Judgment at Scale](https://www.byforum.com/whitepaper-files/distilling-expert-judgment-at-scale.pdf) (Goldfarb, Hall, Fisher, Salam, Wilde — Forum AI / Stanford, 2025) para la evaluación de veredicto, la taxonomía de 6 tiers de fuentes y el framework de imparcialidad. Jiddu no está afiliado con ninguno de los dos grupos.",
        "El disclaimer completo de lo que Jiddu afirma y no afirma está en [/legal](/legal).",
      ],
    },
  ],

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

  nav_fallacies: "Guía de falacias",
  nav_source: "Código",

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
