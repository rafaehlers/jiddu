import { load } from "cheerio";
import { emailBrandHeader } from "@/lib/email-brand-header";

type Input = {
  cta: string;
  intro: string;
  lang: string;
  printHtml: string;
  reportUrl: string;
  title: string;
};

export function buildReportEmailHtml(input: Input): string {
  const $ = load(input.printHtml);
  const report = $(".print-root").first();
  if (report.length === 0) {
    throw new Error("The printable report did not contain a report body.");
  }

  const styles = report
    .find("style")
    .map((_, element) => $(element).html() ?? "")
    .get()
    .join("\n");
  report.find("style, script, noscript, button, input, textarea").remove();
  formatTagsAsBulletLists($, report);
  absolutizeAttributes($, report, input.reportUrl);
  report.attr(
    "style",
    "box-sizing:border-box;width:100%;max-width:720px;margin:0 auto;padding:32px 24px 48px;background:#ffffff;color:#111111;",
  );

  return `<!doctype html>
<html lang="${escapeHtml(input.lang)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
    <style>
      ${styles}
      body { margin: 0; background: #f7f4ee; color: #111; }
      .email-header { box-sizing: border-box; max-width: 720px; margin: 24px auto 0; padding: 24px 24px 0; background: #fff; }
      .email-intro { box-sizing: border-box; max-width: 720px; margin: 0 auto; padding: 20px 24px 0; background: #fff; font: 14px/1.5 Arial, sans-serif; color: #4b4740; }
      .email-cta { display: inline-block; margin-top: 12px; padding: 9px 14px; border-radius: 6px; background: #4737d2; color: #fff !important; font-weight: 600; text-decoration: none; }
      @media (max-width: 600px) {
        .print-root { padding: 24px 16px 36px !important; }
        .email-header { margin-top: 0 !important; padding: 20px 16px 0 !important; }
        .email-intro { padding: 20px 16px 0 !important; }
      }
    </style>
  </head>
  <body>
    <div class="email-header">
      ${emailBrandHeader()}
    </div>
    <div class="email-intro">
      <p style="margin:0;">${escapeHtml(input.intro)}</p>
      <a class="email-cta" href="${escapeHtml(input.reportUrl)}">${escapeHtml(input.cta)}</a>
    </div>
    ${report.toString()}
  </body>
</html>`;
}

function formatTagsAsBulletLists(
  $: ReturnType<typeof load>,
  root: ReturnType<ReturnType<typeof load>>,
) {
  root.find("ul.live-print-chips").each((_, element) => {
    const list = $(element);
    list
      .removeClass("live-print-chips")
      .addClass("email-tag-list")
      .attr(
        "style",
        "display:block;margin:0;padding-left:22px;list-style:disc outside;",
      );
    list.find("li").attr(
      "style",
      "display:list-item;margin:0 0 6px;padding:0;border:0;border-radius:0;font:14px/1.45 Arial,sans-serif;",
    );
  });
}

function absolutizeAttributes(
  $: ReturnType<typeof load>,
  root: ReturnType<ReturnType<typeof load>>,
  reportUrl: string,
) {
  for (const attribute of ["href", "src"] as const) {
    root.find(`[${attribute}]`).each((_, element) => {
      const value = $(element).attr(attribute)?.trim();
      if (!value || value.startsWith("data:") || value.startsWith("mailto:")) {
        return;
      }
      try {
        $(element).attr(attribute, new URL(value, reportUrl).toString());
      } catch {
        $(element).removeAttr(attribute);
      }
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}
