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
  imageOpenLabel?: string;
  body: string;
  faq: BlogFaq[];
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
