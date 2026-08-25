export type NegotiatedRepresentation = "html" | "markdown" | null;

type MediaRange = {
  type: string;
  subtype: string;
  q: number;
  order: number;
  specificity: number;
};

type Match = Pick<MediaRange, "q" | "order" | "specificity">;

export function negotiateAgentRepresentation(
  accept: string | null,
): NegotiatedRepresentation {
  if (!accept?.trim()) return "html";
  const ranges = parseAccept(accept);
  if (ranges.length === 0) return "html";

  const markdown = bestMatch("text", "markdown", ranges);
  const html = bestMatch("text", "html", ranges);
  if ((!markdown || markdown.q === 0) && (!html || html.q === 0)) {
    return ranges.some(
      (range) =>
        range.q > 0 &&
        ((range.type === "text" && range.subtype === "plain") ||
          (range.type === "*" && range.subtype === "*")),
    )
      ? "html"
      : null;
  }
  if (!markdown || markdown.q === 0) return "html";
  if (!html || html.q === 0) return "markdown";
  if (markdown.q !== html.q) return markdown.q > html.q ? "markdown" : "html";
  if (markdown.specificity !== html.specificity) {
    return markdown.specificity > html.specificity ? "markdown" : "html";
  }
  if (markdown.order !== html.order) {
    return markdown.order < html.order ? "markdown" : "html";
  }
  return "html";
}

export function mergeVaryHeader(
  existing: string | null,
  ...values: string[]
): string {
  const merged = new Map<string, string>();
  for (const value of [...(existing?.split(",") ?? []), ...values]) {
    const normalized = value.trim();
    if (normalized) merged.set(normalized.toLowerCase(), normalized);
  }
  return [...merged.values()].join(", ");
}

function parseAccept(header: string): MediaRange[] {
  return header
    .split(",")
    .map((part, order) => {
      const [mediaType, ...parameters] = part.split(";");
      const [type, subtype] = mediaType.trim().toLowerCase().split("/");
      if (!type || !subtype) return null;
      let q = 1;
      for (const parameter of parameters) {
        const [name, rawValue] = parameter.trim().split("=");
        if (name?.toLowerCase() !== "q") continue;
        const parsed = Number(rawValue);
        q = Number.isFinite(parsed) ? Math.max(0, Math.min(1, parsed)) : 0;
      }
      const specificity = type === "*" ? 0 : subtype === "*" ? 1 : 2;
      return { type, subtype, q, order, specificity };
    })
    .filter((range): range is MediaRange => Boolean(range));
}

function bestMatch(
  type: string,
  subtype: string,
  ranges: MediaRange[],
): Match | null {
  const matches = ranges.filter(
    (range) =>
      (range.type === "*" || range.type === type) &&
      (range.subtype === "*" || range.subtype === subtype),
  );
  if (matches.length === 0) return null;
  matches.sort(
    (a, b) => b.specificity - a.specificity || a.order - b.order,
  );
  return matches[0];
}
