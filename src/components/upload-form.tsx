"use client";

import { useAuth } from "@workos-inc/authkit-nextjs/components";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AnalysisAuthModal } from "@/components/analysis-auth-modal";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { Messages } from "@/lib/i18n/messages";
import { MODEL_CATALOG } from "@/lib/llm";
import { EXPLAIN_LEVELS, type ExplainLevel } from "@/lib/explain-schema";
import type { PaperType, VenueSearchResult } from "@/lib/venues";
import type { ReviewDepth } from "@/lib/paper-review-audit-schema";

type Tab = "url" | "text" | "file";
export type UploadSourceType = Tab | "image";

type ErrorState = {
  message: string;
  code?: string;
};

type Mode =
  | "detector"
  | "factcheck"
  | "neutrality"
  | "explain"
  | "slop"
  | "review";

type Props = {
  onSubmit: (
    sourceType: UploadSourceType,
    body: BodyInit,
    contentType: string | null,
  ) => Promise<void>;
  error?: ErrorState | null;
  onClearError?: () => void;
  /**
   * Custom label for the submit button. Defaults to the localized
   * "Analyze" string. Used by the fact-check composer to switch the CTA
   * to "Extract claims" while reusing the same form scaffold.
   */
  submitLabel?: string;
  /**
   * Which mode this form is being rendered in. Drives the active state of
   * the top-row mode toggle and mode-specific form fields.
   */
  mode?: Mode;
  /**
   * Hide the top-row mode tabs. Used by the unified home, where the mode
   * is picked via the lens cards above the form instead.
   */
  showModeTabs?: boolean;
};

export function UploadForm({
  onSubmit,
  error,
  onClearError,
  submitLabel,
  mode = "detector",
  showModeTabs = true,
}: Props) {
  const { t, lang } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname();
  // File is the default input — it front-loads the drag-and-drop affordance,
  // which is the richest way in (PDF/TXT), with URL and paste one click away.
  const [tab, setTab] = useState<Tab>("file");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imagePreviewUrlRef = useRef<string | null>(null);
  const [localError, setLocalError] = useState<ErrorState | null>(null);
  const [model, setModel] = useState<string>(MODEL_CATALOG[0].id);
  // Explanation audience level. Only sent (and only shown) in explain mode;
  // "undergrad" is the sensible default for an academic paper.
  const [level, setLevel] = useState<ExplainLevel>("undergrad");
  const [venue, setVenue] = useState("");
  const [venueProfileId, setVenueProfileId] = useState("");
  const [venueSelectionSource, setVenueSelectionSource] = useState<
    VenueSearchResult["source"] | null
  >(null);
  const [venueSuggestions, setVenueSuggestions] = useState<VenueSearchResult[]>(
    [],
  );
  const [venueSearching, setVenueSearching] = useState(false);
  const [venueYear, setVenueYear] = useState("2026");
  const [venueTrack, setVenueTrack] = useState("Main track");
  const [paperType, setPaperType] = useState<PaperType>("research");
  const [reviewDate, setReviewDate] = useState("");
  const [reviewDepth, setReviewDepth] = useState<ReviewDepth>("standard");
  // True while a file is being dragged over the form, for the drop highlight.
  const [dragging, setDragging] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const visibleError = error ?? localError;

  // Stop the browser from navigating to (opening) a file dropped anywhere on
  // the page. Without this, dragging a PDF onto the window replaces the tab
  // with the raw PDF instead of doing nothing. The form's own onDrop still
  // runs for drops that land on it.
  useEffect(() => {
    const prevent = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const query = venue.trim();
    if (mode !== "review" || venueProfileId || query.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setVenueSearching(true);
      fetch(`/api/review/venues?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error("Venue search failed");
          return response.json() as Promise<{ venues?: VenueSearchResult[] }>;
        })
        .then((payload) => setVenueSuggestions(payload.venues ?? []))
        .catch((err) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setVenueSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setVenueSearching(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [mode, venue, venueProfileId]);

  const acceptFile = useCallback((f: File | undefined) => {
    if (!f) return;
    const lower = f.name.toLowerCase();
    const isPdf = lower.endsWith(".pdf") || f.type === "application/pdf";
    const isImage = isImageFile(f);
    const ok =
      isPdf ||
      (mode !== "review" &&
        (lower.endsWith(".txt") || f.type.startsWith("text/") || isImage));
    if (!ok) {
      setLocalError({
        message:
          mode === "review"
            ? "Adversarial review accepts exactly one PDF."
            : "Unsupported file type. Use PDF, TXT, PNG, JPEG, or WebP.",
      });
      return;
    }
    if (isImage && f.size > 10 * 1024 * 1024) {
      setLocalError({ message: "The image exceeds the 10 MB upload limit." });
      return;
    }
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
      imagePreviewUrlRef.current = null;
    }
    const previewUrl = isImage ? URL.createObjectURL(f) : null;
    imagePreviewUrlRef.current = previewUrl;
    setImagePreviewUrl(previewUrl);
    setFile(f);
    setTab("file");
    setLocalError(null);
    onClearError?.();
  }, [mode, onClearError]);

  useEffect(() => {
    if (mode === "review") return;
    const handlePaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((entry) =>
        isSupportedImageMime(entry.type),
      );
      const pasted = item?.getAsFile();
      if (!pasted) return;
      event.preventDefault();
      acceptFile(
        new File([pasted], clipboardImageName(pasted.type), {
          type: pasted.type,
          lastModified: Date.now(),
        }),
      );
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [acceptFile, mode]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  }

  function handleDragOver(e: React.DragEvent) {
    if (e.dataTransfer?.types?.includes("Files")) {
      e.preventDefault();
      if (!dragging) setDragging(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only clear when the cursor leaves the form itself, not when it moves
    // between the form's children (which also bubble a dragleave).
    if (e.currentTarget === e.target) setDragging(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (authLoading) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    setLocalError(null);
    onClearError?.();
    try {
      if (tab === "file") {
        if (!file) {
          throw new Error(
            mode === "review"
              ? "Choose one PDF file"
              : "Choose a PDF, TXT, or image file",
          );
        }
        if (
          mode === "review" &&
          !(file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf")
        ) {
          throw new Error("Adversarial review accepts exactly one PDF.");
        }
        const fd = new FormData();
        fd.set("file", file);
        fd.set("lang", lang);
        fd.set("model", model);
        if (mode === "explain") fd.set("level", level);
        if (mode === "review") {
          if (venue.trim()) fd.set("venue", venue.trim());
          if (venueProfileId) fd.set("venueProfileId", venueProfileId);
          fd.set("venueYear", venueYear);
          fd.set("venueTrack", venueTrack.trim());
          fd.set("paperType", paperType);
          fd.set("reviewDepth", reviewDepth);
          if (reviewDate) fd.set("reviewDate", reviewDate);
        }
        await onSubmit(isImageFile(file) ? "image" : "file", fd, null);
      } else {
        const base =
          tab === "url"
            ? { type: "url", url, lang, model }
            : { type: "text", text, lang, model };
        const body = JSON.stringify(
          mode === "explain" ? { ...base, level } : base,
        );
        await onSubmit(tab, body, "application/json");
      }
    } catch (err) {
      setLocalError({
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  }

  function switchToPaste() {
    setTab("text");
    setLocalError(null);
    onClearError?.();
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col gap-4 sm:gap-5 bg-paper border border-rule rounded-lg p-4 sm:p-5 shadow-sm transition-shadow",
          dragging && "ring-2 ring-accent",
        )}
      >
      {/* Top row: mode tabs (Detector / Fact-check / …) sit before the
          input-type tabs. Underline-tab style — each is a Link, so the active
          state survives page navigation. The container's bottom rule is the
          baseline the active tab's underline sits on (via -mb-px). Hidden on
          the unified home, where the lens cards play this role. */}
      {showModeTabs && (
        <div className="flex items-center gap-x-5 sm:gap-x-6 border-b border-rule flex-wrap">
          <ModeButton href="/" active={mode === "detector"}>
            {t.mode_detector}
          </ModeButton>
          <ModeButton href="/factcheck" active={mode === "factcheck"}>
            {t.mode_factcheck}
          </ModeButton>
          <ModeButton href="/neutrality" active={mode === "neutrality"}>
            {t.mode_neutrality}
          </ModeButton>
          <ModeButton href="/explain" active={mode === "explain"}>
            {t.mode_explain}
          </ModeButton>
          <ModeButton href="/slop" active={mode === "slop"}>
            {t.mode_slop}
          </ModeButton>
          <ModeButton href="/review" active={mode === "review"}>
            {t.mode_review}
          </ModeButton>
        </div>
      )}

      <div role="group" aria-label={mode === "review" ? "PDF" : t.tab_file} className="flex flex-wrap items-center gap-x-5 sm:gap-x-6 border-b border-rule">
        <TabButton active={tab === "file"} onClick={() => setTab("file")}>
          {mode === "review" ? "PDF" : t.tab_file}
        </TabButton>
        {mode !== "review" && (
          <>
            <TabButton active={tab === "url"} onClick={() => setTab("url")}>{t.tab_url}</TabButton>
            <TabButton active={tab === "text"} onClick={() => setTab("text")}>{t.tab_paste}</TabButton>
          </>
        )}
      </div>

      {tab === "url" && (
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t.url_placeholder}
          aria-label={t.tab_url}
          className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
        />
      )}

      {tab === "text" && (
        <textarea
          required
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={t.paste_placeholder}
          aria-label={t.tab_paste}
          className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent font-serif text-base leading-relaxed"
        />
      )}

      {tab === "file" && (
        <label className="flex flex-col items-center justify-center border border-dashed border-rule rounded-md py-8 sm:py-10 cursor-pointer hover:bg-background/40 transition-colors">
          <input
            type="file"
            accept={
              mode === "review"
                ? ".pdf,application/pdf"
                : ".pdf,application/pdf,.txt,text/plain,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            }
            className="sr-only"
            onChange={(e) => acceptFile(e.target.files?.[0])}
          />
          {imagePreviewUrl && file ? (
            <span className="flex w-full flex-col items-center gap-3 px-4">
              <Image
                src={imagePreviewUrl}
                alt={file.name}
                width={960}
                height={540}
                unoptimized
                className="max-h-52 w-auto max-w-full rounded-md border border-rule object-contain"
              />
              <span className="font-serif text-base break-all">{file.name}</span>
            </span>
          ) : (
            <span className="font-serif text-lg">
              {file
                ? file.name
                : mode === "review"
                  ? t.review_pdf_hint
                  : t.file_drop_hint}
            </span>
          )}
          {!file && (
            <span className="text-sm text-muted mt-1">
              {mode === "review"
                ? t.review_file_size_hint
                : t.file_size_hint}
            </span>
          )}
        </label>
      )}

      {visibleError && (
        <ErrorBox error={visibleError} t={t} onSwitchToPaste={switchToPaste} fromTab={tab} />
      )}

      {/* Explanation level — only in explain mode. Picks the audience the
          paragraph-by-paragraph explanations are written for. */}
      {mode === "explain" && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-muted">
            {t.explain_level}
          </span>
          <div role="radiogroup" aria-label={t.explain_level} className="flex items-center gap-x-5 gap-y-2 flex-wrap">
            {EXPLAIN_LEVELS.map((lvl) => {
              const checked = level === lvl;
              return (
                <button
                  key={lvl}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => setLevel(lvl)}
                  className={cn(
                    "inline-flex items-center gap-2 text-sm cursor-pointer transition-colors",
                    checked ? "text-foreground" : "text-muted hover:text-foreground",
                  )}
                >
                  <RadioDot checked={checked} />
                  {t[`level_${lvl}` as keyof Messages] as string}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === "review" && (
        <div className="flex flex-col gap-4">
          <label className="relative flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t.review_venue}
            </span>
            <input
              type="text"
              value={venue}
              onChange={(event) => {
                setVenue(event.target.value);
                setVenueProfileId("");
                setVenueSelectionSource(null);
                setVenueSuggestions([]);
              }}
              onBlur={() =>
                window.setTimeout(() => setVenueSuggestions([]), 150)
              }
              placeholder={t.review_venue_placeholder}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={venueSuggestions.length > 0}
              aria-controls="review-venue-suggestions"
              className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
            />
            {venueSuggestions.length > 0 && (
              <div
                id="review-venue-suggestions"
                role="listbox"
                className="absolute z-20 left-0 right-0 top-full mt-1 rounded-md border border-rule bg-paper shadow-lg overflow-hidden"
              >
                {venueSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setVenue(
                        suggestion.acronym
                          ? `${suggestion.acronym} — ${suggestion.name}`
                          : suggestion.name,
                      );
                      setVenueProfileId(suggestion.profileId ?? "");
                      setVenueSelectionSource(suggestion.source);
                      if (suggestion.edition) {
                        setVenueYear(String(suggestion.edition));
                      }
                      if (suggestion.defaultTrack) {
                        setVenueTrack(suggestion.defaultTrack);
                      }
                      setVenueSuggestions([]);
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-background border-b border-rule last:border-b-0 flex items-start justify-between gap-3"
                  >
                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">
                        {suggestion.acronym ?? suggestion.name}
                      </span>
                      {suggestion.acronym && (
                        <span className="text-xs text-muted">
                          {suggestion.name}
                        </span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wide shrink-0 mt-0.5",
                        suggestion.verifiedProfile
                          ? "text-[var(--severity-low)]"
                          : "text-muted",
                      )}
                    >
                      {suggestion.verifiedProfile
                        ? t.review_venue_verified
                        : "DBLP"}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <span className="text-xs text-muted flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                {venueSearching ? (
                  t.review_venue_searching
                ) : (
                  <VenueHelp text={t.review_venue_help} />
                )}
              </span>
              {venueSelectionSource && (
                <span
                  className={
                    venueSelectionSource === "curated"
                      ? "text-[var(--severity-low)]"
                      : "text-[var(--severity-medium)]"
                  }
                >
                  {venueSelectionSource === "curated"
                    ? t.review_venue_verified
                    : t.review_venue_catalog_only}
                </span>
              )}
            </span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">
                {t.review_venue_year}
              </span>
              <input
                type="number"
                min="2000"
                max="2100"
                value={venueYear}
                onChange={(event) => setVenueYear(event.target.value)}
                className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">
                {t.review_track}
              </span>
              <input
                type="text"
                value={venueTrack}
                onChange={(event) => setVenueTrack(event.target.value)}
                placeholder={t.review_track_placeholder}
                className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">
                {t.review_paper_type}
              </span>
              <select
                value={paperType}
                onChange={(event) =>
                  setPaperType(event.target.value as PaperType)
                }
                className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
              >
                <option value="research">{t.review_type_research}</option>
                <option value="position">{t.review_type_position}</option>
                <option value="survey">{t.review_type_survey}</option>
                <option value="dataset">{t.review_type_dataset}</option>
                <option value="theory">{t.review_type_theory}</option>
                <option value="use-inspired">
                  {t.review_type_use_inspired}
                </option>
                <option value="concept">{t.review_type_concept}</option>
                <option value="negative-results">
                  {t.review_type_negative_results}
                </option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-xs uppercase tracking-wide text-muted">
                {t.review_date}
              </span>
              <input
                type="date"
                value={reviewDate}
                onChange={(event) => setReviewDate(event.target.value)}
                className="w-full bg-background border border-rule rounded-md px-3 py-2 outline-none focus:border-accent"
              />
            </label>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">
              {t.review_depth}
            </span>
            <div
              role="radiogroup"
              aria-label={t.review_depth}
              className="flex items-center gap-x-5 gap-y-2 flex-wrap"
            >
              {(["standard", "deep"] as const).map((depth) => (
                <button
                  key={depth}
                  type="button"
                  role="radio"
                  aria-checked={reviewDepth === depth}
                  onClick={() => setReviewDepth(depth)}
                  className={cn(
                    "inline-flex items-center gap-2 text-sm cursor-pointer transition-colors",
                    reviewDepth === depth
                      ? "text-foreground"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  <RadioDot checked={reviewDepth === depth} />
                  {depth === "standard"
                    ? t.review_depth_standard
                    : t.review_depth_deep}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted">{t.review_depth_help}</span>
          </div>
        </div>
      )}

      {/* Model picker — a radio group. Each model has a country-of-origin
          flag so the user sees they're picking between a US model and a
          Chinese model. The same prompt is sent either way (apart from
          per-model tool_choice / provider-pin quirks). */}
      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-muted">
          {t.model}
        </span>
        <div role="radiogroup" aria-label={t.model} className="flex items-center gap-x-5 gap-y-2 flex-wrap">
          {MODEL_CATALOG.map((m) => {
            const checked = model === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => setModel(m.id)}
                className={cn(
                  "inline-flex items-center gap-2 text-sm cursor-pointer transition-colors",
                  checked ? "text-foreground" : "text-muted hover:text-foreground",
                )}
              >
                <RadioDot checked={checked} />
                {m.flag && <span className="text-base leading-none">{m.flag}</span>}
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          {mode === "review" ? t.review_form_hint : t.form_hint}
        </span>
        <button
          type="submit"
          disabled={authLoading}
          className={cn(
            "px-5 py-2 rounded-md bg-accent text-white font-medium",
            "hover:opacity-90 transition-opacity disabled:cursor-wait disabled:opacity-60",
          )}
        >
          {submitLabel ?? t.analyze}
        </button>
      </div>
      </form>
      <AnalysisAuthModal
        open={authModalOpen}
        returnTo={pathname}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}

function VenueHelp({ text }: { text: string }) {
  const [before, after = ""] = text.split("DBLP");
  return (
    <>
      {before}
      <a
        href="https://dblp.org/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="underline decoration-dotted underline-offset-2 hover:decoration-foreground transition-colors"
      >
        DBLP
      </a>
      {after}
    </>
  );
}

function ErrorBox({
  error,
  t,
  onSwitchToPaste,
  fromTab,
}: {
  error: ErrorState;
  t: Messages;
  onSwitchToPaste: () => void;
  fromTab: Tab;
}) {
  const friendly = friendlyError(error.code, t);
  const accessAction =
    error.code === "authentication_required"
      ? { href: "/login", label: t.auth_sign_in }
      : error.code === "analysis_funding_required" ||
          error.code === "jiddu_credits_required" ||
          error.code === "insufficient_jiddu_credits"
        ? { href: "/account", label: t.credits_open_account }
        : null;
  const isUrlError =
    fromTab === "url" &&
    !!error.code &&
    ["blocked", "not_found", "rate_limited", "timeout", "unreachable", "extraction_failed"].includes(
      error.code,
    );

  return (
    <div className="rounded-md border border-[var(--severity-high)]/40 bg-[color-mix(in_oklab,var(--severity-high)_8%,transparent)] p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-[var(--severity-high)]">
          {friendly.title}
        </p>
        {friendly.hint && (
          <p className="text-sm text-foreground/85 leading-snug">{friendly.hint}</p>
        )}
        <p className="text-xs text-muted mt-1 font-mono">{error.message}</p>
      </div>
      {isUrlError && (
        <div>
          <button
            type="button"
            onClick={onSwitchToPaste}
            className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md bg-accent text-white hover:opacity-90 transition-opacity"
          >
            {t.switch_to_paste}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
      {accessAction && (
        <div>
          <Link
            href={accessAction.href}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:opacity-90 transition-opacity"
          >
            {accessAction.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

function friendlyError(
  code: string | undefined,
  t: Messages,
): { title: string; hint?: string } {
  switch (code) {
    case "blocked":
      return { title: t.ingest_blocked_title, hint: t.ingest_blocked_hint };
    case "not_found":
      return { title: t.ingest_not_found_title, hint: t.ingest_not_found_hint };
    case "rate_limited":
      return { title: t.ingest_rate_limited_title, hint: t.ingest_rate_limited_hint };
    case "timeout":
      return { title: t.ingest_timeout_title, hint: t.ingest_timeout_hint };
    case "unreachable":
      return { title: t.ingest_unreachable_title, hint: t.ingest_unreachable_hint };
    case "extraction_failed":
      return {
        title: t.ingest_extraction_failed_title,
        hint: t.ingest_extraction_failed_hint,
      };
    case "invalid_url":
      return { title: t.ingest_invalid_url_title };
    case "too_short":
      return { title: t.ingest_too_short_title };
    case "authentication_required":
      return {
        title: t.auth_required_title,
        hint: t.auth_required_hint,
      };
    case "analysis_funding_required":
    case "jiddu_credits_required":
    case "insufficient_jiddu_credits":
      return {
        title: t.credits_required_title,
        hint: t.credits_required_hint,
      };
    default:
      return { title: t.analysis_failed };
  }
}

function ModeButton({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "-mb-px border-b-2 px-1 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "border-accent-hi text-accent-hi"
          : "border-transparent text-muted hover:text-foreground hover:border-rule",
      )}
    >
      {children}
    </Link>
  );
}

// Visual radio indicator — an indigo ring with a filling dot when checked.
// Uses --accent-hi so the indigo reads on both the warm-black and cream
// backgrounds (deep indigo-700 is too dim as a thin ring on dark).
function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid place-items-center h-4 w-4 rounded-full border-2 transition-colors",
        checked ? "border-accent-hi" : "border-rule",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full bg-accent-hi transition-transform",
          checked ? "scale-100" : "scale-0",
        )}
      />
    </span>
  );
}

function isImageFile(file: File): boolean {
  return (
    isSupportedImageMime(file.type) ||
    /\.(?:png|jpe?g|webp)$/i.test(file.name)
  );
}

function isSupportedImageMime(mimeType: string): boolean {
  return ["image/png", "image/jpeg", "image/webp"].includes(mimeType);
}

function clipboardImageName(mimeType: string): string {
  const extension =
    mimeType === "image/jpeg"
      ? "jpg"
      : mimeType === "image/webp"
        ? "webp"
        : "png";
  return `screenshot-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "-mb-px border-b-2 px-1 py-2.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer",
        active
          ? "border-accent-hi text-accent-hi"
          : "border-transparent text-muted hover:text-foreground hover:border-rule",
      )}
    >
      {children}
    </button>
  );
}
