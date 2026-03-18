// Runs in the page's MAIN JavaScript world (document_start).
// Has access to window.turnstile, window.grecaptcha, etc.
// Cannot use chrome.* APIs — communicates via window.postMessage.
//
// Strategy: poll the official JS APIs (getResponse / getResponse(widgetId)) every 300ms.
// We deliberately avoid Object.defineProperty interception and render() wrapping —
// both have been shown to break widget initialisation. Direct polling is non-invasive
// and is what professional CAPTCHA solver services converge on for reliability.

const MSG_SOURCE = "__captcha_counter";

function relay(captchaType: "turnstile" | "recaptcha", outcome: "success" | "failure"): void {
  window.postMessage({ [MSG_SOURCE]: true, captchaType, outcome }, "*");
}

const prevTokens = new Map<string, string>();

function checkToken(key: string, token: string, captchaType: "turnstile" | "recaptcha"): void {
  const prev = prevTokens.get(key) ?? "";
  if (token === prev) return;
  prevTokens.set(key, token);
  if (token && !prev) relay(captchaType, "success");
  else if (!token && prev) relay(captchaType, "failure");
}

// ── Turnstile ──────────────────────────────────────────────────────────────────
// getResponse() with no argument returns the token of the first (or only) widget.
// Multi-widget pages are rare; this covers the overwhelming majority of cases.

setInterval(() => {
  const ts = (window as unknown as Record<string, unknown>).turnstile as
    | { getResponse(widgetId?: string): string | undefined }
    | undefined;
  if (!ts?.getResponse) return;
  try {
    checkToken("ts", ts.getResponse() ?? "", "turnstile");
  } catch { /* widget not yet ready */ }
}, 300);

// ── reCAPTCHA ──────────────────────────────────────────────────────────────────
// reCAPTCHA assigns sequential integer widget IDs starting at 0.
// We probe IDs 0…N until getResponse() throws (invalid ID), giving us full
// multi-widget coverage without needing to intercept render().

setInterval(() => {
  const gc = (window as unknown as Record<string, unknown>).grecaptcha as
    | { getResponse(widgetId?: number): string | undefined }
    | undefined;
  if (!gc?.getResponse) return;
  for (let id = 0; ; id++) {
    try {
      checkToken(`rc:${id}`, gc.getResponse(id) ?? "", "recaptcha");
    } catch {
      break; // getResponse throws for IDs beyond the last rendered widget
    }
  }
}, 300);
