"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentProps } from "react";
import { useI18n } from "@/lib/i18n/provider";

// Renders the PolitiFact benchmark report (docs/benchmark-politifact*.md)
// inside Jiddu's typography. Component overrides apply the same serif /
// rule / paper aesthetic used everywhere else, so the markdown doesn't
// look transplanted from a different system. GFM enabled for the tables
// (confusion matrix, per-claim-type breakdown).
//
// Kept as a client component for two reasons: (a) react-markdown can be
// heavy at build time on the server and the content is static, so the
// cost lives once in the client bundle and survives navigation, and
// (b) the user's UI language is only known on the client (the i18n
// provider hydrates from localStorage + navigator.language).
export function BenchmarkBody({
  en,
  pt,
  es,
}: {
  en: string;
  pt: string;
  es: string;
}) {
  const { lang } = useI18n();
  const markdown = lang === "pt" ? pt : lang === "es" ? es : en;
  return (
    <article className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-4 text-foreground/90">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {markdown}
      </ReactMarkdown>
    </article>
  );
}

// Per-element overrides. The strategy: keep the report dense but
// readable — display-size headings get the serif treatment used
// elsewhere on the site, body copy uses Geist sans at our slightly
// heavier 450 weight (set globally), and the table from the confusion
// matrix gets enough padding/borders to read as a real data table
// rather than markdown noise.
const MD_COMPONENTS: ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: (props) => (
    <h1
      className="font-serif text-3xl sm:text-4xl mt-2 mb-2 leading-tight"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="font-serif text-2xl mt-6 mb-1 leading-tight"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="font-serif text-xl mt-4 mb-1 leading-tight"
      {...props}
    />
  ),
  p: (props) => (
    <p className="text-base leading-relaxed text-foreground/85" {...props} />
  ),
  ul: (props) => (
    <ul
      className="list-disc list-outside pl-5 flex flex-col gap-1.5 text-base leading-relaxed text-foreground/85"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="list-decimal list-outside pl-5 flex flex-col gap-1.5 text-base leading-relaxed text-foreground/85"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1" {...props} />,
  a: (props) => {
    // External links open in new tab; same-origin or anchor links don't.
    const href = props.href ?? "";
    const isExternal = /^https?:\/\//.test(href);
    return (
      <a
        {...props}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="underline decoration-rule hover:decoration-foreground transition-colors"
      />
    );
  },
  blockquote: (props) => (
    <blockquote
      className="border-l-2 border-rule pl-4 py-1 my-2 italic text-foreground/85"
      {...props}
    />
  ),
  code: (props) => {
    // react-markdown passes `inline: true` for backtick code and omits
    // it for fenced blocks. We treat inline `code` as a chip and fenced
    // blocks via the parent <pre> renderer below.
    // @ts-expect-error — `inline` is a runtime hint, not in the public typings
    if (props.inline) {
      return (
        <code
          className="font-mono text-[0.875em] bg-background border border-rule rounded px-1 py-0.5"
          {...props}
        />
      );
    }
    return <code className="font-mono text-sm" {...props} />;
  },
  pre: (props) => (
    <pre
      className="bg-background border border-rule rounded-md p-4 overflow-x-auto text-sm leading-relaxed"
      {...props}
    />
  ),
  // GFM tables — the confusion matrix is the main client. Tight column
  // padding, monospace numbers via tabular-nums, sticky header row.
  table: (props) => (
    <div className="overflow-x-auto my-2 border border-rule rounded-md">
      <table
        className="w-full text-sm border-collapse tabular-nums"
        {...props}
      />
    </div>
  ),
  thead: (props) => <thead className="bg-paper" {...props} />,
  th: (props) => (
    <th
      className="text-left font-medium px-3 py-2 border-b border-rule"
      {...props}
    />
  ),
  td: (props) => (
    <td className="px-3 py-2 border-b border-rule/60 last:border-b-0" {...props} />
  ),
  hr: () => <hr className="my-4 border-rule" />,
  strong: (props) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
};
