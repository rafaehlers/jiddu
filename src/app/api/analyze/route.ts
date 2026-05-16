import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { ingestUrl } from "@/lib/ingest/url";
import { ingestPdf } from "@/lib/ingest/pdf";
import { ingestText } from "@/lib/ingest/text";
import { splitSentences } from "@/lib/sentences";
import { getProvider } from "@/lib/llm";
import type { IngestedDocument } from "@/lib/ingest/url";
import type { ProviderId } from "@/lib/llm";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_TEXT_CHARS = 60_000;

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") ?? "";
    let doc: IngestedDocument;
    let provider: ProviderId | undefined;

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      provider = normalizeProvider(form.get("provider"));
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "Missing 'file' field" }, { status: 400 });
      }
      const buf = await file.arrayBuffer();
      const name = file.name || "upload";
      const lower = name.toLowerCase();
      if (lower.endsWith(".pdf") || file.type === "application/pdf") {
        doc = await ingestPdf(buf, name);
      } else if (lower.endsWith(".txt") || file.type.startsWith("text/")) {
        doc = ingestText(new TextDecoder().decode(buf), {
          title: name,
          sourceRef: name,
        });
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Use PDF or TXT." },
          { status: 415 },
        );
      }
    } else {
      const body = (await req.json().catch(() => null)) as
        | { type?: string; url?: string; text?: string; provider?: string; title?: string }
        | null;
      if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
      provider = normalizeProvider(body.provider);
      if (body.type === "url" && body.url) {
        doc = await ingestUrl(body.url);
      } else if (body.type === "text" && body.text) {
        doc = ingestText(body.text, { title: body.title });
      } else {
        return NextResponse.json(
          { error: "Provide { type:'url', url } or { type:'text', text }" },
          { status: 400 },
        );
      }
    }

    if (doc.text.length > MAX_TEXT_CHARS) {
      doc = { ...doc, text: doc.text.slice(0, MAX_TEXT_CHARS) };
    }

    const sentences = splitSentences(doc.text);
    if (sentences.length === 0) {
      return NextResponse.json({ error: "No sentences detected" }, { status: 422 });
    }

    const llm = getProvider(provider);
    const { provider: providerId, model, result } = await llm.analyze({ sentences });

    const id = nanoid(10);
    await prisma.analysis.create({
      data: {
        id,
        source: doc.source,
        sourceRef: doc.sourceRef,
        title: doc.title,
        text: doc.text,
        language: result.language ?? null,
        provider: providerId,
        model,
        score: result.score,
        summary: result.summary,
        sentences: JSON.stringify(sentences),
        findings: JSON.stringify(result.findings),
      },
    });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("[/api/analyze]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function normalizeProvider(v: FormDataEntryValue | string | undefined | null): ProviderId | undefined {
  const s = typeof v === "string" ? v.toLowerCase() : undefined;
  if (s === "anthropic" || s === "openai") return s;
  return undefined;
}
