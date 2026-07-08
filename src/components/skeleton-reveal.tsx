"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton-and-reveal swap (transitions.dev pattern): mounts with the
 * skeleton pulsing on top and the real content hidden underneath, then —
 * one beat after hydration — cross-fades the two (opacity + blur, see
 * globals.css `.t-skel*`). The content is server-rendered and present in
 * the DOM the whole time, so SEO/reader modes see the full page.
 *
 * `delay` is how long the skeleton holds before the reveal. Long enough to
 * register as a state ("the page is assembling"), short enough to never
 * feel like a second loading screen after the composer's skeleton.
 */
export function SkeletonReveal({
  skeleton,
  delay = 450,
  children,
}: {
  skeleton: React.ReactNode;
  delay?: number;
  children: React.ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(id);
  }, [delay]);

  return (
    <div className={cn("t-skel", revealed && "is-revealed")}>
      {/* Without JS the reveal never fires — force the content visible and
          drop the skeleton so the page still reads. */}
      <noscript>
        <style>{`.t-skel-content{opacity:1!important;filter:none!important}.t-skel-skeleton{display:none!important}`}</style>
      </noscript>
      {/* Pulse comes from the skeleton's own `skel-pulse` class (its direct
          children animate) — adding `is-pulsing` here too would nest two
          opacity animations on the same bars. */}
      <div className="t-skel-skeleton" aria-hidden>
        {skeleton}
      </div>
      <div className="t-skel-content">{children}</div>
    </div>
  );
}
