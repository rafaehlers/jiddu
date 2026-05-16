export type FallacyDef = {
  id: string;
  name: string;
  namePt: string;
  category: "relevance" | "ambiguity" | "presumption" | "emotional" | "causal" | "evidence";
  description: string;
};

export const FALLACIES: FallacyDef[] = [
  { id: "ad_hominem", name: "Ad hominem", namePt: "Ad hominem", category: "relevance",
    description: "Attacks the person making the argument rather than the argument itself." },
  { id: "straw_man", name: "Straw man", namePt: "Espantalho", category: "relevance",
    description: "Misrepresents an opponent's position to make it easier to attack." },
  { id: "appeal_to_authority", name: "Appeal to authority", namePt: "Apelo à autoridade", category: "evidence",
    description: "Uses an authority's opinion as evidence when the authority is irrelevant or biased." },
  { id: "appeal_to_emotion", name: "Appeal to emotion", namePt: "Apelo à emoção", category: "emotional",
    description: "Manipulates emotions in place of reasoned argument." },
  { id: "appeal_to_fear", name: "Appeal to fear", namePt: "Apelo ao medo", category: "emotional",
    description: "Uses fear to drive acceptance of a claim." },
  { id: "appeal_to_popularity", name: "Appeal to popularity (ad populum)", namePt: "Apelo à popularidade", category: "evidence",
    description: "Claims something is true because many people believe it." },
  { id: "appeal_to_tradition", name: "Appeal to tradition", namePt: "Apelo à tradição", category: "evidence",
    description: "Argues something is correct because it has been done that way." },
  { id: "appeal_to_nature", name: "Appeal to nature", namePt: "Apelo à natureza", category: "presumption",
    description: "Argues something is good because it is natural (or bad because unnatural)." },
  { id: "false_dichotomy", name: "False dichotomy", namePt: "Falso dilema", category: "presumption",
    description: "Presents only two options when more exist." },
  { id: "slippery_slope", name: "Slippery slope", namePt: "Bola de neve", category: "causal",
    description: "Asserts that one small step leads inevitably to extreme consequences without justification." },
  { id: "hasty_generalization", name: "Hasty generalization", namePt: "Generalização apressada", category: "evidence",
    description: "Draws a broad conclusion from a small or biased sample." },
  { id: "anecdotal", name: "Anecdotal evidence", namePt: "Evidência anedótica", category: "evidence",
    description: "Uses a personal experience or isolated example as if it were conclusive." },
  { id: "post_hoc", name: "Post hoc ergo propter hoc", namePt: "Post hoc (causa falsa)", category: "causal",
    description: "Assumes that because B followed A, A caused B." },
  { id: "correlation_causation", name: "Correlation ≠ causation", namePt: "Correlação vs. causalidade", category: "causal",
    description: "Treats a correlation as proof of causation." },
  { id: "circular_reasoning", name: "Circular reasoning", namePt: "Raciocínio circular", category: "presumption",
    description: "The conclusion is included in the premise (begging the question)." },
  { id: "loaded_question", name: "Loaded question", namePt: "Pergunta carregada", category: "presumption",
    description: "Phrases a question to presuppose an unproven claim." },
  { id: "red_herring", name: "Red herring", namePt: "Pista falsa", category: "relevance",
    description: "Diverts attention from the issue with an irrelevant topic." },
  { id: "tu_quoque", name: "Tu quoque", namePt: "Tu quoque", category: "relevance",
    description: "Rejects criticism by pointing to similar behavior by the critic." },
  { id: "no_true_scotsman", name: "No true Scotsman", namePt: "Falácia do verdadeiro escocês", category: "ambiguity",
    description: "Redefines a category ad hoc to exclude counterexamples." },
  { id: "equivocation", name: "Equivocation", namePt: "Equivocação", category: "ambiguity",
    description: "Uses a key term in two different senses within the same argument." },
  { id: "false_equivalence", name: "False equivalence", namePt: "Falsa equivalência", category: "ambiguity",
    description: "Treats two things as comparable when they differ in important ways." },
  { id: "moving_goalposts", name: "Moving the goalposts", namePt: "Mudar os critérios", category: "presumption",
    description: "Demands more evidence after the original demand was met." },
  { id: "burden_of_proof", name: "Burden of proof shifting", namePt: "Inversão do ônus da prova", category: "presumption",
    description: "Demands the opponent disprove the claim instead of proving it." },
  { id: "cherry_picking", name: "Cherry picking", namePt: "Seleção tendenciosa", category: "evidence",
    description: "Highlights only data that supports the claim, ignoring contradicting evidence." },
  { id: "bandwagon", name: "Bandwagon", namePt: "Efeito manada", category: "emotional",
    description: "Argues that one should adopt a position because it is gaining popularity." },
  { id: "genetic_fallacy", name: "Genetic fallacy", namePt: "Falácia genética", category: "relevance",
    description: "Judges a claim by its origin rather than its content." },
  { id: "appeal_to_ignorance", name: "Appeal to ignorance", namePt: "Apelo à ignorância", category: "evidence",
    description: "Claims something is true because it has not been proven false (or vice versa)." },
  { id: "non_sequitur", name: "Non sequitur", namePt: "Non sequitur", category: "relevance",
    description: "The conclusion does not follow from the premises." },
];

export const FALLACY_IDS = FALLACIES.map((f) => f.id);
export const FALLACY_BY_ID = Object.fromEntries(FALLACIES.map((f) => [f.id, f]));
