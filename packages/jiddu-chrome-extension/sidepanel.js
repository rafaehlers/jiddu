import {
  DEFAULT_UI_LANG,
  formatUiMessage,
  getUiMessages,
  normalizeUiLang,
} from "./lib/i18n.js";

const app = document.querySelector("#app");
const settingsDialog = document.querySelector("#settingsDialog");
const settingsForm = document.querySelector("#settingsForm");
const settingsButton = document.querySelector("#settingsButton");
const closeSettingsButton = document.querySelector("#closeSettingsButton");
const apiKeyInput = document.querySelector("#apiKeyInput");
const apiBaseInput = document.querySelector("#apiBaseInput");
const uiLangInput = document.querySelector("#uiLangInput");
const langInput = document.querySelector("#langInput");
const settingsFeedback = document.querySelector("#settingsFeedback");

let activeTabId = null;
let activeState = null;
let settings = null;
let uiLang = DEFAULT_UI_LANG;
let uiMessages = getUiMessages(uiLang);

settingsButton.addEventListener("click", () => void openSettings());
closeSettingsButton.addEventListener("click", () => settingsDialog.close());
settingsForm.addEventListener("submit", (event) => void saveSettings(event));

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "JIDDU_STATE_CHANGED" || message.tabId !== activeTabId) return;
  activeState = message.state;
  render();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  activeTabId = tabId;
  void loadState();
});

void initialize();

async function initialize() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabId = tab?.id ?? null;
  await Promise.all([loadState(), loadSettings()]);
  render();
}

async function loadState() {
  if (!Number.isInteger(activeTabId)) {
    activeState = null;
    render();
    return;
  }
  const response = await sendMessage({ type: "JIDDU_GET_TAB_STATE", tabId: activeTabId });
  activeState = response?.state ?? null;
  render();
}

async function loadSettings() {
  const response = await sendMessage({ type: "JIDDU_GET_SETTINGS" });
  settings = response?.settings ?? {
    apiKey: "",
    apiBase: "https://jiddu.app",
    lang: "en",
    uiLang: DEFAULT_UI_LANG,
  };
  setUiLanguage(settings.uiLang);
}

async function openSettings() {
  if (!settings) await loadSettings();
  apiKeyInput.value = settings.apiKey || "";
  apiBaseInput.value = settings.apiBase || "https://jiddu.app";
  uiLangInput.value = settings.uiLang || DEFAULT_UI_LANG;
  langInput.value = settings.lang || "en";
  settingsFeedback.textContent = "";
  settingsDialog.showModal();
}

async function saveSettings(event) {
  event.preventDefault();
  const response = await sendMessage({
    type: "JIDDU_SAVE_SETTINGS",
    settings: {
      apiKey: apiKeyInput.value,
      apiBase: apiBaseInput.value,
      uiLang: uiLangInput.value,
      lang: langInput.value,
    },
  });
  if (!response?.ok) {
    settingsFeedback.textContent = response?.error || t("settings.saveFailed");
    return;
  }
  settings = response.settings;
  setUiLanguage(settings.uiLang);
  render();
  if (settings.apiKey && activeState?.errorCode === "missing_api_key" && activeState.request) {
    settingsFeedback.textContent = t("settings.savedStarting");
    await retryAnalysis();
    settingsDialog.close();
    return;
  }
  settingsFeedback.textContent = t("settings.saved");
  setTimeout(() => settingsDialog.close(), 450);
}

function render() {
  if (!activeState) {
    renderEmpty();
    return;
  }
  if (activeState.status === "loading") {
    renderLoading(activeState);
    return;
  }
  if (activeState.status === "error") {
    renderError(activeState);
    return;
  }
  if (activeState.status === "success") {
    renderResult(activeState);
    return;
  }
  renderEmpty();
}

function renderEmpty() {
  app.replaceChildren(
    element("section", { className: "empty-state" }, [
      element("div", { className: "empty-card" }, [
        element("div", { className: "empty-illustration", ariaHidden: "true" }, [
          element("span", { className: "scan-lines" }),
        ]),
        element("h2", { text: t("empty.title") }),
        element("p", {
          text: t("empty.description"),
        }),
        button(t("empty.select"), "primary-button", () => void activateInspector()),
        element("div", { className: "shortcut" }, [
          element("span", { text: t("empty.shortcut") }),
          element("kbd", { text: isMac() ? "⌘ ⇧ J" : "Alt J" }),
        ]),
      ]),
    ]),
  );
}

function renderLoading(state) {
  const progress = state.progress || { current: 0, total: 1 };
  const percent = Math.max(8, Math.round((progress.current / Math.max(1, progress.total)) * 100));
  app.replaceChildren(
    contextHeader(state),
    quoteCard(state.excerpt),
    element("section", { className: "loading-card" }, [
      element("div", { className: "loader-orbit", ariaHidden: "true" }),
      element("strong", { text: loadingTitle(state.lens) }),
      element("p", {
        text: progress.total > 1
          ? t("loading.progressMulti", {
              current: Math.min(progress.current + 1, progress.total),
              total: progress.total,
            })
          : t("loading.progressSingle"),
      }),
      element("div", { className: "progress-track" }, [
        element("span", { style: { width: `${percent}%` } }),
      ]),
    ]),
  );
}

function renderError(state) {
  const actions = [];
  if (state.errorCode === "missing_api_key") {
    actions.push(button(t("error.configureKey"), "primary-button", () => void openSettings()));
  } else {
    actions.push(button(t("error.retry"), "primary-button", () => void retryAnalysis()));
  }
  actions.push(button(t("error.another"), "secondary-button", () => void activateInspector()));

  app.replaceChildren(
    contextHeader(state),
    quoteCard(state.excerpt),
    element("section", { className: "error-card" }, [
      element("div", { className: "error-mark", text: "!", ariaHidden: "true" }),
      element("h2", { text: t("error.title") }),
      element("p", { text: state.error || t("error.default") }),
      element("div", { className: "button-row" }, actions),
    ]),
  );
}

function renderResult(state) {
  const nodes = [contextHeader(state), quoteCard(state.excerpt)];
  if (state.lens === "fallacies") nodes.push(...fallacyResult(state.result));
  if (state.lens === "facts") nodes.push(...factsResult(state.result));
  if (state.lens === "neutrality") nodes.push(...neutralityResult(state.result));
  nodes.push(
    element("div", { className: "new-selection" }, [
      button(t("result.selectAnother"), "secondary-button", () => void activateInspector()),
    ]),
  );
  app.replaceChildren(...nodes);
}

function contextHeader(state) {
  const label = ["fallacies", "facts", "neutrality"].includes(state.lens)
    ? t(`lens.${state.lens}`)
    : t("lens.analysis");
  const sourceTitle = state.sourceTitle || t("source.untitled");
  const children = [
    element("span", { className: "lens-pill", text: label }),
    element("h1", { text: sourceTitle, title: sourceTitle }),
  ];
  if (state.sourceUrl) {
    children.push(
      element("a", {
        className: "source-link",
        text: displayUrl(state.sourceUrl),
        href: state.sourceUrl,
        target: "_blank",
        rel: "noreferrer",
      }),
    );
  }
  return element("header", { className: "context-block" }, children);
}

function quoteCard(text) {
  return element("blockquote", { className: "quote-card", text: text || "" });
}

function fallacyResult(result) {
  const findings = result?.fallacies || [];
  const nodes = [summaryCard({
    value: findings.length,
    angle: Math.min(360, findings.length * 72),
    color: findings.length ? "#df573d" : "#246b4a",
    eyebrow: findings.length === 1 ? t("fallacy.oneEyebrow") : t("fallacy.manyEyebrow"),
    title: findings.length
      ? `${findings.length} ${findings.length === 1 ? t("fallacy.findingOne") : t("fallacy.findingMany")}`
      : t("fallacy.clean"),
  })];

  if (findings.length === 0) {
    nodes.push(cleanCard(t("fallacy.noneTitle"), t("fallacy.noneText")));
    return nodes;
  }

  nodes.push(findingsHeader(t("fallacy.header"), findings.length));
  nodes.push(element("div", { className: "findings-list" }, findings.map((finding) =>
    findingCard({
      title: finding.name || t("fallacy.default"),
      tag: t("fallacy.default"),
      excerpt: finding.excerpt,
      explanation: finding.explanation,
    }),
  )));
  return nodes;
}

function factsResult(result) {
  const claims = result?.claims || [];
  const verdict = result?.overall_verdict || "questionable";
  const verdictCopy = {
    reliable: [t("facts.reliable"), "#246b4a", 360],
    questionable: [t("facts.questionable"), "#9b6420", 225],
    unreliable: [t("facts.unreliable"), "#b53b2a", 95],
  }[verdict] || [t("facts.questionable"), "#9b6420", 225];
  const nodes = [summaryCard({
    value: claims.length,
    angle: verdictCopy[2],
    color: verdictCopy[1],
    eyebrow: t("facts.overall"),
    title: verdictCopy[0],
  })];

  if (claims.length === 0) {
    nodes.push(cleanCard(t("facts.noneTitle"), t("facts.noneText")));
    return nodes;
  }

  nodes.push(findingsHeader(t("facts.header"), claims.length));
  nodes.push(element("div", { className: "findings-list" }, claims.map((claim) =>
    findingCard({
      title: claim.claim || t("facts.claim"),
      tag: factVerdictLabel(claim.verdict),
      explanation: claim.explanation,
      sources: claim.sources,
    }),
  )));
  if (result.truncated) {
    nodes.push(element("p", {
      className: "summary-text",
      text: t("facts.truncated"),
    }));
  }
  return nodes;
}

function neutralityResult(result) {
  const score = Math.max(0, Math.min(1, Number(result?.score || 0)));
  const signals = result?.signals || [];
  const label = {
    neutral: t("neutrality.neutral"),
    mostly_neutral: t("neutrality.mostlyNeutral"),
    biased: t("neutrality.biased"),
    highly_biased: t("neutrality.highlyBiased"),
  }[result?.label] || t("neutrality.assessed");
  const nodes = [summaryCard({
    value: `${Math.round(score * 100)}%`,
    angle: score * 360,
    color: score >= 0.75 ? "#246b4a" : score >= 0.5 ? "#9b6420" : "#b53b2a",
    eyebrow: t("neutrality.index"),
    title: label,
  })];
  if (result?.summary) nodes.push(element("p", { className: "summary-text", text: result.summary }));

  if (signals.length === 0) {
    nodes.push(cleanCard(t("neutrality.noneTitle"), t("neutrality.noneText")));
    return nodes;
  }

  nodes.push(findingsHeader(t("neutrality.header"), signals.length));
  nodes.push(element("div", { className: "findings-list" }, signals.map((signal) =>
    findingCard({
      title: neutralityTypeLabel(signal.type),
      tag: t("neutrality.signal"),
      excerpt: signal.excerpt,
      explanation: signal.explanation,
    }),
  )));
  return nodes;
}

function summaryCard({ value, angle, color, eyebrow, title }) {
  return element("section", { className: "summary-card" }, [
    element("div", {
      className: "score-ring",
      style: { "--score-angle": `${angle}deg`, "--score-color": color },
    }, [element("strong", { text: String(value) })]),
    element("div", { className: "summary-copy" }, [
      element("span", { text: eyebrow }),
      element("strong", { text: title }),
    ]),
  ]);
}

function findingsHeader(title, count) {
  return element("div", { className: "findings-heading" }, [
    element("h2", { text: title }),
    element("span", {
      text: `${count} ${count === 1 ? t("common.itemOne") : t("common.itemMany")}`,
    }),
  ]);
}

function findingCard({ title, tag, excerpt, explanation, sources }) {
  const children = [
    element("header", {}, [
      element("h3", { text: title || t("common.finding") }),
      element("span", { className: "tag", text: tag || t("common.finding") }),
    ]),
  ];
  if (excerpt) children.push(element("blockquote", { text: excerpt }));
  if (explanation) children.push(element("p", { text: explanation }));
  if (Array.isArray(sources) && sources.length) {
    children.push(element("div", { className: "sources" }, sources.map((source) =>
      element("a", {
        text: source.title || displayUrl(source.url),
        title: source.url,
        href: source.url,
        target: "_blank",
        rel: "noreferrer",
      }),
    )));
  }
  return element("article", { className: "finding-card" }, children);
}

function cleanCard(title, text) {
  return element("section", { className: "clean-card" }, [
    element("strong", { text: title }),
    element("span", { text }),
  ]);
}

async function activateInspector() {
  const response = await sendMessage({ type: "JIDDU_TOGGLE_FROM_PANEL", tabId: activeTabId });
  if (!response?.ok) {
    activeState = {
      status: "error",
      error: response?.error || t("error.activationPrompt"),
      errorCode: "activation_failed",
    };
    render();
  }
}

async function retryAnalysis() {
  await sendMessage({ type: "JIDDU_RETRY", tabId: activeTabId });
}

function sendMessage(message) {
  return chrome.runtime.sendMessage(message).catch((error) => ({ ok: false, error: error.message }));
}

function loadingTitle(lens) {
  if (lens === "facts") return t("loading.facts");
  if (lens === "neutrality") return t("loading.neutrality");
  return t("loading.fallacies");
}

function factVerdictLabel(verdict) {
  return {
    true: t("facts.true"),
    false: t("facts.false"),
    misleading: t("facts.misleading"),
    unverifiable: t("facts.unverifiable"),
  }[verdict] || t("facts.inconclusive");
}

function neutralityTypeLabel(type) {
  return {
    loaded_language: t("neutrality.loadedLanguage"),
    one_sided: t("neutrality.oneSided"),
    omission: t("neutrality.omission"),
    framing: t("neutrality.framing"),
  }[type] || t("neutrality.defaultSignal");
}

function setUiLanguage(value) {
  uiLang = normalizeUiLang(value);
  uiMessages = getUiMessages(uiLang);
  document.documentElement.lang = uiLang === "pt" ? "pt-BR" : uiLang;

  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-aria-label]")) {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  }
  for (const node of document.querySelectorAll("[data-i18n-title]")) {
    node.setAttribute("title", t(node.dataset.i18nTitle));
  }
}

function t(key, variables) {
  return formatUiMessage(uiMessages, key, variables);
}

function displayUrl(value) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return value || "";
  }
}

function isMac() {
  return /Mac/i.test(navigator.platform);
}

function button(label, className, onClick) {
  const node = element("button", { type: "button", className, text: label });
  node.addEventListener("click", onClick);
  return node;
}

function element(tagName, props = {}, children = []) {
  const node = document.createElement(tagName);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    if (key === "className") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "ariaHidden") node.setAttribute("aria-hidden", value);
    else if (key === "style") {
      for (const [property, propertyValue] of Object.entries(value)) {
        node.style.setProperty(property, propertyValue);
      }
    } else if (key in node) {
      node[key] = value;
    } else {
      node.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (child) node.append(child);
  }
  return node;
}
