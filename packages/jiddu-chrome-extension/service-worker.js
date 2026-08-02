import {
  DEFAULT_API_BASE,
  LENSES,
  MIN_API_TEXT_CHARS,
  endpointForLens,
  friendlyApiError,
  mergeChunkResults,
  normalizeApiBase,
  normalizeSelectionText,
  splitIntoApiChunks,
} from "./lib/api.js";
import {
  DEFAULT_UI_LANG,
  formatUiMessage,
  getInspectorMessages,
  getUiMessages,
  normalizeUiLang,
} from "./lib/i18n.js";

const STATE_PREFIX = "jiddu:analysis:";
const SETTINGS_KEY = "jiddu:settings";

void initializeExtension();

chrome.runtime.onInstalled.addListener(() => {
  void initializeExtension();
});

chrome.action.onClicked.addListener((tab) => {
  void toggleInspector(tab.id);
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== "toggle-inspector") return;
  void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    return toggleInspector(tab?.id);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const task = handleMessage(message, sender);
  if (!task) return false;
  task.then(sendResponse).catch((error) => {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) });
  });
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void chrome.storage.session.remove(stateKey(tabId));
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    void chrome.storage.session.remove(stateKey(tabId));
  }
});

async function initializeExtension() {
  await Promise.allSettled([
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }),
    chrome.storage.local.setAccessLevel?.({ accessLevel: "TRUSTED_CONTEXTS" }),
    chrome.storage.session.setAccessLevel?.({ accessLevel: "TRUSTED_CONTEXTS" }),
  ]);
}

function handleMessage(message, sender) {
  if (!message || typeof message.type !== "string") return null;

  if (message.type === "JIDDU_ANALYZE") {
    const tabId = sender.tab?.id;
    if (!tabId) {
      return getSettings().then((settings) => ({
        ok: false,
        error: text(getUiMessages(settings.uiLang), "worker.sourceTabMissing"),
      }));
    }
    void chrome.sidePanel.open({ tabId }).catch(() => undefined);
    launchAnalysis(tabId, message.payload);
    return Promise.resolve({ ok: true });
  }

  if (message.type === "JIDDU_GET_TAB_STATE") {
    return getTabState(message.tabId).then((state) => ({ ok: true, state }));
  }

  if (message.type === "JIDDU_GET_SETTINGS") {
    return getSettings().then((settings) => ({ ok: true, settings }));
  }

  if (message.type === "JIDDU_GET_PREFERENCES") {
    return getSettings().then((settings) => ({
      ok: true,
      uiLang: settings.uiLang,
      messages: getInspectorMessages(settings.uiLang),
    }));
  }

  if (message.type === "JIDDU_SAVE_SETTINGS") {
    return saveSettings(message.settings).then((settings) => ({ ok: true, settings }));
  }

  if (message.type === "JIDDU_RETRY") {
    return Promise.all([getTabState(message.tabId), getSettings()]).then(([state, settings]) => {
      if (!state?.request) {
        throw new Error(text(getUiMessages(settings.uiLang), "worker.noRetry"));
      }
      launchAnalysis(message.tabId, state.request);
      return { ok: true };
    });
  }

  if (message.type === "JIDDU_TOGGLE_FROM_PANEL") {
    return toggleInspector(message.tabId).then(() => ({ ok: true }));
  }

  return null;
}

function launchAnalysis(tabId, request) {
  void startAnalysis(tabId, request).catch((error) => {
    void getSettings().then((settings) => {
      const messages = getUiMessages(settings.uiLang);
      return setTabState(tabId, {
        status: "error",
        request: request && typeof request === "object" ? request : null,
        error: error instanceof Error ? error.message : text(messages, "worker.cannotStart"),
        errorCode: "analysis_failed",
      });
    }).catch(() => undefined);
  });
}

async function toggleInspector(tabId) {
  const settings = await getSettings();
  const messages = getUiMessages(settings.uiLang);
  if (!Number.isInteger(tabId)) throw new Error(text(messages, "worker.openPage"));
  try {
    await chrome.tabs.sendMessage(tabId, { type: "JIDDU_TOGGLE_INSPECTOR" });
    return;
  } catch {
    // The first activation injects the inspector. Later activations reuse it.
  }

  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content-style.css"] });
    await chrome.scripting.executeScript({ target: { tabId }, files: ["content-script.js"] });
  } catch {
    await chrome.action.setBadgeText({ tabId, text: "!" }).catch(() => undefined);
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#c6402d" }).catch(() => undefined);
    setTimeout(() => {
      void chrome.action.setBadgeText({ tabId, text: "" });
    }, 1800);
    throw new Error(text(messages, "worker.pageBlocked"));
  }
}

async function startAnalysis(tabId, rawRequest) {
  const settings = await getSettings();
  const messages = getUiMessages(settings.uiLang);
  const request = sanitizeRequest(rawRequest, messages);
  const requestId = crypto.randomUUID();
  const chunks = splitIntoApiChunks(request.text);

  if (request.text.length < MIN_API_TEXT_CHARS) {
    await setTabState(tabId, {
      status: "error",
      requestId,
      request,
      error: text(messages, "worker.minCharacters"),
      errorCode: "text_too_short",
    });
    return;
  }

  await setTabState(tabId, {
    status: "loading",
    requestId,
    request,
    lens: request.lens,
    sourceTitle: request.sourceTitle,
    sourceUrl: request.sourceUrl,
    excerpt: excerptFrom(request.text),
    progress: { current: 0, total: chunks.length },
  });

  if (!settings.apiKey) {
    await setTabState(tabId, {
      status: "error",
      requestId,
      request,
      lens: request.lens,
      sourceTitle: request.sourceTitle,
      sourceUrl: request.sourceUrl,
      excerpt: excerptFrom(request.text),
      error: text(messages, "worker.missingKey"),
      errorCode: "missing_api_key",
    });
    return;
  }

  try {
    const parts = [];
    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index];
      const result = await callJidduApi({
        apiBase: settings.apiBase,
        apiKey: settings.apiKey,
        lens: request.lens,
        lang: settings.lang,
        text: chunk,
        messages,
      });
      parts.push({ result, charCount: chunk.length });
      await updateProgressIfCurrent(tabId, requestId, index + 1, chunks.length);
    }

    const current = await getTabState(tabId);
    if (current?.requestId !== requestId) return;

    await setTabState(tabId, {
      ...current,
      status: "success",
      result: mergeChunkResults(request.lens, parts),
      completedAt: new Date().toISOString(),
      progress: { current: chunks.length, total: chunks.length },
    });
  } catch (error) {
    const current = await getTabState(tabId);
    if (current?.requestId !== requestId) return;
    await setTabState(tabId, {
      ...current,
      status: "error",
      error: error instanceof Error ? error.message : text(messages, "api.default"),
      errorCode: "analysis_failed",
    });
  }
}

async function callJidduApi({ apiBase, apiKey, lens, lang, text: input, messages }) {
  const response = await fetch(`${normalizeApiBase(apiBase)}${endpointForLens(lens)}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Jiddu-Key": apiKey,
    },
    body: JSON.stringify({ text: input, lang }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(friendlyApiError(response.status, payload, messages));
  return payload;
}

function sanitizeRequest(value, messages) {
  const lens = String(value?.lens || "");
  if (!LENSES[lens]) throw new Error(text(messages, "worker.invalidLens"));
  const normalizedText = normalizeSelectionText(value?.text);
  if (!normalizedText) throw new Error(text(messages, "worker.noText"));
  return {
    lens,
    text: normalizedText,
    sourceTitle: String(value?.sourceTitle || "").slice(0, 500),
    sourceUrl: safeSourceUrl(value?.sourceUrl),
  };
}

function safeSourceUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

async function getSettings() {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const value = stored[SETTINGS_KEY] || {};
  return {
    apiKey: typeof value.apiKey === "string" ? value.apiKey : "",
    apiBase: normalizeApiBase(value.apiBase || DEFAULT_API_BASE),
    lang: ["pt", "en", "es"].includes(value.lang) ? value.lang : "en",
    uiLang: normalizeUiLang(value.uiLang),
  };
}

async function saveSettings(value) {
  const settings = {
    apiKey: String(value?.apiKey || "").trim(),
    apiBase: normalizeApiBase(value?.apiBase),
    lang: ["pt", "en", "es"].includes(value?.lang) ? value.lang : "en",
    uiLang: normalizeUiLang(value?.uiLang || DEFAULT_UI_LANG),
  };
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
  await updateInspectorLanguage(settings.uiLang);
  return settings;
}

async function getTabState(tabId) {
  if (!Number.isInteger(tabId)) return null;
  const key = stateKey(tabId);
  const stored = await chrome.storage.session.get(key);
  return stored[key] || null;
}

async function setTabState(tabId, state) {
  await chrome.storage.session.set({ [stateKey(tabId)]: state });
  await chrome.runtime.sendMessage({
    type: "JIDDU_STATE_CHANGED",
    tabId,
    state,
  }).catch(() => undefined);
}

async function updateProgressIfCurrent(tabId, requestId, current, total) {
  const state = await getTabState(tabId);
  if (!state || state.requestId !== requestId) return;
  await setTabState(tabId, { ...state, progress: { current, total } });
}

function stateKey(tabId) {
  return `${STATE_PREFIX}${tabId}`;
}

function excerptFrom(text) {
  return text.length > 260 ? `${text.slice(0, 257).trimEnd()}…` : text;
}

async function updateInspectorLanguage(uiLang) {
  const messages = getInspectorMessages(uiLang);
  const tabs = await chrome.tabs.query({});
  await Promise.allSettled(
    tabs
      .filter((tab) => Number.isInteger(tab.id))
      .map((tab) =>
        chrome.tabs.sendMessage(tab.id, {
          type: "JIDDU_SET_INSPECTOR_LANGUAGE",
          uiLang,
          messages,
        }),
      ),
  );
}

function text(messages, key, variables) {
  return formatUiMessage(messages, key, variables);
}
