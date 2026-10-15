import assert from "node:assert/strict";
import test from "node:test";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { ExplainDetail, useExplainDetails } from "./explain-detail";
import { MESSAGES } from "@/lib/i18n/messages";
import type { Lang } from "@/lib/fallacies";

test("follow-up UI deduplicates requests, caches each section and language, and retries errors", async (t) => {
  const dom = new JSDOM("<div id='root'></div>", { url: "https://example.test" });
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  Object.assign(globalThis, { window: dom.window, document: dom.window.document, IS_REACT_ACT_ENVIRONMENT: true });
  const container = dom.window.document.getElementById("root")!;
  const root = createRoot(container);
  const calls: { body: { blockId: string; lang: string }; finish: (response: Response) => void; signal: AbortSignal }[] = [];
  t.mock.method(globalThis, "fetch", (_url: string, init: RequestInit) => new Promise<Response>((finish) => {
    calls.push({ body: JSON.parse(init.body as string), finish, signal: init.signal as AbortSignal });
  }));
  let parentClicks = 0;

  function Harness({ blockId, lang }: { blockId: string; lang: Lang }) {
    const details = useExplainDetails("synthetic-paper", lang);
    return createElement("div", { onClick: () => parentClicks++ },
      createElement(ExplainDetail, {
        state: details.get(blockId),
        onToggle: () => void details.toggle(blockId),
        panelId: "detail-panel",
        levelLabel: MESSAGES[lang].level_high_school,
        t: MESSAGES[lang],
      }),
    );
  }
  const render = async (blockId = "p1", lang: Lang = "pt") => {
    await act(async () => root.render(createElement(Harness, { blockId, lang })));
  };
  const click = async () => {
    await act(async () => container.querySelector("button")!.click());
  };
  const reply = async (index: number, response: Response) => {
    await act(async () => calls[index].finish(response));
  };

  try {
    await render();
    assert.match(container.textContent!, /Explicar melhor/);
    await act(async () => {
      container.querySelector("button")!.click();
      container.querySelector("button")!.click();
    });
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].body, { blockId: "p1", lang: "pt" });
    assert.equal(container.querySelector("button")!.disabled, true);
    assert.equal(parentClicks, 0);
    await reply(0, Response.json({ explanation: "Uma bateria térmica.\n\nAnalogia: como um reservatório." }));
    assert.match(container.textContent!, /Uma bateria térmica/);
    assert.equal(container.querySelector("button")!.getAttribute("aria-expanded"), "true");
    await click();
    assert.equal(container.querySelector<HTMLElement>("#detail-panel")!.hidden, true);
    await click();
    assert.equal(calls.length, 1);
    assert.equal(container.querySelector<HTMLElement>("#detail-panel")!.hidden, false);

    await render("p3");
    assert.match(container.textContent!, /Explicar melhor/);
    await click();
    await reply(1, Response.json({ error: "failed" }, { status: 502 }));
    assert.match(container.querySelector("[role=alert]")!.textContent!, /Não foi possível/);
    await click();
    await reply(2, Response.json({ explanation: "A incerteza dos resultados." }));
    await render();
    assert.match(container.textContent!, /Uma bateria térmica/);
    assert.equal(calls.length, 3);

    await render("p1", "es");
    assert.match(container.textContent!, /Explicar mejor/);
    assert.doesNotMatch(container.textContent!, /Uma bateria/);
    await click();
    await reply(3, Response.json({ error: "sign in" }, { status: 401 }));
    assert.equal(container.querySelector("a")!.getAttribute("href"), "/login");
    await click();
    await reply(4, Response.json({ error: "credits" }, { status: 402 }));
    assert.equal(container.querySelector("a")!.getAttribute("href"), "/account");
    await click();
    assert.equal(calls[5].signal.aborted, false);
    await act(async () => root.unmount());
    assert.equal(calls[5].signal.aborted, true);
  } finally {
    if (container.childElementCount) await act(async () => root.unmount());
    dom.window.close();
    Object.assign(globalThis, { window: originalWindow, document: originalDocument, IS_REACT_ACT_ENVIRONMENT: false });
  }
});
