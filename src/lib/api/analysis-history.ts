import "server-only";

import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getExplainableBlocks } from "@/lib/explain-sections";
import type { ExplainLevel } from "@/lib/explain-schema";
import type { Lang } from "@/lib/fallacies";
import { ingestText } from "@/lib/ingest/text";
import { briefTopic } from "@/lib/live-title";
import { resolveModel } from "@/lib/llm";
import { DEFAULT_MODEL_CHAIN } from "@/lib/llm/fallback";
import { FACTCHECK_FAST_MODEL } from "@/lib/model-ids";
import { splitBlocks } from "@/lib/paragraphs";
import { splitSentences } from "@/lib/sentences";
import type {
  ExplainAggregate,
  FactCheckAggregate,
  FallacyAggregate,
  NeutralityAggregate,
  SlopAggregate,
} from "@/lib/api/run";

export type ApiAnalysisKind =
  | "fallacy"
  | "factcheck"
  | "neutrality"
  | "explain"
  | "slop";

export type ApiAnalysisTransport = "API" | "MCP";

type ApiAggregate =
  | FallacyAggregate
  | FactCheckAggregate
  | NeutralityAggregate
  | ExplainAggregate
  | SlopAggregate;

type StartApiAnalysisInput = {
  kind: ApiAnalysisKind;
  ownerWorkosUserId: string;
  transport: ApiAnalysisTransport;
  sourceLabel?: string | null;
  text: string;
  lang?: Lang;
  level?: ExplainLevel;
  verifyModel?: string;
};

export type ApiAnalysisHistory = {
  id: string;
  recordModel(model: string): void;
  complete(result: ApiAggregate): Promise<void>;
  fail(error: unknown): Promise<void>;
};

export async function startApiAnalysisHistory(
  input: StartApiAnalysisInput,
): Promise<ApiAnalysisHistory> {
  const document = ingestText(input.text);
  const id = nanoid(10);
  const initialModel = DEFAULT_MODEL_CHAIN[0];
  const sourceRef = sourceReference(input.transport, input.sourceLabel);
  const title = briefTopic(document.text) || `${input.transport} analysis`;
  const blocks = splitBlocks(document.text);
  const sentences = splitSentences(document.text);
  const verifyModel = input.verifyModel ?? FACTCHECK_FAST_MODEL;
  let model = initialModel;
  let status: "running" | "complete" | "failed" = "running";

  const common = {
    id,
    ownerWorkosUserId: input.ownerWorkosUserId,
    status: "running",
    source: input.transport,
    sourceRef,
    title,
    text: document.text,
    language: input.lang ?? "en",
    provider: providerForModel(initialModel),
    model: initialModel,
  } as const;

  if (input.kind === "fallacy") {
    await prisma.analysis.create({
      data: {
        ...common,
        blocks: JSON.stringify(blocks),
        sentences: JSON.stringify(sentences),
        findings: "[]",
      },
    });
  } else if (input.kind === "factcheck") {
    await prisma.factCheck.create({
      data: {
        ...common,
        blocks: JSON.stringify(blocks),
        sentences: JSON.stringify(sentences),
        claims: "[]",
        verdicts: "[]",
        verifyStatus: "running",
        verifyModel,
        verifyStartedAt: new Date(),
      },
    });
  } else if (input.kind === "neutrality") {
    await prisma.neutrality.create({
      data: {
        ...common,
        blocks: JSON.stringify(blocks),
        sentences: JSON.stringify(sentences),
        findings: "[]",
      },
    });
  } else if (input.kind === "explain") {
    await prisma.explanation.create({
      data: {
        ...common,
        level: input.level ?? "undergrad",
        blocks: JSON.stringify(getExplainableBlocks(blocks)),
        findings: "[]",
      },
    });
  } else {
    await prisma.slopCheck.create({
      data: {
        ...common,
        blocks: JSON.stringify(blocks),
        sentences: JSON.stringify(sentences),
        findings: "[]",
      },
    });
  }

  return {
    id,
    recordModel(nextModel) {
      model = nextModel;
    },
    async complete(result) {
      if (status !== "running") return;
      const finishedAt = new Date();
      const modelData = {
        model,
        provider: providerForModel(model),
      };

      if (input.kind === "fallacy") {
        const aggregate = result as FallacyAggregate;
        await prisma.analysis.update({
          where: { id },
          data: {
            ...modelData,
            status: "complete",
            score: aggregate.score,
            summary: aggregate.summary,
            language: aggregate.language ?? input.lang ?? "en",
            findings: JSON.stringify(aggregate.findings),
            finishedAt,
          },
        });
      } else if (input.kind === "factcheck") {
        const aggregate = result as FactCheckAggregate;
        await prisma.factCheck.update({
          where: { id },
          data: {
            ...modelData,
            status: "complete",
            language: aggregate.language ?? input.lang ?? "en",
            claims: JSON.stringify(aggregate.claims),
            verdicts: JSON.stringify(aggregate.verdicts),
            verifyStatus: "complete",
            verifyModel,
            verifyFinishedAt: finishedAt,
            finishedAt,
          },
        });
      } else if (input.kind === "neutrality") {
        const aggregate = result as NeutralityAggregate;
        await prisma.neutrality.update({
          where: { id },
          data: {
            ...modelData,
            status: "complete",
            language: aggregate.language ?? input.lang ?? "en",
            textType: aggregate.textType,
            verdict: aggregate.verdict,
            confidence: aggregate.confidence,
            rationale: aggregate.rationale,
            findings: JSON.stringify(aggregate.findings),
            finishedAt,
          },
        });
      } else if (input.kind === "explain") {
        const aggregate = result as ExplainAggregate;
        await prisma.explanation.update({
          where: { id },
          data: {
            ...modelData,
            status: "complete",
            language: aggregate.language ?? input.lang ?? "en",
            overview: aggregate.overview,
            findings: JSON.stringify(aggregate.findings),
            finishedAt,
          },
        });
      } else {
        const aggregate = result as SlopAggregate;
        await prisma.slopCheck.update({
          where: { id },
          data: {
            ...modelData,
            status: "complete",
            score: aggregate.score,
            summary: aggregate.summary,
            language: aggregate.language ?? input.lang ?? "en",
            findings: JSON.stringify(aggregate.findings),
            finishedAt,
          },
        });
      }
      status = "complete";
    },
    async fail(error) {
      if (status !== "running") return;
      const data = {
        status: "failed",
        errorMessage: errorMessage(error),
        model,
        provider: providerForModel(model),
        finishedAt: new Date(),
      } as const;

      if (input.kind === "fallacy") {
        await prisma.analysis.update({ where: { id }, data });
      } else if (input.kind === "factcheck") {
        await prisma.factCheck.update({
          where: { id },
          data: {
            ...data,
            verifyStatus: "failed",
            verifyFinishedAt: data.finishedAt,
          },
        });
      } else if (input.kind === "neutrality") {
        await prisma.neutrality.update({ where: { id }, data });
      } else if (input.kind === "explain") {
        await prisma.explanation.update({ where: { id }, data });
      } else {
        await prisma.slopCheck.update({ where: { id }, data });
      }
      status = "failed";
    },
  };
}

function sourceReference(
  transport: ApiAnalysisTransport,
  label?: string | null,
): string {
  const normalized = label?.replace(/\s+/g, " ").trim();
  return normalized ? `${transport} · ${normalized}`.slice(0, 2_000) : transport;
}

function providerForModel(model: string): "anthropic" | "openai" {
  return resolveModel(model).family === "anthropic" ? "anthropic" : "openai";
}

function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 2_000);
}
