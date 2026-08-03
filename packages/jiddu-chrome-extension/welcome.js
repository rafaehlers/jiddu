import { DEFAULT_UI_LANG, normalizeUiLang } from "./lib/i18n.js";
import { getOnboardingMessages } from "./lib/onboarding-i18n.js";

const form = document.querySelector("#welcomeForm");
const apiKeyInput = document.querySelector("#apiKeyInput");
const uiLangInput = document.querySelector("#uiLangInput");
const langInput = document.querySelector("#langInput");
const saveButton = document.querySelector("#saveButton");
const feedback = document.querySelector("#feedback");

let uiLang = DEFAULT_UI_LANG;
let messages = getOnboardingMessages(uiLang);
let apiBase = "https://jiddu.app";

uiLangInput.addEventListener("change", () => setUiLanguage(uiLangInput.value));
form.addEventListener("submit", (event) => void save(event));

void initialize();

async function initialize() {
  const response = await sendMessage({ type: "JIDDU_GET_SETTINGS" });
  const settings = response?.settings || {
    apiKey: "",
    apiBase: "https://jiddu.app",
    lang: "en",
    uiLang: DEFAULT_UI_LANG,
  };
  apiKeyInput.value = settings.apiKey || "";
  apiBase = settings.apiBase || apiBase;
  uiLangInput.value = settings.uiLang || DEFAULT_UI_LANG;
  langInput.value = settings.lang || "en";
  setUiLanguage(settings.uiLang);
}

async function save(event) {
  event.preventDefault();
  feedback.textContent = "";
  saveButton.disabled = true;
  saveButton.textContent = text("form.saving");
  const response = await sendMessage({
    type: "JIDDU_SAVE_SETTINGS",
    settings: {
      apiKey: apiKeyInput.value,
      apiBase,
      uiLang: uiLangInput.value,
      lang: langInput.value,
    },
  });
  saveButton.disabled = false;
  saveButton.textContent = text("form.save");
  feedback.textContent = response?.ok ? text("form.saved") : response?.error || text("form.failed");
  feedback.dataset.state = response?.ok ? "success" : "error";
}

function setUiLanguage(value) {
  uiLang = normalizeUiLang(value);
  messages = getOnboardingMessages(uiLang);
  document.documentElement.lang = uiLang === "pt" ? "pt-BR" : uiLang;
  document.title = text("page.title");
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = text(node.dataset.i18n);
  }
}

function text(key) {
  return messages[key] || getOnboardingMessages("en")[key] || key;
}

function sendMessage(message) {
  return chrome.runtime.sendMessage(message).catch((error) => ({ ok: false, error: error.message }));
}
