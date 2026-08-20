import type { Lang } from "./fallacies";

const LANG_NAME: Record<Lang, string> = {
  en: "English",
  pt: "Portuguese (Brazilian)",
  es: "Spanish",
};

const SOURCE_HINTS: Record<Lang, string> = {
  pt: "When checking Brazilian topics, prefer authoritative Brazilian sources: IBGE, Banco Central, governo federal (gov.br), Câmara dos Deputados, Senado, TSE, STF, CGU, plus reputable fact-checkers like Agência Lupa, Aos Fatos, Estadão Verifica and G1 Fato ou Fake. Use international sources (Reuters, AP, BBC) when relevant.",
  en: "Prefer authoritative primary sources (government statistics agencies, official press releases, peer-reviewed reports) and reputable reporting / fact-checking outlets (Reuters, AP, BBC, PolitiFact, Snopes, FactCheck.org).",
  es: "Prefiere fuentes autoritativas: agencias estatales de estadística, gobiernos oficiales, medios y fact-checkers serios (Reuters, AP, BBC, Maldita.es, Chequeado, Aos Fatos, Agência Lupa cuando aplique).",
};

export const VERIFY_PROMPT_VERSION = "underlying-proposition-v2";

const ATTRIBUTION_VERBS = [
  // Portuguese
  "afirmou",
  "afirma",
  "disse",
  "dizia",
  "declarou",
  "declara",
  "alegou",
  "alega",
  "sustentou",
  "sustenta",
  "argumentou",
  "argumenta",
  "defendeu",
  "defende",
  "garantiu",
  "garante",
  "informou",
  "informa",
  "anunciou",
  "anuncia",
  "acusou",
  "acusa",
  // English
  "said",
  "says",
  "stated",
  "states",
  "claimed",
  "claims",
  "asserted",
  "asserts",
  "argued",
  "argues",
  "reported",
  "reports",
  "announced",
  "announces",
  "alleged",
  "alleges",
  "maintained",
  "maintains",
  // Spanish
  "dijo",
  "dice",
  "afirmó",
  "declaró",
  "alegó",
  "sostuvo",
  "sostiene",
  "argumentó",
  "aseguró",
  "asegura",
  "informó",
  "anunció",
].join("|");

export function buildVerifySystemPrompt(lang: Lang = "en"): string {
  return `You are a careful fact-checking assistant. You receive ONE factual claim and you must judge whether public, verifiable evidence supports it. You have web search available — use it.

OUTPUT FORMAT — reply with a single valid JSON object and nothing else. No prose before or after. No markdown fences. The JSON object must match exactly:
{
  "verdict": "supported" | "contradicted" | "mixed" | "unverified",
  "confidence": 0.0-1.0,
  "rationale": "...",
  "sourceTiers": [{"url": "...", "tier": "primary|scholarly|think_tank|journalistic|commercial_content|informal", "stateControlled": true|false}]
}

VERDICT LABELS:
- supported: the claim is corroborated by reliable evidence as stated.
- contradicted: reliable evidence directly contradicts the claim as stated (e.g. wrong number, wrong attribution, event did not happen).
- mixed: the claim is partly true, depends on context not given, or true with important qualifications.
- unverified: you could not find enough reliable evidence to judge the claim either way.

VERIFICATION TARGET:
- For numeric, date, causal, and categorical claims, judge the underlying factual proposition. If the wording is "Person said/asserted that P", verify P — not whether Person uttered those words.
- A source that merely repeats, transcribes, or reports that Person said P is evidence of the speech act only. It does not support P unless it also provides independent evidence for P.
- For quote claims, the wording and attribution are themselves the verification target. Check whether the named source actually said or wrote the quoted content.
- The rationale must address the verification target directly. Do not award a supported verdict to a non-quote claim merely because a transcript or news report reproduces it.

CONFIDENCE: a number between 0 and 1 reflecting how strongly the evidence supports your verdict. Use < 0.5 when the evidence is sparse, conflicting, or comes from low-quality sources.

RATIONALE: one or two sentences in ${LANG_NAME[lang]}, plain language, no markdown. State what the actual evidence says and where it differs from (or matches) the claim. NEVER use the words "true" or "false" about a named person — write "evidence does not support" / "evidence contradicts the figure" / "we could not find evidence that supports", etc.

SOURCES: ${SOURCE_HINTS[lang]} If you cite paywalled, partisan, or unreliable sources, downweight your confidence.

SOURCE TIERS (sourceTiers field) — classify EVERY cited source:
- primary: an official source of the underlying fact. Government data agencies (IBGE, BLS, BCB, INDEC, IMF datamapper), court rulings (STF, STJ), legislative records, peer-reviewed papers, primary documents.
- scholarly: academic work that is not the primary source but is academically rigorous. University research, NBER working papers, OECD/UN reports, dissertation.
- think_tank: research organization with a known editorial line. CBO, IPEA, FGV CEPESP, Brookings, Cato, Heritage. Includes IMF/World Bank publications when they are analysis rather than data.
- journalistic: mainstream, IFCN-aligned or otherwise reputable journalism. Reuters, AP, BBC, NYT, Folha, Estadão, G1, Globo, Lupa, Aos Fatos, Estadão Verifica, BBC News Brasil, El País, La Nación. Even when state-funded BUT editorially independent (BBC, NPR, Deutsche Welle), classify as journalistic with stateControlled=false.
- commercial_content: branded content, press releases, marketing materials, sponsored posts, company blogs.
- informal: social media posts (X/Twitter, Facebook, Instagram, TikTok, YouTube comments), personal blogs, forum threads, YouTube videos by non-credentialed creators.

STATE-CONTROLLED (stateControlled boolean) — set to true ONLY for outlets whose editorial line is controlled by a state in a way that compromises independence: RT, RT en Español, CGTN, Xinhua, Sputnik, Press TV, Telesur, Granma, KCNA. State-FUNDED but editorially independent (BBC, NPR, PBS, Deutsche Welle, France 24, NHK World) is stateControlled=false. When unsure, set to false.

When in doubt about a verdict, return "unverified" with a low confidence. Do not invent.`;
}

export function buildVerifyUserPrompt(
  statement: string,
  type: string,
  sourceUrl?: string | null,
  speakerName?: string | null,
): string {
  const verificationTarget = buildVerificationTarget(
    statement,
    type,
    speakerName,
  );
  const targetGuidance =
    type === "quote"
      ? `This is a quote/attribution claim. Verify whether the named source actually used the attributed wording.\n\nQuote or attribution to verify:\n${verificationTarget}`
      : speakerName
        ? `Speaker attribution metadata: ${speakerName}\n\nThe speaker name records who made the statement; it is not the fact to verify. Verify only the underlying proposition below. Evidence that merely confirms that ${speakerName} said it is insufficient.\n\nUnderlying proposition to verify:\n${verificationTarget}`
        : `Verify the underlying factual proposition. If the wording contains a speech-attribution wrapper, do not treat proof of the speech act as proof of the proposition.\n\nUnderlying proposition to verify:\n${verificationTarget}`;

  return `Fact-check the following claim. The claim is of type "${type}".

Listener-supplied captured source page:
${sourceUrl || "(none supplied)"}

Use the publisher, URL path and page topic only to disambiguate the speaker, event and intended entities. The supplied URL is not proof. Treat it as evidence only if web search retrieves the page contents and those contents directly support or contradict the claim.

Original extracted claim:
${statement}

${targetGuidance}`;
}

export function buildVerificationTarget(
  statement: string,
  type: string,
  speakerName?: string | null,
): string {
  const original = statement.trim();
  if (type === "quote" || !speakerName?.trim()) return original;

  const speaker = escapeRegExp(speakerName.trim());
  const directAttribution = new RegExp(
    `^\\s*${speaker}\\s+(?:${ATTRIBUTION_VERBS})\\s*(?:(?:que|that)\\s+)?[:,-]?\\s*(.+)$`,
    "iu",
  );
  const accordingTo = new RegExp(
    `^\\s*(?:segundo|de\\s+acordo\\s+com|according\\s+to|según)\\s+${speaker}\\s*,?\\s*(.+)$`,
    "iu",
  );
  const match = directAttribution.exec(original) ?? accordingTo.exec(original);
  const candidate = match?.[1]?.trim();
  if (!candidate) return original;

  return stripMatchingQuotes(candidate);
}

function stripMatchingQuotes(value: string): string {
  const pairs: ReadonlyArray<readonly [string, string]> = [
    ['"', '"'],
    ["'", "'"],
    ["“", "”"],
    ["‘", "’"],
    ["«", "»"],
  ];
  for (const [open, close] of pairs) {
    if (value.startsWith(open) && value.endsWith(close)) {
      return value.slice(open.length, -close.length).trim();
    }
  }
  return value;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
