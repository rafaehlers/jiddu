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
  thumbnailAlt?: string;
  imageCaption: string;
  imageOpenLabel?: string;
  body: string;
  faq?: BlogFaq[];
  cta?: {
    title: string;
    description: string;
    label: string;
  };
};

export type BlogPost = {
  slug: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  authorType?: "Organization" | "Person";
  authorUrl?: string;
  tags: string[];
  image: {
    src: string;
    width: number;
    height: number;
    type?: string;
    full?: {
      src: string;
      width: number;
      height: number;
      type?: string;
    };
  };
  thumbnail?: {
    src: string;
    width: number;
    height: number;
    type?: string;
  };
  citations?: string[];
  ctaHref?: string;
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
      "Critical reading, live intelligence, academic research, and artificial intelligence explained with clear methods, limits, and practical examples.",
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
      "Leitura crítica, inteligência ao vivo, pesquisa acadêmica e inteligência artificial explicadas com método, limites claros e exemplos práticos.",
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
      "Lectura crítica, inteligencia en vivo, investigación académica e inteligencia artificial explicadas con método, límites claros y ejemplos prácticos.",
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
    slug: "logical-fallacies",
    translations: {
      en: {
        label: "Logical fallacies",
        description:
          "Patterns of faulty reasoning and practical ways to recognize them in everyday arguments.",
      },
      pt: {
        label: "Falácias lógicas",
        description:
          "Padrões de raciocínio falho e formas práticas de reconhecê-los em argumentos cotidianos.",
      },
      es: {
        label: "Falacias lógicas",
        description:
          "Patrones de razonamiento defectuoso y formas prácticas de reconocerlos en argumentos cotidianos.",
      },
    },
  },
  {
    slug: "philosophy",
    translations: {
      en: {
        label: "Philosophy",
        description:
          "Ideas about truth, knowledge, language, perception, and critical inquiry.",
      },
      pt: {
        label: "Filosofia",
        description:
          "Ideias sobre verdade, conhecimento, linguagem, percepção e investigação crítica.",
      },
      es: {
        label: "Filosofía",
        description:
          "Ideas sobre verdad, conocimiento, lenguaje, percepción e investigación crítica.",
      },
    },
  },
  {
    slug: "critical-reading",
    translations: {
      en: {
        label: "Critical reading",
        description:
          "Methods for examining claims, arguments, language, evidence, and perspective.",
      },
      pt: {
        label: "Leitura crítica",
        description:
          "Métodos para examinar afirmações, argumentos, linguagem, evidências e perspectivas.",
      },
      es: {
        label: "Lectura crítica",
        description:
          "Métodos para examinar afirmaciones, argumentos, lenguaje, evidencias y perspectivas.",
      },
    },
  },
  {
    slug: "live-intelligence",
    translations: {
      en: {
        label: "Live intelligence",
        description:
          "Tools for understanding conversations, claims, people, and sources as they develop.",
      },
      pt: {
        label: "Inteligência ao vivo",
        description:
          "Ferramentas para compreender conversas, afirmações, pessoas e fontes enquanto elas se desenvolvem.",
      },
      es: {
        label: "Inteligencia en vivo",
        description:
          "Herramientas para comprender conversaciones, afirmaciones, personas y fuentes mientras se desarrollan.",
      },
    },
  },
  {
    slug: "elections",
    translations: {
      en: {
        label: "Elections",
        description:
          "Methods and tools for following campaign interviews, debates, and public claims.",
      },
      pt: {
        label: "Eleições",
        description:
          "Métodos e ferramentas para acompanhar entrevistas, debates e afirmações públicas de campanha.",
      },
      es: {
        label: "Elecciones",
        description:
          "Métodos y herramientas para seguir entrevistas, debates y afirmaciones públicas de campaña.",
      },
    },
  },
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
    slug: "lula-flavio-campaign-speeches-fallacies",
    publishedAt: "2026-08-20",
    updatedAt: "2026-08-20",
    author: "Rafael M. Ehlers",
    authorType: "Person",
    authorUrl: "https://rafaelmehlers.com.br",
    tags: [
      "elections",
      "logical-fallacies",
      "critical-reading",
      "responsible-ai",
    ],
    image: {
      src: "/blog/lula-flavio-campaign-fallacies-lenses.png",
      width: 1727,
      height: 910,
      type: "image/png",
    },
    citations: [
      "https://jiddu.app/context/5BvqeTuHoc",
      "https://jiddu.app/context/NPs4zsq_0b",
      "https://jiddu.app/how-it-works",
      "https://apnews.com/article/brazil-lula-flavio-bolsonaro-campaign-opens-8f4ad67b107cb05736f450f67198b190",
    ],
    ctaHref: "/context",
    translations: {
      en: {
        title:
          "69 minutes of campaigning: what the fallacies in Lula and Flávio Bolsonaro’s speeches reveal",
        seoTitle:
          "Lula vs. Flávio: fallacies in their first 2026 campaign speeches",
        description:
          "Jiddu analyzed the first 2026 campaign speeches by Lula and Flávio Bolsonaro. Compare fallacy density, severity, loaded language, and the limits of automated analysis.",
        excerpt:
          "Across 69 minutes of campaign speech, Jiddu detected 53 possible fallacies in Lula’s address and 95 in Flávio Bolsonaro’s. The difference grew after adjusting for speech length and severity.",
        readingTime: "7 min read",
        imageAlt:
          "A smaller red optical lens with a sparse reasoning network beside a larger blue and green lens with a denser network",
        imageCaption:
          "The red lens represents Lula’s 11.1 detected fallacies per thousand words; the denser blue and green lens represents Flávio Bolsonaro’s 28.6.",
        body: `My vote is for Lula. I am stating that preference before the numbers because it affects what I notice and what I consider important.

On August 16, 2026, President Luiz Inácio Lula da Silva and Senator Flávio Bolsonaro opened their campaigns in political strongholds. Lula spoke at Vila Euclides Stadium in São Bernardo do Campo. Flávio addressed supporters on Copacabana Beach in Rio de Janeiro. The [Associated Press described them as Brazil’s two main presidential candidates](https://apnews.com/article/brazil-lula-flavio-bolsonaro-campaign-opens-8f4ad67b107cb05736f450f67198b190).

I captured both speeches with Jiddu Context and compared the complete transcripts. Together they contained **69 minutes and 15 seconds of speech, 8,084 words, and 597 sentences**.

The fallacy analysis produced the clearest difference between the two addresses.

## The central figures

In Lula’s 36-minute speech, Jiddu detected:

- **53 possible fallacies**;
- **11.1 findings per thousand words**;
- **4 high-severity findings**;
- **8 instances of [loaded language](/fallacies#loaded_language)**.

In Flávio Bolsonaro’s 32-minute speech, it detected:

- **95 possible fallacies**;
- **28.6 findings per thousand words**;
- **40 high-severity findings**;
- **30 instances of [loaded language](/fallacies#loaded_language)**.

Flávio’s speech was shorter and still produced 42 more findings. After adjusting for the number of words, its fallacy density was **2.6 times higher**. The gap in high-severity findings was tenfold.

## What the detector found

[Loaded language](/fallacies#loaded_language) was the most frequent pattern in Flávio’s speech, with 30 occurrences. [Non sequitur](/fallacies#non_sequitur) appeared 14 times, [hasty generalization](/fallacies#hasty_generalization) 10 times, [appeal to emotion](/fallacies#appeal_to_emotion) 9 times, [scapegoating](/fallacies#scapegoating) 6 times, and [false dichotomy](/fallacies#false_dichotomy) 5 times.

In Lula’s speech, [non sequitur](/fallacies#non_sequitur) led with 12 findings. [Loaded language](/fallacies#loaded_language) appeared 8 times, [hasty generalization](/fallacies#hasty_generalization) 6 times, and [appeal to emotion](/fallacies#appeal_to_emotion) 5 times. Most of Lula’s findings were classified as low severity; Flávio’s result was split much more heavily toward high severity.

A fallacy label does not mean that a sentence is false. It identifies a possible failure in the path from reasons to conclusion. A candidate can use a bad argument to defend a true proposition, just as a polished argument can begin with a false premise. Fact-checking and fallacy detection answer different questions.

## Two ways of building a campaign speech

The difference also appears in the kinds of claims extracted from each transcript. Numbers and dates accounted for 33.2% of Lula’s claims and 17.4% of Flávio’s. Categorical and causal claims made up 74.2% of Flávio’s claims, compared with 55.9% of Lula’s.

Lula built much of his speech around personal history, the labor movement, education programs, and comparisons between governments. Flávio relied more on conflict, public safety, blame directed at the current government, economic anxiety, and promises of decisive action.

Both speeches were classified as explicitly partisan with 99% confidence. That is unsurprising at campaign rallies. The useful comparison lies in how each candidate tried to persuade an audience already inclined to applaud.

## Why this weighs on my vote

I already intended to vote for Lula. These results reinforce one reason for that choice: in these two speeches, his argument depended less on reasoning shortcuts, especially the severe ones.

Political speech will always use emotion, repetition, symbols, and selective emphasis. Those devices are part of persuasion. I become concerned when fear, false choices, broad accusations, or an unsupported causal leap carry more weight than the reasons offered to the voter.

A president needs to defend decisions outside a friendly rally. Arguments eventually face Congress, the press, courts, public data, and people who do not share the speaker’s assumptions. A speech with fewer reasoning failures does not guarantee a better government. It does give the audience more material to examine.

## What these figures do not prove

Jiddu’s analysis is automated. The detector compares passages with a closed catalog of fallacies, keeps the original excerpt, and explains why it applied a label. It can still misread irony, omit context, split a sentence badly, or treat campaign shorthand too literally. Jiddu has [not published a human-labeled accuracy benchmark for the fallacy detector](https://jiddu.app/how-it-works#4-fallacy-detector), so every finding remains open to human review.

I also chose not to turn the fact-check verdicts from these sessions into a truthfulness ranking. Some extracted claims still confuse verification of the underlying proposition with confirmation that the candidate pronounced the words. A political comparison should not hide that limitation merely because the current result favors my candidate.

The numbers describe these two speeches, not the candidates’ entire careers or every future campaign appearance. Repeating the analysis across debates, interviews, and new rallies will show whether the difference persists.

## Examine the passages yourself

The complete sessions remain public. Each finding links to the part of the transcript that prompted it, so readers can agree, disagree, or report a classification that looks wrong.

- [Open Lula’s complete analysis](https://jiddu.app/context/5BvqeTuHoc)
- [Open Flávio Bolsonaro’s complete analysis](https://jiddu.app/context/NPs4zsq_0b)

I plan to repeat this comparison during the campaign. The next useful result will come from applying the same method to more speeches and publishing the passages behind every number.`,
        faq: [
          {
            question: "Does a fallacy mean that a candidate lied?",
            answer:
              "No. A fallacy concerns the reasoning that connects premises to a conclusion. Truthfulness requires a separate review of the underlying factual claim and its evidence.",
          },
          {
            question: "Why compare findings per thousand words?",
            answer:
              "The speeches had different lengths. Normalizing by word count makes the density of detected reasoning problems more comparable than raw totals alone.",
          },
          {
            question: "Did Jiddu choose a candidate?",
            answer:
              "No. Jiddu labeled passages under the same fallacy catalog. The author’s support for Lula is disclosed, and readers can inspect the transcripts and challenge individual findings.",
          },
        ],
        cta: {
          title: "Analyze the next campaign speech",
          description:
            "Capture a debate, interview, or rally with Jiddu Context and keep the transcript, claims, fallacies, and sources together for review.",
          label: "Open Jiddu Context",
        },
      },
      pt: {
        title:
          "69 minutos de campanha: o que as falácias nos discursos de Lula e Flávio Bolsonaro revelam",
        seoTitle:
          "Lula x Flávio: falácias nos primeiros discursos de 2026",
        description:
          "O Jiddu analisou os primeiros discursos de campanha de Lula e Flávio Bolsonaro em 2026. Compare densidade, gravidade, linguagem carregada e os limites da análise automatizada.",
        excerpt:
          "Em 69 minutos de campanha, o Jiddu detectou 53 possíveis falácias no discurso de Lula e 95 no de Flávio Bolsonaro. A diferença cresceu quando ajustada pelo tamanho e pela gravidade.",
        readingTime: "7 min de leitura",
        imageAlt:
          "Uma lente óptica vermelha menor com uma rede de raciocínio esparsa ao lado de uma lente azul e verde maior com uma rede mais densa",
        imageCaption:
          "A lente vermelha representa os 11,1 achados por mil palavras de Lula; a lente azul e verde, mais densa, representa os 28,6 de Flávio Bolsonaro.",
        body: `Meu voto é Lula. Declaro essa preferência antes dos números porque ela influencia o que observo e o que considero importante.

Em 16 de agosto de 2026, o presidente Luiz Inácio Lula da Silva e o senador Flávio Bolsonaro abriram suas campanhas em redutos políticos. Lula falou no Estádio da Vila Euclides, em São Bernardo do Campo. Flávio reuniu apoiadores na Praia de Copacabana, no Rio de Janeiro. A [Associated Press os descreveu como os dois principais candidatos à Presidência](https://apnews.com/article/brazil-lula-flavio-bolsonaro-campaign-opens-8f4ad67b107cb05736f450f67198b190).

Registrei os dois discursos com o Jiddu Context e comparei as transcrições completas. Somados, foram **69 minutos e 15 segundos de fala, 8.084 palavras e 597 frases**.

A análise de falácias mostrou a diferença mais clara entre os dois discursos.

## Os números centrais

Nos 36 minutos de Lula, o Jiddu detectou:

- **53 possíveis falácias**;
- **11,1 achados por mil palavras**;
- **4 achados de alta gravidade**;
- **8 ocorrências de [linguagem carregada](/fallacies#loaded_language)**.

Nos 32 minutos de Flávio Bolsonaro, detectou:

- **95 possíveis falácias**;
- **28,6 achados por mil palavras**;
- **40 achados de alta gravidade**;
- **30 ocorrências de [linguagem carregada](/fallacies#loaded_language)**.

O discurso de Flávio foi mais curto e produziu 42 achados a mais. Ajustada pelo número de palavras, a densidade de falácias foi **2,6 vezes maior**. Nos achados de alta gravidade, a diferença foi de dez para um.

## O que o detector encontrou

[Linguagem carregada](/fallacies#loaded_language) foi o padrão mais frequente no discurso de Flávio, com 30 ocorrências. [Non sequitur](/fallacies#non_sequitur) apareceu 14 vezes, [generalização apressada](/fallacies#hasty_generalization) 10, [apelo à emoção](/fallacies#appeal_to_emotion) 9, [bode expiatório](/fallacies#scapegoating) 6 e [falso dilema](/fallacies#false_dichotomy) 5.

No discurso de Lula, [non sequitur](/fallacies#non_sequitur) liderou com 12 achados. [Linguagem carregada](/fallacies#loaded_language) apareceu 8 vezes, [generalização apressada](/fallacies#hasty_generalization) 6 e [apelo à emoção](/fallacies#appeal_to_emotion) 5. A maior parte dos achados de Lula recebeu gravidade baixa; em Flávio, o resultado se deslocou muito mais para a alta gravidade.

O rótulo de falácia não significa que a frase seja falsa. Ele identifica uma possível falha no caminho entre razões e conclusão. Um candidato pode usar um argumento ruim para defender uma proposição verdadeira, assim como um argumento bem organizado pode partir de uma premissa falsa. Fact-check e detecção de falácias respondem a perguntas diferentes.

## Duas formas de construir um discurso de campanha

A diferença também aparece nos tipos de afirmação extraídos de cada transcrição. Números e datas representaram 33,2% das afirmações de Lula e 17,4% das de Flávio. Afirmações categóricas e causais formaram 74,2% das afirmações de Flávio, contra 55,9% das de Lula.

Lula construiu boa parte da fala com memória pessoal, movimento sindical, políticas de educação e comparações entre governos. Flávio recorreu mais a conflito, segurança pública, culpa atribuída ao governo atual, ansiedade econômica e promessas de ação decisiva.

Os dois discursos foram classificados como explicitamente partidários, com 99% de confiança. Isso é esperado em comícios. A comparação útil está na maneira como cada candidato tentou convencer uma plateia já disposta a aplaudi-lo.

## Por que isso pesa no meu voto

Eu já pretendia votar em Lula. Os resultados reforçam uma razão para essa escolha: nestes dois discursos, a argumentação dele dependeu menos de atalhos de raciocínio, principalmente dos mais graves.

O discurso político sempre usará emoção, repetição, símbolos e ênfase seletiva. Esses recursos fazem parte da persuasão. Minha preocupação começa quando medo, escolhas falsas, acusações amplas ou saltos causais sem sustentação carregam mais peso que as razões oferecidas ao eleitor.

Um presidente precisa defender decisões fora de um comício amigável. Os argumentos acabam passando pelo Congresso, pela imprensa, pelos tribunais, pelos dados públicos e por pessoas que não compartilham as premissas do discursante. Um discurso com menos falhas de raciocínio não garante um governo melhor. Ele oferece mais material para o público examinar.

## O que esses números não provam

A análise do Jiddu é automatizada. O detector compara passagens com um catálogo fechado de falácias, preserva o trecho original e explica por que aplicou o rótulo. Ainda pode interpretar mal uma ironia, perder contexto, dividir uma frase de forma ruim ou levar uma simplificação de palanque ao pé da letra. O Jiddu [ainda não publicou um benchmark com rótulos humanos para o detector de falácias](https://jiddu.app/how-it-works#4-fallacy-detector), portanto cada achado continua aberto à revisão humana.

Também decidi não transformar os vereditos de fact-check dessas sessões em um ranking de veracidade. Algumas afirmações extraídas ainda confundem a verificação da proposição subjacente com a confirmação de que o candidato pronunciou aquelas palavras. Uma comparação política não deveria esconder essa limitação só porque o resultado atual favorece meu candidato.

Os números descrevem estes dois discursos. Eles não resumem a carreira inteira dos candidatos nem antecipam todas as falas da campanha. Repetir a análise em debates, entrevistas e novos comícios mostrará se a diferença persiste.

## Examine os trechos

As sessões completas continuam públicas. Cada achado aponta para o trecho da transcrição que o originou, permitindo concordar, discordar ou denunciar uma classificação que pareça errada.

- [Abrir a análise completa de Lula](https://jiddu.app/context/5BvqeTuHoc)
- [Abrir a análise completa de Flávio Bolsonaro](https://jiddu.app/context/NPs4zsq_0b)

Pretendo repetir essa comparação durante a campanha. O próximo resultado útil virá da aplicação do mesmo método a mais discursos, sempre com as passagens por trás de cada número abertas para inspeção.`,
        faq: [
          {
            question: "Uma falácia significa que o candidato mentiu?",
            answer:
              "Não. A falácia trata do raciocínio que conecta premissas e conclusão. A veracidade exige uma análise separada da afirmação factual e das evidências disponíveis.",
          },
          {
            question: "Por que comparar achados por mil palavras?",
            answer:
              "Os discursos têm durações diferentes. Normalizar pelo número de palavras permite comparar a densidade dos problemas de raciocínio detectados, em vez de olhar apenas para os totais brutos.",
          },
          {
            question: "O Jiddu escolheu um candidato?",
            answer:
              "Não. O Jiddu classificou passagens usando o mesmo catálogo de falácias. O apoio do autor a Lula está declarado, e qualquer leitor pode examinar as transcrições e contestar cada achado.",
          },
        ],
        cta: {
          title: "Analise o próximo discurso de campanha",
          description:
            "Registre um debate, entrevista ou comício com o Jiddu Context e mantenha transcrição, afirmações, falácias e fontes reunidas para revisão.",
          label: "Abrir o Jiddu Context",
        },
      },
      es: {
        title:
          "69 minutos de campaña: qué revelan las falacias en los discursos de Lula y Flávio Bolsonaro",
        seoTitle:
          "Lula vs. Flávio: falacias en sus primeros discursos de 2026",
        description:
          "Jiddu analizó los primeros discursos de campaña de Lula y Flávio Bolsonaro en 2026. Compara densidad, gravedad, lenguaje cargado y los límites del análisis automatizado.",
        excerpt:
          "En 69 minutos de campaña, Jiddu detectó 53 posibles falacias en el discurso de Lula y 95 en el de Flávio Bolsonaro. La diferencia creció al ajustarla por extensión y gravedad.",
        readingTime: "7 min de lectura",
        imageAlt:
          "Una lente óptica roja más pequeña con una red de razonamiento dispersa junto a una lente azul y verde más grande con una red más densa",
        imageCaption:
          "La lente roja representa los 11,1 hallazgos por cada mil palabras de Lula; la lente azul y verde, más densa, representa los 28,6 de Flávio Bolsonaro.",
        body: `Mi voto es por Lula. Declaro esa preferencia antes de presentar las cifras porque influye en lo que observo y en lo que considero importante.

El 16 de agosto de 2026, el presidente Luiz Inácio Lula da Silva y el senador Flávio Bolsonaro abrieron sus campañas en bastiones políticos. Lula habló en el Estadio Vila Euclides, en São Bernardo do Campo. Flávio reunió a sus seguidores en la playa de Copacabana, en Río de Janeiro. Associated Press [los describió como los dos principales candidatos a la Presidencia](https://apnews.com/article/brazil-lula-flavio-bolsonaro-campaign-opens-8f4ad67b107cb05736f450f67198b190).

Registré ambos discursos con Jiddu Context y comparé las transcripciones completas. En conjunto fueron **69 minutos y 15 segundos de discurso, 8.084 palabras y 597 frases**.

El análisis de falacias mostró la diferencia más clara entre los dos discursos.

## Las cifras centrales

En los 36 minutos de Lula, Jiddu detectó:

- **53 posibles falacias**;
- **11,1 hallazgos por cada mil palabras**;
- **4 hallazgos de gravedad alta**;
- **8 casos de [lenguaje cargado](/fallacies#loaded_language)**.

En los 32 minutos de Flávio Bolsonaro, detectó:

- **95 posibles falacias**;
- **28,6 hallazgos por cada mil palabras**;
- **40 hallazgos de gravedad alta**;
- **30 casos de [lenguaje cargado](/fallacies#loaded_language)**.

El discurso de Flávio fue más corto y produjo 42 hallazgos más. Ajustada por el número de palabras, la densidad de falacias fue **2,6 veces mayor**. En los hallazgos de gravedad alta, la diferencia fue de diez a uno.

## Lo que encontró el detector

[El lenguaje cargado](/fallacies#loaded_language) fue el patrón más frecuente en el discurso de Flávio, con 30 casos. [Non sequitur](/fallacies#non_sequitur) apareció 14 veces, [generalización apresurada](/fallacies#hasty_generalization) 10, [apelación a la emoción](/fallacies#appeal_to_emotion) 9, [chivo expiatorio](/fallacies#scapegoating) 6 y [falso dilema](/fallacies#false_dichotomy) 5.

En el discurso de Lula, [non sequitur](/fallacies#non_sequitur) encabezó la lista con 12 hallazgos. [El lenguaje cargado](/fallacies#loaded_language) apareció 8 veces, [la generalización apresurada](/fallacies#hasty_generalization) 6 y [la apelación a la emoción](/fallacies#appeal_to_emotion) 5. La mayoría de los hallazgos de Lula recibió gravedad baja; en Flávio, el resultado se desplazó mucho más hacia la gravedad alta.

La etiqueta de falacia no significa que la frase sea falsa. Identifica un posible fallo en el camino entre las razones y la conclusión. Un candidato puede usar un mal argumento para defender una proposición verdadera, del mismo modo que un argumento bien organizado puede partir de una premisa falsa. La verificación de hechos y la detección de falacias responden a preguntas diferentes.

## Dos maneras de construir un discurso de campaña

La diferencia también aparece en los tipos de afirmaciones extraídas de cada transcripción. Los números y las fechas representaron el 33,2% de las afirmaciones de Lula y el 17,4% de las de Flávio. Las afirmaciones categóricas y causales formaron el 74,2% de las afirmaciones de Flávio, frente al 55,9% de las de Lula.

Lula construyó buena parte de su discurso con memoria personal, movimiento sindical, políticas educativas y comparaciones entre gobiernos. Flávio recurrió más al conflicto, la seguridad pública, la culpa atribuida al gobierno actual, la ansiedad económica y las promesas de acción decisiva.

Ambos discursos fueron clasificados como explícitamente partidistas, con un 99% de confianza. Es un resultado esperable en mítines. La comparación útil está en cómo cada candidato intentó convencer a un público que ya estaba dispuesto a aplaudirlo.

## Por qué esto pesa en mi voto

Ya tenía la intención de votar por Lula. Los resultados refuerzan una razón para esa elección: en estos dos discursos, su argumentación dependió menos de atajos de razonamiento, sobre todo de los más graves.

El discurso político siempre usará emoción, repetición, símbolos y énfasis selectivo. Estos recursos forman parte de la persuasión. Mi preocupación comienza cuando el miedo, las falsas elecciones, las acusaciones generales o los saltos causales sin sustento pesan más que las razones ofrecidas al elector.

Un presidente necesita defender decisiones fuera de un mitin amistoso. Los argumentos terminan pasando por el Congreso, la prensa, los tribunales, los datos públicos y las personas que no comparten las premisas del orador. Un discurso con menos fallos de razonamiento no garantiza un gobierno mejor. Ofrece más material para que el público lo examine.

## Lo que estas cifras no demuestran

El análisis de Jiddu es automatizado. El detector compara pasajes con un catálogo cerrado de falacias, conserva el fragmento original y explica por qué aplicó la etiqueta. Aun así, puede interpretar mal una ironía, perder contexto, dividir mal una frase o tomar demasiado literalmente una simplificación de mitin. Jiddu [todavía no ha publicado un benchmark con etiquetas humanas para el detector de falacias](https://jiddu.app/how-it-works#4-fallacy-detector), por lo que cada hallazgo sigue abierto a revisión humana.

También decidí no convertir los veredictos de fact-check de estas sesiones en una clasificación de veracidad. Algunas afirmaciones extraídas todavía confunden la verificación de la proposición subyacente con la confirmación de que el candidato pronunció esas palabras. Una comparación política no debería ocultar esa limitación solo porque el resultado actual favorece a mi candidato.

Las cifras describen estos dos discursos. No resumen toda la trayectoria de los candidatos ni anticipan todas sus intervenciones durante la campaña. Repetir el análisis en debates, entrevistas y nuevos mítines mostrará si la diferencia persiste.

## Examina los pasajes

Las sesiones completas siguen siendo públicas. Cada hallazgo apunta al fragmento de la transcripción que lo originó, lo que permite estar de acuerdo, discrepar o denunciar una clasificación que parezca errónea.

- [Abrir el análisis completo de Lula](https://jiddu.app/context/5BvqeTuHoc)
- [Abrir el análisis completo de Flávio Bolsonaro](https://jiddu.app/context/NPs4zsq_0b)

Pienso repetir esta comparación durante la campaña. El próximo resultado útil vendrá de aplicar el mismo método a más discursos y mantener abiertos a inspección los pasajes que hay detrás de cada cifra.`,
        faq: [
          {
            question: "¿Una falacia significa que el candidato mintió?",
            answer:
              "No. La falacia se refiere al razonamiento que conecta las premisas con la conclusión. La veracidad exige una revisión separada de la afirmación factual y de las pruebas disponibles.",
          },
          {
            question: "¿Por qué comparar hallazgos por cada mil palabras?",
            answer:
              "Los discursos tienen duraciones diferentes. Normalizar por el número de palabras permite comparar la densidad de los problemas de razonamiento detectados, en lugar de observar solo los totales brutos.",
          },
          {
            question: "¿Jiddu eligió a un candidato?",
            answer:
              "No. Jiddu clasificó pasajes mediante el mismo catálogo de falacias. El apoyo del autor a Lula está declarado, y cualquier lector puede examinar las transcripciones y cuestionar cada hallazgo.",
          },
        ],
        cta: {
          title: "Analiza el próximo discurso de campaña",
          description:
            "Registra un debate, una entrevista o un mitin con Jiddu Context y conserva la transcripción, las afirmaciones, las falacias y las fuentes en un mismo espacio de revisión.",
          label: "Abrir Jiddu Context",
        },
      },
    },
  },
  {
    slug: "what-are-logical-fallacies",
    publishedAt: "2026-08-13",
    updatedAt: "2026-08-13",
    author: "Jiddu",
    tags: ["logical-fallacies", "critical-reading"],
    image: {
      src: "/blog/logical-fallacies-lenses.webp",
      width: 1729,
      height: 910,
      type: "image/webp",
    },
    citations: ["https://jiddu.app/fallacies"],
    ctaHref: "/fallacies",
    translations: {
      en: {
        title:
          "What are logical fallacies — and how spotting them helps you think better",
        seoTitle: "What are logical fallacies? Examples and how to spot them",
        description:
          "Learn what logical fallacies are, why recognizing them improves everyday decisions, and how to spot common patterns with practical examples.",
        excerpt:
          "A fallacy can make a weak argument sound persuasive. Learning to identify the pattern helps you ask a better question before you accept the conclusion.",
        readingTime: "6 min read",
        imageAlt:
          "Translucent lenses revealing an unsupported jump, a forced fork, a circular loop, and a side track in a chain of reasoning",
        imageCaption:
          "Each lens isolates a different break in the connection between reasons and conclusion.",
        body: `A **logical fallacy** is a recognizable failure in reasoning. It can appear as an irrelevant attack, a distorted version of someone’s position, a forced choice between two options, a causal claim without enough evidence, or a conclusion drawn from a weak sample.

Fallacies matter because weak reasoning often sounds convincing. A confident speaker, an alarming example, or a neat either-or choice can make the conclusion feel settled before the supporting reasons have been examined.

Once you know the patterns, you can stop and inspect the argument. Separate the claim from the way it was presented, find the weak connection, and ask what evidence is missing.

## What counts as a fallacy?

An argument connects reasons, usually called premises, to a conclusion. A fallacy appears when that connection fails in a familiar way. The problem may be relevance, evidence, causation, ambiguity, a hidden assumption, or emotional pressure doing the work of an argument.

A fallacious argument can reach a true conclusion.

> “The medicine works because a famous actor recommends it.”
>
> — Example of an appeal to authority

That is poor support even if the medicine happens to work. Emotion and expertise still have legitimate roles. A specialist can supply relevant evidence, and the human consequences of a decision can matter. The fallacy begins when prestige or emotion replaces the support the conclusion needs.

Apply the label to the reasoning rather than the person. Saying “this step is an ad hominem” identifies something that can be checked. Calling someone “fallacious” turns analysis into another personal attack.

## Why this is useful outside a logic class

Most people evaluate arguments every day, even when nobody calls them arguments.

- **At work**, you may hear that a failed launch proves the whole strategy is useless, or that only two plans are possible when several alternatives were never discussed.
- **In news and politics**, a speaker may answer criticism by attacking the critic, replace a proposal with an extreme version, or treat sequence as proof of cause.
- **In advertising**, popularity, celebrity, fear, and words such as “natural” can stand in for evidence about quality or safety.
- **In personal decisions**, one vivid experience can outweigh broader evidence: a friend had a bad result, so the treatment, course, neighborhood, or investment must be bad for everyone.
- **In your own thinking**, the same patterns can protect a conclusion you already prefer. Recognizing them is a way to audit your reasoning as well as somebody else’s.

You can then say exactly which connection failed and what information is missing.

## A practical way to identify a fallacy

Start by slowing the argument down.

1. **Write the conclusion in one sentence.** What is the speaker asking you to believe or do?
2. **List the reasons offered.** Remove tone, repetition, status, and confidence. What support remains?
3. **Test the connection.** Do the reasons address that conclusion, or have they shifted to the person, a different proposal, or an emotional reaction?
4. **Look for what was excluded.** Are there more options, counterexamples, alternative causes, or relevant sources?
5. **Ask what would change the conclusion.** If no possible evidence could count against it, the claim may be protected by circular reasoning or an ad hoc exception.

Identify the broken step first. Then use the name to compare it with a known pattern.

## Five common examples

> “Ignore her proposal for the city budget; she cannot even organize her own finances.”
>
> — [Ad hominem](/fallacies#ad_hominem)

The person’s private finances do not answer the proposal’s numbers or assumptions.

> “He wants to limit work messages after 10 p.m., so he wants the team to become unreachable.”
>
> — [Straw man](/fallacies#straw_man)

The reply replaces a limited proposal with a more extreme one.

> “Either we approve this plan today or we do not care about the project.”
>
> — [False dichotomy](/fallacies#false_dichotomy)

Urgency and commitment do not reduce every possible response to two choices.

> “Sales increased after we changed the chat tool, so the new tool caused the growth.”
>
> — [Correlation versus causation](/fallacies#correlation_causation)

Timing and correlation leave other causes open.

> “A famous actor says this supplement works, so it must be effective.”
>
> — [Appeal to authority](/fallacies#appeal_to_authority)

Fame outside the relevant field does not provide medical evidence.

## Where to use Jiddu’s Fallacy Detector

The detector is available in four places, depending on what you are reading or listening to.

- **[Web app](/):** upload a PDF or screenshot, paste text or an image, or add a URL. You can review an opinion piece, campaign speech, or sales presentation before sharing it.
- **[Chrome extension](/extension):** select a passage on any website and inspect it without leaving the page. This is useful while reading an article, newsletter, or long social media post.
- **[Jiddu Live](/live):** turn on the Fallacies lens to monitor the growing transcript as someone speaks. It fits interviews, debates, lectures, and meetings where arguments develop in real time.
- **[API and MCP](/api-access):** send text to the detector from another product or agent. Teams can add it to an editorial workflow, moderation queue, or research assistant.

In each case, Jiddu highlights the relevant passage, names the pattern, and explains the reasoning. Treat the result as a prompt for review, not a verdict: automated labels can be wrong, and the surrounding context still matters.

## Use the label to ask a better question

Once you have named the pattern, ask which premise is missing, whether the source is relevant, what alternatives were hidden, or what evidence supports the proposed cause. The answer may strengthen the argument, narrow the conclusion, or show that the claim needs to be abandoned.

The [Jiddu Fallacy Guide](/fallacies) organizes the full catalog by relevance, presumption, causation, evidence, ambiguity, and emotional appeal. Each entry includes a short definition and an example. When an argument feels persuasive but the support looks thin, compare the passage with the guide, identify the exact break, and return to the evidence.`,
        cta: {
          title: "Inspect the reasoning step by step",
          description:
            "Compare an argument with Jiddu’s catalog of fallacies, definitions, and examples.",
          label: "Open the Fallacy Guide",
        },
      },
      pt: {
        title:
          "O que são falácias lógicas — e como identificá-las ajuda a pensar melhor",
        seoTitle: "O que são falácias lógicas? Exemplos e como identificar",
        description:
          "Entenda o que são falácias lógicas, por que reconhecê-las melhora decisões cotidianas e como identificar padrões comuns com exemplos práticos.",
        excerpt:
          "Uma falácia pode fazer um argumento fraco parecer convincente. Identificar o padrão ajuda você a formular uma pergunta melhor antes de aceitar a conclusão.",
        readingTime: "6 min de leitura",
        imageAlt:
          "Lentes translúcidas revelando um salto sem apoio, uma bifurcação forçada, um ciclo e um desvio em uma cadeia de raciocínio",
        imageCaption:
          "Cada lente isola uma falha diferente na conexão entre as razões e a conclusão.",
        body: `Uma **falácia lógica** é uma falha reconhecível no raciocínio. Ela pode aparecer como um ataque irrelevante, uma versão distorcida da posição de alguém, uma escolha forçada entre duas opções, uma relação causal sem evidência suficiente ou uma conclusão tirada de uma amostra fraca.

Falácias importam porque raciocínios ruins muitas vezes parecem convincentes. Um interlocutor confiante, um exemplo alarmante ou uma escolha bem arrumada entre “isto ou aquilo” pode encerrar a discussão antes que as razões sejam examinadas.

Quando você conhece os padrões, consegue parar e examinar o argumento. Separe a afirmação da forma como ela foi apresentada, encontre a conexão frágil e pergunte qual evidência está faltando.

## O que caracteriza uma falácia?

Um argumento conecta razões, normalmente chamadas de premissas, a uma conclusão. A falácia aparece quando essa conexão falha de um modo conhecido. O problema pode estar na relevância, na evidência, na causalidade, na ambiguidade, em uma premissa oculta ou no uso de pressão emocional para fazer o trabalho do argumento.

Um argumento falacioso pode chegar a uma conclusão verdadeira.

> “O remédio funciona porque um ator famoso recomenda.”
>
> — Exemplo de apelo à autoridade

Esse é um apoio ruim, mesmo que o remédio funcione. Emoção e conhecimento especializado ainda têm papéis legítimos. Um especialista pode fornecer evidência relevante, e as consequências humanas de uma decisão podem importar. A falácia surge quando prestígio ou emoção substituem o apoio necessário à conclusão.

Aplique o rótulo ao raciocínio, não à pessoa. Dizer “este passo contém um ad hominem” identifica algo verificável. Chamar alguém de “falacioso” transforma a análise em outro ataque pessoal.

## Por que isso é útil fora da aula de lógica

Quase todo mundo avalia argumentos diariamente, mesmo quando ninguém os chama de argumentos.

- **No trabalho**, alguém pode dizer que um lançamento ruim prova que toda a estratégia é inútil, ou apresentar apenas dois planos quando outras alternativas nem foram discutidas.
- **Em notícias e na política**, um interlocutor pode responder a uma crítica atacando quem a fez, substituir uma proposta por uma versão extrema ou tratar sequência temporal como prova de causa.
- **Na publicidade**, popularidade, celebridade, medo e palavras como “natural” podem ocupar o lugar da evidência sobre qualidade ou segurança.
- **Em decisões pessoais**, uma experiência marcante pode pesar mais que um conjunto amplo de evidências: um amigo teve um resultado ruim, então o tratamento, o curso, o bairro ou o investimento deve ser ruim para todos.
- **No próprio pensamento**, os mesmos padrões podem proteger uma conclusão de que você já gosta. Reconhecê-los também permite auditar o próprio raciocínio.

Assim você consegue dizer qual conexão falhou e qual informação está faltando.

## Um método prático para identificar uma falácia

Comece desacelerando o argumento.

1. **Escreva a conclusão em uma frase.** O que o interlocutor quer que você acredite ou faça?
2. **Liste as razões apresentadas.** Retire tom, repetição, status e confiança. Que apoio resta?
3. **Teste a conexão.** As razões respondem à conclusão ou mudaram para a pessoa, outra proposta ou uma reação emocional?
4. **Procure o que foi excluído.** Existem mais opções, contraexemplos, causas alternativas ou fontes relevantes?
5. **Pergunte o que mudaria a conclusão.** Se nenhuma evidência possível puder contrariá-la, a afirmação pode estar protegida por raciocínio circular ou por uma exceção improvisada.

Encontre primeiro a falha no raciocínio. Depois use o nome para compará-la a um padrão conhecido.

## Cinco exemplos comuns

> “Ignore a proposta dela para o orçamento da cidade; ela nem consegue organizar as próprias finanças.”
>
> — [Ad hominem](/fallacies#ad_hominem)

As finanças pessoais não respondem aos números ou às premissas da proposta.

> “Ele quer limitar mensagens de trabalho depois das 22h, então quer deixar a equipe incomunicável.”
>
> — [Espantalho](/fallacies#straw_man)

A resposta troca uma proposta limitada por outra mais extrema.

> “Ou aprovamos este plano hoje ou não nos importamos com o projeto.”
>
> — [Falso dilema](/fallacies#false_dichotomy)

Urgência e compromisso não reduzem todas as respostas possíveis a duas opções.

> “As vendas cresceram depois que trocamos a ferramenta de chat, então a nova ferramenta causou o crescimento.”
>
> — [Correlação versus causalidade](/fallacies#correlation_causation)

Sequência e correlação deixam outras causas em aberto.

> “Um ator famoso disse que este suplemento funciona, então ele deve ser eficaz.”
>
> — [Apelo à autoridade](/fallacies#appeal_to_authority)

Fama fora da área relevante não produz evidência médica.

## Onde usar o Detector de Falácias do Jiddu

O detector está disponível em quatro lugares, de acordo com o que você está lendo ou ouvindo.

- **[Aplicativo web](/):** envie um PDF ou screenshot, cole texto ou imagem ou adicione uma URL. Serve, por exemplo, para revisar um artigo de opinião, discurso de campanha ou apresentação comercial antes de compartilhá-los.
- **[Extensão do Chrome](/extension):** selecione um trecho em qualquer site e examine-o sem sair da página. É útil durante a leitura de uma reportagem, newsletter ou publicação longa em uma rede social.
- **[Jiddu Live](/live):** ative a lente de Falácias para acompanhar a transcrição enquanto alguém fala. Funciona bem em entrevistas, debates, aulas e reuniões nas quais os argumentos se desenvolvem ao vivo.
- **[API e MCP](/api-access):** envie texto ao detector a partir de outro produto ou agente. Equipes podem integrá-lo a um fluxo editorial, a uma fila de moderação ou a um assistente de pesquisa.

Em todos os casos, o Jiddu destaca o trecho relevante, identifica o padrão e explica o raciocínio. Trate o resultado como ponto de partida para a revisão, não como veredito: classificações automáticas podem errar, e o contexto continua sendo necessário.

## Use o rótulo para formular uma pergunta melhor

Depois de reconhecer o padrão, pergunte qual premissa está faltando, se a fonte é relevante, quais alternativas foram escondidas ou que evidência sustenta a causa proposta. A resposta pode fortalecer o argumento, limitar a conclusão ou mostrar que a afirmação deve ser abandonada.

O [Guia de Falácias do Jiddu](/fallacies) organiza o catálogo completo por relevância, presunção, causalidade, evidência, ambiguidade e apelo emocional. Cada verbete traz uma definição curta e um exemplo. Quando um argumento parecer convincente, mas o apoio estiver fraco, compare o trecho com o guia, identifique a falha exata e volte às evidências.`,
        cta: {
          title: "Examine o raciocínio passo a passo",
          description:
            "Compare um argumento com o catálogo de falácias, definições e exemplos do Jiddu.",
          label: "Abrir o Guia de Falácias",
        },
      },
      es: {
        title:
          "Qué son las falacias lógicas — y cómo identificarlas ayuda a pensar mejor",
        seoTitle: "¿Qué son las falacias lógicas? Ejemplos y cómo detectarlas",
        description:
          "Descubre qué son las falacias lógicas, por qué reconocerlas mejora las decisiones cotidianas y cómo detectar patrones comunes con ejemplos prácticos.",
        excerpt:
          "Una falacia puede hacer que un argumento débil parezca convincente. Identificar el patrón te ayuda a formular una pregunta mejor antes de aceptar la conclusión.",
        readingTime: "6 min de lectura",
        imageAlt:
          "Lentes translúcidas que revelan un salto sin apoyo, una bifurcación forzada, un ciclo y un desvío en una cadena de razonamiento",
        imageCaption:
          "Cada lente aísla un fallo diferente en la conexión entre las razones y la conclusión.",
        body: `Una **falacia lógica** es un fallo reconocible en el razonamiento. Puede aparecer como un ataque irrelevante, una versión distorsionada de la postura de alguien, una elección forzada entre dos opciones, una relación causal sin evidencia suficiente o una conclusión extraída de una muestra débil.

Las falacias importan porque un razonamiento defectuoso muchas veces parece convincente. Un interlocutor seguro, un ejemplo alarmante o una elección bien ordenada entre “esto o aquello” puede cerrar la discusión antes de que se examinen las razones.

Cuando conoces los patrones, puedes detenerte y examinar el argumento. Separa la afirmación de la forma en que fue presentada, encuentra la conexión frágil y pregunta qué evidencia falta.

## ¿Qué caracteriza una falacia?

Un argumento conecta razones, normalmente llamadas premisas, con una conclusión. La falacia aparece cuando esa conexión falla de una manera conocida. El problema puede estar en la relevancia, la evidencia, la causalidad, la ambigüedad, una premisa oculta o el uso de presión emocional para hacer el trabajo del argumento.

Un argumento falaz puede llegar a una conclusión verdadera.

> “El medicamento funciona porque lo recomienda un actor famoso.”
>
> — Ejemplo de apelación a la autoridad

Es un apoyo deficiente, aunque el medicamento funcione. La emoción y el conocimiento especializado siguen teniendo funciones legítimas. Un especialista puede aportar evidencia relevante, y las consecuencias humanas de una decisión pueden importar. La falacia surge cuando el prestigio o la emoción sustituyen el apoyo que necesita la conclusión.

Aplica la etiqueta al razonamiento, no a la persona. Decir “este paso contiene un ad hominem” identifica algo que puede comprobarse. Llamar “falaz” a alguien convierte el análisis en otro ataque personal.

## Por qué sirve fuera de una clase de lógica

Casi todo el mundo evalúa argumentos a diario, aunque nadie los llame argumentos.

- **En el trabajo**, alguien puede decir que un lanzamiento fallido demuestra que toda la estrategia es inútil, o presentar solo dos planes cuando nunca se discutieron otras alternativas.
- **En las noticias y la política**, un interlocutor puede responder a una crítica atacando a quien la hizo, sustituir una propuesta por una versión extrema o tratar una secuencia temporal como prueba de causa.
- **En la publicidad**, la popularidad, la celebridad, el miedo y palabras como “natural” pueden ocupar el lugar de la evidencia sobre calidad o seguridad.
- **En las decisiones personales**, una experiencia llamativa puede pesar más que un conjunto amplio de evidencias: a un amigo le fue mal, por lo tanto el tratamiento, el curso, el barrio o la inversión debe ser malo para todos.
- **En el propio pensamiento**, los mismos patrones pueden proteger una conclusión que ya prefieres. Reconocerlos también permite auditar el propio razonamiento.

Así puedes decir qué conexión falló y qué información falta.

## Un método práctico para identificar una falacia

Empieza por reducir la velocidad del argumento.

1. **Escribe la conclusión en una frase.** ¿Qué quiere el interlocutor que creas o hagas?
2. **Enumera las razones presentadas.** Retira el tono, la repetición, el estatus y la seguridad. ¿Qué apoyo queda?
3. **Comprueba la conexión.** ¿Las razones responden a la conclusión o se han desplazado hacia la persona, otra propuesta o una reacción emocional?
4. **Busca lo que se ha excluido.** ¿Existen más opciones, contraejemplos, causas alternativas o fuentes relevantes?
5. **Pregunta qué cambiaría la conclusión.** Si ninguna evidencia posible pudiera contradecirla, la afirmación puede estar protegida por un razonamiento circular o una excepción improvisada.

Encuentra primero el fallo en el razonamiento. Después usa el nombre para compararlo con un patrón conocido.

## Cinco ejemplos comunes

> “Ignora su propuesta para el presupuesto de la ciudad; ni siquiera sabe organizar sus propias finanzas.”
>
> — [Ad hominem](/fallacies#ad_hominem)

Las finanzas personales no responden a las cifras o premisas de la propuesta.

> “Quiere limitar los mensajes de trabajo después de las diez de la noche, así que quiere dejar al equipo incomunicado.”
>
> — [Hombre de paja](/fallacies#straw_man)

La respuesta sustituye una propuesta limitada por otra más extrema.

> “O aprobamos este plan hoy o no nos importa el proyecto.”
>
> — [Falso dilema](/fallacies#false_dichotomy)

La urgencia y el compromiso no reducen todas las respuestas posibles a dos opciones.

> “Las ventas aumentaron después de cambiar la herramienta de chat, así que la nueva herramienta causó el crecimiento.”
>
> — [Correlación frente a causalidad](/fallacies#correlation_causation)

La secuencia y la correlación dejan abiertas otras causas.

> “Un actor famoso dice que este suplemento funciona, así que debe ser eficaz.”
>
> — [Apelación a la autoridad](/fallacies#appeal_to_authority)

La fama fuera del campo relevante no aporta evidencia médica.

## Dónde usar el Detector de Falacias de Jiddu

El detector está disponible en cuatro lugares, según lo que estés leyendo o escuchando.

- **[Aplicación web](/):** sube un PDF o screenshot, pega texto o una imagen, o añade una URL. Puede servir para revisar un artículo de opinión, un discurso de campaña o una presentación comercial antes de compartirlos.
- **[Extensión de Chrome](/extension):** selecciona un pasaje en cualquier sitio y examínalo sin salir de la página. Es útil al leer un reportaje, una newsletter o una publicación larga en una red social.
- **[Jiddu Live](/live):** activa la lente de Falacias para seguir la transcripción mientras alguien habla. Funciona bien en entrevistas, debates, clases y reuniones donde los argumentos se desarrollan en directo.
- **[API y MCP](/api-access):** envía texto al detector desde otro producto o agente. Los equipos pueden integrarlo en un flujo editorial, una cola de moderación o un asistente de investigación.

En todos los casos, Jiddu resalta el pasaje relevante, identifica el patrón y explica el razonamiento. Trata el resultado como punto de partida para la revisión, no como veredicto: las clasificaciones automáticas pueden equivocarse y el contexto sigue siendo necesario.

## Usa la etiqueta para formular una pregunta mejor

Después de reconocer el patrón, pregunta qué premisa falta, si la fuente es relevante, qué alternativas quedaron ocultas o qué evidencia sostiene la causa propuesta. La respuesta puede reforzar el argumento, limitar la conclusión o mostrar que la afirmación debe abandonarse.

La [Guía de Falacias de Jiddu](/fallacies) organiza el catálogo completo por relevancia, presunción, causalidad, evidencia, ambigüedad y apelación emocional. Cada entrada incluye una definición breve y un ejemplo. Cuando un argumento parezca convincente, pero el apoyo sea débil, compara el pasaje con la guía, identifica el fallo exacto y vuelve a las evidencias.`,
        cta: {
          title: "Examina el razonamiento paso a paso",
          description:
            "Compara un argumento con el catálogo de falacias, definiciones y ejemplos de Jiddu.",
          label: "Abrir la Guía de Falacias",
        },
      },
    },
  },
  {
    slug: "what-is-truth-krishnamurti-jiddu-lenses",
    publishedAt: "2026-08-13",
    updatedAt: "2026-08-13",
    author: "Jiddu",
    tags: ["philosophy", "critical-reading", "responsible-ai"],
    image: {
      src: "/blog/truth-through-jiddu-lenses.webp",
      width: 1729,
      height: 910,
      type: "image/webp",
    },
    citations: [
      "https://iep.utm.edu/truth/",
      "https://kfoundation.org/dissolution-speech/",
      "https://kfoundation.org/core-of-the-teachings/",
      "https://kfoundation.org/transcript/dialogue-6-brockwood-park-28-june-1975/",
      "https://jiddu.app/",
    ],
    ctaHref: "/",
    translations: {
      en: {
        title:
          "What is truth? Krishnamurti and Jiddu’s lenses",
        seoTitle: "What is truth? Krishnamurti and Jiddu’s lenses",
        description:
          "Explore philosophical theories of truth, Krishnamurti’s break with Theosophy, and how Jiddu’s lenses support critical judgment.",
        excerpt:
          "Philosophy asks what makes a proposition true; Krishnamurti asks how conditioning affects what we see. Jiddu’s lenses connect those questions without claiming to settle either one.",
        readingTime: "6 min read",
        imageAlt:
          "Transparent optical lenses revealing different aspects of the same open, pathless landscape",
        imageCaption:
          "Each lens brings a different part of the same landscape into focus.",
        body: `The question “What is truth?” works on two levels. One concerns a particular statement: did an event happen, is a number accurate, does a source support a claim? The other asks what we mean whenever we call a statement true.

The [Internet Encyclopedia of Philosophy’s overview of truth](https://iep.utm.edu/truth/) starts at that second level. It asks what can bear a truth-value and how language, belief, and the world connect. Jiddu Krishnamurti starts with the observer. He asks how conditioning shapes what the mind sees. The two inquiries meet where an event becomes a description and the description becomes a judgment.

## Five philosophical lenses on truth

The IEP surveys five major theories. Each handles a different part of the problem.

- **Correspondence** tests whether a proposition matches how the world is. The hard part is explaining correspondence and facts themselves.
- **Semantic theory**, associated with Alfred Tarski, specifies the conditions under which a sentence is true and separates the language under study from the language used to analyze it.
- **Coherence** looks at how a belief fits within a consistent system. A coherent story can still describe the world badly.
- **Pragmatic theory** connects truth with inquiry, testing, and what survives scrutiny in practice. Usefulness alone cannot rescue a false claim.
- **Deflationary theory** gives the word *true* a lighter job. “It is true that snow is white” may add little to “snow is white.”

Each theory answers a different question. The image of a lens fits because every theory brings something into focus and leaves something at the edge.

## Krishnamurti’s break with Theosophy

Calling Krishnamurti’s mature view “Theosophical” misses the break that defined it. The Theosophical Society presented him as the future “World Teacher” and created the Order of the Star around that expectation. He grew up inside that environment and later rejected its hierarchy, ceremonies, and spiritual authority.

In 1929, Krishnamurti dissolved the organization he led. His [dissolution speech](https://kfoundation.org/dissolution-speech/) contains the line that would define the rest of his work:

> Truth is a pathless land.

Krishnamurti kept a firm distinction between truth and error while denying institutions, creeds, teachers, rituals, and techniques any monopoly over the route to truth. Once a route is treated as guaranteed, followers hand judgment to the people authorized to interpret it.

Krishnamurti’s [summary of his core teaching](https://kfoundation.org/core-of-the-teachings/) turns to relationship, the contents of the mind, and direct observation. Images, fears, beliefs, and memories can distort what we see before any explicit argument begins.

## From propositions to perception

Analytic philosophy usually asks what it means for a proposition to be true. Krishnamurti asks whether perception can be free of authority and psychological conditioning.

They meet at the boundary between an event and its account. In a [1975 dialogue with David Bohm](https://kfoundation.org/transcript/dialogue-6-brockwood-park-28-june-1975/), Krishnamurti puts it plainly: the description is not the described.

A transcript records words from a conversation. A source documents an event from a particular position. A model offers an interpretation. Each is useful, and each remains one step removed from what happened.

## What each Jiddu lens does

Jiddu turns that limit into a product decision. Its lenses stay separate, and each asks a narrower question of the same text:

1. **Fact-check** extracts verifiable claims and searches for sources that support, contradict, complicate, or fail to establish them. The verdict depends on the wording of the claim and the quality of the evidence.
2. **Fallacies** tests the inference. It can identify a false dilemma, a personal attack, or a distorted account of an opponent’s position. A valid argument can begin with false premises, while a poor argument can reach a true conclusion.
3. **Neutrality** examines framing, attribution, and source selection. It shows how a text directs attention without deciding which political side is right. A balanced tone says nothing by itself about factual accuracy.
4. **Explain** clarifies structure and meaning for a chosen audience. Factual validation remains a separate task.
5. **Slop patterns** identifies generic transitions, inflated language, repetition, and other low-information habits. These findings measure writing habits; factual analysis addresses truth-value.
6. **Adversarial review** looks for missing evidence, hidden assumptions, alternative explanations, and conclusions that exceed the data.

Live and Context can run several lenses over the same conversation. The outputs stay separate. A cited source remains evidence for a claim; a fallacy label remains an assessment of reasoning; an explanation remains an aid to understanding.

## Where the lenses stop

Every lens keeps its blind spots. A coherent article may be wrong. A well-sourced article may omit decisive context. An automated analysis may misread the passage.

Krishnamurti’s warning becomes a design constraint for Jiddu. A critical-reading tool has to expose its steps, preserve the source, separate one kind of judgment from another, cite evidence, state uncertainty, and leave room for disagreement.

Jiddu makes a narrower promise. It helps readers isolate claims, inspect evidence, notice framing, and challenge arguments. The reader still has to return to the source and decide.`,
        cta: {
          title: "Read the claim from more than one angle",
          description:
            "Use fact-checking, fallacies, neutrality, explanation, writing-pattern analysis, or adversarial review. Then inspect the evidence and make your own judgment.",
          label: "Read with Jiddu",
        },
      },
      pt: {
        title:
          "O que é a verdade? Krishnamurti e as lentes do Jiddu",
        seoTitle: "O que é a verdade? Krishnamurti e as lentes do Jiddu",
        description:
          "Conheça teorias filosóficas da verdade, a ruptura de Krishnamurti com a Teosofia e como as lentes do Jiddu apoiam o julgamento crítico.",
        excerpt:
          "A filosofia pergunta o que torna uma proposição verdadeira; Krishnamurti pergunta como o condicionamento afeta o que vemos. As lentes do Jiddu conectam essas questões sem pretender encerrá-las.",
        readingTime: "6 min de leitura",
        imageAlt:
          "Lentes ópticas transparentes revelando aspectos diferentes da mesma paisagem aberta e sem caminho",
        imageCaption:
          "Cada lente coloca uma parte diferente da mesma paisagem em foco.",
        body: `A pergunta “o que é a verdade?” tem dois sentidos. Um trata de uma afirmação específica: o acontecimento ocorreu, o número está correto, a fonte sustenta a alegação? O outro pergunta o que queremos dizer sempre que chamamos uma afirmação de verdadeira.

O panorama da [Internet Encyclopedia of Philosophy sobre a verdade](https://iep.utm.edu/truth/) começa nesse segundo nível. Ele investiga o que pode receber um valor de verdade e como linguagem, crença e mundo se conectam. Jiddu Krishnamurti começa pelo observador. Sua pergunta é como o condicionamento molda o que a mente vê. As duas investigações se encontram quando um acontecimento vira descrição e a descrição vira julgamento.

## Cinco lentes filosóficas sobre a verdade

A IEP apresenta cinco teorias principais. Cada uma aborda uma parte diferente do problema.

- **Correspondência** testa se uma proposição coincide com o modo como o mundo é. A dificuldade está em explicar a própria correspondência e os fatos.
- **Teoria semântica**, associada a Alfred Tarski, define as condições em que uma frase é verdadeira e separa a linguagem estudada da linguagem usada para analisá-la.
- **Coerência** examina como uma crença se integra a um sistema consistente. Uma história coerente ainda pode descrever mal o mundo.
- **Teoria pragmática** conecta a verdade à investigação, ao teste e àquilo que resiste ao exame na prática. A utilidade não resgata uma afirmação falsa.
- **Teoria deflacionária** dá um trabalho mais leve à palavra *verdadeiro*. “É verdade que a neve é branca” talvez acrescente pouco a “a neve é branca”.

Cada teoria responde a uma pergunta diferente. A imagem da lente funciona porque toda teoria coloca algo em foco e deixa algo nas bordas.

## A ruptura de Krishnamurti com a Teosofia

Chamar a visão madura de Krishnamurti de “teosófica” apaga a ruptura que a definiu. A Sociedade Teosófica o apresentou como futuro “Mestre Universal” e criou a Ordem da Estrela em torno dessa expectativa. Ele cresceu nesse ambiente e depois rejeitou sua hierarquia, suas cerimônias e sua autoridade espiritual.

Em 1929, Krishnamurti dissolveu a organização que liderava. O [discurso de dissolução](https://kfoundation.org/dissolution-speech/) contém a frase que definiria o restante de seu trabalho:

> A verdade é uma terra sem caminhos.

Krishnamurti mantinha uma distinção firme entre verdade e erro enquanto negava a instituições, credos, mestres, rituais e técnicas qualquer monopólio sobre a rota até a verdade. Quando uma rota é tratada como garantida, o seguidor entrega seu julgamento às pessoas autorizadas a interpretá-la.

O [resumo dos ensinamentos centrais de Krishnamurti](https://kfoundation.org/core-of-the-teachings/) se volta para as relações, o conteúdo da mente e a observação direta. Imagens, medos, crenças e memórias podem distorcer o que vemos antes mesmo de surgir um argumento explícito.

## Das proposições à percepção

A filosofia analítica costuma perguntar o que significa uma proposição ser verdadeira. Krishnamurti pergunta se a percepção pode estar livre de autoridade e condicionamento psicológico.

Elas se encontram na fronteira entre o acontecimento e seu relato. Em um [diálogo de 1975 com David Bohm](https://kfoundation.org/transcript/dialogue-6-brockwood-park-28-june-1975/), Krishnamurti formula o limite de modo direto: a descrição não é o descrito.

Uma transcrição registra palavras de uma conversa. Uma fonte documenta um acontecimento a partir de determinada posição. Um modelo oferece uma interpretação. Cada item tem valor e continua a um passo de distância do que ocorreu.

## O que cada lente do Jiddu faz

O Jiddu transforma esse limite em uma decisão de produto. Suas lentes permanecem separadas, e cada uma faz uma pergunta mais estreita ao mesmo texto:

1. **Fact-check** extrai afirmações verificáveis e procura fontes que as sustentem, contradigam, compliquem ou não consigam comprová-las. O veredito depende da formulação da alegação e da qualidade da evidência.
2. **Falácias** testa a inferência. Pode identificar um falso dilema, um ataque à pessoa ou uma distorção da posição adversária. Um argumento válido pode partir de premissas falsas, enquanto um argumento ruim pode chegar a uma conclusão verdadeira.
3. **Neutralidade** examina enquadramento, atribuição e seleção de fontes. Mostra como um texto conduz a atenção sem decidir qual lado político está certo. Um tom equilibrado, sozinho, nada diz sobre a precisão factual.
4. **Explain** esclarece estrutura e sentido para o público escolhido. A validação factual continua sendo uma tarefa separada.
5. **Padrões de slop** identifica transições genéricas, linguagem inflada, repetição e outros hábitos de baixa informação. Esses achados medem hábitos de escrita; a análise factual examina o valor de verdade.
6. **Revisão adversarial** procura evidências ausentes, premissas ocultas, explicações alternativas e conclusões que ultrapassam os dados.

O Live e o Context podem aplicar várias lentes à mesma conversa. Os resultados continuam separados. Uma fonte citada permanece como evidência para uma alegação; um rótulo de falácia permanece como avaliação do raciocínio; uma explicação permanece como auxílio à compreensão.

## Onde as lentes param

Toda lente mantém seus pontos cegos. Um artigo coerente pode estar errado. Um artigo bem documentado pode omitir um contexto decisivo. Uma análise automatizada pode interpretar mal a passagem.

O alerta de Krishnamurti se torna uma restrição de design para o Jiddu. Uma ferramenta de leitura crítica precisa expor suas etapas, preservar a fonte, separar um tipo de julgamento do outro, citar evidências, declarar incerteza e deixar espaço para discordância.

O Jiddu faz uma promessa mais estreita. Ajuda o leitor a isolar afirmações, examinar evidências, perceber enquadramentos e contestar argumentos. O leitor ainda precisa voltar à fonte e decidir.`,
        cta: {
          title: "Leia a afirmação por mais de um ângulo",
          description:
            "Use fact-check, falácias, neutralidade, explicação, análise de padrões de escrita ou revisão adversarial. Depois examine as evidências e forme seu próprio julgamento.",
          label: "Ler com o Jiddu",
        },
      },
      es: {
        title:
          "¿Qué es la verdad? Krishnamurti y las lentes de Jiddu",
        seoTitle: "¿Qué es la verdad? Krishnamurti y las lentes de Jiddu",
        description:
          "Explora teorías filosóficas de la verdad, la ruptura de Krishnamurti con la Teosofía y cómo las lentes de Jiddu apoyan el juicio crítico.",
        excerpt:
          "La filosofía pregunta qué hace verdadera una proposición; Krishnamurti pregunta cómo el condicionamiento afecta lo que vemos. Las lentes de Jiddu conectan ambas preguntas sin pretender cerrarlas.",
        readingTime: "6 min de lectura",
        imageAlt:
          "Lentes ópticas transparentes que revelan aspectos diferentes del mismo paisaje abierto y sin camino",
        imageCaption:
          "Cada lente enfoca una parte diferente del mismo paisaje.",
        body: `La pregunta “¿qué es la verdad?” tiene dos sentidos. Uno se refiere a una afirmación concreta: ¿ocurrió el acontecimiento, es correcta la cifra, respalda la fuente la alegación? El otro pregunta qué queremos decir cada vez que llamamos verdadera a una afirmación.

El panorama de la [Internet Encyclopedia of Philosophy sobre la verdad](https://iep.utm.edu/truth/) comienza en ese segundo nivel. Investiga qué puede recibir un valor de verdad y cómo se conectan lenguaje, creencia y mundo. Jiddu Krishnamurti comienza por el observador. Su pregunta es cómo el condicionamiento moldea lo que ve la mente. Ambas investigaciones se encuentran cuando un acontecimiento se convierte en descripción y la descripción se convierte en juicio.

## Cinco lentes filosóficas sobre la verdad

La IEP presenta cinco teorías principales. Cada una aborda una parte diferente del problema.

- **Correspondencia** comprueba si una proposición coincide con cómo es el mundo. La dificultad consiste en explicar la correspondencia y los propios hechos.
- **Teoría semántica**, asociada a Alfred Tarski, define las condiciones en las que una frase es verdadera y separa el lenguaje estudiado del lenguaje usado para analizarlo.
- **Coherencia** examina cómo encaja una creencia en un sistema consistente. Una historia coherente todavía puede describir mal el mundo.
- **Teoría pragmática** conecta la verdad con la investigación, la prueba y aquello que resiste el examen en la práctica. La utilidad no rescata una afirmación falsa.
- **Teoría deflacionaria** da un trabajo más ligero a la palabra *verdadero*. “Es verdad que la nieve es blanca” quizá añada poco a “la nieve es blanca”.

Cada teoría responde a una pregunta diferente. La imagen de la lente funciona porque toda teoría enfoca algo y deja algo en los bordes.

## La ruptura de Krishnamurti con la Teosofía

Llamar “teosófica” a la visión madura de Krishnamurti borra la ruptura que la definió. La Sociedad Teosófica lo presentó como futuro “Instructor del Mundo” y creó la Orden de la Estrella alrededor de esa expectativa. Creció en ese ambiente y después rechazó su jerarquía, sus ceremonias y su autoridad espiritual.

En 1929, Krishnamurti disolvió la organización que dirigía. El [discurso de disolución](https://kfoundation.org/dissolution-speech/) contiene la frase que definiría el resto de su trabajo:

> La verdad es una tierra sin caminos.

Krishnamurti mantenía una distinción firme entre verdad y error mientras negaba a instituciones, credos, maestros, rituales y técnicas cualquier monopolio sobre la ruta hacia la verdad. Cuando una ruta se considera garantizada, el seguidor entrega su juicio a las personas autorizadas para interpretarla.

El [resumen de las enseñanzas centrales de Krishnamurti](https://kfoundation.org/core-of-the-teachings/) se ocupa de las relaciones, el contenido de la mente y la observación directa. Imágenes, miedos, creencias y recuerdos pueden distorsionar lo que vemos antes de que aparezca un argumento explícito.

## De las proposiciones a la percepción

La filosofía analítica suele preguntar qué significa que una proposición sea verdadera. Krishnamurti pregunta si la percepción puede estar libre de autoridad y condicionamiento psicológico.

Se encuentran en la frontera entre el acontecimiento y su relato. En un [diálogo de 1975 con David Bohm](https://kfoundation.org/transcript/dialogue-6-brockwood-park-28-june-1975/), Krishnamurti formula el límite con claridad: la descripción no es lo descrito.

Una transcripción registra palabras de una conversación. Una fuente documenta un acontecimiento desde una posición determinada. Un modelo ofrece una interpretación. Cada elemento tiene valor y permanece a un paso de lo que ocurrió.

## Lo que hace cada lente de Jiddu

Jiddu convierte ese límite en una decisión de producto. Sus lentes permanecen separadas, y cada una formula una pregunta más estrecha al mismo texto:

1. **Fact-check** extrae afirmaciones verificables y busca fuentes que las respalden, contradigan, compliquen o no consigan demostrarlas. El veredicto depende de la formulación de la alegación y de la calidad de la evidencia.
2. **Falacias** pone a prueba la inferencia. Puede identificar un falso dilema, un ataque personal o una distorsión de la postura contraria. Un argumento válido puede partir de premisas falsas, mientras uno torpe puede llegar a una conclusión verdadera.
3. **Neutralidad** examina el encuadre, la atribución y la selección de fuentes. Muestra cómo un texto dirige la atención sin decidir qué bando político tiene razón. Un tono equilibrado, por sí solo, nada dice sobre la precisión factual.
4. **Explain** aclara la estructura y el sentido para la audiencia elegida. La validación factual sigue siendo una tarea separada.
5. **Patrones de slop** identifica transiciones genéricas, lenguaje inflado, repetición y otros hábitos de baja información. Estos hallazgos miden hábitos de escritura; el análisis factual examina el valor de verdad.
6. **Revisión adversarial** busca evidencias ausentes, premisas ocultas, explicaciones alternativas y conclusiones que van más allá de los datos.

Live y Context pueden aplicar varias lentes a la misma conversación. Los resultados permanecen separados. Una fuente citada sigue siendo evidencia para una alegación; una etiqueta de falacia sigue siendo una evaluación del razonamiento; una explicación sigue siendo una ayuda para comprender.

## Dónde terminan las lentes

Cada lente conserva sus puntos ciegos. Un artículo coherente puede estar equivocado. Un artículo bien documentado puede omitir un contexto decisivo. Un análisis automatizado puede interpretar mal el pasaje.

La advertencia de Krishnamurti se convierte en una restricción de diseño para Jiddu. Una herramienta de lectura crítica debe exponer sus pasos, conservar la fuente, separar un tipo de juicio de otro, citar evidencias, declarar incertidumbre y dejar espacio para discrepar.

Jiddu hace una promesa más acotada. Ayuda al lector a aislar afirmaciones, examinar evidencias, detectar encuadres y cuestionar argumentos. El lector todavía tiene que volver a la fuente y decidir.`,
        cta: {
          title: "Lee la afirmación desde más de un ángulo",
          description:
            "Usa fact-check, falacias, neutralidad, explicación, análisis de patrones de escritura o revisión adversarial. Después examina la evidencia y forma tu propio juicio.",
          label: "Leer con Jiddu",
        },
      },
    },
  },
  {
    slug: "what-is-live-intelligence",
    publishedAt: "2026-08-09",
    updatedAt: "2026-08-10",
    author: "Jiddu",
    tags: ["live-intelligence", "elections", "responsible-ai"],
    image: {
      src: "/blog/jiddu-context-live-intelligence.webp",
      width: 1600,
      height: 1116,
      type: "image/webp",
      full: {
        src: "/blog/jiddu-context-full.png",
        width: 2178,
        height: 1519,
        type: "image/png",
      },
    },
    thumbnail: {
      src: "/blog/live-intelligence-lenses.webp",
      width: 1729,
      height: 910,
      type: "image/webp",
    },
    citations: [
      "https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026",
      "https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/",
      "https://jiddu.app/context",
    ],
    ctaHref: "/context",
    translations: {
      en: {
        title:
          "What is live intelligence — and how Jiddu Context helps you follow political speech in real time",
        seoTitle: "Jiddu Context: live intelligence for political debates",
        description:
          "Meet Jiddu Context, a live workspace that transcribes political speech and organizes entities, claims, sources, neutrality, and fallacies.",
        excerpt:
          "Political speech moves faster than careful analysis. Jiddu Context turns a live interview or debate into a workspace you can inspect while the conversation is still happening.",
        readingTime: "5 min read",
        imageAlt:
          "Jiddu Context analyzing a Brazilian political interview beside a live transcript, entity graph, sources, neutrality, and fallacy panels",
        thumbnailAlt:
          "Abstract sound waves passing through optical lenses and resolving into connected context nodes",
        imageCaption:
          "Jiddu Context running beside an interview, with the transcript, entity graph, sources, neutrality, and fallacy analysis in one session.",
        imageOpenLabel: "Open the full-resolution Jiddu Context image",
        body: `A political interview can produce dozens of names, numbers, accusations, comparisons, and promises in a few minutes. By the time a viewer searches for one claim, the conversation has already moved on.

**Jiddu Context** turns that stream of speech into a workspace. It listens through the microphone or a browser tab, transcribes the conversation, maps the people and organizations mentioned, and organizes claims, sources, topics, neutrality signals, and possible fallacies as the session develops.

> Jiddu Context is a live intelligence workspace built on an orchestrated multi-agent architecture.

## Why launch it now?

The next election cycle will put a large volume of political speech in front of voters, journalists, researchers, and campaign observers. Brazil holds the first round of its 2026 general election on **October 4**, with a possible second round on **October 25**, according to the [official electoral rules published by the Superior Electoral Court](https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026). The next regularly scheduled U.S. federal general election, including the midterms, is **November 3**, according to the [Federal Election Commission](https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/).

During this period, candidates will appear in debates, long-form interviews, press conferences, podcasts, radio programs, and live streams. Each format makes careful follow-up difficult: a factual claim may depend on an older statistic, a name may refer to several people, and a persuasive phrase may sound conclusive without presenting evidence.

Context keeps these elements visible without forcing the user to pause the conversation and open a trail of disconnected searches.

## What Jiddu Context does

A Context session combines several forms of analysis around the same transcript:

1. **Live transcription:** captures audio from a microphone or browser tab and keeps the conversation readable as it happens.
2. **Speaker identification:** separates speakers and lets the user review their names after the session.
3. **Context graph:** maps people, organizations, institutions, events, and the relationships mentioned in the conversation.
4. **Claims and sources:** detects verifiable statements, searches for supporting material, and distinguishes a sourced verdict from a claim that still needs review.
5. **Neutrality and fallacies:** points to language that may deserve closer examination and explains the reason for the signal.
6. **Topics and navigation:** groups recurring subjects and links findings back to the relevant part of the transcript.

The saved workspace preserves the structure of the session so the user can revisit a claim, correct a participant's name, inspect a source, or compare parts of the conversation later.

## Why we use multiple agents

Transcription, entity resolution, source research, claim verification, neutrality analysis, and fallacy detection are different jobs. In Context, specialized agents handle these jobs around a shared session. The transcript gives them a common timeline, and the orchestrator keeps their results connected to the relevant people and passages.

This separation also makes the interface easier to audit. A source appears with the claim it is meant to support. A neutrality or fallacy signal includes an explanation. A person or organization appears in the graph with the passage that introduced it. The user can inspect the chain instead of receiving a single opaque answer.

## A practical election use case

Suppose a candidate says that an indicator fell by 40%, attributes the result to a government program, and names an institution responsible for the data. Context can keep the exact passage in the transcript, add the candidate and institution to the graph, identify the numerical claim, and look for recent sources related to it.

A journalist can use the saved workspace as a reporting notebook. A researcher can compare recurring themes across an interview. A voter can return to the original wording instead of relying on a clipped quote or a summary posted later.

The same workflow applies to debates in Brazil, U.S. midterm interviews, legislative hearings, public meetings, and any conversation in which the relationship between a statement and its evidence matters.

## What it does not do

Context does not decide whether a candidate is trustworthy, infer hidden intentions, or tell anyone how to vote. Its analyses are automated and can be wrong. A transcript may mishear a name or number; an entity may be matched to the wrong person; a recent source may mention the same subject without proving the claim; and a neutrality or fallacy signal may depend on interpretation.

Treat every result as a path for closer inspection. The transcript, cited sources, and original recording remain more important than a label produced by the system.

You can [open Jiddu Context](/context) and start a session from your microphone or a browser tab.`,
        faq: [
          {
            question: "Does Jiddu Context decide whether a candidate is lying?",
            answer:
              "No. It identifies claims, looks for relevant sources, and shows the evidence it found. The user still needs to inspect whether the sources address the exact statement and whether the conclusion is justified.",
          },
          {
            question: "Can Context analyze a debate playing in my browser?",
            answer:
              "Yes. You can select a browser tab as the audio source. Context can also listen through the microphone for an in-person conversation or audio playing outside the browser.",
          },
          {
            question: "What can I review after the session ends?",
            answer:
              "You can revisit the transcript, identify speakers, inspect entities and relationships, open cited sources, and review the neutrality, fallacy, fact, and topic panels saved with the workspace.",
          },
        ],
        cta: {
          title: "Follow the next conversation with Context",
          description:
            "Choose your microphone or a browser tab and turn a live interview, debate, or public meeting into a workspace you can inspect.",
          label: "Open Jiddu Context",
        },
      },
      pt: {
        title:
          "O que é inteligência ao vivo — e como o Jiddu Context ajuda a acompanhar o discurso político em tempo real",
        seoTitle: "Jiddu Context: inteligência ao vivo para debates políticos",
        description:
          "Conheça o Jiddu Context, um workspace ao vivo que transcreve falas políticas e organiza entidades, afirmações, fontes, neutralidade e falácias.",
        excerpt:
          "O discurso político avança mais rápido que uma análise cuidadosa. O Jiddu Context transforma uma entrevista ou debate ao vivo em um workspace que você pode examinar enquanto a conversa acontece.",
        readingTime: "5 min de leitura",
        imageAlt:
          "Jiddu Context analisando uma entrevista política brasileira ao lado da transcrição, do grafo de entidades e dos painéis de fontes, neutralidade e falácias",
        thumbnailAlt:
          "Ondas sonoras abstratas atravessando lentes ópticas e se organizando em nós de contexto conectados",
        imageCaption:
          "O Jiddu Context acompanha uma entrevista com a transcrição, o grafo de entidades, as fontes e as análises de neutralidade e falácias na mesma sessão.",
        imageOpenLabel: "Abrir a imagem do Jiddu Context em alta resolução",
        body: `Uma entrevista política pode produzir dezenas de nomes, números, acusações, comparações e promessas em poucos minutos. Quando o espectador termina de pesquisar uma afirmação, a conversa já avançou.

O **Jiddu Context** transforma esse fluxo de falas em um workspace. Ele escuta pelo microfone ou por uma aba do navegador, transcreve a conversa, mapeia pessoas e organizações mencionadas e organiza afirmações, fontes, temas, sinais de neutralidade e possíveis falácias conforme a sessão se desenvolve.

> O Jiddu Context é um workspace de inteligência ao vivo, construído sobre uma arquitetura multiagente orquestrada.

## Por que lançar agora?

O próximo ciclo eleitoral colocará um grande volume de discurso político diante de eleitores, jornalistas, pesquisadores e observadores de campanha. O primeiro turno das Eleições Gerais de 2026 no Brasil será em **4 de outubro**, com eventual segundo turno em **25 de outubro**, segundo as [regras oficiais publicadas pelo Tribunal Superior Eleitoral](https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026). A próxima eleição federal geral dos Estados Unidos, que inclui as midterms, será em **3 de novembro**, segundo a [Federal Election Commission](https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/).

Nesse período, candidatos participarão de debates, entrevistas longas, coletivas de imprensa, podcasts, programas de rádio e transmissões ao vivo. Cada formato dificulta o acompanhamento cuidadoso: uma afirmação factual pode depender de uma estatística antiga, um nome pode se referir a várias pessoas e uma frase persuasiva pode parecer conclusiva sem apresentar evidências.

O Context mantém esses elementos visíveis sem obrigar o usuário a pausar a conversa e abrir uma sequência de pesquisas desconectadas.

## O que o Jiddu Context faz

Uma sessão do Context reúne diferentes formas de análise em torno da mesma transcrição:

1. **Transcrição ao vivo:** captura o áudio do microfone ou de uma aba do navegador e mantém a conversa legível enquanto ela acontece.
2. **Identificação de interlocutores:** separa quem falou e permite revisar os nomes depois da sessão.
3. **Grafo de contexto:** mapeia pessoas, organizações, instituições, eventos e as relações mencionadas na conversa.
4. **Afirmações e fontes:** detecta falas verificáveis, procura material de apoio e diferencia um veredito com fontes de uma afirmação que ainda precisa de revisão.
5. **Neutralidade e falácias:** aponta trechos cuja linguagem merece um exame mais atento e explica o motivo do sinal.
6. **Temas e navegação:** agrupa assuntos recorrentes e conecta os achados ao trecho correspondente da transcrição.

O workspace salvo preserva a estrutura da sessão para que o usuário possa retomar uma afirmação, corrigir o nome de um participante, examinar uma fonte ou comparar partes da conversa mais tarde.

## Por que usamos vários agentes

Transcrição, resolução de entidades, pesquisa de fontes, verificação de afirmações, análise de neutralidade e detecção de falácias são trabalhos diferentes. No Context, agentes especializados cuidam dessas tarefas em torno de uma sessão compartilhada. A transcrição oferece uma linha do tempo comum, e o orquestrador mantém os resultados ligados às pessoas e aos trechos relevantes.

Essa separação também facilita a auditoria da interface. Uma fonte aparece junto da afirmação que pretende sustentar. Um sinal de neutralidade ou falácia inclui uma explicação. Uma pessoa ou organização aparece no grafo com o trecho em que foi introduzida. O usuário consegue examinar esse encadeamento em vez de receber uma resposta única e opaca.

## Um exemplo prático nas eleições

Imagine que um candidato diga que um indicador caiu 40%, atribua o resultado a um programa de governo e cite a instituição responsável pelos dados. O Context pode manter a fala exata na transcrição, adicionar o candidato e a instituição ao grafo, identificar a afirmação numérica e procurar fontes recentes relacionadas a ela.

Um jornalista pode usar o workspace salvo como caderno de apuração. Um pesquisador pode comparar os temas recorrentes de uma entrevista. Um eleitor pode voltar às palavras originais sem depender de um corte ou de um resumo publicado depois.

O mesmo fluxo serve para debates no Brasil, entrevistas das midterms nos Estados Unidos, audiências legislativas, reuniões públicas e qualquer conversa em que a relação entre uma fala e sua evidência importe.

## O que ele não faz

O Context não decide se um candidato é confiável, não infere intenções ocultas e não diz a ninguém como votar. Suas análises são automatizadas e podem estar erradas. A transcrição pode confundir um nome ou número; uma entidade pode ser associada à pessoa errada; uma fonte recente pode mencionar o mesmo assunto sem comprovar a afirmação; e um sinal de neutralidade ou falácia pode depender de interpretação.

Trate cada resultado como um caminho para uma análise mais cuidadosa. A transcrição, as fontes citadas e a gravação original continuam sendo mais importantes que um rótulo produzido pelo sistema.

Você pode [abrir o Jiddu Context](/context) e iniciar uma sessão pelo microfone ou por uma aba do navegador.`,
        faq: [
          {
            question: "O Jiddu Context decide se um candidato está mentindo?",
            answer:
              "Não. Ele identifica afirmações, procura fontes relacionadas e mostra as evidências encontradas. O usuário ainda precisa examinar se as fontes respondem à fala exata e se a conclusão se sustenta.",
          },
          {
            question: "O Context consegue analisar um debate aberto no navegador?",
            answer:
              "Sim. Você pode selecionar uma aba do navegador como fonte do áudio. O Context também pode escutar pelo microfone uma conversa presencial ou um áudio reproduzido fora do navegador.",
          },
          {
            question: "O que posso revisar depois que a sessão termina?",
            answer:
              "Você pode retomar a transcrição, identificar os interlocutores, examinar entidades e relações, abrir as fontes citadas e revisar os painéis de neutralidade, falácias, fatos e temas salvos no workspace.",
          },
        ],
        cta: {
          title: "Acompanhe a próxima conversa com o Context",
          description:
            "Escolha o microfone ou uma aba do navegador e transforme uma entrevista, debate ou reunião pública ao vivo em um workspace que você pode examinar.",
          label: "Abrir o Jiddu Context",
        },
      },
      es: {
        title:
          "Qué es la inteligencia en vivo — y cómo Jiddu Context ayuda a seguir el discurso político en tiempo real",
        seoTitle: "Jiddu Context: inteligencia en vivo para debates políticos",
        description:
          "Conoce Jiddu Context, un workspace en vivo que transcribe discursos políticos y organiza entidades, afirmaciones, fuentes, neutralidad y falacias.",
        excerpt:
          "El discurso político avanza más rápido que un análisis cuidadoso. Jiddu Context convierte una entrevista o debate en vivo en un workspace que puedes examinar mientras ocurre la conversación.",
        readingTime: "5 min de lectura",
        imageAlt:
          "Jiddu Context analizando una entrevista política brasileña junto a la transcripción, el grafo de entidades y los paneles de fuentes, neutralidad y falacias",
        thumbnailAlt:
          "Ondas sonoras abstractas que atraviesan lentes ópticas y se organizan en nodos de contexto conectados",
        imageCaption:
          "Jiddu Context acompaña una entrevista con la transcripción, el grafo de entidades, las fuentes y los análisis de neutralidad y falacias en la misma sesión.",
        imageOpenLabel: "Abrir la imagen de Jiddu Context en alta resolución",
        body: `Una entrevista política puede producir decenas de nombres, cifras, acusaciones, comparaciones y promesas en pocos minutos. Cuando el espectador termina de buscar una afirmación, la conversación ya ha avanzado.

**Jiddu Context** convierte ese flujo de palabras en un workspace. Escucha a través del micrófono o de una pestaña del navegador, transcribe la conversación, mapea las personas y organizaciones mencionadas y organiza afirmaciones, fuentes, temas, señales de neutralidad y posibles falacias mientras se desarrolla la sesión.

> Jiddu Context es un workspace de inteligencia en vivo construido sobre una arquitectura multiagente orquestada.

## ¿Por qué lanzarlo ahora?

El próximo ciclo electoral pondrá un gran volumen de discurso político ante votantes, periodistas, investigadores y observadores de campaña. La primera vuelta de las Elecciones Generales de 2026 en Brasil será el **4 de octubre**, con una posible segunda vuelta el **25 de octubre**, según las [reglas oficiales publicadas por el Tribunal Superior Electoral](https://www.tse.jus.br/legislacao/compilada/res/2026/resolucao-no-23-751-de-26-de-fevereiro-de-2026). La próxima elección federal general de Estados Unidos, que incluye las midterms, será el **3 de noviembre**, según la [Federal Election Commission](https://www.fec.gov/introduction-campaign-finance/election-results-and-voting-information/).

Durante este periodo, los candidatos participarán en debates, entrevistas extensas, ruedas de prensa, pódcasts, programas de radio y transmisiones en vivo. Cada formato dificulta el seguimiento cuidadoso: una afirmación factual puede depender de una estadística antigua, un nombre puede referirse a varias personas y una frase persuasiva puede parecer concluyente sin presentar pruebas.

Context mantiene estos elementos visibles sin obligar al usuario a pausar la conversación y abrir una serie de búsquedas desconectadas.

## Lo que hace Jiddu Context

Una sesión de Context reúne distintas formas de análisis alrededor de la misma transcripción:

1. **Transcripción en vivo:** captura el audio del micrófono o de una pestaña del navegador y mantiene la conversación legible mientras ocurre.
2. **Identificación de interlocutores:** separa a quienes hablaron y permite revisar sus nombres después de la sesión.
3. **Grafo de contexto:** mapea personas, organizaciones, instituciones, eventos y las relaciones mencionadas en la conversación.
4. **Afirmaciones y fuentes:** detecta declaraciones verificables, busca material de apoyo y distingue un veredicto con fuentes de una afirmación que todavía necesita revisión.
5. **Neutralidad y falacias:** señala fragmentos cuyo lenguaje merece un examen más atento y explica el motivo de la señal.
6. **Temas y navegación:** agrupa asuntos recurrentes y conecta los hallazgos con el fragmento correspondiente de la transcripción.

El workspace guardado conserva la estructura de la sesión para que el usuario pueda retomar una afirmación, corregir el nombre de un participante, examinar una fuente o comparar partes de la conversación más adelante.

## Por qué usamos varios agentes

La transcripción, la resolución de entidades, la búsqueda de fuentes, la verificación de afirmaciones, el análisis de neutralidad y la detección de falacias son tareas diferentes. En Context, agentes especializados se ocupan de estos trabajos alrededor de una sesión compartida. La transcripción les da una línea de tiempo común y el orquestador mantiene los resultados conectados con las personas y los fragmentos relevantes.

Esta separación también facilita la auditoría de la interfaz. Una fuente aparece junto a la afirmación que pretende respaldar. Una señal de neutralidad o falacia incluye una explicación. Una persona u organización aparece en el grafo con el fragmento que la introdujo. El usuario puede examinar esta cadena en lugar de recibir una única respuesta opaca.

## Un ejemplo práctico durante las elecciones

Imagina que un candidato dice que un indicador cayó un 40 %, atribuye el resultado a un programa de gobierno y menciona la institución responsable de los datos. Context puede conservar las palabras exactas en la transcripción, añadir al candidato y a la institución al grafo, identificar la afirmación numérica y buscar fuentes recientes relacionadas con ella.

Un periodista puede usar el workspace guardado como cuaderno de investigación. Un investigador puede comparar los temas recurrentes de una entrevista. Un votante puede volver a las palabras originales sin depender de un recorte o de un resumen publicado después.

El mismo flujo sirve para debates en Brasil, entrevistas de las midterms en Estados Unidos, audiencias legislativas, reuniones públicas y cualquier conversación en la que importe la relación entre una declaración y sus pruebas.

## Lo que no hace

Context no decide si un candidato es confiable, no infiere intenciones ocultas ni le dice a nadie cómo votar. Sus análisis son automatizados y pueden equivocarse. La transcripción puede confundir un nombre o una cifra; una entidad puede asociarse con la persona equivocada; una fuente reciente puede mencionar el mismo asunto sin demostrar la afirmación; y una señal de neutralidad o falacia puede depender de la interpretación.

Trata cada resultado como un camino para un análisis más cuidadoso. La transcripción, las fuentes citadas y la grabación original siguen siendo más importantes que una etiqueta producida por el sistema.

Puedes [abrir Jiddu Context](/context) e iniciar una sesión desde el micrófono o una pestaña del navegador.`,
        faq: [
          {
            question: "¿Jiddu Context decide si un candidato está mintiendo?",
            answer:
              "No. Identifica afirmaciones, busca fuentes relacionadas y muestra las pruebas encontradas. El usuario todavía debe examinar si las fuentes responden a la declaración exacta y si la conclusión está justificada.",
          },
          {
            question: "¿Context puede analizar un debate abierto en el navegador?",
            answer:
              "Sí. Puedes seleccionar una pestaña del navegador como fuente de audio. Context también puede escuchar a través del micrófono una conversación presencial o un audio reproducido fuera del navegador.",
          },
          {
            question: "¿Qué puedo revisar después de que termina la sesión?",
            answer:
              "Puedes retomar la transcripción, identificar a los interlocutores, examinar entidades y relaciones, abrir las fuentes citadas y revisar los paneles de neutralidad, falacias, hechos y temas guardados en el workspace.",
          },
        ],
        cta: {
          title: "Sigue la próxima conversación con Context",
          description:
            "Elige el micrófono o una pestaña del navegador y convierte una entrevista, debate o reunión pública en vivo en un workspace que puedes examinar.",
          label: "Abrir Jiddu Context",
        },
      },
    },
  },
  {
    slug: "what-is-adversarial-review",
    publishedAt: "2026-08-02",
    updatedAt: "2026-08-02",
    author: "Jiddu",
    tags: ["adversarial-review", "academic-research", "responsible-ai"],
    image: {
      src: "/blog/adversarial-review-lenses.webp",
      width: 1728,
      height: 910,
      type: "image/webp",
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
          "Translucent lenses inspecting a layered paper structure from different angles and revealing weak and strong supports",
        imageCaption:
          "Adversarial review examines the same structure from several angles to find weak assumptions and reliable supports.",
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
          "Lentes translúcidas examinando uma estrutura de papel em camadas por diferentes ângulos e revelando apoios frágeis e sólidos",
        imageCaption:
          "A revisão adversarial examina a mesma estrutura por vários ângulos para encontrar premissas frágeis e apoios confiáveis.",
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
          "Lentes translúcidas que examinan una estructura de papel en capas desde distintos ángulos y revelan apoyos débiles y sólidos",
        imageCaption:
          "La revisión adversarial examina la misma estructura desde varios ángulos para encontrar premisas débiles y apoyos fiables.",
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
