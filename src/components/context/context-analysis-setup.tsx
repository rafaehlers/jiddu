"use client";

import {
  MessageCircleMore,
  Mic2,
  Pencil,
  Plus,
  ScanSearch,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  normalizeLiveAnalysisConfig,
  type LiveAnalysisConfig,
  type LiveAnalysisMode,
  type LiveAnalysisParticipant,
  type LiveParticipantRole,
} from "@/lib/live-analysis-config";
import type { Lang } from "@/lib/fallacies";

type Action = "start" | "save";

type Props = {
  open: boolean;
  action: Action;
  config: LiveAnalysisConfig;
  lang: Lang;
  onClose: () => void;
  onConfirm: (config: LiveAnalysisConfig) => Promise<void> | void;
};

const MODE_ICONS = {
  interview: MessageCircleMore,
  speech: Mic2,
  panel: UsersRound,
  auto: ScanSearch,
} satisfies Record<LiveAnalysisMode, typeof Mic2>;

export function ContextAnalysisSetupDialog({
  open,
  action,
  config,
  lang,
  onClose,
  onConfirm,
}: Props) {
  const copy = analysisSetupCopy(lang);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initial = normalizeLiveAnalysisConfig(config, lang);
  const [mode, setMode] = useState<LiveAnalysisMode>(initial.mode);
  const [speakerName, setSpeakerName] = useState(
    initial.mode === "speech" && !initial.participants[0]?.placeholder
      ? initial.participants[0]?.name ?? ""
      : "",
  );
  const [interviewerName, setInterviewerName] = useState(
    participantName(initial, "interviewer"),
  );
  const [intervieweeName, setIntervieweeName] = useState(
    participantName(initial, "interviewee"),
  );
  const initialPanelNames = initial.participants
    .filter((participant) => participant.role === "panelist")
    .map((participant) => participant.name);
  const [panelNames, setPanelNames] = useState(
    initialPanelNames.length > 0 ? initialPanelNames : ["", ""],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  const selectedSummary = useMemo(
    () => copy.modes.find((candidate) => candidate.id === mode),
    [copy.modes, mode],
  );

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await onConfirm(
        createConfig({
          mode,
          speakerName,
          interviewerName,
          intervieweeName,
          panelNames,
          speakerFallback: copy.speakerFallback,
        }),
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : copy.saveError,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="context-analysis-setup-title"
      aria-describedby="context-analysis-setup-description"
      onClose={() => {
        if (open) onClose();
      }}
      onCancel={(event) => {
        if (saving) event.preventDefault();
      }}
      onClick={(event) => {
        if (!saving && event.target === dialogRef.current) onClose();
      }}
      className="m-auto max-h-[92vh] w-[min(94vw,46rem)] overflow-y-auto rounded-2xl border border-rule bg-background p-0 text-foreground shadow-2xl outline-none backdrop:bg-black/65 backdrop:backdrop-blur-md"
    >
      <div className="border-b border-rule px-5 py-4 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
            <ScanSearch className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="context-analysis-setup-title"
              className="font-serif text-2xl font-semibold"
            >
              {copy.title}
            </h2>
            <p
              id="context-analysis-setup-description"
              className="mt-1 text-sm leading-relaxed text-muted"
            >
              {copy.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label={copy.cancel}
            className="rounded-md p-1.5 text-muted hover:bg-paper hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-5 px-5 py-5 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-2">
          {copy.modes.map((candidate) => {
            const Icon = MODE_ICONS[candidate.id];
            const selected = mode === candidate.id;
            return (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={selected}
                data-testid={`analysis-mode-${candidate.id}`}
                onClick={() => setMode(candidate.id)}
                className={`flex min-h-24 items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                  selected
                    ? "border-accent bg-accent/10 ring-1 ring-accent/30"
                    : "border-rule bg-paper/40 hover:border-accent/50"
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-accent text-white" : "bg-background text-muted"}`}
                >
                  <Icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {candidate.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">
                    {candidate.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {mode === "speech" ? (
          <ParticipantField
            label={copy.speakerQuestion}
            hint={copy.speakerHint}
            placeholder={copy.speakerPlaceholder}
            value={speakerName}
            onChange={setSpeakerName}
          />
        ) : null}

        {mode === "interview" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <ParticipantField
              label={copy.interviewer}
              hint={copy.optionalName}
              placeholder={copy.namePlaceholder}
              value={interviewerName}
              onChange={setInterviewerName}
            />
            <ParticipantField
              label={copy.interviewee}
              hint={copy.optionalName}
              placeholder={copy.namePlaceholder}
              value={intervieweeName}
              onChange={setIntervieweeName}
            />
          </div>
        ) : null}

        {mode === "panel" ? (
          <div className="rounded-xl border border-rule bg-paper/35 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{copy.panelParticipants}</p>
                <p className="mt-0.5 text-xs text-muted">{copy.optionalNames}</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPanelNames((current) =>
                    current.length >= 12 ? current : [...current, ""],
                  )
                }
                disabled={panelNames.length >= 12}
                className="inline-flex items-center gap-1 rounded-md border border-rule bg-background px-2 py-1 text-xs hover:border-accent hover:text-accent disabled:opacity-50"
              >
                <Plus className="size-3" />
                {copy.addParticipant}
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {panelNames.map((name, index) => (
                <label
                  key={index}
                  className="flex items-center gap-1.5 text-xs text-muted"
                >
                  <span className="sr-only">
                    {copy.participant} {index + 1}
                  </span>
                  <input
                    value={name}
                    onChange={(event) =>
                      setPanelNames((current) =>
                        current.map((value, candidateIndex) =>
                          candidateIndex === index ? event.target.value : value,
                        ),
                      )
                    }
                    placeholder={`${copy.participant} ${index + 1}`}
                    className="h-9 min-w-0 flex-1 rounded-md border border-rule bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
                  />
                  {panelNames.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setPanelNames((current) =>
                          current.filter(
                            (_value, candidateIndex) => candidateIndex !== index,
                          ),
                        )
                      }
                      aria-label={copy.removeParticipant}
                      className="grid size-9 shrink-0 place-items-center rounded-md text-muted hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  ) : null}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-lg border border-accent/25 bg-accent/5 px-3 py-2.5 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-foreground">
            {selectedSummary?.label}:
          </span>{" "}
          {mode === "speech" ? copy.speechProcessing : copy.multiProcessing}
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-rule bg-paper/35 px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-md px-3 py-2 text-sm text-muted hover:bg-background hover:text-foreground disabled:opacity-50"
        >
          {copy.cancel}
        </button>
        <button
          type="button"
          onClick={() => void submit()}
          disabled={saving}
          className="inline-flex min-w-32 items-center justify-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {saving
            ? copy.saving
            : action === "start"
              ? copy.start
              : copy.save}
        </button>
      </div>
    </dialog>
  );
}

export function ContextAnalysisSetupButton({
  config,
  lang,
  onClick,
}: {
  config: LiveAnalysisConfig;
  lang: Lang;
  onClick: () => void;
}) {
  const copy = analysisSetupCopy(lang);
  const mode = copy.modes.find((candidate) => candidate.id === config.mode);
  const names = config.participants
    .filter((participant) => !participant.placeholder)
    .map((participant) => participant.name);
  return (
    <button
      type="button"
      onClick={onClick}
      title={copy.edit}
      className="inline-flex max-w-64 items-center gap-1.5 rounded-md border border-accent/30 bg-accent/5 px-2.5 py-1.5 text-xs text-foreground hover:border-accent hover:bg-accent/10"
    >
      <span className="truncate font-medium">
        {mode?.label ?? copy.auto}
        {names.length > 0 ? ` · ${names.join(", ")}` : ""}
      </span>
      <Pencil className="size-3 shrink-0 text-accent" />
    </button>
  );
}

export function participantRoleLabel(role: LiveParticipantRole, lang: Lang) {
  return analysisSetupCopy(lang).roles[role];
}

function ParticipantField({
  label,
  hint,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl border border-rule bg-paper/35 p-4">
      <span className="text-sm font-semibold">{label}</span>
      <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-3 h-10 w-full rounded-md border border-rule bg-background px-3 text-sm text-foreground outline-none focus:border-accent"
      />
    </label>
  );
}

function participantName(
  config: LiveAnalysisConfig,
  role: LiveParticipantRole,
) {
  return (
    config.participants.find((participant) => participant.role === role)?.name ??
    ""
  );
}

function createConfig(input: {
  mode: LiveAnalysisMode;
  speakerName: string;
  interviewerName: string;
  intervieweeName: string;
  panelNames: string[];
  speakerFallback: string;
}): LiveAnalysisConfig {
  if (input.mode === "auto") return { mode: "auto", participants: [] };
  if (input.mode === "speech") {
    const name = input.speakerName.trim();
    return {
      mode: "speech",
      participants: [
        {
          entityId: "participant_primary_speaker",
          name: name || input.speakerFallback,
          role: "primary_speaker",
          placeholder: !name,
        },
      ],
    };
  }
  if (input.mode === "interview") {
    return {
      mode: "interview",
      participants: [
        namedParticipant(
          "participant_interviewer",
          input.interviewerName,
          "interviewer",
        ),
        namedParticipant(
          "participant_interviewee",
          input.intervieweeName,
          "interviewee",
        ),
      ].filter(isParticipant),
    };
  }
  return {
    mode: "panel",
    participants: input.panelNames
      .map((name, index) =>
        namedParticipant(`participant_panelist_${index + 1}`, name, "panelist"),
      )
      .filter(isParticipant),
  };
}

function namedParticipant(
  entityId: string,
  name: string,
  role: LiveParticipantRole,
): LiveAnalysisParticipant | null {
  const normalized = name.trim();
  return normalized
    ? { entityId, name: normalized, role, placeholder: false }
    : null;
}

function isParticipant(
  participant: LiveAnalysisParticipant | null,
): participant is LiveAnalysisParticipant {
  return participant !== null;
}

function analysisSetupCopy(lang: Lang) {
  return {
    en: {
      title: "What kind of analysis is this?",
      description:
        "This helps Jiddu attribute statements, claims and connections to the right people.",
      modes: [
        { id: "interview", label: "Interview", description: "Two people: an interviewer and an interviewee." },
        { id: "speech", label: "Speech", description: "One main person addressing an audience." },
        { id: "panel", label: "Panel", description: "Several people participating in the discussion." },
        { id: "auto", label: "Detect automatically", description: "Use this when the format is uncertain." },
      ] as const,
      speakerQuestion: "Who is speaking?",
      speakerHint: "Recommended. A generic fallback is used if left blank.",
      speakerPlaceholder: "For example: Candidate Jane Smith",
      speakerFallback: "Main speaker",
      interviewer: "Interviewer",
      interviewee: "Interviewee",
      optionalName: "Name optional",
      optionalNames: "Add the names you already know. You can leave this blank.",
      namePlaceholder: "Name",
      panelParticipants: "Known panelists",
      addParticipant: "Add person",
      removeParticipant: "Remove person",
      participant: "Participant",
      speechProcessing: "speaker diarization will be skipped; interruptions should be handled by changing the mode.",
      multiProcessing: "speaker identification remains available when the recording ends.",
      start: "Start analysis",
      save: "Save configuration",
      saving: "Saving…",
      cancel: "Cancel",
      saveError: "The configuration could not be saved.",
      edit: "Edit analysis configuration",
      auto: "Automatic",
      roles: {
        primary_speaker: "Main speaker",
        interviewer: "Interviewer",
        interviewee: "Interviewee",
        panelist: "Panelist",
        participant: "Participant",
      },
    },
    pt: {
      title: "Que tipo de análise é esta?",
      description:
        "Isso ajuda o Jiddu a atribuir falas, afirmações e conexões às pessoas certas.",
      modes: [
        { id: "interview", label: "Entrevista", description: "Duas pessoas: entrevistador e entrevistado." },
        { id: "speech", label: "Discurso", description: "Uma pessoa principal falando para uma audiência." },
        { id: "panel", label: "Painel", description: "Várias pessoas participando da conversa." },
        { id: "auto", label: "Detectar automaticamente", description: "Use quando o formato não estiver claro." },
      ] as const,
      speakerQuestion: "Quem está discursando?",
      speakerHint: "Recomendado. Se ficar vazio, usaremos “Discursante”.",
      speakerPlaceholder: "Ex.: Candidato João Silva",
      speakerFallback: "Discursante",
      interviewer: "Entrevistador",
      interviewee: "Entrevistado",
      optionalName: "Nome opcional",
      optionalNames: "Adicione os nomes que já conhece ou deixe em branco.",
      namePlaceholder: "Nome",
      panelParticipants: "Participantes conhecidos",
      addParticipant: "Adicionar pessoa",
      removeParticipant: "Remover pessoa",
      participant: "Participante",
      speechProcessing: "a diarização será ignorada; se outra voz entrar, altere o tipo da análise.",
      multiProcessing: "a identificação de vozes continuará disponível ao encerrar a gravação.",
      start: "Iniciar análise",
      save: "Salvar configuração",
      saving: "Salvando…",
      cancel: "Cancelar",
      saveError: "Não foi possível salvar a configuração.",
      edit: "Editar configuração da análise",
      auto: "Automático",
      roles: {
        primary_speaker: "Discursante",
        interviewer: "Entrevistador",
        interviewee: "Entrevistado",
        panelist: "Participante do painel",
        participant: "Participante",
      },
    },
    es: {
      title: "¿Qué tipo de análisis es este?",
      description:
        "Esto ayuda a Jiddu a atribuir intervenciones, afirmaciones y conexiones a las personas correctas.",
      modes: [
        { id: "interview", label: "Entrevista", description: "Dos personas: entrevistador y entrevistado." },
        { id: "speech", label: "Discurso", description: "Una persona principal habla ante una audiencia." },
        { id: "panel", label: "Panel", description: "Varias personas participan en la conversación." },
        { id: "auto", label: "Detectar automáticamente", description: "Úsalo cuando el formato no esté claro." },
      ] as const,
      speakerQuestion: "¿Quién da el discurso?",
      speakerHint: "Recomendado. Si queda vacío, usaremos “Orador principal”.",
      speakerPlaceholder: "Ej.: Candidato Juan Pérez",
      speakerFallback: "Orador principal",
      interviewer: "Entrevistador",
      interviewee: "Entrevistado",
      optionalName: "Nombre opcional",
      optionalNames: "Añade los nombres que ya conoces o déjalo en blanco.",
      namePlaceholder: "Nombre",
      panelParticipants: "Panelistas conocidos",
      addParticipant: "Añadir persona",
      removeParticipant: "Eliminar persona",
      participant: "Participante",
      speechProcessing: "se omitirá la diarización; si interviene otra voz, cambia el tipo de análisis.",
      multiProcessing: "la identificación de voces seguirá disponible al finalizar la grabación.",
      start: "Iniciar análisis",
      save: "Guardar configuración",
      saving: "Guardando…",
      cancel: "Cancelar",
      saveError: "No se pudo guardar la configuración.",
      edit: "Editar configuración del análisis",
      auto: "Automático",
      roles: {
        primary_speaker: "Orador principal",
        interviewer: "Entrevistador",
        interviewee: "Entrevistado",
        panelist: "Panelista",
        participant: "Participante",
      },
    },
  }[lang];
}
