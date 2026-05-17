// Subset of the OpenAI Realtime API server-event shapes we care about for
// the transcription-only session driving Jiddu Live.

export type RealtimeTranscriptionDelta = {
  type: "conversation.item.input_audio_transcription.delta";
  item_id: string;
  content_index?: number;
  delta: string;
};

export type RealtimeTranscriptionCompleted = {
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  content_index?: number;
  transcript: string;
};

export type RealtimeErrorEvent = {
  type: "error";
  error?: { message?: string; code?: string };
};

export type RealtimeSessionCreated = {
  type: "session.created" | "session.updated";
  session?: unknown;
};

export type RealtimeEvent =
  | RealtimeTranscriptionDelta
  | RealtimeTranscriptionCompleted
  | RealtimeErrorEvent
  | RealtimeSessionCreated
  | { type: string; [key: string]: unknown };

export function isTranscriptionDelta(
  ev: RealtimeEvent,
): ev is RealtimeTranscriptionDelta {
  return ev.type === "conversation.item.input_audio_transcription.delta";
}

export function isTranscriptionCompleted(
  ev: RealtimeEvent,
): ev is RealtimeTranscriptionCompleted {
  return ev.type === "conversation.item.input_audio_transcription.completed";
}

export function isErrorEvent(ev: RealtimeEvent): ev is RealtimeErrorEvent {
  return ev.type === "error";
}
