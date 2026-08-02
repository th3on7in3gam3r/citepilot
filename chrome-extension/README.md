# CitePilot Chrome Extension

Lightweight MV3 extension that shows whether the site you're visiting is cited in AI search (ChatGPT, Perplexity, and more).

## Install (development)

1. Open Chrome → **Extensions** → enable **Developer mode**
2. Click **Load unpacked**
3. Select this `chrome-extension/` folder
4. Pin **CitePilot — GEO Citation Checker** to your toolbar

## Install (production)

Submit `citepilot-extension.zip` to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole).

```bash
# From repo root
zip -r citepilot-extension.zip chrome-extension/ -x "*.DS_Store"
```

Set `NEXT_PUBLIC_CHROME_WEB_STORE_URL` in Vercel after the listing is approved so the marketing page CTA links to the live store entry.

## How it works

- **Background worker** reads the active tab domain, calls `GET /api/widget/score/:domain?format=json&platforms=4`, and caches results for 1 hour.
- **Badge** shows a green dot when citation data exists; gray when no audit is on file.
- **Popup** shows platform grid, citation score, and CTAs to full audit or workspace.
- **Auth passthrough**: if the user is signed into [getcitepilot.com](https://getcitepilot.com), session cookies are forwarded to `GET /api/extension/context?domain=…` to show tracked prompts.

## Local API testing

To point the extension at a local Next.js dev server:

1. Open the extension's **service worker** console (chrome://extensions → Details → Service worker)
2. Run:

```js
chrome.storage.local.set({ citepilot_api_origin: "http://localhost:3000" });
```

Reload the extension. `manifest.json` already includes `http://localhost:3000/*` in `host_permissions`.

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Read the current tab URL domain |
| `tabs` | Update badge when switching tabs |
| `storage` | Cache citation results (1h TTL) |
| `cookies` | Forward CitePilot session for logged-in workspace data |
| `host_permissions` | Call CitePilot widget + extension APIs |

## Chrome Web Store checklist

- [ ] Privacy policy URL: `https://getcitepilot.com/privacy`
- [ ] Screenshots: capture from `/chrome-extension` marketing page mock + live popup
- [ ] Single purpose: GEO citation visibility for current site
- [ ] Upload `citepilot-extension.zip`
