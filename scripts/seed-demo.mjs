import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envUrl = process.env.DATABASE_URL;
const dbPath = envUrl
  ? envUrl.replace(/^file:/, "")
  : path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

// Each demo is a short polemic text in its native language, structured so
// every sentence demonstrates a different fallacy from the catalog. The 8
// fallacy positions match across languages so the visualization tells the
// same story regardless of which one a user opens.
const PROFILES = {
  en: {
    id: "demo-en",
    title: "Demo — climate change denial",
    text: `Everyone with common sense knows that climate change is a hoax invented to control us. If you disagree, it's because the mainstream media has brainwashed you. Either we reject the green agenda completely, or we lose our entire way of life. Dr. Carter, who has a PhD from MIT, said it on a podcast, so it's proven beyond doubt. I personally lived through three of the coldest winters of my life last decade, so global warming clearly isn't real. Climate scientists who support emissions limits are all funded by green-energy lobbies, so their conclusions are worthless. People have always panicked about the weather — every generation thinks the end is near, and they have always been wrong. How can you still trust experts who keep lying about temperature data?`,
    summary:
      "Highly fallacious text: it stacks appeal to popularity, ad hominem, false dilemma and anecdotal reasoning to push climate denial without engaging with any actual evidence.",
    findings: [
      {
        fallacy: "appeal_to_popularity",
        severity: "high",
        explanation:
          "Claims a controversial scientific position is settled because 'everyone with common sense' agrees with it. Appeal to popularity — consensus isn't evidence, and it ignores actual climate science.",
      },
      {
        fallacy: "ad_hominem",
        severity: "high",
        explanation:
          "Instead of addressing the opposing position, attacks dissenters as 'brainwashed' victims of the media. Discredits the person to avoid the argument.",
      },
      {
        fallacy: "false_dichotomy",
        severity: "high",
        explanation:
          "Frames the debate as a binary choice between rejecting all climate policy and losing one's way of life. Ignores the wide spectrum of policy positions between those extremes.",
      },
      {
        fallacy: "appeal_to_authority",
        severity: "high",
        explanation:
          "Uses one PhD's podcast comment as if it settled a scientific question. Appeal to authority — a single credential doesn't substitute for peer-reviewed evidence and the consensus of climatologists.",
      },
      {
        fallacy: "anecdotal",
        severity: "high",
        explanation:
          "Generalizes from a personal experience of three cold winters to disprove a global, multi-decade temperature trend. Anecdotal evidence — local weather isn't climate.",
      },
      {
        fallacy: "genetic_fallacy",
        severity: "high",
        explanation:
          "Dismisses climate scientists' conclusions by their alleged funding source rather than their methodology or data. Genetic fallacy — the origin of an argument doesn't determine its validity.",
      },
      {
        fallacy: "appeal_to_tradition",
        severity: "low",
        explanation:
          "Uses the historical fact that some predictions have been wrong to imply all current concerns must be wrong too. Appeal to tradition + hasty generalization, but weakly applied.",
      },
      {
        fallacy: "loaded_question",
        severity: "high",
        explanation:
          "Loaded question: presupposes that the experts 'keep lying about temperature data' — an unproven claim baked into the wording.",
      },
    ],
  },

  pt: {
    id: "demo-pt",
    title: "Demo — argumento anti-vacina",
    text: `Todo mundo sabe que vacinas causam mais danos do que benefícios. Se você não concorda, é porque foi enganado pela grande mídia. Ou aceitamos essa verdade, ou nossos filhos estarão condenados. O Prof. Silva, que tem PhD em Harvard, disse isso em uma entrevista, portanto está provado cientificamente. Eu mesmo conheço três pessoas que adoeceram depois de tomar a vacina, logo a relação causal é evidente. Cientistas que defendem a vacinação são todos pagos pela indústria farmacêutica, então sua opinião não vale nada. Sempre foi assim ao longo da história: o povo aceita uma ideia, depois descobre que estava errado. Como você pode ainda confiar em quem mente sobre os efeitos colaterais?`,
    summary:
      "Texto altamente fallacioso: combina apelo à popularidade, ataque pessoal, falso dilema e evidência anedótica para construir uma posição anti-vacina sem evidências verificáveis.",
    findings: [
      {
        fallacy: "appeal_to_popularity",
        severity: "high",
        explanation:
          "Afirma que algo é verdadeiro porque 'todo mundo sabe', sem apresentar evidências. Apelo à popularidade (ad populum).",
      },
      {
        fallacy: "ad_hominem",
        severity: "high",
        explanation:
          "Em vez de refutar a posição contrária, desqualifica quem discorda chamando-o de enganado. Ataque ao interlocutor.",
      },
      {
        fallacy: "false_dichotomy",
        severity: "high",
        explanation:
          "Apresenta apenas duas opções extremas quando existem muitas posições intermediárias. Falso dilema.",
      },
      {
        fallacy: "appeal_to_authority",
        severity: "high",
        explanation:
          "Usa a credencial de uma única pessoa como prova científica. Apelo à autoridade — uma entrevista não substitui evidência empírica revisada por pares.",
      },
      {
        fallacy: "anecdotal",
        severity: "high",
        explanation:
          "Generaliza a partir de três casos pessoais e confunde correlação temporal com causalidade. Evidência anedótica + post hoc.",
      },
      {
        fallacy: "genetic_fallacy",
        severity: "high",
        explanation:
          "Rejeita argumentos pela origem (suposto financiamento) em vez de avaliá-los por seu conteúdo. Falácia genética.",
      },
      {
        fallacy: "appeal_to_tradition",
        severity: "low",
        explanation:
          "Usa um padrão histórico vago como suporte. Apelo à tradição/história sem demonstrar que se aplica a este caso específico.",
      },
      {
        fallacy: "loaded_question",
        severity: "high",
        explanation:
          "Pergunta carregada: pressupõe que 'eles mentem sobre os efeitos colaterais', sem que isso tenha sido demonstrado.",
      },
    ],
  },

  es: {
    id: "demo-es",
    title: "Demo — argumento sobre la Tierra plana",
    text: `Cualquier persona con sentido común sabe que la NASA nos miente sobre la forma de la Tierra. Si no estás de acuerdo, es porque te han adoctrinado en la escuela desde pequeño. O aceptamos la verdad, o seguimos siendo esclavos del sistema. El Dr. Martínez, que es ingeniero aeronáutico, lo afirmó en una conferencia, así que está demostrado científicamente. Yo mismo grabé un horizonte plano desde la playa, así que la curvatura no existe. Los científicos que defienden la Tierra redonda están todos pagados por las agencias espaciales, así que su opinión no vale nada. Siempre se creyó que la Tierra era plana, y solo recientemente nos convencieron de lo contrario. ¿Cómo puedes seguir confiando en gente que oculta la verdad sobre nuestro planeta?`,
    summary:
      "Texto altamente falaz: combina apelación a la popularidad, ataque personal, falso dilema y evidencia anecdótica para sostener una posición terraplanista sin evidencias verificables.",
    findings: [
      {
        fallacy: "appeal_to_popularity",
        severity: "high",
        explanation:
          "Afirma que algo es verdadero porque 'cualquiera con sentido común' lo sabe, sin aportar evidencias. Apelación a la popularidad.",
      },
      {
        fallacy: "ad_hominem",
        severity: "high",
        explanation:
          "En lugar de refutar la posición contraria, descalifica a quien discrepa diciendo que está 'adoctrinado'. Ataque al interlocutor.",
      },
      {
        fallacy: "false_dichotomy",
        severity: "high",
        explanation:
          "Presenta solo dos opciones extremas cuando existen muchas posiciones intermedias. Falso dilema.",
      },
      {
        fallacy: "appeal_to_authority",
        severity: "high",
        explanation:
          "Usa la credencial de una sola persona en un campo distinto como prueba científica. Apelación a la autoridad — una conferencia no sustituye a la evidencia revisada por pares.",
      },
      {
        fallacy: "anecdotal",
        severity: "high",
        explanation:
          "Generaliza a partir de una observación personal y mal interpretada (la curvatura no se percibe a corta distancia) para refutar siglos de geodesia. Evidencia anecdótica.",
      },
      {
        fallacy: "genetic_fallacy",
        severity: "high",
        explanation:
          "Rechaza los argumentos por su origen (presunta financiación) en vez de evaluarlos por su contenido. Falacia genética.",
      },
      {
        fallacy: "appeal_to_tradition",
        severity: "low",
        explanation:
          "Apela a una creencia histórica como respaldo. Apelación a la tradición sin demostrar que aplica a este caso específico.",
      },
      {
        fallacy: "loaded_question",
        severity: "high",
        explanation:
          "Pregunta cargada: presupone que 'ocultan la verdad sobre nuestro planeta', sin que esto haya sido demostrado.",
      },
    ],
  },
};

const insert = db.prepare(`
  INSERT OR REPLACE INTO Analysis (
    id, status, source, sourceRef, title, text, language, provider, model,
    score, summary, sentences, findings, createdAt, finishedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();

// Sentence splitting matches the runtime PT-aware splitter for these texts:
// every sentence ends with .!? and the texts have no abbreviations to worry
// about. We compute offsets by scanning the text.
// Mirror of src/lib/sentences.ts (abbreviation-aware splitter) so demo seeds
// align with what the runtime would produce.
const ABBREVIATIONS = new Set([
  "sr", "sra", "srta", "dr", "dra", "exmo", "exma", "prof", "profa",
  "mr", "mrs", "ms", "jr", "st",
  "etc", "ex", "fig", "vs", "p", "pp", "n", "no", "art", "cap",
  "i.e", "e.g", "cf",
]);

function buildSentences(text) {
  const sentences = [];
  const normalized = text.replace(/\r\n/g, "\n");
  const len = normalized.length;
  let start = 0;
  let i = 0;
  let id = 0;

  while (i < len) {
    const ch = normalized[i];
    const isTerminal = ch === "." || ch === "!" || ch === "?" || ch === "\n";
    if (isTerminal) {
      let end = i + 1;
      if (ch === ".") {
        const prevWord = normalized.slice(Math.max(0, i - 6), i).match(/([A-Za-zÀ-ÿ]+)$/);
        const abbr = prevWord?.[1]?.toLowerCase();
        const nextChar = normalized[i + 1];
        const nextIsLower = nextChar && /[a-zà-ÿ]/.test(nextChar);
        const nextIsSpaceThenLower = nextChar === " " && /[a-zà-ÿ]/.test(normalized[i + 2] ?? "");
        if (abbr && ABBREVIATIONS.has(abbr) && (nextIsLower || nextIsSpaceThenLower || nextChar === " ")) {
          i++;
          continue;
        }
        while (end < len && (normalized[end] === "." || normalized[end] === "?" || normalized[end] === "!")) {
          end++;
        }
      }
      if (ch === "\n") {
        while (end < len && normalized[end] === "\n") end++;
      }
      const raw = normalized.slice(start, end);
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        const leadingWs = raw.length - raw.trimStart().length;
        const trailingWs = raw.length - raw.trimEnd().length;
        sentences.push({
          id: `s${id++}`,
          start: start + leadingWs,
          end: end - trailingWs,
          text: trimmed,
        });
      }
      start = end;
      i = end;
      continue;
    }
    i++;
  }
  if (start < len) {
    const raw = normalized.slice(start, len);
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const leadingWs = raw.length - raw.trimStart().length;
      const trailingWs = raw.length - raw.trimEnd().length;
      sentences.push({
        id: `s${id++}`,
        start: start + leadingWs,
        end: len - trailingWs,
        text: trimmed,
      });
    }
  }
  return sentences;
}

function seedProfile(lang, profile) {
  const sentences = buildSentences(profile.text);
  if (sentences.length !== profile.findings.length) {
    console.warn(
      `[${lang}] expected ${profile.findings.length} sentences, got ${sentences.length}; check punctuation`,
    );
  }
  const findings = profile.findings.map((f, i) => ({
    sentenceIds: [`s${i}`],
    fallacy: f.fallacy,
    severity: f.severity,
    quote: sentences[i]?.text ?? "",
    explanation: f.explanation,
  }));

  insert.run(
    profile.id,
    "complete",
    "paste",
    "demo",
    profile.title,
    profile.text,
    lang,
    "anthropic",
    "demo-seed",
    78,
    profile.summary,
    JSON.stringify(sentences),
    JSON.stringify(findings),
    now,
    now,
  );
  console.log(`Seeded /a/${profile.id}`);
}

for (const lang of Object.keys(PROFILES)) {
  seedProfile(lang, PROFILES[lang]);
}

// Legacy short id → Portuguese demo (kept for old shareable links).
const pt = PROFILES.pt;
const sentencesPt = buildSentences(pt.text);
const findingsPt = pt.findings.map((f, i) => ({
  sentenceIds: [`s${i}`],
  fallacy: f.fallacy,
  severity: f.severity,
  quote: sentencesPt[i]?.text ?? "",
  explanation: f.explanation,
}));
insert.run(
  "demo123abc",
  "complete",
  "paste",
  "demo",
  pt.title,
  pt.text,
  "pt",
  "anthropic",
  "demo-seed",
  78,
  pt.summary,
  JSON.stringify(sentencesPt),
  JSON.stringify(findingsPt),
  now,
  now,
);
console.log("Seeded legacy /a/demo123abc");

db.close();
