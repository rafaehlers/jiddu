import { cn } from "@/lib/utils";

// Skeleton of the analysis/result page — same header + [reading column |
// margin cards] geometry as the real viewers (analysis/factcheck/neutrality/
// explain all share that shape), rendered as pulsing bars. Used in two spots:
// the composer shows it while the SSE stream runs (with the progress modal on
// top), and the result pages mount it as the cold layer of the skeleton-and-
// reveal swap. Purely presentational — no client hooks — so it can render
// from server components too.

// Bars need to read against both the page background and the paper cards, so
// they get their own mix rather than the (too subtle on paper) --rule tone.
const BAR = "rounded bg-[color-mix(in_oklab,var(--foreground)_11%,var(--paper))]";

function Bar({
  className,
  width,
}: {
  className?: string;
  width?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn("h-4", BAR, className)}
      style={width ? { width } : undefined}
    />
  );
}

// Deterministic pseudo-random widths for the reading column so the block
// looks like prose, not a barcode. Percent widths, one per line.
const LINE_WIDTHS = [
  96, 88, 100, 72, 94, 98, 61, 90, 97, 84, 100, 76, 92, 58,
];

export function AnalysisSkeleton({ pulsing = true }: { pulsing?: boolean }) {
  return (
    <div className={cn("flex-1 flex flex-col", pulsing && "skel-pulse")}>
      {/* Header block: title / source line / two summary lines. */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <Bar className="h-8 w-2/3 max-w-md" />
          <Bar className="h-3.5 w-44" />
          <div className="flex flex-col gap-2 max-w-3xl">
            <Bar className="h-3.5 w-full" />
            <Bar className="h-3.5 w-2/3" />
          </div>
        </div>
      </div>

      {/* Reading grid: prose card on the left, score + finding cards right. */}
      <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6 lg:gap-8">
        <div className="bg-paper border border-rule rounded-lg p-5 sm:p-8 flex flex-col gap-3.5">
          {LINE_WIDTHS.map((w, i) => (
            <Bar key={i} width={`${w}%`} />
          ))}
        </div>

        <aside className="flex flex-col gap-3">
          {/* Score card: big number + verdict pill. */}
          <div className="flex items-center gap-3 bg-paper border border-rule rounded-lg px-4 py-3">
            <Bar className="h-9 w-24" />
            <Bar className="h-5 w-28 rounded-full" />
          </div>

          {/* Margin comment cards. */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-paper border border-rule rounded-lg p-4 flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2">
                <div aria-hidden className={cn("h-2 w-2 rounded-full shrink-0", BAR)} />
                <Bar className="h-3.5 w-32" />
              </div>
              <div className="border-l-2 border-rule pl-2 flex flex-col gap-1.5">
                <Bar className="h-3 w-full" />
                <Bar className="h-3 w-4/5" />
              </div>
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-2/3" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
