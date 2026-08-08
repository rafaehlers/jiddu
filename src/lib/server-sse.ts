const DEFAULT_HEARTBEAT_MS = 15_000;

export const ANALYSIS_STREAM_DISCONNECTED_ERROR =
  "The analysis connection ended before processing completed.";

type SseController = Pick<
  ReadableStreamDefaultController<Uint8Array>,
  "close" | "enqueue"
>;

export type ServerSseWriter = {
  send: (event: string, data: unknown) => boolean;
  heartbeat: () => boolean;
  close: () => void;
  cancel: () => void;
};

/**
 * Small SSE writer shared by the long-running analysis routes.
 *
 * MiniMax can spend more than a reverse proxy's idle timeout reasoning before
 * it emits its first tool call. SSE comments keep the HTTP hop alive without
 * surfacing a fake progress event to the browser's event parser.
 */
export function createServerSseWriter(
  controller: SseController,
  options?: { heartbeatMs?: number },
): ServerSseWriter {
  const encoder = new TextEncoder();
  const heartbeatMs = options?.heartbeatMs ?? DEFAULT_HEARTBEAT_MS;
  let stopped = false;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  const stopHeartbeat = () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  };

  const write = (payload: string): boolean => {
    if (stopped) return false;
    try {
      controller.enqueue(encoder.encode(payload));
      return true;
    } catch {
      stopped = true;
      stopHeartbeat();
      return false;
    }
  };

  const writer: ServerSseWriter = {
    send(event, data) {
      return write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    heartbeat() {
      return write(": heartbeat\n\n");
    },
    close() {
      if (stopped) return;
      stopped = true;
      stopHeartbeat();
      try {
        controller.close();
      } catch {
        // The consumer may have disconnected between the last write and close.
      }
    },
    cancel() {
      stopped = true;
      stopHeartbeat();
    },
  };

  if (heartbeatMs > 0) {
    heartbeatTimer = setInterval(() => writer.heartbeat(), heartbeatMs);
  }

  return writer;
}
