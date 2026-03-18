# captcha-counter

Browser extension (Chrome MV3 + Firefox MV3) that counts Cloudflare Turnstile and Google
reCAPTCHA widgets encountered by the user: when seen, clicked, solved, or failed.

## Build

```bash
npm install
npm run build:chrome    # outputs to dist/chrome/
npm run build:firefox   # outputs to dist/firefox/
npm run dev:chrome      # watch mode
npm run dev:firefox     # watch mode
```

Load the unpacked extension from `dist/chrome` or `dist/firefox` in the browser's extension
manager.

## Architecture

```
content script  ──sendMessage──►  background  ──►  chrome.storage.local
                                                           │
popup  ◄──────────────────────────────────────────────────┘
```

- **content script** (`src/content/`): detects CAPTCHA widgets via DOM observation, emits
  events to the background worker.
- **background** (`src/background/`): receives events and persists them to storage.
- **popup** (`src/popup/`): reads storage directly and renders aggregate counters.
- **storage** (`src/storage/`): thin wrapper around `chrome.storage.local`. Events are stored
  as a flat `CaptchaEvent[]` array under the key `captcha_events`.
- **types** (`src/types/`): shared TypeScript types used across all entry points.

No runtime dependencies. Build tools only: vite + vite-plugin-web-extension + typescript.
Using `chrome.*` API directly — no polyfill required (Firefox MV3 supports `chrome.*`).

## Detection strategy

Both CAPTCHA providers render their widgets inside **cross-origin iframes**. We detect them
by watching for iframes whose `src` attribute matches a provider URL pattern — this works
for all rendering modes (see constraints below).

### Why iframe-first, not container-first
Turnstile supports two rendering modes:
- **Implicit**: site places `<div class="cf-turnstile">` and the script finds it
- **Explicit**: site calls `turnstile.render(anyElement, {...})` — no `cf-turnstile` class

Only the iframe URL is a reliable signal across both modes (and Cloudflare's own challenge
pages). Detecting by `div.cf-turnstile` was our original approach and missed explicit renders.

### Cloudflare Turnstile
- **iframe pattern**: `src` contains `challenges.cloudflare.com`
- **Seen**: `IntersectionObserver` on the iframe (threshold 0.1)
- **Clicked**: `focusin` on the iframe element. When the user clicks into a cross-origin
  iframe, the browser transfers focus to the iframe element in the parent document, firing
  a bubbling `focusin` event.
- **Success/failure**: poll `input[name="cf-turnstile-response"]` every 500ms. Token present
  = success, token cleared = failure/expiry.

### Google reCAPTCHA (v2)
- **iframe pattern**: `src` contains (`google.com/recaptcha` or `recaptcha.net`) AND `/anchor`
  — matches only the checkbox widget iframe, not the challenge popup (`/bframe`)
- **Seen**: `IntersectionObserver` on the iframe.
- **Clicked**: same `focusin` approach.
- **Success/failure**: poll `textarea#g-recaptcha-response` every 500ms.
- reCAPTCHA v3 is score-based with no visible widget/iframe — no events fire for it.

### Why polling, not property setter interception
Content scripts run in Chrome's **isolated V8 world**. Each world has its own JavaScript
wrappers around DOM nodes. `Object.defineProperty(element, 'value', ...)` in the content
script world modifies the content script's V8 wrapper for that element. When the CAPTCHA
provider script (running in the page world) sets `element.value = token`, it uses the page
world's wrapper — our setter is never called. Polling reads the underlying DOM state and
works correctly across world boundaries.

## Adding new CAPTCHA types

1. Create `src/content/detectors/<name>.ts` extending `CaptchaDetector`.
2. Implement `captchaType`, `matchesIframe(src)`, and `getResponseValue()`.
3. Add the new type to `CaptchaType` in `src/types/index.ts`.
4. Instantiate and register it in `src/content/index.ts`.
5. Add a label entry in `src/popup/index.ts`.

## Planned features

- CSV export of raw events (button in popup).
- Support for hCaptcha and other providers.
