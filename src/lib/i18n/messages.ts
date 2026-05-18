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
