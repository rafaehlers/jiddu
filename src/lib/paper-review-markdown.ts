import type { PaperReviewResult } from "./paper-review-schema";
import type { ResolvedVenueProfile } from "./venues";

export const PAPER_REVIEW_DISCLAIMER =
  "This review is AI-generated, may miss domain-specific nuance, and should be validated by a human expert before acting on it.";

export function paperReviewToMarkdown(
  review: PaperReviewResult,
  venueProfile?: ResolvedVenueProfile | null,
): string {
  const strengths =
    review.strengths.length > 0
      ? review.strengths
          .map(
            (strength) =>
              `- ${strength.text} (${strength.locations.join("; ")})`,
          )
          .join("\n")
      : "- No defensible strengths were retained.";

  const weaknesses =
    review.weaknesses.length > 0
      ? review.weaknesses
          .map(
            (weakness, index) =>
              `${index + 1}. **[${weakness.id} — ${weakness.severity}] ${weakness.title}.** ${weakness.body} (${weakness.locations.join("; ")})`,
          )
          .join("\n\n")
      : "1. No substantive weaknesses were retained.";

  const questions =
    review.questions.length > 0
      ? review.questions
          .map((question, index) => `${index + 1}. ${question}`)
          .join("\n")
      : "1. No questions.";

  const publicationPath = review.publicationPath
    .map((step, index) => `${index + 1}. ${step}`)
    .join(" ");
  const venueStandard = venueProfile
    ? `### Venue Standard Applied

**Status:** ${venueProfile.profileVerified ? "Verified official profile" : "Unverified generic/closest profile"}

${venueProfile.verificationNote}

${venueProfile.criteria
  .map(
    (criterion) =>
      `- **${criterion.label}:** ${criterion.guidance}`,
  )
  .join("\n")}

${
  venueProfile.officialSources.length > 0
    ? `Official sources: ${venueProfile.officialSources
        .map((source) => `[${source.label}](${source.url})`)
        .join(", ")}`
    : "Official sources: none available."
}

`
    : "";
  const audit = review.audit
    ? `### Review Quality Audit

- **Depth:** ${review.audit.depth}
- **Independent specialist findings:** ${review.audit.specialistFindings} (${review.audit.retainedFindings} retained, ${review.audit.dismissedFindings} dismissed)
- **Deterministic computation checks:** ${review.audit.computationChecks} (${review.audit.computationFailures} failed)
- **Source validation:** ${review.audit.sourcesVerified} verified, ${review.audit.sourcesUnverified} unverified
- **Independent critic:** ${review.audit.criticModel} (${review.audit.criticFlags} flags)

${review.audit.methodology}

`
    : "";
  const sources =
    review.sources.length > 0
      ? `### Published Literature Consulted

${review.sources
  .map(
    (source) =>
      `- [${source.title || source.url}](${source.url}) — ${source.verificationStatus ?? "not audited"}; ${source.publicationType ?? "unknown type"}`,
  )
  .join("\n")}

`
      : "";

  return `## AI Paper Review

**Paper:** ${review.paper}
**Author:** ${review.author}
**Venue target:** ${review.venueTarget}
**Review date:** ${review.reviewDate}

${venueStandard}
${audit}
### Stage Findings

**Story:** ${review.stageFindings.story}

**Presentation:** ${review.stageFindings.presentation}

**Evaluations:** ${review.stageFindings.evaluations}

**Correctness:** ${review.stageFindings.correctness}

**Significance:** ${review.stageFindings.significance}

### Review

**Summary** — ${review.summary}

**Strengths**

${strengths}

**Weaknesses**

${weaknesses}

**Questions for the Authors**

${questions}

**Overall Assessment** — ${review.overallAssessment}

${publicationPath}

**Recommendation:** ${review.recommendation}.

${sources}
*${PAPER_REVIEW_DISCLAIMER}*
`;
}

export function paperReviewFilename(review: PaperReviewResult): string {
  const shortTitle = review.paper
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${shortTitle || "paper"} — review adversarial ${review.reviewDate}.md`;
}
