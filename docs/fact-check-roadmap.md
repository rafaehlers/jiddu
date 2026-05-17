# Jiddu — Fact-Check Roadmap

> Plano de evolução do Jiddu para verificar fatos, números e citações além de detectar falácias retóricas. Documento vivo: atualize as fases conforme forem entregues.

## Visão

O Jiddu hoje detecta **falácias lógicas e retóricas** em texto. O próximo salto de valor é responder à pergunta que o usuário realmente quer fazer:

> "Isto que esse político falou é verdade?"

Fact-check com citação de fonte transforma o produto de "leitor crítico" em "assistente de verificação". É também onde o custo, a latência e o risco legal aumentam de ordem de magnitude — por isso a evolução é faseada.

### Princípios

1. **Fact-check é modo separado**, não substitui a análise de falácia. UX deve permitir escolher: `falácias` / `fatos` / `ambos`.
2. **Cada veredito mostra fontes**, sempre. Sem fonte = não exibe veredito.
3. **Linguagem cuidadosa**: "não encontramos evidência que sustente" antes de "falso". Reduz risco de difamação contra pessoas públicas.
4. **Fontes brasileiras tier-1 priorizadas** para PT-BR: IBGE, dados.gov.br, STF/TSE/CGU, Lupa, Aos Fatos, Estadão Verifica, Agência Lupa, G1, Folha, Estadão.
5. **Caching agressivo**: fatos não mudam. Hash do claim → veredito persistido por N dias.

---

## Fase 1 — Extração de claims (MVP)

**Objetivo**: identificar e exibir as afirmações verificáveis do texto. Sem busca, sem veredito.

**Por que começar aqui**: já é útil por si só (usuário vê "este texto faz 23 afirmações factuais"), reutiliza toda a infraestrutura de SSE/chunker/i18n, e estabelece o schema sobre o qual as fases seguintes vão construir.

### Entregáveis

- Nova rota `POST /api/factcheck` (espelho de `/api/analyze`, mesmo padrão de SSE).
- Modo na home: toggle entre `falácias` (atual) e `fatos` (novo).
- Pipeline de extração baseado no Claimify (Microsoft Research, 2025):
  1. **Selection**: para cada sentença, classificar `verifiable` / `unverifiable`. Opiniões, juízos de valor, perguntas retóricas saem.
  2. **Disambiguation**: descartar sentenças com múltiplas leituras plausíveis se nenhuma desambigua claramente pelo contexto.
  3. **Decomposition**: quebrar sentenças com múltiplos fatos em claims separados (sem perseguir atomicidade infinita).
  4. **Decontextualization**: cada claim deve ser entendível sozinho — incluir sujeito, data, escopo.
- Schema novo no banco:
  ```prisma
  model FactCheck {
    id         String   @id
    status     String   @default("pending")
    source     String
    sourceRef  String?
    title      String?
    text       String
    language   String?
    provider   String
    model      String
    sentences  String   @default("[]")
    claims     String   @default("[]")  // [{ id, sentenceIds, statement, type }]
    createdAt  DateTime @default(now())
    finishedAt DateTime?
  }
  ```
- UI: viewer estilo `/a/[id]` mas focado em claims (lista numerada, link pra sentença de origem, ícone do tipo: número / data / citação / afirmação factual).
- Tipos de claim sugeridos: `numeric`, `date`, `quote`, `causal`, `categorical`.

### Stretch

- Score "factual density": claims por 1000 chars. Marca textos que são todos opinião vs. todos números.
- Botão "verificar manualmente" → abre Google com a query da claim.

### Custo estimado

Mesma ordem da análise de falácia atual (~$0,01 por texto). 1 LLM call (com pipeline interno feito via prompt único multi-stage ou via tool calls).

### Esforço

1-2 dias.

---

## Fase 2 — Veredito via Perplexity Sonar

**Objetivo**: para cada claim extraído, emitir um veredito (`true` / `false` / `misleading` / `unverified`) com citações.

**Por que Sonar primeiro**: modelos Sonar (online) da Perplexity, acessíveis via OpenRouter, já fazem busca web + síntese + citação nativa. Permite validar a UX e o produto antes de investir num pipeline custom.

### Entregáveis

- Estender o schema:
  ```prisma
  model FactCheck {
    // ...campos da Fase 1
    verdicts String @default("[]")  // [{ claimId, verdict, confidence, rationale, sources: [{ url, title, snippet }] }]
  }
  ```
- Novo step no pipeline `/api/factcheck`:
  - Após extração de claims, paralelizar uma chamada Sonar por claim (com bounded concurrency, ex.: 6).
  - Prompt do veredito: claim + contexto da sentença → JSON `{ verdict, confidence, rationale, source_urls }`.
- Modelo `perplexity/sonar-pro` ou `sonar-reasoning` adicionado ao `MODEL_CATALOG` (escopo: somente fact-check).
- UI: ao lado de cada claim, badge colorido (verde / vermelho / amarelo / cinza) + lista colapsável de fontes com favicon, título e snippet citado.
- Disclaimer fixo: "Verificações automatizadas podem errar. Sempre confira as fontes."

### Considerações

- **Linguagem do veredito**: nunca usar "is false" sobre pessoa nomeada sem qualificador. Padrão: "não encontramos evidência pública que sustente" / "evidência contradiz parcialmente" / "evidência sustenta com ressalvas".
- **Latência**: 30 claims × Sonar (~5-10s cada) = 30-60s mesmo com concorrência. Stream parcial: emitir verdict assim que cada um termina (mesmo padrão da análise de falácia).
- **Confidence**: o modelo retorna `confidence` (0-1). Esconder verdict se confidence < 0.5 e classificar como `unverified`.

### Custo estimado

Sonar Pro: ~$5/M input tokens, ~$15/M output tokens, + $5/1000 search requests. Texto médio (30 claims × ~3k tokens prompt + 1 search cada) ≈ $0,50-$1 por análise.

### Esforço

3-5 dias.

---

## Fase 3 — Retrieval custom + allowlist BR

**Objetivo**: substituir o Sonar por um loop próprio (LLM + busca web + leitor de página) que prioriza fontes brasileiras tier-1 e permite caching agressivo.

**Por que sair do Sonar**: custo cresce linear com claims, dependência de provider externo opaco, sem controle sobre quais domínios entram na evidência. Pra um produto sério em PT-BR, precisamos curar fontes.

### Entregáveis

- Novo `src/lib/factcheck/retriever.ts`:
  - Provider de busca: Tavily ou Brave Search (ambos têm API limpa e custo previsível).
  - Allowlist tier-1 por idioma:
    - PT: `ibge.gov.br`, `dados.gov.br`, `stf.jus.br`, `tse.jus.br`, `camara.leg.br`, `senado.leg.br`, `cgu.gov.br`, `lupa.uol.com.br`, `aosfatos.org`, `estadao.com.br/estadao-verifica`, `g1.globo.com/fato-ou-fake`, `folha.uol.com.br`.
    - EN: `wikipedia.org`, `reuters.com`, `apnews.com`, `bbc.com`, `politifact.com`, `snopes.com`, `factcheck.org`.
    - ES: equivalentes (`maldita.es`, `chequeado.com`, etc.).
  - Tier-2 (penalizado mas aceito): outros veículos jornalísticos.
  - Blocklist: domínios de baixa qualidade, sites de fake news conhecidos.
- Pipeline em 3 etapas por claim:
  1. Busca → top 5 resultados.
  2. Re-rank com tier (tier-1 sobe, tier-2 desce).
  3. Fetch + extração (Readability) do top 2-3 resultados.
  4. LLM call: claim + 3 snippets de evidência → veredito JSON.
- Caching:
  - Tabela `ClaimVerdict { hash, claim, verdict, confidence, rationale, sources, language, cached_at }`.
  - Hash determinístico (normaliza pontuação, lowercase, ordena tokens).
  - TTL: 30 dias para claims numéricos, 365 dias para histórico/dados estáveis.
  - Reanálise do mesmo texto: cache hit → custo zero pra claims repetidos.
- Métricas: track hit rate do cache, latência média, distribuição de verdicts.

### Considerações

- **SSRF / abuse**: o retriever vai fazer fetch em URLs do search. Reaproveitar a proteção SSRF já implementada em `src/lib/ingest/url.ts` para cada hop.
- **Robots.txt**: alguns sites bloqueiam scraping. Cair pro snippet do search engine quando o fetch falha.
- **Domínios paywalled**: snippets do search geralmente bastam. Se não, marcar evidência como "indireta".

### Custo estimado

Tavily: ~$0,008 por busca, 1000 buscas/$8. Brave: similar. Texto médio (30 claims × ~2 buscas + 30 LLM calls a $0,003 cada) ≈ $0,10-$0,20 por análise.

### Esforço

1-2 semanas.

---

## Fase 4 — Integração com fontes estruturadas

**Objetivo**: para classes específicas de claim (números do PIB, votos no Congresso, decisões do STF), bater diretamente com a API/CSV oficial em vez de procurar matéria de jornal.

**Por que vale**: é onde o produto fica imbatível. Política brasileira é cheia de "o governo gasta X% com Y" que pode ser verificado contra o SIAFI/Tesouro Transparente. Imprensa não escala pra cobrir todo claim numérico — APIs estruturadas, sim.

### Entregáveis

- Classifier de claim (LLM, leve): dado um claim, identifica se ele cai em uma das classes estruturadas. Exemplos:
  - `economic_indicator` (PIB, inflação, desemprego, balança) → IBGE / BCB.
  - `legislative_vote` (votação nominal no Congresso) → API Câmara/Senado.
  - `electoral_result` (votos numa eleição) → TSE.
  - `budget_spending` (gasto do governo em programa X) → SIAFI / Tesouro Transparente.
  - `judicial_decision` (decisão de tribunal) → STF/STJ API.
  - `population_statistic` (dados demográficos) → IBGE.
- Adapters por fonte:
  ```
  src/lib/factcheck/sources/
    ibge.ts       — séries SIDRA, contas nacionais
    bcb.ts        — séries do Banco Central (SGS)
    camara.ts     — dados abertos da Câmara
    senado.ts     — dados abertos do Senado
    tse.ts        — resultados de eleições
    tesouro.ts    — Tesouro Transparente
    stf.ts        — STF dados abertos
  ```
- Pipeline híbrido por claim:
  1. Classifier roda primeiro.
  2. Se a classe tem adapter estruturado: chamada direta na API → comparar valor → veredito com link pra fonte oficial.
  3. Se não: fallback para Fase 3 (busca web em allowlist).
- UI: veredito vindo de fonte estruturada ganha selo "fonte oficial" (ícone diferenciado, mais forte que tier-1 jornalístico).

### Considerações

- **Atualização de adapters**: APIs públicas brasileiras às vezes mudam de URL/formato. Cada adapter precisa ter um smoke test e idealmente um cron de health-check (não bloqueia deploy se quebrar — só fallback pra retrieval).
- **Cache de séries**: dados do IBGE/BCB raramente mudam. TTL longo (semanas).
- **Domínio aberto vs. limites**: começar com 2-3 adapters de maior alavancagem (IBGE + Câmara + TSE cobrem talvez 70% dos claims numéricos políticos). Não tentar cobrir tudo de cara.
- **Internacional**: cada adapter é PT-BR-only inicialmente. EN/ES dependeriam de outros adapters (US Census, Eurostat, etc.) — escopo separado.

### Custo estimado

APIs estruturadas brasileiras são gratuitas. O custo cai ainda mais (uma chamada HTTP é mais barata que um search). Texto médio com 50% dos claims em fontes estruturadas: ~$0,05-$0,10.

### Esforço

3-6 semanas (depende de quantos adapters entrar no escopo inicial).

---

## Riscos transversais

| Risco | Mitigação |
|-------|-----------|
| **Risco legal (difamação)**: classificar declaração de pessoa pública como "false" | Linguagem em todas as fases: "não encontramos evidência que sustente" > "falso". Disclaimer permanente. Sempre mostrar fontes. Termos de uso explícitos. |
| **Viés de fonte**: allowlist BR tem veículos com leitura editorial | Misturar fontes oficiais (governo) com jornalísticas de pelo menos 3 linhas editoriais. Mostrar todas, deixar usuário ler. |
| **Alucinação de veredito**: LLM diz "true" sem evidência sólida | Confidence threshold (esconder veredito < 0.5). Validação adversarial periódica (rodar exemplos canônicos conhecidos). |
| **Fontes desatualizadas**: dados velhos cacheados | TTL diferenciado por tipo de claim. Mostrar data da fonte. Force-refresh manual no admin. |
| **Custo descontrolado**: usuário cola texto gigante | Cap de claims por análise (ex.: 50). Rate limit por IP. |
| **Performance**: análises de 60s+ matam a UX | Stream parcial (verdict por verdict via SSE). Loader honesto com progresso. |

---

## Métricas para acompanhar

Quando a Fase 2 entrar em produção, instrumentar:

- **Hit rate do cache** (Fase 3+): % de claims que vêm do cache.
- **Distribuição de verdicts**: % true / false / misleading / unverified — anomalias indicam viés.
- **Latência p50/p95**: tempo até primeiro verdict, tempo até `done`.
- **Custo por análise**: somar tokens LLM + buscas + fetches.
- **Taxa de "unverified"**: alta = retrieval ruim. Alvo: < 20%.
- **Reclamações**: canal de feedback in-app "este veredito está errado" → re-revisar manualmente, ajustar prompts/allowlist.

---

## Decisões em aberto

- Domínio jurídico: vale ter modo específico para "decisão judicial"? Linguagem técnica, fontes diferentes.
- Personalidades / biografia: claim do tipo "fulano é membro do partido X" — verificar via Wikipedia? Risco de Wikipedia desatualizada.
- "Modo político eleitoral": durante eleições, fontes oficiais (TSE) ganham peso ainda maior, jornalismo perde peso na hora do meio da apuração. Toggle separado?
- Compartilhamento: análises de fact-check geram URL pública como falácias? Risco maior — pode virar arma de campanha. Talvez requerer login para criar e compartilhar.

---

## Próximo passo

Abrir a Fase 1 quando houver banda — começa por:

1. Criar branch `feat/factcheck-phase-1`.
2. Schema migration: nova tabela `FactCheck`.
3. Endpoint `POST /api/factcheck` espelhando `/api/analyze`.
4. Pipeline de extração baseado em Claimify (single LLM call multi-stage).
5. Página `/f/[id]` (paralela a `/a/[id]`) listando claims.
6. Toggle na home: `Falácias` / `Fatos`.
