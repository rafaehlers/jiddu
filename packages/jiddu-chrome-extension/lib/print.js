const PRINT_TAB_ID_PARAM = "printTabId";

export function parsePrintTabId(search) {
  const rawValue = new URLSearchParams(search).get(PRINT_TAB_ID_PARAM);
  if (!rawValue || !/^\d+$/.test(rawValue)) return null;
  const tabId = Number(rawValue);
  return Number.isSafeInteger(tabId) && tabId > 0 ? tabId : null;
}

export function buildPrintViewUrl(baseUrl, tabId) {
  if (!Number.isSafeInteger(tabId) || tabId <= 0) {
    throw new TypeError("A valid source tab ID is required to print a report.");
  }
  const url = new URL(baseUrl);
  url.searchParams.set(PRINT_TAB_ID_PARAM, String(tabId));
  return url.toString();
}
