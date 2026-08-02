# Jiddu Chrome Extension

Manifest V3 extension for analyzing a selected block on any web page with the
Jiddu REST API. The extension supports the fallacy, fact-check and neutrality
lenses, displays results in Chrome's side panel and can print a completed
report.

## Load the unpacked extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this directory: `packages/jiddu-chrome-extension`.
5. Pin the Jiddu extension to the toolbar.

Click the toolbar icon, hover a readable block, click it and choose a lens. The
first analysis opens the side panel, where the extension asks for a Jiddu API
key generated from the API keys tab in the user's account.

The extension uses `activeTab`: it can inspect a page only after an explicit
toolbar click or keyboard shortcut. The selected text is sent only after the
user chooses a lens.

## Local development

The settings dialog can point the extension to either production or a local
Jiddu server:

- `https://jiddu.app`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

The API key must belong to the selected environment. After changing extension
files, use the reload button on `chrome://extensions` and refresh the page being
tested.

Run the pure API/chunking tests with:

```bash
npm test --prefix packages/jiddu-chrome-extension
```

## Architecture

- `content-script.js` and `content-style.css`: inspect-mode overlay and lens picker.
- `service-worker.js`: API key isolation, API calls, chunking and per-tab state.
- `sidepanel.*`: settings, loading states and structured results.
- `lib/api.js`: API contract, safe chunking and result aggregation.

No runtime dependencies or build step are required.
