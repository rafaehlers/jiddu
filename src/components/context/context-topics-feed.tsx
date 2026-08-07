"use client";

import { ExternalLink, Hash } from "lucide-react";
import type { LiveContext } from "@/lib/live-context-schema";
import type { ContextCopy } from "./context-copy";
import { googleSearchUrl } from "./context-tag-search";

type Props = {
  context: LiveContext;
  copy: ContextCopy;
};

export function ContextTopicsFeed({ context, copy }: Props) {
  const tags = context.tags ?? [];

  if (tags.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-rule px-3 py-4 text-xs leading-relaxed text-muted">
        {copy.noTopicsYet}
      </p>
    );
  }

  return (
    <section aria-labelledby="context-feed-tags">
      <h3
        id="context-feed-tags"
        className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted"
      >
        <Hash aria-hidden="true" className="size-3.5" />
        {copy.tags}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <a
            key={tag.id}
            href={googleSearchUrl(tag.label)}
            target="_blank"
            rel="noopener noreferrer"
            title={`${copy.searchTag}: ${tag.label}`}
            aria-label={`${copy.searchTag}: ${tag.label}`}
            className="group inline-flex items-center gap-1 rounded-full border border-rule bg-paper px-2.5 py-1 text-[11px] font-medium text-foreground/85 transition-colors hover:border-accent hover:text-accent"
          >
            <span>{tag.label}</span>
            <ExternalLink
              aria-hidden="true"
              className="size-2.5 opacity-45 transition-opacity group-hover:opacity-100"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
