// Persists LlmCallRecords to the LlmCall table. Writes are fire-and-forget:
// a logging failure must never slow down or break an analysis.

import { nanoid } from "nanoid";
import type { LlmCallRecord } from "./instrumented-fetch";

export const LLM_CALL_RETENTION_DAYS = 90;
// Prune roughly once every PRUNE_EVERY writes instead of on a schedule.
const PRUNE_EVERY = 200;

export function recordLlmCall(call: LlmCallRecord): void {
  void persist(call);
}

async function persist(call: LlmCallRecord): Promise<void> {
  try {
    // Imported lazily so modules that build OpenAI clients stay importable
    // without DATABASE_URL (unit tests, build-time evaluation).
    const { prisma } = await import("@/lib/db");
    await prisma.llmCall.create({
      data: {
        id: nanoid(16),
        createdAt: call.startedAt,
        operation: call.operation.slice(0, 80),
        model: call.model.slice(0, 160),
        responseModel: call.responseModel?.slice(0, 160) ?? null,
        stream: call.stream,
        status: call.status,
        httpStatus: call.httpStatus,
        errorCode: call.errorCode?.slice(0, 80) ?? null,
        errorMessage: call.errorMessage,
        retryCount: call.retryCount,
        durationMs: call.durationMs,
        ttfbMs: call.ttfbMs,
        firstChunkMs: call.firstChunkMs,
        promptTokens: call.promptTokens,
        completionTokens: call.completionTokens,
        reasoningTokens: call.reasoningTokens,
        cachedTokens: call.cachedTokens,
        totalTokens: call.totalTokens,
        costMicros: call.costMicros,
        generationId: call.generationId?.slice(0, 160) ?? null,
      },
    });
    if (Math.random() < 1 / PRUNE_EVERY) {
      await prisma.llmCall.deleteMany({
        where: {
          createdAt: {
            lt: new Date(Date.now() - LLM_CALL_RETENTION_DAYS * 24 * 60 * 60 * 1000),
          },
        },
      });
    }
  } catch (error) {
    console.warn(
      "[llm-call-log] could not persist LLM call",
      error instanceof Error ? error.message : error,
    );
  }
}
