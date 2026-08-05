import "server-only";

import type { Lang } from "@/lib/fallacies";
import { appBaseUrl } from "@/lib/auth-config";
import { prisma } from "@/lib/db";
import { buildReportEmailHtml } from "@/lib/report-email-html";
import { resendClient, resendFromEmail } from "@/lib/support-email";

export const REPORT_KINDS = ["a", "f", "n", "e", "s", "r", "live"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

type ResolvedReport = {
  id: string;
  kind: ReportKind;
  printPath: string;
  title: string;
  viewPath: string;
};

const PATHS: Record<ReportKind, { print: (id: string) => string; view: (id: string) => string }> = {
  a: { print: (id) => `/a/${id}/print`, view: (id) => `/a/${id}` },
  f: { print: (id) => `/f/${id}/print`, view: (id) => `/f/${id}` },
  n: { print: (id) => `/n/${id}/print`, view: (id) => `/n/${id}` },
  e: { print: (id) => `/e/${id}/print`, view: (id) => `/e/${id}` },
  s: { print: (id) => `/s/${id}/print`, view: (id) => `/s/${id}` },
  r: { print: (id) => `/r/${id}/print`, view: (id) => `/r/${id}` },
  live: { print: (id) => `/live/${id}/print`, view: (id) => `/live/${id}` },
};

const FALLBACK_TITLES: Record<ReportKind, string> = {
  a: "Fallacy analysis",
  f: "Fact-check",
  n: "Neutrality assessment",
  e: "Paper explanation",
  s: "Writing-pattern analysis",
  r: "Adversarial paper review",
  live: "Jiddu Live session",
};

const COPY: Record<Lang, { cta: string; intro: string; subject: string }> = {
  en: {
    cta: "Open report in Jiddu",
    intro: "Here is the Jiddu report you requested.",
    subject: "Your Jiddu report",
  },
  pt: {
    cta: "Abrir relatório no Jiddu",
    intro: "Aqui está o relatório do Jiddu que você solicitou.",
    subject: "Seu relatório Jiddu",
  },
  es: {
    cta: "Abrir informe en Jiddu",
    intro: "Aquí está el informe de Jiddu que solicitaste.",
    subject: "Tu informe Jiddu",
  },
};

export async function sendOwnedReportEmail(input: {
  email: string;
  id: string;
  kind: ReportKind;
  lang: Lang;
  requestUrl: string;
  userId: string;
}): Promise<boolean> {
  const report = await resolveOwnedReport(input.kind, input.id, input.userId);
  if (!report) return false;

  const baseUrl = appBaseUrl(input.requestUrl);
  const printUrl = new URL(`${report.printPath}?nopr=1`, `${baseUrl}/`);
  const viewUrl = new URL(report.viewPath, `${baseUrl}/`).toString();
  const response = await fetch(printUrl, {
    cache: "no-store",
    headers: { accept: "text/html", "accept-language": input.lang },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    throw new Error(`Could not render report email (${response.status}).`);
  }

  const copy = COPY[input.lang];
  const html = buildReportEmailHtml({
    cta: copy.cta,
    intro: copy.intro,
    lang: input.lang,
    printHtml: await response.text(),
    reportUrl: viewUrl,
    title: report.title,
  });
  const subjectTitle = report.title.replace(/[\r\n]+/g, " ").trim().slice(0, 140);
  const { error } = await resendClient().emails.send({
    from: resendFromEmail(),
    to: input.email,
    subject: `${copy.subject}: ${subjectTitle}`,
    html,
    text: `${copy.intro}\n\n${report.title}\n${viewUrl}`,
    tags: [
      { name: "source", value: "report-email" },
      { name: "report_kind", value: report.kind },
    ],
  });
  if (error) throw new Error(`Resend send failed: ${error.message}`);
  return true;
}

async function resolveOwnedReport(
  kind: ReportKind,
  id: string,
  userId: string,
): Promise<ResolvedReport | null> {
  let row: {
    ownerWorkosUserId: string | null;
    status: string;
    title: string | null;
  } | null = null;

  if (kind === "a" || kind === "live") {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: {
        liveContext: true,
        ownerWorkosUserId: true,
        source: true,
        status: true,
        title: true,
      },
    });
    if (
      !analysis ||
      (kind === "live" &&
        (analysis.source !== "live" || !analysis.liveContext))
    ) {
      return null;
    }
    row = analysis;
  } else if (kind === "f") {
    row = await prisma.factCheck.findUnique({
      where: { id },
      select: { ownerWorkosUserId: true, status: true, title: true },
    });
  } else if (kind === "n") {
    row = await prisma.neutrality.findUnique({
      where: { id },
      select: { ownerWorkosUserId: true, status: true, title: true },
    });
  } else if (kind === "e") {
    row = await prisma.explanation.findUnique({
      where: { id },
      select: { ownerWorkosUserId: true, status: true, title: true },
    });
  } else if (kind === "s") {
    row = await prisma.slopCheck.findUnique({
      where: { id },
      select: { ownerWorkosUserId: true, status: true, title: true },
    });
  } else if (kind === "r") {
    const review = await prisma.paperReview.findUnique({
      where: { id },
      select: {
        ownerWorkosUserId: true,
        review: true,
        status: true,
        title: true,
      },
    });
    if (!review?.review) return null;
    row = review;
  }

  if (!row || row.status !== "complete" || row.ownerWorkosUserId !== userId) {
    return null;
  }
  return {
    id,
    kind,
    printPath: PATHS[kind].print(id),
    title: row.title?.trim() || FALLBACK_TITLES[kind],
    viewPath: PATHS[kind].view(id),
  };
}
