const BUILD_VERSION_PATTERN =
  /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):[0-5]\d [0-9a-f]{7}$/;

export function normalizeBuildVersion(
  value: string | undefined,
): string | null {
  const normalized = value?.trim();

  return normalized && BUILD_VERSION_PATTERN.test(normalized)
    ? normalized
    : null;
}
