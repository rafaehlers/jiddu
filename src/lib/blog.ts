import type { Lang } from "@/lib/fallacies";

type Localized<T> = Record<Lang, T>;

export type BlogTagTranslation = {
  label: string;
  description: string;
};

export type BlogTag = {
  slug: string;
  translations: Localized<BlogTagTranslation>;
};

export type BlogFaq = {
  question: string;
  answer: string;
};

export type BlogPostTranslation = {
  title: string;
  seoTitle: string;
  description: string;
  excerpt: string;
  readingTime: string;
  imageAlt: string;
  imageCaption: string;
  body: string;
  faq: BlogFaq[];
};

export type BlogPost = {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  tags: string[];
  image: {
    src: string;
    width: number;
    height: number;
  };
  translations: Localized<BlogPostTranslation>;
};

type BlogCopy = {
  name: string;
  description: string;
  tagsTitle: string;
  tagsAriaLabel: string;
  postSingular: string;
  postPlural: string;
  readArticle: string;
  articleBreadcrumb: string;
  by: string;
  faqTitle: string;
  allArticles: string;
  tagEyebrow: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaLabel: string;
};

export const BLOG_COPY: Localized<BlogCopy> = {
  en: {
    name: "Jiddu Blog",
    description:
      "Critical reading, academic research, and artificial intelligence explained with clear methods, limits, and practical examples.",
    tagsTitle: "Tags",
    tagsAriaLabel: "Blog tags",
    postSingular: "post",
    postPlural: "posts",
    readArticle: "Read article",
    articleBreadcrumb: "Article",
    by: "By",
    faqTitle: "Frequently asked questions",
    allArticles: "All articles",
    tagEyebrow: "Tag",
    ctaTitle: "Put your paper under pressure",
    ctaDescription:
      "Upload the complete PDF, choose the target venue, and receive a localized review before submission.",
    ctaLabel: "Start an adversarial review",
  },
  pt: {
    name: "Blog Jiddu",
    description:
      "Leitura crítica, pesquisa acadêmica e inteligência artificial explicadas com método, limites claros e exemplos práticos.",
    tagsTitle: "Tags",
    tagsAriaLabel: "Tags do blog",
    postSingular: "post",
    postPlural: "posts",
    readArticle: "Ler artigo",
    articleBreadcrumb: "Artigo",
    by: "Por",
    faqTitle: "Perguntas frequentes",
    allArticles: "Todos os artigos",
    tagEyebrow: "Tag",
    ctaTitle: "Coloque seu paper sob pressão",
    ctaDescription:
      "Envie o PDF completo, escolha a venue e receba uma revisão localizada antes da submissão.",
    ctaLabel: "Iniciar revisão adversarial",
  },
  es: {
    name: "Blog Jiddu",
    description:
      "Lectura crítica, investigación académica e inteligencia artificial explicadas con método, límites claros y ejemplos prácticos.",
    tagsTitle: "Etiquetas",
    tagsAriaLabel: "Etiquetas del blog",
    postSingular: "artículo",
    postPlural: "artículos",
    readArticle: "Leer artículo",
    articleBreadcrumb: "Artículo",
    by: "Por",
    faqTitle: "Preguntas frecuentes",
    allArticles: "Todos los artículos",
    tagEyebrow: "Etiqueta",
    ctaTitle: "Pon tu paper bajo presión",
    ctaDescription:
      "Envía el PDF completo, elige la venue y recibe una revisión localizada antes de la presentación.",
    ctaLabel: "Iniciar revisión adversarial",
  },
};

export const blogTags: BlogTag[] = [
  {
    slug: "adversarial-review",
    translations: {
      en: {
        label: "Adversarial review",
        description:
          "Methods for testing arguments, evidence, and papers before publication.",
      },
      pt: {
        label: "Adversarial review",
        description:
          "Métodos para testar argumentos, evidências e papers antes da publicação.",
      },
      es: {
        label: "Adversarial review",
        description:
          "Métodos para poner a prueba argumentos, evidencias y papers antes de su publicación.",
      },
    },
  },
  {
    slug: "academic-research",
    translations: {
      en: {
        label: "Academic research",
        description:
          "Tools and practices for making research clearer, verifiable, and more robust.",
      },
      pt: {
        label: "Academic research",
        description:
          "Ferramentas e práticas para tornar a pesquisa mais clara, verificável e robusta.",
      },
      es: {
        label: "Academic research",
        description:
          "Herramientas y prácticas para hacer que la investigación sea más clara, verificable y robusta.",
      },
    },
  },
  {
    slug: "responsible-ai",
    translations: {
      en: {
        label: "Responsible AI",
        description:
          "Using artificial intelligence with transparency, oversight, and explicit limits.",
      },
      pt: {
        label: "Responsible AI",
        description:
          "Uso de inteligência artificial com transparência, supervisão e limites explícitos.",
      },
      es: {
        label: "Responsible AI",
        description:
          "Uso de inteligencia artificial con transparencia, supervisión y límites explícitos.",
      },
    },
  },
];

const posts: BlogPost[] = [
  {
    slug: "what-is-adversarial-review",
    publishedAt: "2026-08-02",
    updatedAt: "2026-08-02",
    author: "Jiddu",
    tags: ["adversarial-review", "academic-research", "responsible-ai"],
    image: {
      src: "/blog/adversarial-review-jiddu.jpg",
      width: 1536,
      height: 806,
    },
    translations: {
      en: {
        title:
          "What is adversarial review — and how it strengthens a paper before submission",
        seoTitle: "What is adversarial review? How Jiddu analyzes papers",
        description:
          "Learn what adversarial review is, why it reduces blind spots in papers, and how Jiddu turns the idea into an auditable analysis.",
        excerpt:
          "A deliberately skeptical reading can find blind spots before reviewers do. Learn why adversarial review exists and how it works in Jiddu.",
        readingTime: "4 min read",
        imageAlt:
          "Academic manuscript examined from two opposing perspectives, with charts and weaknesses marked",
        imageCaption:
          "A good critique does not look for a winner; it looks for the point where the argument needs to become stronger.",
        body: `An **adversarial review** is a deliberately skeptical reading of a piece of work. Instead of merely summarizing what the author intended, it looks for the strongest objections: where the evidence does not support the conclusion, which premise remained implicit, what comparison is missing, and what could invalidate the result.

It does not begin with the assumption that the author is wrong. It begins with the idea that an important argument should survive difficult questions before it is published.

> In one sentence: adversarial review tests a paper against the best available criticism while there is still time to improve it.

## Why does adversarial review exist?

Authors know their own intentions so well that they can stop seeing gaps that are obvious to an outside reader. Familiarity creates blind spots: a definition feels self-evident, a methodological choice feels inevitable, or an important limitation becomes diluted in the text.

Adversarial review creates critical distance. It helps to:

- separate central claims from the evidence that actually supports them;
- locate contradictions, missing controls, and conclusions that go beyond the data;
- anticipate reviewer questions and venue-specific criteria;
- turn a vague objection into a verifiable problem with a page and section.

The goal is not to “defeat” the paper. It is to make it more resistant to alternative interpretations, avoidable errors, and criticism that could have been addressed before submission.

## What we built in Jiddu

In Jiddu, adversarial review is a pre-submission workflow for a complete PDF. The implementation adapts the **SPECS** dimensions — Story, Presentation, Evaluations, Correctness, and Significance — and the staged synthesis and self-critique pattern described in [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu is an independent implementation with its own pipeline and safeguards.

In practice, the system:

1. reads the entire manuscript and builds a page-linked ledger of claims and evidence;
2. examines story, presentation, evaluations, correctness, and significance separately;
3. researches published literature by technical concepts and calibrates the analysis against the selected venue's criteria;
4. recomputes allowed arithmetic checks without executing code submitted with the manuscript;
5. submits the first synthesis to a second critic and uses a retention gate so substantive findings are not lost in the final summary.

The result organizes strengths, weaknesses, questions, reproducibility, and a recommendation. Every substantive weakness must include a manuscript location and a severity — **MAJOR**, **MODERATE**, or **MINOR** — so the author can move from “something feels wrong here” to a concrete action.

## What it does not do

Jiddu's review is still automated. It can miss problems, misread a passage, or make an inappropriate comparison. It also does not verify code execution or predict a conference decision.

Adversarial review therefore does not replace coauthors, domain experts, peer review, or human judgment. It works as an additional layer of critical pressure, early enough for the paper to still change.

You can [start an adversarial review](/review) or read [Jiddu's complete methodology](/how-it-works).`,
        faq: [
          {
            question: "Does adversarial review replace peer review?",
            answer:
              "No. It is a pre-submission step for finding and correcting weaknesses before human evaluation. Scientific and editorial decisions remain with experts and venues.",
          },
          {
            question: "When is the best time to review a paper?",
            answer:
              "When the manuscript is complete enough to be read as a submission, but there is still time to rerun analyses, clarify assumptions, and rewrite sections.",
          },
          {
            question: "Does Jiddu execute the manuscript's code?",
            answer:
              "No. Jiddu can recompute allowed arithmetic operations such as means, rates, and percentage changes, but it never executes code submitted with the paper.",
          },
        ],
      },
      pt: {
        title:
          "O que é revisão adversarial — e como ela fortalece um paper antes da submissão",
        seoTitle: "O que é revisão adversarial? Como o Jiddu analisa papers",
        description:
          "Entenda o que é revisão adversarial, por que ela reduz pontos cegos em papers e como o Jiddu transforma essa ideia em uma análise auditável.",
        excerpt:
          "Uma leitura deliberadamente cética pode encontrar pontos cegos antes que eles cheguem aos revisores. Veja por que ela existe e como funciona no Jiddu.",
        readingTime: "4 min de leitura",
        imageAlt:
          "Manuscrito acadêmico examinado por duas perspectivas opostas, com gráficos e fragilidades marcadas",
        imageCaption:
          "Uma boa crítica não procura um vencedor: procura o ponto em que o argumento precisa ficar mais forte.",
        body: `Uma **revisão adversarial** é uma leitura deliberadamente cética de um trabalho. Em vez de apenas resumir o que o autor quis dizer, ela procura as objeções mais fortes: onde a evidência não sustenta a conclusão, qual premissa ficou implícita, que comparação está faltando e o que poderia invalidar o resultado.

Ela não parte da ideia de que o autor está errado. Parte da ideia de que um argumento importante deve sobreviver a perguntas difíceis antes de ser publicado.

> Em uma frase: revisão adversarial é testar um paper contra a melhor crítica disponível, enquanto ainda há tempo para melhorá-lo.

## Por que a revisão adversarial existe?

Quem escreve um paper conhece tão bem sua própria intenção que pode deixar de enxergar lacunas visíveis para um leitor externo. Familiaridade cria pontos cegos: uma definição parece óbvia, uma escolha metodológica parece inevitável ou uma limitação importante acaba diluída no texto.

A revisão adversarial cria distância crítica. Ela ajuda a:

- separar afirmações centrais das evidências que realmente as sustentam;
- localizar contradições, controles ausentes e conclusões mais fortes que os dados;
- antecipar perguntas de revisores e critérios específicos da venue;
- transformar uma objeção genérica em um problema verificável, com página e seção.

O objetivo não é “derrotar” o paper. É torná-lo mais resistente a interpretações alternativas, erros evitáveis e críticas que poderiam ter sido respondidas antes da submissão.

## O que implementamos no Jiddu

No Jiddu, a revisão adversarial é um fluxo de pré-submissão para um PDF completo. A implementação adapta as dimensões **SPECS** — Story, Presentation, Evaluations, Correctness e Significance — e o padrão de síntese seguido de autocrítica descrito no [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). O Jiddu é uma implementação independente, com seu próprio pipeline e suas próprias salvaguardas.

Na prática, o sistema:

1. lê o manuscrito inteiro e cria um ledger de afirmações e evidências ligado às páginas;
2. examina separadamente narrativa, apresentação, avaliações, correção e significância;
3. pesquisa literatura publicada por conceitos técnicos e calibra a análise pelos critérios da venue escolhida;
4. refaz verificações aritméticas permitidas sem executar código enviado pelo manuscrito;
5. submete a primeira síntese a um segundo crítico e usa um gate de retenção para não perder achados substantivos no resumo final.

O resultado organiza pontos fortes, fraquezas, perguntas, reprodutibilidade e recomendação. Cada fraqueza substantiva precisa trazer uma localização no manuscrito e uma severidade — **MAJOR**, **MODERATE** ou **MINOR** — para que o autor possa sair de “há algo estranho aqui” e chegar a uma ação concreta.

## O que ela não faz

A revisão do Jiddu continua sendo automatizada. Ela pode perder problemas, interpretar mal uma passagem ou fazer uma comparação inadequada. Também não verifica a execução do código nem prevê a decisão de uma conferência.

Por isso, revisão adversarial não substitui coautores, especialistas, revisão por pares ou julgamento humano. Ela funciona como uma camada adicional de pressão crítica: cedo o bastante para que o paper ainda possa mudar.

Você pode [iniciar uma revisão adversarial](/review) ou consultar [a metodologia completa do Jiddu](/how-it-works).`,
        faq: [
          {
            question: "Revisão adversarial substitui a revisão por pares?",
            answer:
              "Não. Ela é uma etapa de pré-submissão para encontrar e corrigir fragilidades antes da avaliação humana. A decisão científica e editorial continua com especialistas e venues.",
          },
          {
            question: "Qual é o melhor momento para revisar um paper?",
            answer:
              "Quando o manuscrito já está completo o bastante para ser lido como uma submissão, mas ainda existe tempo para refazer análises, esclarecer premissas e reescrever seções.",
          },
          {
            question: "O Jiddu executa o código do manuscrito?",
            answer:
              "Não. O Jiddu pode recalcular operações aritméticas permitidas, como médias, taxas e variações percentuais, mas nunca executa código enviado pelo paper.",
          },
        ],
      },
      es: {
        title:
          "Qué es la revisión adversarial — y cómo fortalece un paper antes de enviarlo",
        seoTitle: "¿Qué es la revisión adversarial? Cómo analiza papers Jiddu",
        description:
          "Descubre qué es la revisión adversarial, por qué reduce los puntos ciegos de un paper y cómo Jiddu convierte la idea en un análisis auditable.",
        excerpt:
          "Una lectura deliberadamente escéptica puede encontrar puntos ciegos antes que los revisores. Descubre por qué existe y cómo funciona en Jiddu.",
        readingTime: "4 min de lectura",
        imageAlt:
          "Manuscrito académico examinado desde dos perspectivas opuestas, con gráficos y debilidades señaladas",
        imageCaption:
          "Una buena crítica no busca un ganador: busca el punto en el que el argumento necesita fortalecerse.",
        body: `Una **revisión adversarial** es una lectura deliberadamente escéptica de un trabajo. En lugar de limitarse a resumir lo que el autor quiso decir, busca las objeciones más fuertes: dónde la evidencia no sostiene la conclusión, qué premisa quedó implícita, qué comparación falta y qué podría invalidar el resultado.

No parte de la idea de que el autor está equivocado. Parte de la idea de que un argumento importante debe sobrevivir a preguntas difíciles antes de publicarse.

> En una frase: la revisión adversarial pone a prueba un paper frente a la mejor crítica disponible mientras todavía hay tiempo para mejorarlo.

## ¿Por qué existe la revisión adversarial?

Quien escribe un paper conoce tan bien su propia intención que puede dejar de ver lagunas evidentes para un lector externo. La familiaridad crea puntos ciegos: una definición parece obvia, una decisión metodológica parece inevitable o una limitación importante acaba diluida en el texto.

La revisión adversarial crea distancia crítica. Ayuda a:

- separar las afirmaciones centrales de la evidencia que realmente las sostiene;
- localizar contradicciones, controles ausentes y conclusiones que van más allá de los datos;
- anticipar preguntas de revisores y criterios específicos de la venue;
- convertir una objeción vaga en un problema verificable, con página y sección.

El objetivo no es “derrotar” al paper. Es hacerlo más resistente a interpretaciones alternativas, errores evitables y críticas que podrían haberse respondido antes del envío.

## Lo que implementamos en Jiddu

En Jiddu, la revisión adversarial es un flujo de trabajo previo al envío para un PDF completo. La implementación adapta las dimensiones **SPECS** — Story, Presentation, Evaluations, Correctness y Significance — y el patrón de síntesis seguido de autocrítica descrito en [AI-Assisted Peer Review at Scale: The AAAI-26 AI Review Pilot](https://arxiv.org/abs/2604.13940). Jiddu es una implementación independiente, con su propio pipeline y sus propias salvaguardas.

En la práctica, el sistema:

1. lee el manuscrito completo y crea un ledger de afirmaciones y evidencias vinculado a las páginas;
2. examina por separado narrativa, presentación, evaluaciones, corrección y significancia;
3. investiga literatura publicada por conceptos técnicos y calibra el análisis según los criterios de la venue elegida;
4. recalcula verificaciones aritméticas permitidas sin ejecutar código enviado con el manuscrito;
5. somete la primera síntesis a un segundo crítico y utiliza un gate de retención para no perder hallazgos sustantivos en el resumen final.

El resultado organiza fortalezas, debilidades, preguntas, reproducibilidad y una recomendación. Cada debilidad sustantiva debe incluir una ubicación en el manuscrito y una severidad — **MAJOR**, **MODERATE** o **MINOR** — para que el autor pueda pasar de “aquí hay algo extraño” a una acción concreta.

## Lo que no hace

La revisión de Jiddu sigue siendo automatizada. Puede pasar por alto problemas, interpretar mal un pasaje o hacer una comparación inadecuada. Tampoco verifica la ejecución del código ni predice la decisión de una conferencia.

Por eso, la revisión adversarial no sustituye a coautores, especialistas, revisión por pares ni juicio humano. Funciona como una capa adicional de presión crítica, lo bastante temprano para que el paper todavía pueda cambiar.

Puedes [iniciar una revisión adversarial](/review) o consultar [la metodología completa de Jiddu](/how-it-works).`,
        faq: [
          {
            question: "¿La revisión adversarial sustituye a la revisión por pares?",
            answer:
              "No. Es una etapa previa al envío para encontrar y corregir debilidades antes de la evaluación humana. Las decisiones científicas y editoriales siguen en manos de especialistas y venues.",
          },
          {
            question: "¿Cuál es el mejor momento para revisar un paper?",
            answer:
              "Cuando el manuscrito está lo bastante completo para leerse como un envío, pero aún queda tiempo para rehacer análisis, aclarar premisas y reescribir secciones.",
          },
          {
            question: "¿Jiddu ejecuta el código del manuscrito?",
            answer:
              "No. Jiddu puede recalcular operaciones aritméticas permitidas, como medias, tasas y variaciones porcentuales, pero nunca ejecuta código enviado con el paper.",
          },
        ],
      },
    },
  },
];

export const blogPosts = [...posts].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt),
);

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPostTranslation(
  post: BlogPost,
  lang: Lang,
): BlogPostTranslation {
  return post.translations[lang];
}

export function getBlogTag(slug: string): BlogTag | undefined {
  return blogTags.find((tag) => tag.slug === slug);
}

export function getBlogTagTranslation(
  tag: BlogTag,
  lang: Lang,
): BlogTagTranslation {
  return tag.translations[lang];
}

export function getBlogPostsByTag(tagSlug: string): BlogPost[] {
  return blogPosts.filter((post) => post.tags.includes(tagSlug));
}

export function blogLanguageTag(lang: Lang): string {
  if (lang === "pt") return "pt-BR";
  return lang;
}

export function formatBlogDate(date: string, lang: Lang): string {
  const locale = lang === "pt" ? "pt-BR" : lang === "es" ? "es" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}
