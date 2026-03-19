# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-19

### Added

- Detect and count Cloudflare Turnstile, Google reCAPTCHA, and hCaptcha challenges
- Track solved and failed challenges per provider
- Break down stats by site (top 5) with time range filter: today, last 7 days, last 30 days, all time
- Extension icon reacts on each solve (green) or failure (red), reverting to idle after 3 seconds
- Export recorded events as CSV
- Reset all data from the popup
- Options page for data management
- All data stored locally in `chrome.storage.local` — no network requests
- Chrome (MV3) and Firefox (MV3) support

[0.1.0]: https://github.com/thibmeu/captcha-counter/releases/tag/v0.1.0
