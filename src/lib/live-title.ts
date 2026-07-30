const DEFAULT_TIME_ZONE = "America/Sao_Paulo";
const MAX_TOPIC_LENGTH = 72;

type LiveTitleInput = {
  createdAt: Date;
  summary?: string | null;
  transcript?: string | null;
  language?: string | null;
  timeZone?: string | null;
};

type AnalysisTitleInput = LiveTitleInput & {
  title?: string | null;
  source: string;
};

export function resolveAnalysisTitle(input: AnalysisTitleInput): string | null {
  const storedTitle = input.title?.trim();
  if (storedTitle) return storedTitle;
  if (input.source !== "live") return null;
  return buildLiveAnalysisTitle(input);
}

export function buildLiveAnalysisTitle(input: LiveTitleInput): string {
  const timestamp = formatLiveTimestamp(input.createdAt, input.timeZone);
  const topic =
    briefTopic(input.summary) ||
    briefTopic(input.transcript) ||
    fallbackTopic(input.language);
  return `${timestamp} — ${topic}`;
}

export function briefTopic(value?: string | null): string {
  if (!value) return "";
  let text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";

  const genericSubject = /^(?:the\s+)?(?:passage|text|speaker|conversation|discussion|transcript)\b/i;
  const genericSubjectPtEs =
    /^(?:(?:o|a|el|la)\s+)?(?:trecho|texto|falante|conversa|discussão|discusión|transcrição|transcripción)\b/i;
  if (genericSubject.test(text) || genericSubjectPtEs.test(text)) {
    const marker = text.match(
      /\b(?:about|regarding|on|sobre|a respeito de|acerca de)\s+/i,
    );
    if (marker?.index != null) {
      text = text.slice(marker.index + marker[0].length);
    }
  }

  text =
    text.split(
      /\s+(?:and then|but then|but|while|whereas|e depois|mas|enquanto|y luego|pero|mientras)\s+|[;.!?]\s*/i,
    )[0] ?? text;
  text = text.replace(/^[\s"'“”‘’()[\]{}:–—-]+|[\s"'“”‘’()[\]{}:–—-]+$/g, "");
  if (!text) return "";

  if (text.length > MAX_TOPIC_LENGTH) {
    const clipped = text.slice(0, MAX_TOPIC_LENGTH + 1);
    const lastSpace = clipped.lastIndexOf(" ");
    text = `${clipped.slice(0, lastSpace > 36 ? lastSpace : MAX_TOPIC_LENGTH).trim()}…`;
  }

  return text.charAt(0).toLocaleUpperCase() + text.slice(1);
}

function formatLiveTimestamp(date: Date, requestedTimeZone?: string | null) {
  const timeZone = validTimeZone(requestedTimeZone) ?? DEFAULT_TIME_ZONE;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}`;
}

function validTimeZone(value?: string | null): string | null {
  if (!value || value.length > 100) return null;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    return null;
  }
}

function fallbackTopic(language?: string | null): string {
  if (language === "pt") return "Sessão ao vivo";
  if (language === "es") return "Sesión en vivo";
  return "Live session";
}
