import type { Lang } from "./fallacies";

export type SlopDef = {
  id: string;
  category: "wording" | "drama" | "structure" | "substance" | "format";
  color: string; // rgb(r, g, b)
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  example: Record<Lang, string>;
};

// Same golden-angle recipe as the fallacy catalog: 18 hues spread by 137.5°
// so any subset flagged in one document gets maximally distinct colors.
// (Slop and fallacy highlights never share a page, so overlapping hues with
// the other catalog is fine.)
function hslToRgb(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const to8 = (v: number) => Math.round((v + m) * 255);
  return `rgb(${to8(r)}, ${to8(g)}, ${to8(b)})`;
}

const COLORS = Array.from({ length: 18 }, (_, n) =>
  hslToRgb((n * 137.5) % 360, 0.65, 0.58),
);

// Catalog of AI-slop writing patterns — the templates, tics and filler that
// make prose read as machine-assembled. Detection only flags the pattern and
// explains it; Jiddu never rewrites the text. Concepts are common currency in
// writing advice; all wording here is Jiddu's own.
const SLOP_RAW: Omit<SlopDef, "color">[] = [
  {
    id: "buzzword_salad",
    category: "wording",
    name: { en: "Buzzword salad", pt: "Salada de buzzwords", es: "Ensalada de buzzwords" },
    description: {
      en: "Leans on inflated stock words (delve, leverage, robust, transformative, game-changer) instead of plain ones.",
      pt: "Apoia-se em palavras infladas de estoque (mergulhar, alavancar, robusto, transformador, revolucionário) no lugar de palavras simples.",
      es: "Se apoya en palabras infladas de catálogo (profundizar, apalancar, robusto, transformador, revolucionario) en lugar de palabras simples.",
    },
    example: {
      en: "“We leverage cutting-edge AI to deliver a robust, transformative experience.”",
      pt: "“Alavancamos IA de ponta para entregar uma experiência robusta e transformadora.”",
      es: "“Apalancamos IA de vanguardia para ofrecer una experiencia robusta y transformadora.”",
    },
  },
  {
    id: "filler_phrases",
    category: "wording",
    name: { en: "Filler phrases", pt: "Frases de enchimento", es: "Frases de relleno" },
    description: {
      en: "Stock connectives that delay the point without adding meaning (it's worth noting, at the end of the day, in today's world).",
      pt: "Conectivos prontos que adiam o ponto sem adicionar significado (vale ressaltar, no fim das contas, no mundo de hoje).",
      es: "Conectores de fábrica que retrasan el punto sin añadir significado (cabe destacar, al final del día, en el mundo de hoy).",
    },
    example: {
      en: "“It's worth noting that, in today's fast-paced world, communication is important.”",
      pt: "“Vale ressaltar que, no mundo acelerado de hoje, a comunicação é importante.”",
      es: "“Cabe destacar que, en el acelerado mundo de hoy, la comunicación es importante.”",
    },
  },
  {
    id: "throat_clearing",
    category: "drama",
    name: { en: "Throat-clearing opener", pt: "Abertura de pigarro", es: "Apertura de carraspeo" },
    description: {
      en: "Opens with a stalling formula (here's the thing, let me be clear) instead of stating the point.",
      pt: "Abre com uma fórmula de adiamento (a questão é a seguinte, vou ser claro) em vez de afirmar o ponto.",
      es: "Abre con una fórmula dilatoria (aquí está la cosa, seré claro) en lugar de afirmar el punto.",
    },
    example: {
      en: "“Here's the thing: pricing is hard.”",
      pt: "“A questão é a seguinte: precificar é difícil.”",
      es: "“Aquí está la cosa: poner precios es difícil.”",
    },
  },
  {
    id: "faux_insight",
    category: "drama",
    name: { en: "Faux-insight setup", pt: "Falsa revelação", es: "Falsa revelación" },
    description: {
      en: "Frames an ordinary claim as secret knowledge (what nobody tells you, the part everyone misses).",
      pt: "Enquadra uma afirmação comum como conhecimento secreto (o que ninguém te conta, a parte que todos ignoram).",
      es: "Presenta una afirmación común como conocimiento secreto (lo que nadie te dice, la parte que todos pasan por alto).",
    },
    example: {
      en: "“Here's what nobody tells you about productivity: sleep matters.”",
      pt: "“O que ninguém te conta sobre produtividade: dormir importa.”",
      es: "“Lo que nadie te dice sobre la productividad: dormir importa.”",
    },
  },
  {
    id: "colon_reveal",
    category: "drama",
    name: { en: "Colon reveal", pt: "Revelação com dois-pontos", es: "Revelación con dos puntos" },
    description: {
      en: "A noun phrase, a colon, then a staged dramatic payoff — manufactured suspense in place of a plain sentence.",
      pt: "Um sintagma, dois-pontos e uma revelação teatral — suspense fabricado no lugar de uma frase direta.",
      es: "Un sintagma, dos puntos y una revelación teatral — suspenso fabricado en lugar de una frase directa.",
    },
    example: {
      en: "“The best part: it runs itself.”",
      pt: "“A melhor parte: ele roda sozinho.”",
      es: "“La mejor parte: funciona solo.”",
    },
  },
  {
    id: "rhetorical_setup",
    category: "drama",
    name: { en: "Rhetorical setup", pt: "Armação retórica", es: "Montaje retórico" },
    description: {
      en: "Stagey devices that talk at the reader: what if I told you, plot twist, self-answered questions.",
      pt: "Dispositivos teatrais que encenam para o leitor: e se eu te dissesse, plot twist, perguntas que o próprio texto responde.",
      es: "Recursos teatrales que actúan para el lector: qué pasaría si te dijera, plot twist, preguntas autorespondidas.",
    },
    example: {
      en: "“What if I told you one habit could change everything? Think about it.”",
      pt: "“E se eu te dissesse que um hábito pode mudar tudo? Pensa bem.”",
      es: "“¿Y si te dijera que un hábito puede cambiarlo todo? Piénsalo.”",
    },
  },
  {
    id: "fake_profound_kicker",
    category: "drama",
    name: { en: "Fake-profound kicker", pt: "Fecho pseudo-profundo", es: "Cierre pseudo-profundo" },
    description: {
      en: "Ends on a mic-drop aphorism or cute metaphor that restyles the point as wisdom instead of closing it.",
      pt: "Termina com um aforismo de efeito ou metáfora fofa que traveste o ponto de sabedoria em vez de concluí-lo.",
      es: "Termina con un aforismo de efecto o metáfora tierna que disfraza el punto de sabiduría en lugar de cerrarlo.",
    },
    example: {
      en: "“Because in the end, we aren't debugging code — we're debugging ourselves.”",
      pt: "“Porque, no fim, não estamos depurando código — estamos depurando a nós mesmos.”",
      es: "“Porque al final, no depuramos código — nos depuramos a nosotros mismos.”",
    },
  },
  {
    id: "binary_contrast",
    category: "structure",
    name: { en: "Binary contrast", pt: "Contraste binário", es: "Contraste binario" },
    description: {
      en: "The “it's not X, it's Y” template — negates a strawman to make Y sound profound instead of stating Y.",
      pt: "O molde “não é X, é Y” — nega um espantalho para Y soar profundo em vez de simplesmente afirmar Y.",
      es: "La plantilla “no es X, es Y” — niega un espantapájaros para que Y suene profundo en lugar de afirmar Y.",
    },
    example: {
      en: "“This isn't a tool. It's a philosophy.”",
      pt: "“Isso não é uma ferramenta. É uma filosofia.”",
      es: "“Esto no es una herramienta. Es una filosofía.”",
    },
  },
  {
    id: "negative_listing",
    category: "structure",
    name: { en: "Negative listing", pt: "Lista negativa", es: "Lista negativa" },
    description: {
      en: "Serial denials before the actual point: “Not A. Not B. C.”",
      pt: "Negações em série antes do ponto de fato: “Não é A. Não é B. É C.”",
      es: "Negaciones en serie antes del punto real: “No es A. No es B. Es C.”",
    },
    example: {
      en: "“Not a framework. Not a library. A way of thinking.”",
      pt: "“Não é um framework. Não é uma biblioteca. É um jeito de pensar.”",
      es: "“No es un framework. No es una librería. Es una forma de pensar.”",
    },
  },
  {
    id: "dramatic_fragmentation",
    category: "structure",
    name: { en: "Dramatic fragmentation", pt: "Fragmentação dramática", es: "Fragmentación dramática" },
    description: {
      en: "Stacked one-beat fragments for artificial punch: “That's it. That's the product.”",
      pt: "Fragmentos de uma batida empilhados para dar impacto artificial: “É isso. Esse é o produto.”",
      es: "Fragmentos de un golpe apilados para un impacto artificial: “Eso es. Ese es el producto.”",
    },
    example: {
      en: "“One click. Zero config. Pure speed. That's it.”",
      pt: "“Um clique. Zero configuração. Pura velocidade. É isso.”",
      es: "“Un clic. Cero configuración. Pura velocidad. Eso es.”",
    },
  },
  {
    id: "robotic_rhythm",
    category: "structure",
    name: { en: "Robotic rhythm", pt: "Ritmo robótico", es: "Ritmo robótico" },
    description: {
      en: "The same sentence or paragraph shape repeated until the prose reads templated.",
      pt: "A mesma forma de frase ou parágrafo repetida até a prosa soar de fôrma.",
      es: "La misma forma de oración o párrafo repetida hasta que la prosa suena de plantilla.",
    },
    example: {
      en: "“Great teams ship. Great teams learn. Great teams iterate.”",
      pt: "“Times bons entregam. Times bons aprendem. Times bons iteram.”",
      es: "“Los buenos equipos entregan. Los buenos equipos aprenden. Los buenos equipos iteran.”",
    },
  },
  {
    id: "importance_puffery",
    category: "substance",
    name: { en: "Importance puffery", pt: "Inflação de importância", es: "Inflación de importancia" },
    description: {
      en: "Grandiose framing that asserts significance instead of showing it (a testament to, pivotal moment, vital role).",
      pt: "Enquadramento grandioso que decreta relevância em vez de demonstrá-la (um testemunho de, momento crucial, papel vital).",
      es: "Encuadre grandioso que decreta relevancia en lugar de demostrarla (un testimonio de, momento crucial, papel vital).",
    },
    example: {
      en: "“The update stands as a testament to the team's unwavering commitment to excellence.”",
      pt: "“A atualização é um testemunho do compromisso inabalável do time com a excelência.”",
      es: "“La actualización es un testimonio del compromiso inquebrantable del equipo con la excelencia.”",
    },
  },
  {
    id: "weasel_attribution",
    category: "substance",
    name: { en: "Weasel attribution", pt: "Atribuição evasiva", es: "Atribución evasiva" },
    description: {
      en: "Sourceless authority: experts agree, studies show, many argue — with no named expert, study, or arguer.",
      pt: "Autoridade sem fonte: especialistas concordam, estudos mostram, muitos argumentam — sem nomear especialista, estudo ou quem argumenta.",
      es: "Autoridad sin fuente: los expertos coinciden, los estudios muestran, muchos sostienen — sin nombrar experto, estudio ni quién sostiene.",
    },
    example: {
      en: "“Experts agree that remote work is here to stay.”",
      pt: "“Especialistas concordam que o trabalho remoto veio para ficar.”",
      es: "“Los expertos coinciden en que el trabajo remoto llegó para quedarse.”",
    },
  },
  {
    id: "superficial_analysis",
    category: "substance",
    name: { en: "Superficial analysis", pt: "Análise superficial", es: "Análisis superficial" },
    description: {
      en: "Trailing “-ing” clauses that pose as analysis (highlighting, underscoring, showcasing) without explaining anything.",
      pt: "Orações finais de gerúndio que fingem análise (destacando, ressaltando, evidenciando) sem explicar nada.",
      es: "Cláusulas finales de gerundio que fingen análisis (destacando, subrayando, evidenciando) sin explicar nada.",
    },
    example: {
      en: "“The company opened a new office, underscoring its commitment to growth.”",
      pt: "“A empresa abriu um novo escritório, ressaltando seu compromisso com o crescimento.”",
      es: "“La empresa abrió una nueva oficina, subrayando su compromiso con el crecimiento.”",
    },
  },
  {
    id: "vague_abstraction",
    category: "substance",
    name: { en: "Vague abstraction", pt: "Abstração vaga", es: "Abstracción vaga" },
    description: {
      en: "Benefit talk with no numbers, names, or mechanism — “improves efficiency” with nothing to check.",
      pt: "Discurso de benefício sem números, nomes ou mecanismo — “melhora a eficiência” sem nada verificável.",
      es: "Discurso de beneficio sin números, nombres ni mecanismo — “mejora la eficiencia” sin nada verificable.",
    },
    example: {
      en: "“The integration significantly improves productivity across the organization.”",
      pt: "“A integração melhora significativamente a produtividade em toda a organização.”",
      es: "“La integración mejora significativamente la productividad en toda la organización.”",
    },
  },
  {
    id: "synonym_cycling",
    category: "substance",
    name: { en: "Synonym cycling", pt: "Rodízio de sinônimos", es: "Rotación de sinónimos" },
    description: {
      en: "Rotates names for the same thing (the tool, the platform, the solution) for variety, at the cost of clarity.",
      pt: "Reveza nomes para a mesma coisa (a ferramenta, a plataforma, a solução) por variedade, ao custo da clareza.",
      es: "Rota nombres para la misma cosa (la herramienta, la plataforma, la solución) por variedad, a costa de la claridad.",
    },
    example: {
      en: "“The tool scans your draft. The platform scores it. The solution suggests fixes.”",
      pt: "“A ferramenta escaneia o rascunho. A plataforma dá a nota. A solução sugere correções.”",
      es: "“La herramienta escanea el borrador. La plataforma lo puntúa. La solución sugiere arreglos.”",
    },
  },
  {
    id: "summary_recap_ending",
    category: "format",
    name: { en: "Summary-recap ending", pt: "Fecho de resumo", es: "Cierre de resumen" },
    description: {
      en: "A final paragraph that restates what the reader just read (in conclusion, ultimately, overall).",
      pt: "Um parágrafo final que repete o que o leitor acabou de ler (em conclusão, em última análise, no geral).",
      es: "Un párrafo final que repite lo que el lector acaba de leer (en conclusión, en última instancia, en general).",
    },
    example: {
      en: "“In conclusion, as we have seen, communication, trust and planning are all essential.”",
      pt: "“Em conclusão, como vimos, comunicação, confiança e planejamento são essenciais.”",
      es: "“En conclusión, como hemos visto, la comunicación, la confianza y la planificación son esenciales.”",
    },
  },
  {
    id: "em_dash_overuse",
    category: "format",
    name: { en: "Em-dash overuse", pt: "Excesso de travessões", es: "Exceso de rayas" },
    description: {
      en: "Em dashes as the default rhythm — clause after clause — where commas, periods, or parentheses would read cleaner.",
      pt: "Travessões como ritmo padrão — oração após oração — onde vírgulas, pontos ou parênteses leriam melhor.",
      es: "Rayas como ritmo por defecto — cláusula tras cláusula — donde comas, puntos o paréntesis leerían mejor.",
    },
    example: {
      en: "“The launch — which surprised everyone — went well — better than expected — honestly.”",
      pt: "“O lançamento — que surpreendeu a todos — foi bem — melhor que o esperado — sinceramente.”",
      es: "“El lanzamiento — que sorprendió a todos — salió bien — mejor de lo esperado — sinceramente.”",
    },
  },
];

export const SLOP_PATTERNS: SlopDef[] = SLOP_RAW.map((p, i) => ({
  ...p,
  color: COLORS[i % COLORS.length],
}));

export const SLOP_IDS = SLOP_PATTERNS.map((p) => p.id);
export const SLOP_BY_ID = Object.fromEntries(SLOP_PATTERNS.map((p) => [p.id, p]));

export const SLOP_CATEGORY_LABELS: Record<SlopDef["category"], Record<Lang, string>> = {
  wording: {
    en: "Wording",
    pt: "Vocabulário",
    es: "Vocabulario",
  },
  drama: {
    en: "Manufactured drama",
    pt: "Drama fabricado",
    es: "Drama fabricado",
  },
  structure: {
    en: "Templated structure",
    pt: "Estrutura de fôrma",
    es: "Estructura de plantilla",
  },
  substance: {
    en: "Hollow substance",
    pt: "Substância oca",
    es: "Sustancia hueca",
  },
  format: {
    en: "Format tics",
    pt: "Cacoetes de formato",
    es: "Tics de formato",
  },
};
