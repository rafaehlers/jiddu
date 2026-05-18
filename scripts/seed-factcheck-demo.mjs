import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envUrl = process.env.DATABASE_URL;
const dbPath = envUrl
  ? envUrl.replace(/^file:/, "")
  : path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

// Each demo is a short polemic with a deliberate mix of claim types
// (numeric / date / quote / causal / categorical) and a mix of verdicts
// (supported / contradicted / mixed / unverified) so the viewer renders
// every badge colour. Pre-seeded verdicts mean the demo URL doesn't need
// to call Sonar to be useful — same idea as the fallacy demos.
const PROFILES = {
  en: {
    id: "demo-en",
    title: "Demo — claims mixed with bluster",
    text: `The U.S. unemployment rate fell to 4.1% in November 2024 according to the Bureau of Labor Statistics. Inflation has dropped to 2.7% year-over-year. President Smith said in a Fox News interview on January 5 that gas prices are at an all-time high. Studies show that minimum wage increases always cause job losses. The United States has the highest GDP per capita in the world.`,
    claims: [
      {
        sentenceIndex: 0,
        type: "numeric",
        statement:
          "The U.S. unemployment rate fell to 4.1% in November 2024, according to the Bureau of Labor Statistics.",
        rationale:
          "Reports a specific unemployment figure for a named month, attributed to a primary statistical source — directly checkable against BLS releases.",
        verdict: {
          verdict: "supported",
          confidence: 0.91,
          rationale:
            "The November 2024 BLS Employment Situation Summary reports a 4.1% unemployment rate, matching the claim. Major outlets reported the same figure on release day.",
          sources: [
            {
              url: "https://www.bls.gov/news.release/empsit.nr0.htm",
              title: "Employment Situation Summary — BLS",
            },
            {
              url: "https://www.reuters.com/world/us/us-job-growth-rebounds-november-2024-12-06/",
              title:
                "US job growth rebounds in November; unemployment rate ticks up to 4.2%",
            },
          ],
        },
      },
      {
        sentenceIndex: 1,
        type: "numeric",
        statement:
          "U.S. headline inflation has dropped to 2.7% year-over-year (as of late 2024).",
        rationale:
          "A widely tracked macro figure (CPI) attached to a recent timeframe — verifiable against BLS CPI releases.",
        verdict: {
          verdict: "supported",
          confidence: 0.88,
          rationale:
            "The BLS Consumer Price Index for November 2024 reported a 2.7% 12-month increase for all items, matching the claim within rounding.",
          sources: [
            {
              url: "https://www.bls.gov/news.release/cpi.nr0.htm",
              title: "Consumer Price Index — BLS",
            },
            {
              url: "https://www.reuters.com/markets/us/us-consumer-prices-pick-up-november-2024-12-11/",
              title: "US consumer prices pick up in November",
            },
          ],
        },
      },
      {
        sentenceIndex: 2,
        type: "quote",
        statement:
          'On January 5, President Smith stated in a Fox News interview that "gas prices are at an all-time high".',
        rationale:
          "Attributes a specific quote to a named public figure on a specific date and outlet — verifiable against the broadcast transcript.",
        verdict: {
          verdict: "unverified",
          confidence: 0.32,
          rationale:
            'We could not find any reliable record of a "President Smith" giving a Fox News interview on January 5 making this exact claim. The attribution does not match any known sitting president, so the quote cannot be confirmed.',
          sources: [
            {
              url: "https://www.foxnews.com/politics",
              title: "Fox News — Politics index",
            },
          ],
        },
      },
      {
        sentenceIndex: 3,
        type: "causal",
        statement: "Minimum wage increases always cause job losses.",
        rationale:
          "Asserts a universal cause-effect relationship between a policy and an outcome — testable against the labour-economics literature.",
        verdict: {
          verdict: "contradicted",
          confidence: 0.84,
          rationale:
            "The empirical literature on minimum wages does not support a blanket \"always causes job losses\" claim. CBO and academic meta-analyses find effects ranging from negligible to modest disemployment depending on the size of the increase and the local labour market.",
          sources: [
            {
              url: "https://www.cbo.gov/publication/55410",
              title:
                "The Effects on Employment and Family Income of Increasing the Federal Minimum Wage — CBO",
            },
            {
              url: "https://www.nber.org/papers/w28288",
              title:
                "The Effect of Minimum Wages on Low-Wage Jobs — NBER (Cengiz et al.)",
            },
          ],
        },
      },
      {
        sentenceIndex: 4,
        type: "categorical",
        statement:
          "The United States has the highest GDP per capita in the world.",
        rationale:
          "Asserts a rank position in a globally measured statistic — verifiable against IMF/World Bank tables.",
        verdict: {
          verdict: "contradicted",
          confidence: 0.93,
          rationale:
            "IMF and World Bank GDP-per-capita rankings consistently place Luxembourg, Ireland, Switzerland and several Nordic and Gulf economies ahead of the United States. The U.S. is among the top economies but not number one.",
          sources: [
            {
              url: "https://www.imf.org/external/datamapper/NGDPDPC@WEO",
              title: "GDP per capita, current prices — IMF DataMapper",
            },
            {
              url: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD",
              title: "GDP per capita (current US$) — World Bank",
            },
          ],
        },
      },
    ],
  },

  pt: {
    id: "demo-pt",
    title: "Demo — afirmações misturadas com narrativa",
    text: `O PIB brasileiro cresceu 3,4% em 2024 segundo o IBGE. A taxa Selic atual é de 13,75% ao ano. O ministro Haddad declarou em entrevista à Folha no dia 15 de janeiro que o ajuste fiscal está sob controle. Cortar impostos sempre aumenta a arrecadação do governo. O Brasil é a 9ª maior economia do mundo.`,
    claims: [
      {
        sentenceIndex: 0,
        type: "numeric",
        statement:
          "O PIB brasileiro cresceu 3,4% em 2024, segundo o IBGE.",
        rationale:
          "Atribui um valor exato de crescimento do PIB ao ano e à fonte oficial — verificável diretamente nos releases do IBGE.",
        verdict: {
          verdict: "supported",
          confidence: 0.96,
          rationale:
            "O IBGE publicou em março de 2025 que o PIB brasileiro fechou 2024 com alta de 3,4%, a maior desde 2021. A afirmação corresponde ao dado oficial.",
          sources: [
            {
              url: "https://agenciadenoticias.ibge.gov.br/en/agencia-news/2184-news-agency/news/42779-gdp-closes-2024-at-3-4-and-has-highest-rate-since-2021",
              title: "GDP closes 2024 at 3.4% and records highest rate since 2021 — IBGE",
            },
            {
              url: "https://agenciabrasil.ebc.com.br/en/economia/noticia/2025-03/brazilian-economy-grows-34-2024-highest-rise-2021",
              title: "Brazilian economy grows 3.4% in 2024 — Agência Brasil",
            },
          ],
        },
      },
      {
        sentenceIndex: 1,
        type: "numeric",
        statement: "A taxa Selic vigente é de 13,75% ao ano.",
        rationale:
          "Afirma o valor corrente de uma taxa de juros oficial — verificável contra o histórico do Copom/BCB.",
        verdict: {
          verdict: "mixed",
          confidence: 0.55,
          rationale:
            "A Selic já chegou a 13,75% em 2023, mas o valor flutua a cada reunião do Copom. Sem uma data específica, a afirmação só estaria correta para janelas específicas do histórico. Para o valor atual, consultar o BCB.",
          sources: [
            {
              url: "https://www.bcb.gov.br/controleinflacao/historicotaxasjuros",
              title: "Histórico das taxas de juros — Banco Central",
            },
          ],
        },
      },
      {
        sentenceIndex: 2,
        type: "quote",
        statement:
          'Em 15 de janeiro, o ministro Fernando Haddad declarou à Folha de S.Paulo que "o ajuste fiscal está sob controle".',
        rationale:
          "Atribui uma fala específica a um ministro nomeado, em data e veículo específicos — verificável contra a edição daquele dia da Folha.",
        verdict: {
          verdict: "unverified",
          confidence: 0.34,
          rationale:
            "Não encontramos registro confiável de uma entrevista de Haddad à Folha em 15 de janeiro com exatamente essa fala. Existem declarações públicas de Haddad sobre ajuste fiscal em outras ocasiões, mas a atribuição específica (Folha, dessa data) não foi confirmada.",
          sources: [
            {
              url: "https://www1.folha.uol.com.br/mercado/",
              title: "Folha de S.Paulo — Mercado",
            },
          ],
        },
      },
      {
        sentenceIndex: 3,
        type: "causal",
        statement:
          "Cortar impostos sempre aumenta a arrecadação do governo.",
        rationale:
          "Afirma uma relação causal universal entre política tributária e arrecadação — testável contra a literatura econômica.",
        verdict: {
          verdict: "contradicted",
          confidence: 0.86,
          rationale:
            "A curva de Laffer prevê que cortes de impostos podem aumentar arrecadação apenas quando as alíquotas estão acima de um ponto crítico. A literatura empírica e os exemplos históricos (cortes de Bush, Trump, Reagan) mostram que, na faixa usual de alíquotas, cortes geralmente reduzem a arrecadação. A palavra 'sempre' não se sustenta.",
          sources: [
            {
              url: "https://www.cbo.gov/publication/56504",
              title: "The 2017 Tax Cuts and Jobs Act — CBO retrospective",
            },
            {
              url: "https://www.nber.org/papers/w27741",
              title: "Tax Policy and the Economy — NBER",
            },
          ],
        },
      },
      {
        sentenceIndex: 4,
        type: "categorical",
        statement:
          "O Brasil é a 9ª maior economia do mundo (PIB nominal).",
        rationale:
          "Atribui uma posição específica de ranking econômico global ao Brasil — verificável contra IMF/World Bank.",
        verdict: {
          verdict: "supported",
          confidence: 0.78,
          rationale:
            "Nos rankings de PIB nominal de 2024 do FMI e do Banco Mundial, o Brasil aparece geralmente entre a 8ª e a 10ª posição, dependendo do ano e do método. A 9ª posição é defensável com a maioria das fontes recentes.",
          sources: [
            {
              url: "https://www.imf.org/external/datamapper/NGDPD@WEO/BRA",
              title: "Brazil GDP — IMF DataMapper",
            },
            {
              url: "https://data.worldbank.org/country/brazil",
              title: "Brazil — World Bank",
            },
          ],
        },
      },
    ],
  },

  es: {
    id: "demo-es",
    title: "Demo — afirmaciones mezcladas con bravata",
    text: `La economía argentina creció 2,3% en el tercer trimestre de 2024 según el INDEC. La inflación mensual bajó a 2,4% en noviembre. El presidente Milei declaró en una entrevista en La Nación el 10 de enero que el cepo cambiario ya se levantó por completo. Bajar impuestos siempre genera más recaudación. España es la cuarta economía más grande de Europa.`,
    claims: [
      {
        sentenceIndex: 0,
        type: "numeric",
        statement:
          "La economía argentina creció 2,3% en el tercer trimestre de 2024 según el INDEC.",
        rationale:
          "Atribuye un valor de crecimiento del PIB a un trimestre y a una fuente oficial — comprobable contra los informes del INDEC.",
        verdict: {
          verdict: "mixed",
          confidence: 0.58,
          rationale:
            "INDEC reportó variación intertrimestral positiva en el tercer trimestre de 2024 luego de varios trimestres de caída, pero el valor exacto y la metodología (intertrimestral vs. interanual) varían según el informe. La afirmación es defendible solo si se aclara la métrica.",
          sources: [
            {
              url: "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-9-47",
              title: "Cuentas Nacionales — INDEC",
            },
          ],
        },
      },
      {
        sentenceIndex: 1,
        type: "numeric",
        statement:
          "La inflación mensual argentina bajó a 2,4% en noviembre de 2024.",
        rationale:
          "Afirma un dato puntual del IPC mensual — verificable contra el informe de INDEC.",
        verdict: {
          verdict: "supported",
          confidence: 0.89,
          rationale:
            "El INDEC reportó una inflación mensual de 2,4% en noviembre de 2024, la más baja en varios años. La afirmación coincide con el dato oficial.",
          sources: [
            {
              url: "https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-31",
              title: "Índice de Precios al Consumidor — INDEC",
            },
            {
              url: "https://www.reuters.com/world/americas/argentina-monthly-inflation-eases-24-november-2024-12-11/",
              title: "Argentina monthly inflation eases to 2.4% in November — Reuters",
            },
          ],
        },
      },
      {
        sentenceIndex: 2,
        type: "quote",
        statement:
          'El 10 de enero, el presidente Milei declaró en una entrevista con La Nación que "el cepo cambiario ya se levantó por completo".',
        rationale:
          "Atribuye una declaración específica a un funcionario público, en fecha y medio determinados — verificable contra la edición correspondiente.",
        verdict: {
          verdict: "contradicted",
          confidence: 0.78,
          rationale:
            'Hasta principios de 2025, el cepo cambiario en Argentina seguía vigente con flexibilizaciones parciales — no fue levantado por completo. Si bien Milei ha hecho declaraciones sobre planes de levantamiento futuro, una declaración del 10 de enero diciendo que ya se levantó "por completo" contradice la realidad operativa documentada.',
          sources: [
            {
              url: "https://www.lanacion.com.ar/economia/",
              title: "La Nación — Economía",
            },
            {
              url: "https://www.reuters.com/world/americas/argentinas-milei-says-currency-controls-be-lifted-2024-2025-01-22/",
              title: "Argentina's Milei says currency controls to be lifted",
            },
          ],
        },
      },
      {
        sentenceIndex: 3,
        type: "causal",
        statement: "Bajar impuestos siempre genera más recaudación.",
        rationale:
          "Afirma una relación causal universal entre política tributaria y recaudación — testable contra la literatura económica.",
        verdict: {
          verdict: "contradicted",
          confidence: 0.84,
          rationale:
            "La curva de Laffer predice mayor recaudación solo cuando las alícuotas están por encima de un punto crítico. La evidencia empírica internacional muestra que, en la mayoría de los casos, bajar impuestos reduce la recaudación a corto y mediano plazo. El 'siempre' es una sobre-generalización.",
          sources: [
            {
              url: "https://www.nber.org/papers/w27741",
              title: "Tax Policy and the Economy — NBER",
            },
            {
              url: "https://www.imf.org/en/Publications/WP",
              title: "IMF Working Papers — Fiscal Policy",
            },
          ],
        },
      },
      {
        sentenceIndex: 4,
        type: "categorical",
        statement: "España es la cuarta economía más grande de Europa.",
        rationale:
          "Atribuye una posición específica de ranking económico a un país — verificable contra IMF/World Bank.",
        verdict: {
          verdict: "supported",
          confidence: 0.81,
          rationale:
            "En los rankings de PIB nominal de Europa de los últimos años, España aparece consistentemente en cuarto lugar, por detrás de Alemania, Reino Unido y Francia, aunque a veces es superada por Italia. La afirmación es defendible.",
          sources: [
            {
              url: "https://www.imf.org/external/datamapper/NGDPD@WEO/ESP",
              title: "Spain GDP — IMF DataMapper",
            },
            {
              url: "https://ec.europa.eu/eurostat/web/national-accounts",
              title: "National accounts — Eurostat",
            },
          ],
        },
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

const VERIFY_MODEL = "perplexity/sonar-reasoning-pro";

const insert = db.prepare(`
  INSERT OR REPLACE INTO FactCheck (
    id, status, source, sourceRef, title, text, language, provider, model,
    sentences, claims, verdicts, refreshCounts, verifyStatus, verifyModel,
    verifyStartedAt, verifyFinishedAt, createdAt, finishedAt, reviewedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();

function seed(lang, profile) {
  const sentences = buildSentences(profile.text);
  if (sentences.length !== profile.claims.length) {
    console.warn(
      `[${lang}] expected ${profile.claims.length} sentences, got ${sentences.length}; check punctuation`,
    );
  }

  const claims = profile.claims.map((c, i) => ({
    id: `c${i + 1}`,
    sentenceIds: [sentences[c.sentenceIndex]?.id ?? `s${c.sentenceIndex}`],
    statement: c.statement,
    type: c.type,
    rationale: c.rationale,
  }));

  const verdicts = profile.claims.map((c, i) => ({
    claimId: `c${i + 1}`,
    verdict: c.verdict.verdict,
    confidence: c.verdict.confidence,
    rationale: c.verdict.rationale,
    sources: c.verdict.sources.map((s) => ({
      url: s.url,
      title: s.title ?? null,
    })),
    model: VERIFY_MODEL,
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
    JSON.stringify(sentences),
    JSON.stringify(claims),
    JSON.stringify(verdicts),
    "{}",
    "complete",
    VERIFY_MODEL,
    now,
    now,
    now,
    now,
    // Mark demo rows as reviewed so the public viewer doesn't surface
    // the "not yet reviewed" warning banner on them.
    now,
  );
  console.log(`✓ Seeded /f/${profile.id} (${claims.length} claims, ${verdicts.length} verdicts)`);
}

for (const [lang, profile] of Object.entries(PROFILES)) {
  seed(lang, profile);
}

console.log("\nDone. Open /f/demo-en, /f/demo-pt, /f/demo-es.");
