"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

export type PublicCreditPackage = {
  id: string;
  name: string;
  description: string | null;
  credits: number;
  priceCents: number;
};

const COPY = {
  en: {
    eyebrow: "Jiddu Credits",
    title: "Simple credit packs for every kind of reading.",
    subtitle:
      "Pay only for the analyses you run. Packages will be available for one-time purchase when checkout launches.",
    credits: "Jiddu Credits",
    perHundred: (amount: string) => `${amount} per 100 credits`,
    buy: "Buy",
    comingSoon: "Checkout coming soon",
    emptyTitle: "Packages are being prepared.",
    emptyBody: "Check back soon for the first Jiddu Credit offers.",
    explainerTitle: "How credits work",
    explainerBody:
      "Jiddu reserves an estimate before work starts, settles metered calls from completed usage, and returns any unused reservation to your balance.",
    learnMore: "Read the billing details",
  },
  pt: {
    eyebrow: "Créditos Jiddu",
    title: "Pacotes simples para todo tipo de leitura.",
    subtitle:
      "Pague apenas pelas análises que executar. Os pacotes estarão disponíveis para compra única quando o checkout for lançado.",
    credits: "Créditos Jiddu",
    perHundred: (amount: string) => `${amount} por 100 créditos`,
    buy: "Comprar",
    comingSoon: "Checkout em breve",
    emptyTitle: "Os pacotes estão sendo preparados.",
    emptyBody: "Volte em breve para conhecer as primeiras ofertas de Créditos Jiddu.",
    explainerTitle: "Como os créditos funcionam",
    explainerBody:
      "O Jiddu reserva uma estimativa antes de começar, liquida as chamadas medidas pelo uso concluído e devolve ao saldo qualquer reserva não utilizada.",
    learnMore: "Ver os detalhes de cobrança",
  },
  es: {
    eyebrow: "Créditos Jiddu",
    title: "Paquetes simples para todo tipo de lectura.",
    subtitle:
      "Paga solo por los análisis que ejecutes. Los paquetes estarán disponibles como compra única cuando se lance el checkout.",
    credits: "Créditos Jiddu",
    perHundred: (amount: string) => `${amount} por 100 créditos`,
    buy: "Comprar",
    comingSoon: "Checkout próximamente",
    emptyTitle: "Los paquetes se están preparando.",
    emptyBody: "Vuelve pronto para conocer las primeras ofertas de Créditos Jiddu.",
    explainerTitle: "Cómo funcionan los créditos",
    explainerBody:
      "Jiddu reserva una estimación antes de comenzar, liquida las llamadas medidas según el uso completado y devuelve al saldo cualquier reserva no utilizada.",
    learnMore: "Ver los detalles de cobro",
  },
} as const;

export function PricingBody({
  packages,
}: {
  packages: PublicCreditPackage[];
}) {
  const { lang } = useI18n();
  const copy = COPY[lang];
  const locale = lang === "pt" ? "pt-BR" : lang === "es" ? "es" : "en-US";
  const integer = new Intl.NumberFormat(locale);
  const usd = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
      <div className="max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {copy.subtitle}
        </p>
      </div>

      {packages.length === 0 ? (
        <div className="mt-10 rounded-lg border border-rule bg-paper p-6">
          <h2 className="font-serif text-2xl">{copy.emptyTitle}</h2>
          <p className="mt-2 text-sm text-muted">{copy.emptyBody}</p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {packages.map((item) => {
            const price = item.priceCents / 100;
            const pricePerHundred = (price / item.credits) * 100;
            return (
              <article
                key={item.id}
                className="flex min-h-80 flex-col rounded-lg border border-rule bg-paper p-5"
              >
                <h2 className="font-serif text-2xl">{item.name}</h2>
                <p className="mt-4 font-serif text-4xl leading-none">
                  {usd.format(price)}
                </p>
                <p className="mt-5 text-lg font-medium tabular-nums">
                  {integer.format(item.credits)}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted">
                  {copy.credits}
                </p>
                {item.description && (
                  <p className="mt-5 text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                )}
                <div className="mt-auto pt-6">
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    title={copy.comingSoon}
                    className="w-full cursor-not-allowed rounded-md border border-rule bg-background px-4 py-2.5 text-sm font-medium text-muted opacity-60"
                  >
                    {copy.buy}
                  </button>
                  <p className="mt-2 text-center text-xs text-muted">
                    {copy.comingSoon}
                  </p>
                  <p className="mt-3 text-center text-xs text-muted">
                    {copy.perHundred(usd.format(pricePerHundred))}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <aside className="mt-8 rounded-lg border border-rule p-5 sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div>
          <h2 className="font-serif text-2xl">{copy.explainerTitle}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
            {copy.explainerBody}
          </p>
        </div>
        <Link
          href="/how-it-works#section-10"
          className="mt-4 inline-flex shrink-0 text-sm sm:mt-0"
        >
          {copy.learnMore} →
        </Link>
      </aside>
    </section>
  );
}
