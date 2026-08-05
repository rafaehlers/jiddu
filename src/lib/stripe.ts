import "server-only";

import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-07-29.dahlia" as const;

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: STRIPE_API_VERSION,
      maxNetworkRetries: 2,
    });
  }

  return stripeClient;
}
