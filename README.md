# captcha-counter: browser extension to count CAPTCHAs

![License](https://img.shields.io/badge/license-MIT-blue.svg)

Count the CAPTCHAs you solve every day. **captcha-counter** is a browser extension that quietly observes Cloudflare Turnstile, Google reCAPTCHA, and hCaptcha, tracking solved and failed challenges per provider and per site.

All data stays on your device.

## Features

* Detects Cloudflare Turnstile, Google reCAPTCHA, and hCaptcha
* Counts solved and failed challenges
* Breaks down stats by site (top 5)
* Time range filter: today, last 7 days, last 30 days, all time
* Extension icon reacts on each solve or failure
* Export data as CSV
* Reset data from the popup
* No network requests, everything lives in `chrome.storage.local`

## Installation

| Browser | Method |
|:--------|:-------|
| Chrome / Chromium | Load unpacked from `dist/chrome` after building |
| Firefox | Load temporary add-on from `dist/firefox` after building |

```bash
npm install
npm run build:chrome   # or build:firefox
```

Then open `chrome://extensions`, enable Developer mode, and load the `dist/chrome` folder.

## Development

```bash
npm run dev:chrome     # watch mode, rebuilds on change
npm run dev:firefox
npm test               # Vitest unit tests
npm run typecheck      # TypeScript check without emit
```

## How it works

**Iframe detection.** A content script observes the DOM for CAPTCHA iframe URLs. When a matching iframe appears, a `clicked` event is recorded on focus.

**Token polling.** A separate script injected into the page's main world polls `window.turnstile.getResponse()`, `window.grecaptcha.getResponse()`, and `window.hcaptcha.getResponse()` every 300ms. A token appearing means a solve; a token clearing means a failure. This approach is non-invasive and does not interfere with CAPTCHA initialisation.

Events are stored in `chrome.storage.local` as a flat array of `CaptchaEvent` objects.

## Security Considerations

captcha-counter is a passive observer. It does not interact with CAPTCHA widgets beyond reading their public JS APIs. It makes no network requests. All recorded data is local to your browser profile and can be cleared at any time from the popup or the options page.

## License

This project is under the MIT license.

### Contribution

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you shall be MIT licensed as above, without any additional terms or conditions.
