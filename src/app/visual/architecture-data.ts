export type DomainId =
  | "surfaces"
  | "pipeline"
  | "lenses"
  | "live"
  | "intelligence"
  | "platform"
  | "delivery";

export type ArchitectureNodeDefinition = {
  id: string;
  code: string;
  title: string;
  eyebrow: string;
  summary: string;
  implementation: string;
  files: readonly string[];
  domain: DomainId;
  position: { x: number; y: number };
  size?: "normal" | "large";
};

export type DomainDefinition = {
  id: DomainId;
  code: string;
  label: string;
  summary: string;
  implementation: string;
};

export type ArchitectureEdgeDefinition = {
  source: string;
  target: string;
  role?: "primary" | "support";
};

export const CODEBASE_STATS = [
  { value: "544", label: "arquivos-fonte" },
  { value: "52", label: "páginas" },
  { value: "37", label: "rotas API" },
  { value: "74", label: "testes" },
  { value: "29", label: "modelos de dados" },
] as const;

export const DOMAINS: readonly DomainDefinition[] = [
  {
    id: "surfaces",
    code: "A",
    label: "Superfícies",
    summary:
      "Os quatro pontos de entrada do Jiddu: produto web, extensão Chrome, API REST e MCP. Todos chegam às mesmas capacidades de leitura, mas com contratos e experiências adequados a pessoas, navegadores e agentes.",
    implementation:
      "A aplicação principal usa Next.js App Router. A extensão Manifest V3 e o servidor MCP em stdio consomem a API versionada, enquanto o MCP hospedado também é servido pela aplicação. As chaves e limites são compartilhados entre as superfícies não-web.",
  },
  {
    id: "pipeline",
    code: "B",
    label: "Esteira comum",
    summary:
      "O caminho reutilizado pelas análises: receber a fonte, normalizar o documento, dividir a estrutura, orquestrar o trabalho e devolver eventos progressivos ao leitor.",
    implementation:
      "Route Handlers coordenam ingestão segura, chunking, concorrência, persistência e SSE. Os pipelines partilham utilitários de documento e cobrança, mas mantêm prompts e esquemas de resultado próprios.",
  },
  {
    id: "lenses",
    code: "C",
    label: "Lentes de leitura",
    summary:
      "Seis modos aplicam critérios diferentes sobre a mesma evidência: falácias, checagem factual, neutralidade, explicação, padrões de escrita e revisão adversarial de artigos científicos.",
    implementation:
      "Cada lente combina prompt, schema tipado, processamento incremental e viewer próprio. Cinco compartilham a esteira de texto; a revisão acadêmica tem uma orquestração multietapas e parsing de PDF especializado.",
  },
  {
    id: "live",
    code: "D",
    label: "Tempo real + Contexto",
    summary:
      "A camada contínua transcreve áudio, reaplica lentes durante a sessão e monta um contexto navegável de pessoas, instituições, eventos e relações citadas.",
    implementation:
      "OpenAI Realtime fornece a transcrição. Eventos de sessão, estado Zustand, Dockview e React Flow sustentam replay, painéis e grafo. Dados privados de sessão ficam separados do conhecimento público enriquecido.",
  },
  {
    id: "intelligence",
    code: "E",
    label: "Inteligência",
    summary:
      "Contratos, prompts, roteamento de modelos, busca na web e auditorias transformam texto bruto em resultados que continuam ligados à fonte.",
    implementation:
      "Zod e JSON Schema definem a saída; OpenRouter executa o catálogo e o fallback; Sonar traz evidência atual; verificadores determinísticos e críticos independentes reforçam o fluxo de papers.",
  },
  {
    id: "platform",
    code: "F",
    label: "Plataforma",
    summary:
      "Identidade, acesso, créditos, persistência e administração formam o plano de controle compartilhado pelo produto web, API e MCP.",
    implementation:
      "WorkOS AuthKit resolve identidade. Prisma 7 acessa PostgreSQL. O ledger reserva e liquida créditos por uso, Stripe vende pacotes e o admin ajusta preços, modelos, limites e estados operacionais.",
  },
  {
    id: "delivery",
    code: "G",
    label: "Leitura + Entrega",
    summary:
      "O resultado termina em viewers inspecionáveis, links compartilháveis, impressão, Markdown, e-mail e experiências localizadas, sustentadas por testes, avaliações e deploy próprio.",
    implementation:
      "Páginas de resultado mantêm fonte e achados lado a lado. O repositório inclui três idiomas, suíte Node Test, benchmarks, build standalone, Docker e um deploy no VPS com verificação de SHA, containers e health check.",
  },
] as const;

export const ARCHITECTURE_NODES: readonly ArchitectureNodeDefinition[] = [
  {
    id: "web-app",
    code: "W",
    title: "Web app",
    eyebrow: "Superfície humana",
    summary:
      "A experiência principal do Jiddu: uma home unificada para escolher a lente, enviar URL, texto ou arquivo e abrir leitores que mantêm fonte e análise lado a lado.",
    implementation:
      "Next.js 16, React 19 e Tailwind 4 organizados pelo App Router. A aplicação tem rotas públicas, resultados, conta, admin, blog e páginas de metodologia, com estado interativo isolado em Client Components.",
    files: ["src/app/page.tsx", "src/components/home-composer.tsx", "src/app/layout.tsx"],
    domain: "surfaces",
    position: { x: 40, y: 30 },
  },
  {
    id: "chrome-extension",
    code: "X",
    title: "Chrome extension",
    eyebrow: "Superfície no navegador",
    summary:
      "Analisa um bloco escolhido explicitamente em qualquer página e exibe falácias, fatos ou neutralidade no side panel do Chrome, com impressão do relatório.",
    implementation:
      "Extensão Manifest V3 sem dependências em runtime. Content script, service worker e side panel conversam com a REST API usando uma chave guardada fora da página visitada.",
    files: ["packages/jiddu-chrome-extension/manifest.json", "packages/jiddu-chrome-extension/service-worker.js", "packages/jiddu-chrome-extension/sidepanel.js"],
    domain: "surfaces",
    position: { x: 280, y: 5 },
  },
  {
    id: "rest-api",
    code: "API",
    title: "REST API",
    eyebrow: "Superfície programática",
    summary:
      "Expõe as lentes para produtos externos por endpoints versionados, incluindo início e consulta assíncrona da revisão adversarial.",
    implementation:
      "Route Handlers sob /api/v1 validam API key, aplicam rate limit, registram histórico e mapeiam os resultados internos para contratos JSON estáveis.",
    files: ["src/app/api/v1", "src/lib/api/auth.ts", "src/lib/api/run.ts"],
    domain: "surfaces",
    position: { x: 520, y: 30 },
  },
  {
    id: "mcp",
    code: "MCP",
    title: "MCP",
    eyebrow: "Superfície para agentes",
    summary:
      "Permite que agentes chamem as capacidades do Jiddu como ferramentas, tanto pelo transporte hospedado quanto por um servidor local em stdio.",
    implementation:
      "A rota dinâmica usa mcp-handler e OAuth metadata. O pacote jiddu-mcp empacota sete ferramentas finas sobre a API REST para clientes MCP locais.",
    files: ["src/app/api/[transport]/route.ts", "packages/jiddu-mcp/src/index.ts", "src/lib/mcp-auth.ts"],
    domain: "surfaces",
    position: { x: 760, y: 5 },
  },
  {
    id: "composer",
    code: "C",
    title: "Composer",
    eyebrow: "Entrada do produto",
    summary:
      "Unifica as seis lentes de upload na home, preserva deep links e acompanha cada análise conforme os eventos chegam.",
    implementation:
      "Um Client Component mantém o modo, monta o payload correto, consome SSE e encaminha o leitor para a rota de resultado. UploadForm trata URL, colagem, PDF, TXT e imagem.",
    files: ["src/components/home-composer.tsx", "src/components/upload-form.tsx", "src/components/mode-cards.tsx"],
    domain: "pipeline",
    position: { x: 60, y: 205 },
  },
  {
    id: "route-handlers",
    code: "RT",
    title: "Orquestração",
    eyebrow: "37 rotas de API",
    summary:
      "Coordena autorização, limites, ingestão, jobs, chamadas de modelo, persistência, cobrança e a resposta de cada capacidade.",
    implementation:
      "Route Handlers do App Router funcionam como uma camada BFF. Os pipelines longos emitem SSE; operações discretas usam JSON; tarefas de paper review continuam após a resposta inicial.",
    files: ["src/app/api/analyze/route.ts", "src/app/api/review/route.ts", "src/lib/server-sse.ts"],
    domain: "pipeline",
    position: { x: 300, y: 190 },
    size: "large",
  },
  {
    id: "ingestion",
    code: "I",
    title: "Ingestão segura",
    eyebrow: "URL + arquivos",
    summary:
      "Transforma páginas, PDFs, TXT, imagens e texto colado em um documento normalizado sem perder a referência original.",
    implementation:
      "Readability e JSDOM extraem artigos; PDF.js e LiteParse cuidam de PDFs; a busca remota bloqueia endereços privados, limita redirects e controla tamanho de resposta.",
    files: ["src/lib/ingest/url.ts", "src/lib/ingest/pdf.ts", "src/lib/ingest/file.ts"],
    domain: "pipeline",
    position: { x: 570, y: 205 },
  },
  {
    id: "document-structure",
    code: "D",
    title: "Documento",
    eyebrow: "Estrutura e chunks",
    summary:
      "Cria sentenças, parágrafos, blocos e seções estáveis para que cada achado volte ao trecho ou à página que o sustenta.",
    implementation:
      "Separadores preservam limites semânticos e dividem textos longos com concorrência controlada. Papers recebem estrutura de seção e sinais visuais adicionais.",
    files: ["src/lib/analysis-document.ts", "src/lib/chunker.ts", "src/lib/paper-structure.ts"],
    domain: "pipeline",
    position: { x: 820, y: 190 },
  },
  {
    id: "sse",
    code: "SSE",
    title: "Streaming",
    eyebrow: "Resultado incremental",
    summary:
      "Faz meta, achados, progresso de chunks e conclusão aparecerem enquanto a análise ainda está sendo produzida.",
    implementation:
      "ReadableStream no servidor, eventos SSE tipados e partial-json para recuperar itens completos de uma saída estruturada ainda parcial.",
    files: ["src/lib/server-sse.ts", "src/lib/sse.ts", "src/lib/llm/stream.ts"],
    domain: "pipeline",
    position: { x: 1080, y: 205 },
  },
  {
    id: "fallacies",
    code: "F",
    title: "Falácias",
    eyebrow: "Lente argumentativa",
    summary:
      "Encontra 46 tipos de falácia e ancora cada explicação exatamente na passagem que contém o problema de raciocínio.",
    implementation:
      "Catálogo trilíngue, prompt editorial, schema de finding e execução paralela por chunks. O viewer usa cores estáveis para ligar frase e comentário.",
    files: ["src/lib/fallacies.ts", "src/lib/prompt.ts", "src/components/analysis-view.tsx"],
    domain: "lenses",
    position: { x: 20, y: 405 },
  },
  {
    id: "fact-check",
    code: "FC",
    title: "Fact-check",
    eyebrow: "Lente factual",
    summary:
      "Extrai apenas afirmações verificáveis e, sob comando, confronta cada uma com evidência recente e citações classificadas por qualidade.",
    implementation:
      "Pipeline inspirado no Claimify para extração e Perplexity Sonar para verificação. Veredictos usam cache por hash e TTL conforme o tipo de afirmação.",
    files: ["src/lib/claims-prompt.ts", "src/lib/llm/verifyClaim.ts", "src/components/factcheck-view.tsx"],
    domain: "lenses",
    position: { x: 240, y: 370 },
  },
  {
    id: "neutrality",
    code: "N",
    title: "Neutralidade",
    eyebrow: "Lente editorial",
    summary:
      "Avalia o documento sem inferir esquerda ou direita e mostra oito padrões auditáveis de enquadramento e assimetria.",
    implementation:
      "Um veredicto global, tipo de texto e confiança convivem com findings por sentença. Schema e prompt proíbem classificação de direção partidária.",
    files: ["src/lib/neutrality-prompt.ts", "src/lib/neutrality-schema.ts", "src/components/neutrality-view.tsx"],
    domain: "lenses",
    position: { x: 460, y: 420 },
  },
  {
    id: "explain",
    code: "E",
    title: "Explicar",
    eyebrow: "Lente pedagógica",
    summary:
      "Explica o paper parágrafo a parágrafo no nível de conhecimento escolhido e revela a função de cada bloco na estrutura do argumento.",
    implementation:
      "Perfis de audiência controlam profundidade e vocabulário. Sete papéis de seção, visão geral, mapa do paper e evidência visual preservam a forma do documento.",
    files: ["src/lib/explain-prompt.ts", "src/lib/explain-level-guidance.ts", "src/components/explain-view.tsx"],
    domain: "lenses",
    position: { x: 680, y: 370 },
  },
  {
    id: "slop",
    code: "SL",
    title: "Padrões de escrita",
    eyebrow: "Lente estilística",
    summary:
      "Marca 18 padrões de prosa genérica ou inflada e descreve o problema sem tentar adivinhar se uma IA escreveu o texto.",
    implementation:
      "Taxonomia própria em três idiomas, prompt com regra explícita contra detecção de autoria e o mesmo idioma visual de trechos e cartões ancorados.",
    files: ["src/lib/slop.ts", "src/lib/slop-prompt.ts", "src/components/slop-view.tsx"],
    domain: "lenses",
    position: { x: 900, y: 420 },
  },
  {
    id: "paper-review",
    code: "R",
    title: "Paper review",
    eyebrow: "Revisão adversarial",
    summary:
      "Revisa um artigo completo contra a conferência-alvo, mantendo evidência por página, auditorias e a trilha de retenção de cada fraqueza relevante.",
    implementation:
      "LiteParse, ledger de claims/evidências, cinco passes SPECS, verificação quantitativa, síntese, crítico independente, auditoria de fontes e reparo determinístico.",
    files: ["src/lib/paper-review-job.ts", "src/lib/llm/paper-review.ts", "src/components/paper-review-view.tsx"],
    domain: "lenses",
    position: { x: 1120, y: 370 },
    size: "large",
  },
  {
    id: "prompt-schemas",
    code: "PS",
    title: "Prompts + schemas",
    eyebrow: "Contratos da IA",
    summary:
      "Define o que cada análise deve observar e o formato exato que o restante do produto pode confiar e renderizar.",
    implementation:
      "Prompts especializados são pareados com Zod e JSON Schema. Testes cobrem instruções, parse, invariantes e perdas de evidência antes que a UI consuma o resultado.",
    files: ["src/lib/llm/jsonSchema.ts", "src/lib/schema.ts", "src/lib/paper-review-schema.ts"],
    domain: "intelligence",
    position: { x: 220, y: 590 },
  },
  {
    id: "model-router",
    code: "MR",
    title: "Model router",
    eyebrow: "Execução e fallback",
    summary:
      "Resolve o modelo pedido, executa pelo provedor e troca de modelo apenas quando a primeira tentativa falha antes de emitir saída útil.",
    implementation:
      "Um catálogo central e o cliente OpenRouter normalizam streaming e uso. Fallback, reasoning, custos e telemetria são mantidos fora dos prompts de produto.",
    files: ["src/lib/model-ids.ts", "src/lib/llm/openrouter.ts", "src/lib/llm/fallback.ts"],
    domain: "intelligence",
    position: { x: 500, y: 590 },
    size: "large",
  },
  {
    id: "web-evidence",
    code: "WEB",
    title: "Evidência externa",
    eyebrow: "Busca e fontes",
    summary:
      "Acrescenta evidência viva a fact-check, Context e revisão acadêmica sem confundir cobertura relacionada com prova.",
    implementation:
      "Clientes Sonar fazem busca com citações. Fontes recebem verificação de URL, título, tipo e qualidade; Wikipedia e DBLP cobrem perfis e venues específicos.",
    files: ["src/lib/llm/sonar-client.ts", "src/lib/llm/context-news.ts", "src/lib/pinned-fetch.ts"],
    domain: "intelligence",
    position: { x: 790, y: 590 },
  },
  {
    id: "paper-audit",
    code: "QA",
    title: "Auditoria de papers",
    eyebrow: "Crítica independente",
    summary:
      "Verifica cálculos, fontes, severidade, cobertura dos especialistas e consistência da recomendação antes de liberar a revisão final.",
    implementation:
      "Operações matemáticas são whitelistadas e recalculadas localmente. Um crítico separado decide retenções; reparos e fallbacks determinísticos impedem perda silenciosa.",
    files: ["src/lib/paper-review-computation.ts", "src/lib/paper-review-source-validation.ts", "src/lib/paper-review-audit-schema.ts"],
    domain: "intelligence",
    position: { x: 1070, y: 590 },
  },
  {
    id: "live-session",
    code: "L",
    title: "Live",
    eyebrow: "Áudio em tempo real",
    summary:
      "Transcreve microfone ou aba do navegador e reaplica falácias, fatos e neutralidade à medida que a conversa avança.",
    implementation:
      "Token efêmero para OpenAI Realtime, captura no cliente, diarização opcional e chamadas de análise com limites de frequência, concorrência e custo por duração.",
    files: ["src/components/live/live-page.tsx", "src/lib/live/use-live-session.ts", "src/app/api/live/token/route.ts"],
    domain: "live",
    position: { x: 100, y: 770 },
  },
  {
    id: "context-workspace",
    code: "CX",
    title: "Context workspace",
    eyebrow: "Leitura contínua",
    summary:
      "Transforma a sessão ao vivo em uma bancada com transcrição, achados, grafo, temas, fontes e replay sincronizado.",
    implementation:
      "Dockview compõe painéis rearranjáveis; Zustand separa estado de sessão e UI; React Flow mostra entidades e relações; eventos persistidos reconstroem a linha do tempo.",
    files: ["src/components/context/context-workspace.tsx", "src/components/context/context-graph.tsx", "src/lib/context-replay.ts"],
    domain: "live",
    position: { x: 390, y: 770 },
    size: "large",
  },
  {
    id: "knowledge-graph",
    code: "KG",
    title: "Knowledge graph",
    eyebrow: "Entidades e relações",
    summary:
      "Mantém referências reutilizáveis de entidades e relações sem promover automaticamente dados privados da transcrição a conhecimento público.",
    implementation:
      "Mentions privadas carregam ownership. Perfis e relações públicas só aparecem após enriquecimento atribuído, com fontes, TTL, aliases e jobs idempotentes.",
    files: ["src/lib/context-knowledge.ts", "src/lib/context-knowledge-cache.ts", "src/lib/wikipedia-profile.ts"],
    domain: "live",
    position: { x: 700, y: 770 },
    size: "large",
  },
  {
    id: "auth-access",
    code: "AU",
    title: "Identidade + acesso",
    eyebrow: "Plano de controle",
    summary:
      "Resolve quem está usando o sistema e qual fonte de acesso pode financiar a operação: plataforma incluída, créditos próprios ou API key.",
    implementation:
      "WorkOS AuthKit fornece sessão e OAuth. Políticas de acesso, admin allowlist, API keys com hash e limites de concorrência protegem web, REST e MCP.",
    files: ["src/lib/auth-config.ts", "src/lib/access-policy.ts", "src/lib/api/auth.ts"],
    domain: "platform",
    position: { x: 70, y: 970 },
  },
  {
    id: "billing",
    code: "¢",
    title: "Créditos + Stripe",
    eyebrow: "Reserva e liquidação",
    summary:
      "Evita iniciar trabalho sem saldo e cobra apenas chamadas concluídas, mantendo créditos Jiddu independentes do saldo do provedor.",
    implementation:
      "Um ledger reserva o teto, liquida o uso real e libera sobra. Rate cards versionados convertem custo do modelo; Stripe Checkout e webhook entregam pacotes de uma vez.",
    files: ["src/lib/web-credit-billing.ts", "src/lib/jiddu-credit-rates.ts", "src/lib/stripe-billing.ts"],
    domain: "platform",
    position: { x: 350, y: 970 },
  },
  {
    id: "postgres",
    code: "PG",
    title: "PostgreSQL",
    eyebrow: "29 modelos Prisma",
    summary:
      "Guarda análises, resultados, jobs, sessões, conhecimento, cache, configurações, convites, chaves e o ledger financeiro.",
    implementation:
      "Prisma 7 com adapter-pg acessa PostgreSQL 16. Índices acompanham ownership, criação, expiração, status e recursos usados nas telas de conta e administração.",
    files: ["prisma/schema.prisma", "src/lib/db.ts", "prisma.config.ts"],
    domain: "platform",
    position: { x: 640, y: 970 },
    size: "large",
  },
  {
    id: "admin",
    code: "AD",
    title: "Admin + settings",
    eyebrow: "Operação do produto",
    summary:
      "Centraliza métricas, revisão humana, modelos, limites, preços, créditos, chaves, cache, feedback e concessões de acesso.",
    implementation:
      "Rotas server-side protegidas por identidade de admin usam Server Actions e grids para operar configurações persistidas sem espalhar constantes pelo produto.",
    files: ["src/app/admin", "src/lib/settings.ts", "src/components/data-grid"],
    domain: "platform",
    position: { x: 930, y: 970 },
  },
  {
    id: "outputs",
    code: "OUT",
    title: "Leitores + export",
    eyebrow: "Saída inspecionável",
    summary:
      "Entrega o trabalho em páginas compartilháveis com a fonte ao lado, achados ancorados, avisos de revisão e rotas de impressão.",
    implementation:
      "Seis famílias de viewers cobrem /a, /f, /n, /e, /s e /r. Componentes comuns adicionam share, PDF, Markdown, e-mail e CTAs sem perder a evidência original.",
    files: ["src/components/analysis-view.tsx", "src/components/result-page-cta.tsx", "src/components/export-pdf-button.tsx"],
    domain: "delivery",
    position: { x: 1360, y: 300 },
    size: "large",
  },
  {
    id: "i18n-content",
    code: "I18N",
    title: "Idiomas + conteúdo",
    eyebrow: "EN · PT · ES",
    summary:
      "Mantém interface, análises, guias, blog, políticas e extensão coerentes em inglês, português e espanhol.",
    implementation:
      "Um provider sincroniza cookie, HTML lang e mensagens. Conteúdo editorial usa registros trilíngues; demos e assets da extensão também existem nos três idiomas.",
    files: ["src/lib/i18n/messages.ts", "src/lib/blog.ts", "packages/jiddu-chrome-extension/_locales"],
    domain: "delivery",
    position: { x: 1280, y: 585 },
  },
  {
    id: "tests-evals",
    code: "T",
    title: "Testes + evals",
    eyebrow: "74 testes automatizados",
    summary:
      "Protege contratos de análise, cobrança, SSE, segurança de ingestão, replay, UI state e integrações; mede pipelines com conjuntos próprios.",
    implementation:
      "Node Test e TSX executam testes unitários e integração. PolitiFact mede fact-check; um conjunto SPECS sintético compara modelos de revisão de papers.",
    files: ["src/**/*.test.ts", "evals/run-paper-review-evals.ts", "scripts/benchmark-politifact.mts"],
    domain: "delivery",
    position: { x: 1210, y: 790 },
  },
  {
    id: "deployment",
    code: "VPS",
    title: "Deploy",
    eyebrow: "Build até produção",
    summary:
      "Empacota a aplicação, banco e dependências nativas e só considera a publicação concluída quando a versão no ar responde saudável.",
    implementation:
      "Next standalone roda em Docker. O script de deploy envia main, executa o fluxo remoto no VPS, confere SHA e containers e testa https://jiddu.app/.",
    files: ["Dockerfile", "docker-compose.yml", "scripts/deploy.sh"],
    domain: "delivery",
    position: { x: 1180, y: 980 },
  },
] as const;

export const ARCHITECTURE_EDGES: readonly ArchitectureEdgeDefinition[] = [
  { source: "web-app", target: "composer" },
  { source: "chrome-extension", target: "rest-api" },
  { source: "rest-api", target: "route-handlers" },
  { source: "mcp", target: "route-handlers" },
  { source: "composer", target: "route-handlers" },
  { source: "route-handlers", target: "ingestion" },
  { source: "ingestion", target: "document-structure" },
  { source: "document-structure", target: "fallacies" },
  { source: "document-structure", target: "fact-check" },
  { source: "document-structure", target: "neutrality" },
  { source: "document-structure", target: "explain" },
  { source: "document-structure", target: "slop" },
  { source: "document-structure", target: "paper-review" },
  { source: "fallacies", target: "prompt-schemas" },
  { source: "fact-check", target: "prompt-schemas" },
  { source: "neutrality", target: "prompt-schemas" },
  { source: "explain", target: "prompt-schemas" },
  { source: "slop", target: "prompt-schemas" },
  { source: "paper-review", target: "prompt-schemas" },
  { source: "prompt-schemas", target: "model-router" },
  { source: "model-router", target: "sse" },
  { source: "sse", target: "outputs" },
  { source: "paper-review", target: "paper-audit", role: "support" },
  { source: "web-evidence", target: "fact-check", role: "support" },
  { source: "web-evidence", target: "paper-audit", role: "support" },
  { source: "paper-audit", target: "outputs", role: "support" },
  { source: "live-session", target: "context-workspace" },
  { source: "live-session", target: "route-handlers", role: "support" },
  { source: "context-workspace", target: "knowledge-graph" },
  { source: "web-evidence", target: "knowledge-graph", role: "support" },
  { source: "auth-access", target: "route-handlers", role: "support" },
  { source: "auth-access", target: "rest-api", role: "support" },
  { source: "billing", target: "route-handlers", role: "support" },
  { source: "route-handlers", target: "postgres", role: "support" },
  { source: "knowledge-graph", target: "postgres", role: "support" },
  { source: "billing", target: "postgres", role: "support" },
  { source: "admin", target: "postgres", role: "support" },
  { source: "admin", target: "model-router", role: "support" },
  { source: "admin", target: "billing", role: "support" },
  { source: "outputs", target: "i18n-content", role: "support" },
  { source: "i18n-content", target: "web-app", role: "support" },
  { source: "tests-evals", target: "prompt-schemas", role: "support" },
  { source: "tests-evals", target: "route-handlers", role: "support" },
  { source: "deployment", target: "web-app", role: "support" },
  { source: "deployment", target: "postgres", role: "support" },
] as const;

export const TRACE_PATH = [
  "web-app",
  "composer",
  "route-handlers",
  "ingestion",
  "document-structure",
  "fallacies",
  "prompt-schemas",
  "model-router",
  "sse",
  "outputs",
] as const;

export const SYSTEM_OVERVIEW = {
  title: "Jiddu — mapa do sistema",
  eyebrow: "Codebase atlas",
  summary:
    "O Jiddu é uma plataforma de leitura crítica que mantém fonte e análise juntas. Quatro superfícies alimentam uma esteira comum; seis lentes, Live e Context reutilizam contratos, modelos, evidência, acesso e persistência antes de terminar em leitores inspecionáveis.",
  implementation:
    "Este mapa cobre o app Next.js, os pacotes Chrome e MCP, os pipelines de IA, 29 modelos Prisma, a camada de acesso e créditos, conteúdo trilíngue, testes, avaliações e operação no VPS. Linhas sólidas mostram o caminho principal; linhas tracejadas mostram serviços compartilhados.",
} as const;
