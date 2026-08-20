"use client";

import {
  Building2,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Flag,
  Landmark,
  Loader2,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Network,
  GitMerge,
  Pencil,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { useState } from "react";
import type { KnowledgeEntityDTO } from "@/lib/context-knowledge-schema";
import { isPublicProfileCompatible } from "@/lib/context-profile-match";
import {
  LIVE_CONTEXT_ENTITY_KINDS,
  type LiveContextEntity,
  type LiveContextEntityKind,
} from "@/lib/live-context-schema";
import type { ContextCopy } from "./context-copy";
import {
  resolveEntityDisplayName,
  shouldPersistEntityName,
} from "./entity-display-name";

export type ContextEntityNodeData = Record<string, unknown> & {
  entity: LiveContextEntity;
  enriched: KnowledgeEntityDTO | null;
  copy: ContextCopy;
  onJumpToSentence?: (sentenceId: string) => void;
  editable: boolean;
  mergeCandidates: LiveContextEntity[];
  onRenameEntity?: (entityId: string, name: string) => Promise<void>;
  onRetypeEntity?: (
    entityId: string,
    kind: LiveContextEntityKind,
  ) => Promise<void>;
  onMergeEntities?: (
    sourceEntityId: string,
    targetEntityId: string,
  ) => Promise<void>;
  onRemoveEntity?: (entityId: string) => Promise<void>;
};

export type ContextEntityNode = Node<ContextEntityNodeData, "contextEntity">;

const ICONS: Record<LiveContextEntityKind, typeof UserRound> = {
  person: UserRound,
  institution: Landmark,
  organization: Building2,
  country: Flag,
  city: MapPin,
  region: MapIcon,
  place: MapPinned,
  event: CalendarDays,
};

const COLORS: Record<LiveContextEntityKind, string> = {
  person: "border-sky-500/55 bg-sky-500/10 text-sky-500",
  institution: "border-violet-500/55 bg-violet-500/10 text-violet-500",
  organization: "border-amber-500/55 bg-amber-500/10 text-amber-500",
  country: "border-emerald-500/55 bg-emerald-500/10 text-emerald-500",
  city: "border-teal-500/55 bg-teal-500/10 text-teal-500",
  region: "border-cyan-500/55 bg-cyan-500/10 text-cyan-500",
  place: "border-lime-500/55 bg-lime-500/10 text-lime-500",
  event: "border-rose-500/55 bg-rose-500/10 text-rose-500",
};

export function ContextEntityNodeCard({
  data,
  selected,
}: NodeProps<ContextEntityNode>) {
  const {
    entity,
    enriched,
    copy,
    onJumpToSentence,
    editable,
    mergeCandidates,
    onRenameEntity,
    onRetypeEntity,
    onMergeEntities,
    onRemoveEntity,
  } = data;
  const [editor, setEditor] = useState<
    "rename" | "retype" | "merge" | "remove" | null
  >(null);
  const [draftName, setDraftName] = useState(entity.name);
  const [draftKind, setDraftKind] = useState(entity.kind);
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const Icon = ICONS[entity.kind];
  const isLoading =
    !entity.placeholder && (!enriched || enriched.profileStatus === "pending");
  const profileCompatible =
    enriched !== null && isPublicProfileCompatible(entity, enriched);
  const correctionTimes = [entity.userCorrectedAt, entity.userCorrectedKindAt]
    .filter((value): value is string => Boolean(value))
    .map(Date.parse)
    .filter(Number.isFinite);
  const correctedAt = correctionTimes.length
    ? Math.max(...correctionTimes)
    : null;
  const news =
    enriched?.sources.filter(
      (source) =>
        source.sourceType === "news" &&
        (correctedAt === null || Date.parse(source.retrievedAt) >= correctedAt),
    ) ?? [];
  const persistedDisplayName = resolveEntityDisplayName(entity, enriched);
  const displayName =
    editor === "rename" && draftName.trim()
      ? draftName.trim()
      : persistedDisplayName;

  async function saveName() {
    if (
      !onRenameEntity ||
      !shouldPersistEntityName(draftName, entity, enriched)
    ) {
      setEditor(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onRenameEntity(entity.id, draftName.trim());
      setEditor(null);
    } catch {
      setError(copy.correctionError);
    } finally {
      setBusy(false);
    }
  }

  async function mergeEntity() {
    if (!onMergeEntities || !mergeTargetId) return;
    setBusy(true);
    setError(null);
    try {
      await onMergeEntities(entity.id, mergeTargetId);
      setEditor(null);
    } catch {
      setError(copy.mergeError);
    } finally {
      setBusy(false);
    }
  }

  async function saveType() {
    if (!onRetypeEntity || draftKind === entity.kind) {
      setEditor(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onRetypeEntity(entity.id, draftKind);
      setEditor(null);
    } catch {
      setError(copy.typeCorrectionError);
    } finally {
      setBusy(false);
    }
  }

  async function removeEntity() {
    if (!onRemoveEntity) return;
    setBusy(true);
    setError(null);
    try {
      await onRemoveEntity(entity.id);
    } catch {
      setError(copy.removeError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={`w-[19rem] overflow-hidden rounded-xl border bg-background/95 shadow-xl backdrop-blur transition-shadow ${
        selected ? "border-accent shadow-accent/15" : "border-rule"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-background !bg-muted"
      />
      <div className="border-b border-rule p-3">
        <div className="flex items-start gap-3">
          {profileCompatible && enriched?.imageUrl ? (
            <div
              aria-hidden="true"
              className="size-11 shrink-0 rounded-lg bg-cover bg-center ring-1 ring-rule"
              style={{
                backgroundImage: `url(${JSON.stringify(enriched.imageUrl).slice(1, -1)})`,
              }}
            />
          ) : (
            <div
              className={`grid size-11 shrink-0 place-items-center rounded-lg border ${COLORS[entity.kind]}`}
            >
              <Icon className="size-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-1">
              <p className="min-w-0 flex-1 truncate font-serif text-lg font-semibold leading-tight">
                {displayName}
              </p>
              {editable && onRenameEntity ? (
                <button
                  type="button"
                  title={copy.editName}
                  aria-label={copy.editName}
                  className="nodrag nopan shrink-0 rounded p-1 text-muted hover:bg-paper hover:text-accent"
                  onClick={() => {
                    setDraftName(entity.name);
                    setEditor(editor === "rename" ? null : "rename");
                    setError(null);
                  }}
                >
                  <Pencil className="size-3" />
                </button>
              ) : null}
              {editable && onRemoveEntity && !entity.userSupplied ? (
                <button
                  type="button"
                  title={copy.removeEntity}
                  aria-label={copy.removeEntity}
                  className="nodrag nopan shrink-0 rounded p-1 text-muted hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => {
                    setEditor(editor === "remove" ? null : "remove");
                    setError(null);
                  }}
                >
                  <Trash2 className="size-3" />
                </button>
              ) : null}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              {editable && onRetypeEntity && !entity.participantRole ? (
                <button
                  type="button"
                  title={copy.editType}
                  aria-label={copy.editType}
                  className={`nodrag nopan inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${COLORS[entity.kind]}`}
                  onClick={() => {
                    setDraftKind(entity.kind);
                    setEditor(editor === "retype" ? null : "retype");
                    setError(null);
                  }}
                >
                  {copy.types[entity.kind]}
                  <ChevronDown className="size-2.5" />
                </button>
              ) : (
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${COLORS[entity.kind]}`}
                >
                  {entity.participantRole
                    ? copy.participantRoles[entity.participantRole]
                    : copy.types[entity.kind]}
                </span>
              )}
              <span className="text-[10px] text-muted">
                {Math.round(entity.confidence * 100)}% {copy.confidence}
              </span>
            </div>
            {entity.userCorrectedName ? (
              <span className="mt-1 inline-block text-[9px] font-medium uppercase tracking-wider text-emerald-500">
                {copy.correctedName}
              </span>
            ) : null}
            {entity.userCorrectedKind ? (
              <span className="mt-1 inline-block text-[9px] font-medium uppercase tracking-wider text-emerald-500">
                {copy.correctedType}
              </span>
            ) : null}
            {entity.userSupplied ? (
              <span className="mt-1 inline-block text-[9px] font-medium uppercase tracking-wider text-sky-500">
                {copy.configuredParticipant}
              </span>
            ) : null}
          </div>
        </div>

        {editor === "rename" ? (
          <div className="nodrag nopan mt-3 rounded-lg border border-rule bg-paper/50 p-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
              {copy.correctName}
              <input
                autoFocus
                value={draftName}
                disabled={busy}
                onChange={(event) => setDraftName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void saveName();
                  if (event.key === "Escape") setEditor(null);
                }}
                className="mt-1 w-full rounded-md border border-rule bg-background px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-foreground outline-none focus:border-accent"
              />
            </label>
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditor(null)}
                className="rounded px-2 py-1 text-[10px] text-muted hover:bg-background"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                disabled={busy || !draftName.trim()}
                onClick={() => void saveName()}
                className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-background disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-3 animate-spin" /> : null}
                {copy.save}
              </button>
            </div>
          </div>
        ) : null}

        {editor === "retype" ? (
          <div className="nodrag nopan mt-3 rounded-lg border border-rule bg-paper/50 p-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
              {copy.correctType}
              <select
                autoFocus
                value={draftKind}
                disabled={busy}
                onChange={(event) =>
                  setDraftKind(event.target.value as LiveContextEntityKind)
                }
                className="mt-1 w-full rounded-md border border-rule bg-background px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-foreground outline-none focus:border-accent"
              >
                {LIVE_CONTEXT_ENTITY_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {copy.types[kind]}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditor(null)}
                className="rounded px-2 py-1 text-[10px] text-muted hover:bg-background"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                disabled={busy || draftKind === entity.kind}
                onClick={() => void saveType()}
                className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-background disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-3 animate-spin" /> : null}
                {copy.save}
              </button>
            </div>
          </div>
        ) : null}

        {editor === "merge" ? (
          <div className="nodrag nopan mt-3 rounded-lg border border-rule bg-paper/50 p-2">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
              {copy.mergeInto}
              <select
                autoFocus
                value={mergeTargetId}
                disabled={busy}
                onChange={(event) => setMergeTargetId(event.target.value)}
                className="mt-1 w-full rounded-md border border-rule bg-background px-2 py-1.5 text-xs font-normal normal-case tracking-normal text-foreground outline-none focus:border-accent"
              >
                <option value="">{copy.selectEntity}</option>
                {mergeCandidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditor(null)}
                className="rounded px-2 py-1 text-[10px] text-muted hover:bg-background"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                disabled={busy || !mergeTargetId}
                onClick={() => void mergeEntity()}
                className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-background disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <GitMerge className="size-3" />
                )}
                {copy.merge}
              </button>
            </div>
          </div>
        ) : null}

        {editor === "remove" ? (
          <div className="nodrag nopan mt-3 rounded-lg border border-red-500/30 bg-red-500/5 p-2">
            <p className="text-[11px] leading-relaxed text-foreground/85">
              {copy.removeEntityConfirm}
            </p>
            <div className="mt-2 flex justify-end gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => setEditor(null)}
                className="rounded px-2 py-1 text-[10px] text-muted hover:bg-background"
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void removeEntity()}
                className="inline-flex items-center gap-1 rounded bg-red-500 px-2 py-1 text-[10px] font-medium text-white disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Trash2 className="size-3" />
                )}
                {copy.remove}
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="nodrag nopan mt-2 flex items-start gap-1 rounded-md bg-red-500/10 px-2 py-1.5 text-[10px] text-red-400">
            <span className="flex-1">{error}</span>
            <button
              type="button"
              aria-label={copy.cancel}
              onClick={() => setError(null)}
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}

        <section className="mt-3">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-accent">
            <MapPin className="size-3" />
            {copy.conversation}
          </p>
          <p className="line-clamp-3 text-xs leading-relaxed text-foreground/85">
            {entity.description}
          </p>
          {entity.sentenceIds[0] && onJumpToSentence ? (
            <button
              type="button"
              className="nodrag nopan mt-2 text-[11px] font-medium text-accent hover:underline"
              onClick={() => onJumpToSentence(entity.sentenceIds[0])}
            >
              {copy.goToPassage}
            </button>
          ) : null}
          {editable && onMergeEntities && mergeCandidates.length > 0 ? (
            <button
              type="button"
              className="nodrag nopan ml-3 inline-flex items-center gap-1 text-[11px] font-medium text-muted hover:text-accent"
              onClick={() => {
                setEditor(editor === "merge" ? null : "merge");
                setMergeTargetId("");
                setError(null);
              }}
            >
              <GitMerge className="size-3" />
              {copy.mergeProfile}
            </button>
          ) : null}
        </section>
      </div>

      <section>
        <details className="group nodrag nopan border-b border-rule last:border-b-0">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted transition-colors hover:bg-paper/60 hover:text-foreground [&::-webkit-details-marker]:hidden">
            <Network className="size-3 shrink-0" />
            <span className="min-w-0 flex-1">{copy.publicProfile}</span>
            {isLoading ? (
              <Loader2 className="size-3 shrink-0 animate-spin" />
            ) : null}
            <ChevronDown className="size-3 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-t border-rule px-3 pb-3 pt-2">
            {isLoading ? (
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Loader2 className="size-3 animate-spin" />
                {copy.publicProfileLoading}
              </p>
            ) : enriched?.profileStatus === "ready" &&
              profileCompatible &&
              enriched.description ? (
              <>
                <p className="line-clamp-3 text-xs leading-relaxed text-muted">
                  {enriched.description}
                </p>
                {enriched.wikipediaUrl ? (
                  <a
                    className="mt-2 inline-flex items-center gap-1 text-[11px] text-accent hover:underline"
                    href={enriched.wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {copy.profileSource}
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </>
            ) : (
              <p className="text-xs italic text-muted">
                {copy.publicProfileMissing}
              </p>
            )}
          </div>
        </details>

        {news.length > 0 ? (
          <details className="group nodrag nopan border-b border-rule last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted transition-colors hover:bg-paper/60 hover:text-foreground [&::-webkit-details-marker]:hidden">
              <ExternalLink className="size-3 shrink-0" />
              <span className="min-w-0 flex-1">{copy.recentCoverage}</span>
              <span className="rounded-full bg-paper px-1.5 py-0.5 text-[9px] tabular-nums">
                {news.length}
              </span>
              <ChevronDown className="size-3 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-rule px-3 pb-3 pt-2">
              <ul className="space-y-1.5">
                {news.slice(0, 2).map((source) => (
                  <li key={source.id}>
                    <a
                      className="flex items-start gap-1 text-[11px] leading-snug text-foreground/80 hover:text-accent"
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mt-0.5 size-3 shrink-0" />
                      <span className="line-clamp-2">{source.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] leading-snug text-muted">
                {copy.relatedNotProof}
              </p>
            </div>
          </details>
        ) : null}
      </section>
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-background !bg-muted"
      />
    </article>
  );
}
