import "server-only";

import type { CreditCurrency } from "@/lib/credit-package-pricing";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

const PRICE_ENV_KEYS = {
  lite: { brl: "STRIPE_PRICE_BRL_LITE" },
  starter: {
    usd: "STRIPE_PRICE_STARTER",
    brl: "STRIPE_PRICE_BRL_STARTER",
  },
  plus: { usd: "STRIPE_PRICE_PLUS", brl: "STRIPE_PRICE_BRL_PLUS" },
  pro: { usd: "STRIPE_PRICE_PRO", brl: "STRIPE_PRICE_BRL_PRO" },
  studio: {
    usd: "STRIPE_PRICE_STUDIO",
    brl: "STRIPE_PRICE_BRL_STUDIO",
  },
} as const;

export type StripePackageKey = keyof typeof PRICE_ENV_KEYS;
export type StripeCurrency = CreditCurrency;

type CheckoutMetadata = {
  workosUserId: string;
  email: string;
  packageId: string;
  packageName: string;
  credits: number;
  expectedPriceCents: number;
  expectedCurrency: StripeCurrency;
};

export function stripePackageKey(name: string): StripePackageKey | null {
  const normalized = name
    .trim()
    .toLocaleLowerCase("en-US")
    .replace(/^jiddu\s+/, "");
  return normalized in PRICE_ENV_KEYS
    ? (normalized as StripePackageKey)
    : null;
}

export function stripePriceIdForPackage(
  name: string,
  currency: StripeCurrency,
): string {
  const packageKey = stripePackageKey(name);
  if (!packageKey) {
    throw new Error(`No Stripe Price mapping exists for package "${name}".`);
  }

  const currencyMap: Partial<Record<StripeCurrency, string>> =
    PRICE_ENV_KEYS[packageKey];
  const envKey = currencyMap[currency];
  if (!envKey) {
    throw new Error(
      `Package "${name}" is not available in ${currency.toUpperCase()}.`,
    );
  }
  const priceId = process.env[envKey]?.trim();
  if (!priceId) {
    throw new Error(`${envKey} is not configured.`);
  }

  return priceId;
}

export function checkoutMetadata(input: CheckoutMetadata) {
  return {
    integration: "jiddu_credit_purchase",
    workosUserId: input.workosUserId,
    email: input.email,
    packageId: input.packageId,
    packageName: input.packageName,
    credits: String(input.credits),
    expectedPriceCents: String(input.expectedPriceCents),
    currency: input.expectedCurrency,
  };
}

function isStripeCurrency(value: string): value is StripeCurrency {
  return value === "usd" || value === "brl";
}

function parseCheckoutMetadata(
  metadata: Record<string, string> | null,
): CheckoutMetadata {
  const workosUserId = metadata?.workosUserId?.trim();
  const email = metadata?.email?.trim();
  const packageId = metadata?.packageId?.trim();
  const packageName = metadata?.packageName?.trim();
  const credits = Number(metadata?.credits);
  const expectedPriceCents = Number(metadata?.expectedPriceCents);
  // Checkout Sessions created before BRL support did not carry a currency
  // field. Treat those in-flight purchases as the original USD offering.
  const expectedCurrency = (metadata?.currency ?? "usd").toLowerCase();

  if (
    metadata?.integration !== "jiddu_credit_purchase" ||
    !workosUserId ||
    !email ||
    !packageId ||
    !packageName ||
    !Number.isSafeInteger(credits) ||
    credits <= 0 ||
    !Number.isSafeInteger(expectedPriceCents) ||
    expectedPriceCents <= 0 ||
    !isStripeCurrency(expectedCurrency)
  ) {
    throw new Error("Checkout Session metadata is incomplete or invalid.");
  }

  return {
    workosUserId,
    email,
    packageId,
    packageName,
    credits,
    expectedPriceCents,
    expectedCurrency,
  };
}

function stripeObjectId(value: { id: string } | string | null): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function validateStripePrice(input: {
  priceId: string;
  expectedPriceCents: number;
  expectedCurrency: StripeCurrency;
}) {
  const price = await getStripe().prices.retrieve(input.priceId);

  if (!price.active) {
    throw new Error(`Stripe Price ${price.id} is inactive.`);
  }
  if (price.type !== "one_time") {
    throw new Error(`Stripe Price ${price.id} must be a one-time price.`);
  }
  if (price.currency !== input.expectedCurrency) {
    throw new Error(
      `Stripe Price ${price.id} must use ${input.expectedCurrency.toUpperCase()}.`,
    );
  }
  if (price.unit_amount !== input.expectedPriceCents) {
    throw new Error(
      `Stripe Price ${price.id} does not match the configured package amount.`,
    );
  }

  return price;
}

export async function fulfillStripeCheckoutSession(
  sessionId: string,
  expectedWorkosUserId?: string,
) {
  const existing = await prisma.stripeCreditPurchase.findUnique({
    where: { stripeCheckoutSessionId: sessionId },
  });
  if (existing) {
    if (
      expectedWorkosUserId &&
      existing.workosUserId !== expectedWorkosUserId
    ) {
      throw new Error("Checkout Session belongs to a different user.");
    }
    return { purchase: existing, duplicate: true };
  }

  const session = await getStripe().checkout.sessions.retrieve(sessionId, {
    expand: ["line_items.data.price"],
  });

  if (session.mode !== "payment" || session.status !== "complete") {
    throw new Error("Checkout Session is not a completed one-time payment.");
  }
  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return { purchase: null, duplicate: false };
  }

  const metadata = parseCheckoutMetadata(session.metadata);
  if (
    expectedWorkosUserId &&
    metadata.workosUserId !== expectedWorkosUserId
  ) {
    throw new Error("Checkout Session belongs to a different user.");
  }
  if (session.client_reference_id !== metadata.workosUserId) {
    throw new Error("Checkout Session user reference does not match metadata.");
  }

  const lineItems = session.line_items?.data ?? [];
  if (lineItems.length !== 1 || lineItems[0]?.quantity !== 1) {
    throw new Error("Checkout Session must contain exactly one credit package.");
  }

  const price = lineItems[0]?.price;
  if (!price || typeof price === "string") {
    throw new Error("Checkout Session Price was not expanded.");
  }

  const expectedPriceId = stripePriceIdForPackage(
    metadata.packageName,
    metadata.expectedCurrency,
  );
  if (
    price.id !== expectedPriceId ||
    price.type !== "one_time" ||
    price.currency !== metadata.expectedCurrency ||
    price.unit_amount !== metadata.expectedPriceCents ||
    session.amount_total !== metadata.expectedPriceCents ||
    session.currency !== metadata.expectedCurrency
  ) {
    throw new Error("Checkout Session amount or Price validation failed.");
  }

  const paymentIntentId = stripeObjectId(session.payment_intent);
  const customerId = stripeObjectId(session.customer);

  try {
    const purchase = await prisma.$transaction(async (tx) => {
      const createdPurchase = await tx.stripeCreditPurchase.create({
        data: {
          stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: paymentIntentId,
          stripeCustomerId: customerId,
          stripePriceId: price.id,
          workosUserId: metadata.workosUserId,
          email: metadata.email,
          packageId: metadata.packageId,
          packageName: metadata.packageName,
          credits: metadata.credits,
          amountCents: metadata.expectedPriceCents,
          currency: price.currency,
          livemode: session.livemode,
        },
      });

      const account = await tx.jidduCreditAccount.upsert({
        where: { workosUserId: metadata.workosUserId },
        create: {
          workosUserId: metadata.workosUserId,
          email: metadata.email,
          balance: metadata.credits,
        },
        update: {
          email: metadata.email,
          balance: { increment: metadata.credits },
        },
        select: { balance: true },
      });

      await tx.jidduCreditTransaction.create({
        data: {
          workosUserId: metadata.workosUserId,
          amount: metadata.credits,
          balanceAfter: account.balance,
          kind: "purchase",
          resourceId: session.id,
          note: `Purchased ${metadata.packageName} credit pack`,
          metadata: JSON.stringify({
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: paymentIntentId,
            stripePriceId: price.id,
            packageId: metadata.packageId,
            packageName: metadata.packageName,
            amountCents: metadata.expectedPriceCents,
            currency: session.currency,
            livemode: session.livemode,
          }),
        },
      });

      return createdPurchase;
    });

    return { purchase, duplicate: false };
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    const purchase = await prisma.stripeCreditPurchase.findUnique({
      where: { stripeCheckoutSessionId: session.id },
    });
    if (!purchase) throw error;
    return { purchase, duplicate: true };
  }
}
