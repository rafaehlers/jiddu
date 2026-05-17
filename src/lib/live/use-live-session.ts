"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isErrorEvent,
  isTranscriptionCompleted,
  isTranscriptionDelta,
  type RealtimeEvent,
} from "./realtime-events";

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

export type LiveSessionHandle = {
  state: LiveSessionState;
  transcript: string;
  error: string | null;
  /** Milliseconds elapsed since the session went live. */
  elapsedMs: number;
  start: (source: LiveSource) => Promise<void>;
  stop: () => Promise<void>;
};

const REALTIME_CALL_URL = "https://api.openai.com/v1/realtime/calls";

export function useLiveSession(opts: LiveSessionOptions = {}): LiveSessionHandle {
  const [state, setState] = useState<LiveSessionState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number | null>(null);
  // Buffer partial deltas per item so a single `completed` event reflects
  // the final committed transcript even when deltas were never appended.
  const pendingItemsRef = useRef<Map<string, string>>(new Map());
  const completedItemsRef = useRef<Set<string>>(new Set());

  const cleanup = useCallback(() => {
    if (dcRef.current) {
      try {
        dcRef.current.close();
      } catch {
        /* noop */
      }
      dcRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch {
        /* noop */
      }
      pcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    startedAtRef.current = null;
  }, []);

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

  // Cleanup on unmount.
  useEffect(() => cleanup, [cleanup]);

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
        const msg = ev.error?.message ?? "Realtime error";
        setError(msg);
        setState("error");
        cleanup();
      }
    },
    [opts, cleanup],
  );

  const start = useCallback(
    async (source: LiveSource) => {
      if (state === "live" || state === "connecting") return;
      setError(null);
      setTranscript("");
      setElapsedMs(0);
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
            throw new Error(
              "Tab capture is not supported in this browser. Use Chrome or Edge.",
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
            throw new Error(
              "No audio track from the selected source. Be sure to check 'Share audio' when choosing the tab.",
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
          const detail = await tokenRes.text().catch(() => "");
          throw new Error(
            `Token broker failed (${tokenRes.status}): ${detail.slice(0, 200)}`,
          );
        }
        const tokenJson = (await tokenRes.json()) as {
          clientSecret?: string;
          error?: string;
        };
        if (!tokenJson.clientSecret) {
          throw new Error(tokenJson.error ?? "Missing client secret");
        }

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
          if (s === "failed" || s === "disconnected" || s === "closed") {
            // Clean disconnects after stop() are expected (cleanup nulls out
            // pcRef). Only surface a problem if THIS pc is still the active
            // one in the hook.
            if (pcRef.current === pc) {
              setError("Connection lost");
              setState("error");
              cleanup();
            }
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
          throw new Error(
            `Realtime SDP exchange failed (${sdpRes.status}): ${detail.slice(0, 200)}`,
          );
        }
        const answerSdp = await sdpRes.text();
        await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });

        startedAtRef.current = Date.now();
        setState("live");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setState("error");
        cleanup();
      }
    },
    [state, opts.language, cleanup, handleEvent],
  );

  const stop = useCallback(async () => {
    if (state === "idle" || state === "stopped") return;
    setState("stopping");
    cleanup();
    setState("stopped");
  }, [state, cleanup]);

  return { state, transcript, error, elapsedMs, start, stop };
}
