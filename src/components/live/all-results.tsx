"use client";

import type { Finding } from "@/lib/schema";
import type { NeutralityFinding } from "@/lib/neutrality-schema";
import type { Verdict } from "@/lib/verdict-schema";
import type {
  LiveClaim,
  LiveNeutralityVerdict,
} from "@/lib/live/use-live-analysis";
import { useI18n } from "@/lib/i18n/provider";
import { FindingsList } from "./findings-list";
import { LiveClaimsList } from "./claims-list";
import { LiveNeutralityList } from "./neutrality-list";
import { LiveContextPanel } from "./context-panel";
import type { LiveContext } from "@/lib/live-context-schema";

type Props = {
  findings: Finding[];
  claims: LiveClaim[];
  neutralityFindings: NeutralityFinding[];
  neutralityVerdict: LiveNeutralityVerdict | null;
  context: LiveContext;
  verdicts: ReadonlyMap<string, Verdict>;
  verifyingClaims: boolean;
  lang: "en" | "pt" | "es";
  active: boolean;
  concluded: boolean;
  onJumpToSentence?: (sentenceId: string) => void;
};

export function LiveAllResults({
  findings,
  claims,
  neutralityFindings,
  neutralityVerdict,
  context,
  verdicts,
  verifyingClaims,
  lang,
  active,
  concluded,
  onJumpToSentence,
}: Props) {
  const { t } = useI18n();
  const hasResults =
    findings.length > 0 ||
    claims.length > 0 ||
    (context.tags?.length ?? 0) > 0 ||
    (context.relatedLinks?.length ?? 0) > 0 ||
    context.topics.length > 0 ||
    context.terms.length > 0 ||
    context.segments.length > 0 ||
    neutralityFindings.length > 0 ||
    neutralityVerdict !== null;

  if (!hasResults) {
    return <p className="text-sm italic text-muted">{t.live_no_results_yet}</p>;
  }

  return (
    <div className="space-y-3">
      {(context.tags?.length ?? 0) > 0 ||
      (context.relatedLinks?.length ?? 0) > 0 ||
      context.topics.length > 0 ||
      context.terms.length > 0 ||
      context.segments.length > 0 ? (
        <LiveContextPanel
          context={context}
          active={active}
          concluded={concluded}
          onJumpToSentence={onJumpToSentence}
        />
      ) : null}
      {findings.length > 0 ? (
        <FindingsList
          findings={findings}
          lang={lang}
          showLensBadge
        />
      ) : null}
      {claims.length > 0 ? (
        <LiveClaimsList
          claims={claims}
          verdicts={verdicts}
          verifying={verifyingClaims}
          showLensBadge
        />
      ) : null}
      {neutralityFindings.length > 0 || neutralityVerdict ? (
        <LiveNeutralityList
          findings={neutralityFindings}
          verdict={neutralityVerdict}
          showLensBadge
        />
      ) : null}
    </div>
  );
}
