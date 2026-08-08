"use client";

import { Check, Download, ExternalLink, Loader2, Save, Users } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  calculateLiveDiarizationSettlement,
  type LiveDiarizationBillingConfig,
} from "@/lib/live-diarization-billing";
import {
  formatDiarizationTimestamp,
  groupDiarizedSegments,
  MAX_DIARIZATION_AUDIO_BYTES,
  sanitizeDiarizationResult,
  type DiarizationResult,
} from "@/lib/live/diarization";

type Props = {
  audioBlob: Blob;
  audioUrl: string;
  billingConfig: LiveDiarizationBillingConfig;
  downloadFilename: string;
  durationMs: number;
  resourceId?: string | null;
  audioRef?: RefObject<HTMLAudioElement | null>;
  compact?: boolean;
};

type DiarizationStatus = "idle" | "loading" | "complete" | "error";
type SaveStatus = "idle" | "saving" | "saved" | "error";

const CREDIT_EXAMPLE_MINUTES = [1, 5, 10, 30, 60] as const;

export function SessionAudioTools({
  audioBlob,
  audioUrl,
  billingConfig,
  downloadFilename,
  durationMs,
  resourceId,
  audioRef,
  compact = false,
}: Props) {
  const { t } = useI18n();
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const resolvedAudioRef = audioRef ?? internalAudioRef;
  const confirmationRef = useRef<HTMLDialogElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [status, setStatus] = useState<DiarizationStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [result, setResult] = useState<DiarizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speakerNames, setSpeakerNames] = useState<Record<string, string>>({});
  const recordingTooLarge = audioBlob.size > MAX_DIARIZATION_AUDIO_BYTES;
  const estimatedCredits = useMemo(
    () =>
      calculateLiveDiarizationSettlement(durationMs / 1_000, billingConfig)
        .credits,
    [billingConfig, durationMs],
  );
  const creditExamples = useMemo(
    () =>
      CREDIT_EXAMPLE_MINUTES.map((minutes) => ({
        minutes,
        credits: calculateLiveDiarizationSettlement(
          minutes * 60,
          billingConfig,
        ).credits,
      })),
    [billingConfig],
  );
  const turns = useMemo(
    () => groupDiarizedSegments(result?.segments ?? []),
    [result],
  );
  const speakers = useMemo(
    () => Array.from(new Set(result?.segments.map((segment) => segment.speaker))),
    [result],
  );

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const dialog = confirmationRef.current;
    if (!dialog) return;
    if (confirmationOpen && !dialog.open) dialog.showModal();
    else if (!confirmationOpen && dialog.open) dialog.close();
  }, [confirmationOpen]);

  function requestSpeakerIdentification() {
    if (recordingTooLarge || status === "loading") return;
    setConfirmationOpen(true);
  }

  async function identifySpeakers() {
    if (recordingTooLarge || status === "loading") return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus("loading");
    setError(null);

    try {
      const form = new FormData();
      form.set(
        "audio",
        audioBlob,
        downloadFilename,
      );
      form.set("durationMs", String(durationMs));
      if (resourceId) form.set("resourceId", resourceId);
      const response = await fetch("/api/live/diarize", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as unknown;
      if (!response.ok) {
        const code = readErrorCode(payload);
        throw new Error(
          code === "audio_too_large"
            ? t.live_diarization_too_large
            : code === "insufficient_jiddu_credits" ||
                code === "jiddu_credits_required"
              ? t.live_diarization_credits_error
            : t.live_diarization_error,
        );
      }
      const nextResult = sanitizeDiarizationResult(payload);
      if (!nextResult) throw new Error(t.live_diarization_error);

      setResult(nextResult);
      setSpeakerNames(
        Object.fromEntries(
          Array.from(
            new Set(nextResult.segments.map((segment) => segment.speaker)),
          ).map((speaker) => [speaker, `${t.live_speaker} ${speaker}`]),
        ),
      );
      setSaveStatus("idle");
      setStatus("complete");
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setStatus("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : t.live_diarization_error,
      );
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  async function saveTranscript() {
    if (!resourceId || !result || saveStatus === "saving") return;
    setSaveStatus("saving");
    try {
      const response = await fetch("/api/live/diarize", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resourceId, result, speakerNames }),
      });
      if (!response.ok) throw new Error(t.live_diarization_save_error);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  function seekTo(seconds: number) {
    const player = resolvedAudioRef.current;
    if (!player) return;
    player.currentTime = seconds;
    void player.play().catch(() => {
      // A browser may still decline playback even after a user gesture.
    });
  }

  return (
    <div
      className={
        compact
          ? "border-t border-rule bg-paper/90 px-2 py-2"
          : "mt-3 rounded-md border border-rule bg-paper px-3 py-3"
      }
    >
      <div className="mb-2">
        <p className="text-sm font-medium">{t.live_local_recording}</p>
        <p className="mt-0.5 text-xs text-muted">
          {t.live_local_recording_hint}
        </p>
      </div>
      <audio
        ref={resolvedAudioRef}
        controls
        preload="metadata"
        src={audioUrl}
        className="h-10 w-full"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <a
          href={audioUrl}
          download={downloadFilename}
          className="inline-flex items-center gap-1.5 rounded-md border border-rule px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent hover:text-accent"
        >
          <Download className="size-3.5" />
          {t.live_download_audio}
        </a>
        <button
          type="button"
          onClick={requestSpeakerIdentification}
          disabled={recordingTooLarge || status === "loading"}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Users className="size-3.5" />
          )}
          {status === "loading"
            ? t.live_diarizing_speakers
            : t.live_identify_speakers}
        </button>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-muted">
        {t.live_diarization_consent_hint}
      </p>
      {recordingTooLarge ? (
        <p className="mt-2 text-xs text-severity-high">
          {t.live_diarization_too_large}
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-severity-high">{error}</p>
      ) : null}
      {result ? (
        <div className="mt-3 border-t border-rule pt-3">
          <h3 className="text-sm font-semibold">
            {t.live_diarized_transcript}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {speakers.map((speaker) => (
              <label key={speaker} className="text-[11px] text-muted">
                <span className="sr-only">
                  {t.live_speaker_name} {speaker}
                </span>
                <input
                  type="text"
                  value={speakerNames[speaker] ?? ""}
                  onChange={(event) => {
                    setSaveStatus("idle");
                    setSpeakerNames((current) => ({
                      ...current,
                      [speaker]: event.target.value,
                    }));
                  }}
                  aria-label={`${t.live_speaker_name} ${speaker}`}
                  className="w-32 rounded-md border border-rule bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-accent"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
            {turns.map((turn) => (
              <button
                key={`${turn.id}-${turn.start}`}
                type="button"
                onClick={() => seekTo(turn.start)}
                className="block w-full rounded-md border border-rule/70 bg-background/70 px-2.5 py-2 text-left hover:border-accent/60"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-accent">
                  {formatDiarizationTimestamp(turn.start)} ·{" "}
                  {speakerNames[turn.speaker] ||
                    `${t.live_speaker} ${turn.speaker}`}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-foreground">
                  {turn.text}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-rule/70 pt-3">
            <button
              type="button"
              onClick={() => void saveTranscript()}
              disabled={!resourceId || saveStatus === "saving"}
              className="inline-flex items-center gap-1.5 rounded-md border border-rule px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveStatus === "saving" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : saveStatus === "saved" ? (
                <Check className="size-3.5" />
              ) : (
                <Save className="size-3.5" />
              )}
              {saveStatus === "saving"
                ? t.live_diarization_saving
                : saveStatus === "saved"
                  ? t.live_diarization_saved
                  : t.live_diarization_save}
            </button>
            {saveStatus === "saved" && resourceId ? (
              <a
                href={`/live/${resourceId}/transcript`}
                className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
              >
                {t.live_diarization_view_saved}
                <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
          {!resourceId ? (
            <p className="mt-2 text-[11px] text-muted">
              {t.live_diarization_save_unavailable}
            </p>
          ) : (
            <p className="mt-2 text-[11px] text-muted">
              {t.live_diarization_save_hint}
            </p>
          )}
          {saveStatus === "error" ? (
            <p className="mt-2 text-xs text-severity-high">
              {t.live_diarization_save_error}
            </p>
          ) : null}
        </div>
      ) : null}
      <dialog
        ref={confirmationRef}
        onClose={() => setConfirmationOpen(false)}
        onClick={(event) => {
          if (event.target === confirmationRef.current) {
            setConfirmationOpen(false);
          }
        }}
        className="m-auto w-[min(92vw,34rem)] rounded-xl border border-rule bg-paper p-0 text-foreground shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="p-5 sm:p-6">
          <h2 className="font-serif text-xl leading-tight">
            {t.live_diarization_confirm_title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {t.live_diarization_confirm_body}
          </p>
          <div className="mt-4 rounded-lg border border-accent/30 bg-accent/5 px-3 py-3">
            <p className="text-sm font-medium">
              {t.live_diarization_session_estimate(
                formatDurationMs(durationMs),
                estimatedCredits,
              )}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {t.live_diarization_cost_warning}
            </p>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-rule">
            <table className="w-full text-xs">
              <thead className="bg-background/80 text-left text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">
                    {t.live_diarization_duration}
                  </th>
                  <th className="px-3 py-2 text-right font-medium">
                    {t.live_diarization_credits}
                  </th>
                </tr>
              </thead>
              <tbody>
                {creditExamples.map((example) => (
                  <tr key={example.minutes} className="border-t border-rule">
                    <td className="px-3 py-2">
                      {t.live_diarization_minutes(example.minutes)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {example.credits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            {t.live_diarization_estimate_note}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmationOpen(false)}
              className="rounded-md border border-rule px-3 py-2 text-sm font-medium hover:border-foreground/40"
            >
              {t.live_diarization_cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmationOpen(false);
                void identifySpeakers();
              }}
              className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {t.live_diarization_confirm}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function formatDurationMs(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function readErrorCode(payload: unknown): string | null {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    typeof payload.code === "string"
  ) {
    return payload.code;
  }
  return null;
}
