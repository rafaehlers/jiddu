import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envUrl = process.env.DATABASE_URL;
const dbPath = envUrl
  ? envUrl.replace(/^file:/, "")
  : path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

// One demo per locale. The texts are written to deliberately stack three
// of the 8 neutrality patterns (loaded_language, source_asymmetry,
// asymmetric_attribution) without committing a logical fallacy or a
// factually verifiable lie — so the demo cleanly distinguishes the
// neutrality dimension from fallacy detection and fact-check.
const PROFILES = {
  en: {
    id: "demo-en",
    title: "Demo — politicized economic reporting",
    text: `The government's reckless spending plan, defended only by ideological extremists, was again pushed forward yesterday. Serious economists have repeatedly warned that such measures will damage the country. Meanwhile, the administration's spokesperson merely repeated talking points, while critics offered a substantive counter-analysis.`,
    textType: "informational",
    verdict: "explicitly_partisan",
    confidence: 0.88,
    rationale:
      "Text positions itself as informational but stacks loaded adjectives, asymmetric attribution and one-sided sourcing throughout, with no engagement of the opposing position.",
    findings: [
      {
        sentenceIndex: 0,
        issue: "loaded_language",
        severity: "high",
        quote: "reckless spending plan",
        explanation:
          "Adjective \"reckless\" prejudges the policy. An informational article would attribute the characterization (\"critics call the plan reckless\") instead of stating it as fact.",
      },
      {
        sentenceIndex: 0,
        issue: "loaded_language",
        severity: "high",
        quote: "defended only by ideological extremists",
        explanation:
          "\"Extremists\" + \"only\" frames defenders as a fringe minority without evidence. Loaded categorization rather than neutral description.",
      },
      {
        sentenceIndex: 1,
        issue: "source_asymmetry",
        severity: "high",
        quote: "Serious economists have repeatedly warned",
        explanation:
          "\"Serious\" implies economists who disagree are not serious. No economists supporting the policy are cited; no contrary expert view is engaged.",
      },
      {
        sentenceIndex: 2,
        issue: "asymmetric_attribution",
        severity: "low",
        quote:
          "the administration's spokesperson merely repeated talking points, while critics offered a substantive counter-analysis",
        explanation:
          "Verb framing (\"merely repeated\" vs \"offered a substantive\") is asymmetric. Same descriptive labels should apply to both sides regardless of the author's view.",
      },
    ],
  },

  pt: {
    id: "demo-pt",
    title: "Demo — cobertura econômica enquadrada",
    text: `O plano de gastos irresponsável do governo, defendido apenas por extremistas ideológicos, foi novamente empurrado ontem. Economistas sérios vêm alertando repetidamente que medidas assim vão prejudicar o país. Enquanto isso, o porta-voz da administração apenas repetiu jargões, enquanto críticos apresentaram uma contra-análise substantiva.`,
    textType: "informational",
    verdict: "explicitly_partisan",
    confidence: 0.91,
    rationale:
      "O texto se apresenta como informativo, mas acumula adjetivos carregados, atribuição assimétrica e fontes unilaterais ao longo de todo o parágrafo, sem engajar com a posição oposta.",
    findings: [
      {
        sentenceIndex: 0,
        issue: "loaded_language",
        severity: "high",
        quote: "plano de gastos irresponsável",
        explanation:
          "O adjetivo \"irresponsável\" pré-julga a política. Um texto informativo atribuiria a caracterização (\"críticos chamam o plano de irresponsável\") em vez de apresentá-la como fato.",
      },
      {
        sentenceIndex: 0,
        issue: "loaded_language",
        severity: "high",
        quote: "defendido apenas por extremistas ideológicos",
        explanation:
          "\"Extremistas\" + \"apenas\" enquadram os defensores como minoria marginal sem evidência. Categorização carregada em vez de descrição neutra.",
      },
      {
        sentenceIndex: 1,
        issue: "source_asymmetry",
        severity: "high",
        quote: "Economistas sérios vêm alertando repetidamente",
        explanation:
          "\"Sérios\" implica que economistas que discordam não o são. Nenhum economista a favor da política é citado; nenhuma visão contrária é engajada.",
      },
      {
        sentenceIndex: 2,
        issue: "asymmetric_attribution",
        severity: "low",
        quote:
          "o porta-voz da administração apenas repetiu jargões, enquanto críticos apresentaram uma contra-análise substantiva",
        explanation:
          "O enquadramento verbal (\"apenas repetiu\" vs \"apresentaram contra-análise substantiva\") é assimétrico. Rótulos descritivos iguais deveriam se aplicar aos dois lados.",
      },
    ],
  },

  es: {
    id: "demo-es",
    title: "Demo — cobertura económica con sesgo",
    text: `El plan de gasto irresponsable del gobierno, defendido sólo por extremistas ideológicos, fue nuevamente impulsado ayer. Economistas serios han advertido repetidamente que tales medidas dañarán al país. Mientras tanto, el vocero de la administración simplemente repitió frases hechas, mientras que los críticos ofrecieron un contraanálisis sustantivo.`,
    textType: "informational",
    verdict: "explicitly_partisan",
    confidence: 0.9,
    rationale:
      "El texto se presenta como informativo pero acumula adjetivos cargados, atribución asimétrica y fuentes unilaterales en todo el párrafo, sin engajar con la postura opuesta.",
    findings: [
      {
        sentenceIndex: 0,
        issue: "loaded_language",
        severity: "high",
        quote: "plan de gasto irresponsable",
        explanation:
          "El adjetivo \"irresponsable\" prejuzga la política. Un texto informativo atribuiría la caracterización (\"críticos llaman al plan irresponsable\") en lugar de afirmarlo como hecho.",
      },
      {
        sentenceIndex: 0,
        issue: "loaded_language",
        severity: "high",
        quote: "defendido sólo por extremistas ideológicos",
        explanation:
          "\"Extremistas\" + \"sólo\" enmarcan a los defensores como minoría marginal sin evidencia. Categorización cargada en lugar de descripción neutra.",
      },
      {
        sentenceIndex: 1,
        issue: "source_asymmetry",
        severity: "high",
        quote: "Economistas serios han advertido repetidamente",
        explanation:
          "\"Serios\" implica que los economistas que discrepan no lo son. Ningún economista a favor de la política es citado; ninguna visión contraria es engajada.",
      },
      {
        sentenceIndex: 2,
        issue: "asymmetric_attribution",
        severity: "low",
        quote:
          "el vocero de la administración simplemente repitió frases hechas, mientras que los críticos ofrecieron un contraanálisis sustantivo",
        explanation:
          "El enmarcado verbal (\"simplemente repitió\" vs \"ofrecieron un contraanálisis sustantivo\") es asimétrico. Las mismas etiquetas descriptivas deberían aplicarse a ambos lados.",
      },
    ],
  },
};

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
        const prevChar = normalized[i - 1];
        const nextChar = normalized[i + 1];
        if (prevChar && /[0-9]/.test(prevChar) && nextChar && /[0-9]/.test(nextChar)) {
          i++;
          continue;
        }
        if (
          prevChar && /[A-Za-zÀ-ÿ]/.test(prevChar) &&
          nextChar && /[A-Za-zÀ-ÿ]/.test(nextChar) &&
          (i < 2 || !/[A-Za-zÀ-ÿ]/.test(normalized[i - 2] ?? ""))
        ) {
          i++;
          continue;
        }
        if (
          prevChar && /[A-Za-zÀ-ÿ]/.test(prevChar) &&
          normalized[i - 2] === "."
        ) {
          i++;
          continue;
        }
        const prevWord = normalized.slice(Math.max(0, i - 6), i).match(/([A-Za-zÀ-ÿ]+)$/);
        const abbr = prevWord?.[1]?.toLowerCase();
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

const insert = db.prepare(`
  INSERT OR REPLACE INTO Neutrality (
    id, status, source, sourceRef, title, text, language, provider, model,
    textType, verdict, confidence, rationale, sentences, findings,
    createdAt, finishedAt, reviewedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();

function seed(lang, profile) {
  const sentences = buildSentences(profile.text);
  const findings = profile.findings.map((f) => ({
    sentenceIds: [sentences[f.sentenceIndex]?.id ?? `s${f.sentenceIndex}`],
    issue: f.issue,
    severity: f.severity,
    quote: f.quote,
    explanation: f.explanation,
  }));

  insert.run(
    profile.id,
    "complete",
    "paste",
    null,
    profile.title,
    profile.text,
    lang,
    "openai",
    "demo",
    profile.textType,
    profile.verdict,
    profile.confidence,
    profile.rationale,
    JSON.stringify(sentences),
    JSON.stringify(findings),
    now,
    now,
    now, // reviewedAt — curated, no warning banner
  );
  console.log(`✓ Seeded /n/${profile.id} (${findings.length} findings)`);
}

for (const [lang, profile] of Object.entries(PROFILES)) {
  seed(lang, profile);
}

console.log("\nDone. Open /n/demo-en, /n/demo-pt, /n/demo-es.");
