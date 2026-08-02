import { createSeedDatabase } from "./lib/postgres-seed.mjs";

const db = createSeedDatabase();

// A deliberately imperfect, entirely fictional manuscript. Keeping the paper
// synthetic lets the demo show a candid rejection-grade review without
// attributing invented claims or weaknesses to real researchers.
const PAPER_TITLE =
  "ClaimRoute: Confidence-Guided Evidence Retrieval for Low-Resource Fact Verification";
const REVIEW_DATE = "2026-07-26";

const SOURCES = [
  {
    url: "https://aclanthology.org/N18-1074/",
    title: "FEVER: a Large-scale Dataset for Fact Extraction and VERification",
  },
  {
    url: "https://proceedings.neurips.cc/paper/2020/hash/6b493230205f780e1bc26945df7481e5-Abstract.html",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
  },
  {
    url: "https://proceedings.mlr.press/v70/guo17a.html",
    title: "On Calibration of Modern Neural Networks",
  },
];

const VENUE_PROFILE = {
  id: "neurips-2026-main",
  name: "Conference on Neural Information Processing Systems",
  acronym: "NeurIPS",
  kind: "conference",
  edition: 2026,
  track: "Main track",
  selectedYear: 2026,
  selectedTrack: "Main track",
  paperType: "research",
  targetLabel: "NeurIPS 2026 — Main track · research paper",
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
  verifiedAt: REVIEW_DATE,
  profileVerified: true,
  verificationNote: "Official 2026 Main track criteria were applied.",
};

const PROFILES = {
  en: {
    author: "Jiddu Synthetic Research Group (fictional manuscript)",
    pages: [
      {
        page: 1,
        text: "Abstract. ClaimRoute dynamically decides whether to retrieve more evidence for each claim. Across six low-resource languages, it improves macro-F1 by 8.4 points while reducing retrieval calls by 31%.",
      },
      {
        page: 2,
        text: "2 Method. A confidence gate receives the verifier logits and the gold evidence sufficiency label. During training and evaluation, the gate threshold is selected independently for each language.",
      },
      {
        page: 3,
        text: "3 Experimental setup. We translate FEVER claims into six languages and split each translated collection 80/10/10. The same multilingual encoder is used by ClaimRoute and the fixed top-k baseline.",
      },
      {
        page: 4,
        text: "4 Results. Table 2 reports one run per language. ClaimRoute reaches 71.2 macro-F1 versus 62.8 for fixed top-k. Retrieval cost counts successful search requests but excludes retries and empty responses.",
      },
      {
        page: 5,
        text: "5 Analysis. Performance is highest for languages represented in the encoder pretraining corpus. We attribute all gains to adaptive routing.",
      },
      {
        page: 6,
        text: "6 Conclusion. ClaimRoute establishes adaptive routing as a general solution for low-resource fact verification. Code and translated data will be released after acceptance.",
      },
    ],
    review: {
      paper: PAPER_TITLE,
      author: "Jiddu Synthetic Research Group (fictional manuscript)",
      venueTarget: VENUE_PROFILE.targetLabel,
      reviewDate: REVIEW_DATE,
      stageFindings: {
        story:
          "The manuscript tells a clear efficiency story: spend retrieval only on claims that appear uncertain. The narrative overreaches, however, from one translated benchmark to a general solution for low-resource fact verification.",
        presentation:
          "The high-level pipeline is easy to follow, but the threshold-selection protocol, retry policy, translation quality controls, and full hyperparameters are not specified precisely enough to reproduce the central numbers.",
        evaluations:
          "The reported +8.4 macro-F1 is potentially meaningful, but it rests on one run, no confidence intervals, translated rather than naturally occurring claims, and a cost metric that excludes failed retrieval attempts.",
        correctness:
          "The main comparison is not currently valid because the language-specific routing threshold is selected with information described as a gold evidence-sufficiency label during evaluation. The text does not establish a test-label-free selection procedure.",
        significance:
          "Adaptive retrieval is relevant to efficient verification, but the paper has not isolated its contribution from retrieval-augmented generation, calibrated confidence, and dataset effects strongly enough to support the claimed generality.",
      },
      summary:
        "ClaimRoute adds a confidence gate to a multilingual fact-verification pipeline and retrieves additional passages only when the verifier appears uncertain. On translated FEVER subsets in six languages, the paper reports higher macro-F1 and fewer successful search calls than a fixed top-k baseline. The idea is practical and the claimed efficiency/quality trade-off would be useful, but the current evaluation has a possible test-information leak, an incomplete cost accounting, and insufficient evidence for cross-lingual generalization.",
      strengths: [
        {
          text: "The paper targets a concrete and important systems trade-off: verification quality versus retrieval cost.",
          locations: ["p. 1, Abstract", "p. 2, §2"],
        },
        {
          text: "The adaptive-routing mechanism is simple enough to audit and potentially deploy.",
          locations: ["p. 2, §2"],
        },
        {
          text: "The authors report per-language outcomes instead of only an aggregate score.",
          locations: ["p. 4, Table 2"],
        },
      ],
      weaknesses: [
        {
          id: "W1",
          severity: "MAJOR",
          title: "Threshold selection may use test-only information",
          body:
            "The method description says that the routing gate receives a gold evidence-sufficiency label and that a threshold is selected independently for each language “during training and evaluation.” As written, the central comparison can depend on labels unavailable at inference time. The paper must define a clean train/development/test protocol and rerun every result with the test set untouched until final evaluation.",
          locations: ["p. 2, §2", "p. 3, §3.2"],
        },
        {
          id: "W2",
          severity: "MAJOR",
          title: "The retrieval-cost claim omits failed work",
          body:
            "The claimed 31% saving counts successful requests but excludes retries and empty responses. Those events consume latency and provider capacity, and may occur unevenly across languages. Report total requests, retries, wall-clock latency, tokens or bytes retrieved, and monetary cost under the same workload for every method.",
          locations: ["p. 1, Abstract", "p. 4, §4.1"],
        },
        {
          id: "W3",
          severity: "MODERATE",
          title: "Translated FEVER is weak evidence for low-resource generalization",
          body:
            "Machine-translated claims inherit English Wikipedia topics and evidence structure. This does not test naturally occurring misinformation, local entities, or uneven web coverage. At least one native-language dataset or a carefully scoped conclusion is needed.",
          locations: ["p. 3, §3.1", "p. 5, §5"],
        },
        {
          id: "W4",
          severity: "MODERATE",
          title: "Uncertainty and ablations are missing",
          body:
            "Table 2 reports one run and no confidence intervals. The current design also cannot separate gains from adaptive routing, per-language threshold tuning, or the shared multilingual encoder. Add repeated runs, uncertainty estimates, and matched ablations.",
          locations: ["p. 4, Table 2", "p. 5, §5"],
        },
        {
          id: "W5",
          severity: "MINOR",
          title: "The reproducibility commitment is deferred",
          body:
            "Promising code and data only after acceptance leaves the submission without the artifacts or implementation detail needed to verify preprocessing, translation, and routing behavior.",
          locations: ["p. 6, §6"],
        },
      ],
      questions: [
        "Which split is used to choose each language-specific threshold, and can any test label or gold evidence signal influence that choice?",
        "Does the 31% reduction still hold when retries, empty responses, latency, and provider charges are included?",
        "How much of the gain remains with one global threshold and with a calibrated fixed-retrieval baseline?",
        "What manual or automatic checks were used to validate the translated claims and evidence?",
      ],
      overallAssessment:
        "The core idea is plausible and potentially useful, but the present evidence does not support the paper's strongest accuracy, efficiency, or generalization claims. W1 threatens the validity of the headline comparison; W2 changes the meaning of the efficiency result; W3 and W4 limit external validity and statistical confidence. These are substantive experimental issues, not presentation-only fixes.",
      publicationPath: [
        "Freeze a leakage-free protocol with thresholds chosen only on training/development data, then rerun all experiments.",
        "Recompute efficiency using end-to-end retrieval cost, including failures and retries.",
        "Add repeated runs, confidence intervals, and ablations for the gate, calibration, and threshold strategy.",
        "Validate on at least one naturally authored low-resource benchmark or narrow the claims to translated FEVER.",
        "Release an anonymized reproducibility package with preprocessing, prompts, splits, and configurations.",
      ],
      recommendation: "Major revision required before reconsideration",
      sources: SOURCES,
    },
  },
  pt: {
    author: "Grupo de Pesquisa Sintético Jiddu (manuscrito fictício)",
    pages: [
      {
        page: 1,
        text: "Resumo. ClaimRoute decide dinamicamente se deve buscar mais evidências para cada alegação. Em seis idiomas de poucos recursos, melhora o macro-F1 em 8,4 pontos e reduz as chamadas de recuperação em 31%.",
      },
      {
        page: 2,
        text: "2 Método. Um gate de confiança recebe os logits do verificador e o rótulo-ouro de suficiência da evidência. No treino e na avaliação, o limiar é selecionado separadamente para cada idioma.",
      },
      {
        page: 3,
        text: "3 Configuração experimental. Traduzimos alegações do FEVER para seis idiomas e dividimos cada coleção em 80/10/10. O mesmo encoder multilíngue é usado pelo ClaimRoute e pelo baseline top-k fixo.",
      },
      {
        page: 4,
        text: "4 Resultados. A Tabela 2 relata uma execução por idioma. ClaimRoute atinge 71,2 de macro-F1 contra 62,8 do top-k fixo. O custo conta buscas bem-sucedidas, mas exclui tentativas repetidas e respostas vazias.",
      },
      {
        page: 5,
        text: "5 Análise. O desempenho é maior nos idiomas presentes no corpus de pré-treino do encoder. Atribuímos todos os ganhos ao roteamento adaptativo.",
      },
      {
        page: 6,
        text: "6 Conclusão. ClaimRoute estabelece o roteamento adaptativo como solução geral para verificação de fatos em idiomas de poucos recursos. Código e dados traduzidos serão liberados após a aceitação.",
      },
    ],
    review: {
      paper: PAPER_TITLE,
      author: "Grupo de Pesquisa Sintético Jiddu (manuscrito fictício)",
      venueTarget: VENUE_PROFILE.targetLabel,
      reviewDate: REVIEW_DATE,
      stageFindings: {
        story:
          "O manuscrito conta uma história clara de eficiência: gastar recuperação apenas nas alegações que parecem incertas. Porém, extrapola de um único benchmark traduzido para uma solução geral de verificação em idiomas de poucos recursos.",
        presentation:
          "O pipeline é fácil de acompanhar em alto nível, mas o protocolo de escolha do limiar, a política de novas tentativas, os controles de qualidade da tradução e os hiperparâmetros não estão descritos com precisão suficiente para reproduzir os resultados centrais.",
        evaluations:
          "O ganho declarado de +8,4 em macro-F1 pode ser relevante, mas se baseia em uma única execução, sem intervalos de confiança, em alegações traduzidas e numa métrica de custo que exclui buscas malsucedidas.",
        correctness:
          "A comparação principal ainda não é válida porque o limiar específico de cada idioma é selecionado com informação descrita como rótulo-ouro de suficiência da evidência durante a avaliação. O texto não demonstra um procedimento sem acesso aos rótulos de teste.",
        significance:
          "A recuperação adaptativa é relevante para verificação eficiente, mas o artigo não separa sua contribuição de geração aumentada por recuperação, calibração de confiança e efeitos do dataset o bastante para sustentar a generalidade alegada.",
      },
      summary:
        "ClaimRoute adiciona um gate de confiança a um pipeline multilíngue de verificação e recupera passagens adicionais apenas quando o verificador parece incerto. Em subconjuntos traduzidos do FEVER em seis idiomas, o artigo relata maior macro-F1 e menos buscas bem-sucedidas do que um baseline top-k fixo. A ideia é prática, mas a avaliação atual tem possível vazamento de informação do teste, contabilização incompleta de custo e evidência insuficiente de generalização entre idiomas.",
      strengths: [
        {
          text: "O artigo aborda um trade-off concreto e importante: qualidade da verificação versus custo de recuperação.",
          locations: ["p. 1, Resumo", "p. 2, §2"],
        },
        {
          text: "O mecanismo de roteamento adaptativo é simples o bastante para ser auditado e potencialmente implantado.",
          locations: ["p. 2, §2"],
        },
        {
          text: "Os autores relatam resultados por idioma, e não apenas uma média agregada.",
          locations: ["p. 4, Tabela 2"],
        },
      ],
      weaknesses: [
        {
          id: "W1",
          severity: "MAJOR",
          title: "A seleção do limiar pode usar informação exclusiva do teste",
          body:
            "A descrição diz que o gate recebe um rótulo-ouro de suficiência da evidência e que um limiar é selecionado separadamente para cada idioma “durante o treino e a avaliação”. Como está escrito, a comparação central pode depender de rótulos indisponíveis em inferência. O artigo deve definir um protocolo limpo de treino, desenvolvimento e teste e refazer todos os resultados sem tocar no teste até a avaliação final.",
          locations: ["p. 2, §2", "p. 3, §3.2"],
        },
        {
          id: "W2",
          severity: "MAJOR",
          title: "A alegação de custo omite trabalho malsucedido",
          body:
            "A economia declarada de 31% conta apenas buscas bem-sucedidas e exclui novas tentativas e respostas vazias. Esses eventos consomem latência e capacidade do provedor e podem variar entre idiomas. Relatem todas as requisições, tentativas, latência, tokens ou bytes recuperados e custo monetário para cada método sob a mesma carga.",
          locations: ["p. 1, Resumo", "p. 4, §4.1"],
        },
        {
          id: "W3",
          severity: "MODERATE",
          title: "FEVER traduzido é evidência fraca de generalização",
          body:
            "Alegações traduzidas preservam tópicos e a estrutura de evidência da Wikipédia em inglês. Isso não testa desinformação produzida naturalmente, entidades locais ou cobertura desigual da web. É necessário ao menos um dataset nativo ou uma conclusão explicitamente limitada.",
          locations: ["p. 3, §3.1", "p. 5, §5"],
        },
        {
          id: "W4",
          severity: "MODERATE",
          title: "Faltam incerteza estatística e ablações",
          body:
            "A Tabela 2 relata uma única execução e nenhum intervalo de confiança. O desenho também não separa ganhos do roteamento, do ajuste de limiar por idioma ou do encoder compartilhado. Incluam repetições, estimativas de incerteza e ablações comparáveis.",
          locations: ["p. 4, Tabela 2", "p. 5, §5"],
        },
        {
          id: "W5",
          severity: "MINOR",
          title: "A reprodutibilidade é adiada",
          body:
            "Prometer código e dados somente após a aceitação deixa a submissão sem artefatos ou detalhes suficientes para verificar pré-processamento, tradução e roteamento.",
          locations: ["p. 6, §6"],
        },
      ],
      questions: [
        "Qual split escolhe o limiar de cada idioma? Algum rótulo de teste ou sinal-ouro de evidência influencia essa escolha?",
        "A redução de 31% permanece quando novas tentativas, respostas vazias, latência e cobranças do provedor são incluídas?",
        "Quanto do ganho permanece com um único limiar global e com um baseline calibrado de recuperação fixa?",
        "Quais controles manuais ou automáticos validaram as alegações e evidências traduzidas?",
      ],
      overallAssessment:
        "A ideia central é plausível e potencialmente útil, mas a evidência atual não sustenta as alegações mais fortes de acurácia, eficiência ou generalização. W1 ameaça a validade da comparação principal; W2 muda o significado do resultado de eficiência; W3 e W4 limitam validade externa e confiança estatística. São problemas experimentais substantivos, não simples ajustes de apresentação.",
      publicationPath: [
        "Fixar um protocolo sem vazamento, com limiares escolhidos apenas em treino/desenvolvimento, e refazer todos os experimentos.",
        "Recalcular a eficiência com custo ponta a ponta, incluindo falhas e novas tentativas.",
        "Adicionar execuções repetidas, intervalos de confiança e ablações do gate, da calibração e da estratégia de limiar.",
        "Validar em ao menos um benchmark originalmente escrito em idioma de poucos recursos ou restringir as conclusões ao FEVER traduzido.",
        "Liberar um pacote anônimo de reprodutibilidade com pré-processamento, prompts, splits e configurações.",
      ],
      recommendation: "Major revision required before reconsideration",
      sources: SOURCES,
    },
  },
  es: {
    author: "Grupo de Investigación Sintético Jiddu (manuscrito ficticio)",
    pages: [
      {
        page: 1,
        text: "Resumen. ClaimRoute decide dinámicamente si debe recuperar más evidencia para cada afirmación. En seis idiomas de bajos recursos, mejora el macro-F1 en 8,4 puntos y reduce las llamadas de recuperación en un 31%.",
      },
      {
        page: 2,
        text: "2 Método. Una compuerta de confianza recibe los logits del verificador y la etiqueta de oro de suficiencia de evidencia. Durante el entrenamiento y la evaluación, el umbral se selecciona por separado para cada idioma.",
      },
      {
        page: 3,
        text: "3 Configuración experimental. Traducimos afirmaciones de FEVER a seis idiomas y dividimos cada colección 80/10/10. ClaimRoute y la base top-k fija usan el mismo codificador multilingüe.",
      },
      {
        page: 4,
        text: "4 Resultados. La Tabla 2 informa una ejecución por idioma. ClaimRoute alcanza 71,2 de macro-F1 frente a 62,8 para top-k fijo. El costo cuenta búsquedas exitosas pero excluye reintentos y respuestas vacías.",
      },
      {
        page: 5,
        text: "5 Análisis. El rendimiento es mayor en idiomas presentes en el corpus de preentrenamiento del codificador. Atribuimos todas las mejoras al enrutamiento adaptativo.",
      },
      {
        page: 6,
        text: "6 Conclusión. ClaimRoute establece el enrutamiento adaptativo como solución general para verificar hechos en idiomas de bajos recursos. El código y los datos traducidos se publicarán después de la aceptación.",
      },
    ],
    review: {
      paper: PAPER_TITLE,
      author: "Grupo de Investigación Sintético Jiddu (manuscrito ficticio)",
      venueTarget: VENUE_PROFILE.targetLabel,
      reviewDate: REVIEW_DATE,
      stageFindings: {
        story:
          "El manuscrito cuenta una historia clara de eficiencia: gastar recuperación solo en afirmaciones que parecen inciertas. Sin embargo, extrapola de un único benchmark traducido a una solución general para idiomas de bajos recursos.",
        presentation:
          "El pipeline es fácil de seguir a alto nivel, pero el protocolo de selección del umbral, la política de reintentos, los controles de traducción y los hiperparámetros no están descritos con precisión suficiente para reproducir los números centrales.",
        evaluations:
          "La mejora declarada de +8,4 macro-F1 podría ser relevante, pero se apoya en una sola ejecución, sin intervalos de confianza, en afirmaciones traducidas y en una métrica de costo que excluye búsquedas fallidas.",
        correctness:
          "La comparación principal aún no es válida porque el umbral por idioma se selecciona con información descrita como etiqueta de oro de suficiencia durante la evaluación. El texto no establece un procedimiento libre de etiquetas de prueba.",
        significance:
          "La recuperación adaptativa es relevante para una verificación eficiente, pero el artículo no separa suficientemente su contribución de la generación aumentada por recuperación, la calibración de confianza y los efectos del dataset.",
      },
      summary:
        "ClaimRoute añade una compuerta de confianza a un pipeline multilingüe de verificación y recupera pasajes adicionales solo cuando el verificador parece incierto. En subconjuntos traducidos de FEVER en seis idiomas, informa mayor macro-F1 y menos búsquedas exitosas que una base top-k fija. La idea es práctica, pero la evaluación presenta una posible fuga de información de prueba, una contabilidad de costos incompleta y evidencia insuficiente de generalización.",
      strengths: [
        {
          text: "El artículo aborda un compromiso concreto e importante: calidad de verificación frente a costo de recuperación.",
          locations: ["p. 1, Resumen", "p. 2, §2"],
        },
        {
          text: "El mecanismo de enrutamiento es simple de auditar y potencialmente desplegable.",
          locations: ["p. 2, §2"],
        },
        {
          text: "Los autores informan resultados por idioma y no solo una media agregada.",
          locations: ["p. 4, Tabla 2"],
        },
      ],
      weaknesses: [
        {
          id: "W1",
          severity: "MAJOR",
          title: "La selección del umbral puede usar información de prueba",
          body:
            "La descripción dice que la compuerta recibe una etiqueta de oro de suficiencia y que se selecciona un umbral por idioma “durante el entrenamiento y la evaluación”. Tal como está escrito, la comparación puede depender de etiquetas no disponibles en inferencia. El artículo debe definir un protocolo limpio de entrenamiento, desarrollo y prueba y repetir los resultados sin tocar la prueba hasta el final.",
          locations: ["p. 2, §2", "p. 3, §3.2"],
        },
        {
          id: "W2",
          severity: "MAJOR",
          title: "La afirmación de costo omite trabajo fallido",
          body:
            "El ahorro declarado del 31% cuenta solo búsquedas exitosas y excluye reintentos y respuestas vacías. Estos eventos consumen latencia y capacidad y pueden variar entre idiomas. Informen solicitudes totales, reintentos, latencia, tokens o bytes recuperados y costo monetario bajo la misma carga.",
          locations: ["p. 1, Resumen", "p. 4, §4.1"],
        },
        {
          id: "W3",
          severity: "MODERATE",
          title: "FEVER traducido es evidencia débil de generalización",
          body:
            "Las afirmaciones traducidas heredan temas y estructura de evidencia de la Wikipedia inglesa. Esto no prueba desinformación natural, entidades locales ni cobertura web desigual. Hace falta al menos un dataset nativo o limitar explícitamente la conclusión.",
          locations: ["p. 3, §3.1", "p. 5, §5"],
        },
        {
          id: "W4",
          severity: "MODERATE",
          title: "Faltan incertidumbre y ablaciones",
          body:
            "La Tabla 2 informa una sola ejecución y ningún intervalo de confianza. El diseño tampoco separa las mejoras del enrutamiento, del ajuste por idioma o del codificador compartido. Añadan repeticiones, estimaciones de incertidumbre y ablaciones comparables.",
          locations: ["p. 4, Tabla 2", "p. 5, §5"],
        },
        {
          id: "W5",
          severity: "MINOR",
          title: "La reproducibilidad queda aplazada",
          body:
            "Prometer código y datos solo después de la aceptación deja la entrega sin artefactos o detalles suficientes para verificar preprocesamiento, traducción y enrutamiento.",
          locations: ["p. 6, §6"],
        },
      ],
      questions: [
        "¿Qué partición se usa para elegir cada umbral y puede alguna etiqueta de prueba influir en esa decisión?",
        "¿La reducción del 31% se mantiene al incluir reintentos, respuestas vacías, latencia y cargos del proveedor?",
        "¿Cuánta mejora queda con un umbral global y una base calibrada de recuperación fija?",
        "¿Qué controles manuales o automáticos validaron las afirmaciones y evidencias traducidas?",
      ],
      overallAssessment:
        "La idea central es plausible y potencialmente útil, pero la evidencia actual no respalda las afirmaciones más fuertes de precisión, eficiencia o generalización. W1 amenaza la validez de la comparación principal; W2 cambia el significado del resultado de eficiencia; W3 y W4 limitan la validez externa y la confianza estadística. Son problemas experimentales sustantivos, no simples ajustes de presentación.",
      publicationPath: [
        "Fijar un protocolo sin fuga, con umbrales elegidos solo en entrenamiento/desarrollo, y repetir todos los experimentos.",
        "Recalcular la eficiencia con costo de extremo a extremo, incluidas fallas y reintentos.",
        "Añadir ejecuciones repetidas, intervalos de confianza y ablaciones de la compuerta, la calibración y el umbral.",
        "Validar en al menos un benchmark escrito originalmente en un idioma de bajos recursos o limitar las conclusiones a FEVER traducido.",
        "Publicar un paquete anónimo de reproducibilidad con preprocesamiento, prompts, particiones y configuraciones.",
      ],
      recommendation: "Major revision required before reconsideration",
      sources: SOURCES,
    },
  },
};

const insert = db.prepare(`
  INSERT OR REPLACE INTO PaperReview (
    id, status, stage, source, sourceRef, title, author, venueTarget,
    venueProfile, reviewDate, language, provider, model, parser, text, pages,
    complexity, ledger, research, initialReview, review, markdown,
    errorMessage, createdAt, finishedAt, reviewedAt
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
  )
`);

const now = new Date().toISOString();

for (const [language, profile] of Object.entries(PROFILES)) {
  const text = profile.pages.map((page) => page.text).join("\n\n");
  const ledger = {
    paperTitle: PAPER_TITLE,
    author: profile.author,
    centralContribution:
      "A confidence gate conditionally retrieves more evidence for multilingual fact verification.",
    claims: [
      {
        id: "C1",
        statement: "ClaimRoute improves macro-F1 by 8.4 points.",
        kind: "quantitative",
        locations: ["p. 1, Abstract", "p. 4, Table 2"],
        evidenceInPaper: "One run on six translated FEVER subsets.",
        structural: true,
      },
      {
        id: "C2",
        statement: "ClaimRoute reduces retrieval calls by 31%.",
        kind: "quantitative",
        locations: ["p. 1, Abstract", "p. 4, §4.1"],
        evidenceInPaper: "Successful search calls only; retries are excluded.",
        structural: true,
      },
    ],
    demoNote:
      "Compact private ledger for the synthetic demo; production reviews store the full structured ledger.",
  };
  const research = {
    synthesis:
      "Prior work establishes fact-verification benchmarks, retrieval-augmented generation, and confidence calibration. These sources contextualize the demo critique; they do not independently validate the fictional paper's results.",
    sources: SOURCES,
  };

  insert.run(
    `demo-${language}`,
    "complete",
    "complete",
    "pdf",
    "claimroute-synthetic-demo.pdf",
    PAPER_TITLE,
    profile.author,
    VENUE_PROFILE.targetLabel,
    JSON.stringify(VENUE_PROFILE),
    REVIEW_DATE,
    language,
    "openai",
    "demo-curated",
    "liteparse",
    text,
    JSON.stringify(profile.pages),
    "[]",
    JSON.stringify(ledger),
    JSON.stringify(research),
    JSON.stringify(profile.review),
    JSON.stringify(profile.review),
    null,
    null,
    now,
    now,
    now,
  );
  console.log(`✓ Seeded /r/demo-${language}`);
}

console.log("\nDone. Open /r/demo-en, /r/demo-pt, /r/demo-es.");
await db.close();
