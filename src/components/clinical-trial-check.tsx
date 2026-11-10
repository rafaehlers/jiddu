import ReactMarkdown from "react-markdown";
import { CLINICAL_TRIAL_COPY } from "@/lib/clinical-trial-copy";
import type { ClinicalTrialReport } from "@/lib/clinical-trial-schema";
import type { PaperReviewResult } from "@/lib/paper-review-schema";

export function ClinicalTrialCheck({
  report,
  weaknesses,
  print = false,
}: {
  report: ClinicalTrialReport;
  weaknesses: PaperReviewResult["weaknesses"];
  print?: boolean;
}) {
  const copy = CLINICAL_TRIAL_COPY[report.language];
  const assessment = report.assessment;
  return (
    <div className={print ? "clinical-trial-check" : "flex flex-col gap-4"}>
      <h2 className={print ? undefined : "font-serif text-2xl"}>{copy.title}</h2>
      <div className={print ? undefined : "text-sm flex flex-col gap-2"}>
        <p className="font-semibold">{copy.designs[assessment.studyDesign]}</p>
        <p>{assessment.rationale}</p>
        <small className={print ? undefined : "text-xs text-muted"}>
          {assessment.locations.join("; ")}
        </small>
        <p className={print ? undefined : "text-sm text-muted"}>{copy.scope}</p>
      </div>
      <ul className={print ? undefined : "flex flex-col gap-3"}>
        {assessment.checks.map((item) => {
          const related = weaknesses.filter((weakness) =>
            weakness.sourceFindingIds.some((id) => item.findingIds.includes(id)),
          );
          return (
            <li
              key={item.key}
              className={print ? undefined : "border border-rule rounded-lg bg-paper p-4 sm:p-5 flex flex-col gap-2"}
            >
              <div className={print ? undefined : "flex flex-wrap items-start justify-between gap-2"}>
                <h3 className={print ? undefined : "font-serif text-lg"}>{copy.checks[item.key]}</h3>
                <span className={print ? undefined : "text-xs border border-rule rounded px-2 py-1"}>
                  {copy.statuses[item.status]}
                </span>
              </div>
              <div className={print ? undefined : "text-sm leading-relaxed"}>
                <ReactMarkdown>{item.details}</ReactMarkdown>
              </div>
              <small className={print ? undefined : "text-xs text-muted"}>{item.locations.join("; ")}</small>
              {related.length > 0 && (
                <p className={print ? undefined : "text-xs text-muted"}>
                  {copy.relatedWeaknesses}:{" "}
                  {related.map((weakness, index) => (
                    <span key={weakness.id}>
                      {index > 0 && ", "}
                      <a className="underline underline-offset-2" href={`#weakness-${weakness.id}`}>
                        {weakness.id}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
