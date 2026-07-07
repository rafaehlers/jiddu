"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";

type Mode = "detector" | "factcheck" | "neutrality" | "explain";

export function PipelineSidebar({ activeMode }: { activeMode: Mode }) {
  const { t, lang } = useI18n();

  const pipelines: { key: Mode; name: string; desc: string; demo: string }[] = [
    { key: "detector", name: t.mode_detector, desc: t.pipeline_fallacy_desc, demo: `/a/demo-${lang}` },
    { key: "factcheck", name: t.mode_factcheck, desc: t.pipeline_factcheck_desc, demo: `/f/demo-${lang}` },
    { key: "neutrality", name: t.mode_neutrality, desc: t.pipeline_neutrality_desc, demo: `/n/demo-${lang}` },
    { key: "explain", name: t.mode_explain, desc: t.pipeline_explain_desc, demo: `/e/demo-${lang}` },
  ];

  return (
    <aside className="lg:w-56 xl:w-64 shrink-0 flex flex-col gap-3 order-2">
      <div className="flex flex-col gap-0.5 mb-1">
        <h2 className="font-serif text-base">{t.pipelines_heading}</h2>
        <p className="text-xs text-muted">{t.pipelines_subheading}</p>
      </div>
      {pipelines.map((p) => {
        const active = p.key === activeMode;
        return (
          <div
            key={p.key}
            className={`flex flex-col gap-2 p-3 sm:p-4 border rounded-lg ${
              active ? "bg-indigo-700 border-indigo-700" : "bg-paper border-rule"
            }`}
          >
            <h3 className={`font-serif text-base font-medium ${active ? "text-white" : ""}`}>
              {p.name}
            </h3>
            <p
              className={`text-sm leading-relaxed flex-1 ${
                active ? "text-indigo-100" : "text-foreground/80"
              }`}
            >
              {p.desc}
            </p>
            <Link
              href={p.demo}
              className={`text-sm self-start transition-colors ${
                active ? "text-white" : "text-link"
              }`}
            >
              {t.see_demo} <span aria-hidden>→</span>
            </Link>
          </div>
        );
      })}
    </aside>
  );
}
