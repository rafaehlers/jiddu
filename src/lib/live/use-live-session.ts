"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isErrorEvent,
  isTranscriptionCompleted,
  isTranscriptionDelta,
  type RealtimeEvent,
} from "./realtime-events";
import {
  LOCAL_RECORDING_AUDIO_BITS_PER_SECOND,
  sessionAudioFilename,
} from "./diarization";

export type LiveSource = "mic" | "tab";

export type LiveSessionState =
  | "idle"
  | "connecting"
  | "live"
  | "stopping"
  | "stopped"
  | "error";

export type LiveSessionOptions = {
  language?: "en" | "pt" | "es";
  // Called every time a transcription delta arrives. Cumulative text is
  // available via `transcript` on the hook return.
  onDelta?: (delta: string) => void;
  // Called when an utterance is finalized (transcription.completed). Useful
  // for committing analysis windows.
  onCompleted?: (transcript: string) => void;
};

export type LiveSessionError = {
  code:
    | "insufficient_jiddu_credits"
    | "microphone_permission"
    | "microphone_unavailable"
    | "tab_unsupported"
    | "tab_audio_missing"
    | "capture_cancelled"
    | "rate_limited"
    | "connection_lost"
    | "service_unavailable";
  required?: number;
  available?: number;
  retryAfterSeconds?: number;
};

export type LiveSessionHandle = {
  state: LiveSessionState;
  transcript: string;
  error: LiveSessionError | null;
  billingReservationId: string | null;
  /** Temporary in-browser recording for replay after this session. */
  localAudioUrl: string | null;
  /** Audio bytes retained only in this browser tab for replay or an opt-in action. */
  localAudioBlob: Blob | null;
  /** Stable download name created when the browser recording finishes. */
  localAudioFilename: string | null;
  /** Milliseconds elapsed since the session went live. */
  elapsedMs: number;
  start: (source: LiveSource) => Promise<void>;
  /** Stops capture and returns the final audio duration. */
  stop: () => Promise<number>;
  /** Settles transcription plus all accumulated Live analysis usage. */
  finish: (resourceId?: string | null) => Promise<void>;
};

type TokenErrorPayload = {
  code?: string;
  error?: string;
  required?: number;
  available?: number;
  retry_after_seconds?: number;
};

class LiveSessionStartError extends Error {
  constructor(
    public readonly sessionError: LiveSessionError,
    message: string,
  ) {
    super(message);
  }
}

const REALTIME_CALL_URL = "https://api.openai.com/v1/realtime/calls";

export function useLiveSession(opts: LiveSessionOptions = {}): LiveSessionHandle {
  const [state, setState] = useState<LiveSessionState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<LiveSessionError | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [billingReservationId, setBillingReservationId] = useState<
    string | null
  >(null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [localAudioBlob, setLocalAudioBlob] = useState<Blob | null>(null);
  const [localAudioFilename, setLocalAudioFilename] = useState<string | null>(
    null,
  );

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const finalDurationMsRef = useRef(0);
  const billingReservationIdRef = useRef<string | null>(null);
  // Buffer partial deltas per item so a single `completed` event reflects
  // the final committed transcript even when deltas were never appended.
  const pendingItemsRef = useRef<Map<string, string>>(new Map());
  const completedItemsRef = useRef<Set<string>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const localAudioUrlRef = useRef<string | null>(null);
  const disconnectTimerRef = useRef<number | null>(null);

  const clearLocalRecording = useCallback(() => {
    if (localAudioUrlRef.current) {
      URL.revokeObjectURL(localAudioUrlRef.current);
      localAudioUrlRef.current = null;
    }
    audioChunksRef.current = [];
    setLocalAudioUrl(null);
    setLocalAudioBlob(null);
    setLocalAudioFilename(null);
  }, []);

  const startLocalRecording = useCallback((stream: MediaStream) => {
    if (typeof MediaRecorder === "undefined") return;
    try {
      const recorder = createLocalMediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      });
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch (error) {
      console.warn("[live] local replay recording is unavailable", error);
    }
  }, []);

  const stopLocalRecording = useCallback(async (keepForReplay = true) => {
    const recorder = mediaRecorderRef.current;
    mediaRecorderRef.current = null;
    if (!recorder || recorder.state === "inactive") return;
    await new Promise<void>((resolve) => {
      const timeout = window.setTimeout(resolve, 1500);
      recorder.addEventListener(
        "stop",
        () => {
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true },
      );
      try {
        recorder.stop();
      } catch {
        window.clearTimeout(timeout);
        resolve();
      }
    });
    if (!keepForReplay) {
      audioChunksRef.current = [];
      return;
    }
    if (audioChunksRef.current.length === 0) return;
    const blob = new Blob(audioChunksRef.current, {
      type: recorder.mimeType || "audio/webm",
    });
    if (localAudioUrlRef.current) {
      URL.revokeObjectURL(localAudioUrlRef.current);
    }
    const url = URL.createObjectURL(blob);
    localAudioUrlRef.current = url;
    setLocalAudioUrl(url);
    setLocalAudioBlob(blob);
    setLocalAudioFilename(sessionAudioFilename(blob.type));
  }, []);

  const cleanupMedia = useCallback(() => {
    if (disconnectTimerRef.current != null) {
      window.clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
    const dc = dcRef.current;
    dcRef.current = null;
    if (dc) {
      try {
        dc.close();
      } catch {
        /* noop */
      }
    }
    const pc = pcRef.current;
    pcRef.current = null;
    if (pc) {
      try {
        pc.close();
      } catch {
        /* noop */
      }
    }
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
  }, []);

  const currentDurationMs = useCallback(() => {
    if (startedAtRef.current == null) return finalDurationMsRef.current;
    return Math.max(0, Date.now() - startedAtRef.current);
  }, []);

  const settleBilling = useCallback(
    async (
      durationMs: number,
      options?: { keepalive?: boolean; resourceId?: string | null },
    ): Promise<boolean> => {
      const reservationId = billingReservationIdRef.current;
      if (!reservationId) return true;
      // Clear before sending so stop, connection errors and unmount cleanup
      // cannot debit the same reservation twice. The server is idempotent too.
      billingReservationIdRef.current = null;
      try {
        const res = await fetch("/api/live/settle", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            reservationId,
            durationMs,
            resourceId: options?.resourceId ?? undefined,
          }),
          keepalive: options?.keepalive ?? false,
        });
        if (!res.ok) {
          throw new Error(`Live settlement failed (${res.status}).`);
        }
        return true;
      } catch (err) {
        console.error("[live] usage settlement failed", err);
        // Preserve the ticket so a later stop/unmount can retry.
        if (!billingReservationIdRef.current) {
          billingReservationIdRef.current = reservationId;
        }
        return false;
      }
    },
    [],
  );

  // Tick a 1s timer while live so the UI can show duration + cost estimate.
  useEffect(() => {
    if (state !== "live") return;
    const id = window.setInterval(() => {
      if (startedAtRef.current != null) {
        setElapsedMs(Date.now() - startedAtRef.current);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [state]);

  // Best-effort settlement when the tab navigates away or the component
  // unmounts unexpectedly. `keepalive` lets the request outlive the page.
  useEffect(() => {
    const finish = () => {
      const durationMs = currentDurationMs();
      finalDurationMsRef.current = durationMs;
      void stopLocalRecording(false);
      cleanupMedia();
      startedAtRef.current = null;
      void settleBilling(durationMs, { keepalive: true });
    };
    window.addEventListener("pagehide", finish);
    return () => {
      window.removeEventListener("pagehide", finish);
      finish();
    };
  }, [cleanupMedia, currentDurationMs, settleBilling, stopLocalRecording]);

  useEffect(
    () => () => {
      if (localAudioUrlRef.current) {
        URL.revokeObjectURL(localAudioUrlRef.current);
        localAudioUrlRef.current = null;
      }
    },
    [],
  );

  const handleEvent = useCallback(
    (ev: RealtimeEvent) => {
      if (isTranscriptionDelta(ev)) {
        const prev = pendingItemsRef.current.get(ev.item_id) ?? "";
        pendingItemsRef.current.set(ev.item_id, prev + ev.delta);
        setTranscript((t) => t + ev.delta);
        opts.onDelta?.(ev.delta);
        return;
      }
      if (isTranscriptionCompleted(ev)) {
        if (completedItemsRef.current.has(ev.item_id)) return;
        completedItemsRef.current.add(ev.item_id);
        const buffered = pendingItemsRef.current.get(ev.item_id) ?? "";
        pendingItemsRef.current.delete(ev.item_id);
        // If `completed` carries a longer / corrected transcript, reconcile
        // by appending the diff so the UI shows the committed text.
        const finalText = ev.transcript ?? "";
        if (finalText && finalText !== buffered) {
          const diff = finalText.startsWith(buffered)
            ? finalText.slice(buffered.length)
            : `\n${finalText}`;
          if (diff) setTranscript((t) => t + diff);
        }
        // Always end utterances with a space so the next item doesn't glue.
        setTranscript((t) => (t.endsWith(" ") || t.endsWith("\n") ? t : t + " "));
        opts.onCompleted?.(finalText || buffered);
        return;
      }
      if (isErrorEvent(ev)) {
        console.error("[live] realtime error", ev.error);
        const durationMs = currentDurationMs();
        setElapsedMs(durationMs);
        setError({ code: "service_unavailable" });
        setState("error");
        void stopLocalRecording();
        cleanupMedia();
        startedAtRef.current = null;
        finalDurationMsRef.current = durationMs;
        void settleBilling(durationMs, { keepalive: true });
      }
    },
    [
      opts,
      cleanupMedia,
      currentDurationMs,
      settleBilling,
      stopLocalRecording,
    ],
  );

  const start = useCallback(
    async (source: LiveSource) => {
      if (state === "live" || state === "connecting") return;
      if (billingReservationIdRef.current) {
        await settleBilling(currentDurationMs(), { keepalive: true });
      }
      setError(null);
      setTranscript("");
      setElapsedMs(0);
      setBillingReservationId(null);
      clearLocalRecording();
      finalDurationMsRef.current = 0;
      pendingItemsRef.current.clear();
      completedItemsRef.current.clear();
      setState("connecting");

      try {
        // 1. Capture audio.
        let stream: MediaStream;
        if (source === "mic") {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          if (!navigator.mediaDevices.getDisplayMedia) {
            throw new LiveSessionStartError(
              { code: "tab_unsupported" },
              "Tab capture is not supported in this browser.",
            );
          }
          const display = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true,
          });
          // Drop video — we only want the audio track.
          display.getVideoTracks().forEach((t) => t.stop());
          const audioTracks = display.getAudioTracks();
          if (audioTracks.length === 0) {
            display.getTracks().forEach((t) => t.stop());
            throw new LiveSessionStartError(
              { code: "tab_audio_missing" },
              "The selected tab did not provide an audio track.",
            );
          }
          stream = new MediaStream(audioTracks);
        }
        streamRef.current = stream;

        // 2. Get ephemeral token.
        const tokenRes = await fetch("/api/live/token", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ language: opts.language ?? null }),
        });
        if (!tokenRes.ok) {
          const payload = (await tokenRes
            .json()
            .catch(() => ({}))) as TokenErrorPayload;
          console.error("[live] token request failed", tokenRes.status, payload);
          if (
            payload.code === "insufficient_jiddu_credits" ||
            payload.code === "jiddu_credits_required" ||
            tokenRes.status === 402
          ) {
            throw new LiveSessionStartError(
              {
                code: "insufficient_jiddu_credits",
                required: payload.required,
                available: payload.available,
              },
              "The account does not have enough Jiddu Credits.",
            );
          }
          if (payload.code === "rate_limited" || tokenRes.status === 429) {
            const headerRetryAfter = Number.parseInt(
              tokenRes.headers.get("retry-after") ?? "",
              10,
            );
            const retryAfterSeconds = Number.isFinite(
              payload.retry_after_seconds,
            )
              ? Math.max(1, Math.ceil(payload.retry_after_seconds!))
              : Number.isFinite(headerRetryAfter)
                ? Math.max(1, headerRetryAfter)
                : undefined;
            throw new LiveSessionStartError(
              { code: "rate_limited", retryAfterSeconds },
              "Too many Live sessions were started in a short period.",
            );
          }
          throw new LiveSessionStartError(
            { code: "service_unavailable" },
            payload.error ?? `Token request failed (${tokenRes.status}).`,
          );
        }
        const tokenJson = (await tokenRes.json()) as {
          clientSecret?: string;
          billingReservationId?: string | null;
          error?: string;
        };
        if (!tokenJson.clientSecret) {
          throw new LiveSessionStartError(
            { code: "service_unavailable" },
            tokenJson.error ?? "Missing client secret.",
          );
        }
        const nextBillingReservationId =
          tokenJson.billingReservationId ?? null;
        billingReservationIdRef.current = nextBillingReservationId;
        setBillingReservationId(nextBillingReservationId);

        // 3. WebRTC handshake.
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        // Outbound: send the captured audio to OpenAI.
        for (const track of stream.getAudioTracks()) {
          pc.addTrack(track, stream);
        }

        // Data channel for events (named "oai-events" by convention).
        const dc = pc.createDataChannel("oai-events");
        dcRef.current = dc;
        dc.addEventListener("message", (e) => {
          try {
            const parsed = JSON.parse(e.data) as RealtimeEvent;
            handleEvent(parsed);
          } catch (err) {
            console.warn("[live] failed to parse event", err, e.data);
          }
        });

        pc.addEventListener("connectionstatechange", () => {
          const s = pc.connectionState;
          if (s === "connected") {
            if (disconnectTimerRef.current != null) {
              window.clearTimeout(disconnectTimerRef.current);
              disconnectTimerRef.current = null;
            }
            if (pcRef.current === pc && startedAtRef.current != null) {
              setState("live");
            }
            return;
          }
          if (s === "disconnected" && pcRef.current === pc) {
            // WebRTC can recover a transient network handoff on its own. Give
            // ICE a short grace period before ending and settling the session.
            setState("connecting");
            if (disconnectTimerRef.current == null) {
              disconnectTimerRef.current = window.setTimeout(() => {
                disconnectTimerRef.current = null;
                if (
                  pcRef.current === pc &&
                  pc.connectionState === "disconnected"
                ) {
                  failConnection();
                }
              }, 4_000);
            }
            return;
          }
          if (s === "failed" || s === "closed") {
            failConnection();
          }

          function failConnection() {
            // Clean disconnects after stop() are expected (cleanup nulls out
            // pcRef). Only surface a problem if THIS pc is still active.
            if (pcRef.current !== pc) return;
            const durationMs = currentDurationMs();
            setElapsedMs(durationMs);
            setError({ code: "connection_lost" });
            setState("error");
            void stopLocalRecording();
            cleanupMedia();
            startedAtRef.current = null;
            finalDurationMsRef.current = durationMs;
            void settleBilling(durationMs, { keepalive: true });
          }
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const sdpRes = await fetch(REALTIME_CALL_URL, {
          method: "POST",
          body: offer.sdp,
          headers: {
            Authorization: `Bearer ${tokenJson.clientSecret}`,
            "Content-Type": "application/sdp",
          },
        });
        if (!sdpRes.ok) {
          const detail = await sdpRes.text().catch(() => "");
          console.error("[live] realtime connection failed", sdpRes.status, detail);
          throw new LiveSessionStartError(
            { code: "service_unavailable" },
            `Realtime connection failed (${sdpRes.status}).`,
          );
        }
        const answerSdp = await sdpRes.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        startedAtRef.current = Date.now();
        startLocalRecording(stream);
        setState("live");
      } catch (err) {
        console.error("[live] session could not start", err);
        const durationMs = currentDurationMs();
        setElapsedMs(durationMs);
        setError(toLiveSessionError(err));
        setState("error");
        void stopLocalRecording();
        cleanupMedia();
        startedAtRef.current = null;
        finalDurationMsRef.current = durationMs;
        await settleBilling(durationMs);
      }
    },
    [
      state,
      opts.language,
      clearLocalRecording,
      cleanupMedia,
      currentDurationMs,
      handleEvent,
      settleBilling,
      startLocalRecording,
      stopLocalRecording,
    ],
  );

  const stop = useCallback(async () => {
    if (state === "idle" || state === "stopped") return elapsedMs;
    if (state === "stopping") return finalDurationMsRef.current;
    const durationMs = currentDurationMs();
    finalDurationMsRef.current = durationMs;
    setElapsedMs(durationMs);
    setState("stopping");
    await stopLocalRecording();
    cleanupMedia();
    startedAtRef.current = null;
    return durationMs;
  }, [
    state,
    elapsedMs,
    cleanupMedia,
    currentDurationMs,
    stopLocalRecording,
  ]);

  const finish = useCallback(
    async (resourceId?: string | null) => {
      await settleBilling(finalDurationMsRef.current, { resourceId });
      setState("stopped");
    },
    [settleBilling],
  );

  return {
    state,
    transcript,
    error,
    billingReservationId,
    localAudioUrl,
    localAudioBlob,
    localAudioFilename,
    elapsedMs,
    start,
    stop,
    finish,
  };
}

function createLocalMediaRecorder(stream: MediaStream): MediaRecorder {
  const preferredMimeType = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
  ].find((type) => MediaRecorder.isTypeSupported?.(type));
  try {
    return new MediaRecorder(stream, {
      audioBitsPerSecond: LOCAL_RECORDING_AUDIO_BITS_PER_SECOND,
      ...(preferredMimeType ? { mimeType: preferredMimeType } : {}),
    });
  } catch {
    // Older implementations may reject bitrate or codec options. Preserve
    // replay/download even though a long fallback recording may exceed 25 MB.
    return new MediaRecorder(stream);
  }
}

function toLiveSessionError(error: unknown): LiveSessionError {
  if (error instanceof LiveSessionStartError) return error.sessionError;
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return { code: "microphone_permission" };
    }
    if (error.name === "NotFoundError") {
      return { code: "microphone_unavailable" };
    }
    if (error.name === "AbortError") {
      return { code: "capture_cancelled" };
    }
  }
  return { code: "service_unavailable" };
}
