export function isAllowedReportEmailOrigin(
  originHeader: string | null,
  publicBaseUrl: string,
): boolean {
  if (!originHeader) return true;

  const origin = safeOrigin(originHeader);
  const publicOrigin = safeOrigin(publicBaseUrl);
  return origin !== null && publicOrigin !== null && origin === publicOrigin;
}

function safeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}
