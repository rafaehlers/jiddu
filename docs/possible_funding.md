# Jiddu — Fontes de financiamento possíveis

> Mapeamento de caminhos para sustentar o custo operacional do Jiddu (LLM, infra) à medida que o uso crescer. Documento vivo — atualize com status, datas de aplicação e respostas.

> Decisão de licença: aplicação inteira sob MIT. Este levantamento é histórico;
> confirme valores, prazos e critérios atuais nos sites oficiais antes de aplicar.

Organizado por horizonte de tempo e tamanho do grant, do mais fácil ao mais ambicioso.

---

## 1. Quick wins — créditos de LLM e infra (semanas, gratuito)

Primeiro passo óbvio. Custo zero pra aplicar, retorno rápido.

| Programa | O que oferece | Esforço | Status |
|----------|---------------|---------|--------|
| [Anthropic Startup Program](https://www.anthropic.com/startup-program) | Até US$ 1k em créditos Claude; mais se aceito no acelerador | Formulário curto, 1-2 semanas de espera | — |
| OpenAI Startup Program / Pioneer | Créditos OpenAI (US$ 1-5k típico) | Formulário, possível entrevista | — |
| OpenRouter | Créditos discricionários para projetos OSS / civic tech | Email direto pra `team@openrouter.ai` explicando o projeto | — |
| [Google Cloud for Startups](https://cloud.google.com/startup) | US$ 2k-200k em créditos GCP | Aplicação via algum hub/aceleradora costuma ajudar | — |
| [AWS Activate](https://aws.amazon.com/activate/) | US$ 1k-100k em créditos AWS | Formulário; valor varia por estágio | — |
| [Hugging Face Community Grants](https://huggingface.co/community-grants) | Créditos de GPU + visibilidade | Cabe melhor quando uma versão self-hosted rodar pesos abertos | — |

**Total estimado em créditos só desta linha: US$ 3-10k.** Cobre meses de operação no nível atual.

---

## 2. Grants médios — US$ 5k a 50k (semanas a meses)

**[NLnet NGI Zero](https://nlnet.nl/themes/)** — Fundação holandesa, financia OSS de interesse público. Foco em "trustworthy information" e AI accountability encaixa direto no Jiddu. Calls quase sempre abertos. Grants típicos €5k-€50k. Decisão em 2-3 meses. Aplicação técnica, dá pra fazer solo.

**[Mozilla Technology Fund](https://foundation.mozilla.org/en/what-we-fund/)** — Foco em AI accountability + auditing. Calls anuais, grants em torno de US$ 50k.

**[Knight Prototype Fund](https://knightfoundation.org/)** — US$ 20-50k para protótipos de tecnologia jornalística / cívica. Calls episódicos.

**Hugging Face Community Grants** (mencionado acima em quick wins, mas o tier alto chega aqui).

---

## 3. Grants grandes — US$ 50k a 500k+ (meses)

**[Google News Initiative (GNI)](https://newsinitiative.withgoogle.com/)** — É o caminho mais alinhado. Financia ferramentas tech para jornalismo / fact-check regularmente. Tem **Innovation Challenges específicos para América Latina** com calls anuais — já financiaram tools muito similares ao Jiddu. **Prioridade alta** quando tivermos números de uso.

**[Luminate Group](https://luminategroup.com)** — Bancam Lupa e Aos Fatos no Brasil. Foco exato no nicho (disinformation, civic tech, LatAm). Sem call público sempre aberto, mas aceita contato direto.

**[Knight Foundation](https://knightfoundation.org/)** — Foco em journalism + civic tech. Grants gerais.

**[Open Society Foundations](https://www.opensocietyfoundations.org/)** — Financia tech contra desinformação. Programa específico para América Latina.

**[Open Technology Fund (OTF)](https://www.opentech.fund/)** — Gov dos EUA. Financia ferramentas de liberdade de expressão. Tem o Internet Freedom Fund e o Information Controls Fellowship.

**[MacArthur Foundation — Journalism & Media](https://www.macfound.org/programs/journalism-media/)** — Grants altos mas processo longo.

---

## 4. Brasil-específico

| Programa | Quem | Notas |
|----------|------|-------|
| **FAPESP PIPE** | Estado SP | Programa Pesquisa Inovativa em PME. Precisa CNPJ e tese de projeto. Útil se houver vínculo acadêmico. |
| **FINEP** | Federal | Grants altos para R&D, processo lento. |
| **CGI.br / Nic.br** | Comitê Gestor da Internet | Ocasionalmente abre chamadas para projetos de internet e sociedade. |
| **Fundação Tide Setubal** | Privada | Linha de civic tech. |
| **Instituto Vero** | Think tank novo | Foco em plataformas e regulação. Vale acompanhar. |

---

## 5. Estratégia prática (caminho sugerido)

Pelo perfil atual do projeto (solo, prod no ar, sem time/CNPJ ainda):

### Imediato — esta semana
- Aplicar nos programas de **créditos LLM** (Anthropic, OpenAI, OpenRouter).
- Zero custo de oportunidade. Soma fácil de US$ 3-5k em créditos.

### Próximas 4-8 semanas
- Usar a licença MIT, a documentação e os benchmarks na avaliação de programas para projetos de código aberto.
- Confirmar os critérios atuais de NLnet, Knight, GNI, Luminate e OSF antes de preparar candidaturas.

### Próximos 3-6 meses
- Montar números de uso reais: análises/mês, usuários únicos, **exemplos concretos** de análises que pegaram desinformação real (estudos de caso).
- Com métricas na mão, **GNI Latin America Innovation Challenge** vira realista — é onde mora o dinheiro maior.

### Multiplicador — partnership
- **Parceria com Lupa ou Aos Fatos** vale 10× em qualquer aplicação.
- Se Jiddu virar ferramenta usada por uma fact-check org acreditada IFCN, abre portas em **todos** os grants acima.
- Vale tentar email-cego para os dois oferecendo o tool como instrumento auxiliar de redação.

### Longo prazo
- Quando Jiddu tiver uso real, programas como **Google AI for Good** ou parceria direta com Anthropic / Microsoft AI for Good oferecem grants em compute substanciais.

---

## 6. O que ajuda em qualquer aplicação

- **Código aberto sob MIT** → permite avaliar programas que exigem publicação do software; a elegibilidade depende das regras atuais de cada chamada.
- **Métricas de uso reais** → abre GNI, Knight, Luminate.
- **Enquadramento "social good" claro** → abre AI for Good, OSF.
- **Partnership com fact-check org acreditada** → multiplicador universal.
- **Afiliação acadêmica** (USP, UFRJ, FGV, UFMG) → abre FAPESP, FINEP, programas universitários.
- **Documentação técnica boa** (metodologia, roadmap e casos de uso) → reduz fricção em qualquer review.

---

## 7. Decisões a tomar antes de aplicar nos grants maiores

- **Licença do código**: decidido — aplicação inteira sob MIT. Preservar os avisos de terceiros e verificar os requisitos de cada programa.
- **Entidade jurídica**: CNPJ próprio, MEI, vinculação a ONG existente? Necessário para grants maiores.
- **Política de compartilhamento de dados**: análises são públicas via URL — isso é feature ou risco? Definir antes da aplicação.
- **Roadmap apresentável**: o `docs/fact-check-roadmap.md` já ajuda. Preparar uma versão adequada para candidaturas sem expor detalhes internos.
- **Disclaimer e termos**: quando entrar fact-check, termos de uso e disclaimer ficam obrigatórios — alguns grants pedem para revisar.

---

## 8. Próximo passo

1. Aplicar **Anthropic Startup Program** ainda esta semana (15 min de formulário).
2. Aplicar **OpenAI Startup Program** em seguida.
3. Email direto pro **OpenRouter** explicando o projeto e pedindo crédito.
4. Usar o repositório MIT, o README e os benchmarks para documentar candidaturas, após conferir os critérios atuais.
