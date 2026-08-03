# Chrome Web Store submission checklist

## Listing

- Product name: **Jiddu — Critical Reading**
- Category: **Productivity**
- Language: **English** as default, with **Português (Brasil)** and **Español** localized listings
- Product URL: `https://jiddu.app/extension`
- Support URL: `https://jiddu.app/contact`
- Privacy policy URL: `https://jiddu.app/extension/privacy`
- Distribution for the first release: **Unlisted**, all regions
- Upload `dist/jiddu-critical-reading-0.1.0.zip`
- Upload `assets/promo-440x280.png`
- Upload the three 1280 × 800 screenshots in numeric order

## Single purpose

> Jiddu lets a user deliberately select a passage on the current webpage and request a fallacy, fact, or bias analysis in a side panel.

## Permission justifications

### `activeTab`

Allows the extension to access the current page only after the user explicitly clicks the Jiddu toolbar icon or invokes its keyboard shortcut. Jiddu does not request access to every visited page.

### `scripting`

Injects the passage-selection interface into the explicitly activated tab. The injected script highlights selectable elements and returns only the passage the user chooses.

### `sidePanel`

Displays settings, progress, and the requested analysis beside the source page. The panel is enabled only for the tab in which the user activated Jiddu.

### `storage`

Stores the Jiddu API key and language preferences locally in the user’s Chrome profile. Temporary per-tab report data, page title, and URL use session storage so the report remains tied to its source tab.

### Host permission: `https://jiddu.app/*`

Sends the deliberately submitted passage over HTTPS to the Jiddu API and retrieves the requested result. The production build has no localhost or third-party host permission.

## Privacy practices form

Disclose the following data handled by the extension, including data that remains local:

- **Authentication information:** personal Jiddu API key, stored locally and sent only to authenticate API requests.
- **Website content:** the deliberately selected passage; transmitted only after an analysis choice and stored in the user’s Jiddu history.
- **Web history / browsing activity:** current page title and URL, used only in temporary Chrome session storage to label and bind the local report; not transmitted to Jiddu.
- **User activity:** explicit extension actions and chosen analysis lens, used to provide the requested feature.

Certify that data is used only for the extension’s user-facing critical-reading function, is not sold, is not used for personalized advertising or credit/lending purposes, and is transferred only as described in the published privacy policy.

## Store declarations

- Remote code: **No**. All executable extension code is packaged in the ZIP.
- Ads: **No**.
- In-app purchases: **No**. API usage can require Jiddu credits managed on the website.
- Mature content: **No**.
- Single purpose: use the statement above.

## Reviewer instructions

1. Install the uploaded package.
2. Open the onboarding page and enter the dedicated reviewer API key supplied privately in the dashboard’s test instructions. Never include that key in the ZIP or repository.
3. Open a regular HTTP or HTTPS article page. Chrome internal pages cannot be scripted.
4. Click the Jiddu toolbar icon, select a readable passage, and choose Fallacies, Facts, or Bias.
5. Confirm that the side panel opens on that tab and displays the result.
6. Open Settings in the side panel to change interface and explanation languages.
7. Use Print report after an analysis completes; Chrome opens a temporary print tab and closes it after print or cancel.

## Before clicking “Submit for review”

- Deploy `/extension` and `/extension/privacy` publicly.
- Replace `NEXT_PUBLIC_CHROME_WEB_STORE_URL` with the listing URL once Google assigns it.
- Test the production unpacked directory in a clean Chrome profile.
- Confirm the ZIP contains `manifest.json` at its root.
- Confirm there are no `localhost` or `127.0.0.1` strings in the production directory or ZIP.
- Revoke the dedicated reviewer key after the review is complete.
