(() => {
  const existing = globalThis.__jidduInspector;
  if (existing) {
    existing.toggle();
    return;
  }

  const ROOT_ID = "jiddu-extension-inspector-root";
  const MIN_TEXT_CHARS = 40;
  const SEMANTIC_SELECTOR = [
    "p",
    "li",
    "blockquote",
    "figcaption",
    "td",
    "th",
    "dt",
    "dd",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "pre",
  ].join(",");
  const IGNORED_SELECTOR = "script,style,noscript,svg,canvas,video,audio,input,textarea,select,option,button";

  let active = false;
  let hovered = null;
  let selected = null;
  let scheduledFrame = 0;
  let uiLang = "en";
  let messages = {
    "inspector.hint": "Hover and click a passage",
    "inspector.menuLabel": "Analyze with Jiddu",
    "inspector.kicker": "ANALYZE THIS PASSAGE",
    "inspector.close": "Close",
    "inspector.note": "The text will be sent only after you choose an analysis.",
    "inspector.characters": "{count} characters",
    "lens.fallacies": "Fallacies",
    "lens.facts": "Facts",
    "lens.neutrality": "Bias",
  };

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.setAttribute("aria-hidden", "true");
  root.innerHTML = `
    <div class="jiddu-ext-outline" data-role="outline"></div>
    <div class="jiddu-ext-hint" data-role="hint">
      <span class="jiddu-ext-mark">J</span>
      <span data-role="hint-copy">Hover and click a passage</span>
      <kbd>Esc</kbd>
    </div>
    <section class="jiddu-ext-menu" data-role="menu" aria-label="Analyze with Jiddu">
      <header>
        <div>
          <span class="jiddu-ext-kicker" data-role="kicker">ANALYZE THIS PASSAGE</span>
          <strong data-role="count"></strong>
        </div>
        <button type="button" class="jiddu-ext-close" data-action="close" aria-label="Close">×</button>
      </header>
      <p class="jiddu-ext-preview" data-role="preview"></p>
      <div class="jiddu-ext-lenses">
        <button type="button" data-lens="fallacies"><span>↯</span><span data-role="lens-label">Fallacies</span></button>
        <button type="button" data-lens="facts"><span>✓</span><span data-role="lens-label">Facts</span></button>
        <button type="button" data-lens="neutrality"><span>◐</span><span data-role="lens-label">Bias</span></button>
      </div>
      <p class="jiddu-ext-menu-note" data-role="note">The text will be sent only after you choose an analysis.</p>
    </section>
  `;
  document.documentElement.append(root);

  const outline = root.querySelector('[data-role="outline"]');
  const hint = root.querySelector('[data-role="hint"]');
  const menu = root.querySelector('[data-role="menu"]');
  const preview = root.querySelector('[data-role="preview"]');
  const count = root.querySelector('[data-role="count"]');

  const controller = { toggle, activate, deactivate };
  globalThis.__jidduInspector = controller;

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "JIDDU_TOGGLE_INSPECTOR") toggle();
    if (message?.type === "JIDDU_SET_INSPECTOR_LANGUAGE") {
      setLanguage(message.uiLang, message.messages);
    }
  });

  root.addEventListener("click", (event) => {
    const close = event.target.closest('[data-action="close"]');
    if (close) {
      hideMenu();
      clearOutline();
      return;
    }

    const button = event.target.closest("[data-lens]");
    if (!button || !selected) return;
    const text = textFor(selected);
    if (text.length < MIN_TEXT_CHARS) return;

    setMenuBusy(button.dataset.lens);
    chrome.runtime.sendMessage({
      type: "JIDDU_ANALYZE",
      payload: {
        lens: button.dataset.lens,
        text,
        sourceTitle: document.title,
        sourceUrl: location.href,
      },
    }).then(() => {
      hideMenu();
      clearOutline();
    }).catch(() => {
      resetMenuButtons();
    });
  });

  function toggle() {
    if (active) deactivate();
    else activate();
  }

  function activate() {
    void loadPreferences();
    hideMenu();
    clearOutline();
    active = true;
    root.classList.add("jiddu-ext-active");
    root.setAttribute("aria-hidden", "false");
    hint.classList.add("jiddu-ext-visible");
    document.documentElement.classList.add("jiddu-ext-picking");
    document.addEventListener("pointermove", onPointerMove, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onPageClick, true);
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", scheduleOutline, true);
    window.addEventListener("resize", scheduleOutline, true);
  }

  function deactivate({ keepOutline = false } = {}) {
    active = false;
    hint.classList.remove("jiddu-ext-visible");
    document.documentElement.classList.remove("jiddu-ext-picking");
    document.removeEventListener("pointermove", onPointerMove, true);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("click", onPageClick, true);
    document.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("scroll", scheduleOutline, true);
    window.removeEventListener("resize", scheduleOutline, true);
    if (!keepOutline) clearOutline();
  }

  function onPointerMove(event) {
    if (root.contains(event.target)) return;
    const candidate = findCandidate(event.target);
    if (candidate === hovered) return;
    hovered = candidate;
    selected = null;
    scheduleOutline();
  }

  function onPointerDown(event) {
    if (root.contains(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
  }

  function onPageClick(event) {
    if (root.contains(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const candidate = findCandidate(event.target) || hovered;
    if (!candidate) return;
    selected = candidate;
    hovered = candidate;
    deactivate({ keepOutline: true });
    renderOutline();
    showMenu(candidate);
  }

  function onKeyDown(event) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    hideMenu();
    deactivate();
  }

  function onMenuKeyDown(event) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    hideMenu();
    clearOutline();
  }

  function findCandidate(target) {
    if (!(target instanceof Element)) return null;
    if (root.contains(target) || target.matches(IGNORED_SELECTOR) || target.closest(IGNORED_SELECTOR)) {
      return null;
    }

    const semantic = target.closest(SEMANTIC_SELECTOR);
    if (isReadableCandidate(semantic)) return semantic;

    let current = target;
    let best = null;
    while (current && current !== document.body && current !== document.documentElement) {
      if (isReadableCandidate(current)) {
        best = current;
        const display = getComputedStyle(current).display;
        if (display !== "inline" && display !== "contents") return current;
      }
      current = current.parentElement;
    }
    return best;
  }

  function isReadableCandidate(element) {
    if (!(element instanceof HTMLElement)) return false;
    const text = textFor(element);
    if (text.length < MIN_TEXT_CHARS) return false;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 10 && rect.height > 8 && style.visibility !== "hidden" && style.display !== "none";
  }

  function textFor(element) {
    return String(element?.innerText || element?.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function scheduleOutline() {
    if (scheduledFrame) return;
    scheduledFrame = requestAnimationFrame(() => {
      scheduledFrame = 0;
      renderOutline();
    });
  }

  function renderOutline() {
    const element = selected || hovered;
    if (!element?.isConnected) {
      clearOutline();
      return;
    }
    const rect = element.getBoundingClientRect();
    outline.style.transform = `translate3d(${Math.round(rect.left)}px, ${Math.round(rect.top)}px, 0)`;
    outline.style.width = `${Math.round(rect.width)}px`;
    outline.style.height = `${Math.round(rect.height)}px`;
    outline.classList.add("jiddu-ext-visible");
    outline.classList.toggle("jiddu-ext-selected", Boolean(selected));
  }

  function clearOutline() {
    hovered = null;
    selected = null;
    outline.classList.remove("jiddu-ext-visible", "jiddu-ext-selected");
  }

  function showMenu(element) {
    const text = textFor(element);
    count.textContent = formatMessage("inspector.characters", {
      count: text.length.toLocaleString(localeTag(uiLang)),
    });
    preview.textContent = text.length > 180 ? `${text.slice(0, 177).trimEnd()}…` : text;
    resetMenuButtons();

    const rect = element.getBoundingClientRect();
    const menuWidth = 360;
    const safeLeft = Math.min(
      Math.max(12, rect.left),
      Math.max(12, window.innerWidth - menuWidth - 12),
    );
    const preferBelow = rect.bottom + 250 < window.innerHeight;
    const top = preferBelow
      ? Math.min(window.innerHeight - 12, rect.bottom + 10)
      : Math.max(12, rect.top - 10);

    menu.style.left = `${Math.round(safeLeft)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.transform = preferBelow ? "none" : "translateY(-100%)";
    menu.classList.add("jiddu-ext-visible");
    document.addEventListener("keydown", onMenuKeyDown, true);
  }

  function hideMenu() {
    menu.classList.remove("jiddu-ext-visible");
    document.removeEventListener("keydown", onMenuKeyDown, true);
    resetMenuButtons();
  }

  function setMenuBusy(lens) {
    for (const button of root.querySelectorAll("[data-lens]")) {
      button.disabled = true;
      if (button.dataset.lens === lens) button.classList.add("jiddu-ext-loading");
    }
  }

  function resetMenuButtons() {
    for (const button of root.querySelectorAll("[data-lens]")) {
      button.disabled = false;
      button.classList.remove("jiddu-ext-loading");
    }
  }

  async function loadPreferences() {
    const response = await chrome.runtime
      .sendMessage({ type: "JIDDU_GET_PREFERENCES" })
      .catch(() => null);
    if (response?.ok) setLanguage(response.uiLang, response.messages);
  }

  function setLanguage(value, nextMessages) {
    uiLang = ["en", "pt", "es"].includes(value) ? value : "en";
    if (nextMessages && typeof nextMessages === "object") {
      messages = { ...messages, ...nextMessages };
    }
    root.querySelector('[data-role="hint-copy"]').textContent = formatMessage("inspector.hint");
    root.querySelector('[data-role="kicker"]').textContent = formatMessage("inspector.kicker");
    root.querySelector('[data-role="note"]').textContent = formatMessage("inspector.note");
    root.querySelector('[data-action="close"]').setAttribute("aria-label", formatMessage("inspector.close"));
    menu.setAttribute("aria-label", formatMessage("inspector.menuLabel"));
    for (const button of root.querySelectorAll("[data-lens]")) {
      button.querySelector('[data-role="lens-label"]').textContent = formatMessage(`lens.${button.dataset.lens}`);
    }
    if (selected) showMenu(selected);
  }

  function formatMessage(key, variables = {}) {
    const template = messages[key] || key;
    return Object.entries(variables).reduce(
      (output, [name, value]) => output.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }

  function localeTag(value) {
    if (value === "pt") return "pt-BR";
    if (value === "es") return "es";
    return "en-US";
  }

  activate();
})();
