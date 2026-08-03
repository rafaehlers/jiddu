"use client";

import {
  Check,
  Download,
  KeyRound,
  Languages,
  MousePointer2,
  Printer,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { EXTENSION_PAGES_COPY } from "@/lib/extension-pages-copy";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  storeUrl: string | null;
};

const featureIcons = [MousePointer2, ShieldCheck, Printer];
const stepIcons = [Download, KeyRound, Languages];

export function ExtensionLanding({ storeUrl }: Props) {
  const { lang } = useI18n();
  const copy = EXTENSION_PAGES_COPY[lang].landing;

  return (
    <div className="overflow-hidden">
      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="mb-4 text-xs font-semibold tracking-[0.22em] text-severity-high">
            {copy.eyebrow}
          </p>
          <h1 className="max-w-2xl text-balance font-serif text-5xl leading-[0.96] tracking-tight sm:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            {copy.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

        <ExtensionDemo copy={copy} />
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
        <p className="text-xs font-semibold tracking-[0.22em] text-severity-high">
          {copy.stepsEyebrow}
        </p>
        <h2 className="mt-4 max-w-3xl text-balance font-serif text-4xl leading-tight sm:text-5xl">
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
            <p className="text-xs font-semibold tracking-[0.22em] text-severity-high">
              {copy.privacyEyebrow}
            </p>
            <h2 className="mt-4 text-balance font-serif text-4xl leading-tight sm:text-5xl">
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
        <p className="text-center text-xs font-semibold tracking-[0.22em] text-severity-high">
          {copy.faqEyebrow}
        </p>
        <h2 className="mt-4 text-center font-serif text-4xl sm:text-5xl">
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

function ExtensionDemo({
  copy,
}: {
  copy: (typeof EXTENSION_PAGES_COPY)["en"]["landing"];
}) {
  return (
    <div className="relative rounded-2xl border border-rule bg-paper p-3 shadow-2xl shadow-black/10 sm:p-4">
      <div className="flex items-center gap-1.5 border-b border-rule px-2 pb-3">
        <span className="size-2.5 rounded-full bg-severity-high" />
        <span className="size-2.5 rounded-full bg-severity-low" />
        <span className="size-2.5 rounded-full bg-rule" />
        <span className="ml-3 h-6 flex-1 rounded-md border border-rule bg-background" />
      </div>
      <div className="grid gap-3 pt-3 sm:grid-cols-[1fr_0.72fr]">
        <article className="min-h-80 rounded-xl border border-rule bg-background p-6">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-muted">
            {copy.demoEyebrow}
          </p>
          <h2 className="mt-3 font-serif text-2xl leading-tight">
            {copy.demoTitle}
          </h2>
          <p className="mt-8 text-sm leading-7 text-muted">
            {copy.demoPassage.slice(0, 23)}{" "}
            <mark className="rounded-sm bg-severity-low/30 px-1 text-foreground ring-1 ring-severity-low">
              {copy.demoPassage.slice(23)}
            </mark>
          </p>
          <div className="mt-6 rounded-lg border border-rule bg-paper p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
              {copy.selectedPassage}
            </p>
            <div className="grid gap-2">
              {copy.lenses.map((lens, index) => (
                <div
                  key={lens.name}
                  className={`rounded-md border px-3 py-2 ${
                    index === 0
                      ? "border-accent-edge bg-accent/10"
                      : "border-rule"
                  }`}
                >
                  <p className="text-xs font-semibold">{lens.name}</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {lens.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
        <aside className="rounded-xl bg-[#1d1c19] p-5 text-[#f4efe4]">
          <div className="flex items-center gap-2 border-b border-white/15 pb-4">
            <Image
              src="/brand/jiddu_logo_inverted_128.webp"
              alt=""
              width={30}
              height={30}
              className="size-7 object-contain"
            />
            <span className="font-serif text-lg">Jiddu</span>
          </div>
          <p className="mt-7 text-[10px] font-semibold tracking-[0.18em] text-[#e45f47]">
            {copy.resultEyebrow}
          </p>
          <h3 className="mt-3 font-serif text-2xl leading-tight">
            {copy.resultTitle}
          </h3>
          <p className="mt-4 text-xs leading-6 text-[#c8c0b2]">
            {copy.resultBody}
          </p>
          <span className="mt-6 inline-flex rounded-full border border-white/20 px-3 py-1 text-[10px]">
            {copy.resultTag}
          </span>
        </aside>
      </div>
    </div>
  );
}
