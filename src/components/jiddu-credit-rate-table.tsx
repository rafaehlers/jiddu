import {
  JIDDU_CREDIT_RATE_TABLE,
  JIDDU_CREDIT_RATE_VERSION,
} from "@/lib/jiddu-credit-rates";

export function JidduCreditRateTable({
  liveTranscriptionCredits,
}: {
  liveTranscriptionCredits?: number;
}) {
  const rows = JIDDU_CREDIT_RATE_TABLE.map((row) =>
    row.feature === "Live transcription" &&
    liveTranscriptionCredits !== undefined
      ? {
          ...row,
          detail: `${Math.ceil(liveTranscriptionCredits)} fixed credits for one GPT Live Transcribe session, capped at 60 minutes.`,
        }
      : row,
  );
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">
        Jiddu reserves the amount below before work begins. Except for the
        fixed Live transcription charge, the final debit normally uses the
        provider&apos;s actual cost plus the configured margin.
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
