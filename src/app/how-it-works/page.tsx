import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HowItWorksBody } from "@/components/how-it-works-body";
import { publicPageMetadata } from "@/lib/social-metadata";
import { loadSettings, loadStringSettings } from "@/lib/settings";
import { analysisRoutingFromSettings } from "@/lib/analysis-routing";
import {
  creditsForModels,
  maxCreditsForCalls,
  paperReviewMaximumModels,
} from "@/lib/jiddu-credit-rates";

export const metadata: Metadata = publicPageMetadata({
  title: "Jiddu — how it works",
  description:
    "Technical walkthrough of Jiddu's analysis pipelines, Jiddu Context, credit billing, model routing, privacy, limitations, and methodology.",
  path: "/how-it-works",
});

export default async function HowItWorksPage() {
  const [settings, stringSettings] = await Promise.all([
    loadSettings(),
    loadStringSettings(),
  ]);
  const routing = analysisRoutingFromSettings(stringSettings);
  const selectedModel = routing.modelChain[0];
  const creditEstimates = {
    baseCall: maxCreditsForCalls(routing.modelChain, 1),
    standardReview: creditsForModels(
      paperReviewMaximumModels({ depth: "standard", selectedModel }),
    ),
    deepReview: creditsForModels(
      paperReviewMaximumModels({
        depth: "deep",
        selectedModel,
        deepModel: stringSettings["paperReview.deepModel"],
        criticModel: stringSettings["paperReview.criticModel"],
      }),
    ),
  };
  return (
    <>
      <SiteHeader variant="guide" />
      <main className="flex-1">
        <HowItWorksBody
          creditEstimates={creditEstimates}
          liveMinimumCredits={settings["credits.liveTranscription"]}
        />
      </main>
      <SiteFooter />
    </>
  );
}
