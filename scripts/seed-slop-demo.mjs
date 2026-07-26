import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envUrl = process.env.DATABASE_URL;
const dbPath = envUrl
  ? envUrl.replace(/^file:/, "")
  : path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

// Each demo is a short fictional product-launch blurb written to be
// deliberately slop-heavy: every sentence demonstrates a different pattern
// from the slop catalog, in the same order across languages so the
// visualization tells the same story regardless of which one a user opens.
const PROFILES = {
  en: {
    id: "demo-en",
    title: "Demo — a very slop product launch",
    text: `Here's the thing: most productivity advice misses the point entirely. This is not just another to-do app, it's a complete reinvention of how you think about work. We leverage cutting-edge AI to deliver a robust, transformative and truly game-changing experience. Experts agree that people who plan their day are dramatically more successful. The smart-sync integration significantly improves productivity across every area of your life. We also launched a community forum, underscoring our deep commitment to user empowerment. This release stands as a testament to what a small team with a big vision can achieve. What if I told you that a single app could give you your evenings back? In conclusion, planning matters, focus matters, and this app delivers both. Because in the end, we are not managing tasks — we are managing who we become.`,
    summary:
      "Assembly-line launch copy: nearly every sentence is a recognizable template — a throat-clearing opener, buzzword strings, sourceless expert claims, benefit talk with no numbers, and a fake-profound closing line. Strip the patterns and almost no concrete information remains.",
    findings: [
      {
        pattern: "throat_clearing",
        severity: "high",
        explanation:
          "Opens with a stalling formula instead of the point. Deleting the setup and starting at the actual claim would lose nothing.",
      },
      {
        pattern: "binary_contrast",
        severity: "high",
        explanation:
          "The 'not X, it's Y' template: denies being a to-do app to make 'reinvention' sound profound. Stating what the app actually does would say more.",
      },
      {
        pattern: "buzzword_salad",
        severity: "high",
        explanation:
          "Four stock intensifiers in one sentence — leverage, cutting-edge, robust, game-changing — and no feature named. Plain words plus one concrete capability would carry more.",
      },
      {
        pattern: "weasel_attribution",
        severity: "high",
        explanation:
          "Which experts? 'Experts agree' asserts authority without a name, a study, or a number the reader could check.",
      },
      {
        pattern: "vague_abstraction",
        severity: "high",
        explanation:
          "'Significantly improves productivity' with no measurement, mechanism, or example. A number (minutes saved, tasks shipped) would make this checkable.",
      },
      {
        pattern: "superficial_analysis",
        severity: "low",
        explanation:
          "The trailing '-ing' clause ('underscoring our deep commitment') poses as analysis but only restates the launch as devotion. What the forum is for would be information.",
      },
      {
        pattern: "importance_puffery",
        severity: "high",
        explanation:
          "'Stands as a testament' decrees significance instead of showing it. What the team shipped, in plain terms, would let the reader judge.",
      },
      {
        pattern: "rhetorical_setup",
        severity: "low",
        explanation:
          "'What if I told you…' stages a reveal the sentence never earns. The claim — the app saves evening hours — could simply be stated and supported.",
      },
      {
        pattern: "summary_recap_ending",
        severity: "low",
        explanation:
          "A closing recap of points the reader just read. Ending on the last concrete point would respect the reader's memory.",
      },
      {
        pattern: "fake_profound_kicker",
        severity: "high",
        explanation:
          "The mic-drop metaphor ('managing who we become') restyles a task app as self-transcendence. It adds mood, not meaning — the piece ends stronger without it.",
      },
    ],
  },

  pt: {
    id: "demo-pt",
    title: "Demo — um lançamento de produto bem slop",
    text: `A questão é a seguinte: quase todo conselho de produtividade erra o alvo. Este não é só mais um aplicativo de tarefas, é uma reinvenção completa da sua forma de trabalhar. Alavancamos IA de ponta para entregar uma experiência robusta, transformadora e verdadeiramente revolucionária. Especialistas concordam que quem planeja o dia é dramaticamente mais bem-sucedido. A integração inteligente melhora significativamente a produtividade em todas as áreas da sua vida. Também lançamos um fórum da comunidade, ressaltando nosso profundo compromisso com o empoderamento do usuário. Este lançamento é um testemunho do que um time pequeno com uma grande visão pode conquistar. E se eu te dissesse que um único aplicativo pode devolver as suas noites? Em conclusão, planejar importa, foco importa, e este aplicativo entrega os dois. Porque, no fim, não estamos gerenciando tarefas — estamos gerenciando quem nos tornamos.`,
    summary:
      "Texto de lançamento em linha de montagem: quase toda frase é um molde reconhecível — abertura de pigarro, fileira de buzzwords, especialistas sem nome, benefício sem número e um fecho pseudo-profundo. Removendo os padrões, quase nenhuma informação concreta sobra.",
    findings: [
      {
        pattern: "throat_clearing",
        severity: "high",
        explanation:
          "Abre com fórmula de adiamento em vez do ponto. Cortar a introdução e começar na afirmação de fato não perderia nada.",
      },
      {
        pattern: "binary_contrast",
        severity: "high",
        explanation:
          "O molde 'não é X, é Y': nega ser um app de tarefas para 'reinvenção' soar profundo. Dizer o que o app faz informaria mais.",
      },
      {
        pattern: "buzzword_salad",
        severity: "high",
        explanation:
          "Quatro intensificadores de estoque numa frase — alavancar, de ponta, robusta, revolucionária — e nenhuma funcionalidade nomeada. Palavras simples e uma capacidade concreta diriam mais.",
      },
      {
        pattern: "weasel_attribution",
        severity: "high",
        explanation:
          "Quais especialistas? 'Especialistas concordam' afirma autoridade sem nome, estudo ou número que o leitor possa checar.",
      },
      {
        pattern: "vague_abstraction",
        severity: "high",
        explanation:
          "'Melhora significativamente a produtividade' sem medida, mecanismo ou exemplo. Um número (minutos economizados, tarefas entregues) tornaria isso verificável.",
      },
      {
        pattern: "superficial_analysis",
        severity: "low",
        explanation:
          "O gerúndio final ('ressaltando nosso profundo compromisso') finge análise mas só redecora o lançamento como devoção. Para que serve o fórum seria informação.",
      },
      {
        pattern: "importance_puffery",
        severity: "high",
        explanation:
          "'É um testemunho' decreta importância em vez de demonstrá-la. O que o time entregou, em termos simples, deixaria o leitor julgar.",
      },
      {
        pattern: "rhetorical_setup",
        severity: "low",
        explanation:
          "'E se eu te dissesse…' encena uma revelação que a frase não sustenta. A afirmação — o app devolve horas da noite — poderia ser dita e apoiada diretamente.",
      },
      {
        pattern: "summary_recap_ending",
        severity: "low",
        explanation:
          "Um fecho que recapitula o que o leitor acabou de ler. Terminar no último ponto concreto respeitaria a memória do leitor.",
      },
      {
        pattern: "fake_profound_kicker",
        severity: "high",
        explanation:
          "A metáfora de efeito ('gerenciando quem nos tornamos') traveste um app de tarefas de transcendência. Adiciona clima, não significado — o texto termina mais forte sem ela.",
      },
    ],
  },

  es: {
    id: "demo-es",
    title: "Demo — un lanzamiento de producto muy slop",
    text: `Aquí está la cosa: casi todo consejo de productividad falla el objetivo. Esta no es solo otra app de tareas, es una reinvención completa de tu forma de trabajar. Apalancamos IA de vanguardia para ofrecer una experiencia robusta, transformadora y verdaderamente revolucionaria. Los expertos coinciden en que quien planifica su día es dramáticamente más exitoso. La integración inteligente mejora significativamente la productividad en todas las áreas de tu vida. También lanzamos un foro de la comunidad, subrayando nuestro profundo compromiso con el empoderamiento del usuario. Este lanzamiento es un testimonio de lo que un equipo pequeño con una gran visión puede lograr. ¿Y si te dijera que una sola app puede devolverte tus noches? En conclusión, planificar importa, el foco importa, y esta app entrega ambos. Porque al final, no gestionamos tareas — gestionamos quiénes nos convertimos.`,
    summary:
      "Texto de lanzamiento en línea de montaje: casi cada oración es una plantilla reconocible — apertura de carraspeo, cadena de buzzwords, expertos sin nombre, beneficios sin números y un cierre pseudo-profundo. Al quitar los patrones, casi no queda información concreta.",
    findings: [
      {
        pattern: "throat_clearing",
        severity: "high",
        explanation:
          "Abre con una fórmula dilatoria en lugar del punto. Cortar la introducción y empezar en la afirmación real no perdería nada.",
      },
      {
        pattern: "binary_contrast",
        severity: "high",
        explanation:
          "La plantilla 'no es X, es Y': niega ser una app de tareas para que 'reinvención' suene profundo. Decir qué hace la app informaría más.",
      },
      {
        pattern: "buzzword_salad",
        severity: "high",
        explanation:
          "Cuatro intensificadores de catálogo en una oración — apalancar, de vanguardia, robusta, revolucionaria — y ninguna función nombrada. Palabras simples y una capacidad concreta dirían más.",
      },
      {
        pattern: "weasel_attribution",
        severity: "high",
        explanation:
          "¿Qué expertos? 'Los expertos coinciden' afirma autoridad sin un nombre, un estudio o un número que el lector pueda verificar.",
      },
      {
        pattern: "vague_abstraction",
        severity: "high",
        explanation:
          "'Mejora significativamente la productividad' sin medida, mecanismo ni ejemplo. Un número (minutos ahorrados, tareas entregadas) lo haría verificable.",
      },
      {
        pattern: "superficial_analysis",
        severity: "low",
        explanation:
          "El gerundio final ('subrayando nuestro profundo compromiso') finge análisis pero solo redecora el lanzamiento como devoción. Para qué sirve el foro sería información.",
      },
      {
        pattern: "importance_puffery",
        severity: "high",
        explanation:
          "'Es un testimonio' decreta importancia en lugar de demostrarla. Lo que el equipo entregó, en términos simples, dejaría juzgar al lector.",
      },
      {
        pattern: "rhetorical_setup",
        severity: "low",
        explanation:
          "'¿Y si te dijera…?' monta una revelación que la oración no sostiene. La afirmación — la app devuelve horas de la noche — podría decirse y apoyarse directamente.",
      },
      {
        pattern: "summary_recap_ending",
        severity: "low",
        explanation:
          "Un cierre que recapitula lo que el lector acaba de leer. Terminar en el último punto concreto respetaría la memoria del lector.",
      },
      {
        pattern: "fake_profound_kicker",
        severity: "high",
        explanation:
          "La metáfora de efecto ('gestionamos quiénes nos convertimos') disfraza una app de tareas de trascendencia. Añade clima, no significado — el texto termina más fuerte sin ella.",
      },
    ],
  },
};

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

const insert = db.prepare(`
  INSERT OR REPLACE INTO SlopCheck (
    id, status, source, sourceRef, title, text, language, provider, model,
    score, summary, sentences, findings, createdAt, finishedAt, reviewedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();

function seedProfile(lang, profile) {
  const sentences = buildSentences(profile.text);
  if (sentences.length !== profile.findings.length) {
    console.warn(
      `[${lang}] expected ${profile.findings.length} sentences, got ${sentences.length}; check punctuation`,
    );
  }
  const findings = profile.findings.map((f, i) => ({
    sentenceIds: [`s${i}`],
    pattern: f.pattern,
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
    85,
    profile.summary,
    JSON.stringify(sentences),
    JSON.stringify(findings),
    now,
    now,
    now, // reviewedAt — demos are curated, no warning banner needed
  );
  console.log(`Seeded /s/${profile.id}`);
}

for (const lang of Object.keys(PROFILES)) {
  seedProfile(lang, PROFILES[lang]);
}

db.close();
