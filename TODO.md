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

### Novos formatos de input (parser unificado)
- [ ] **Migrar pra [LiteParse](https://github.com/run-llama/liteparse) (Apache-2.0, npm `@llamaindex/liteparse`)** quando quisermos suportar mais que PDF/HTML/paste. Ganhos: `.docx` / `.pptx` / `.xlsx` (briefings, relatórios de ONG, peças de marketing chegam nesses formatos), PDF escaneado via OCR, layout-aware (preserva colunas e tabelas em papers acadêmicos). Custo: binário Rust nativo (verificar prebuilt pro alvo do Docker), e pra Office docs precisa LibreOffice + ImageMagick no container (~500MB+), pra OCR precisa Tesseract bundled. Não substituir `pdfjs-dist` só por substituir — só quando um dos formatos novos virar pedido real.

- [ ] **CSV export** de claims+verdicts pra planilha.
- [ ] **Wikipedia adapter** — sub-caso da Fase 4, mais barato. Útil pra claims sobre pessoas/lugares.
- [ ] **Multi-pass verification** — pra claims "quentes" (alta confiança ou alto interesse), rodar Sonar 3× e tirar maioria. +3× custo; reduz variância.
- [ ] **API key access** pra uso programático. Permite jornalistas scripted-em-cima.
- [ ] **Embed widget** — `<iframe>` de um único claim+veredict pra incorporar em blog post.
- [ ] **Domínio jurídico** — modo específico pra decisões / processos. STF/STJ adapter já cobre boa parte.

---

## Removido / decidido contra

- ~~**Compare two FactChecks side-by-side**~~ — usuário disse "não gostei" (2026-05-21).
- ~~**Phase 3b — custom retriever**~~ — decidido manter Sonar (2026-05-18).

---

## Histórico recente (último mês)

Pra referência rápida de o que já entrou. Vá movendo pra cima quando entrar item novo.

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
