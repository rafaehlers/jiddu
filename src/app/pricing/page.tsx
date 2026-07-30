import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  PricingBody,
  type PublicCreditPackage,
} from "@/components/pricing-body";
import { prisma } from "@/lib/db";
import { publicPageMetadata } from "@/lib/social-metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — pricing",
  description:
    "Explore Jiddu Credit packs for fallacy detection, fact-checking, paper explanation, live analysis and adversarial paper review.",
  path: "/pricing",
});

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const packages: PublicCreditPackage[] =
    await prisma.jidduCreditPackage.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        credits: true,
        priceCents: true,
      },
    });

  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <PricingBody
          packages={packages}
          checkoutCancelled={query.checkout === "cancelled"}
        />
      </main>
      <SiteFooter />
    </>
  );
}
