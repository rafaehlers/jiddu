import { withAuth } from "@workos-inc/authkit-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/auth-config";
import {
  creditCurrencyForLanguage,
  packagePriceCents,
} from "@/lib/credit-package-pricing";
import { prisma } from "@/lib/db";
import {
  checkoutMetadata,
  stripePriceIdForPackage,
  validateStripePrice,
} from "@/lib/stripe-billing";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user } = await withAuth();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in before purchasing credits." },
      { status: 401 },
    );
  }

  let packageId: string | undefined;
  try {
    const body = (await request.json()) as { packageId?: unknown };
    packageId =
      typeof body.packageId === "string" ? body.packageId.trim() : undefined;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!packageId) {
    return NextResponse.json(
      { error: "A credit package is required." },
      { status: 400 },
    );
  }

  const creditPackage = await prisma.jidduCreditPackage.findFirst({
    where: { id: packageId, active: true },
  });
  if (!creditPackage) {
    return NextResponse.json(
      { error: "This credit package is unavailable." },
      { status: 404 },
    );
  }

  try {
    const language = (await cookies()).get("jiddu_lang")?.value;
    const currency = creditCurrencyForLanguage(language);
    const expectedPriceCents = packagePriceCents(creditPackage, currency);
    if (!expectedPriceCents) {
      return NextResponse.json(
        { error: "This credit package is unavailable in the selected currency." },
        { status: 404 },
      );
    }

    const priceId = stripePriceIdForPackage(creditPackage.name, currency);
    await validateStripePrice({
      priceId,
      expectedPriceCents,
      expectedCurrency: currency,
    });

    const baseUrl = appBaseUrl(request.url);
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: checkoutMetadata({
        workosUserId: user.id,
        email: user.email,
        packageId: creditPackage.id,
        packageName: creditPackage.name,
        credits: creditPackage.credits,
        expectedPriceCents,
        expectedCurrency: currency,
      }),
      success_url: `${baseUrl}/account?tab=credits&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create Stripe Checkout Session:", error);
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
