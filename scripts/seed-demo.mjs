import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envUrl = process.env.DATABASE_URL;
const dbPath = envUrl
  ? envUrl.replace(/^file:/, "")
  : path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

const text = `Todo mundo sabe que vacinas causam mais danos do que benefícios. Se você não concorda, é porque foi enganado pela grande mídia. Ou aceitamos essa verdade, ou nossos filhos estarão condenados. O Prof. Silva, que tem PhD em Harvard, disse isso em uma entrevista, portanto está provado cientificamente. Eu mesmo conheço três pessoas que adoeceram depois de tomar a vacina, logo a relação causal é evidente. Cientistas que defendem a vacinação são todos pagos pela indústria farmacêutica, então sua opinião não vale nada. Sempre foi assim ao longo da história: o povo aceita uma ideia, depois descobre que estava errado. Como você pode ainda confiar em quem mente sobre os efeitos colaterais?`;

const baseSentences = [
  { id: "s0", text: "Todo mundo sabe que vacinas causam mais danos do que benefícios." },
  { id: "s1", text: "Se você não concorda, é porque foi enganado pela grande mídia." },
  { id: "s2", text: "Ou aceitamos essa verdade, ou nossos filhos estarão condenados." },
  { id: "s3", text: "O Prof. Silva, que tem PhD em Harvard, disse isso em uma entrevista, portanto está provado cientificamente." },
  { id: "s4", text: "Eu mesmo conheço três pessoas que adoeceram depois de tomar a vacina, logo a relação causal é evidente." },
  { id: "s5", text: "Cientistas que defendem a vacinação são todos pagos pela indústria farmacêutica, então sua opinião não vale nada." },
  { id: "s6", text: "Sempre foi assim ao longo da história: o povo aceita uma ideia, depois descobre que estava errado." },
  { id: "s7", text: "Como você pode ainda confiar em quem mente sobre os efeitos colaterais?" },
];

// Recompute offsets.
let cursor = 0;
const sentences = baseSentences.map((s) => {
  const idx = text.indexOf(s.text, cursor);
  const end = idx + s.text.length;
  cursor = end;
  return { id: s.id, text: s.text, start: idx, end };
});

const finding = (sid, fallacy, severity, quote) => ({
  sentenceIds: [sid],
  fallacy,
  severity,
  quote,
});

const baseFindings = [
  finding("s0", "appeal_to_popularity", "high", baseSentences[0].text),
  finding("s1", "ad_hominem", "high", baseSentences[1].text),
  finding("s2", "false_dichotomy", "high", baseSentences[2].text),
  finding("s3", "appeal_to_authority", "high", baseSentences[3].text),
  finding("s4", "anecdotal", "high", baseSentences[4].text),
  finding("s5", "genetic_fallacy", "high", baseSentences[5].text),
  finding("s6", "appeal_to_tradition", "low", baseSentences[6].text),
  finding("s7", "loaded_question", "high", baseSentences[7].text),
];

const i18n = {
  en: {
    id: "demo-en",
    title: "Demo — anti-vaccine argument",
    summary:
      "Highly fallacious text: it stacks appeal to popularity, personal attack, false dilemma, and anecdotal evidence to push an anti-vaccine position without verifiable evidence.",
    explanations: [
      "Claims something is true because 'everyone knows' it, without providing evidence. Appeal to popularity (ad populum).",
      "Instead of refuting the opposing position, disqualifies whoever disagrees by calling them deceived. Attack on the interlocutor.",
      "Presents only two extreme options when many intermediate positions exist. False dilemma.",
      "Uses a single person's credentials as scientific proof. Appeal to authority — an interview doesn't replace peer-reviewed evidence.",
      "Generalizes from three personal cases and confuses temporal correlation with causation. Anecdotal evidence + post hoc.",
      "Rejects arguments based on their origin (alleged funding) rather than their content. Genetic fallacy.",
      "Uses a vague historical pattern as support. Appeal to tradition/history without showing it applies to this specific case.",
      "Loaded question: presupposes that 'they lie about side effects' without that having been demonstrated.",
    ],
  },
  pt: {
    id: "demo-pt",
    title: "Demo — argumento anti-vacina",
    summary:
      "Texto altamente fallacioso: combina apelo à popularidade, ataque pessoal, falso dilema e evidência anedótica para construir uma posição anti-vacina sem evidências verificáveis.",
    explanations: [
      "Afirma que algo é verdadeiro porque 'todo mundo sabe', sem apresentar evidências. Apelo à popularidade (ad populum).",
      "Em vez de refutar a posição contrária, desqualifica quem discorda chamando-o de enganado. Ataque ao interlocutor.",
      "Apresenta apenas duas opções extremas quando existem muitas posições intermediárias. Falso dilema.",
      "Usa a credencial de uma única pessoa como prova científica. Apelo à autoridade — uma entrevista não substitui evidência empírica revisada por pares.",
      "Generaliza a partir de três casos pessoais e confunde correlação temporal com causalidade. Evidência anedótica + post hoc.",
      "Rejeita argumentos pela origem (suposto financiamento) em vez de avaliá-los por seu conteúdo. Falácia genética.",
      "Usa um padrão histórico vago como suporte. Apelo à tradição/história sem demonstrar que se aplica a este caso específico.",
      "Pergunta carregada: pressupõe que 'eles mentem sobre os efeitos colaterais', sem que isso tenha sido demonstrado.",
    ],
  },
  es: {
    id: "demo-es",
    title: "Demo — argumento antivacunas",
    summary:
      "Texto altamente falaz: combina apelación a la popularidad, ataque personal, falso dilema y evidencia anecdótica para sostener una posición antivacunas sin evidencias verificables.",
    explanations: [
      "Afirma que algo es verdadero porque 'todos lo saben', sin aportar evidencias. Apelación a la popularidad (ad populum).",
      "En lugar de refutar la posición contraria, descalifica a quien discrepa llamándolo engañado. Ataque al interlocutor.",
      "Presenta solo dos opciones extremas cuando existen muchas posiciones intermedias. Falso dilema.",
      "Usa las credenciales de una sola persona como prueba científica. Apelación a la autoridad — una entrevista no sustituye a la evidencia revisada por pares.",
      "Generaliza a partir de tres casos personales y confunde correlación temporal con causalidad. Evidencia anecdótica + post hoc.",
      "Rechaza los argumentos por su origen (presunta financiación) en vez de evaluarlos por su contenido. Falacia genética.",
      "Usa un patrón histórico vago como respaldo. Apelación a la tradición/historia sin demostrar que aplica a este caso específico.",
      "Pregunta cargada: presupone que 'ellos mienten sobre los efectos secundarios', sin que esto haya sido demostrado.",
    ],
  },
};

// Backwards-compat alias for the old short id.
const ALIAS = "demo123abc";

const insert = db.prepare(`
  INSERT OR REPLACE INTO Analysis (
    id, status, source, sourceRef, title, text, language, provider, model,
    score, summary, sentences, findings, createdAt, finishedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();

for (const lang of Object.keys(i18n)) {
  const d = i18n[lang];
  const findings = baseFindings.map((f, i) => ({
    ...f,
    explanation: d.explanations[i],
  }));
  insert.run(
    d.id,
    "complete",
    "paste",
    "demo",
    d.title,
    text,
    lang,
    "anthropic",
    "demo-seed",
    78,
    d.summary,
    JSON.stringify(sentences),
    JSON.stringify(findings),
    now,
    now,
  );
  console.log(`Seeded /a/${d.id}`);
}

// Keep the legacy short id pointing at the Portuguese demo for stability.
const pt = i18n.pt;
const ptFindings = baseFindings.map((f, i) => ({ ...f, explanation: pt.explanations[i] }));
insert.run(
  ALIAS,
  "complete",
  "paste",
  "demo",
  pt.title,
  text,
  "pt",
  "anthropic",
  "demo-seed",
  78,
  pt.summary,
  JSON.stringify(sentences),
  JSON.stringify(ptFindings),
  now,
  now,
);
console.log(`Seeded legacy /a/${ALIAS}`);

db.close();
