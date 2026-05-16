export type Lang = "en" | "pt" | "es";

export type FallacyDef = {
  id: string;
  category: "relevance" | "ambiguity" | "presumption" | "emotional" | "causal" | "evidence";
  color: string; // rgb(r, g, b)
  name: Record<Lang, string>;
  description: Record<Lang, string>;
  example: Record<Lang, string>;
};

// 28 colors distributed via the golden angle (137.5°) on the hue wheel.
// This guarantees that any small subset of fallacies in a single document gets
// maximally distinct colors — adjacent indices land on opposite sides of the
// wheel rather than clustering in one hue family.
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

const COLORS = Array.from({ length: 28 }, (_, n) =>
  hslToRgb((n * 137.5) % 360, 0.65, 0.58),
);

const FALLACIES_RAW: Omit<FallacyDef, "color">[] = [
  {
    id: "ad_hominem",
    category: "relevance",
    name: { en: "Ad hominem", pt: "Ad hominem", es: "Ad hominem" },
    description: {
      en: "Attacks the person making the argument rather than the argument itself.",
      pt: "Ataca a pessoa que faz o argumento em vez do argumento em si.",
      es: "Ataca a la persona que hace el argumento en lugar del argumento en sí.",
    },
    example: {
      en: "“You can't trust her economic analysis — she's never even had a real job.”",
      pt: "“Você não pode confiar na análise econômica dela — ela nunca teve um emprego de verdade.”",
      es: "“No puedes confiar en su análisis económico — nunca ha tenido un trabajo de verdad.”",
    },
  },
  {
    id: "straw_man",
    category: "relevance",
    name: { en: "Straw man", pt: "Espantalho", es: "Hombre de paja" },
    description: {
      en: "Misrepresents an opponent's position to make it easier to attack.",
      pt: "Distorce a posição do oponente para facilitar o ataque.",
      es: "Distorsiona la posición del oponente para facilitar el ataque.",
    },
    example: {
      en: "“So you're saying we should abolish all borders and let anyone in?” (when the proposal was only a visa reform).",
      pt: "“Então você está dizendo que devemos abolir todas as fronteiras e deixar qualquer um entrar?” (quando a proposta era só uma reforma de vistos).",
      es: "“¿Entonces dices que deberíamos abolir todas las fronteras y dejar entrar a cualquiera?” (cuando la propuesta era solo una reforma de visas).",
    },
  },
  {
    id: "appeal_to_authority",
    category: "evidence",
    name: { en: "Appeal to authority", pt: "Apelo à autoridade", es: "Apelación a la autoridad" },
    description: {
      en: "Uses an authority's opinion as evidence when the authority is irrelevant or biased.",
      pt: "Usa a opinião de uma autoridade como evidência quando a autoridade é irrelevante ou tendenciosa.",
      es: "Usa la opinión de una autoridad como evidencia cuando la autoridad es irrelevante o sesgada.",
    },
    example: {
      en: "“A Nobel laureate in physics says this diet works, so it must.”",
      pt: "“Um ganhador do Nobel de física disse que essa dieta funciona, então deve funcionar.”",
      es: "“Un premio Nobel de física dice que esta dieta funciona, así que debe funcionar.”",
    },
  },
  {
    id: "appeal_to_emotion",
    category: "emotional",
    name: { en: "Appeal to emotion", pt: "Apelo à emoção", es: "Apelación a la emoción" },
    description: {
      en: "Manipulates emotions in place of reasoned argument.",
      pt: "Manipula emoções em vez de oferecer um argumento racional.",
      es: "Manipula emociones en lugar de ofrecer un argumento razonado.",
    },
    example: {
      en: "“Think of the children who will suffer if this law passes!” (without showing it would actually harm them).",
      pt: "“Pense nas crianças que vão sofrer se essa lei passar!” (sem mostrar que de fato as prejudicaria).",
      es: "“¡Piensa en los niños que sufrirán si se aprueba esta ley!” (sin demostrar que realmente los perjudicaría).",
    },
  },
  {
    id: "appeal_to_fear",
    category: "emotional",
    name: { en: "Appeal to fear", pt: "Apelo ao medo", es: "Apelación al miedo" },
    description: {
      en: "Uses fear to drive acceptance of a claim.",
      pt: "Usa o medo para forçar a aceitação de uma afirmação.",
      es: "Usa el miedo para forzar la aceptación de una afirmación.",
    },
    example: {
      en: "“If we don't ban this, society will collapse within a year.”",
      pt: "“Se não banirmos isso, a sociedade vai entrar em colapso em um ano.”",
      es: "“Si no prohibimos esto, la sociedad colapsará en un año.”",
    },
  },
  {
    id: "appeal_to_popularity",
    category: "evidence",
    name: {
      en: "Appeal to popularity (ad populum)",
      pt: "Apelo à popularidade",
      es: "Apelación a la popularidad",
    },
    description: {
      en: "Claims something is true because many people believe it.",
      pt: "Afirma que algo é verdadeiro porque muitas pessoas acreditam nisso.",
      es: "Afirma que algo es verdad porque muchas personas lo creen.",
    },
    example: {
      en: "“Millions of people use this app, so it must be the best.”",
      pt: "“Milhões usam esse aplicativo, então ele deve ser o melhor.”",
      es: "“Millones de personas usan esta aplicación, así que debe ser la mejor.”",
    },
  },
  {
    id: "appeal_to_tradition",
    category: "evidence",
    name: { en: "Appeal to tradition", pt: "Apelo à tradição", es: "Apelación a la tradición" },
    description: {
      en: "Argues something is correct because it has been done that way.",
      pt: "Argumenta que algo é correto porque sempre foi feito daquele jeito.",
      es: "Argumenta que algo es correcto porque siempre se ha hecho así.",
    },
    example: {
      en: "“We've always done it this way; there's no reason to change.”",
      pt: "“Sempre fizemos assim; não há motivo para mudar.”",
      es: "“Siempre lo hemos hecho así; no hay razón para cambiar.”",
    },
  },
  {
    id: "appeal_to_nature",
    category: "presumption",
    name: { en: "Appeal to nature", pt: "Apelo à natureza", es: "Apelación a la naturaleza" },
    description: {
      en: "Argues something is good because it is natural (or bad because unnatural).",
      pt: "Argumenta que algo é bom porque é natural (ou ruim por não ser).",
      es: "Argumenta que algo es bueno porque es natural (o malo por no serlo).",
    },
    example: {
      en: "“This remedy is natural, so it's safer than any drug.”",
      pt: "“Esse remédio é natural, então é mais seguro que qualquer medicamento.”",
      es: "“Este remedio es natural, así que es más seguro que cualquier medicamento.”",
    },
  },
  {
    id: "false_dichotomy",
    category: "presumption",
    name: { en: "False dichotomy", pt: "Falso dilema", es: "Falso dilema" },
    description: {
      en: "Presents only two options when more exist.",
      pt: "Apresenta apenas duas opções quando existem mais.",
      es: "Presenta solo dos opciones cuando existen más.",
    },
    example: {
      en: "“Either you're with us or you're against us.”",
      pt: "“Ou você está conosco ou está contra nós.”",
      es: "“O estás con nosotros o estás contra nosotros.”",
    },
  },
  {
    id: "slippery_slope",
    category: "causal",
    name: { en: "Slippery slope", pt: "Bola de neve", es: "Pendiente resbaladiza" },
    description: {
      en: "Asserts that one small step leads inevitably to extreme consequences without justification.",
      pt: "Afirma que um pequeno passo leva inevitavelmente a consequências extremas sem justificar.",
      es: "Afirma que un pequeño paso lleva inevitablemente a consecuencias extremas sin justificarlo.",
    },
    example: {
      en: "“If we let students retake one exam, soon they'll demand to retake everything.”",
      pt: "“Se deixarmos os alunos refazerem uma prova, logo vão querer refazer tudo.”",
      es: "“Si dejamos a los estudiantes repetir un examen, pronto querrán repetirlo todo.”",
    },
  },
  {
    id: "hasty_generalization",
    category: "evidence",
    name: {
      en: "Hasty generalization",
      pt: "Generalização apressada",
      es: "Generalización apresurada",
    },
    description: {
      en: "Draws a broad conclusion from a small or biased sample.",
      pt: "Tira uma conclusão ampla a partir de uma amostra pequena ou tendenciosa.",
      es: "Saca una conclusión amplia a partir de una muestra pequeña o sesgada.",
    },
    example: {
      en: "“I met two rude tourists from there — people from that country are rude.”",
      pt: "“Conheci dois turistas grossos de lá — gente desse país é grossa.”",
      es: "“Conocí a dos turistas groseros de allá — la gente de ese país es grosera.”",
    },
  },
  {
    id: "anecdotal",
    category: "evidence",
    name: { en: "Anecdotal evidence", pt: "Evidência anedótica", es: "Evidencia anecdótica" },
    description: {
      en: "Uses a personal experience or isolated example as if it were conclusive.",
      pt: "Usa uma experiência pessoal ou exemplo isolado como se fosse conclusivo.",
      es: "Usa una experiencia personal o ejemplo aislado como si fuera concluyente.",
    },
    example: {
      en: "“My grandfather smoked his whole life and lived to 95, so smoking isn't that bad.”",
      pt: "“Meu avô fumou a vida toda e viveu até 95, então fumar não é tão ruim.”",
      es: "“Mi abuelo fumó toda su vida y vivió hasta los 95, así que fumar no es tan malo.”",
    },
  },
  {
    id: "post_hoc",
    category: "causal",
    name: {
      en: "Post hoc ergo propter hoc",
      pt: "Post hoc (causa falsa)",
      es: "Post hoc (causa falsa)",
    },
    description: {
      en: "Assumes that because B followed A, A caused B.",
      pt: "Assume que, como B veio depois de A, A causou B.",
      es: "Asume que como B vino después de A, A causó B.",
    },
    example: {
      en: "“I wore my lucky socks and we won — they bring victory.”",
      pt: "“Coloquei minha meia da sorte e ganhamos — ela traz vitória.”",
      es: "“Me puse mis calcetines de la suerte y ganamos — traen victoria.”",
    },
  },
  {
    id: "correlation_causation",
    category: "causal",
    name: {
      en: "Correlation ≠ causation",
      pt: "Correlação vs. causalidade",
      es: "Correlación vs. causalidad",
    },
    description: {
      en: "Treats a correlation as proof of causation.",
      pt: "Trata uma correlação como prova de causalidade.",
      es: "Trata una correlación como prueba de causalidad.",
    },
    example: {
      en: "“Ice cream sales correlate with drownings, so ice cream causes drowning.”",
      pt: "“Vendas de sorvete correlacionam com afogamentos, logo sorvete causa afogamento.”",
      es: "“Las ventas de helado se correlacionan con los ahogamientos, así que el helado los causa.”",
    },
  },
  {
    id: "circular_reasoning",
    category: "presumption",
    name: { en: "Circular reasoning", pt: "Raciocínio circular", es: "Razonamiento circular" },
    description: {
      en: "The conclusion is included in the premise (begging the question).",
      pt: "A conclusão já está embutida na premissa (petição de princípio).",
      es: "La conclusión ya está incluida en la premisa (petición de principio).",
    },
    example: {
      en: "“This translation is accurate because it says exactly what the original says.”",
      pt: "“Essa tradução é precisa porque diz exatamente o que o original diz.”",
      es: "“Esta traducción es precisa porque dice exactamente lo que dice el original.”",
    },
  },
  {
    id: "loaded_question",
    category: "presumption",
    name: { en: "Loaded question", pt: "Pergunta carregada", es: "Pregunta cargada" },
    description: {
      en: "Phrases a question to presuppose an unproven claim.",
      pt: "Formula uma pergunta de modo a pressupor uma afirmação não provada.",
      es: "Formula una pregunta de modo que presuponga una afirmación no probada.",
    },
    example: {
      en: "“Have you stopped lying to your team?”",
      pt: "“Você parou de mentir para o seu time?”",
      es: "“¿Has dejado de mentirle a tu equipo?”",
    },
  },
  {
    id: "red_herring",
    category: "relevance",
    name: { en: "Red herring", pt: "Pista falsa", es: "Pista falsa" },
    description: {
      en: "Diverts attention from the issue with an irrelevant topic.",
      pt: "Desvia a atenção do assunto com um tópico irrelevante.",
      es: "Desvía la atención del tema con un asunto irrelevante.",
    },
    example: {
      en: "“Why worry about climate change when we still have unemployment?”",
      pt: "“Por que se preocupar com mudança climática se ainda temos desemprego?”",
      es: "“¿Por qué preocuparse por el cambio climático si aún tenemos desempleo?”",
    },
  },
  {
    id: "tu_quoque",
    category: "relevance",
    name: { en: "Tu quoque", pt: "Tu quoque", es: "Tu quoque" },
    description: {
      en: "Rejects criticism by pointing to similar behavior by the critic.",
      pt: "Rejeita a crítica apontando comportamento semelhante de quem critica.",
      es: "Rechaza la crítica señalando un comportamiento similar del crítico.",
    },
    example: {
      en: "“You can't tell me to quit smoking — you used to smoke too.”",
      pt: "“Você não pode me dizer para parar de fumar — você também fumava.”",
      es: "“No puedes decirme que deje de fumar — tú también fumabas.”",
    },
  },
  {
    id: "no_true_scotsman",
    category: "ambiguity",
    name: {
      en: "No true Scotsman",
      pt: "Falácia do verdadeiro escocês",
      es: "Falacia del verdadero escocés",
    },
    description: {
      en: "Redefines a category ad hoc to exclude counterexamples.",
      pt: "Redefine uma categoria de modo ad hoc para excluir contraexemplos.",
      es: "Redefine una categoría ad hoc para excluir contraejemplos.",
    },
    example: {
      en: "“No real engineer would skip code review.” “But Alice did.” “Then she's not a real engineer.”",
      pt: "“Nenhum engenheiro de verdade pula code review.” “Mas a Alice pulou.” “Então ela não é uma engenheira de verdade.”",
      es: "“Ningún ingeniero de verdad omite la revisión de código.” “Pero Alice lo hizo.” “Entonces no es una ingeniera de verdad.”",
    },
  },
  {
    id: "equivocation",
    category: "ambiguity",
    name: { en: "Equivocation", pt: "Equivocação", es: "Equívoco" },
    description: {
      en: "Uses a key term in two different senses within the same argument.",
      pt: "Usa um termo-chave em dois sentidos distintos dentro do mesmo argumento.",
      es: "Usa un término clave en dos sentidos distintos dentro del mismo argumento.",
    },
    example: {
      en: "“The law of gravity is just a theory, like the theory that the Earth is flat.”",
      pt: "“A lei da gravidade é só uma teoria, como a teoria de que a Terra é plana.”",
      es: "“La ley de la gravedad es solo una teoría, como la teoría de que la Tierra es plana.”",
    },
  },
  {
    id: "false_equivalence",
    category: "ambiguity",
    name: { en: "False equivalence", pt: "Falsa equivalência", es: "Falsa equivalencia" },
    description: {
      en: "Treats two things as comparable when they differ in important ways.",
      pt: "Trata duas coisas como comparáveis quando elas diferem em pontos importantes.",
      es: "Trata dos cosas como comparables cuando difieren en aspectos importantes.",
    },
    example: {
      en: "“Saying mean things online is just like physical assault.”",
      pt: "“Dizer coisas ofensivas online é igual a agressão física.”",
      es: "“Decir cosas ofensivas en línea es como una agresión física.”",
    },
  },
  {
    id: "moving_goalposts",
    category: "presumption",
    name: {
      en: "Moving the goalposts",
      pt: "Mudar os critérios",
      es: "Mover la portería",
    },
    description: {
      en: "Demands more evidence after the original demand was met.",
      pt: "Exige mais evidência depois que a demanda original foi atendida.",
      es: "Exige más evidencia después de que la demanda original fue satisfecha.",
    },
    example: {
      en: "After being shown peer-reviewed studies: “Yeah, but who funded them?”",
      pt: "Depois de ver estudos revisados por pares: “Tá, mas quem financiou?”",
      es: "Tras ver estudios revisados por pares: “Sí, pero ¿quién los financió?”",
    },
  },
  {
    id: "burden_of_proof",
    category: "presumption",
    name: {
      en: "Burden of proof shifting",
      pt: "Inversão do ônus da prova",
      es: "Inversión de la carga de la prueba",
    },
    description: {
      en: "Demands the opponent disprove the claim instead of proving it.",
      pt: "Exige que o oponente refute a afirmação em vez de prová-la.",
      es: "Exige que el oponente refute la afirmación en lugar de probarla.",
    },
    example: {
      en: "“Prove ghosts don't exist.”",
      pt: "“Prove que fantasmas não existem.”",
      es: "“Prueba que los fantasmas no existen.”",
    },
  },
  {
    id: "cherry_picking",
    category: "evidence",
    name: { en: "Cherry picking", pt: "Seleção tendenciosa", es: "Selección sesgada" },
    description: {
      en: "Highlights only data that supports the claim, ignoring contradicting evidence.",
      pt: "Destaca apenas os dados que apoiam a tese e ignora os contrários.",
      es: "Destaca solo los datos que apoyan la tesis e ignora los contrarios.",
    },
    example: {
      en: "Quoting the one quarter when revenue grew, ignoring the four it shrank.",
      pt: "Citar o único trimestre em que a receita cresceu, ignorando os quatro em que caiu.",
      es: "Citar el único trimestre en que ingresos crecieron, ignorando los cuatro en que cayeron.",
    },
  },
  {
    id: "bandwagon",
    category: "emotional",
    name: { en: "Bandwagon", pt: "Efeito manada", es: "Efecto bandwagon" },
    description: {
      en: "Argues that one should adopt a position because it is gaining popularity.",
      pt: "Argumenta que se deve adotar uma posição porque ela está ganhando popularidade.",
      es: "Argumenta que uno debe adoptar una postura porque está ganando popularidad.",
    },
    example: {
      en: "“Everyone is moving to this framework — we should too.”",
      pt: "“Todo mundo está migrando para esse framework — devíamos migrar também.”",
      es: "“Todos están migrando a este framework — nosotros también deberíamos.”",
    },
  },
  {
    id: "genetic_fallacy",
    category: "relevance",
    name: { en: "Genetic fallacy", pt: "Falácia genética", es: "Falacia genética" },
    description: {
      en: "Judges a claim by its origin rather than its content.",
      pt: "Avalia uma afirmação pela sua origem, não pelo conteúdo.",
      es: "Juzga una afirmación por su origen, no por su contenido.",
    },
    example: {
      en: "“That study is from a tobacco-funded lab, so it's worthless.” (without engaging with the data).",
      pt: "“Esse estudo é de um laboratório financiado pela indústria do tabaco, então não vale nada.” (sem discutir os dados).",
      es: "“Ese estudio es de un laboratorio financiado por tabacaleras, así que no vale.” (sin discutir los datos).",
    },
  },
  {
    id: "appeal_to_ignorance",
    category: "evidence",
    name: {
      en: "Appeal to ignorance",
      pt: "Apelo à ignorância",
      es: "Apelación a la ignorancia",
    },
    description: {
      en: "Claims something is true because it has not been proven false (or vice versa).",
      pt: "Afirma que algo é verdadeiro porque não foi provado falso (ou vice-versa).",
      es: "Afirma que algo es verdadero porque no se ha probado lo contrario (o viceversa).",
    },
    example: {
      en: "“No one has proven aliens don't visit Earth, so they must.”",
      pt: "“Ninguém provou que alienígenas não nos visitam, então devem visitar.”",
      es: "“Nadie ha probado que los alienígenas no nos visitan, así que deben hacerlo.”",
    },
  },
  {
    id: "non_sequitur",
    category: "relevance",
    name: { en: "Non sequitur", pt: "Non sequitur", es: "Non sequitur" },
    description: {
      en: "The conclusion does not follow from the premises.",
      pt: "A conclusão não decorre das premissas.",
      es: "La conclusión no se sigue de las premisas.",
    },
    example: {
      en: "“She runs marathons, so she'd make a great manager.”",
      pt: "“Ela corre maratonas, então será uma ótima gerente.”",
      es: "“Ella corre maratones, así que sería una gran gerente.”",
    },
  },
];

export const FALLACIES: FallacyDef[] = FALLACIES_RAW.map((f, i) => ({
  ...f,
  color: COLORS[i % COLORS.length],
}));

export const FALLACY_IDS = FALLACIES.map((f) => f.id);
export const FALLACY_BY_ID = Object.fromEntries(FALLACIES.map((f) => [f.id, f]));

export const CATEGORY_LABELS: Record<FallacyDef["category"], Record<Lang, string>> = {
  relevance: {
    en: "Relevance",
    pt: "Relevância",
    es: "Relevancia",
  },
  ambiguity: {
    en: "Ambiguity",
    pt: "Ambiguidade",
    es: "Ambigüedad",
  },
  presumption: {
    en: "Presumption",
    pt: "Presunção",
    es: "Presunción",
  },
  emotional: {
    en: "Emotional appeals",
    pt: "Apelos emocionais",
    es: "Apelaciones emocionales",
  },
  causal: {
    en: "Causal reasoning",
    pt: "Raciocínio causal",
    es: "Razonamiento causal",
  },
  evidence: {
    en: "Evidence",
    pt: "Evidência",
    es: "Evidencia",
  },
};
