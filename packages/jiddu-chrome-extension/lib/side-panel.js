const SIDE_PANEL_PATH = "sidepanel.html";

export function defaultSidePanelOptions() {
  return {
    path: SIDE_PANEL_PATH,
    enabled: false,
  };
}

export function tabSidePanelOptions(tabId) {
  if (!Number.isSafeInteger(tabId) || tabId <= 0) {
    throw new TypeError("A valid tab ID is required to enable the side panel.");
  }
  return {
    tabId,
    path: SIDE_PANEL_PATH,
    enabled: true,
  };
}
