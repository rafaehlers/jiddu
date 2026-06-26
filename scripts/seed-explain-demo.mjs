import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envUrl = process.env.DATABASE_URL;
const dbPath = envUrl
  ? envUrl.replace(/^file:/, "")
  : path.join(__dirname, "..", "dev.db");
const db = new Database(dbPath);

// One demo per locale. A short, accessible mini-paper with numbered sections
// (1 Introduction / 2 Methods / 3 …) so the demo shows BOTH features the
// explainer is built around: the hybrid section dividers on the left, and one
// explanation card per paragraph on the right. Seven paragraphs cover all
// seven section roles so the colour legend is fully populated.
const PROFILES = {
  en: {
    id: "demo-en",
    title: "Sleep and Memory Consolidation: A Brief Review",
    level: "undergrad",
    overview:
      "This short review explains how sleep helps the brain turn fresh, fragile memories into stable long-term ones. It walks through the evidence from sleep-deprivation experiments, the “replay” theory of what the sleeping brain is doing, and what researchers still don't know.",
    sections: [
      {
        heading: "1 Introduction",
        paragraphs: [
          {
            role: "background",
            text: "Every day the brain takes in far more information than it could ever keep. A long-standing puzzle in neuroscience is how the handful of experiences worth remembering get selected and made permanent, while everything else quietly fades.",
            explanation:
              "This sets up the problem the paper addresses: memory is selective. The authors frame “what makes some memories stick” as the open question — the gap the rest of the review sets out to fill.",
          },
          {
            role: "objective",
            text: "This review focuses on one part of the answer — the role of sleep in consolidating declarative memories, meaning the facts and events we can consciously recall.",
            explanation:
              "Here the authors narrow the scope. They aren't covering all memory; they ask specifically how sleep helps lock in declarative memories (facts and events), as opposed to skills or reflexes.",
          },
        ],
      },
      {
        heading: "2 Evidence from sleep deprivation",
        paragraphs: [
          {
            role: "method",
            text: "A standard experiment has volunteers learn a list of words or a spatial layout, then either sleep normally or stay awake before being tested the next day. Comparing the two groups isolates the effect of sleep itself.",
            explanation:
              "This explains how the field tests the idea. By keeping everything the same except whether people slept, any difference in the test score can be pinned on sleep rather than on the passage of time or fatigue.",
          },
          {
            role: "result",
            text: "People who sleep after learning reliably recall more than those kept awake for the same interval, even when both groups are equally rested at test time. The effect is strongest for the deep, slow-wave sleep that dominates the early night.",
            explanation:
              "This is the core finding: sleeping after studying measurably improves recall, and deep early-night sleep matters most. The “equally rested at test time” detail rules out the obvious objection that the awake group simply did worse because they were tired.",
          },
        ],
      },
      {
        heading: "3 The replay hypothesis",
        paragraphs: [
          {
            role: "interpretation",
            text: "Recordings in animals show that the same neurons that fire while exploring a maze fire again during later sleep — in the same order, but sped up. This “replay” is thought to be the brain rehearsing the day's experiences and filing them into long-term storage.",
            explanation:
              "This offers a mechanism for WHY sleep helps. The brain seems to replay the day's activity in fast-forward, interpreted as it practising and consolidating those memories — linking the behavioural result above to something happening in neurons.",
          },
        ],
      },
      {
        heading: "4 Open questions",
        paragraphs: [
          {
            role: "limitation",
            text: "It remains unclear how the brain chooses which memories to replay, and whether the same process applies as cleanly to skills and emotions as it does to facts. Most human evidence is correlational, so a firm causal claim is still debated.",
            explanation:
              "The authors are honest about the limits: the selection rule is unknown, the theory may not generalise, and human studies mostly show association rather than proof of cause. This tempers how strongly the conclusions can be stated.",
          },
          {
            role: "conclusion",
            text: "Even so, the convergence of behavioural, brain-imaging and animal evidence makes a strong case that sleep is not passive downtime but an active stage of memory formation — with real stakes for students and shift workers.",
            explanation:
              "The takeaway: despite the open questions, three independent lines of evidence point the same way, so the authors are confident sleep actively builds memory. They close by noting why it matters in practice.",
          },
        ],
      },
    ],
  },

  pt: {
    id: "demo-pt",
    title: "Sono e Consolidação da Memória: Uma Breve Revisão",
    level: "undergrad",
    overview:
      "Esta breve revisão explica como o sono ajuda o cérebro a transformar memórias novas e frágeis em memórias estáveis de longo prazo. Ela percorre as evidências de experimentos de privação de sono, a teoria do “replay” sobre o que o cérebro adormecido faz, e o que os pesquisadores ainda não sabem.",
    sections: [
      {
        heading: "1 Introdução",
        paragraphs: [
          {
            role: "background",
            text: "Todo dia o cérebro recebe muito mais informação do que jamais poderia guardar. Um enigma antigo da neurociência é como as poucas experiências que valem a pena lembrar são selecionadas e tornadas permanentes, enquanto todo o resto desaparece silenciosamente.",
            explanation:
              "Isto apresenta o problema do artigo: a memória é seletiva. Os autores definem “o que faz algumas memórias durarem” como a questão em aberto — a lacuna que o resto da revisão tenta preencher.",
          },
          {
            role: "objective",
            text: "Esta revisão foca em uma parte da resposta — o papel do sono na consolidação de memórias declarativas, ou seja, os fatos e eventos que conseguimos recordar conscientemente.",
            explanation:
              "Aqui os autores delimitam o escopo. Não tratam de toda a memória; perguntam especificamente como o sono ajuda a fixar memórias declarativas (fatos e eventos), e não habilidades ou reflexos.",
          },
        ],
      },
      {
        heading: "2 Evidências da privação de sono",
        paragraphs: [
          {
            role: "method",
            text: "Um experimento padrão pede que voluntários aprendam uma lista de palavras ou um mapa espacial e, então, durmam normalmente ou fiquem acordados antes de serem testados no dia seguinte. Comparar os dois grupos isola o efeito do próprio sono.",
            explanation:
              "Isto explica como a área testa a ideia. Mantendo tudo igual exceto se a pessoa dormiu, qualquer diferença na nota do teste pode ser atribuída ao sono, e não à passagem do tempo ou ao cansaço.",
          },
          {
            role: "result",
            text: "Quem dorme após aprender recorda de forma consistente mais do que quem ficou acordado pelo mesmo intervalo, mesmo quando ambos os grupos estão igualmente descansados na hora do teste. O efeito é mais forte para o sono profundo de ondas lentas, que domina o início da noite.",
            explanation:
              "Este é o achado central: dormir depois de estudar melhora a recordação de forma mensurável, e o sono profundo do começo da noite é o que mais importa. O detalhe “igualmente descansados no teste” afasta a objeção óbvia de que o grupo acordado só foi pior por estar cansado.",
          },
        ],
      },
      {
        heading: "3 A hipótese do replay",
        paragraphs: [
          {
            role: "interpretation",
            text: "Registros em animais mostram que os mesmos neurônios que disparam ao explorar um labirinto disparam novamente durante o sono posterior — na mesma ordem, mas acelerados. Acredita-se que esse “replay” seja o cérebro ensaiando as experiências do dia e arquivando-as na memória de longo prazo.",
            explanation:
              "Isto oferece um mecanismo para POR QUE o sono ajuda. O cérebro parece reproduzir a atividade do dia em câmera rápida, o que é interpretado como ele praticando e consolidando essas memórias — conectando o resultado comportamental acima a algo que acontece nos neurônios.",
          },
        ],
      },
      {
        heading: "4 Questões em aberto",
        paragraphs: [
          {
            role: "limitation",
            text: "Ainda não está claro como o cérebro escolhe quais memórias reproduzir, nem se o mesmo processo se aplica tão bem a habilidades e emoções quanto a fatos. A maior parte da evidência humana é correlacional, então uma afirmação causal firme ainda é debatida.",
            explanation:
              "Os autores são honestos quanto aos limites: a regra de seleção é desconhecida, a teoria pode não se generalizar, e os estudos humanos mostram sobretudo associação, não prova de causa. Isso modera o quão fortes podem ser as conclusões.",
          },
          {
            role: "conclusion",
            text: "Mesmo assim, a convergência de evidências comportamentais, de neuroimagem e em animais sustenta fortemente que o sono não é um tempo ocioso passivo, mas uma etapa ativa de formação de memória — com consequências reais para estudantes e trabalhadores de turno.",
            explanation:
              "A conclusão: apesar das questões em aberto, três linhas independentes de evidência apontam na mesma direção, então os autores confiam que o sono constrói memória ativamente. Encerram destacando por que isso importa na prática.",
          },
        ],
      },
    ],
  },

  es: {
    id: "demo-es",
    title: "Sueño y Consolidación de la Memoria: Una Breve Revisión",
    level: "undergrad",
    overview:
      "Esta breve revisión explica cómo el sueño ayuda al cerebro a convertir memorias nuevas y frágiles en memorias estables a largo plazo. Recorre la evidencia de experimentos de privación de sueño, la teoría del “replay” sobre qué hace el cerebro dormido, y lo que los investigadores aún no saben.",
    sections: [
      {
        heading: "1 Introducción",
        paragraphs: [
          {
            role: "background",
            text: "Cada día el cerebro recibe mucha más información de la que podría conservar. Un viejo enigma de la neurociencia es cómo se seleccionan y se hacen permanentes las pocas experiencias que vale la pena recordar, mientras todo lo demás se desvanece en silencio.",
            explanation:
              "Esto plantea el problema del artículo: la memoria es selectiva. Los autores definen “qué hace que algunas memorias perduren” como la pregunta abierta, el vacío que el resto de la revisión intenta llenar.",
          },
          {
            role: "objective",
            text: "Esta revisión se centra en una parte de la respuesta: el papel del sueño en la consolidación de las memorias declarativas, es decir, los hechos y eventos que podemos recordar conscientemente.",
            explanation:
              "Aquí los autores acotan el alcance. No abarcan toda la memoria; preguntan específicamente cómo el sueño ayuda a fijar memorias declarativas (hechos y eventos), y no habilidades o reflejos.",
          },
        ],
      },
      {
        heading: "2 Evidencia de la privación de sueño",
        paragraphs: [
          {
            role: "method",
            text: "Un experimento estándar pide a los voluntarios aprender una lista de palabras o un mapa espacial y luego dormir normalmente o permanecer despiertos antes de ser evaluados al día siguiente. Comparar ambos grupos aísla el efecto del propio sueño.",
            explanation:
              "Esto explica cómo el campo pone a prueba la idea. Manteniendo todo igual salvo si la persona durmió, cualquier diferencia en la prueba puede atribuirse al sueño y no al paso del tiempo o al cansancio.",
          },
          {
            role: "result",
            text: "Quienes duermen después de aprender recuerdan de forma fiable más que quienes permanecieron despiertos el mismo intervalo, incluso cuando ambos grupos están igual de descansados al momento de la prueba. El efecto es más fuerte para el sueño profundo de ondas lentas que domina el inicio de la noche.",
            explanation:
              "Este es el hallazgo central: dormir después de estudiar mejora el recuerdo de forma medible, y el sueño profundo del comienzo de la noche es el que más importa. El detalle “igual de descansados en la prueba” descarta la objeción obvia de que el grupo despierto rindió peor solo por estar cansado.",
          },
        ],
      },
      {
        heading: "3 La hipótesis del replay",
        paragraphs: [
          {
            role: "interpretation",
            text: "Registros en animales muestran que las mismas neuronas que se activan al explorar un laberinto se activan de nuevo durante el sueño posterior, en el mismo orden pero aceleradas. Se cree que este “replay” es el cerebro ensayando las experiencias del día y archivándolas en la memoria a largo plazo.",
            explanation:
              "Esto ofrece un mecanismo de POR QUÉ ayuda el sueño. El cerebro parece reproducir la actividad del día en cámara rápida, lo que se interpreta como que practica y consolida esas memorias, conectando el resultado conductual anterior con algo que ocurre en las neuronas.",
          },
        ],
      },
      {
        heading: "4 Preguntas abiertas",
        paragraphs: [
          {
            role: "limitation",
            text: "Sigue sin estar claro cómo elige el cerebro qué memorias reproducir, ni si el mismo proceso se aplica tan limpiamente a habilidades y emociones como a los hechos. La mayor parte de la evidencia humana es correlacional, así que una afirmación causal firme aún se debate.",
            explanation:
              "Los autores son honestos sobre los límites: la regla de selección se desconoce, la teoría podría no generalizarse, y los estudios humanos muestran sobre todo asociación, no prueba de causa. Esto modera cuán fuertes pueden ser las conclusiones.",
          },
          {
            role: "conclusion",
            text: "Aun así, la convergencia de evidencia conductual, de neuroimagen y en animales sostiene con fuerza que el sueño no es un tiempo muerto pasivo, sino una etapa activa de formación de memoria, con consecuencias reales para estudiantes y trabajadores por turnos.",
            explanation:
              "La conclusión: pese a las preguntas abiertas, tres líneas independientes de evidencia apuntan en la misma dirección, así que los autores confían en que el sueño construye memoria activamente. Cierran señalando por qué importa en la práctica.",
          },
        ],
      },
    ],
  },
};

// Build the source text + paragraph blocks + per-paragraph findings, mirroring
// what splitBlocks() + the explain route would produce for a real upload.
function build(profile) {
  let text = "";
  let cursor = 0;
  const blocks = [];
  const findings = [];
  let id = 0;
  let first = true;

  const append = (s) => {
    text += s;
    cursor += s.length;
  };

  for (const section of profile.sections) {
    if (!first) append("\n\n");
    first = false;
    append(section.heading);
    for (const p of section.paragraphs) {
      append("\n\n");
      const start = cursor;
      append(p.text);
      const end = cursor;
      const bid = `p${id++}`;
      blocks.push({ id: bid, start, end, text: p.text, section: section.heading });
      findings.push({ blockIds: [bid], role: p.role, explanation: p.explanation });
    }
  }

  return { text, blocks, findings };
}

const insert = db.prepare(`
  INSERT OR REPLACE INTO Explanation (
    id, status, source, sourceRef, title, text, language, provider, model,
    level, overview, blocks, findings, createdAt, finishedAt, reviewedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date().toISOString();

function seed(lang, profile) {
  const { text, blocks, findings } = build(profile);
  insert.run(
    profile.id,
    "complete",
    "paste",
    null,
    profile.title,
    text,
    lang,
    "openai",
    "demo",
    profile.level,
    profile.overview,
    JSON.stringify(blocks),
    JSON.stringify(findings),
    now,
    now,
    now, // reviewedAt — curated, no warning banner
  );
  console.log(`✓ Seeded /e/${profile.id} (${blocks.length} paragraphs)`);
}

for (const [lang, profile] of Object.entries(PROFILES)) {
  seed(lang, profile);
}

console.log("\nDone. Open /e/demo-en, /e/demo-pt, /e/demo-es.");
db.close();
