import type { Lang } from "./fallacies";
import type { CLINICAL_TRIAL_CHECKS, ClinicalTrialStatus } from "./clinical-trial-schema";

type ClinicalTrialCopy = {
  title: string;
  scope: string;
  unretained: string;
  relatedWeaknesses: string;
  designs: Record<"randomized" | "nonrandomized", string>;
  checks: Record<typeof CLINICAL_TRIAL_CHECKS[number], string>;
  statuses: Record<ClinicalTrialStatus, string>;
};

export const CLINICAL_TRIAL_COPY: Record<Lang, ClinicalTrialCopy> = {
  en: {
    title: "Clinical trial methodological check",
    scope: "Limited to the supplied manuscript. No issue identified does not establish validity. This check does not verify raw data, analysis code or undisclosed protocol deviations and does not guide treatment decisions.",
    unretained: "The initial concern was not retained in the final review. This item remains unassessed; dismissal does not establish that the method is valid.",
    relatedWeaknesses: "Related weaknesses",
    designs: { randomized: "Randomized clinical trial", nonrandomized: "Nonrandomized clinical trial" },
    checks: {
      abstract_results: "Abstract and results",
      text_tables: "Text, tables and denominators",
      comparison_direction: "Direction of comparisons",
      participant_flow: "Participant flow and exclusions",
      intention_to_treat: "Analysis population and intention to treat",
      randomization_blinding: "Allocation, blinding and observation effects",
      outcomes_analysis: "Outcomes and statistical analysis",
      uncertainty_harms: "Uncertainty, clinical importance and harms",
      supported_conclusions: "Conclusions supported by results",
    },
    statuses: {
      demonstrable_error: "Demonstrable error",
      missing_information: "Missing information",
      possible_limitation: "Possible limitation",
      no_issue_found: "No issue identified",
      not_assessable: "Not assessable",
      not_applicable: "Not applicable",
    },
  },
  pt: {
    title: "Checagem metodológica de ensaio clínico",
    scope: "Limitada ao manuscrito fornecido. A ausência de problemas identificados não comprova validade. Esta checagem não verifica dados brutos, código de análise ou desvios de protocolo não declarados e não orienta decisões de tratamento.",
    unretained: "A preocupação inicial não foi retida na revisão final. Este item permanece sem avaliação conclusiva; descartar o achado não comprova que o método seja válido.",
    relatedWeaknesses: "Fraquezas relacionadas",
    designs: { randomized: "Ensaio clínico randomizado", nonrandomized: "Ensaio clínico não randomizado" },
    checks: {
      abstract_results: "Resumo e resultados",
      text_tables: "Texto, tabelas e denominadores",
      comparison_direction: "Direção das comparações",
      participant_flow: "Fluxo de participantes e exclusões",
      intention_to_treat: "População de análise e intenção de tratar",
      randomization_blinding: "Alocação, cegamento e efeitos de observação",
      outcomes_analysis: "Desfechos e análise estatística",
      uncertainty_harms: "Incerteza, relevância clínica e danos",
      supported_conclusions: "Conclusões sustentadas pelos resultados",
    },
    statuses: {
      demonstrable_error: "Erro demonstrável",
      missing_information: "Informação ausente",
      possible_limitation: "Possível limitação",
      no_issue_found: "Nenhum problema identificado",
      not_assessable: "Não avaliável",
      not_applicable: "Não se aplica",
    },
  },
  es: {
    title: "Comprobación metodológica de ensayo clínico",
    scope: "Limitada al manuscrito proporcionado. No identificar problemas no demuestra validez. Esta comprobación no verifica datos brutos, código de análisis ni desviaciones del protocolo no declaradas y no orienta decisiones de tratamiento.",
    unretained: "La preocupación inicial no se conservó en la revisión final. Este punto sigue sin una evaluación concluyente; descartar el hallazgo no demuestra que el método sea válido.",
    relatedWeaknesses: "Debilidades relacionadas",
    designs: { randomized: "Ensayo clínico aleatorizado", nonrandomized: "Ensayo clínico no aleatorizado" },
    checks: {
      abstract_results: "Resumen y resultados",
      text_tables: "Texto, tablas y denominadores",
      comparison_direction: "Dirección de las comparaciones",
      participant_flow: "Flujo de participantes y exclusiones",
      intention_to_treat: "Población de análisis e intención de tratar",
      randomization_blinding: "Asignación, enmascaramiento y efectos de observación",
      outcomes_analysis: "Desenlaces y análisis estadístico",
      uncertainty_harms: "Incertidumbre, relevancia clínica y daños",
      supported_conclusions: "Conclusiones sustentadas por los resultados",
    },
    statuses: {
      demonstrable_error: "Error demostrable",
      missing_information: "Información ausente",
      possible_limitation: "Posible limitación",
      no_issue_found: "Ningún problema identificado",
      not_assessable: "No evaluable",
      not_applicable: "No se aplica",
    },
  },
};
