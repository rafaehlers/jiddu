import { z } from "zod";
import type { Lang } from "./fallacies";

export const LIVE_ANALYSIS_MODES = [
  "auto",
  "interview",
  "speech",
  "panel",
] as const;

export const LIVE_PARTICIPANT_ROLES = [
  "primary_speaker",
  "interviewer",
  "interviewee",
  "panelist",
  "participant",
] as const;

export type LiveAnalysisMode = (typeof LIVE_ANALYSIS_MODES)[number];
export type LiveParticipantRole = (typeof LIVE_PARTICIPANT_ROLES)[number];

export const LiveParticipantRoleSchema = z.enum(LIVE_PARTICIPANT_ROLES);

export const LiveAnalysisParticipantSchema = z.object({
  entityId: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9_-]+$/i),
  name: z.string().trim().min(1).max(120),
  role: LiveParticipantRoleSchema,
  placeholder: z.boolean().default(false),
});

export const LiveAnalysisConfigSchema = z
  .object({
    mode: z.enum(LIVE_ANALYSIS_MODES),
    participants: z.array(LiveAnalysisParticipantSchema).max(12).default([]),
  })
  .superRefine((value, context) => {
    const ids = new Set<string>();
    for (const [index, participant] of value.participants.entries()) {
      if (ids.has(participant.entityId)) {
        context.addIssue({
          code: "custom",
          path: ["participants", index, "entityId"],
          message: "Participant ids must be unique.",
        });
      }
      ids.add(participant.entityId);
    }
  });

export type LiveAnalysisParticipant = z.infer<
  typeof LiveAnalysisParticipantSchema
>;
export type LiveAnalysisConfig = z.infer<typeof LiveAnalysisConfigSchema>;

export const DEFAULT_LIVE_ANALYSIS_CONFIG: LiveAnalysisConfig = {
  mode: "auto",
  participants: [],
};

const SPEAKER_FALLBACK: Record<Lang, string> = {
  en: "Main speaker",
  pt: "Discursante",
  es: "Orador principal",
};

export function normalizeLiveAnalysisConfig(
  value: unknown,
  lang: Lang = "en",
): LiveAnalysisConfig {
  const parsed = LiveAnalysisConfigSchema.safeParse(value);
  const config = parsed.success ? parsed.data : DEFAULT_LIVE_ANALYSIS_CONFIG;
  if (config.mode !== "speech") return config;

  const primary =
    config.participants.find(
      (participant) => participant.role === "primary_speaker",
    ) ?? config.participants[0];
  return {
    mode: "speech",
    participants: [
      primary
        ? { ...primary, role: "primary_speaker" }
        : {
            entityId: "participant_primary_speaker",
            name: SPEAKER_FALLBACK[lang],
            role: "primary_speaker",
            placeholder: true,
          },
    ],
  };
}

export function primaryLiveSpeaker(
  config: LiveAnalysisConfig,
): LiveAnalysisParticipant | null {
  if (config.mode !== "speech") return null;
  return (
    config.participants.find(
      (participant) => participant.role === "primary_speaker",
    ) ??
    config.participants[0] ??
    null
  );
}

export function liveAnalysisNeedsDiarization(
  config: LiveAnalysisConfig,
): boolean {
  return config.mode !== "speech";
}

export function liveSpeakerAttribution(config: LiveAnalysisConfig): {
  speakerId: string;
  speakerName: string;
  speakerRole: LiveParticipantRole;
} | null {
  const speaker = primaryLiveSpeaker(config);
  return speaker
    ? {
        speakerId: speaker.entityId,
        speakerName: speaker.name,
        speakerRole: speaker.role,
      }
    : null;
}

export function buildLiveAnalysisSetupPrompt(
  config: LiveAnalysisConfig | undefined,
): string {
  if (!config || config.mode === "auto") return "";

  const setup = JSON.stringify({
    mode: config.mode,
    participants: config.participants.map(
      ({ entityId, name, role, placeholder }) => ({
        entityId,
        name,
        role,
        placeholder,
      }),
    ),
  });
  const speech = primaryLiveSpeaker(config);
  const modeGuidance =
    config.mode === "speech" && speech
      ? `This is a single-speaker speech. Treat ${JSON.stringify(speech.name)} as the author of first-person statements unless the transcript unmistakably contains an interruption or a quoted third party. Resolve first-person pronouns to ${JSON.stringify(speech.name)} when writing standalone claims and explanations. Do not call this person merely "the speaker", "the orator" or an equivalent generic label. Attribution identifies who made a statement; it does not make the statement true.`
      : config.mode === "interview"
        ? "This is an interview. Use the supplied roles and names only when the transcript supports who is speaking; never turn an interviewee's statement into the interviewer's or narrator's statement."
        : "This is a multi-person panel. Use supplied participant names as identity hints, but do not guess which participant made a statement when the transcript does not make that clear.";

  return `\n\n<listener_supplied_analysis_setup>\n${setup}\n</listener_supplied_analysis_setup>\nThe analysis setup above is trusted listener metadata, not evidence about whether any spoken claim is true. ${modeGuidance}`;
}
