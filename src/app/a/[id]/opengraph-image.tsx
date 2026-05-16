import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "Jiddu fallacy analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await prisma.analysis.findUnique({ where: { id } });

  const title = a?.title ?? "Untitled";
  const score = a?.score ?? 0;
  const findingsCount = a ? (JSON.parse(a.findings) as unknown[]).length : 0;

  const tone =
    score >= 61 ? "#c64c2a" : score >= 36 ? "#e2a23a" : score >= 16 ? "#b2a35d" : "#7e9a6e";
  const label =
    score >= 81
      ? "PROPAGANDISTIC"
      : score >= 61
        ? "HIGHLY FALLACIOUS"
        : score >= 36
          ? "SEVERAL FALLACIES"
          : score >= 16
            ? "MINOR ISSUES"
            : "CLEAN REASONING";

  const safeTitle = title.length > 90 ? title.slice(0, 87) + "…" : title;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fbf8f1",
          padding: "72px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Georgia, serif",
          color: "#1c1a17",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontSize: 56, letterSpacing: -1, display: "flex" }}>Jiddu</div>
          <div style={{ fontSize: 24, fontStyle: "italic", color: "#6b665d", display: "flex" }}>
            truth is a pathless land
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 64,
              lineHeight: 1.1,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            {safeTitle}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div
              style={{
                fontSize: 200,
                fontWeight: 700,
                color: tone,
                lineHeight: 1,
                display: "flex",
              }}
            >
              <span>{score}</span>
              <span style={{ fontSize: 56, color: "#6b665d", marginLeft: 8, display: "flex" }}>
                /100
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  fontSize: 28,
                  letterSpacing: 4,
                  color: tone,
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {label}
              </div>
              <div style={{ fontSize: 22, color: "#6b665d", display: "flex" }}>
                {findingsCount} {findingsCount === 1 ? "fallacy" : "fallacies"} detected
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 18, color: "#6b665d" }}>
          jiddu · fallacy detection
        </div>
      </div>
    ),
    size,
  );
}
