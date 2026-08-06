"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Expand,
  KeyRound,
  Languages,
  MousePointer2,
  Printer,
  ShieldCheck,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import type { Lang } from "@/lib/fallacies";
import { EXTENSION_PAGES_COPY } from "@/lib/extension-pages-copy";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  storeUrl: string | null;
};

const featureIcons = [MousePointer2, ShieldCheck, Printer];
const stepIcons = [Download, KeyRound, Languages];
const extensionScreenshots = [
  "/chrome-extension/001.png",
  "/chrome-extension/002.png",
  "/chrome-extension/003.png",
] as const;

const carouselCopy: Record<
  Lang,
  {
    label: string;
    close: string;
    next: string;
    open: string;
    previous: string;
    slides: [string, string, string];
  }
> = {
  en: {
    label: "Jiddu for Chrome screenshots",
    close: "Close full-size screenshot",
    next: "Next screenshot",
    open: "Open full-size screenshot",
    previous: "Previous screenshot",
    slides: [
      "Jiddu side panel showing a bias analysis beside an article",
      "Jiddu lens selector over a highlighted passage",
      "Jiddu checking factual claims in the side panel",
    ],
  },
  pt: {
    label: "Capturas do Jiddu para Chrome",
    close: "Fechar captura em tamanho original",
    next: "Próxima captura",
    open: "Abrir captura em tamanho original",
    previous: "Captura anterior",
    slides: [
      "Painel do Jiddu exibindo uma análise de parcialidade ao lado de um artigo",
      "Seletor de lentes do Jiddu sobre um trecho destacado",
      "Jiddu checando afirmações factuais no painel lateral",
    ],
  },
  es: {
    label: "Capturas de Jiddu para Chrome",
    close: "Cerrar captura a tamaño completo",
    next: "Siguiente captura",
    open: "Abrir captura a tamaño completo",
    previous: "Captura anterior",
    slides: [
      "Panel de Jiddu mostrando un análisis de sesgo junto a un artículo",
      "Selector de lentes de Jiddu sobre un pasaje resaltado",
      "Jiddu verificando afirmaciones factuales en el panel lateral",
    ],
  },
};

export function ExtensionLanding({ storeUrl }: Props) {
  const { lang } = useI18n();
  const copy = EXTENSION_PAGES_COPY[lang].landing;

  return (
    <div className="overflow-hidden">
      <section className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <div className="max-w-3xl">
          <PageTitle className="max-w-2xl">
            {copy.title}
          </PageTitle>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            {copy.description}
          </p>
        </div>

        <div className="mt-12">
          <ExtensionScreenshotsCarousel lang={lang} />
        </div>

        <div className="mt-10 max-w-3xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            {storeUrl ? (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Download aria-hidden className="size-4" />
                {copy.addToChrome}
              </a>
            ) : (
              <span className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-rule bg-paper px-5 py-3 font-semibold text-muted">
                <Download aria-hidden className="size-4" />
                {copy.comingSoon}
              </span>
            )}
            <Link
              href="/account?tab=api"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-rule bg-paper px-5 py-3 font-semibold text-foreground transition-colors hover:border-accent-edge"
            >
              <KeyRound aria-hidden className="size-4" />
              {copy.createKey}
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">{copy.requirement}</p>
        </div>
      </section>

      <section className="border-y border-rule bg-paper/50">
        <div className="mx-auto grid max-w-5xl gap-px bg-rule sm:grid-cols-3">
          {copy.features.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <article key={feature.title} className="bg-background p-7 sm:p-8">
                <Icon aria-hidden className="mb-6 size-5 text-severity-high" />
                <h2 className="font-serif text-2xl">{feature.title}</h2>
                <p className="mt-3 leading-7 text-muted">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="max-w-3xl text-balance font-serif text-4xl leading-tight sm:text-5xl">
          {copy.stepsTitle}
        </h2>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {copy.steps.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <li
                key={step.title}
                className="relative rounded-xl border border-rule bg-paper p-7"
              >
                <span className="absolute right-5 top-4 font-serif text-5xl text-rule">
                  {index + 1}
                </span>
                <Icon aria-hidden className="mb-8 size-5 text-accent-hi" />
                <h3 className="font-serif text-2xl">{step.title}</h3>
                <p className="mt-3 leading-7 text-muted">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-y border-rule bg-paper">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-balance font-serif text-4xl leading-tight sm:text-5xl">
              {copy.privacyTitle}
            </h2>
            <p className="mt-5 leading-7 text-muted">{copy.privacyDescription}</p>
          </div>
          <div className="rounded-xl border border-rule bg-background p-7 sm:p-8">
            <ul className="space-y-5">
              {copy.privacyPoints.map((point) => (
                <li key={point} className="flex gap-3 leading-7">
                  <Check
                    aria-hidden
                    className="mt-1 size-5 shrink-0 text-accent-hi"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/extension/privacy"
              className="mt-8 inline-flex items-center gap-2 font-semibold underline underline-offset-4"
            >
              <ShieldCheck aria-hidden className="size-4" />
              {copy.privacyLink}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-center font-serif text-4xl sm:text-5xl">
          {copy.faqTitle}
        </h2>
        <div className="mt-10 divide-y divide-rule border-y border-rule">
          {copy.faq.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="cursor-pointer list-none pr-8 font-semibold marker:hidden">
                {item.question}
              </summary>
              <p className="mt-3 max-w-2xl leading-7 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <Image
            src="/brand/jiddu_logo_128.webp"
            alt=""
            width={64}
            height={64}
            className="mx-auto mb-6 size-16 object-contain"
          />
          <h2 className="text-balance font-serif text-4xl sm:text-5xl">
            {copy.closingTitle}
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-muted">
            {copy.closingDescription}
          </p>
          <div className="mt-8">
            {storeUrl ? (
              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Download aria-hidden className="size-4" />
                {copy.addToChrome}
              </a>
            ) : (
              <span className="inline-flex min-h-12 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-rule bg-paper px-6 py-3 font-semibold text-muted">
                <Download aria-hidden className="size-4" />
                {copy.comingSoon}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExtensionScreenshotsCarousel({ lang }: { lang: Lang }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);
  const labels = carouselCopy[lang];

  useEffect(() => {
    const lightbox = lightboxRef.current;
    if (!lightbox) return;

    if (lightboxIndex !== null && !lightbox.open) {
      lightbox.showModal();
    } else if (lightboxIndex === null && lightbox.open) {
      lightbox.close();
    }
  }, [lightboxIndex]);

  const showPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? extensionScreenshots.length - 1 : current - 1,
    );
  };
  const showNext = () => {
    setActiveIndex((current) =>
      current === extensionScreenshots.length - 1 ? 0 : current + 1,
    );
  };

  return (
    <div
      aria-label={labels.label}
      aria-roledescription="carousel"
      className="min-w-0"
    >
      <div className="overflow-hidden rounded-2xl border border-rule bg-paper shadow-2xl shadow-black/10">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {extensionScreenshots.map((screenshot, index) => (
            <div
              key={screenshot}
              aria-hidden={index !== activeIndex}
              className="w-full shrink-0"
            >
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                tabIndex={index === activeIndex ? 0 : -1}
                aria-label={`${labels.open}: ${labels.slides[index]}`}
                className="group relative block w-full cursor-zoom-in text-left"
              >
                <Image
                  src={screenshot}
                  alt={labels.slides[index]}
                  width={1280}
                  height={800}
                  unoptimized
                  preload={index === 0}
                  className="h-auto w-full"
                />
                <span className="absolute bottom-4 right-4 inline-flex size-10 items-center justify-center rounded-full border border-white/30 bg-black/65 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Expand aria-hidden className="size-5" />
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={showPrevious}
          aria-label={labels.previous}
          className="inline-flex size-10 items-center justify-center rounded-full border border-rule bg-paper transition-colors hover:border-accent-edge hover:text-accent-hi"
        >
          <ChevronLeft aria-hidden className="size-5" />
        </button>

        <div className="flex items-center gap-2" role="group" aria-label={labels.label}>
          {extensionScreenshots.map((screenshot, index) => (
            <button
              key={screenshot}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`${index + 1} / ${extensionScreenshots.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={`size-2.5 rounded-full transition-colors ${
                index === activeIndex ? "bg-accent" : "bg-rule hover:bg-muted"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={showNext}
          aria-label={labels.next}
          className="inline-flex size-10 items-center justify-center rounded-full border border-rule bg-paper transition-colors hover:border-accent-edge hover:text-accent-hi"
        >
          <ChevronRight aria-hidden className="size-5" />
        </button>
      </div>

      <dialog
        ref={lightboxRef}
        aria-label={
          lightboxIndex === null ? labels.label : labels.slides[lightboxIndex]
        }
        onClose={() => setLightboxIndex(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            event.currentTarget.close();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            event.currentTarget.close();
          }
        }}
        className="m-auto max-h-none max-w-none overflow-visible bg-transparent p-0 text-white backdrop:bg-black/85"
      >
        {lightboxIndex !== null ? (
          <div className="relative">
            <Image
              src={extensionScreenshots[lightboxIndex]}
              alt={labels.slides[lightboxIndex]}
              width={1280}
              height={800}
              unoptimized
              className="h-auto max-h-[90vh] w-auto max-w-[96vw] rounded-lg object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => lightboxRef.current?.close()}
              aria-label={labels.close}
              className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full border border-white/25 bg-black/75 text-white transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
