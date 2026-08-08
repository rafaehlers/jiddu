import { withAuth } from "@workos-inc/authkit-nextjs";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SavedDiarizedTranscriptPage } from "@/components/live/saved-diarized-transcript";
import { ResultPageCta } from "@/components/result-page-cta";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { prisma } from "@/lib/db";
import { readSavedDiarization } from "@/lib/live/diarization";
import { resolveAnalysisTitle } from "@/lib/live-title";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Saved speaker transcript · Jiddu",
  robots: { index: false, follow: false },
};

export default async function SavedSpeakerTranscriptPage({ params }: Props) {
  const { id } = await params;
  const { user } = await withAuth();
  if (!user) {
    redirect(
      `/login?returnTo=${encodeURIComponent(`/live/${id}/transcript`)}`,
    );
  }

  const analysis = await prisma.analysis.findFirst({
    where: { id, ownerWorkosUserId: user.id, source: "live" },
  });
  const diarization = readSavedDiarization(analysis?.diarizedTranscript);
  if (!analysis || !diarization) notFound();
  const transcript = analysis.transcript ?? analysis.text;
  const title =
    resolveAnalysisTitle({
      title: analysis.title,
      source: analysis.source,
      createdAt: analysis.createdAt,
      summary: analysis.summary,
      transcript,
      language: analysis.language,
    }) ?? "Jiddu Live";

  return (
    <main className="flex min-h-screen flex-1 flex-col">
      <SiteHeader variant="viewer" />
      <SavedDiarizedTranscriptPage title={title} diarization={diarization} />
      <ResultPageCta href="/live" />
      <SiteFooter />
    </main>
  );
}
