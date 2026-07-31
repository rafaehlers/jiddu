"use client";

import { useCallback, useEffect, useRef } from "react";

export function AdminTableScrollShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const topScrollRef = useRef<HTMLDivElement>(null);
  const topSpacerRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const updateTopScrollbar = useCallback(() => {
    const topScroll = topScrollRef.current;
    const topSpacer = topSpacerRef.current;
    const tableScroll = tableScrollRef.current;
    if (!topScroll || !topSpacer || !tableScroll) return;

    topSpacer.style.width = `${tableScroll.scrollWidth}px`;
    topScroll.hidden =
      tableScroll.scrollWidth <= tableScroll.clientWidth + 1;
  }, []);

  useEffect(() => {
    updateTopScrollbar();

    const tableScroll = tableScrollRef.current;
    if (!tableScroll) return;

    const observer = new ResizeObserver(updateTopScrollbar);
    observer.observe(tableScroll);
    const table = tableScroll.firstElementChild;
    if (table) observer.observe(table);

    return () => observer.disconnect();
  }, [updateTopScrollbar]);

  const syncScroll = (
    source: HTMLDivElement | null,
    target: HTMLDivElement | null,
  ) => {
    if (!source || !target || source.scrollLeft === target.scrollLeft) return;
    target.scrollLeft = source.scrollLeft;
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border border-rule ${className}`}
    >
      <div
        ref={topScrollRef}
        hidden
        tabIndex={0}
        role="region"
        aria-label="Horizontal table scroll"
        className="admin-table-top-scrollbar overflow-x-scroll overscroll-x-contain border-b border-rule"
        onScroll={() =>
          syncScroll(topScrollRef.current, tableScrollRef.current)
        }
      >
        <div ref={topSpacerRef} className="h-4" aria-hidden="true" />
      </div>
      <div
        ref={tableScrollRef}
        className="overflow-x-auto overscroll-x-contain"
        onScroll={() =>
          syncScroll(tableScrollRef.current, topScrollRef.current)
        }
      >
        {children}
      </div>
    </div>
  );
}
