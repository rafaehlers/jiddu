import type { Lang } from "./fallacies";
import {
  normalizeLiveAnalysisConfig,
  type LiveAnalysisConfig,
  type LiveAnalysisParticipant,
  type LiveParticipantRole,
} from "./live-analysis-config";
import {
  EMPTY_LIVE_CONTEXT,
  type LiveContext,
  type LiveContextEntity,
} from "./live-context-schema";

const PARTICIPANT_DESCRIPTION: Record<
  Lang,
  Record<LiveParticipantRole, (name: string) => string>
> = {
  en: {
    primary_speaker: (name) => `${name} is the configured speaker for this speech.`,
    interviewer: (name) => `${name} is a configured interviewer in this session.`,
    interviewee: (name) => `${name} is a configured interviewee in this session.`,
    panelist: (name) => `${name} is a configured panelist in this session.`,
    participant: (name) => `${name} is a configured participant in this session.`,
  },
  pt: {
    primary_speaker: (name) => `${name} é o discursante configurado para esta análise.`,
    interviewer: (name) => `${name} é um entrevistador configurado nesta sessão.`,
    interviewee: (name) => `${name} é um entrevistado configurado nesta sessão.`,
    panelist: (name) => `${name} é um participante configurado neste painel.`,
    participant: (name) => `${name} é um participante configurado nesta sessão.`,
  },
  es: {
    primary_speaker: (name) => `${name} es el orador configurado para este discurso.`,
    interviewer: (name) => `${name} es un entrevistador configurado en esta sesión.`,
    interviewee: (name) => `${name} es un entrevistado configurado en esta sesión.`,
    panelist: (name) => `${name} es un panelista configurado en esta sesión.`,
    participant: (name) => `${name} es un participante configurado en esta sesión.`,
  },
};

export function createLiveContextForAnalysis(
  config: LiveAnalysisConfig,
  lang: Lang,
): LiveContext {
  return applyLiveAnalysisConfig(EMPTY_LIVE_CONTEXT, config, lang);
}

export function applyLiveAnalysisConfig(
  current: LiveContext,
  requestedConfig: LiveAnalysisConfig,
  lang: Lang,
): LiveContext {
  const config = normalizeLiveAnalysisConfig(requestedConfig, lang);
  const previousById = new Map(
    current.entities.map((entity) => [entity.id, entity]),
  );
  const participantEntities = config.participants.map((participant) =>
    participantEntity(participant, lang, previousById.get(participant.entityId)),
  );
  const generatedEntities = current.entities.filter(
    (entity) => !entity.userSupplied,
  );
  const entities = [...participantEntities, ...generatedEntities];
  const entityIds = new Set(entities.map((entity) => entity.id));
  return {
    ...current,
    analysisConfig: config,
    entities,
    relations: current.relations.filter(
      (relation) =>
        entityIds.has(relation.sourceEntityId) &&
        entityIds.has(relation.targetEntityId),
    ),
  };
}

function participantEntity(
  participant: LiveAnalysisParticipant,
  lang: Lang,
  previous?: LiveContextEntity,
): LiveContextEntity {
  return {
    ...previous,
    id: participant.entityId,
    name: participant.name,
    kind: "person",
    description: PARTICIPANT_DESCRIPTION[lang][participant.role](participant.name),
    aliases: previous?.aliases ?? [],
    sentenceIds: previous?.sentenceIds ?? [],
    confidence: 1,
    importance: participant.placeholder ? 0 : 1,
    participantRole: participant.role,
    userSupplied: true,
    placeholder: participant.placeholder,
  };
}
