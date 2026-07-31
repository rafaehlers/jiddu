import {
  JIDDU_CREDIT_RATE_TABLE,
  JIDDU_CREDIT_RATE_VERSION,
} from "@/lib/jiddu-credit-rates";

export function JidduCreditRateTable({
  liveMinimumCredits,
  liveUsdPerMinute,
}: {
  liveMinimumCredits?: number;
  liveUsdPerMinute?: number;
}) {
  const rows = JIDDU_CREDIT_RATE_TABLE.map((row) =>
    row.feature === "Live transcription" &&
    liveMinimumCredits !== undefined
      ? {
          ...row,
          detail: `${Math.ceil(liveMinimumCredits)} available credits required to start; no fixed charge or hold. Final usage is settled by audio duration${
            liveUsdPerMinute !== undefined
              ? ` at $${liveUsdPerMinute.toFixed(3)}/minute`
              : ""
          }, then the standard multiplier is applied.`,
        }
      : row,
  );
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Jiddu normally reserves the estimate below before work begins. Live
        only checks its minimum available balance; final debits use actual
        provider cost plus the configured margin.
      </p>
      <div className="overflow-x-auto rounded-lg border border-rule">
        <table className="w-full min-w-[42rem] text-sm">
          <thead className="bg-paper text-left text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 font-medium">Reservation unit</th>
              <th className="px-4 py-3 font-medium">
                Upfront reservation and fallback
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-t border-rule">
                <td className="px-4 py-3 font-medium">{row.feature}</td>
                <td className="px-4 py-3 text-muted">{row.unit}</td>
                <td className="px-4 py-3">{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-rule px-4 py-2 text-xs text-muted">
          Rate card {JIDDU_CREDIT_RATE_VERSION}. Unused reservation is
          released. The final debit can exceed the estimate when real provider
          cost, retries or reasoning tokens cost more; when usable cost data is
          unavailable, Jiddu applies the listed model fallback rate.
        </p>
      </div>
    </div>
  );
}
