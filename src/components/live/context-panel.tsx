"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  CornerDownRight,
  ExternalLink,
  GitBranch,
  Hash,
  Link2,
  Map,
  Sparkles,
  Tags,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import type {
  LiveContext,
  LiveContextTerm,
  LiveContextTermKind,
} from "@/lib/live-context-schema";

type Props = {
  context: LiveContext;
  active: boolean;
  concluded: boolean;
  onJumpToSentence?: (sentenceId: string) => void;
};

const KNOWN_TERMS_STORAGE_KEY = "jiddu.live.known-context-terms.v1";

export function LiveContextPanel({
  context,
  active,
  concluded,
  onJumpToSentence,
}: Props) {
  const { t } = useI18n();
  const [knownTerms, setKnownTerms] = useState<Set<string>>(new Set());
  const tags = context.tags ?? [];

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(
          window.localStorage.getItem(KNOWN_TERMS_STORAGE_KEY) ?? "[]",
        );
        if (Array.isArray(parsed)) {
          setKnownTerms(
            new Set(parsed.filter((item) => typeof item === "string")),
          );
        }
      } catch {
        // A blocked or malformed localStorage should never break Live.
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const visibleTerms = useMemo(
    () =>
      context.terms.filter(
        (term) => !knownTerms.has(normalizeKnownTerm(term.term)),
      ),
    [context.terms, knownTerms],
  );
  const currentTerm = active ? visibleTerms.at(-1) ?? null : null;
  const earlierTerms = currentTerm
    ? visibleTerms.filter((term) => term.id !== currentTerm.id)
    : visibleTerms;
  const currentTopics = currentTopicTags(context);
  const hasContext =
    tags.length > 0 ||
    (context.relatedLinks?.length ?? 0) > 0 ||
    context.topics.length > 0 ||
    context.terms.length > 0 ||
    context.segments.length > 0 ||
    Boolean(context.summary);

  const markKnown = (term: LiveContextTerm) => {
    const next = new Set(knownTerms);
    next.add(normalizeKnownTerm(term.term));
    setKnownTerms(next);
    try {
      window.localStorage.setItem(
        KNOWN_TERMS_STORAGE_KEY,
        JSON.stringify([...next]),
      );
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  };

  if (!hasContext) {
    return (
      <div className="rounded-lg border border-rule bg-paper px-4 py-5 text-sm text-muted">
        <span className="inline-flex items-center gap-2">
          <Sparkles aria-hidden="true" className="size-4 text-accent-hi" />
          {t.live_context_listening}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!concluded && tags.length > 0 ? (
        <section aria-labelledby="live-context-tags">
          <h3
            id="live-context-tags"
            className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"
          >
            <Hash aria-hidden="true" className="size-3.5" />
            {t.live_context_tags}
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => jump(tag.sentenceIds, onJumpToSentence)}
                className="rounded-full bg-foreground px-3 py-1 text-sm font-medium text-background transition-opacity hover:opacity-80"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {!concluded && currentTopics.length > 0 ? (
        <section aria-labelledby="live-current-topics">
          <h3
            id="live-current-topics"
            className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"
          >
            <Tags aria-hidden="true" className="size-3.5" />
            {t.live_context_current_topics}
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => jump(topic.sentenceIds, onJumpToSentence)}
                className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-medium text-foreground transition-colors hover:border-accent"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {currentTerm ? (
        <section className="relative overflow-hidden rounded-lg border border-accent-edge bg-accent/10 p-4 shadow-sm">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-1 bg-accent"
          />
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-hi">
            <Sparkles aria-hidden="true" className="size-3.5" />
            {t.live_context_explaining}
          </p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif text-2xl">{currentTerm.term}</h3>
                <KindBadge kind={currentTerm.kind} />
              </div>
              <p className="mt-2 leading-relaxed text-foreground/90">
                {currentTerm.explanation}
              </p>
            </div>
            <button
              type="button"
              onClick={() => markKnown(currentTerm)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-rule bg-paper px-2.5 py-1.5 text-xs font-medium text-muted hover:text-foreground"
            >
              <Check aria-hidden="true" className="size-3.5" />
              {t.live_context_known}
            </button>
          </div>
          <JumpButton
            sentenceIds={currentTerm.sentenceIds}
            onJump={onJumpToSentence}
          />
        </section>
      ) : null}

      {concluded ? (
        <SessionRecap
          context={context}
          visibleTerms={visibleTerms}
          onJump={onJumpToSentence}
        />
      ) : earlierTerms.length > 0 ? (
        <section className="rounded-lg border border-rule bg-paper px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-medium">
            <BookOpen aria-hidden="true" className="size-4 text-accent-hi" />
            {t.live_context_glossary} · {t.live_context_terms_learned(visibleTerms.length)}
          </h3>
          <div className="mt-3 divide-y divide-rule">
            {earlierTerms.map((term) => (
              <TermRow
                key={term.id}
                term={term}
                onJump={onJumpToSentence}
                onKnown={() => markKnown(term)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SessionRecap({
  context,
  visibleTerms,
  onJump,
}: {
  context: LiveContext;
  visibleTerms: LiveContextTerm[];
  onJump?: (sentenceId: string) => void;
}) {
  const { t } = useI18n();
  const tags = context.tags ?? [];
  return (
    <section className="rounded-xl border border-rule bg-paper p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-serif text-2xl">
        <Map aria-hidden="true" className="size-5 text-accent-hi" />
        {t.live_context_recap}
      </h2>

      {context.summary ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold">{t.live_context_summary}</h3>
          <p className="mt-2 leading-relaxed text-foreground/90">
            {context.summary}
          </p>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Hash aria-hidden="true" className="size-4 text-accent-hi" />
            {t.live_context_tags}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => jump(tag.sentenceIds, onJump)}
                className="rounded-full bg-foreground px-3 py-1 text-sm font-medium text-background transition-opacity hover:opacity-80"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {context.topics.length > 0 ? (
        <div className="mt-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Tags aria-hidden="true" className="size-4 text-accent-hi" />
            {t.live_context_topics}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {context.topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => jump(topic.sentenceIds, onJump)}
                className="rounded-full border border-rule px-3 py-1 text-sm hover:border-accent"
              >
                {topic.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {visibleTerms.length > 0 ? (
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen aria-hidden="true" className="size-4 text-accent-hi" />
            {t.live_context_glossary} · {t.live_context_terms_learned(visibleTerms.length)}
          </h3>
          <div className="mt-2 divide-y divide-rule border-y border-rule">
            {visibleTerms.map((term) => (
              <TermRow key={term.id} term={term} onJump={onJump} />
            ))}
          </div>
        </div>
      ) : null}

      {context.segments.length > 0 ? (
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <GitBranch aria-hidden="true" className="size-4 text-accent-hi" />
            {t.live_context_topic_changes}
          </h3>
          <ol className="relative mt-3 space-y-4 border-l border-rule pl-5">
            {context.segments.map((segment) => (
              <li key={segment.id} className="relative">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.44rem] top-1.5 size-2 rounded-full bg-accent"
                />
                <h4 className="font-medium">{segment.title}</h4>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {segment.summary}
                </p>
                <JumpButton
                  sentenceIds={segment.sentenceIds}
                  onJump={onJump}
                />
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {(context.relatedLinks?.length ?? 0) > 0 ? (
        <div className="mt-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Link2 aria-hidden="true" className="size-4 text-accent-hi" />
            {t.live_context_related_links}
          </h3>
          <p className="mt-1 text-xs text-muted">
            {t.live_context_related_links_hint}
          </p>
          <ol className="mt-3 grid gap-2">
            {context.relatedLinks.map((link, index) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-start gap-3 rounded-lg border border-rule bg-background/40 p-3 transition-colors hover:border-accent"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent-hi">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-sm font-medium leading-snug group-hover:underline">
                      {link.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-muted">
                      {link.source}
                    </span>
                  </span>
                  <ExternalLink
                    aria-hidden="true"
                    className="mt-0.5 size-3.5 shrink-0 text-muted"
                  />
                </a>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}

function TermRow({
  term,
  onJump,
  onKnown,
}: {
  term: LiveContextTerm;
  onJump?: (sentenceId: string) => void;
  onKnown?: () => void;
}) {
  const { t } = useI18n();
  return (
    <article className="py-3 first:pt-2 last:pb-2">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-medium">{term.term}</h4>
        <KindBadge kind={term.kind} />
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {term.explanation}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <JumpButton sentenceIds={term.sentenceIds} onJump={onJump} />
        {onKnown ? (
          <button
            type="button"
            onClick={onKnown}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-foreground"
          >
            <Check aria-hidden="true" className="size-3" />
            {t.live_context_known}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function KindBadge({ kind }: { kind: LiveContextTermKind }) {
  const { t } = useI18n();
  const labels: Record<LiveContextTermKind, string> = {
    slang: t.live_context_kind_slang,
    acronym: t.live_context_kind_acronym,
    jargon: t.live_context_kind_jargon,
    cultural_reference: t.live_context_kind_cultural_reference,
  };
  return (
    <span className="rounded border border-rule bg-background/50 px-1.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-muted">
      {labels[kind]}
    </span>
  );
}

function JumpButton({
  sentenceIds,
  onJump,
}: {
  sentenceIds: string[];
  onJump?: (sentenceId: string) => void;
}) {
  const { t } = useI18n();
  if (!onJump || sentenceIds.length === 0) return null;
  return (
    <button
      type="button"
      onClick={() => jump(sentenceIds, onJump)}
      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-hi hover:underline"
    >
      <CornerDownRight aria-hidden="true" className="size-3" />
      {t.live_context_jump}
    </button>
  );
}

function currentTopicTags(context: LiveContext) {
  const latestSentenceIds = new Set(context.segments.at(-1)?.sentenceIds ?? []);
  const current = context.topics.filter((topic) =>
    topic.sentenceIds.some((id) => latestSentenceIds.has(id)),
  );
  return (current.length > 0 ? current : context.topics.slice(-3)).slice(0, 3);
}

function jump(
  sentenceIds: string[],
  onJump?: (sentenceId: string) => void,
) {
  const first = sentenceIds[0];
  if (first && onJump) onJump(first);
}

function normalizeKnownTerm(term: string): string {
  return term.trim().toLocaleLowerCase();
}
