import assert from "node:assert/strict";
import test from "node:test";
import {
  creditCurrencyForLanguage,
  packagePriceCents,
} from "./credit-package-pricing";

test("uses BRL only for the Portuguese site language", () => {
  assert.equal(creditCurrencyForLanguage("pt"), "brl");
  assert.equal(creditCurrencyForLanguage("en"), "usd");
  assert.equal(creditCurrencyForLanguage("es"), "usd");
  assert.equal(creditCurrencyForLanguage(undefined), "usd");
});

test("selects the configured package amount for each currency", () => {
  const prices = { priceUsdCents: 1_000, priceBrlCents: 5_000 };
  assert.equal(packagePriceCents(prices, "usd"), 1_000);
  assert.equal(packagePriceCents(prices, "brl"), 5_000);
});

test("keeps a BRL-only package unavailable in USD", () => {
  const lite = { priceUsdCents: null, priceBrlCents: 1_000 };
  assert.equal(packagePriceCents(lite, "usd"), null);
  assert.equal(packagePriceCents(lite, "brl"), 1_000);
});
