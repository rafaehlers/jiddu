export function googleSearchUrl(tag: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(tag.trim())}`;
}
