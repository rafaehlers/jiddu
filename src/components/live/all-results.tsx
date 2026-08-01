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

type Props = {
  findings: Finding[];
  claims: LiveClaim[];
  neutralityFindings: NeutralityFinding[];
  neutralityVerdict: LiveNeutralityVerdict | null;
  verdicts: ReadonlyMap<string, Verdict>;
  verifyingClaims: boolean;
  lang: "en" | "pt" | "es";
};

export function LiveAllResults({
  findings,
  claims,
  neutralityFindings,
  neutralityVerdict,
  verdicts,
  verifyingClaims,
  lang,
}: Props) {
  const { t } = useI18n();
  const hasResults =
    findings.length > 0 ||
    claims.length > 0 ||
    neutralityFindings.length > 0 ||
    neutralityVerdict !== null;

  if (!hasResults) {
    return <p className="text-sm italic text-muted">{t.live_no_results_yet}</p>;
  }

  return (
    <div className="space-y-3">
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
