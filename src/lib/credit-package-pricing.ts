export type CreditCurrency = "usd" | "brl";

export type CreditPackagePrices = {
  priceUsdCents: number | null;
  priceBrlCents: number | null;
};

export function creditCurrencyForLanguage(
  language: string | null | undefined,
): CreditCurrency {
  return language === "pt" ? "brl" : "usd";
}

export function packagePriceCents(
  creditPackage: CreditPackagePrices,
  currency: CreditCurrency,
): number | null {
  return currency === "brl"
    ? creditPackage.priceBrlCents
    : creditPackage.priceUsdCents;
}
