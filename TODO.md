# Jiddu — TODO

Backlog vivo. Atualize à medida que cada item entrar ou sair de prioridade. Itens marcados ✅ ficam no histórico até alguém limpar.

---

## P0 — Próxima sessão (feedback system + operacional crítico)

### Feedback enhancements
- [ ] **Email notification ao chegar feedback novo**. Hoje precisa lembrar de abrir `/admin`. Resolve com 1 chamada a Resend / Mailgun no endpoint `POST /api/factcheck/[id]/claim/[claimId]/feedback`. Variável de ambiente nova: `ADMIN_NOTIFY_EMAIL`.
- [ ] **Resolution note no admin**. Schema `VerdictFeedback.resolutionNote` já existe; falta UI (textarea pequeno no card de feedback aberto, salvar junto com o action `resolveFeedbackAction`).
- [ ] **Estender feedback pra fallacy findings + neutrality findings**. Mesmo padrão (botão "Reportar" no card → POST → fila `/admin/feedback`). Schema precisa ganhar coluna `kind: "fact" | "fallacy" | "neutrality"` ou criar 3 tabelas separadas (preferência: coluna unificada).
- [ ] **"Disputed" badge no viewer público**. Quando um claim/finding tiver ≥3 feedbacks `open`, mostra badge cinza "Disputed" embaixo dele. Sinal social pra outros usuários.

### Operacional / segurança
- [ ] **Backup do SQLite**. Verificar se Hostinger faz snapshot do volume `jiddu_jiddu_data` automaticamente. Se não, cron + `rsync` ou `litestream` apontando pra um S3-compatible.
- [ ] **Error monitoring**. Sentry self-hosted ou plano free. Pra cada `console.error` virar alerta. Custo: 0-15 min/mês de setup.

---

## P1 — Médio prazo

### Métricas / observabilidade
- [ ] **Métricas no `/admin/metrics`** que faltam: top 10 vereditos mais reportados, complaint rate por modelo (gpt vs minimax), rationale com maior taxa de feedback. Tudo derivado das tabelas existentes.

### Polish UX
- [ ] **Mobile composer** — formulário hoje é desktop-first. Testar em 375px e ajustar.
- [ ] **Bulk actions** em `/admin/feedback` quando o volume crescer.
- [ ] **IP ban / blocklist** em `/admin` quando spam virar problema.

---

## P2 — Fase 4 (semanas de trabalho, sessão dedicada)

### Painel multi-modelo + Q&A (inspirado no paper Lenz)

Resposta ao achado do paper [Lenz Research (Jordanov, 2026)](https://lenz.io/research/llm-disagreement): 5 LLMs frontier discordam em 67% dos claims. Single-model verdict (nosso atual) é frágil. Três features em camada, todas a custo controlado:

- [ ] **Painel automático "barato" — GPT + MiniMax como juízes da evidência do Sonar.** Em cada `/api/factcheck/[id]/claim/[claimId]/verify`, depois do Sonar devolver `verdict + sources[]`, dispara 2 chamadas paralelas: GPT-5.4-mini e MiniMax M2.7 recebem o claim + as fontes que o Sonar achou e respondem apenas se a *evidência* sustenta o veredito (`supported / contradicted / mixed / unverified` — sem busca, só avaliando o que o Sonar trouxe). Schema novo `verdictPanel: { auto: [{model, verdict}], agreement: "unanimous" | "majority" | "contested" }`. UI: badge ao lado do verdict — "✓ Painel ratifica" / "~ Painel divergente" / "⚠️ Painel contradiz". Pega o erro mais danoso (Sonar tirou conclusão mais forte do que as fontes permitem) sem +3× custo Sonar. +20-30% por claim.
- [ ] **Follow-up Q&A no card de claim** (equivalente ao `/ask/{id}` da Lenz). Botão "Tenho uma dúvida sobre este veredito" abre textarea pequena → POST envia pra Sonar com contexto completo (claim + veredito atual + rationale + fontes citadas) → resposta vira novo bloco abaixo do card. Cura o "veredito de 1 linha não basta pra entender". Rate-limit em `/admin/settings` (default 3 perguntas por claim por IP). Schema novo `ClaimQuestion { id, claimId, question, answer, createdAt }`.
- [ ] **Deep verify manual com modelos "porrada" — Claude Opus 4.8 + GPT-5.5 via OpenRouter.** Botão "Verificação profunda" no card de claim (gated atrás do painel mostrar "contested" OU sempre disponível). Dispara 2 chamadas em paralelo: Opus 4.8 e GPT-5.5 recebem claim + fontes do Sonar e respondem com verdict + rationale próprio. Vira terceiro veredito ao lado do Sonar e do painel barato. Caro por chamada (~$0.10-0.15 cada), mas user-triggered = custo bounded. Cap: 1 deep-verify por claim (igual ao refresh), ajustável no admin. Sinal mais forte de "essa é a verdade do estado da arte 2026".

### Adapters BR + CRUD de fontes whitelisted

A peça mais pesada que sobrou do roadmap original. Híbrido: classifier por claim → estrutura quando dá, Sonar quando não. Plano detalhado em `docs/fact-check-roadmap.md` §"Fase 4".

- [ ] **Classifier de claim** (LLM leve) — roteia cada claim pra um adapter estruturado ou pro Sonar.
- [ ] **Adapter IBGE/SIDRA** — séries de PIB, inflação, desemprego, demográficas.
- [ ] **Adapter Banco Central (SGS)** — Selic, câmbio, agregados monetários.
- [ ] **Adapter Câmara dos Deputados** (dados abertos) — votações, projetos, deputados.
- [ ] **Adapter Senado** (dados abertos).
- [ ] **Adapter TSE** — resultados eleitorais.
- [ ] **Adapter STF** — decisões, ADIs.
- [ ] **Adapter Tesouro Transparente** — gastos por programa.
- [ ] **CRUD de fontes whitelisted** em `/admin`: domínios tier-1 (oficial) / tier-2 (jornalismo) / blocklist, editáveis no admin. Bate com o que o paper Goldfarb et al. propõe.
- [ ] **Badge "fonte oficial"** no viewer quando veredict vier de adapter estruturado (vs jornalismo via Sonar).

### Modo político-eleitoral
- [ ] Acoplado à Fase 4. Toggle que durante eleições re-prioriza TSE / dados oficiais sobre jornalismo. Implementar quando Fase 4 estiver no ar.

---

## P3 — Niche / opcional (faz se aparecer demanda)

### Precisão de highlights (quote → texto)
- [ ] **Citations API da Anthropic** para offsets de trecho exatos. A [Citations API](https://platform.claude.com/docs/en/build-with-claude/citations) (Anthropic **Messages API**, GA — sem beta) faz o modelo citar trechos com `char_location` (`start_char_index` / `end_char_index`) garantidamente idênticos ao texto fonte. Resolveria de vez o alinhamento de highlights de fallacy / neutrality / explain — hoje o modelo devolve um `quote` que pode não bater 100% com o texto (hifenização, espaços) e o Jiddu tem que "adivinhar" onde destacar. **Bloqueado por custo + arquitetura:** só existe na Anthropic Messages API **direta** (blocos `document` + `citations:{enabled:true}`), *não* passa pelo OpenRouter que usamos hoje (chamamos `chat/completions` OpenAI-compat), e só funciona com modelos **Claude** (mais caro que gpt-5.4-mini / MiniMax; o Claude mais barato é Haiku 4.5 a $1/$5 por 1M). Disponível em 1P / Bedrock / Vertex; beta no Foundry. Incompatível com structured outputs. Alternativas grátis já parcialmente cobertas: normalização de hífen no ingest de PDF (✅ feito) + fuzzy matching do `quote` no lado do Jiddu.

### Expansões opcionais
- [ ] **OpenAlex como complemento multidisciplinar do catálogo de venues.** Hoje o autocomplete da revisão adversarial usa DBLP e os perfis oficiais versionados sem exigir conta. Se surgir demanda por cobertura mais ampla fora de Ciência da Computação, integrar a API do OpenAlex como fonte complementar. **Dependência futura:** criar uma API key gratuita e configurar `OPENALEX_API_KEY`; não é necessária para o funcionamento atual.
- [ ] **CSV export** de claims+verdicts pra planilha.
- [ ] **Wikipedia adapter** — sub-caso da Fase 4, mais barato. Útil pra claims sobre pessoas/lugares.
- [ ] **Embed widget** — `<iframe>` de um único claim+veredict pra incorporar em blog post.
- [ ] **Domínio jurídico** — modo específico pra decisões / processos. STF/STJ adapter já cobre boa parte.

---

## Removido / decidido contra

- ~~**Compare two FactChecks side-by-side**~~ — usuário disse "não gostei" (2026-05-21).
- ~~**Phase 3b — custom retriever**~~ — decidido manter Sonar (2026-05-18).
- ~~**Multi-pass verification (mesmo modelo 3×)**~~ — o [paper Lenz](https://lenz.io/research/llm-disagreement) mostra que a variância real está entre modelos, não entre passes do mesmo modelo a temp 0. Substituído pelo "Painel multi-modelo + Deep verify" em P2 (2026-05-30).

---

## Histórico recente (último mês)

Pra referência rápida de o que já entrou. Vá movendo pra cima quando entrar item novo.

- ✅ **Revisão adversarial SPECS profunda**: cinco especialistas independentes, recálculo aritmético seguro, validação SSRF-protegida de fontes, autocrítica + crítico de outro modelo, gate de retenção MAJOR/MODERATE, modos Standard/Deep (GPT-5.5 + Claude Opus 4.8 configuráveis), auditoria pública, persistência privada, API/MCP e benchmark sintético balanceado de 30 casos.
- ✅ **API pública para agentes** (era P3 "API key access"): REST API v1 (`/api/v1/detect-fallacies|fact-check|assess-neutrality|explain`) com API keys admin-issued (`/admin/api-keys`, header `X-Jiddu-Key`) + rate-limit por key; MCP server (remoto in-process em `/api/mcp` via mcp-remote, + pacote local `packages/jiddu-mcp`); evals (`evals/report.md`); `AGENT.md`; página `/api-access` (3 línguas).
- ✅ De-hifenização de PDF no ingest — junta palavras quebradas por hífen no fim de linha ("self-\nreferent" → "selfreferent"); afeta os 4 pipelines.
- ✅ Fix de upload de PDF em produção (Node 22): `@napi-rs/canvas` polyfilla DOMMatrix + worker do pdfjs no trace do standalone.
- ✅ Deploy via `bash scripts/deploy.sh` (push + SSH), substituindo o GitHub Actions bloqueado; favicon Buda; sidebar de pipelines; footer centralizado com licença AGPL.
- ✅ AGPL-3.0-or-later como licença + footer com link pro source + paper links no /legal.
- ✅ Source-quality tiers + state-controlled flag (paper Goldfarb).
- ✅ Neutrality dimension MVP — 8 padrões, sem direção partidária.
- ✅ `/legal` page com termos em 3 línguas + banner "não revisado" no viewer + toggle no admin.
- ✅ Métricas dashboard em `/admin/metrics`.
- ✅ Feedback "veredito errado" + queue no admin.
- ✅ Cache cleanup oportunista.
- ✅ Per-claim verify sem precisar bulk.
- ✅ PDF export (`/a/[id]/print`, `/f/[id]/print`, `/n/[id]/print`).
- ✅ Model picker com 🇺🇸 GPT-5.4 mini / 🇨🇳 MiniMax M2.7.
- ✅ Real-browser request headers (UOL passou de 403 → 200).
- ✅ Phase 1 + Phase 2 + Phase 3a do roadmap original (extração + verdict via Sonar + cache).
- ✅ Admin runtime settings + cache viewer + OpenRouter balance card.
- ✅ Demos em 3 línguas pras 3 dimensões (fallacy, fact-check, neutrality).
