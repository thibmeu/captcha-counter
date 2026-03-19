// Runs in the page's MAIN JavaScript world (document_start).
// Has access to window.turnstile, window.grecaptcha, etc.
// Cannot use chrome.* APIs — communicates via window.postMessage.
//
// Strategy: poll the official JS APIs (getResponse / getResponse(widgetId)) every 300ms.
// We deliberately avoid Object.defineProperty interception and render() wrapping —
// both have been shown to break widget initialisation. Direct polling is non-invasive
// and is what professional CAPTCHA solver services converge on for reliability.

const MSG_SOURCE = "__captcha_counter";

function relay(captchaType: "turnstile" | "recaptcha" | "hcaptcha", outcome: "success" | "failure"): void {
  window.postMessage({ [MSG_SOURCE]: true, captchaType, outcome }, "*");
}

const prevTokens = new Map<string, string>();

// Pure transition logic — exported for testing.
// Returns the outcome when a token changes, or null if no event should fire.
export function tokenOutcome(prev: string, next: string): "success" | "failure" | null {
  if (next === prev) return null;
  if (next && !prev) return "success";
  if (!next && prev) return "failure";
  return null;
}

function checkToken(key: string, token: string, captchaType: "turnstile" | "recaptcha" | "hcaptcha"): void {
  const prev = prevTokens.get(key) ?? "";
  const outcome = tokenOutcome(prev, token);
  if (outcome === null) return;
  prevTokens.set(key, token);
  relay(captchaType, outcome);
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
  for (let id = 0; id < 100; id++) {
    try {
      checkToken(`rc:${id}`, gc.getResponse(id) ?? "", "recaptcha");
    } catch {
      break; // getResponse throws for IDs beyond the last rendered widget
    }
  }
}, 300);

// ── hCaptcha ────────────────────────────────────────────────────────────────
// hCaptcha doesn't expose sequential integer IDs; getResponse() with no
// argument returns the token for the first (or only) widget.

setInterval(() => {
  const hc = (window as unknown as Record<string, unknown>).hcaptcha as
    | { getResponse(): string | undefined }
    | undefined;
  if (!hc?.getResponse) return;
  try {
    checkToken("hc", hc.getResponse() ?? "", "hcaptcha");
  } catch { /* widget not yet ready */ }
}, 300);
